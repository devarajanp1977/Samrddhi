#!/bin/bash
set -e

echo "🚀 Installing Samrddhi Dependencies for Ubuntu..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install essential build tools
echo "🔧 Installing build essentials..."
sudo apt install -y build-essential curl wget git software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Install Python 3.11+
echo "🐍 Installing Python 3.11..."
sudo apt install -y python3.11 python3.11-pip python3.11-dev python3.11-venv
sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1
sudo update-alternatives --install /usr/bin/pip pip /usr/bin/pip3 1

# Install Node.js 18+
echo "📡 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Docker and Docker Compose
echo "🐳 Installing Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker $USER

# Install PostgreSQL
echo "🐘 Installing PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib postgresql-client

# Install Redis
echo "🔴 Installing Redis..."
sudo apt install -y redis-server redis-tools

# Install InfluxDB (for time-series market data)
echo "📊 Installing InfluxDB..."
curl -s https://repos.influxdata.com/influxdata-archive_compat.key | gpg --dearmor > /tmp/influxdata-archive_compat.key
sudo cp /tmp/influxdata-archive_compat.key /etc/apt/trusted.gpg.d/
echo 'deb [signed-by=/etc/apt/trusted.gpg.d/influxdata-archive_compat.key] https://repos.influxdata.com/ubuntu stable main' | sudo tee /etc/apt/sources.list.d/influxdata.list
sudo apt update && sudo apt install -y influxdb2

# Install additional system tools
echo "🛠️  Installing additional tools..."
sudo apt install -y htop tree jq unzip zip nginx

# Install Brave Browser (if not already installed)
echo "🦁 Installing Brave Browser..."
if ! command -v brave-browser &> /dev/null; then
    sudo curl -fsSLo /usr/share/keyrings/brave-browser-archive-keyring.gpg https://brave-browser-apt-release.s3.brave.com/brave-browser-archive-keyring.gpg
    echo "deb [signed-by=/usr/share/keyrings/brave-browser-archive-keyring.gpg arch=amd64] https://brave-browser-apt-release.s3.brave.com/ stable main" | sudo tee /etc/apt/sources.list.d/brave-browser-release.list
    sudo apt update
    sudo apt install -y brave-browser
fi

# Create Python virtual environment
echo "🐍 Setting up Python virtual environment..."
cd /workspaces/Samrddhi
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
echo "📚 Installing Python packages..."
pip install --upgrade pip setuptools wheel

# Core Python packages
pip install fastapi[all] uvicorn[standard] pydantic sqlalchemy psycopg2-binary redis
pip install pandas numpy scikit-learn tensorflow keras
pip install robin-stocks yfinance ta-lib python-binance
pip install kafka-python celery flower
pip install prometheus-client grafana-api
pip install pytest pytest-asyncio pytest-cov black flake8 mypy
pip install python-multipart python-jose[cryptography] passlib[bcrypt]
pip install httpx websockets aioredis asyncpg
pip install alembic python-dotenv pyyaml
pip install matplotlib seaborn plotly dash
pip install schedule apscheduler
pip install structlog loguru

# Install Node.js dependencies globally
echo "📦 Installing global Node.js packages..."
sudo npm install -g create-react-app typescript @types/node nodemon pm2

# Setup directories and permissions
echo "📁 Setting up directories..."
sudo mkdir -p /var/log/samrddhi /var/lib/samrddhi /etc/samrddhi
sudo chown -R $USER:$USER /var/log/samrddhi /var/lib/samrddhi /etc/samrddhi

# Start and enable services
echo "🔧 Configuring services..."
sudo systemctl enable postgresql redis-server influxdb
sudo systemctl start postgresql redis-server influxdb

# Add user to docker group (requires logout/login to take effect)
echo "👥 Adding user to docker group..."
newgrp docker

# Make scripts executable
echo "🔑 Setting up permissions..."
chmod +x /workspaces/Samrddhi/scripts/*.sh 2>/dev/null || true

# Create log directories
mkdir -p logs/{services,system,trading}

echo ""
echo "✅ Installation completed successfully!"
echo ""
echo "🔄 Please run 'newgrp docker' or logout/login to apply docker group membership"
echo "🚀 Next step: Run './setup.sh' to configure the environment"
echo "📖 Then use './dev', './test', or './prod' to start the platform"
echo ""
