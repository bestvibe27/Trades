"""Tests for broker order validation, margin/fees preview, and stop distance."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from backend.data.mt5_connector import MT5Connector
from backend.app import broker as broker_mod


@pytest.fixture()
def mock_connector(monkeypatch):
    conn = MT5Connector(use_mock=True)
    conn.connect()
    # Stable BTC price for deterministic assertions
    conn._mock_prices["BTCUSDm"] = 62785.00
    monkeypatch.setattr(broker_mod, "_connector", conn)
    return conn


@pytest.fixture()
def client(mock_connector, monkeypatch):
    # Avoid DB dependency for order paths that persist — stub get_db / Trade
    from backend.api import main as api_main

    app = api_main.create_app()

    class FakeTrade:
        trade_id = 1
        symbol = "BTCUSDm"
        trade_type = "BUY"
        volume = 0.01
        execution_price = 62790.0
        status = "OPEN"
        order_id = "1"
        execution_time = None

    class FakeSession:
        def add(self, *_a, **_k):
            pass

        def commit(self):
            pass

        def rollback(self):
            pass

    def fake_persist(db, **kwargs):
        return {
            "success": True,
            "trade_id": 1,
            "order_id": "1",
            "symbol": kwargs["symbol"],
            "side": kwargs["side"].upper(),
            "volume": kwargs["volume"],
            "price": kwargs["execution_price"],
            "status": kwargs.get("status", "OPEN"),
            "execution_time": None,
            "message": "ok",
        }

    monkeypatch.setattr(broker_mod, "_persist_trade", fake_persist)

    return TestClient(app)


def test_estimate_margin_btc(mock_connector):
    # (0.01 * 1 * 62785) / 400 = 1.569625 → ~1.57
    margin = mock_connector.estimate_margin("BTCUSDm", 0.01, 62785.0)
    assert abs(margin - 1.569625) < 1e-6


def test_estimate_order_costs_includes_swaps(mock_connector):
    costs = mock_connector.estimate_order_costs("BTCUSDm", 0.01, 62785.0)
    assert costs["leverage"] == 400
    assert costs["contract_size"] == 1.0
    assert costs["fees"] > 0
    assert costs["margin"] > 0
    assert "swap_long" in costs and "swap_short" in costs


def test_order_preview_endpoint(client):
    res = client.get(
        "/broker/order/preview",
        params={"symbol": "BTCUSDm", "side": "buy", "volume": 0.01, "price": 62790},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["leverage"] == 400
    assert data["margin"] > 0


def test_symbol_info_exposes_pip_size(client):
    res = client.get("/broker/symbols/BTCUSDm")
    assert res.status_code == 200
    data = res.json()
    assert data["found"] is True
    assert data["pip_size"] == 0.1


def test_account_endpoint_exposes_currency(client):
    res = client.get("/broker/account")
    assert res.status_code == 200
    data = res.json()
    assert data["currency"] == "USD"
    assert data["equity"] > 0


def test_market_order_success(client, mock_connector):
    res = client.post(
        "/broker/order/market",
        json={"symbol": "BTCUSDm", "side": "buy", "volume": 0.01},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["side"] == "BUY"
    assert len(mock_connector._mock_positions) >= 1


def test_market_order_stop_distance_rejection(client, mock_connector, monkeypatch):
    monkeypatch.setattr(mock_connector, "get_bid_ask", lambda _s: (62780.0, 62790.0))
    # BTC stops_level=50, point=0.01 → min dist 0.50; 0.1 is too close
    res = client.post(
        "/broker/order/market",
        json={
            "symbol": "BTCUSDm",
            "side": "buy",
            "volume": 0.01,
            "tp": 62790.1,
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is False
    assert "Take Profit" in data["error"] or "too close" in data["error"].lower()


def test_pending_order_stop_distance_rejection_with_canonical_price(client, mock_connector, monkeypatch):
    monkeypatch.setattr(mock_connector, "get_bid_ask", lambda _s: (62780.0, 62790.0))
    res = client.post(
        "/broker/order/pending",
        json={
            "symbol": "BTCUSDm",
            "side": "buy",
            "volume": 0.01,
            "price": 62770.0,
            "tp": 62770.1,
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is False
    assert "Take Profit" in data["error"] or "too close" in data["error"].lower()


def test_pending_buy_must_be_below_ask(client, mock_connector):
    bid, ask = mock_connector.get_bid_ask("BTCUSDm")
    res = client.post(
        "/broker/order/pending",
        json={
            "symbol": "BTCUSDm",
            "side": "buy",
            "volume": 0.01,
            "price": ask + 10,
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is False
    assert "below" in data["error"].lower()


def test_pending_order_success(client, mock_connector):
    bid, ask = mock_connector.get_bid_ask("BTCUSDm")
    res = client.post(
        "/broker/order/pending",
        json={
            "symbol": "BTCUSDm",
            "side": "buy",
            "volume": 0.01,
            "price": bid - 100,
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["status"] == "PENDING"


def test_validate_stop_levels_helper(mock_connector):
    err = broker_mod._validate_stop_levels("BTCUSDm", 62785.0, 62785.1, None)
    assert err is not None
    ok = broker_mod._validate_stop_levels("BTCUSDm", 62785.0, 62700.0, 63000.0)
    assert ok is None
