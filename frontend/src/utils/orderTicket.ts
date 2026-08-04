/**
 * Pure helpers for the Quick Market order ticket (deltas, volume, validation).
 */

export type OrderSide = "buy" | "sell";
export type OrderType = "market" | "pending";
export type StopTargetKind = "tp" | "sl";
export type StopUnitMode = "price" | "pips" | "money" | "percent";

export interface PriceDelta {
  diff: number;
  pips: number;
  usd: number;
  pct: number;
  /** Positive P/L → profit color; negative → loss color */
  positive: boolean;
}

export interface SymbolLotConstraints {
  volume_min: number;
  volume_step: number;
  volume_max: number;
  point?: number;
  digits?: number;
  trade_stops_level?: number;
  contract_size?: number;
}

export interface StopConversionContext {
  entryPrice: number;
  volume: number;
  equity: number;
  pipSize: number;
  contractSize: number;
  side: OrderSide;
  kind: StopTargetKind;
}

export const STOP_MODE_LABELS: Record<StopUnitMode, string> = {
  price: "Price",
  pips: "Pips",
  money: "Money",
  percent: "% Equity",
};

export const STOP_MODE_OPTIONS: Array<{ value: StopUnitMode; label: string }> = [
  { value: "price", label: "By asset price" },
  { value: "pips", label: "In pips" },
  { value: "money", label: "In money" },
  { value: "percent", label: "In % of equity" },
];

export const STOP_MODE_STEPS: Record<StopUnitMode, number> = {
  price: 1,
  pips: 1,
  money: 1,
  percent: 0.1,
};

export const STOP_MODE_DECIMALS: Record<StopUnitMode, number> = {
  price: 2,
  pips: 1,
  money: 2,
  percent: 2,
};

/** Pip size for delta display / stop conversions, sourced from instrument config. */
export function getPipSize(point?: number, pipSize?: number): number {
  if (pipSize && pipSize > 0) return pipSize;
  if (point && point > 0) return point * 10;
  return 0.0001;
}

function stopDirection(side: OrderSide, kind: StopTargetKind): number {
  if (kind === "tp") {
    return side === "buy" ? 1 : -1;
  }
  return side === "buy" ? -1 : 1;
}

function moneyToPriceDistance(amount: number, volume: number, contractSize: number): number {
  const size = Math.abs(volume) * Math.abs(contractSize);
  if (!Number.isFinite(amount) || size <= 0) return 0;
  return amount / size;
}

export function resolveStopPrice(
  mode: StopUnitMode,
  rawValue: number,
  context: StopConversionContext,
): number {
  const direction = stopDirection(context.side, context.kind);
  switch (mode) {
    case "price":
      return rawValue;
    case "pips":
      return context.entryPrice + direction * rawValue * context.pipSize;
    case "money":
      return context.entryPrice
        + direction * moneyToPriceDistance(rawValue, context.volume, context.contractSize);
    case "percent":
      return context.entryPrice
        + direction * moneyToPriceDistance(
          (rawValue / 100) * context.equity,
          context.volume,
          context.contractSize,
        );
    default:
      return rawValue;
  }
}

export function deriveStopRawValue(
  mode: StopUnitMode,
  price: number,
  context: StopConversionContext,
): number {
  const direction = stopDirection(context.side, context.kind);
  const signedDiff = (price - context.entryPrice) * direction;
  switch (mode) {
    case "price":
      return price;
    case "pips":
      return context.pipSize > 0 ? signedDiff / context.pipSize : 0;
    case "money":
      return signedDiff * context.volume * context.contractSize;
    case "percent":
      return context.equity > 0
        ? (signedDiff * context.volume * context.contractSize / context.equity) * 100
        : 0;
    default:
      return price;
  }
}

export function formatStopRawValue(rawValue: number, mode: StopUnitMode, priceDigits: number): string {
  const digits = mode === "price" ? priceDigits : STOP_MODE_DECIMALS[mode];
  return rawValue.toFixed(digits);
}

/**
 * Compute TP/SL delta vs entry. USD uses signed P/L for the given side
 * (buy: price up = profit; sell: price down = profit).
 */
export function computePriceDelta(
  value: number,
  entryPrice: number,
  volume: number,
  side: OrderSide,
  pipSize: number,
  contractSize: number = 1,
): PriceDelta {
  const diff = value - entryPrice;
  const signedUsd =
    side === "buy"
      ? diff * volume * contractSize
      : -diff * volume * contractSize;
  const pips = diff / pipSize;
  const pct = entryPrice !== 0 ? (diff / entryPrice) * 100 : 0;
  return {
    diff,
    pips,
    usd: signedUsd,
    pct,
    positive: signedUsd >= 0,
  };
}

export function formatDeltaParts(delta: PriceDelta): {
  pips: string;
  usd: string;
  pct: string;
  className: "pos" | "neg";
} {
  const sign = (n: number) => (n >= 0 ? "+" : "");
  return {
    pips: `${sign(delta.pips)}${delta.pips.toFixed(1)} pips`,
    usd: `${sign(delta.usd)}${delta.usd.toFixed(2)} USD`,
    pct: `${sign(delta.pct)}${Math.abs(delta.pct).toFixed(2)}%`,
    className: delta.positive ? "pos" : "neg",
  };
}

export function snapVolume(
  volume: number,
  constraints: SymbolLotConstraints,
): number {
  const min = constraints.volume_min ?? 0.01;
  const step = constraints.volume_step ?? 0.01;
  const max = constraints.volume_max ?? 100;
  if (!Number.isFinite(volume)) return min;
  const steps = Math.round(volume / step);
  const snapped = steps * step;
  const clamped = Math.max(min, Math.min(max, snapped));
  const decimals = Math.max(0, (step.toString().split(".")[1] || "").length);
  return Number(clamped.toFixed(decimals));
}

export function formatPrice(n: number, digits: number = 2): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function shortSymbolLabel(symbol: string): string {
  return symbol
    .replace(/m$/i, "")
    .replace(/USD$/i, "")
    .replace(/USDT$/i, "")
    .toUpperCase();
}

export function symbolIconLetter(symbol: string): string {
  const short = shortSymbolLabel(symbol);
  if (short === "BTC" || short.startsWith("BTC")) return "₿";
  return short.charAt(0) || "?";
}

/** Buy-limit must be below ask; sell-limit above bid. */
export function validatePendingPrice(
  side: OrderSide,
  pendingPrice: number,
  bid: number,
  ask: number,
): string | null {
  if (!Number.isFinite(pendingPrice) || pendingPrice <= 0) {
    return "Enter a valid pending price";
  }
  if (side === "buy" && pendingPrice >= ask) {
    return "Buy limit must be below the current ask";
  }
  if (side === "sell" && pendingPrice <= bid) {
    return "Sell limit must be above the current bid";
  }
  return null;
}

/** Minimum stop distance in price units from trade_stops_level × point. */
export function minStopDistance(
  tradeStopsLevel: number | undefined,
  point: number | undefined,
): number {
  const level = tradeStopsLevel ?? 0;
  const pt = point && point > 0 ? point : 0.01;
  return level * pt;
}

export function validateStopDistance(
  level: number | null | undefined,
  entryPrice: number,
  tradeStopsLevel: number | undefined,
  point: number | undefined,
  label: string,
): string | null {
  if (level == null || !Number.isFinite(level)) return null;
  const minDist = minStopDistance(tradeStopsLevel, point);
  if (minDist <= 0) return null;
  if (Math.abs(level - entryPrice) < minDist) {
    return `${label} must be at least ${minDist} from entry (min stop distance)`;
  }
  return null;
}

/**
 * Buy/sell pressure bar from recent mid-price direction (0–100 sell share).
 * Falls back to 50/50 when history is thin.
 */
export function pressureFromTicks(mids: number[]): { sellPct: number; buyPct: number } {
  if (mids.length < 2) return { sellPct: 50, buyPct: 50 };
  let up = 0;
  let down = 0;
  const start = Math.max(1, mids.length - 20);
  for (let i = start; i < mids.length; i++) {
    const d = mids[i] - mids[i - 1];
    if (d > 0) up += 1;
    else if (d < 0) down += 1;
  }
  const total = up + down;
  if (total === 0) return { sellPct: 50, buyPct: 50 };
  const buyPct = Math.round((up / total) * 100);
  const sellPct = 100 - buyPct;
  return { sellPct, buyPct };
}
