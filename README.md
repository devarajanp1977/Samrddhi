# SAMRDDHI - Automated Trading Platform
*Status: ✅ **OPERATIONAL** | Last Updated: August 19, 2025*

## 🚀 **Quick Start**

### Current Status: RUNNING
The platform is currently operational with all core services running:

- **🌐 Frontend**: http://localhost:3000 (React + TypeScript)
- **🔧 API Gateway**: http://localhost:8000 (FastAPI)  
- **📊 All Services**: Portfolio, Market Data, Orders, Risk Management, Signals

### Start Everything
```bash
cd /home/dev/Samrddhi
./scripts/start-all-services.sh
```

### Check System Health
```bash
./scripts/health-check.sh
```

### Stop Everything  
```bash
./scripts/stop-all-services.sh
```

## 🧪 Simple One-Word Launcher (samrddhi CLI)

If you prefer a minimal command (instead of long scripts or the full launch script) you can use the lightweight wrapper added at repo root named `samrddhi`.

### Setup Once
```bash
chmod +x samrddhi
sudo ln -s "$(pwd)/samrddhi" /usr/local/bin/samrddhi   # optional, for global access
./install-cli.sh   # alternative automatic installer / repair
```

### Usage
```bash
samrddhi start    # docker compose up -d
samrddhi status   # container status
samrddhi logs     # follow logs (Ctrl+C to exit)
samrddhi logs api-gateway  # single service logs
samrddhi stop     # docker compose down
samrddhi restart  # restart all
samrddhi rebuild  # rebuild images
samrddhi clean    # full cleanup (asks confirmation)
```

This simply wraps docker-compose commands so you don't need to remember the long form. The original `launch-complete-platform.sh` still performs full health waits & fancy output if you want that experience.

## 📋 **Documentation Quick Links**

| Document | Purpose | Updated |
|----------|---------|---------|
| [📊 CURRENT_STATUS.md](CURRENT_STATUS.md) | Detailed system status & health | Aug 19, 2025 |
| [🛠️ DEV_GUIDE.md](DEV_GUIDE.md) | Development workflows & setup | Aug 19, 2025 |  
| [📝 TODO_TOMORROW.md](TODO_TOMORROW.md) | Priority tasks for next session | Aug 19, 2025 |
| [📓 SESSION_NOTES.md](SESSION_NOTES.md) | Today's development session notes | Aug 19, 2025 |
