import React, { useState, useCallback } from 'react';
import { VolumeControl } from './VolumeControl';
import { TpSlControl } from './TpSlControl';
import { OrderEntryState, InstrumentConfig } from '@/types/trading';
import { validateVolume } from '@/utils/calculations';

export interface OrderEntryPanelProps {
  state: OrderEntryState;
  config: InstrumentConfig;
  currentPrice: number;
  equity: number;
  marginRequired?: number;
  isLoading?: boolean;
  isSubmitting?: boolean;
  onStateChange: (updates: Partial<OrderEntryState>) => void;
  onSubmit: (order: {
    symbol: string;
    side: 'buy' | 'sell';
    volume: number;
    takeProfit?: number;
    stopLoss?: number;
  }) => void;
  disabled?: boolean;
}

export const OrderEntryPanel: React.FC<OrderEntryPanelProps> = ({
  state,
  config,
  currentPrice,
  equity,
  marginRequired,
  isLoading = false,
  isSubmitting = false,
  onStateChange,
  onSubmit,
  disabled = false,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Validate current state
  const volumeValidation = validateVolume(state.volume, config.minLot, config.maxLot, config.stepLot);
  const hasErrors = !volumeValidation.isValid || Object.keys(state.errors).length > 0;
  const canSubmit = !hasErrors && state.volume > 0 && !isSubmitting && !disabled;

  // Calculate P&L range preview
  const pnlPreview = React.useMemo(() => {
    if (state.volume === 0) return { min: 0, max: 0 };

    let minPrice = currentPrice;
    let maxPrice = currentPrice;

    if (state.stopLoss.enabled) {
      minPrice = Math.min(minPrice, state.stopLoss.canonicalPrice + currentPrice);
    }
    if (state.takeProfit.enabled) {
      maxPrice = Math.max(maxPrice, state.takeProfit.canonicalPrice + currentPrice);
    }

    const pnlMin =
      state.side === 'buy'
        ? (minPrice - currentPrice) * state.volume * config.contractSize
        : (currentPrice - minPrice) * state.volume * config.contractSize;

    const pnlMax =
      state.side === 'buy'
        ? (maxPrice - currentPrice) * state.volume * config.contractSize
        : (currentPrice - maxPrice) * state.volume * config.contractSize;

    return { min: pnlMin, max: pnlMax };
  }, [state.volume, state.side, state.stopLoss.enabled, state.takeProfit.enabled, state.stopLoss.canonicalPrice, state.takeProfit.canonicalPrice, currentPrice, config.contractSize]);

  const handleVolumeChange = useCallback(
    (volume: number) => {
      onStateChange({ volume });
    },
    [onStateChange]
  );

  const handleVolumeModeChange = useCallback(
    (mode: 'lots' | 'risk') => {
      onStateChange({ volumeMode: mode });
    },
    [onStateChange]
  );

  const handleRiskAmountChange = useCallback(
    (amount: number) => {
      onStateChange({ riskAmount: amount });
    },
    [onStateChange]
  );

  const handleRiskSlLevelChange = useCallback(
    (level: number) => {
      onStateChange({ riskSlLevel: level });
    },
    [onStateChange]
  );

  const handleTpToggle = useCallback(
    (enabled: boolean) => {
      onStateChange({
        takeProfit: { ...state.takeProfit, enabled },
      });
    },
    [state.takeProfit, onStateChange]
  );

  const handleTpModeChange = useCallback(
    (mode: 'price' | 'pips' | 'money' | '%') => {
      onStateChange({
        takeProfit: { ...state.takeProfit, mode },
      });
    },
    [state.takeProfit, onStateChange]
  );

  const handleTpValueChange = useCallback(
    (value: number, mode: 'price' | 'pips' | 'money' | '%') => {
      onStateChange({
        takeProfit: {
          ...state.takeProfit,
          canonicalPrice:
            mode === 'price'
              ? value - currentPrice
              : state.takeProfit.canonicalPrice,
        },
      });
    },
    [state.takeProfit, currentPrice, onStateChange]
  );

  const handleSlToggle = useCallback(
    (enabled: boolean) => {
      onStateChange({
        stopLoss: { ...state.stopLoss, enabled },
      });
    },
    [state.stopLoss, onStateChange]
  );

  const handleSlModeChange = useCallback(
    (mode: 'price' | 'pips' | 'money' | '%') => {
      onStateChange({
        stopLoss: { ...state.stopLoss, mode },
      });
    },
    [state.stopLoss, onStateChange]
  );

  const handleSlValueChange = useCallback(
    (value: number, mode: 'price' | 'pips' | 'money' | '%') => {
      onStateChange({
        stopLoss: {
          ...state.stopLoss,
          canonicalPrice:
            mode === 'price'
              ? value - currentPrice
              : state.stopLoss.canonicalPrice,
        },
      });
    },
    [state.stopLoss, currentPrice, onStateChange]
  );

  const handleSubmit = useCallback(() => {
    const tpLevel = state.takeProfit.enabled
      ? state.takeProfit.canonicalPrice + currentPrice
      : undefined;
    const slLevel = state.stopLoss.enabled
      ? state.stopLoss.canonicalPrice + currentPrice
      : undefined;

    onSubmit({
      symbol: state.symbol,
      side: state.side,
      volume: state.volume,
      takeProfit: tpLevel,
      stopLoss: slLevel,
    });
  }, [state.symbol, state.side, state.volume, state.takeProfit, state.stopLoss, currentPrice, onSubmit]);

  return (
    <div className="w-full max-w-sm mx-auto rounded-lg border border-gray-700 bg-gray-900 p-4 space-y-4 text-white shadow-xl">
      {/* Header */}
      <div className="border-b border-gray-700 pb-4">
        <h2 className="text-lg font-bold">{config.symbol}</h2>
        <p className="text-xs text-gray-400">
          Price: {currentPrice.toFixed(config.isJpyPair ? 3 : 5)}
        </p>
      </div>

      {/* Buy/Sell Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => onStateChange({ side: 'buy' })}
          disabled={disabled}
          className={`flex-1 rounded-lg py-3 px-4 font-bold transition-colors ${
            state.side === 'buy'
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          } disabled:opacity-50`}
        >
          BUY
        </button>
        <button
          onClick={() => onStateChange({ side: 'sell' })}
          disabled={disabled}
          className={`flex-1 rounded-lg py-3 px-4 font-bold transition-colors ${
            state.side === 'sell'
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          } disabled:opacity-50`}
        >
          SELL
        </button>
      </div>

      {/* Volume Control */}
      <VolumeControl
        volume={state.volume}
        onVolumeChange={handleVolumeChange}
        volumeMode={state.volumeMode}
        onVolumeModeChange={handleVolumeModeChange}
        minLot={config.minLot}
        maxLot={config.maxLot}
        stepLot={config.stepLot}
        contractSize={config.contractSize}
        riskAmount={state.riskAmount}
        onRiskAmountChange={handleRiskAmountChange}
        riskSlLevel={state.riskSlLevel}
        onRiskSlLevelChange={handleRiskSlLevelChange}
        isJpyPair={config.isJpyPair}
        marginRequired={marginRequired}
        isLoading={isLoading}
        disabled={disabled}
        errors={state.errors}
      />

      {/* Advanced Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
      >
        {showAdvanced ? '▼' : '▶'} Take Profit / Stop Loss
      </button>

      {/* TP/SL Controls */}
      {showAdvanced && (
        <div className="space-y-3 border-t border-gray-700 pt-4">
          <TpSlControl
            label="Take Profit"
            state={state.takeProfit}
            onToggle={handleTpToggle}
            onModeChange={handleTpModeChange}
            onValueChange={handleTpValueChange}
            currentPrice={currentPrice}
            volume={state.volume}
            contractSize={config.contractSize}
            equity={equity}
            isJpyPair={config.isJpyPair}
            stopLevelPips={config.stopLevelPips}
            side={state.side}
            disabled={disabled}
            errors={state.errors}
          />

          <TpSlControl
            label="Stop Loss"
            state={state.stopLoss}
            onToggle={handleSlToggle}
            onModeChange={handleSlModeChange}
            onValueChange={handleSlValueChange}
            currentPrice={currentPrice}
            volume={state.volume}
            contractSize={config.contractSize}
            equity={equity}
            isJpyPair={config.isJpyPair}
            stopLevelPips={config.stopLevelPips}
            side={state.side}
            disabled={disabled}
            errors={state.errors}
          />
        </div>
      )}

      {/* Summary */}
      <div className="rounded-lg bg-gray-800 p-3 space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-400">Volume:</span>
          <span className="text-white font-medium">
            {state.volume.toFixed(2)} lots
          </span>
        </div>
        {marginRequired !== undefined && (
          <div className="flex justify-between">
            <span className="text-gray-400">Margin:</span>
            <span className="text-white font-medium">
              ${marginRequired.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>
        )}
        {state.volume > 0 && (
          <div className="flex justify-between pt-1 border-t border-gray-700">
            <span className="text-gray-400">P&L Range:</span>
            <span className="text-white font-medium">
              ${pnlPreview.min.toLocaleString(undefined, { maximumFractionDigits: 0 })} → $
              {pnlPreview.max.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
        )}
      </div>

      {/* Error Display */}
      {Object.entries(state.errors).map(([key, error]) => (
        !['volume', 'takeProfit', 'stopLoss'].includes(key) && (
          <div key={key} className="rounded-lg bg-red-900 bg-opacity-30 border border-red-700 p-2">
            <p className="text-xs text-red-300">{error}</p>
          </div>
        )
      ))}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4 border-t border-gray-700">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`flex-1 rounded-lg py-3 px-4 font-bold transition-colors ${
            state.side === 'buy'
              ? 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50'
              : 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50'
          }`}
        >
          {isSubmitting ? 'Placing...' : `${state.side.toUpperCase()} ORDER`}
        </button>
      </div>

      {/* Info Text */}
      {hasErrors && (
        <p className="text-xs text-red-400 text-center">
          {volumeValidation.error || 'Please check your inputs'}
        </p>
      )}
    </div>
  );
};
