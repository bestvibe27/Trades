import React, { useState, useEffect } from "react";
import Layout from "../components/common/Layout";
import { get } from "../services/api";
import tradingAPI from "../services/tradingAPI";
import { usePolling } from "../hooks/usePolling";
import { TRADING_SYMBOLS } from "../utils/constants";
import styles from "../styles/Trading.module.css";
import { PriceInput, InputMode } from "../components/trading/PriceInput";
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
  const [qVolume, setQVolume] = useState<number>(0.1);
  const [qTpMode, setQTpMode] = useState<InputMode>("price");
  const [qTpValue, setQTpValue] = useState<number>(0);
  const [qSlMode, setQSlMode] = useState<InputMode>("pips");
  const [qSlValue, setQSlValue] = useState<number>(50);
  const [qQuote, setQQuote] = useState<{
    last: number;
    bid: number;
    ask: number;
  } | null>(null);
  const [qSide, setQSide] = useState<"buy" | "sell">("buy");
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
        // Snap volume to broker step and min
        const min = info.volume_min ?? 0.01;
        const step = info.volume_step ?? 0.01;
        const max = info.volume_max ?? 100.0;
        const vol = isFinite(qVolume) ? qVolume : min;
        const snapped = Math.max(
          min,
          Math.min(max, Math.floor(vol / step) * step),
        );
        if (snapped !== qVolume && !Number.isNaN(snapped))
          setQVolume(Number(snapped.toFixed(2)));
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

  const submitMarketOrder = async (side: "buy" | "sell") => {
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

      // Validate/snap volume
      const min = symInfo?.volume_min ?? 0.01;
      const step = symInfo?.volume_step ?? 0.01;
      const max = symInfo?.volume_max ?? 100.0;
      const vol = isFinite(qVolume) ? qVolume : min;
      const snapped = Math.max(
        min,
        Math.min(max, Math.floor(vol / step) * step),
      );
      if (snapped !== qVolume) setQVolume(Number(snapped.toFixed(2)));

      // Calculate TP/SL prices based on mode
      const entryPrice = side === "buy" ? qQuote.ask : qQuote.bid;
      const equity = account?.equity ?? 0;
      
      let tpPrice: number | undefined;
      let slPrice: number | undefined;

      if (qTpValue && isFinite(qTpValue) && qTpValue > 0) {
        tpPrice = calculateTpSlPrice(qTpMode, qTpValue, entryPrice, snapped, qSymbol, equity, side);
      }
      
      if (qSlValue && isFinite(qSlValue) && qSlValue > 0) {
        slPrice = calculateTpSlPrice(qSlMode, qSlValue, entryPrice, snapped, qSymbol, equity, side);
      }

      // Execute the trade
      const res = await tradingAPI.placeBrokerMarketOrder({
        symbol: qSymbol,
        side,
        volume: snapped,
        sl: slPrice,
        tp: tpPrice,
        comment: `Manual ${side.toUpperCase()} order from UI`,
      });

      // Check if trade was successful
      if (res.success) {
        // Show success message
        setUiError(
          `✅ Trade executed successfully! ${side.toUpperCase()} ${snapped} lots of ${qSymbol} at ${res.price?.toFixed(5) || "market price"}`,
        );

        // Refresh data to show the new trade
        await Promise.all([
          fetchData(),
          fetchQuote(qSymbol),
          fetchAccount(),
          fetchPositions(),
        ]);

        // Clear success message after 5 seconds
        setTimeout(() => setUiError(""), 5000);
      } else {
        setUiError(`❌ Trade failed: ${res.error || "Unknown error"}`);
      }

      return res;
    } catch (e) {
      setUiError(`❌ Error placing order: ${String(e)}`);
    } finally {
      setSubmitting(false);
    }
  };

  const fetchAccount = async () => {
    try {
      const acc = await tradingAPI.getBrokerAccount();
      setAccount(acc);
    } catch {}
  };

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

          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>Quick Market Order</h2>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="t-symbol">Symbol</label>
                <select
                  id="t-symbol"
                  className="input"
                  value={qSymbol}
                  onChange={(e) => {
                    const v = e.target.value;
                    setQSymbol(v);
                    fetchQuote(v);
                    fetchSymbolInfo(v);
                  }}
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
              <div className={styles.field}>
                <label className={styles.label} htmlFor="t-volume">Volume (lots)</label>
                <input
                  id="t-volume"
                  className="input"
                  type="number"
                  step={(symInfo?.volume_step ?? 0.01).toString()}
                  min={(symInfo?.volume_min ?? 0.01).toString()}
                  value={qVolume}
                  onChange={(e) => setQVolume(parseFloat(e.target.value))}
                />
              </div>
            </div>

            <div className={styles.sideToggle}>
              <label className={`${styles.sideOption} ${qSide === "buy" ? styles.sideBuyActive : ""}`}>
                <input type="radio" value="buy" checked={qSide === "buy"} onChange={() => setQSide("buy")} />
                Buy
              </label>
              <label className={`${styles.sideOption} ${qSide === "sell" ? styles.sideSellActive : ""}`}>
                <input type="radio" value="sell" checked={qSide === "sell"} onChange={() => setQSide("sell")} />
                Sell
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <PriceInput
                label="TAKE PROFIT"
                mode={qTpMode}
                value={qTpValue}
                onChange={setQTpValue}
                onModeChange={setQTpMode}
                entryPrice={qSide === "buy" ? qQuote?.ask ?? 0 : qQuote?.bid ?? 0}
                volume={qVolume}
                symbol={qSymbol}
                equity={account?.equity ?? 0}
                side={qSide}
                disabled={orderDisabled}
              />
              <PriceInput
                label="STOP LOSS"
                mode={qSlMode}
                value={qSlValue}
                onChange={setQSlValue}
                onModeChange={setQSlMode}
                entryPrice={qSide === "buy" ? qQuote?.ask ?? 0 : qQuote?.bid ?? 0}
                volume={qVolume}
                symbol={qSymbol}
                equity={account?.equity ?? 0}
                side={qSide}
                disabled={orderDisabled}
              />
            </div>

            <div className={styles.submitRow}>
              <button
                className="btn btn-success"
                disabled={orderDisabled}
                onClick={() => submitMarketOrder("buy")}
              >
                {submitting ? "Placing…" : "Buy"}
              </button>
              <button
                className="btn btn-danger"
                disabled={orderDisabled}
                onClick={() => submitMarketOrder("sell")}
              >
                {submitting ? "Placing…" : "Sell"}
              </button>
            </div>
            {uiError ? (
              <div className={`${styles.alert} ${isSuccess ? styles.alertSuccess : styles.alertError}`}>
                {uiError}
              </div>
            ) : null}
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
