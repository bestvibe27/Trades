# MetaTrader 5 (MT5) Setup Guide

## ✅ Your MT5 Connection is Working!

Your trading bot is now successfully connected to your real MetaTrader 5 account:
- **Server**: Exness-MT5Trial9
- **Account**: 211433891
- **Balance**: $7,486.46 USD
- **Equity**: $7,379.17 USD
- **Mode**: Live (not mock)

## 🔧 Configuration Files

### 1. Environment Variables (.env file)
Your `.env` file contains:
```env
# MetaTrader 5 Configuration
MT5_SERVER=Exness-MT5Trial9
MT5_LOGIN=211433891
MT5_PASSWORD=@14857251Nati
MT5_TIMEOUT=10000

# Database Configuration
DATABASE_URL=postgresql://postgres:0000@localhost:5432/tradingdb

# API Configuration
HOST=0.0.0.0
PORT=8000
LOG_LEVEL=INFO
CORS_ORIGINS=*
```

### 2. Python Dependencies
Required packages are installed:
- `python-dotenv` - Loads environment variables from .env file
- `MetaTrader5` - Official MT5 Python library
- `psycopg2-binary` - PostgreSQL database connector

## 🚀 How to Start Your Trading Bot

### Method 1: Using the .env file (Recommended)
```powershell
# Navigate to your project directory
cd N:\Trades

# Activate virtual environment
n:/Trades/.venv/Scripts/Activate.ps1

# Start the trading bot
uvicorn backend.api.main:app --reload --port 8000
```

### Method 2: Using environment variables directly
```powershell
# Set environment variables
$env:MT5_SERVER="Exness-MT5Trial9"
$env:MT5_LOGIN="211433891"
$env:MT5_PASSWORD="@14857251Nati"
$env:DATABASE_URL="postgresql://postgres:0000@localhost:5432/tradingdb"

# Start the trading bot
uvicorn backend.api.main:app --reload --port 8000
```

## 🧪 Testing Your Connection

### Test MT5 Connection
```powershell
python test_mt5_connection.py
```

### Test API Endpoints
```powershell
# Test broker account
python -c "import requests; print(requests.get('http://127.0.0.1:8000/broker/account').json())"

# Test health check
python -c "import requests; print(requests.get('http://127.0.0.1:8000/healthz').json())"
```

## 📊 Available API Endpoints

- **GET** `/broker/account` - Get account balance and info
- **GET** `/broker/status` - Get connection status
- **GET** `/broker/symbols` - Get available trading symbols
- **GET** `/broker/quote/{symbol}` - Get current price for symbol
- **POST** `/broker/order/market` - Place market order
- **GET** `/broker/positions` - Get open positions
- **GET** `/broker/trades` - Get recent trades

## 🔒 Security Notes

1. **Never commit your .env file to version control**
2. **Keep your MT5 credentials secure**
3. **Use environment variables in production**
4. **Regularly rotate your passwords**

## 🛠️ Troubleshooting

### If you see "MT5 credentials are missing":
1. Check that your `.env` file exists in the project root
2. Verify the credentials are correct
3. Ensure the .env file is not in .gitignore

### If connection fails:
1. Verify your MT5 terminal is running
2. Check your internet connection
3. Confirm your account is active
4. Try the test script: `python test_mt5_connection.py`

### If you want to switch back to mock mode:
1. Remove or comment out the MT5 credentials in .env
2. Restart the trading bot
3. It will automatically fall back to mock mode

## 🎯 Next Steps

1. **Test trading**: Place a small test order
2. **Monitor positions**: Check your open positions
3. **Set up strategies**: Configure your trading strategies
4. **Monitor logs**: Watch the console for trading activity

Your trading bot is now ready for live trading! 🚀
