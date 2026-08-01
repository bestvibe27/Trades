import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuickMarketWidget from "../QuickMarketWidget";

vi.mock("../../../services/tradingAPI", () => ({
  default: {
    getBrokerOrderPreview: vi.fn(async () => ({
      fees: 0.1,
      margin: 1.57,
      leverage: 400,
      contract_size: 1,
      swap_long: -2.1,
      swap_short: 0.4,
      currency: "USD",
    })),
    placeBrokerMarketOrder: vi.fn(),
    placeBrokerPendingOrder: vi.fn(),
  },
}));

import tradingAPI from "../../../services/tradingAPI";

const baseProps = {
  symbol: "BTCUSDm",
  symbols: ["BTCUSDm", "ETHUSDm"],
  quote: { last: 62785, bid: 62780, ask: 62790 },
  symInfo: {
    found: true,
    digits: 2,
    volume_min: 0.01,
    volume_step: 0.01,
    volume_max: 10,
    point: 0.01,
    contract_size: 1,
    trade_stops_level: 50,
    swap_long: -2.1,
    swap_short: 0.4,
  },
  connected: true,
  onSymbolChange: vi.fn(),
  onOrderSuccess: vi.fn(),
};

describe("QuickMarketWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("toggles side between buy and sell and updates confirm label/color", async () => {
    const user = userEvent.setup();
    render(<QuickMarketWidget {...baseProps} />);

    const confirm = screen.getByTestId("confirm-btn");
    expect(confirm.textContent).toMatch(/Confirm Buy/i);

    await user.click(screen.getByTestId("sell-box"));
    expect(confirm.textContent).toMatch(/Confirm Sell/i);
    expect(confirm.className).toMatch(/confirmSell/);

    await user.click(screen.getByTestId("buy-box"));
    expect(confirm.textContent).toMatch(/Confirm Buy/i);
    expect(confirm.className).toMatch(/confirmBuy/);
  });

  it("colors TP/SL deltas by P/L sign (not red by default)", async () => {
    const user = userEvent.setup();
    render(<QuickMarketWidget {...baseProps} />);

    const tp = screen.getByTestId("tp-input");
    await user.clear(tp);
    await user.type(tp, "62850");

    await waitFor(() => {
      const deltas = document.querySelectorAll('[class*="deltaRowShow"] span');
      const classes = Array.from(deltas).map((el) => el.className);
      expect(classes.some((c) => c.includes("pos"))).toBe(true);
      expect(classes.every((c) => !c.includes("neg") || c.includes("sep"))).toBe(true);
    });

    const sl = screen.getByTestId("sl-input");
    await user.clear(sl);
    await user.type(sl, "62700");

    await waitFor(() => {
      const rows = document.querySelectorAll('[class*="deltaRowShow"]');
      expect(rows.length).toBe(2);
      const slSpans = rows[1].querySelectorAll("span");
      const slClasses = Array.from(slSpans).map((el) => el.className);
      expect(slClasses.some((c) => c.includes("neg"))).toBe(true);
    });
  });

  it("shows success flash and calls onOrderSuccess on market submit", async () => {
    const user = userEvent.setup();
    (tradingAPI.placeBrokerMarketOrder as any).mockResolvedValue({
      success: true,
      price: 62790,
    });
    const onOrderSuccess = vi.fn();
    render(<QuickMarketWidget {...baseProps} onOrderSuccess={onOrderSuccess} />);

    await user.click(screen.getByTestId("confirm-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("flash-msg").textContent).toMatch(/Order placed/i);
    });
    expect(tradingAPI.placeBrokerMarketOrder).toHaveBeenCalled();
    expect(onOrderSuccess).toHaveBeenCalled();
  });

  it("surfaces backend validation errors inline", async () => {
    const user = userEvent.setup();
    (tradingAPI.placeBrokerMarketOrder as any).mockResolvedValue({
      success: false,
      error: "Insufficient margin: need 50.00, free 10.00",
    });
    render(<QuickMarketWidget {...baseProps} />);

    await user.click(screen.getByTestId("confirm-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("flash-msg").textContent).toMatch(/Insufficient margin/i);
    });
  });
});
