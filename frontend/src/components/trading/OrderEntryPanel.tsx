import React, { useState, useCallback } from 'react';
import { ChevronUpIcon, ChevronDownIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
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
  // Validate current state
  const volumeValidation = validateVolume(state.volume, config.minLot, config.maxLot, config.stepLot);
  const hasErrors = !volumeValidation.isValid || Object.keys(state.errors).length > 0;
  const canSubmit = !hasErrors && state.volume > 0 && !isSubmitting && !disabled;

  // Calculate spread percentage
  const sellPrice = currentPrice * 0.995; // Approximate bid (lower)
  const buyPrice = currentPrice * 1.005;  // Approximate ask (higher)
  const spread = buyPrice - sellPrice;
  const midPrice = (sellPrice + buyPrice) / 2;
  const sellPercent = 53; // From screenshot
  const buyPercent = 47;

  const handleVolumeIncrement = useCallback(() => {
    const newVolume = Math.min(
      config.maxLot,
      state.volume + config.stepLot
    );
    onStateChange({ volume: parseFloat(newVolume.toFixed(2)) });
  }, [state.volume, config.maxLot, config.stepLot, onStateChange]);

  const handleVolumeDecrement = useCallback(() => {
    const newVolume = Math.max(
      config.minLot,
      state.volume - config.stepLot
    );
    onStateChange({ volume: parseFloat(newVolume.toFixed(2)) });
  }, [state.volume, config.minLot, config.stepLot, onStateChange]);

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value) || 0;
      onStateChange({ volume: val });
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
          canonicalPrice: mode === 'price' ? value - currentPrice : state.takeProfit.canonicalPrice,
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
          canonicalPrice: mode === 'price' ? value - currentPrice : state.stopLoss.canonicalPrice,
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
    <div className="w-full max-w-xs rounded-lg border border-gray-700 bg-gray-950 p-4 space-y-3 text-white shadow-xl" style={{ fontSize: '13px' }}>
      {/* Price Display - Sell/Buy */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {/* Sell */}
        <div className="rounded-lg border border-gray-700 bg-gray-900 p-3">
          <div className="text-xs text-orange-500 font-medium mb-1">Sell</div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold">{sellPrice.toFixed(2)}</span>
            <span className="text-xs text-orange-400">02</span>
            <span className="text-xs text-gray-500">9</span>
          </div>
        </div>

        {/* Buy */}
        <div className="rounded-lg border border-gray-700 bg-gray-900 p-3">
          <div className="text-xs text-blue-400 font-medium mb-1">Buy</div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold">{buyPrice.toFixed(2)}</span>
            <span className="text-xs text-blue-400">26</span>
            <span className="text-xs text-gray-500">9</span>
          </div>
        </div>
      </div>

      {/* Spread Info */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mb-2">
        <span>{spread.toFixed(5)} USD</span>
      </div>

      {/* Spread Percentage Bar */}
      <div className="flex gap-2 items-center mb-3">
        <div className="flex-1 flex h-2 rounded-full overflow-hidden bg-gray-800">
          <div className="bg-red-600 flex-shrink-0" style={{ width: `${sellPercent}%` }} />
          <div className="bg-blue-600 flex-1" />
        </div>
        <div className="flex gap-2 text-xs">
          <span className="text-red-500 font-medium w-8 text-right">{sellPercent}%</span>
          <span className="text-blue-400 font-medium w-8">{buyPercent}%</span>
        </div>
      </div>

      {/* Market/Pending Tabs */}
      <div className="flex gap-2 mb-3">
        <button className="flex-1 rounded-lg border border-gray-700 bg-gray-900 py-2 px-3 text-xs font-medium text-gray-300 hover:bg-gray-800 transition-colors">
          Market
        </button>
        <button className="flex-1 rounded-lg border border-gray-700 bg-gray-900 py-2 px-3 text-xs font-medium text-gray-400 hover:bg-gray-800 transition-colors">
          Pending
        </button>
      </div>

      {/* Volume Section */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-400">Volume</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={state.volume.toFixed(2)}
            onChange={handleVolumeChange}
            step={config.stepLot}
            min={config.minLot}
            max={config.maxLot}
            disabled={disabled}
            className="flex-1 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
          <button
            onClick={handleVolumeDecrement}
            disabled={disabled || state.volume <= config.minLot}
            className="rounded-lg border border-gray-700 bg-gray-900 p-2 text-gray-400 hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            <ChevronDownIcon className="h-4 w-4" />
          </button>
          <button
            onClick={handleVolumeIncrement}
            disabled={disabled || state.volume >= config.maxLot}
            className="rounded-lg border border-gray-700 bg-gray-900 p-2 text-gray-400 hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            <ChevronUpIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="text-xs text-gray-500 px-3">
          {state.volume.toFixed(2)} Lots
        </div>
      </div>

      {/* Take Profit Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-medium text-gray-400">
            Take Profit
            <InformationCircleIcon className="h-3.5 w-3.5 text-gray-600" />
          </label>
          <button
            onClick={() => handleTpToggle(!state.takeProfit.enabled)}
            disabled={disabled}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              state.takeProfit.enabled ? 'bg-green-600' : 'bg-gray-700'
            } disabled:opacity-50`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                state.takeProfit.enabled ? 'translate-x-4.5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {state.takeProfit.enabled && (
          <div className="space-y-2 border-t border-gray-700 pt-2">
            <div className="flex gap-2">
              <select className="flex-1 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-xs text-gray-400 focus:border-blue-500 focus:outline-none">
                <option>Not set</option>
              </select>
              <button className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-xs font-medium text-gray-400 hover:bg-gray-800 transition-colors">
                Price
              </button>
            </div>

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
              compact={true}
            />
          </div>
        )}
      </div>

      {/* Stop Loss Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-medium text-gray-400">
            Stop Loss
            <InformationCircleIcon className="h-3.5 w-3.5 text-gray-600" />
          </label>
          <button
            onClick={() => handleSlToggle(!state.stopLoss.enabled)}
            disabled={disabled}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              state.stopLoss.enabled ? 'bg-green-600' : 'bg-gray-700'
            } disabled:opacity-50`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                state.stopLoss.enabled ? 'translate-x-4.5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {state.stopLoss.enabled && (
          <div className="space-y-2 border-t border-gray-700 pt-2">
            <div className="flex gap-2">
              <select className="flex-1 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-xs text-gray-400 focus:border-blue-500 focus:outline-none">
                <option>Not set</option>
              </select>
              <button className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-xs font-medium text-gray-400 hover:bg-gray-800 transition-colors">
                Price
              </button>
            </div>

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
              compact={true}
            />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2 border-t border-gray-700">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`flex-1 rounded-lg py-2.5 px-3 text-xs font-bold transition-colors ${
            state.side === 'buy'
              ? 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50'
              : 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50'
          }`}
        >
          {isSubmitting ? 'Placing...' : `${state.side.toUpperCase()}`}
        </button>
        <button
          disabled={disabled}
          className="flex-1 rounded-lg border border-gray-700 bg-gray-900 py-2.5 px-3 text-xs font-bold text-gray-400 hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          CANCEL
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
