import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../../utils/formatters';

interface OrderFormProps {
  onSubmit: (order: OrderRequest) => void;
  onCancel: () => void;
  loading?: boolean;
  currentPrice?: number;
  symbol?: string;
}

interface OrderRequest {
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  quantity: number;
  price?: number;
  stopPrice?: number;
  timeInForce: 'GTC' | 'IOC' | 'FOK';
  stopLoss?: number;
  takeProfit?: number;
}

const OrderForm: React.FC<OrderFormProps> = ({
  onSubmit,
  onCancel,
  loading = false,
  currentPrice = 0,
  symbol = 'EURUSD'
}) => {
  const [order, setOrder] = useState<OrderRequest>({
    symbol,
    side: 'buy',
    type: 'market',
    quantity: 0.01,
    timeInForce: 'GTC'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const symbols = [
    { value: 'EURUSD', label: 'EUR/USD' },
    { value: 'GBPUSD', label: 'GBP/USD' },
    { value: 'USDJPY', label: 'USD/JPY' },
    { value: 'BTCUSDT', label: 'BTC/USDT' },
    { value: 'ETHUSDT', label: 'ETH/USDT' }
  ];

  const orderTypes = [
    { value: 'market', label: 'Market Order', description: 'Execute immediately at current market price' },
    { value: 'limit', label: 'Limit Order', description: 'Execute only at specified price or better' },
    { value: 'stop', label: 'Stop Order', description: 'Execute when price reaches stop level' },
    { value: 'stop_limit', label: 'Stop Limit Order', description: 'Combines stop and limit order' }
  ];

  const timeInForceOptions = [
    { value: 'GTC', label: 'Good Till Cancelled' },
    { value: 'IOC', label: 'Immediate or Cancel' },
    { value: 'FOK', label: 'Fill or Kill' }
  ];

  useEffect(() => {
    if (currentPrice > 0 && order.type === 'market') {
      setOrder(prev => ({ ...prev, price: currentPrice }));
    }
  }, [currentPrice, order.type]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!order.symbol) {
      newErrors.symbol = 'Symbol is required';
    }

    if (order.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    if (order.type === 'limit' && (!order.price || order.price <= 0)) {
      newErrors.price = 'Price is required for limit orders';
    }

    if (order.type === 'stop' && (!order.stopPrice || order.stopPrice <= 0)) {
      newErrors.stopPrice = 'Stop price is required for stop orders';
    }

    if (order.type === 'stop_limit') {
      if (!order.price || order.price <= 0) {
        newErrors.price = 'Price is required for stop limit orders';
      }
      if (!order.stopPrice || order.stopPrice <= 0) {
        newErrors.stopPrice = 'Stop price is required for stop limit orders';
      }
    }

    if (order.stopLoss && order.stopLoss <= 0) {
      newErrors.stopLoss = 'Stop loss must be greater than 0';
    }

    if (order.takeProfit && order.takeProfit <= 0) {
      newErrors.takeProfit = 'Take profit must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(order);
    }
  };

  const calculateOrderValue = () => {
    const price = order.price || currentPrice;
    return order.quantity * price;
  };

  const getOrderTypeDescription = () => {
    return orderTypes.find(t => t.value === order.type)?.description || '';
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Place Order</h3>
        <p className="mt-1 text-sm text-gray-500">
          {getOrderTypeDescription()}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Symbol Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Symbol
          </label>
          <select
            value={order.symbol}
            onChange={(e) => setOrder(prev => ({ ...prev, symbol: e.target.value }))}
            className={`input w-full ${errors.symbol ? 'border-red-500' : ''}`}
          >
            {symbols.map((symbol) => (
              <option key={symbol.value} value={symbol.value}>
                {symbol.label}
              </option>
            ))}
          </select>
          {errors.symbol && (
            <p className="mt-1 text-sm text-red-600">{errors.symbol}</p>
          )}
        </div>

        {/* Order Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Order Type
          </label>
          <select
            value={order.type}
            onChange={(e) => setOrder(prev => ({ 
              ...prev, 
              type: e.target.value as any,
              price: e.target.value === 'market' ? currentPrice : prev.price,
              stopPrice: undefined
            }))}
            className="input w-full"
          >
            {orderTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Side Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Side
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="buy"
                checked={order.side === 'buy'}
                onChange={(e) => setOrder(prev => ({ ...prev, side: e.target.value as 'buy' | 'sell' }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm font-medium text-green-600">Buy</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="sell"
                checked={order.side === 'sell'}
                onChange={(e) => setOrder(prev => ({ ...prev, side: e.target.value as 'buy' | 'sell' }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm font-medium text-red-600">Sell</span>
            </label>
          </div>
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantity
          </label>
          <input
            type="number"
            value={order.quantity}
            onChange={(e) => setOrder(prev => ({ ...prev, quantity: Number(e.target.value) }))}
            className={`input w-full ${errors.quantity ? 'border-red-500' : ''}`}
            min="0.01"
            step="0.01"
            required
          />
          {errors.quantity && (
            <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
          )}
        </div>

        {/* Price (for limit and stop_limit orders) */}
        {(order.type === 'limit' || order.type === 'stop_limit') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price
            </label>
            <input
              type="number"
              value={order.price || ''}
              onChange={(e) => setOrder(prev => ({ ...prev, price: Number(e.target.value) }))}
              className={`input w-full ${errors.price ? 'border-red-500' : ''}`}
              min="0"
              step="0.0001"
              required
            />
            {errors.price && (
              <p className="mt-1 text-sm text-red-600">{errors.price}</p>
            )}
          </div>
        )}

        {/* Stop Price (for stop and stop_limit orders) */}
        {(order.type === 'stop' || order.type === 'stop_limit') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stop Price
            </label>
            <input
              type="number"
              value={order.stopPrice || ''}
              onChange={(e) => setOrder(prev => ({ ...prev, stopPrice: Number(e.target.value) }))}
              className={`input w-full ${errors.stopPrice ? 'border-red-500' : ''}`}
              min="0"
              step="0.0001"
              required
            />
            {errors.stopPrice && (
              <p className="mt-1 text-sm text-red-600">{errors.stopPrice}</p>
            )}
          </div>
        )}

        {/* Time in Force */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time in Force
          </label>
          <select
            value={order.timeInForce}
            onChange={(e) => setOrder(prev => ({ ...prev, timeInForce: e.target.value as any }))}
            className="input w-full"
          >
            {timeInForceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Stop Loss */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stop Loss (optional)
          </label>
          <input
            type="number"
            value={order.stopLoss || ''}
            onChange={(e) => setOrder(prev => ({ ...prev, stopLoss: Number(e.target.value) }))}
            className={`input w-full ${errors.stopLoss ? 'border-red-500' : ''}`}
            min="0"
            step="0.0001"
            placeholder="Enter stop loss price"
          />
          {errors.stopLoss && (
            <p className="mt-1 text-sm text-red-600">{errors.stopLoss}</p>
          )}
        </div>

        {/* Take Profit */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Take Profit (optional)
          </label>
          <input
            type="number"
            value={order.takeProfit || ''}
            onChange={(e) => setOrder(prev => ({ ...prev, takeProfit: Number(e.target.value) }))}
            className={`input w-full ${errors.takeProfit ? 'border-red-500' : ''}`}
            min="0"
            step="0.0001"
            placeholder="Enter take profit price"
          />
          {errors.takeProfit && (
            <p className="mt-1 text-sm text-red-600">{errors.takeProfit}</p>
          )}
        </div>

        {/* Order Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Order Summary</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Symbol:</span>
              <span className="font-medium">{order.symbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Side:</span>
              <span className={`font-medium ${order.side === 'buy' ? 'text-green-600' : 'text-red-600'}`}>
                {order.side.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Type:</span>
              <span className="font-medium">{orderTypes.find(t => t.value === order.type)?.label}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Quantity:</span>
              <span className="font-medium">{order.quantity}</span>
            </div>
            {order.price && (
              <div className="flex justify-between">
                <span className="text-gray-500">Price:</span>
                <span className="font-medium">{formatCurrency(order.price)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-1">
              <span className="text-gray-500">Order Value:</span>
              <span className="font-medium">{formatCurrency(calculateOrderValue())}</span>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 rounded-md text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
              order.side === 'buy' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {loading ? 'Placing...' : `Place ${order.side.toUpperCase()} Order`}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrderForm;










