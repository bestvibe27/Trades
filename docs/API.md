# Trading Bot API Documentation

## Base URL
```
http://localhost:8000
```

## Authentication

The API uses Bearer token authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-token>
```

## Endpoints

### Health Check

#### GET /healthz
Check API health status.

**Response:**
```json
{
  "status": "ok"
}
```

### Authentication

#### POST /auth/login
Authenticate user and get access token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": "user123",
    "email": "user@example.com",
    "roles": ["trader"]
  }
}
```

#### GET /auth/me
Get current user information.

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "role": "admin",
  "email": "admin@example.com"
}
```

### Market Data

#### GET /market/candles/{symbol}/{timeframe}
Get historical candle data for a symbol.

**Parameters:**
- `symbol` (string): Trading symbol (e.g., EURUSD, BTCUSDT)
- `timeframe` (string): Timeframe (e.g., 1h, 4h, 1d)
- `limit` (int, optional): Number of candles to return (default: 100)

**Response:**
```json
{
  "symbol": "EURUSD",
  "timeframe": "1h",
  "candles": [
    {
      "symbol": "EURUSD",
      "timeframe": "1h",
      "open": 1.0950,
      "high": 1.0965,
      "low": 1.0945,
      "close": 1.0960,
      "volume": 1000,
      "timestamp": "2023-12-01T10:00:00Z"
    }
  ]
}
```

### Portfolio

#### GET /portfolio/positions
Get current open positions.

**Response:**
```json
{
  "positions": [
    {
      "symbol": "EURUSD",
      "quantity": 1.0,
      "entryPrice": 1.0950,
      "currentPrice": 1.0960,
      "unrealizedPnL": 10.0
    }
  ]
}
```

#### GET /portfolio/trades
Get trade history.

**Response:**
```json
{
  "trades": [
    {
      "id": "trade123",
      "symbol": "EURUSD",
      "side": "buy",
      "quantity": 1.0,
      "price": 1.0950,
      "status": "filled",
      "createdAt": "2023-12-01T10:00:00Z"
    }
  ]
}
```

### Trading

#### POST /trading/order
Place a new trading order.

**Request Body:**
```json
{
  "symbol": "EURUSD",
  "side": "buy",
  "quantity": 1.0,
  "price": 1.0950
}
```

**Response:**
```json
{
  "order_id": "order123",
  "status": "filled"
}
```

### Strategies

#### POST /strategies/sma/preview
Preview SMA crossover strategy configuration.

**Request Body:**
```json
{
  "symbol": "EURUSD",
  "fast": 10,
  "slow": 30
}
```

**Response:**
```json
{
  "name": "sma_crossover",
  "fast": 10,
  "slow": 30,
  "symbol": "EURUSD"
}
```

#### POST /strategies/rsi/preview
Preview RSI strategy configuration.

**Request Body:**
```json
{
  "symbol": "EURUSD",
  "period": 14,
  "oversold": 30,
  "overbought": 70
}
```

**Response:**
```json
{
  "name": "rsi",
  "period": 14,
  "symbol": "EURUSD"
}
```

## Data Models

### Order
```json
{
  "id": "string",
  "symbol": "string",
  "side": "buy|sell",
  "type": "market|limit|stop|stop_limit",
  "quantity": "number",
  "price": "number",
  "stopPrice": "number",
  "status": "new|pending|filled|cancelled|rejected|expired",
  "createdAt": "string",
  "updatedAt": "string",
  "filledAt": "string",
  "filledPrice": "number",
  "filledQuantity": "number",
  "commission": "number",
  "notes": "string"
}
```

### Position
```json
{
  "id": "string",
  "symbol": "string",
  "side": "buy|sell",
  "quantity": "number",
  "entryPrice": "number",
  "currentPrice": "number",
  "unrealizedPnL": "number",
  "realizedPnL": "number",
  "createdAt": "string",
  "updatedAt": "string"
}
```

### Trade
```json
{
  "id": "string",
  "symbol": "string",
  "side": "buy|sell",
  "quantity": "number",
  "entryPrice": "number",
  "exitPrice": "number",
  "pnl": "number",
  "commission": "number",
  "netPnL": "number",
  "entryTime": "string",
  "exitTime": "string",
  "duration": "number",
  "strategy": "string",
  "notes": "string"
}
```

### Candle
```json
{
  "symbol": "string",
  "timeframe": "string",
  "open": "number",
  "high": "number",
  "low": "number",
  "close": "number",
  "volume": "number",
  "timestamp": "string"
}
```

## Error Responses

All error responses follow this format:

```json
{
  "detail": "Error message",
  "status_code": 400
}
```

### Common Error Codes
- `400`: Bad Request - Invalid input data
- `401`: Unauthorized - Missing or invalid authentication
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource not found
- `422`: Unprocessable Entity - Validation error
- `500`: Internal Server Error - Server error

## Rate Limiting

The API implements rate limiting:
- General API: 10 requests per second
- Authentication: 1 request per second

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 1640995200
```

## WebSocket Support

Real-time data is available via WebSocket connections:

### Connection
```
ws://localhost:8000/ws
```

### Message Format
```json
{
  "type": "price_update",
  "data": {
    "symbol": "EURUSD",
    "price": 1.0950,
    "timestamp": "2023-12-01T10:00:00Z"
  }
}
```

## SDK Examples

### Python
```python
import requests

# Authentication
response = requests.post('http://localhost:8000/auth/login', json={
    'email': 'user@example.com',
    'password': 'password'
})
token = response.json()['access_token']

# Get positions
headers = {'Authorization': f'Bearer {token}'}
positions = requests.get('http://localhost:8000/portfolio/positions', headers=headers)
print(positions.json())
```

### JavaScript
```javascript
// Authentication
const loginResponse = await fetch('http://localhost:8000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password'
  })
});
const { access_token } = await loginResponse.json();

// Get positions
const positionsResponse = await fetch('http://localhost:8000/portfolio/positions', {
  headers: { 'Authorization': `Bearer ${access_token}` }
});
const positions = await positionsResponse.json();
```

## Testing

Use the interactive API documentation at `/docs` to test endpoints directly in your browser.










