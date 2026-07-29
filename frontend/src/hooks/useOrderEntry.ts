import { useState, useCallback, useRef, useEffect } from 'react';
import { OrderEntryState, InstrumentConfig, TpSlMode } from '@/types/trading';
import { validateVolume, syncAllModes } from '@/utils/calculations';
import { getBrokerSymbolInfo, placeBrokerMarketOrder } from '@/services/tradingAPI';

const DEFAULT_TP_STATE: TpSlMode = {
  enabled: false,
  mode: 'price',
  canonicalPrice: 0,
  displayValues: {
    price: 0,
    pips: 0,
    money: 0,
    percent: 0,
  },
};

export interface UseOrderEntryReturn {
  state: OrderEntryState;
  config: InstrumentConfig | null;
  marginRequired: number | undefined;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  updateState: (updates: Partial<OrderEntryState>) => void;
  submitOrder: (order: {
    symbol: string;
    side: 'buy' | 'sell';
    volume: number;
    takeProfit?: number;
    stopLoss?: number;
  }) => Promise<void>;
}

/**
 * Custom hook for order entry state management and API integration
 * Handles volume validation, margin calculation, and order submission
 */
export function useOrderEntry(
  symbol: string,
  currentPrice: number,
  accountEquity: number
): UseOrderEntryReturn {
  // State
  const [state, setState] = useState<OrderEntryState>({
    symbol,
    side: 'buy',
    volume: 0.1,
    volumeMode: 'lots',
    riskAmount: 100,
    riskSlLevel: 50,
    takeProfit: DEFAULT_TP_STATE,
    stopLoss: DEFAULT_TP_STATE,
    errors: {},
  });

  const [config, setConfig] = useState<InstrumentConfig | null>(null);
  const [marginRequired, setMarginRequired] = useState<number | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for debouncing
  const marginDebounceRef = useRef<NodeJS.Timeout>();
  const configFetchRef = useRef<boolean>(false);

  // Fetch instrument config on mount or symbol change
  useEffect(() => {
    if (configFetchRef.current) return;
    configFetchRef.current = true;

    const fetchConfig = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const symbolInfo = await getBrokerSymbolInfo(symbol);
        
        // Parse symbol info into InstrumentConfig
        const newConfig: InstrumentConfig = {
          symbol,
          minLot: symbolInfo.volume_min || 0.01,
          maxLot: symbolInfo.volume_max || 100,
          stepLot: symbolInfo.volume_step || 0.01,
          pipSize: symbolInfo.digits || 5,
          contractSize: symbolInfo.contract_size || 100000,
          stopLevelPips: symbolInfo.stop_level || 20,
          marginRequirement: symbolInfo.margin || 2, // 2% as default
          isJpyPair: symbol.includes('JPY'),
        };

        setConfig(newConfig);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load instrument config';
        setError(message);
        console.error('[v0] Error fetching config:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, [symbol]);

  // Calculate margin (debounced)
  useEffect(() => {
    if (!config || state.volume === 0) {
      setMarginRequired(undefined);
      return;
    }

    if (marginDebounceRef.current) {
      clearTimeout(marginDebounceRef.current);
    }

    marginDebounceRef.current = setTimeout(async () => {
      try {
        // Simplified margin calculation: volume * contract_size * currentPrice * margin%
        const estimated =
          (state.volume * config.contractSize * currentPrice * config.marginRequirement) / 100;
        setMarginRequired(estimated);
      } catch (err) {
        console.error('[v0] Margin calculation error:', err);
      }
    }, 200); // 200ms debounce

    return () => {
      if (marginDebounceRef.current) {
        clearTimeout(marginDebounceRef.current);
      }
    };
  }, [state.volume, config, currentPrice]);

  // Update state with validation
  const updateState = useCallback(
    (updates: Partial<OrderEntryState>) => {
      setState((prev) => {
        const next = { ...prev, ...updates };

        // Validate volume
        if (updates.volume !== undefined && config) {
          const validation = validateVolume(
            updates.volume,
            config.minLot,
            config.maxLot,
            config.stepLot
          );

          next.errors = { ...prev.errors };
          if (!validation.isValid && validation.error) {
            next.errors.volumeValidation = validation.error;
          } else {
            delete next.errors.volumeValidation;
          }
        }

        // Sync TP/SL display values if volume changes
        if (updates.volume !== undefined && (prev.takeProfit.enabled || prev.stopLoss.enabled)) {
          if (prev.takeProfit.enabled && config) {
            const displayValues = syncAllModes(
              prev.takeProfit.canonicalPrice,
              config.isJpyPair,
              updates.volume || prev.volume,
              config.contractSize,
              accountEquity
            );
            next.takeProfit = {
              ...prev.takeProfit,
              displayValues,
            };
          }

          if (prev.stopLoss.enabled && config) {
            const displayValues = syncAllModes(
              prev.stopLoss.canonicalPrice,
              config.isJpyPair,
              updates.volume || prev.volume,
              config.contractSize,
              accountEquity
            );
            next.stopLoss = {
              ...prev.stopLoss,
              displayValues,
            };
          }
        }

        return next;
      });
    },
    [config, accountEquity]
  );

  // Submit order
  const submitOrder = useCallback(
    async (order: {
      symbol: string;
      side: 'buy' | 'sell';
      volume: number;
      takeProfit?: number;
      stopLoss?: number;
    }) => {
      try {
        setIsSubmitting(true);
        setError(null);

        // Validate before submission
        if (!config) {
          throw new Error('Instrument config not loaded');
        }

        const validation = validateVolume(
          order.volume,
          config.minLot,
          config.maxLot,
          config.stepLot
        );

        if (!validation.isValid) {
          throw new Error(validation.error || 'Invalid volume');
        }

        // Submit via API
        const response = await placeBrokerMarketOrder({
          symbol: order.symbol,
          side: order.side,
          volume: order.volume,
          stopLoss: order.stopLoss,
          takeProfit: order.takeProfit,
        });

        // Reset state on success
        setState({
          symbol: order.symbol,
          side: 'buy',
          volume: config.minLot,
          volumeMode: 'lots',
          riskAmount: 100,
          riskSlLevel: 50,
          takeProfit: DEFAULT_TP_STATE,
          stopLoss: DEFAULT_TP_STATE,
          errors: {},
        });

        console.log('[v0] Order placed successfully:', response);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to place order';
        setError(message);
        console.error('[v0] Order submission error:', err);
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [config]
  );

  return {
    state,
    config,
    marginRequired,
    isLoading,
    isSubmitting,
    error,
    updateState,
    submitOrder,
  };
}
