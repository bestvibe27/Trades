import React, { useCallback, useMemo } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import {
  syncAllModes,
  modeToCanonicalPrice,
  validateTpSlStopLevel,
} from '@/utils/calculations';
import { TpSlMode } from '@/types/trading';

export interface TpSlControlProps {
  label: 'Take Profit' | 'Stop Loss';
  state: TpSlMode;
  onToggle: (enabled: boolean) => void;
  onModeChange: (mode: 'price' | 'pips' | 'money' | '%') => void;
  onValueChange: (value: number, mode: 'price' | 'pips' | 'money' | '%') => void;
  currentPrice: number;
  volume: number;
  contractSize: number;
  equity: number;
  isJpyPair: boolean;
  stopLevelPips: number;
  side: 'buy' | 'sell';
  disabled?: boolean;
  errors?: Record<string, string>;
}

const MODE_LABELS: Record<string, string> = {
  price: 'Price',
  pips: 'Pips',
  money: 'Money ($)',
  '%': 'Percent (%)',
};

const ModeButton: React.FC<{
  mode: 'price' | 'pips' | 'money' | '%';
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
}> = ({ mode, isActive, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex-1 rounded-md py-1.5 px-2 text-xs font-medium transition-colors ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
    } disabled:opacity-50`}
  >
    {MODE_LABELS[mode]}
  </button>
);

export const TpSlControl: React.FC<TpSlControlProps> = ({
  label,
  state,
  onToggle,
  onModeChange,
  onValueChange,
  currentPrice,
  volume,
  contractSize,
  equity,
  isJpyPair,
  stopLevelPips,
  side,
  disabled = false,
  errors = {},
}) => {
  const isStopLoss = label === 'Stop Loss';
  const errorKey = isStopLoss ? 'stopLoss' : 'takeProfit';
  const modeError = errors[errorKey] || errors[`${errorKey}Mode`];

  // Get all display values for current canonical price
  const displayValues = useMemo(() => {
    return syncAllModes(
      state.canonicalPrice,
      isJpyPair,
      volume,
      contractSize,
      equity
    );
  }, [state.canonicalPrice, isJpyPair, volume, contractSize, equity]);

  // Check if within stop level
  const stopLevelWarning = useMemo(() => {
    if (!state.enabled) return null;
    
    const validation = validateTpSlStopLevel(
      state.canonicalPrice + currentPrice,
      currentPrice,
      side,
      stopLevelPips,
      isJpyPair
    );
    
    return validation.withinStopLevel ? validation.error : null;
  }, [state.enabled, state.canonicalPrice, currentPrice, side, stopLevelPips, isJpyPair]);

  const handleValueChange = useCallback(
    (newValue: number) => {
      // Convert from selected mode to canonical price
      const canonicalPrice = modeToCanonicalPrice(
        state.mode,
        newValue,
        isJpyPair,
        volume,
        contractSize,
        equity
      );
      onValueChange(newValue, state.mode);
    },
    [state.mode, isJpyPair, volume, contractSize, equity, onValueChange]
  );

  const getInputPlaceholder = (): string => {
    switch (state.mode) {
      case 'price':
        return '1.2000';
      case 'pips':
        return '50';
      case 'money':
        return '100.00';
      case '%':
        return '1.5';
      default:
        return '';
    }
  };

  const getDisplayValue = (): string => {
    const value = displayValues[state.mode];
    if (state.mode === 'price') return value.toFixed(isJpyPair ? 3 : 5);
    if (state.mode === 'pips') return value.toFixed(1);
    if (state.mode === 'money') return value.toFixed(2);
    if (state.mode === '%') return value.toFixed(2);
    return value.toString();
  };

  const getPreviewText = (): string => {
    if (state.mode === 'price') {
      return `≈ ${displayValues.price.toFixed(isJpyPair ? 3 : 5)}`;
    }
    if (state.mode === 'pips') {
      return `≈ ${displayValues.pips.toFixed(1)} pips`;
    }
    if (state.mode === 'money') {
      return `≈ $${displayValues.money.toFixed(2)}`;
    }
    return `≈ ${displayValues.percent.toFixed(2)}%`;
  };

  return (
    <div className="space-y-3 rounded-lg border border-gray-700 bg-gray-800 p-4">
      {/* Header with Toggle */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-400 uppercase">{label}</label>
        <button
          onClick={() => onToggle(!state.enabled)}
          disabled={disabled}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            state.enabled ? 'bg-green-600' : 'bg-gray-600'
          } disabled:opacity-50`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              state.enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Collapsible Content */}
      {state.enabled && (
        <div className="space-y-3 border-t border-gray-700 pt-3">
          {/* Mode Selector */}
          <div className="grid grid-cols-4 gap-1">
            {(['price', 'pips', 'money', '%'] as const).map((mode) => (
              <ModeButton
                key={mode}
                mode={mode}
                isActive={state.mode === mode}
                onClick={() => onModeChange(mode)}
                disabled={disabled}
              />
            ))}
          </div>

          {/* Value Input */}
          <div>
            <input
              type="number"
              value={displayValues[state.mode].toString()}
              onChange={(e) => handleValueChange(parseFloat(e.target.value) || 0)}
              placeholder={getInputPlaceholder()}
              disabled={disabled}
              className={`w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none ${
                modeError ? 'border-red-500' : ''
              }`}
            />
            {modeError && (
              <p className="mt-1 text-xs text-red-400">{modeError}</p>
            )}
          </div>

          {/* Preview and Synced Modes */}
          <div className="rounded-md bg-gray-900 p-2 space-y-1">
            <p className="text-xs text-gray-500">
              {getPreviewText()}
            </p>
            
            {state.mode !== 'price' && (
              <p className="text-xs text-gray-600">
                ≈ {displayValues.price.toFixed(isJpyPair ? 3 : 5)} (price)
              </p>
            )}
            
            {state.mode !== 'money' && volume > 0 && (
              <p className="text-xs text-gray-600">
                ≈ ${displayValues.money.toFixed(2)} (money)
              </p>
            )}
          </div>

          {/* Stop Level Warning */}
          {stopLevelWarning && (
            <div className="rounded-md bg-red-900 bg-opacity-30 border border-red-700 p-2">
              <p className="text-xs text-red-300">
                ⚠ {stopLevelWarning}
              </p>
            </div>
          )}

          {/* Level Info */}
          <div className="text-xs text-gray-600">
            <p>
              {isStopLoss
                ? `SL Level: ${(state.canonicalPrice + currentPrice).toFixed(isJpyPair ? 3 : 5)}`
                : `TP Level: ${(state.canonicalPrice + currentPrice).toFixed(isJpyPair ? 3 : 5)}`
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
