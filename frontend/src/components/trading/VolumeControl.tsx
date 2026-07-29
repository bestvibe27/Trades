import React, { useState, useCallback } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { validateVolume, calculateLotSizeFromRisk, calculateRiskFromLotSize } from '@/utils/calculations';

export interface VolumeControlProps {
  volume: number;
  onVolumeChange: (volume: number) => void;
  volumeMode: 'lots' | 'risk';
  onVolumeModeChange: (mode: 'lots' | 'risk') => void;
  minLot: number;
  maxLot: number;
  stepLot: number;
  contractSize: number;
  riskAmount?: number;
  onRiskAmountChange?: (amount: number) => void;
  riskSlLevel?: number;
  onRiskSlLevelChange?: (level: number) => void;
  isJpyPair: boolean;
  marginRequired?: number;
  isLoading?: boolean;
  disabled?: boolean;
  errors?: Record<string, string>;
}

export const VolumeControl: React.FC<VolumeControlProps> = ({
  volume,
  onVolumeChange,
  volumeMode,
  onVolumeModeChange,
  minLot,
  maxLot,
  stepLot,
  contractSize,
  riskAmount = 100,
  onRiskAmountChange,
  riskSlLevel = 50,
  onRiskSlLevelChange,
  isJpyPair,
  marginRequired,
  isLoading = false,
  disabled = false,
  errors = {},
}) => {
  const volumeError = errors.volume || errors.volumeValidation;
  const riskError = errors.risk || errors.riskValidation;

  // Validate current volume
  const volumeValidation = validateVolume(volume, minLot, maxLot, stepLot);

  // Calculate equivalent lot from risk
  const lotFromRisk = React.useMemo(() => {
    if (volumeMode === 'risk' && riskSlLevel && riskSlLevel > 0) {
      return calculateLotSizeFromRisk(riskAmount, riskSlLevel, contractSize, isJpyPair);
    }
    return volume;
  }, [volumeMode, riskAmount, riskSlLevel, contractSize, isJpyPair, volume]);

  // Calculate equivalent risk from lot
  const riskFromLot = React.useMemo(() => {
    if (volumeMode === 'lots' && riskSlLevel && riskSlLevel > 0) {
      return calculateRiskFromLotSize(volume, riskSlLevel, contractSize, isJpyPair);
    }
    return riskAmount;
  }, [volumeMode, volume, riskSlLevel, contractSize, isJpyPair, riskAmount]);

  const handleVolumeChange = useCallback(
    (newVolume: number) => {
      // Clamp to min/max bounds
      const clamped = Math.max(minLot, Math.min(maxLot, newVolume));
      onVolumeChange(clamped);
    },
    [minLot, maxLot, onVolumeChange]
  );

  const handleIncrement = useCallback(() => {
    handleVolumeChange(volume + stepLot);
  }, [volume, stepLot, handleVolumeChange]);

  const handleDecrement = useCallback(() => {
    handleVolumeChange(volume - stepLot);
  }, [volume, stepLot, handleVolumeChange]);

  const handleRiskAmountChange = useCallback(
    (newRisk: number) => {
      onRiskAmountChange?.(Math.max(0, newRisk));
      // Auto-calculate lot from risk
      if (riskSlLevel && riskSlLevel > 0) {
        const newLot = calculateLotSizeFromRisk(newRisk, riskSlLevel, contractSize, isJpyPair);
        handleVolumeChange(newLot);
      }
    },
    [onRiskAmountChange, riskSlLevel, contractSize, isJpyPair, handleVolumeChange]
  );

  const handleRiskSlLevelChange = useCallback(
    (newLevel: number) => {
      onRiskSlLevelChange?.(Math.max(1, newLevel));
      // Auto-recalculate lot with new SL level
      if (newLevel > 0) {
        const newLot = calculateLotSizeFromRisk(riskAmount, newLevel, contractSize, isJpyPair);
        handleVolumeChange(newLot);
      }
    },
    [onRiskSlLevelChange, riskAmount, contractSize, isJpyPair, handleVolumeChange]
  );

  return (
    <div className="space-y-3 rounded-lg border border-gray-700 bg-gray-800 p-4">
      {/* Mode Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => onVolumeModeChange('lots')}
          className={`flex-1 rounded-md py-2 px-3 text-sm font-medium transition-colors ${
            volumeMode === 'lots'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
          disabled={disabled}
        >
          Volume (Lots)
        </button>
        <button
          onClick={() => onVolumeModeChange('risk')}
          className={`flex-1 rounded-md py-2 px-3 text-sm font-medium transition-colors ${
            volumeMode === 'risk'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
          disabled={disabled}
        >
          Risk Mode
        </button>
      </div>

      {/* Lots Mode */}
      {volumeMode === 'lots' && (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-400 uppercase">Volume (Lots)</label>
            <div className="mt-1 flex items-center gap-2">
              <button
                onClick={handleDecrement}
                disabled={disabled || volume <= minLot}
                className="rounded-md bg-gray-700 p-2 text-gray-300 hover:bg-gray-600 disabled:opacity-50"
              >
                <ChevronDownIcon className="h-4 w-4" />
              </button>

              <input
                type="number"
                value={volume.toString()}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value) || 0)}
                step={stepLot}
                min={minLot}
                max={maxLot}
                disabled={disabled}
                className={`flex-1 rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-center text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none ${
                  volumeError ? 'border-red-500' : ''
                }`}
              />

              <button
                onClick={handleIncrement}
                disabled={disabled || volume >= maxLot}
                className="rounded-md bg-gray-700 p-2 text-gray-300 hover:bg-gray-600 disabled:opacity-50"
              >
                <ChevronUpIcon className="h-4 w-4" />
              </button>
            </div>
            {volumeError && <p className="mt-1 text-xs text-red-400">{volumeError}</p>}
            <p className="mt-1 text-xs text-gray-500">
              ≈ {(volume * contractSize).toLocaleString()} units
            </p>
          </div>

          {marginRequired !== undefined && (
            <div className="rounded-md bg-gray-900 p-2">
              <p className="text-xs text-gray-500">
                {isLoading ? (
                  <>Est. Margin: <span className="animate-pulse">Loading...</span></>
                ) : (
                  <>Est. Margin: <span className="text-gray-300">${marginRequired.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></>
                )}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Risk Mode */}
      {volumeMode === 'risk' && (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-400 uppercase">Risk Amount ($)</label>
            <input
              type="number"
              value={riskAmount.toString()}
              onChange={(e) => handleRiskAmountChange(parseFloat(e.target.value) || 0)}
              step="10"
              min="0"
              disabled={disabled}
              className={`w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none ${
                riskError ? 'border-red-500' : ''
              }`}
            />
            {riskError && <p className="mt-1 text-xs text-red-400">{riskError}</p>}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-400 uppercase">SL Distance (Pips)</label>
            <input
              type="number"
              value={riskSlLevel?.toString() || '50'}
              onChange={(e) => handleRiskSlLevelChange(parseFloat(e.target.value) || 50)}
              step="5"
              min="1"
              disabled={disabled}
              className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="rounded-md bg-gray-900 p-2 space-y-1">
            <p className="text-xs text-gray-500">
              Calculated Volume: <span className="text-gray-300">{lotFromRisk.toFixed(2)} lots</span>
            </p>
            {marginRequired !== undefined && (
              <p className="text-xs text-gray-500">
                {isLoading ? (
                  <>Est. Margin: <span className="animate-pulse">Loading...</span></>
                ) : (
                  <>Est. Margin: <span className="text-gray-300">${marginRequired.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></>
                )}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Constraints Info */}
      <div className="rounded-md bg-gray-900 p-2 text-xs text-gray-500">
        <p>Min: {minLot} | Max: {maxLot} | Step: {stepLot}</p>
      </div>
    </div>
  );
};
