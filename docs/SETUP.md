# Trading Bot Setup Guide

## Prerequisites

### System Requirements
- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 20.04+)
- **Python**: 3.11 or higher
- **Node.js**: 18 or higher
- **Docker**: 20.10+ (optional, for containerized deployment)
- **Git**: Latest version

### Hardware Requirements
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: 10GB free space
- **CPU**: Dual-core processor or better
- **Network**: Stable internet connection for market data

## Installation Methods

### Method 1: Docker (Recommended)

This is the easiest way to get started with the trading bot.

#### 1. Install Docker
- **Windows**: Download Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop)
- **macOS**: Download Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop)
- **Linux**: Follow the [Docker installation guide](https://docs.docker.com/engine/install/)

#### 2. Clone the Repository
```bash
git clone <repository-url>
cd Trades
```

#### 3. Start the Application
```bash
docker-compose up --build
```

This will start:
- Backend API on http://localhost:8000
- Frontend on http://localhost:3000
- PostgreSQL database
- Redis cache
- Monitoring stack (Grafana, Prometheus)

### Method 2: Manual Installation

#### Backend Setup

1. **Create Virtual Environment**
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

2. **Install Dependencies**
```bash
pip install -r requirements.txt
```

3. **Set Environment Variables**
Create a `.env` file in the backend directory:
```env
HOST=0.0.0.0
PORT=8000
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:3000
DATABASE_URL=sqlite:///./trading_bot.db
```

4. **Start the Backend**
```bash
uvicorn backend.api.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Frontend Setup

1. **Install Dependencies**
```bash
cd frontend
npm install
```

2. **Set Environment Variables**
Create a `.env.local` file in the frontend directory:
```env
NEXT_PUBLIC_API_BASE=http://localhost:8000
```

3. **Start the Frontend**
```bash
npm run dev
```

## Configuration

### Database Configuration

#### SQLite (Default)
No additional setup required. The application will create the database file automatically.

#### PostgreSQL (Production)
1. Install PostgreSQL
2. Create a database:
```sql
CREATE DATABASE trading_bot;
CREATE USER trading_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE trading_bot TO trading_user;
```

3. Update the database URL in your environment:
```env
DATABASE_URL=postgresql://trading_user:your_password@localhost:5432/trading_bot
```

### Broker Configuration

#### Paper Trading (Default)
No configuration required. The system uses simulated trading by default.

#### Real Broker (MT5/Exness)
1. Get API credentials from your broker
2. Update the broker configuration in `config/trading.yml`
3. Set environment variables:
```env
BROKER_API_KEY=your_api_key
BROKER_SECRET=your_secret
BROKER_SERVER=your_server
```

### Risk Management Configuration

Edit `config/risk_limits.yml` to customize risk parameters:

```yaml
global:
  max_account_risk: 0.02      # 2% max risk per trade
  max_daily_drawdown: 0.05    # 5% max daily drawdown
  max_overall_drawdown: 0.2   # 20% max overall drawdown

position_sizing:
  method: "fixed_fractional"
  fixed_fraction: 0.02        # Risk 2% per trade
  max_position_size: 0.1      # Max 10% position size
```

## Verification

### 1. Check Backend Health
Visit http://localhost:8000/healthz
Expected response:
```json
{
  "status": "ok"
}
```

### 2. Check API Documentation
Visit http://localhost:8000/docs
You should see the Swagger UI with all available endpoints.

### 3. Check Frontend
Visit http://localhost:3000
You should see the trading dashboard.

### 4. Test API Connection
The frontend should show "Backend Health: ok" on the dashboard.

## Development Setup

### Backend Development

1. **Install Development Dependencies**
```bash
pip install -r requirements-dev.txt
```

2. **Run Tests**
```bash
pytest tests/
```

3. **Code Formatting**
```bash
black backend/
isort backend/
```

4. **Type Checking**
```bash
mypy backend/
```

### Frontend Development

1. **Install Development Dependencies**
```bash
npm install --save-dev
```

2. **Run Tests**
```bash
npm test
```

3. **Code Formatting**
```bash
npm run lint
npm run format
```

4. **Type Checking**
```bash
npm run type-check
```

## Production Deployment

### Using Docker

1. **Build Production Images**
```bash
docker-compose -f infrastructure/docker/docker-compose.yml build
```

2. **Deploy with Production Settings**
```bash
docker-compose -f infrastructure/docker/docker-compose.yml up -d
```

### Manual Deployment

1. **Backend Production Setup**
```bash
# Install production dependencies
pip install -r requirements.txt

# Set production environment variables
export NODE_ENV=production
export DATABASE_URL=postgresql://user:pass@host:port/db

# Run with production server
gunicorn backend.api.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

2. **Frontend Production Setup**
```bash
# Build production bundle
npm run build

# Start production server
npm start
```

### Environment Variables for Production

```env
# Backend
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:port/db
REDIS_URL=redis://host:port
SECRET_KEY=your-secret-key
CORS_ORIGINS=https://yourdomain.com

# Frontend
NEXT_PUBLIC_API_BASE=https://api.yourdomain.com
```

## Monitoring Setup

### Grafana Dashboard
1. Access Grafana at http://localhost:3001
2. Login with admin/admin
3. Import the trading bot dashboard
4. Configure data sources

### Prometheus Metrics
- Access Prometheus at http://localhost:9090
- View metrics and create alerts
- Configure notification channels

## Troubleshooting

### Common Issues

#### Backend Won't Start
1. Check if port 8000 is available
2. Verify Python version (3.11+)
3. Check environment variables
4. Review logs for errors

#### Frontend Won't Connect to Backend
1. Verify `NEXT_PUBLIC_API_BASE` is set correctly
2. Check CORS configuration
3. Ensure backend is running
4. Check network connectivity

#### Database Connection Issues
1. Verify database is running
2. Check connection string format
3. Ensure database exists
4. Verify user permissions

#### Docker Issues
1. Ensure Docker is running
2. Check available disk space
3. Verify Docker Compose version
4. Review container logs

### Logs

#### Backend Logs
```bash
# Docker
docker-compose logs backend

# Manual
tail -f logs/trading_bot.log
```

#### Frontend Logs
```bash
# Docker
docker-compose logs frontend

# Manual
npm run dev
```

### Getting Help

1. Check the [API Documentation](API.md)
2. Review the [README](README.md)
3. Search existing issues
4. Create a new issue with:
   - System information
   - Error messages
   - Steps to reproduce
   - Log files

## Security Considerations

### API Security
- Use HTTPS in production
- Implement proper authentication
- Set up rate limiting
- Validate all inputs
- Use environment variables for secrets

### Database Security
- Use strong passwords
- Enable SSL connections
- Regular backups
- Access control
- Monitor for suspicious activity

### Network Security
- Firewall configuration
- VPN for remote access
- Regular security updates
- Monitor network traffic

## Backup and Recovery

### Database Backup
```bash
# PostgreSQL
pg_dump trading_bot > backup.sql

# SQLite
cp trading_bot.db backup.db
```

### Configuration Backup
```bash
tar -czf config-backup.tar.gz config/
```

### Recovery
```bash
# Restore database
psql trading_bot < backup.sql

# Restore configuration
tar -xzf config-backup.tar.gz
```










