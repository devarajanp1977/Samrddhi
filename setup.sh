#!/bin/bash
set -e

echo "⚙️  Configuring Samrddhi Environment..."

# Load environment
source /workspaces/Samrddhi/venv/bin/activate

# Create environment files if they don't exist
echo "📝 Creating environment configuration files..."

# Development environment
cat > .env.dev << 'EOF'
# Samrddhi Development Environment
ENVIRONMENT=development
DEBUG=True
LOG_LEVEL=DEBUG

# Database Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=samrddhi_dev
POSTGRES_USER=samrddhi_dev
POSTGRES_PASSWORD=dev_password_2024

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# InfluxDB Configuration
INFLUX_HOST=localhost
INFLUX_PORT=8086
INFLUX_ORG=samrddhi
INFLUX_BUCKET=market_data_dev
INFLUX_TOKEN=dev_token_will_be_generated

# Kafka Configuration
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
KAFKA_GROUP_ID=samrddhi_dev

# API Configuration
API_HOST=localhost
API_PORT=8000
FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]

# Security
JWT_SECRET_KEY=dev_jwt_secret_key_change_in_production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# Robinhood Configuration (will be populated during setup)
RH_USERNAME=
RH_PASSWORD=
RH_MFA_CODE=

# Trading Configuration
INITIAL_CAPITAL=393.00
MAX_POSITIONS=5
DEFAULT_RISK_PERCENT=1.0
MAX_DAILY_DRAWDOWN=2.0
MAX_WEEKLY_DRAWDOWN=5.0
PDT_ENABLED=True
DRY_RUN=True

# Monitoring
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001
HEALTH_CHECK_INTERVAL=30
EOF

# Test environment
cat > .env.test << 'EOF'
# Samrddhi Test Environment
ENVIRONMENT=test
DEBUG=False
LOG_LEVEL=INFO

# Database Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=samrddhi_test
POSTGRES_USER=samrddhi_test
POSTGRES_PASSWORD=test_password_2024

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=1

# InfluxDB Configuration
INFLUX_HOST=localhost
INFLUX_PORT=8086
INFLUX_ORG=samrddhi
INFLUX_BUCKET=market_data_test
INFLUX_TOKEN=test_token_will_be_generated

# Kafka Configuration
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
KAFKA_GROUP_ID=samrddhi_test

# API Configuration
API_HOST=localhost
API_PORT=8001
FRONTEND_URL=http://localhost:3001
CORS_ORIGINS=["http://localhost:3001","http://127.0.0.1:3001"]

# Security
JWT_SECRET_KEY=test_jwt_secret_key_change_in_production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# Robinhood Configuration
RH_USERNAME=
RH_PASSWORD=
RH_MFA_CODE=

# Trading Configuration
INITIAL_CAPITAL=393.00
MAX_POSITIONS=5
DEFAULT_RISK_PERCENT=0.5
MAX_DAILY_DRAWDOWN=1.0
MAX_WEEKLY_DRAWDOWN=3.0
PDT_ENABLED=True
DRY_RUN=True

# Monitoring
PROMETHEUS_PORT=9091
GRAFANA_PORT=3002
HEALTH_CHECK_INTERVAL=30
EOF

# Production environment
cat > .env.prod << 'EOF'
# Samrddhi Production Environment
ENVIRONMENT=production
DEBUG=False
LOG_LEVEL=WARNING

# Database Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=samrddhi_prod
POSTGRES_USER=samrddhi_prod
POSTGRES_PASSWORD=CHANGE_THIS_STRONG_PASSWORD_IN_PRODUCTION

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=2

# InfluxDB Configuration
INFLUX_HOST=localhost
INFLUX_PORT=8086
INFLUX_ORG=samrddhi
INFLUX_BUCKET=market_data_prod
INFLUX_TOKEN=prod_token_will_be_generated

# Kafka Configuration
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
KAFKA_GROUP_ID=samrddhi_prod

# API Configuration
API_HOST=localhost
API_PORT=8002
FRONTEND_URL=http://localhost:3002
CORS_ORIGINS=["http://localhost:3002","http://127.0.0.1:3002"]

# Security
JWT_SECRET_KEY=CHANGE_THIS_STRONG_SECRET_KEY_IN_PRODUCTION
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# Robinhood Configuration
RH_USERNAME=
RH_PASSWORD=
RH_MFA_CODE=

# Trading Configuration
INITIAL_CAPITAL=393.00
MAX_POSITIONS=5
DEFAULT_RISK_PERCENT=1.0
MAX_DAILY_DRAWDOWN=2.0
MAX_WEEKLY_DRAWDOWN=5.0
PDT_ENABLED=True
DRY_RUN=False

# Monitoring
PROMETHEUS_PORT=9092
GRAFANA_PORT=3003
HEALTH_CHECK_INTERVAL=30
EOF

# Create example environment file
cp .env.dev .env.example

echo "🗄️  Setting up databases..."

# Setup PostgreSQL databases
sudo -u postgres createuser --createdb --pwprompt samrddhi_dev || echo "Dev user already exists"
sudo -u postgres createuser --createdb --pwprompt samrddhi_test || echo "Test user already exists"
sudo -u postgres createuser --createdb --pwprompt samrddhi_prod || echo "Prod user already exists"

sudo -u postgres createdb -O samrddhi_dev samrddhi_dev || echo "Dev database already exists"
sudo -u postgres createdb -O samrddhi_test samrddhi_test || echo "Test database already exists"
sudo -u postgres createdb -O samrddhi_prod samrddhi_prod || echo "Prod database already exists"

# Setup Redis configuration
echo "🔴 Configuring Redis..."
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Setup InfluxDB
echo "📊 Configuring InfluxDB..."
sudo systemctl enable influxdb
sudo systemctl start influxdb

# Wait for InfluxDB to start
sleep 5

# Setup InfluxDB initial configuration
if ! influx auth list >/dev/null 2>&1; then
    echo "Setting up InfluxDB initial configuration..."
    influx setup \
        --username samrddhi \
        --password samrddhi_admin_2024 \
        --org samrddhi \
        --bucket market_data_dev \
        --retention 0 \
        --force || echo "InfluxDB already configured"
fi

# Create additional buckets for test and prod
influx bucket create --name market_data_test --org samrddhi || echo "Test bucket exists"
influx bucket create --name market_data_prod --org samrddhi || echo "Prod bucket exists"

echo "🐳 Setting up Docker network..."
docker network create samrddhi-network || echo "Docker network already exists"

echo "📁 Creating directory structure..."
mkdir -p {logs,data,backups,uploads,exports}
mkdir -p logs/{services,trading,system,audit}
mkdir -p data/{models,features,backups}

echo "🔑 Setting up permissions..."
chmod +x *.sh 2>/dev/null || true
chmod +x scripts/*.sh 2>/dev/null || true

echo "📦 Installing frontend dependencies..."
cd frontend
npm init -y
npm install react react-dom react-scripts typescript @types/node @types/react @types/react-dom
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled
npm install @mui/x-charts @mui/x-data-grid recharts
npm install axios socket.io-client @reduxjs/toolkit react-redux
npm install react-router-dom @types/react-router-dom
npm install date-fns numeral @types/numeral
npm install web-vitals @testing-library/react @testing-library/jest-dom
cd ..

echo "🔧 Creating systemd services..."
sudo tee /etc/systemd/system/samrddhi.service > /dev/null <<EOF
[Unit]
Description=Samrddhi Trading Platform
After=postgresql.service redis.service influxdb.service
Wants=postgresql.service redis.service influxdb.service

[Service]
Type=forking
User=$USER
Group=$USER
WorkingDirectory=/workspaces/Samrddhi
ExecStart=/workspaces/Samrddhi/prod
ExecStop=/workspaces/Samrddhi/stop
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
sudo systemctl daemon-reload

echo "📋 Creating initial configuration files..."

# Create logging configuration
cat > logging.yaml << 'EOF'
version: 1
disable_existing_loggers: False

formatters:
  detailed:
    format: '%(asctime)s [%(levelname)s] %(name)s: %(message)s'
  simple:
    format: '%(levelname)s: %(message)s'

handlers:
  console:
    class: logging.StreamHandler
    level: INFO
    formatter: simple
    stream: ext://sys.stdout
  
  file:
    class: logging.handlers.RotatingFileHandler
    level: DEBUG
    formatter: detailed
    filename: logs/system/samrddhi.log
    maxBytes: 10485760  # 10MB
    backupCount: 5
  
  trading:
    class: logging.handlers.RotatingFileHandler
    level: INFO
    formatter: detailed
    filename: logs/trading/trading.log
    maxBytes: 10485760
    backupCount: 10

loggers:
  samrddhi:
    level: DEBUG
    handlers: [console, file]
    propagate: False
  
  samrddhi.trading:
    level: INFO
    handlers: [trading]
    propagate: False

root:
  level: INFO
  handlers: [console, file]
EOF

echo ""
echo "✅ Environment setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Configure Robinhood credentials in .env.dev file"
echo "2. Run './dev' to start development environment"
echo "3. Run './test' to start test environment"
echo "4. Run './prod' to start production environment"
echo ""
echo "🔑 Default passwords (CHANGE IN PRODUCTION):"
echo "- PostgreSQL dev: dev_password_2024"
echo "- PostgreSQL test: test_password_2024"  
echo "- InfluxDB: samrddhi_admin_2024"
echo ""
