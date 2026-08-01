import { describe, it, expect } from "vitest";
import {
  computePriceDelta,
  formatDeltaParts,
  snapVolume,
  validatePendingPrice,
  validateStopDistance,
} from "../orderTicket";

describe("computePriceDelta / color logic", () => {
  it("marks buy TP above entry as positive (green/pos)", () => {
    const d = computePriceDelta(62800, 62790, 0.01, "buy", 0.1, 1);
    expect(d.positive).toBe(true);
    expect(d.usd).toBeGreaterThan(0);
    expect(formatDeltaParts(d).className).toBe("pos");
  });

  it("marks buy SL below entry as negative (red/neg)", () => {
    const d = computePriceDelta(62770, 62790, 0.01, "buy", 0.1, 1);
    expect(d.positive).toBe(false);
    expect(d.usd).toBeLessThan(0);
    expect(formatDeltaParts(d).className).toBe("neg");
  });

  it("marks sell TP below entry as positive", () => {
    const d = computePriceDelta(62770, 62790, 0.01, "sell", 0.1, 1);
    expect(d.positive).toBe(true);
    expect(formatDeltaParts(d).className).toBe("pos");
  });

  it("marks poorly placed sell TP (above entry) as negative", () => {
    const d = computePriceDelta(62810, 62790, 0.01, "sell", 0.1, 1);
    expect(d.positive).toBe(false);
    expect(formatDeltaParts(d).className).toBe("neg");
  });
});

describe("snapVolume", () => {
  it("enforces BTC min/step", () => {
    expect(
      snapVolume(0.0004, { volume_min: 0.001, volume_step: 0.001, volume_max: 10 }),
    ).toBe(0.001);
    expect(
      snapVolume(0.0154, { volume_min: 0.001, volume_step: 0.001, volume_max: 10 }),
    ).toBe(0.015);
  });
});

describe("validatePendingPrice", () => {
  it("rejects buy limit at/above ask", () => {
    expect(validatePendingPrice("buy", 100, 99, 100)).toMatch(/below/i);
  });
  it("accepts buy limit below ask", () => {
    expect(validatePendingPrice("buy", 98, 99, 100)).toBeNull();
  });
});

describe("validateStopDistance", () => {
  it("rejects levels inside min stop distance", () => {
    expect(
      validateStopDistance(100.2, 100, 50, 0.01, "Take Profit"),
    ).toMatch(/Take Profit/);
  });
  it("allows levels outside min distance", () => {
    expect(validateStopDistance(101, 100, 50, 0.01, "Take Profit")).toBeNull();
  });
});
