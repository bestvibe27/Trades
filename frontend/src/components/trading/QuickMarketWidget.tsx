import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "../../styles/QuickMarketWidget.module.css";
import tradingAPI from "../../services/tradingAPI";
import {
  computePriceDelta,
  deriveStopRawValue,
  formatDeltaParts,
  formatPrice,
  formatStopRawValue,
  STOP_MODE_LABELS,
  STOP_MODE_OPTIONS,
  STOP_MODE_STEPS,
  resolveStopPrice,
  OrderSide,
  OrderType,
  pressureFromTicks,
  shortSymbolLabel,
  snapVolume,
  StopConversionContext,
  StopTargetKind,
  StopUnitMode,
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
  pip_size?: number;
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

export interface QuickMarketAccountInfo {
  equity: number;
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
  account?: QuickMarketAccountInfo | null;
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

interface UnitModeDropdownProps {
  kind: StopTargetKind;
  mode: StopUnitMode;
  onChange: (mode: StopUnitMode) => void;
  openDropdown: StopTargetKind | null;
  setOpenDropdown: (kind: StopTargetKind | null) => void;
}

function UnitModeDropdown({
  kind,
  mode,
  onChange,
  openDropdown,
  setOpenDropdown,
}: UnitModeDropdownProps) {
  const listId = `${kind}-mode-listbox`;
  const isOpen = openDropdown === kind;
  const [activeIndex, setActiveIndex] = useState(() =>
    STOP_MODE_OPTIONS.findIndex((o) => o.value === mode),
  );

  useEffect(() => {
    setActiveIndex(STOP_MODE_OPTIONS.findIndex((o) => o.value === mode));
  }, [mode]);

  const open = () => {
    setOpenDropdown(kind);
    setActiveIndex(STOP_MODE_OPTIONS.findIndex((o) => o.value === mode));
  };

  const close = () => setOpenDropdown(null);

  const selectMode = (nextMode: StopUnitMode) => {
    onChange(nextMode);
    close();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        open();
        return;
      }
      setActiveIndex((i) => (i + 1) % STOP_MODE_OPTIONS.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen) {
        open();
        return;
      }
      setActiveIndex((i) => (i - 1 + STOP_MODE_OPTIONS.length) % STOP_MODE_OPTIONS.length);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!isOpen) {
        open();
        return;
      }
      selectMode(STOP_MODE_OPTIONS[activeIndex].value);
    } else if (e.key === "Escape" && isOpen) {
      e.preventDefault();
      close();
    }
  };

  return (
    <>
      <button
        type="button"
        className={styles.fieldUnitBtn}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listId}
        data-testid={`${kind}-mode-select`}
        onClick={(e) => {
          e.stopPropagation();
          if (isOpen) close();
          else open();
        }}
        onKeyDown={onKeyDown}
      >
        <span>{STOP_MODE_LABELS[mode]}</span>
        <span className={styles.chevron} aria-hidden>
          ▾
        </span>
      </button>
      <div
        id={listId}
        role="listbox"
        aria-label={`${kind === "tp" ? "Take profit" : "Stop loss"} input mode`}
        className={`${styles.unitDropdown} ${isOpen ? styles.unitDropdownOpen : ""}`}
      >
        {STOP_MODE_OPTIONS.map((option, index) => (
          <button
            key={option.value}
            type="button"
            role="option"
            aria-selected={mode === option.value}
            data-testid={`${kind}-mode-option-${option.value}`}
            className={`${styles.unitDropdownItem} ${
              mode === option.value ? styles.unitDropdownItemSelected : ""
            }`}
            onClick={(e) => {
              e.stopPropagation();
              selectMode(option.value);
            }}
            onMouseEnter={() => setActiveIndex(index)}
            tabIndex={isOpen ? (index === activeIndex ? 0 : -1) : -1}
          >
            {option.label}
          </button>
        ))}
      </div>
    </>
  );
}

interface StopFieldProps {
  kind: StopTargetKind;
  value: number | null;
  text: string;
  setText: React.Dispatch<React.SetStateAction<string>>;
  applyPrice: (value: number | null) => void;
  mode: StopUnitMode;
  setMode: React.Dispatch<React.SetStateAction<StopUnitMode>>;
  testId: string;
  ariaLabel: string;
  entryPrice: number;
  volume: number;
  accountEquity: number;
  pipSize: number;
  contractSize: number;
  side: OrderSide;
  digits: number;
  priceStep: number;
  openDropdown: StopTargetKind | null;
  setOpenDropdown: (kind: StopTargetKind | null) => void;
}

function StopField({
  kind,
  value,
  text,
  setText,
  applyPrice,
  mode,
  setMode,
  testId,
  ariaLabel,
  entryPrice,
  volume,
  accountEquity,
  pipSize,
  contractSize,
  side,
  digits,
  priceStep,
  openDropdown,
  setOpenDropdown,
}: StopFieldProps) {
  const label = kind === "tp" ? "Take Profit" : "Stop Loss";
  const context: StopConversionContext = {
    entryPrice,
    volume,
    equity: accountEquity,
    pipSize,
    contractSize,
    side,
    kind,
  };

  const syncTextFromPrice = useCallback(
    (nextPrice: number | null, nextMode: StopUnitMode = mode) => {
      if (nextPrice == null || !Number.isFinite(nextPrice)) {
        setText("");
        return;
      }
      const rawValue = deriveStopRawValue(nextMode, nextPrice, context);
      setText(formatStopRawValue(rawValue, nextMode, digits));
    },
    [mode, entryPrice, volume, accountEquity, pipSize, contractSize, side, kind, digits, setText],
  );

  const onValueChange = (rawText: string) => {
    setText(rawText);
    const rawValue = parseFloat(rawText);
    if (!Number.isFinite(rawValue)) {
      applyPrice(null);
      return;
    }
    applyPrice(resolveStopPrice(mode, rawValue, context));
  };

  const stepValue = (direction: 1 | -1) => {
    const currentRaw =
      value == null || !Number.isFinite(value)
        ? mode === "price"
          ? entryPrice
          : 0
        : deriveStopRawValue(mode, value, context);
    const step = mode === "price" ? priceStep : STOP_MODE_STEPS[mode];
    const nextRaw = currentRaw + direction * step;
    const nextPrice = resolveStopPrice(mode, nextRaw, context);
    applyPrice(nextPrice);
    setText(formatStopRawValue(nextRaw, mode, digits));
  };

  useEffect(() => {
    syncTextFromPrice(value);
    // Re-sync display when mode or dependencies change, not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, entryPrice, volume, side, accountEquity, pipSize, contractSize, digits]);

  return (
    <div className={styles.fieldGroup}>
      <div className={styles.fieldLabel}>
        {label} <span className={styles.helpIcon} title={`${label} exit price`}>?</span>
      </div>
      <div className={styles.fieldRow}>
        <input
          className={styles.fieldInput}
          type="text"
          inputMode="decimal"
          placeholder="Not set"
          value={text}
          onChange={(e) => onValueChange(e.target.value)}
          onBlur={() => syncTextFromPrice(value)}
          data-testid={testId}
          aria-label={ariaLabel}
        />
        <button
          type="button"
          className={`${styles.clearBtn} ${value != null ? styles.clearBtnShow : ""}`}
          aria-label={`Clear ${label.toLowerCase()}`}
          onClick={() => {
            applyPrice(null);
            setText("");
          }}
        >
          ✕
        </button>
        <UnitModeDropdown
          kind={kind}
          mode={mode}
          onChange={setMode}
          openDropdown={openDropdown}
          setOpenDropdown={setOpenDropdown}
        />
        <button
          type="button"
          className={styles.fieldBtn}
          aria-label={`Decrease ${label.toLowerCase()}`}
          onClick={() => stepValue(-1)}
        >
          −
        </button>
        <button
          type="button"
          className={styles.fieldBtn}
          aria-label={`Increase ${label.toLowerCase()}`}
          onClick={() => stepValue(1)}
        >
          +
        </button>
      </div>
      <DeltaRow
        value={value}
        entry={entryPrice}
        volume={volume}
        side={side}
        pipSize={pipSize}
        contractSize={contractSize}
      />
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
  account,
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
  const [tpMode, setTpMode] = useState<StopUnitMode>("price");
  const [slMode, setSlMode] = useState<StopUnitMode>("price");
  const [tpText, setTpText] = useState("");
  const [slText, setSlText] = useState("");
  const [pendingPrice, setPendingPrice] = useState<number | null>(null);
  const [pendingText, setPendingText] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const [openStopDropdown, setOpenStopDropdown] = useState<StopTargetKind | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [flash, setFlash] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [preview, setPreview] = useState<QuickMarketPreview | null>(null);
  const [accountInfo, setAccountInfo] = useState<QuickMarketAccountInfo | null>(account ?? null);
  const midHistory = useRef<number[]>([]);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!widgetRef.current?.contains(e.target as Node)) {
        setOpenStopDropdown(null);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const digits = constraints.digits ?? 2;
  const volStep = constraints.volume_step;
  const volDecimals = Math.max(0, (String(volStep).split(".")[1] || "").length);
  const priceStep =
    symInfo?.trade_tick_size && symInfo.trade_tick_size > 0
      ? symInfo.trade_tick_size
      : constraints.point && constraints.point > 0
        ? constraints.point
        : 1;
  const pipSize = getPipSize(constraints.point, symInfo?.pip_size);
  const contractSize = constraints.contract_size ?? 1;
  const accountEquity = account?.equity ?? accountInfo?.equity ?? 0;

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

  useEffect(() => {
    setAccountInfo(account ?? null);
  }, [account]);

  useEffect(() => {
    if (account?.equity != null || !connected) return;
    let cancelled = false;
    const loadAccount = async () => {
      try {
        const res = await tradingAPI.getBrokerAccount();
        if (!cancelled) {
          setAccountInfo({ equity: res.equity, currency: res.currency });
        }
      } catch {
        if (!cancelled) {
          setAccountInfo(null);
        }
      }
    };
    void loadAccount();
    return () => {
      cancelled = true;
    };
  }, [account?.equity, connected, symbol]);

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
  };

  const applySl = (v: number | null) => {
    setSl(v);
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
  const currency = preview?.currency ?? account?.currency ?? accountInfo?.currency ?? "USD";

  const groups = symbolsByGroup;
  const flatSymbols = symbols.length ? symbols : Object.values(groups || {}).flat();

  return (
    <div className={styles.widget} data-testid="quick-market-widget" ref={widgetRef}>
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

      <StopField
        kind="tp"
        value={tp}
        text={tpText}
        setText={setTpText}
        applyPrice={applyTp}
        mode={tpMode}
        setMode={setTpMode}
        testId="tp-input"
        ariaLabel="Take profit value"
        entryPrice={entryPrice}
        volume={volume}
        accountEquity={accountEquity}
        pipSize={pipSize}
        contractSize={contractSize}
        side={side}
        digits={digits}
        priceStep={priceStep}
        openDropdown={openStopDropdown}
        setOpenDropdown={setOpenStopDropdown}
      />

      <StopField
        kind="sl"
        value={sl}
        text={slText}
        setText={setSlText}
        applyPrice={applySl}
        mode={slMode}
        setMode={setSlMode}
        testId="sl-input"
        ariaLabel="Stop loss value"
        entryPrice={entryPrice}
        volume={volume}
        accountEquity={accountEquity}
        pipSize={pipSize}
        contractSize={contractSize}
        side={side}
        digits={digits}
        priceStep={priceStep}
        openDropdown={openStopDropdown}
        setOpenDropdown={setOpenStopDropdown}
      />

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
