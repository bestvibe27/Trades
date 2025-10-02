# Trading Bot Documentation

## Overview

This is a comprehensive trading bot platform built with FastAPI (backend) and Next.js (frontend). The system provides automated trading capabilities with risk management, strategy backtesting, and real-time monitoring.

## Architecture

### Backend (FastAPI)
- **API Layer**: RESTful API with FastAPI framework
- **Core Engine**: Trading engine with strategy execution
- **Data Layer**: Market data providers and historical data
- **Broker Integration**: Support for paper trading and real brokers (MT5)
- **Risk Management**: Position sizing, drawdown control, and risk limits
- **Strategies**: Modular strategy system with built-in indicators

### Frontend (Next.js)
- **Dashboard**: Real-time trading overview
- **Trading Interface**: Manual and automated trading controls
- **Portfolio Management**: Position tracking and performance metrics
- **Strategy Management**: Create, configure, and monitor strategies
- **Backtesting**: Historical strategy performance testing
- **Settings**: Account and system configuration

## Features

### Trading Capabilities
- ✅ Automated strategy execution
- ✅ Manual trading interface
- ✅ Paper trading for testing
- ✅ Real broker integration (MT5/Exness)
- ✅ Multiple asset classes (Forex, Crypto, Stocks)

### Risk Management
- ✅ Position sizing algorithms
- ✅ Drawdown monitoring
- ✅ Risk limits and circuit breakers
- ✅ Portfolio-level risk controls

### Strategy System
- ✅ SMA Crossover strategy
- ✅ RSI Mean Reversion strategy
- ✅ Custom strategy framework
- ✅ Technical indicators library
- ✅ Strategy backtesting

### Data & Analytics
- ✅ Real-time market data
- ✅ Historical data storage
- ✅ Performance analytics
- ✅ Trade history and reporting

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker (optional)

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn backend.api.main:app --host 0.0.0.0 --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Docker Setup
```bash
docker-compose up --build
```

## Configuration

### Environment Variables
- `HOST`: API server host (default: 0.0.0.0)
- `PORT`: API server port (default: 8000)
- `LOG_LEVEL`: Logging level (default: INFO)
- `CORS_ORIGINS`: Allowed CORS origins
- `NEXT_PUBLIC_API_BASE`: Frontend API base URL

### Configuration Files
- `config/database.yml`: Database configuration
- `config/risk_limits.yml`: Risk management settings
- `config/trading.yml`: Trading parameters

## API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Key Endpoints
- `GET /healthz`: Health check
- `POST /auth/login`: User authentication
- `GET /portfolio/positions`: Current positions
- `GET /portfolio/trades`: Trade history
- `POST /trading/order`: Place orders
- `GET /market/candles/{symbol}/{timeframe}`: Market data
- `POST /strategies/sma/preview`: Strategy configuration

## Development

### Project Structure
```
├── backend/                 # FastAPI backend
│   ├── api/                # API routes and configuration
│   ├── app/                # Application routers
│   ├── core/               # Trading engine and managers
│   ├── models/             # Data models
│   ├── strategies/         # Trading strategies
│   ├── brokers/            # Broker integrations
│   ├── data/               # Data providers
│   ├── risk/               # Risk management
│   └── utils/              # Utility functions
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Next.js pages
│   │   ├── services/       # API services
│   │   └── types/          # TypeScript types
├── shared/                 # Shared types and constants
├── infrastructure/         # Docker and deployment
└── docs/                   # Documentation
```

### Adding New Strategies
1. Create a new strategy class inheriting from `BaseStrategy`
2. Implement the `generate_signal` method
3. Add strategy configuration in the frontend
4. Test with backtesting functionality

### Adding New Brokers
1. Create a new broker class inheriting from `BaseBroker`
2. Implement `buy` and `sell` methods
3. Add broker configuration
4. Update the trading engine to use the new broker

## Testing

### Backend Tests
```bash
cd backend
python -m pytest tests/
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Deployment

### Production Deployment
1. Set up environment variables
2. Configure database (PostgreSQL recommended)
3. Set up Redis for caching
4. Deploy using Docker or directly
5. Configure monitoring and logging

### Docker Deployment
```bash
docker-compose -f infrastructure/docker/docker-compose.yml up -d
```

## Monitoring

The system includes monitoring with:
- Prometheus for metrics collection
- Grafana for visualization
- Health checks and alerts
- Log aggregation

Access monitoring at:
- Grafana: http://localhost:3001 (admin/admin)
- Prometheus: http://localhost:9090

## Security

- API authentication with JWT tokens
- CORS configuration
- Input validation and sanitization
- Rate limiting
- Secure API key storage

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API documentation at `/docs`










