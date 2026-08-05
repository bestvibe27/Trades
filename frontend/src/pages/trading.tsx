import React, { useState, useEffect, useMemo } from "react";
import Layout from "../components/common/Layout";
import tradingAPI from "../services/tradingAPI";
import { usePolling } from "../hooks/usePolling";
import { useChartData } from "../hooks/useChartData";
import { TRADING_SYMBOLS } from "../utils/constants";
import styles from "../styles/Trading.module.css";
import QuickMarketWidget from "../components/trading/QuickMarketWidget";
import InteractiveTradingChart from "../components/charts/InteractiveTradingChart";
import type { ChartPositionOverlay } from "../components/charts/InteractiveTradingChart";

interface Position {
  symbol: string;
  side: "buy" | "sell" | "other";
  volume: number;
  price_open: number;
  price_current: number;
  tp: number;
  sl: number;
  ticket: number | null;
  time: string | null;
  swap: number;
  profit: number;
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
  const [mt5Connected, setMt5Connected] = useState<boolean>(false);
  const [mt5Account, setMt5Account] = useState<any>(null);
  const [mt5Error, setMt5Error] = useState<string>("");
  const [qSymbol, setQSymbol] = useState<string>("BTCUSDm");
  const [chartTf, setChartTf] = useState<string>("1m");
  const [qQuote, setQQuote] = useState<{
    last: number;
    bid: number;
    ask: number;
  } | null>(null);
  const [account, setAccount] = useState<{
    balance: number;
    equity: number;
    free_margin: number;
    leverage?: number;
  } | null>(null);
  const [symbols, setSymbols] = useState<string[]>([]);
  const [symInfo, setSymInfo] = useState<any>(null);

  const {
    candles: chartCandles,
    quote: chartQuote,
    loading: chartLoading,
    error: chartError,
    loadMoreHistory,
    wsStatus,
    rawPayload,
  } = useChartData(qSymbol, chartTf, { limit: 250, pollMs: 15000 });

  const chartPositions: ChartPositionOverlay[] = useMemo(
    () =>
      positions
        .filter((p) => p.symbol === qSymbol && (p.side === "buy" || p.side === "sell"))
        .map((p) => ({
          side: p.side as "buy" | "sell",
          price_open: p.price_open,
          tp: p.tp || undefined,
          sl: p.sl || undefined,
          price_current: p.price_current,
        })),
    [positions, qSymbol]
  );

  // Prefer live SSE/chart stream; fall back to page poll for Quick Market
  const liveQuote = chartQuote ?? qQuote;

  // Keep Quick Market ticket in sync with chart stream
  useEffect(() => {
    if (chartQuote) setQQuote(chartQuote);
  }, [chartQuote]);

  useEffect(() => {
    fetchData();
    fetchBrokerStatus();
    fetchQuote(qSymbol);
    fetchAccount();
    fetchSymbols().then((loaded) => {
      setTimeout(() => {
        const commons = [
          "BTCUSDm",
          "EURUSDm",
          "XAUUSDm",
          "USDJPYm",
          "GBPUSDm",
          "AAPLm",
        ];
        const list = loaded.length ? loaded : symbols;
        if (!list.includes(qSymbol)) {
          const pick = commons.find((c) => list.includes(c));
          if (pick) {
            setQSymbol(pick);
            fetchQuote(pick);
            fetchSymbolInfo(pick);
          }
        }
      }, 0);
    });
    fetchSymbolInfo(qSymbol);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  usePolling(() => fetchAccount(), 10000, false);
  usePolling(() => fetchQuote(qSymbol), 2000, false);
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
          const raw =
            typeof p.side === "string" ? p.side.trim().toLowerCase() : "other";
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
        return bt - at;
      });

      setPositions(list);
    } catch {}
  };

  const fetchTrades = async () => {
    try {
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
    } catch (e) {
      setQQuote(null);
    }
  };

  const fetchAccount = async () => {
    try {
      const acc = await tradingAPI.getBrokerAccount();
      setAccount(acc);
    } catch {}
  };

  const handleSymbolChange = (v: string) => {
    setQSymbol(v);
    fetchQuote(v);
    fetchSymbolInfo(v);
  };

  const handleOrderSuccess = async () => {
    await Promise.all([
      fetchData(),
      fetchQuote(qSymbol),
      fetchAccount(),
      fetchPositions(),
    ]);
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

  return (
    <Layout title="Trading - TradeDesk">
      <div className={`${styles.page} fade-in`}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Trading</h1>
            <p className={styles.subtitle}>
              Place orders and monitor your live positions
            </p>
          </div>
        </div>

        <div className={styles.workspaceGrid}>
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

          <div className={`${styles.panel} ${styles.quickMarketPanel}`}>
            <h2 className={styles.panelTitle}>Quick Market</h2>
            <QuickMarketWidget
              symbol={qSymbol}
              symbols={symbols}
              symbolsByGroup={TRADING_SYMBOLS}
              quote={liveQuote}
              symInfo={symInfo}
              account={account}
              connected={mt5Connected}
              onSymbolChange={handleSymbolChange}
              onOrderSuccess={handleOrderSuccess}
            />
          </div>

          <div className={styles.chartSlot}>
            <InteractiveTradingChart
              symbol={qSymbol}
              symbolLabel={qSymbol}
              candles={chartCandles}
              quote={liveQuote}
              timeframe={chartTf}
              onTimeframeChange={(_minutes, label) => setChartTf(label)}
              positions={chartPositions}
              loading={chartLoading}
              error={chartError}
              onLoadMoreHistory={loadMoreHistory}
              height={420}
              wsStatus={wsStatus}
              rawPayload={rawPayload}
            />
          </div>
        </div>

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
