import React, { useState, useEffect, useCallback } from "react";
import Layout from "../components/common/Layout";
import { get } from "../services/api";
import tradingAPI from "../services/tradingAPI";
import { usePolling } from "../hooks/usePolling";
import { TRADING_SYMBOLS } from "../utils/constants";
import styles from "../styles/Trading.module.css";
import { OrderEntryPanel } from "../components/trading/OrderEntryPanel";
import { OrderEntryState, InstrumentConfig } from "@/types/trading";
import { calculateTpSlPrice } from "../utils/calculations";

interface Position {
  symbol: string;
  side: "buy" | "sell" | "other";
  volume: number; // lots
  price_open: number;
  price_current: number;
  tp: number;
  sl: number;
  ticket: number | null;
  time: string | null; // ISO
  swap: number;
  profit: number; // P/L USD
}

interface Order {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
  status: string;
  createdAt: string;
  profitLoss?: number;
  commission?: number;
  source?: string;
}

const TradingPage: React.FC = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // MT5 broker state
  const [mt5Connected, setMt5Connected] = useState<boolean>(false);
  const [mt5Account, setMt5Account] = useState<any>(null);
  const [mt5Error, setMt5Error] = useState<string>("");
  const [qSymbol, setQSymbol] = useState<string>("EURUSDm");
  const [qQuote, setQQuote] = useState<{
    last: number;
    bid: number;
    ask: number;
  } | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [account, setAccount] = useState<{
    balance: number;
    equity: number;
    free_margin: number;
  } | null>(null);
  const [symbols, setSymbols] = useState<string[]>([]);
  const [symInfo, setSymInfo] = useState<{
    digits?: number;
    volume_min?: number;
    volume_step?: number;
    volume_max?: number;
  } | null>(null);
  const [uiError, setUiError] = useState<string>("");

  // OrderEntryPanel state
  const [orderState, setOrderState] = useState<OrderEntryState>({
    symbol: "EURUSDm",
    side: "buy",
    volume: 0.1,
    volumeMode: "lots",
    riskAmount: 100,
    riskSlLevel: 50,
    takeProfit: {
      enabled: false,
      mode: "pips",
      canonicalPrice: 0,
      displayValues: { price: 0, pips: 0, money: 0, percent: 0 },
    },
    stopLoss: {
      enabled: false,
      mode: "pips",
      canonicalPrice: 0,
      displayValues: { price: 0, pips: 0, money: 0, percent: 0 },
    },
    errors: {},
  });

  const [instrumentConfig, setInstrumentConfig] = useState<InstrumentConfig>({
    symbol: "EURUSDm",
    minLot: 0.01,
    maxLot: 100,
    stepLot: 0.01,
    pipSize: 0.0001,
    contractSize: 100000,
    stopLevelPips: 20,
    marginRequirement: 1,
    isJpyPair: false,
  });

  const [marginRequired, setMarginRequired] = useState<number>(0);

  useEffect(() => {
    fetchData();
    fetchBrokerStatus();
    fetchQuote(qSymbol);
    fetchAccount();
    fetchSymbols().then(() => {
      // If default symbol not present, try a common fallback among loaded symbols
      setTimeout(() => {
        const commons = [
          "EURUSDm",
          "XAUUSDm",
          "USDJPYm",
          "GBPUSDm",
          "BTCUSDm",
          "AAPLm",
        ];
        if (!symbols.includes(qSymbol)) {
          const pick = commons.find((c) => symbols.includes(c));
          if (pick) {
            setQSymbol(pick);
            fetchQuote(pick);
            fetchSymbolInfo(pick);
          }
        }
      }, 0);
    });
    fetchSymbolInfo(qSymbol);
  }, []);

  // Poll account and quote every 10s
  usePolling(() => fetchAccount(), 10000, false);
  usePolling(() => fetchQuote(qSymbol), 10000, false);
  usePolling(() => fetchPositions(), 5000, false);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchPositions(), fetchTrades()]);
    } catch (err) {
      setError("Failed to fetch trading data");
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPositions = async () => {
    try {
      const res = await tradingAPI.getBrokerPositions();

      const list: Position[] = (res.positions || []).map((p: any) => ({
        symbol: p.symbol,
        side: (() => {
          const raw = typeof p.side === "string" ? p.side.trim().toLowerCase() : "other";
          return raw === "buy" || raw === "sell" ? raw : "other";
        })(),
        volume: Number(p.volume ?? 0),
        price_open: Number(p.price_open ?? 0),
        price_current: Number(p.price_current ?? 0),
        tp: Number(p.tp ?? 0),
        sl: Number(p.sl ?? 0),
        ticket: p.ticket ?? null,
        time: p.time ?? null,
        swap: Number(p.swap ?? 0),
        profit: Number(p.profit ?? 0),
      }));
      list.sort((a: any, b: any) => {
        const at = a.time ? new Date(a.time).getTime() : 0;

        const bt = b.time ? new Date(b.time).getTime() : 0;

        return bt - at; // newest first
      });

      setPositions(list);
    } catch {}
  };

  const fetchTrades = async () => {
    try {
      // Try to get enhanced database trades first, fallback to broker trades
      try {
        const res = await tradingAPI.getBrokerDatabaseTrades(20);
        const mapped: Order[] = (res.trades || []).map((d: any) => ({
          id: String(d.trade_id ?? ""),
          symbol: d.symbol,
          side: (d.side || "").toLowerCase() === "buy" ? "buy" : "sell",
          quantity: Number(d.volume || 0),
          price: Number(d.execution_price || d.open_price || 0),
          status: d.status?.toLowerCase() || "filled",
          createdAt:
            d.execution_time || d.open_time || new Date().toISOString(),
          profitLoss: d.profit_loss != null ? Number(d.profit_loss) : undefined,
          commission: d.commission != null ? Number(d.commission) : undefined,
          source: d.source,
        }));
        setOrders(mapped);
      } catch {
        // Fallback to broker trades
        const res = await tradingAPI.getBrokerTrades(20);
        const mapped: Order[] = (res.trades || []).map((d: any) => ({
          id: String(d.id ?? ""),
          symbol: d.symbol,
          side: (d.side || "").toLowerCase() === "buy" ? "buy" : "sell",
          quantity: Number(d.volume || 0),
          price: Number(d.price || 0),
          status: "filled",
          createdAt: d.time || new Date().toISOString(),
        }));
        setOrders(mapped);
      }
    } catch {}
  };

  const fetchSymbols = async () => {
    try {
      const res = await tradingAPI.getBrokerSymbols();
      setSymbols(res.symbols || []);
      return res.symbols || [];
    } catch {
      return [];
    }
  };

  const fetchSymbolInfo = async (symbol: string) => {
    try {
      const info = await tradingAPI.getBrokerSymbolInfo(symbol);
      if (info && info.found) {
        setSymInfo(info);
        
        // Update instrument config for OrderEntryPanel
        const min = info.volume_min ?? 0.01;
        const step = info.volume_step ?? 0.01;
        const max = info.volume_max ?? 100.0;
        const digits = info.digits ?? 5;
        const isJpyPair = symbol.includes("JPY");
        const pipSize = Math.pow(10, -digits);
        
        setInstrumentConfig({
          symbol,
          minLot: min,
          maxLot: max,
          stepLot: step,
          pipSize,
          contractSize: 100000, // Standard Forex lot
          stopLevelPips: 20, // Default stop level
          marginRequirement: 1,
          isJpyPair,
        });
        
        // Snap volume to broker step and min
        const vol = isFinite(orderState.volume) ? orderState.volume : min;
        const snapped = Math.max(
          min,
          Math.min(max, Math.floor(vol / step) * step),
        );
        if (snapped !== orderState.volume && !Number.isNaN(snapped))
          setOrderState(prev => ({ ...prev, volume: Number(snapped.toFixed(2)) }));
      }
    } catch {}
  };

  const fetchBrokerStatus = async () => {
    try {
      const s = await tradingAPI.getBrokerStatus();
      setMt5Connected(!!s.connected);
      setMt5Account(s.account || null);
      setMt5Error(s.last_error || "");
    } catch (e) {
      setMt5Connected(false);
      setMt5Account(null);
      setMt5Error("Unable to reach broker");
    }
  };

  const fetchQuote = async (symbol: string) => {
    try {
      const q = await tradingAPI.getBrokerQuote(symbol);
      setQQuote({ last: q.last, bid: q.bid, ask: q.ask });
      setUiError("");
    } catch (e) {
      setQQuote(null);
      setUiError("Quote unavailable for this symbol");
    }
  };

  const fetchAccount = async () => {
    try {
      const acc = await tradingAPI.getBrokerAccount();
      setAccount(acc);
    } catch {}
  };

  // OrderEntryPanel handlers
  const handleOrderStateChange = useCallback(
    (updates: Partial<OrderEntryState>) => {
      setOrderState(prev => ({ ...prev, ...updates }));
    },
    []
  );

  const handleOrderSubmit = useCallback(
    async (order: {
      symbol: string;
      side: 'buy' | 'sell';
      volume: number;
      takeProfit?: number;
      stopLoss?: number;
    }) => {
      try {
        setSubmitting(true);
        setUiError("");

        // Validate quote
        if (
          !qQuote ||
          !isFinite(qQuote.bid) ||
          !isFinite(qQuote.ask) ||
          qQuote.bid <= 0 ||
          qQuote.ask <= 0
        ) {
          setUiError(
            "Cannot place order: quote is unavailable or zero. Check symbol.",
          );
          return;
        }

        // Prepare order object for API
        const res = await tradingAPI.placeBrokerMarketOrder({
          symbol: order.symbol,
          side: order.side,
          volume: order.volume,
          tp: order.takeProfit,
          sl: order.stopLoss,
          comment: `Manual ${order.side.toUpperCase()} order from UI`,
        });

        if (res.success) {
          // Snap volume for display
          const min = symInfo?.volume_min ?? 0.01;
          const step = symInfo?.volume_step ?? 0.01;
          const max = symInfo?.volume_max ?? 100.0;
          const snapped = Math.max(
            min,
            Math.min(max, Math.floor(order.volume / step) * step),
          );

          setUiError(
            `✅ Trade executed successfully! ${order.side.toUpperCase()} ${snapped} lots of ${order.symbol} at ${res.price?.toFixed(5) || "market price"}`,
          );

          // Refresh data to show the new trade
          await Promise.all([
            fetchData(),
            fetchQuote(order.symbol),
            fetchAccount(),
            fetchPositions(),
          ]);

          // Clear success message after 5 seconds
          setTimeout(() => setUiError(""), 5000);
          
          // Reset order state
          setOrderState(prev => ({
            ...prev,
            volume: instrumentConfig.minLot,
            takeProfit: { ...prev.takeProfit, enabled: false },
            stopLoss: { ...prev.stopLoss, enabled: false },
            errors: {},
          }));
        } else {
          setUiError(`❌ Trade failed: ${res.error || "Unknown error"}`);
        }

        return res;
      } catch (e) {
        setUiError(`❌ Error placing order: ${String(e)}`);
      } finally {
        setSubmitting(false);
      }
    },
    [qQuote, symInfo, instrumentConfig.minLot, qSymbol]
  );

  if (loading) {
    return (
      <Layout title="Trading - TradeDesk">
        <div className={styles.page}>
          <div className={styles.cards}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`skeleton ${styles.skelRow}`} />
            ))}
          </div>
          <div className={`skeleton ${styles.skelRow}`} style={{ height: 240 }} />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Trading - TradeDesk">
        <div className={styles.page}>
          <div className={styles.alert + " " + styles.alertError}>{error}</div>
        </div>
      </Layout>
    );
  }

  const isSuccess = uiError.startsWith("✅");
  const orderDisabled =
    submitting || !mt5Connected || !qQuote || qQuote.bid <= 0 || qQuote.ask <= 0;

  return (
    <Layout title="Trading - TradeDesk">
      <div className={`${styles.page} fade-in`}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Trading</h1>
            <p className={styles.subtitle}>
              Place orders and monitor your live positions
            </p>
          </div>
        </div>

        {/* MT5 Status + Order Ticket */}
        <div className={styles.topGrid}>
          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>Broker Connection</h2>
            <div className={styles.statusRow}>
              <span
                className={`${styles.statusBadge} ${mt5Connected ? styles.statusOk : styles.statusOff}`}
              >
                <span className={styles.statusDot} />
                {mt5Connected ? "Connected" : "Disconnected"}
              </span>
            </div>
            <div className={styles.metaList}>
              {mt5Account ? (
                <>
                  <div className={styles.metaRow}>
                    <span>Login</span>
                    <b>{mt5Account.login}</b>
                  </div>
                  <div className={styles.metaRow}>
                    <span>Server</span>
                    <b>{mt5Account.server}</b>
                  </div>
                </>
              ) : (
                <div>{mt5Error || "No account info"}</div>
              )}
            </div>
            <div className={styles.btnRow}>
              <button className="btn" onClick={fetchBrokerStatus}>
                Refresh
              </button>
              <button className="btn" onClick={() => fetchQuote(qSymbol)}>
                Refresh Quote
              </button>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", minHeight: "auto" }}>
            <div>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
                  Select Symbol
                </label>
                <select
                  className="input"
                  value={qSymbol}
                  onChange={(e) => {
                    const v = e.target.value;
                    setQSymbol(v);
                    setOrderState(prev => ({ ...prev, symbol: v }));
                    fetchQuote(v);
                    fetchSymbolInfo(v);
                  }}
                  style={{ width: "100%" }}
                >
                  <optgroup label="Forex">
                    {TRADING_SYMBOLS.FOREX.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Commodities">
                    {TRADING_SYMBOLS.COMMODITIES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Indices">
                    {TRADING_SYMBOLS.INDICES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Crypto">
                    {TRADING_SYMBOLS.CRYPTO.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Stocks">
                    {TRADING_SYMBOLS.STOCKS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <OrderEntryPanel
                state={orderState}
                config={instrumentConfig}
                currentPrice={orderState.side === "buy" ? qQuote?.ask ?? 0 : qQuote?.bid ?? 0}
                equity={account?.equity ?? 0}
                marginRequired={marginRequired}
                isLoading={false}
                isSubmitting={submitting}
                onStateChange={handleOrderStateChange}
                onSubmit={handleOrderSubmit}
                disabled={orderDisabled}
              />
              
              {uiError ? (
                <div style={{ marginTop: "1rem" }} className={`${styles.alert} ${uiError.startsWith("✅") ? styles.alertSuccess : styles.alertError}`}>
                  {uiError}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Overview cards */}
        <div className={styles.cards}>
          <div className={styles.card}>
            <div className={styles.cardLabel}>Open Positions</div>
            <div className={styles.cardValue}>{positions.length}</div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardLabel}>Total Trades</div>
            <div className={styles.cardValue}>{orders.length}</div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardLabel}>Equity</div>
            <div className={styles.cardValue}>
              ${(account?.equity ?? 0).toFixed(2)}
            </div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardLabel}>Balance / Free Margin</div>
            <div className={styles.cardValue}>
              ${(account?.balance ?? 0).toFixed(2)} / $
              {(account?.free_margin ?? 0).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Open Positions table (MT5) */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Open Positions</h2>
          </div>
          {positions.length === 0 ? (
            <div className={styles.empty}>No open positions yet</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Type</th>
                    <th>Volume (Lot)</th>
                    <th>Open Price</th>
                    <th>Current Price</th>
                    <th>T/P</th>
                    <th>S/L</th>
                    <th>Position ID</th>
                    <th>Open Time</th>
                    <th>Swap (USD)</th>
                    <th>P/L (USD)</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((p, index) => (
                    <tr key={p.ticket ?? index}>
                      <td>{p.symbol}</td>
                      <td className={p.side === "buy" ? "pl" : "nl"}>
                        {p.side?.toUpperCase()}
                      </td>
                      <td>{p.volume.toFixed(2)}</td>
                      <td>{p.price_open.toFixed(5)}</td>
                      <td>{p.price_current.toFixed(5)}</td>
                      <td>{p.tp ? p.tp.toFixed(5) : "-"}</td>
                      <td>{p.sl ? p.sl.toFixed(5) : "-"}</td>
                      <td>{p.ticket ?? "-"}</td>
                      <td>
                        {p.time ? new Date(p.time).toLocaleString() : "-"}
                      </td>
                      <td>{p.swap?.toFixed(2)}</td>
                      <td className={p.profit >= 0 ? "pl" : "nl"}>
                        {p.profit >= 0 ? "+" : ""}
                        {p.profit.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Recent Trades table */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Recent Trades</h2>
          </div>
          {orders.length === 0 ? (
            <div className={styles.empty}>No recent trades</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Trade ID</th>
                    <th>Symbol</th>
                    <th>Side</th>
                    <th>Volume</th>
                    <th>Price</th>
                    <th>P/L</th>
                    <th>Commission</th>
                    <th>Status</th>
                    <th>Source</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 10).map((order) => (
                    <tr key={order.id}>
                      <td>#{order.id}</td>
                      <td>{order.symbol}</td>
                      <td>
                        <span
                          className={`${styles.badge} ${order.side === "buy" ? styles.badgeBuy : styles.badgeSell}`}
                        >
                          {order.side.toUpperCase()}
                        </span>
                      </td>
                      <td>{order.quantity.toFixed(2)}</td>
                      <td>{order.price.toFixed(5)}</td>
                      <td
                        className={
                          typeof order.profitLoss === "number"
                            ? order.profitLoss >= 0
                              ? "pl"
                              : "nl"
                            : ""
                        }
                      >
                        {typeof order.profitLoss === "number"
                          ? (order.profitLoss >= 0 ? "+" : "") +
                            order.profitLoss.toFixed(2)
                          : "-"}
                      </td>
                      <td>
                        {typeof order.commission === "number"
                          ? order.commission.toFixed(2)
                          : "0.00"}
                      </td>
                      <td>
                        <span
                          className={`${styles.badge} ${
                            order.status === "open"
                              ? styles.badgeOpen
                              : order.status === "closed"
                                ? styles.badgeClosed
                                : order.status === "cancelled"
                                  ? styles.badgeCancelled
                                  : styles.badgePending
                          }`}
                        >
                          {order.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span
                          className={styles.badge}
                          style={{
                            backgroundColor:
                              order.source === "MANUAL"
                                ? "#4CAF50"
                                : order.source === "AI"
                                  ? "#2196F3"
                                  : order.source === "SIGNAL"
                                    ? "#FF9800"
                                    : "#9E9E9E",
                          }}
                        >
                          {order.source || "UNKNOWN"}
                        </span>
                      </td>
                      <td>{new Date(order.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
};

export default TradingPage;
