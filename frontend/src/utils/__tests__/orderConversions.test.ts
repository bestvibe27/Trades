import {
  convertPipsToPrice,
  convertPriceToPips,
  convertPriceToMoney,
  convertPriceToPercent,
  convertMoneyToPrice,
  convertPercentToPrice,
  syncAllModes,
  modeToCanonicalPrice,
  validateVolume,
  validateTpSlStopLevel,
  calculateLotSizeFromRisk,
  calculateRiskFromLotSize,
} from '../calculations';

describe('Order Entry Conversion Utilities', () => {
  // Test data
  const EURUSD = { isJpy: false, contractSize: 100000 };
  const USDJPY = { isJpy: true, contractSize: 100000 };
  const equity = 10000;

  describe('Pip to Price Conversions', () => {
    it('should convert pips to price for non-JPY pairs (0.0001 pip value)', () => {
      expect(convertPipsToPrice(50, false)).toBeCloseTo(0.005, 6);
      expect(convertPipsToPrice(100, false)).toBeCloseTo(0.01, 6);
      expect(convertPipsToPrice(1, false)).toBeCloseTo(0.0001, 6);
    });

    it('should convert pips to price for JPY pairs (0.01 pip value)', () => {
      expect(convertPipsToPrice(50, true)).toBeCloseTo(0.5, 6);
      expect(convertPipsToPrice(100, true)).toBeCloseTo(1.0, 6);
      expect(convertPipsToPrice(1, true)).toBeCloseTo(0.01, 6);
    });

    it('should convert price back to pips for non-JPY pairs', () => {
      expect(convertPriceToPips(0.005, false)).toBeCloseTo(50, 6);
      expect(convertPriceToPips(0.01, false)).toBeCloseTo(100, 6);
      expect(convertPriceToPips(0.0001, false)).toBeCloseTo(1, 6);
    });

    it('should convert price back to pips for JPY pairs', () => {
      expect(convertPriceToPips(0.5, true)).toBeCloseTo(50, 6);
      expect(convertPriceToPips(1.0, true)).toBeCloseTo(100, 6);
      expect(convertPriceToPips(0.01, true)).toBeCloseTo(1, 6);
    });
  });

  describe('Price to Money Conversions', () => {
    it('should convert price distance to money correctly', () => {
      // 0.01 price distance * 0.1 lot (10000 units) * 100000 contract size = $10,000
      expect(convertPriceToMoney(0.01, 0.1, 100000)).toBeCloseTo(100, 2);
      expect(convertPriceToMoney(0.001, 1.0, 100000)).toBeCloseTo(100, 2);
    });

    it('should reverse: convert money back to price distance', () => {
      // $100 / (0.1 lot * 100000 contract size) = 0.01 price distance
      expect(convertMoneyToPrice(100, 0.1, 100000)).toBeCloseTo(0.01, 6);
      expect(convertMoneyToPrice(100, 1.0, 100000)).toBeCloseTo(0.001, 6);
    });

    it('should handle zero volume gracefully', () => {
      expect(convertMoneyToPrice(100, 0, 100000)).toBe(0);
    });
  });

  describe('Price to Percent Conversions', () => {
    it('should convert price distance to equity percentage', () => {
      // $10,000 equity, 0.01 price * 0.1 lot * 100000 = $100 = 1%
      const percent = convertPriceToPercent(0.01, 0.1, 100000, 10000);
      expect(percent).toBeCloseTo(1.0, 2);
    });

    it('should reverse: convert percent back to price distance', () => {
      // 1% of $10,000 = $100, then back to price distance
      const price = convertPercentToPrice(1.0, 0.1, 100000, 10000);
      expect(price).toBeCloseTo(0.01, 6);
    });

    it('should handle zero equity gracefully', () => {
      expect(convertPriceToPercent(0.01, 0.1, 100000, 0)).toBe(0);
    });
  });

  describe('syncAllModes - Canonical Price Synchronization', () => {
    it('should sync all display modes from a canonical price distance', () => {
      const canonical = 0.005; // 50 pips for EURUSD
      const result = syncAllModes(canonical, false, 1.0, 100000, equity);

      expect(result.price).toBeCloseTo(0.005, 6);
      expect(result.pips).toBeCloseTo(50, 2);
      expect(result.money).toBeCloseTo(500, 2); // 0.005 * 1 * 100000
      expect(result.percent).toBeCloseTo(5, 2); // (500 / 10000) * 100
    });

    it('should maintain consistency across modes for JPY pairs', () => {
      const canonical = 0.5; // 50 pips for USDJPY
      const result = syncAllModes(canonical, true, 1.0, 100000, equity);

      expect(result.price).toBeCloseTo(0.5, 6);
      expect(result.pips).toBeCloseTo(50, 2);
      expect(result.money).toBeCloseTo(5000, 2);
      expect(result.percent).toBeCloseTo(50, 2);
    });
  });

  describe('modeToCanonicalPrice - Mode Conversions', () => {
    it('should convert from any mode to canonical price for non-JPY', () => {
      // From pips
      expect(modeToCanonicalPrice('pips', 50, false, 1.0, 100000, equity))
        .toBeCloseTo(0.005, 6);

      // From money
      expect(modeToCanonicalPrice('money', 500, false, 1.0, 100000, equity))
        .toBeCloseTo(0.005, 6);

      // From percent
      expect(modeToCanonicalPrice('%', 5, false, 1.0, 100000, equity))
        .toBeCloseTo(0.005, 6);

      // From price (identity)
      expect(modeToCanonicalPrice('price', 0.005, false, 1.0, 100000, equity))
        .toBeCloseTo(0.005, 6);
    });

    it('should convert from any mode to canonical price for JPY', () => {
      // From pips
      expect(modeToCanonicalPrice('pips', 50, true, 1.0, 100000, equity))
        .toBeCloseTo(0.5, 6);

      // From money
      expect(modeToCanonicalPrice('money', 5000, true, 1.0, 100000, equity))
        .toBeCloseTo(0.5, 6);
    });
  });

  describe('validateVolume - Volume Constraints', () => {
    it('should validate volume within min/max bounds', () => {
      const result = validateVolume(0.5, 0.1, 10, 0.1);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject volume below minimum', () => {
      const result = validateVolume(0.05, 0.1, 10, 0.1);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Minimum');
    });

    it('should reject volume above maximum', () => {
      const result = validateVolume(15, 0.1, 10, 0.1);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Maximum');
    });

    it('should enforce step size validation', () => {
      // 0.5 is not a valid multiple of 0.1 starting from 0.1 min
      // Valid: 0.1, 0.2, 0.3, ..., so 0.5 starting from 0.1 should be valid
      const result = validateVolume(0.5, 0.1, 10, 0.1);
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid step increments', () => {
      // Starting from 1.0, step 0.25: valid are 1.0, 1.25, 1.5, 1.75, 2.0, etc.
      // 1.3 is not valid
      const result = validateVolume(1.3, 1.0, 10, 0.25);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('step');
    });
  });

  describe('validateTpSlStopLevel - Stop Level Enforcement', () => {
    it('should allow TP/SL outside of broker stop level', () => {
      const result = validateTpSlStopLevel(
        1.1200, // target level
        1.1000, // current price
        'buy',
        20, // 20 pips minimum
        false // not JPY
      );
      expect(result.isValid).toBe(true);
      expect(result.withinStopLevel).toBe(false);
    });

    it('should reject TP/SL inside broker stop level', () => {
      const result = validateTpSlStopLevel(
        1.1010, // target level (only 10 pips away)
        1.1000, // current price
        'buy',
        20, // 20 pips minimum
        false // not JPY
      );
      expect(result.isValid).toBe(false);
      expect(result.withinStopLevel).toBe(true);
      expect(result.error).toContain('stop-level');
    });

    it('should apply different stop level for JPY pairs', () => {
      // For JPY: 20 pips = 0.20 price distance
      const result = validateTpSlStopLevel(
        110.15, // target (only 0.15 away)
        110.00, // current
        'buy',
        20, // 20 pips
        true // JPY pair
      );
      expect(result.isValid).toBe(false);
      expect(result.withinStopLevel).toBe(true);
    });
  });

  describe('Risk Calculator - Lot from Risk', () => {
    it('should calculate lot size from risk amount and SL distance', () => {
      // Risk $100, SL 50 pips, EURUSD
      // SL distance = 50 * 0.0001 = 0.005
      // Lot = $100 / (0.005 * 100000) = 0.2
      const lot = calculateLotSizeFromRisk(100, 50, 100000, false);
      expect(lot).toBeCloseTo(0.2, 3);
    });

    it('should calculate lot size for JPY pairs', () => {
      // Risk $100, SL 50 pips, USDJPY
      // SL distance = 50 * 0.01 = 0.5
      // Lot = $100 / (0.5 * 100000) = 0.002
      const lot = calculateLotSizeFromRisk(100, 50, 100000, true);
      expect(lot).toBeCloseTo(0.002, 6);
    });

    it('should reverse: calculate risk from lot size', () => {
      // Lot 0.2, SL 50 pips, EURUSD
      // Risk = 0.005 * 0.2 * 100000 = $100
      const risk = calculateRiskFromLotSize(0.2, 50, 100000, false);
      expect(risk).toBeCloseTo(100, 2);
    });

    it('should handle zero SL level gracefully', () => {
      const lot = calculateLotSizeFromRisk(100, 0, 100000, false);
      expect(lot).toBe(0);
    });
  });

  describe('Integration - Full Trade Scenario', () => {
    it('should maintain consistency in a buy order with TP and SL', () => {
      // Setup: EURUSD, buy at 1.1000, 1 lot
      const entryPrice = 1.1000;
      const volume = 1.0;
      const contractSize = 100000;

      // TP at 50 pips profit
      const tpCanonical = convertPipsToPrice(50, false);
      const tpSync = syncAllModes(tpCanonical, false, volume, contractSize, equity);

      // SL at 30 pips loss
      const slCanonical = -convertPipsToPrice(30, false);
      const slSync = syncAllModes(slCanonical, false, volume, contractSize, equity);

      // Verify TP
      expect(tpSync.pips).toBeCloseTo(50, 1);
      expect(tpSync.money).toBeCloseTo(5000, 0); // 50 pips * 100,000 units = $5,000

      // Verify SL
      expect(slSync.pips).toBeCloseTo(-30, 1);
      expect(slSync.money).toBeCloseTo(-3000, 0);

      // Verify risk/reward ratio
      const rr = Math.abs(tpSync.money / slSync.money);
      expect(rr).toBeCloseTo(5 / 3, 2); // 5000 / 3000
    });

    it('should handle complex multi-leg risk calculation', () => {
      // User wants to risk $200 with SL at 40 pips
      const riskAmount = 200;
      const slPips = 40;

      // Calculate required lot
      const requiredLot = calculateLotSizeFromRisk(riskAmount, slPips, 100000, false);

      // Verify by calculating risk back
      const verifyRisk = calculateRiskFromLotSize(requiredLot, slPips, 100000, false);
      expect(verifyRisk).toBeCloseTo(riskAmount, 2);
    });
  });
});
