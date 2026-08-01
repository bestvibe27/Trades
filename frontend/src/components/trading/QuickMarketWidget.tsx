import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "../../styles/QuickMarketWidget.module.css";
import tradingAPI from "../../services/tradingAPI";
import {
  computePriceDelta,
  formatDeltaParts,
  formatPrice,
  OrderSide,
  OrderType,
  pressureFromTicks,
  shortSymbolLabel,
  snapVolume,
  SymbolLotConstraints,
  symbolIconLetter,
  validatePendingPrice,
  validateStopDistance,
  getPipSize,
} from "../../utils/orderTicket";

export interface QuickMarketQuote {
  last: number;
  bid: number;
  ask: number;
}

export interface QuickMarketSymbolInfo extends SymbolLotConstraints {
  found?: boolean;
  digits?: number;
  point?: number;
  contract_size?: number;
  trade_stops_level?: number;
  swap_long?: number;
  swap_short?: number;
  trade_tick_size?: number;
}

export interface QuickMarketPreview {
  fees: number;
  margin: number;
  leverage: number;
  contract_size: number;
  swap_long: number;
  swap_short: number;
  currency?: string;
}

export interface QuickMarketWidgetProps {
  symbol: string;
  symbols: string[];
  symbolsByGroup?: Record<string, readonly string[] | string[]>;
  quote: QuickMarketQuote | null;
  symInfo: QuickMarketSymbolInfo | null;
  connected: boolean;
  onSymbolChange: (symbol: string) => void;
  onOrderSuccess?: () => void | Promise<void>;
  onClose?: () => void;
}

function DeltaRow({
  value,
  entry,
  volume,
  side,
  pipSize,
  contractSize,
}: {
  value: number | null;
  entry: number;
  volume: number;
  side: OrderSide;
  pipSize: number;
  contractSize: number;
}) {
  if (value == null || !Number.isFinite(value) || !Number.isFinite(entry) || entry <= 0) {
    return <div className={styles.deltaRow} aria-hidden />;
  }
  const delta = computePriceDelta(value, entry, volume, side, pipSize, contractSize);
  const parts = formatDeltaParts(delta);
  return (
    <div className={`${styles.deltaRow} ${styles.deltaRowShow}`} role="status">
      <span className={styles[parts.className]}>{parts.pips}</span>
      <span className={styles.sep}>|</span>
      <span className={styles[parts.className]}>{parts.usd}</span>
      <span className={styles.sep}>|</span>
      <span className={styles[parts.className]}>{parts.pct}</span>
    </div>
  );
}

const QuickMarketWidget: React.FC<QuickMarketWidgetProps> = ({
  symbol,
  symbols,
  symbolsByGroup,
  quote,
  symInfo,
  connected,
  onSymbolChange,
  onOrderSuccess,
  onClose,
}) => {
  const constraints: SymbolLotConstraints = {
    volume_min: symInfo?.volume_min ?? 0.01,
    volume_step: symInfo?.volume_step ?? 0.01,
    volume_max: symInfo?.volume_max ?? 100,
    point: symInfo?.point,
    digits: symInfo?.digits ?? 2,
    trade_stops_level: symInfo?.trade_stops_level,
    contract_size: symInfo?.contract_size ?? 1,
  };

  const [side, setSide] = useState<OrderSide>("buy");
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [volume, setVolume] = useState(constraints.volume_min);
  const [volumeText, setVolumeText] = useState(constraints.volume_min.toFixed(2));
  const [tp, setTp] = useState<number | null>(null);
  const [sl, setSl] = useState<number | null>(null);
  const [tpText, setTpText] = useState("");
  const [slText, setSlText] = useState("");
  const [pendingPrice, setPendingPrice] = useState<number | null>(null);
  const [pendingText, setPendingText] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [flash, setFlash] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [preview, setPreview] = useState<QuickMarketPreview | null>(null);
  const midHistory = useRef<number[]>([]);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const digits = constraints.digits ?? 2;
  const volStep = constraints.volume_step;
  const volDecimals = Math.max(0, (String(volStep).split(".")[1] || "").length);
  const priceStep =
    symInfo?.trade_tick_size && symInfo.trade_tick_size > 0
      ? symInfo.trade_tick_size
      : constraints.point && constraints.point > 0
        ? constraints.point
        : 1;
  const pipSize = getPipSize(symbol, constraints.point);
  const contractSize = constraints.contract_size ?? 1;

  const entryPrice = useMemo(() => {
    if (!quote) return 0;
    if (orderType === "pending" && pendingPrice != null && pendingPrice > 0) {
      return pendingPrice;
    }
    return side === "buy" ? quote.ask : quote.bid;
  }, [quote, side, orderType, pendingPrice]);

  const spread = quote && quote.ask > 0 && quote.bid > 0 ? quote.ask - quote.bid : 0;

  useEffect(() => {
    if (!quote) return;
    const mid = (quote.bid + quote.ask) / 2;
    if (!Number.isFinite(mid) || mid <= 0) return;
    const hist = midHistory.current;
    if (hist.length === 0 || hist[hist.length - 1] !== mid) {
      midHistory.current = [...hist.slice(-40), mid];
    }
  }, [quote?.bid, quote?.ask]);

  const { sellPct, buyPct } = pressureFromTicks(midHistory.current);

  // Snap volume when symbol constraints change
  useEffect(() => {
    const snapped = snapVolume(volume, constraints);
    if (snapped !== volume) {
      setVolume(snapped);
      setVolumeText(snapped.toFixed(volDecimals));
    } else {
      setVolumeText(volume.toFixed(volDecimals));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, constraints.volume_min, constraints.volume_step, constraints.volume_max]);

  const fetchPreview = useCallback(async () => {
    if (!quote || volume <= 0) {
      setPreview(null);
      return;
    }
    try {
      const res = await tradingAPI.getBrokerOrderPreview({
        symbol,
        side,
        volume,
        price: entryPrice > 0 ? entryPrice : undefined,
      });
      setPreview(res);
    } catch {
      // Fallback local estimate if preview endpoint unavailable
      const lev = 100;
      const cs = contractSize;
      const px = entryPrice || quote.ask || quote.bid;
      setPreview({
        fees: Math.abs(spread) * volume * cs * 0.5 || volume * 10,
        margin: px > 0 ? (volume * cs * px) / lev : 0,
        leverage: lev,
        contract_size: cs,
        swap_long: symInfo?.swap_long ?? 0,
        swap_short: symInfo?.swap_short ?? 0,
        currency: "USD",
      });
    }
  }, [symbol, side, volume, entryPrice, quote, contractSize, spread, symInfo]);

  useEffect(() => {
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => {
      void fetchPreview();
    }, 250);
    return () => {
      if (previewTimer.current) clearTimeout(previewTimer.current);
    };
  }, [fetchPreview]);

  const applyVolume = (v: number) => {
    const snapped = snapVolume(v, constraints);
    setVolume(snapped);
    setVolumeText(snapped.toFixed(volDecimals));
  };

  const applyTp = (v: number | null) => {
    setTp(v);
    setTpText(v == null ? "" : v.toFixed(digits));
  };

  const applySl = (v: number | null) => {
    setSl(v);
    setSlText(v == null ? "" : v.toFixed(digits));
  };

  const applyPending = (v: number | null) => {
    setPendingPrice(v);
    setPendingText(v == null ? "" : v.toFixed(digits));
  };

  const resetForm = () => {
    applyVolume(constraints.volume_min);
    applyTp(null);
    applySl(null);
    applyPending(null);
    setFlash(null);
  };

  const confirmLabel = `Confirm ${side === "buy" ? "Buy" : "Sell"} ${volume.toFixed(volDecimals)} lots`;

  const orderDisabled =
    submitting ||
    !connected ||
    !quote ||
    quote.bid <= 0 ||
    quote.ask <= 0;

  const handleConfirm = async () => {
    setFlash(null);
    if (!quote) {
      setFlash({ kind: "err", text: "Quote unavailable" });
      return;
    }

    const snapped = snapVolume(volume, constraints);
    if (snapped !== volume) applyVolume(snapped);

    if (orderType === "pending") {
      const err = validatePendingPrice(side, pendingPrice ?? NaN, quote.bid, quote.ask);
      if (err) {
        setFlash({ kind: "err", text: err });
        return;
      }
    }

    const entry = orderType === "pending" ? (pendingPrice as number) : side === "buy" ? quote.ask : quote.bid;
    const tpErr = validateStopDistance(
      tp,
      entry,
      constraints.trade_stops_level,
      constraints.point,
      "Take Profit",
    );
    if (tpErr) {
      setFlash({ kind: "err", text: tpErr });
      return;
    }
    const slErr = validateStopDistance(
      sl,
      entry,
      constraints.trade_stops_level,
      constraints.point,
      "Stop Loss",
    );
    if (slErr) {
      setFlash({ kind: "err", text: slErr });
      return;
    }

    try {
      setSubmitting(true);
      let res: { success?: boolean; error?: string; price?: number; message?: string };
      if (orderType === "pending") {
        res = await tradingAPI.placeBrokerPendingOrder({
          symbol,
          side,
          volume: snapped,
          price: pendingPrice as number,
          sl: sl ?? undefined,
          tp: tp ?? undefined,
          comment: `Pending ${side.toUpperCase()} from Quick Market`,
        });
      } else {
        res = await tradingAPI.placeBrokerMarketOrder({
          symbol,
          side,
          volume: snapped,
          sl: sl ?? undefined,
          tp: tp ?? undefined,
          comment: `Manual ${side.toUpperCase()} from Quick Market`,
        });
      }

      if (res.success) {
        const px = res.price != null ? formatPrice(res.price, digits) : formatPrice(entry, digits);
        setFlash({
          kind: "ok",
          text: `Order placed: ${side === "buy" ? "Buy" : "Sell"} ${snapped.toFixed(volDecimals)} lots @ ${px}`,
        });
        await onOrderSuccess?.();
        setTimeout(() => setFlash(null), 3000);
      } else {
        setFlash({ kind: "err", text: res.error || "Order rejected" });
      }
    } catch (e) {
      setFlash({ kind: "err", text: String(e) });
    } finally {
      setSubmitting(false);
    }
  };

  const leverage = preview?.leverage ?? 100;
  const fees = preview?.fees ?? 0;
  const margin = preview?.margin ?? 0;
  const swapLong = preview?.swap_long ?? symInfo?.swap_long ?? 0;
  const swapShort = preview?.swap_short ?? symInfo?.swap_short ?? 0;
  const cs = preview?.contract_size ?? contractSize;
  const currency = preview?.currency ?? "USD";

  const groups = symbolsByGroup;
  const flatSymbols = symbols.length ? symbols : Object.values(groups || {}).flat();

  return (
    <div className={styles.widget} data-testid="quick-market-widget">
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.symbolIcon} aria-hidden>
            {symbolIconLetter(symbol)}
          </div>
          <div className={styles.headerTitle}>{shortSymbolLabel(symbol)}</div>
        </div>
        {onClose ? (
          <button
            type="button"
            className={styles.closeBtn}
            title="Close"
            aria-label="Close order ticket"
            onClick={onClose}
          >
            ✕
          </button>
        ) : null}
      </div>

      <div className={styles.formSelect}>
        <select
          id="qm-symbol"
          className={styles.symbolSelect}
          value={symbol}
          onChange={(e) => onSymbolChange(e.target.value)}
          aria-label="Trading symbol"
        >
          {groups
            ? Object.entries(groups).map(([label, list]) => (
                <optgroup key={label} label={label}>
                  {list.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </optgroup>
              ))
            : flatSymbols.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
        </select>
        <span className={styles.chevron} aria-hidden>
          ▼
        </span>
      </div>

      <div className={styles.priceRow}>
        <button
          type="button"
          className={`${styles.priceBox} ${styles.sell} ${side === "sell" ? styles.sellActive : ""}`}
          onClick={() => setSide("sell")}
          aria-pressed={side === "sell"}
          data-testid="sell-box"
        >
          <div className={styles.priceLabel}>Sell</div>
          <div className={styles.priceValue} data-testid="sell-price">
            {quote ? formatPrice(quote.bid, digits) : "—"}
          </div>
        </button>
        <button
          type="button"
          className={`${styles.priceBox} ${styles.buy} ${side === "buy" ? styles.buyActive : ""}`}
          onClick={() => setSide("buy")}
          aria-pressed={side === "buy"}
          data-testid="buy-box"
        >
          <div className={styles.priceLabel}>Buy</div>
          <div className={styles.priceValue} data-testid="buy-price">
            {quote ? formatPrice(quote.ask, digits) : "—"}
          </div>
        </button>
        <div className={styles.spreadBadge} data-testid="spread-badge">
          {formatPrice(spread, digits)} {currency}
        </div>
      </div>

      <div className={styles.percentBarRow} aria-hidden>
        <span className={styles.sellPct}>{sellPct}%</span>
        <div className={styles.barTrack}>
          <div className={styles.barSell} style={{ width: `${sellPct}%` }} />
          <div className={styles.barBuy} style={{ width: `${buyPct}%` }} />
        </div>
        <span className={styles.buyPct}>{buyPct}%</span>
      </div>

      <div className={styles.tabs} role="tablist" aria-label="Order type">
        <button
          type="button"
          role="tab"
          aria-selected={orderType === "market"}
          className={`${styles.tab} ${orderType === "market" ? styles.tabActive : ""}`}
          onClick={() => setOrderType("market")}
          data-testid="market-tab"
        >
          Market
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={orderType === "pending"}
          className={`${styles.tab} ${orderType === "pending" ? styles.tabActive : ""}`}
          onClick={() => setOrderType("pending")}
          data-testid="pending-tab"
        >
          Pending
        </button>
      </div>

      {orderType === "pending" ? (
        <div className={styles.fieldGroup}>
          <div className={styles.fieldLabel}>Pending price</div>
          <div className={styles.fieldRow}>
            <input
              className={styles.fieldInput}
              type="text"
              inputMode="decimal"
              placeholder="Limit price"
              value={pendingText}
              onChange={(e) => {
                setPendingText(e.target.value);
                const v = parseFloat(e.target.value);
                setPendingPrice(Number.isFinite(v) ? v : null);
              }}
              onBlur={() => {
                if (pendingPrice != null) applyPending(pendingPrice);
              }}
              data-testid="pending-price"
              aria-label="Pending order price"
            />
            <div className={styles.fieldUnit}>Price</div>
            <button
              type="button"
              className={styles.fieldBtn}
              aria-label="Decrease pending price"
              onClick={() =>
                applyPending((pendingPrice ?? (entryPrice || quote?.ask || 0)) - priceStep)
              }
            >
              −
            </button>
            <button
              type="button"
              className={styles.fieldBtn}
              aria-label="Increase pending price"
              onClick={() =>
                applyPending((pendingPrice ?? (entryPrice || quote?.ask || 0)) + priceStep)
              }
            >
              +
            </button>
          </div>
        </div>
      ) : null}

      <div className={styles.fieldGroup}>
        <div className={styles.fieldLabel}>Volume</div>
        <div className={styles.fieldRow}>
          <input
            className={styles.fieldInput}
            type="text"
            inputMode="decimal"
            value={volumeText}
            onChange={(e) => setVolumeText(e.target.value)}
            onBlur={() => {
              const v = parseFloat(volumeText);
              applyVolume(Number.isFinite(v) ? v : constraints.volume_min);
            }}
            data-testid="volume-input"
            aria-label="Volume in lots"
          />
          <div className={styles.fieldUnit}>Lots</div>
          <button
            type="button"
            className={styles.fieldBtn}
            aria-label="Decrease volume"
            onClick={() => applyVolume(volume - volStep)}
          >
            −
          </button>
          <button
            type="button"
            className={styles.fieldBtn}
            aria-label="Increase volume"
            onClick={() => applyVolume(volume + volStep)}
          >
            +
          </button>
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <div className={styles.fieldLabel}>
          Take Profit <span className={styles.helpIcon} title="Take profit exit price">?</span>
        </div>
        <div className={styles.fieldRow}>
          <input
            className={styles.fieldInput}
            type="text"
            inputMode="decimal"
            placeholder="Not set"
            value={tpText}
            onChange={(e) => {
              setTpText(e.target.value);
              const v = parseFloat(e.target.value);
              setTp(Number.isFinite(v) ? v : null);
            }}
            data-testid="tp-input"
            aria-label="Take profit price"
          />
          <button
            type="button"
            className={`${styles.clearBtn} ${tp != null ? styles.clearBtnShow : ""}`}
            aria-label="Clear take profit"
            onClick={() => applyTp(null)}
          >
            ✕
          </button>
          <div className={styles.fieldUnit}>Price ▾</div>
          <button
            type="button"
            className={styles.fieldBtn}
            aria-label="Decrease take profit"
            onClick={() => applyTp((tp ?? entryPrice) - priceStep)}
          >
            −
          </button>
          <button
            type="button"
            className={styles.fieldBtn}
            aria-label="Increase take profit"
            onClick={() => applyTp((tp ?? entryPrice) + priceStep)}
          >
            +
          </button>
        </div>
        <DeltaRow
          value={tp}
          entry={entryPrice}
          volume={volume}
          side={side}
          pipSize={pipSize}
          contractSize={contractSize}
        />
      </div>

      <div className={styles.fieldGroup}>
        <div className={styles.fieldLabel}>
          Stop Loss <span className={styles.helpIcon} title="Stop loss exit price">?</span>
        </div>
        <div className={styles.fieldRow}>
          <input
            className={styles.fieldInput}
            type="text"
            inputMode="decimal"
            placeholder="Not set"
            value={slText}
            onChange={(e) => {
              setSlText(e.target.value);
              const v = parseFloat(e.target.value);
              setSl(Number.isFinite(v) ? v : null);
            }}
            data-testid="sl-input"
            aria-label="Stop loss price"
          />
          <button
            type="button"
            className={`${styles.clearBtn} ${sl != null ? styles.clearBtnShow : ""}`}
            aria-label="Clear stop loss"
            onClick={() => applySl(null)}
          >
            ✕
          </button>
          <div className={styles.fieldUnit}>Price ▾</div>
          <button
            type="button"
            className={styles.fieldBtn}
            aria-label="Decrease stop loss"
            onClick={() => applySl((sl ?? entryPrice) - priceStep)}
          >
            −
          </button>
          <button
            type="button"
            className={styles.fieldBtn}
            aria-label="Increase stop loss"
            onClick={() => applySl((sl ?? entryPrice) + priceStep)}
          >
            +
          </button>
        </div>
        <DeltaRow
          value={sl}
          entry={entryPrice}
          volume={volume}
          side={side}
          pipSize={pipSize}
          contractSize={contractSize}
        />
      </div>

      <button
        type="button"
        className={`${styles.confirmBtn} ${side === "buy" ? styles.confirmBuy : styles.confirmSell}`}
        disabled={orderDisabled}
        onClick={() => void handleConfirm()}
        data-testid="confirm-btn"
      >
        {submitting ? "Submitting…" : confirmLabel}
      </button>
      <button
        type="button"
        className={styles.cancelBtn}
        onClick={resetForm}
        data-testid="cancel-btn"
      >
        Cancel
      </button>

      <div
        className={`${styles.flash} ${flash ? (flash.kind === "ok" ? styles.flashOk : styles.flashErr) : ""}`}
        data-testid="flash-msg"
        role="status"
        aria-live="polite"
      >
        {flash?.text ?? ""}
      </div>

      <div className={styles.infoBlock}>
        <div className={styles.infoRow}>
          <span>Fees:</span>
          <span data-testid="fees-val">≈ {fees.toFixed(2)} {currency}</span>
        </div>
        <div className={styles.infoRow}>
          <span>Leverage:</span>
          <span data-testid="leverage-val">1:{leverage}</span>
        </div>
        <div className={styles.infoRow}>
          <span>Margin:</span>
          <span data-testid="margin-val">
            {margin.toFixed(2)} {currency}
          </span>
        </div>
        <button
          type="button"
          className={styles.moreToggle}
          onClick={() => setMoreOpen((o) => !o)}
          aria-expanded={moreOpen}
          data-testid="more-toggle"
        >
          <span>{moreOpen ? "Less" : "More"}</span>
          <span className={`${styles.arrow} ${moreOpen ? styles.arrowOpen : ""}`}>▾</span>
        </button>
        <div className={`${styles.moreExtra} ${moreOpen ? styles.moreExtraShow : ""}`}>
          <div className={styles.infoRow}>
            <span>Swap long:</span>
            <span>
              {swapLong.toFixed(2)} {currency}
            </span>
          </div>
          <div className={styles.infoRow}>
            <span>Swap short:</span>
            <span>
              {swapShort.toFixed(2)} {currency}
            </span>
          </div>
          <div className={styles.infoRow}>
            <span>Contract size:</span>
            <span>
              {cs} {shortSymbolLabel(symbol)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickMarketWidget;
