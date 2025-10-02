# Trading Bot Platform

A comprehensive algorithmic trading platform with a modern web interface.

## Features

- **Multi-exchange support** (Exness MT5, Binance, and more)
- **Automated trading strategies** with backtesting capabilities
- **Real-time market data** and charting
- **Risk management** with configurable limits
- **Paper trading** for strategy validation
- **Performance analytics** and reporting

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: FastAPI, Python 3.11
- **Database**: PostgreSQL, Redis
- **Infrastructure**: Docker, Nginx, Prometheus, Grafana
- **Trading**: MetaTrader 5, CCXT

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 20+ and npm 8+
- Python 3.11+

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/trading-bot.git
   cd trading-bot
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. Update the `.env` file with your configuration.

4. Start the development environment:
   ```bash
   docker-compose up -d
   ```

5. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs
   - pgAdmin: http://localhost:5050
   - Grafana: http://localhost:3001
   - Prometheus: http://localhost:9090

## Project Structure

```
.
├── backend/               # FastAPI backend application
│   ├── app/              # Main application package
│   ├── api/              # API routes
│   ├── core/             # Core trading logic
│   ├── strategies/       # Trading strategies
│   └── ...
│
├── frontend/             # Next.js frontend
│   ├── public/           # Static files
│   ├── src/              # Source code
│   │   ├── components/   # React components
│   │   ├── pages/        # Next.js pages
│   │   └── ...
│   └── ...
│
├── config/               # Configuration files
├── infrastructure/       # Deployment and infrastructure
├── shared/               # Shared code between frontend and backend
└── ...
```

## Development

### Backend

1. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. Run the development server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

## Testing

Run the test suite:

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## Deployment

1. Build and start the production containers:
   ```bash
   docker-compose -f docker-compose.yml -f infrastructure/monitoring/docker-compose.monitoring.yml up -d --build
   ```

2. Run database migrations:
   ```bash
   docker-compose exec backend alembic upgrade head
   ```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
