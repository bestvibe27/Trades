import React, { useState, useMemo, useEffect, useRef } from "react";

export type InputMode = "price" | "pips" | "money" | "percent";

interface PriceInputProps {
  label: string;
  mode: InputMode;
  value: number;
  onChange: (value: number) => void;
  onModeChange: (mode: InputMode) => void;
  entryPrice: number;
  volume: number;
  symbol: string;
  equity: number;
  side: "buy" | "sell";
  disabled?: boolean;
}

const MODE_LABELS: Record<InputMode, string> = {
  price: "By Asset Price",
  pips: "In Pips",
  money: "In Money",
  percent: "In % of Equity",
};

const MODE_UNITS: Record<InputMode, string> = {
  price: "",
  pips: "pips",
  money: "USD",
  percent: "%",
};

export const PriceInput: React.FC<PriceInputProps> = ({
  label,
  mode,
  value,
  onChange,
  onModeChange,
  entryPrice,
  volume,
  symbol,
  equity,
  side,
  disabled = false,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayPrice = useMemo(() => {
    if (!isFinite(entryPrice) || entryPrice <= 0) return "-";
    let priceDistance: number;
    
    switch (mode) {
      case "price":
        return value.toFixed(symbol.includes("JPY") ? 3 : 5);
      case "pips":
        const pipValue = symbol.includes("JPY") ? 0.01 : 0.0001;
        priceDistance = value * pipValue;
        break;
      case "money":
        priceDistance = value;
        break;
      case "percent":
        if (volume <= 0) return "-";
        priceDistance = (equity * value) / 100 / volume;
        break;
      default:
        return "-";
    }
    
    // For TP/SL, we add distance for buy orders, subtract for sell
    const price = side === "buy" ? entryPrice + priceDistance : entryPrice - priceDistance;
    const digits = symbol.includes("JPY") ? 3 : 5;
    return price.toFixed(digits);
  }, [entryPrice, value, symbol, side, mode, volume, equity]);

  const placeholder = useMemo(() => {
    switch (mode) {
      case "price":
        return "e.g., 1.16095";
      case "pips":
        return "e.g., 50";
      case "money":
        return "e.g., 100";
      case "percent":
        return "e.g., 1.5";
      default:
        return "";
    }
  }, [mode]);

  const stepValue = useMemo(() => {
    switch (mode) {
      case "price":
        return symbol.includes("JPY") ? "0.001" : "0.00001";
      case "pips":
        return "1";
      case "money":
        return "0.1";
      case "percent":
        return "0.1";
      default:
        return "0.00001";
    }
  }, [mode, symbol]);

  const minMaxValues = useMemo(() => {
    switch (mode) {
      case "price":
        return { min: "0", max: "999999" };
      case "pips":
        return { min: "0", max: "10000" };
      case "money":
        return { min: "0", max: String(equity || 100000) };
      case "percent":
        return { min: "0", max: "100" };
      default:
        return { min: "0", max: "100" };
    }
  }, [mode, equity]);

  const handleModeSelect = (newMode: InputMode) => {
    onModeChange(newMode);
    setDropdownOpen(false);
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = parseFloat(e.target.value) || 0;
    onChange(numValue);
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-[var(--text-dim)] uppercase tracking-wider">
          {label}
        </span>
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            disabled={disabled}
            className="flex items-center gap-1 text-xs font-medium text-[var(--text-dim)] bg-[var(--bg-elev-2)] border border-[var(--border-strong)] rounded-md px-2 py-1 hover:bg-[var(--card-hover)] hover:text-[var(--accent)] transition-colors disabled:opacity-50"
          >
            {MODE_LABELS[mode]}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-1 w-44 bg-[var(--card)] border border-[var(--border)] rounded-md shadow-lg z-20 py-1">
              {(Object.keys(MODE_LABELS) as InputMode[]).map((m) => (
                <div
                  key={m}
                  onClick={() => handleModeSelect(m)}
                  className={`px-3 py-2 text-xs font-medium cursor-pointer transition-colors ${
                    m === mode
                      ? "text-[var(--accent)] bg-[var(--accent-soft)]"
                      : "text-[var(--text)] hover:bg-[var(--bg-elev-2)]"
                  }`}
                >
                  {MODE_LABELS[m]}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="relative">
        <input
          type="number"
          value={isFinite(value) ? value : ""}
          onChange={handleValueChange}
          placeholder={placeholder}
          disabled={disabled}
          step={stepValue}
          min={minMaxValues.min}
          max={minMaxValues.max}
          className={`w-full px-3 py-2.5 pr-12 bg-[var(--bg-elev-2)] border border-[var(--border-strong)] rounded-md text-[var(--text)] placeholder-[var(--muted)] font-mono text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-dim)] font-medium pointer-events-none">
          {MODE_UNITS[mode]}
        </span>
      </div>

      {mode !== "price" && isFinite(entryPrice) && entryPrice > 0 && value > 0 && (
        <div className="mt-1.5 text-xs text-[var(--text-dim)] font-mono">
          Equivalent: {displayPrice}
        </div>
      )}
    </div>
  );
};