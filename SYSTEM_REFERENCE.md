# Samrddhi - Automated Trading Platform
## Complete System Reference Documentation

### Project Overview
**Name:** Samrddhi  
**Objective:** Intelligent automated trading platform targeting 3-7% profit per trade in 2-3 sessions  
**Account:** $393 starting capital, PDT-restricted, US equities under $10  
**Platform:** Ubuntu + Brave Browser, GitHub Codespaces compatible  

### Business Requirements
- **Primary Target:** 3-7% profit per trade (intelligent/dynamic based on volatility)
- **Risk Management:** 0.5-1% risk per trade (intelligent system-based), never loosen stops
- **Drawdown Limits:** Max daily -2%, soft weekly -5% (hard -8%), auto-pause at limits
- **Capital Deployment:** Zero idle capital rule (95-98% deployment), max 5 concurrent positions
- **PDT Compliance:** Pattern Day Trading rules respected, intelligent day trade allocation
- **Autonomy:** Full autonomous decisions after 5 consecutive profitable dry-run days

### Technical Architecture
**Microservices Count:** 39 intelligent services  
**Architecture Pattern:** Event-driven with CQRS + Event Sourcing  
**Message Queue:** Apache Kafka (primary) + Redis (caching)  
**Database Strategy:** Hybrid domain-based databases  
**Orchestration:** Docker Compose (dev) + Kubernetes (prod)  
**API Gateway:** FastAPI with rate limiting and authentication  

### Technology Stack
**Backend:** Python 3.11+ with FastAPI  
**Frontend:** React 18+ with Material-UI  
**Databases:** PostgreSQL (trading), InfluxDB (market data), Redis (cache)  
**Message Queue:** Apache Kafka + Redis  
**ML Framework:** scikit-learn, pandas, numpy, TensorFlow  
**Broker Integration:** Robinhood via robin_stocks unofficial API  
**Containerization:** Docker + Docker Compose  
**Monitoring:** Prometheus + Grafana  

### Microservices Architecture (39 Services)

#### Core Trading Engine (7 Services)
1. **Portfolio Service** - Position tracking, P&L, portfolio analytics
2. **Signal Detection Service** - Market scanning, opportunity identification
3. **Order Management Service** - Order routing, execution, fill tracking
4. **Risk Management Service** - Real-time risk monitoring, position limits
5. **Market Data Service** - Real-time/historical data ingestion
6. **Authentication Service** - Robinhood auth, token management
7. **Stock Monitor Workers** - Individual stock tracking (dynamic scaling)

#### Intelligence & Analytics (6 Services)
8. **ML Strategy Service** - Model training, prediction, adaptation
9. **Backtesting Service** - Strategy validation, optimization
10. **Pattern Recognition Service** - Technical analysis, chart patterns
11. **Sentiment Analysis Service** - News, social sentiment
12. **Performance Analytics Service** - Trade analysis, metrics
13. **Reporting Service** - Session reports, dashboard data

#### Critical Protection Services (7 Services)
14. **Circuit Breaker Service** - Market crash protection
15. **Latency Monitoring Service** - Execution timing, slippage tracking
16. **Failover Service** - Backup systems, redundancy
17. **Rate Limiting Service** - API throttling, Robinhood limits
18. **Cache Service** - Performance optimization
19. **Reconciliation Service** - Balance verification
20. **Market Hours Service** - Session management, holiday calendars

#### Advanced Market Intelligence (6 Services)
21. **Position Correlation Service** - Risk diversification
22. **Volatility Regime Detection** - Market state identification
23. **Liquidity Assessment Service** - Spread analysis
24. **Earnings Calendar Service** - Event avoidance
25. **SEC Filing Monitor** - News/announcements
26. **Market Maker Detection** - Manipulation protection

#### Operational Excellence (5 Services)
27. **Disaster Recovery Service** - Backup, rapid recovery
28. **Performance Profiler Service** - Optimization, bottleneck detection
29. **Cost Monitoring Service** - Infrastructure cost tracking
30. **A/B Testing Service** - Strategy comparison
31. **Feature Flag Service** - Safe feature deployment

#### Regulatory & Compliance (4 Services)
32. **Trade Reporting Service** - Regulatory reporting
33. **Best Execution Service** - Price improvement tracking
34. **Wash Sale Detection Service** - Tax optimization
35. **Position Limits Service** - Concentration limits

#### Data & ML Pipeline (4 Services)
36. **Data Lineage Service** - Data source tracking
37. **Model Versioning Service** - ML lifecycle management
38. **Feature Store Service** - Centralized feature management
39. **Online Learning Service** - Continuous model updates

### Database Design

#### Trading Domain Database (PostgreSQL)
- **Tables:** portfolios, positions, orders, trades, executions
- **Features:** ACID compliance, complex queries, reporting

#### Market Data Database (InfluxDB/TimescaleDB)
- **Data:** Real-time prices, volume, technical indicators
- **Features:** Time-series optimized, high-throughput writes

#### ML Domain Database (PostgreSQL)
- **Tables:** models, features, training_data, predictions
- **Features:** Model versioning, feature engineering

#### Configuration Database (Redis)
- **Data:** User settings, system config, session data
- **Features:** Fast access, caching, pub/sub

### Intelligent Position Sizing Algorithm
**Factors Considered:**
- Current portfolio volatility (ATR-based)
- Stock-specific volatility and liquidity metrics
- Correlation with existing positions
- Market regime (bull/bear/sideways detection)
- Risk-adjusted expected return
- Time decay factor for holding periods

**Formula:** Position Size = (Account Value × Risk Percentage) / (Stock Price × Stop Distance × Correlation Factor × Volatility Adjustment)

### Capital Deployment Strategy
- **Zero Idle Capital:** Maintain 95-98% deployment at all times
- **Opportunity Cost Analysis:** Continuously compare current vs potential positions
- **Dynamic Rebalancing:** Real-time position weight optimization
- **Cash Buffer:** Keep 2-5% for execution and emergencies

### PDT Compliance System
- **Day Trade Tracking:** Real-time monitoring of round trips
- **Intelligent Allocation:** Save day trades for highest conviction setups
- **Swing Trade Focus:** Primary strategy to avoid PDT violations
- **Emergency Override:** Manual day trade approval for critical exits

### Risk Management Framework
**Position Level:**
- Dynamic stop-loss based on ATR and support/resistance
- Position size limits based on volatility
- Correlation-based concentration limits

**Portfolio Level:**
- Daily drawdown monitoring (-2% hard limit)
- Weekly drawdown tracking (-5% soft, -8% hard)
- Sector and stock concentration limits
- Overall leverage monitoring

**System Level:**
- Circuit breakers for market crashes
- API rate limiting and failover
- Real-time reconciliation
- Emergency stop mechanisms

### Manual Override Controls
**Dashboard Features:**
- Start/stop trading toggle
- Emergency stop all positions
- Individual position override (buy/sell)
- Strategy enable/disable controls
- Risk limit adjustments
- Manual signal approval/rejection

### Event Sourcing & CQRS Implementation
**Command Side:** Trading operations (buy/sell orders)
**Query Side:** Dashboard data, reports, analytics
**Event Store:** Complete audit trail of all system events
**Benefits:** Full traceability, replay capability, audit compliance

### Deployment Scripts

#### One-Time Setup
```bash
./install.sh  # Install all dependencies (Python, Node.js, Docker, databases)
./setup.sh    # Environment configuration, database initialization
```

#### Runtime Commands
```bash
./dev     # Start development environment + auto-open Brave browser
./test    # Start test environment + auto-open browser
./prod    # Start production environment + auto-open browser
./stop    # Gracefully stop all services
./logs    # Tail all service logs
./status  # Check service health
./reset   # Reset databases and restart clean
```

### Security Implementation
- **API Authentication:** JWT tokens with refresh mechanism
- **Rate Limiting:** Per-service and global rate limits
- **Input Validation:** Comprehensive data sanitization
- **Encryption:** All sensitive data encrypted at rest and in transit
- **Audit Trail:** Complete logging of all system actions

### Monitoring & Alerting
- **Health Checks:** All services with health endpoints
- **Metrics:** Prometheus-based metrics collection
- **Dashboards:** Grafana visualization
- **Alerts:** Email/SMS for critical events
- **Performance:** Real-time latency and throughput monitoring

### Testing Strategy
- **Unit Tests:** Each service with >90% coverage
- **Integration Tests:** Service-to-service communication
- **End-to-End Tests:** Complete trading workflows
- **Load Tests:** High-throughput scenario testing
- **Chaos Engineering:** Fault injection testing

### Development Workflow
1. **Feature Development:** Branch-based development
2. **Code Review:** Automated and manual reviews
3. **CI/CD Pipeline:** Automated testing and deployment
4. **Environment Promotion:** dev → test → prod
5. **Rollback Strategy:** Quick rollback capabilities

### Performance Targets
- **Order Execution:** <100ms latency
- **Market Data:** Real-time streaming with <50ms delay
- **Dashboard Updates:** Real-time with WebSocket connections
- **Throughput:** Support 1000+ orders per minute
- **Availability:** 99.9% uptime during market hours

### Compliance & Regulatory
- **Trade Reporting:** Automated regulatory reporting
- **Best Execution:** Price improvement tracking
- **Wash Sale Rules:** Automatic detection and handling
- **Position Limits:** Concentration risk management
- **Audit Trail:** Complete system audit logs

### Recovery & Disaster Management
- **Backup Strategy:** Real-time data replication
- **Recovery Time:** <5 minutes for critical services
- **Failover:** Automatic failover for key services
- **Data Integrity:** Transaction-level consistency
- **Business Continuity:** Trading continues during system maintenance

---
**Last Updated:** August 19, 2025  
**Version:** 1.0  
**Status:** Implementation Ready
