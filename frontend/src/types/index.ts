export interface Position {
  id: string;
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  marketValue: number;
  totalCost: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  side: 'long' | 'short';
  openDate: string;
  lastUpdated: string;
}

export interface Order {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  timeInForce: 'GTC' | 'GTD' | 'IOC' | 'FOK';
  status: 'pending' | 'filled' | 'cancelled' | 'rejected' | 'partially_filled';
  filledQuantity: number;
  averageFillPrice: number;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  close: number;
  timestamp: string;
  bid: number;
  ask: number;
  bidSize: number;
  askSize: number;
}

export interface Portfolio {
  totalValue: number;
  totalCost: number;
  totalPnL: number;
  totalPnLPercent: number;
  dayPnL: number;
  dayPnLPercent: number;
  buyingPower: number;
  cash: number;
  positions: Position[];
  lastUpdated: string;
}

export interface Account {
  id: string;
  accountNumber: string;
  totalValue: number;
  buyingPower: number;
  cash: number;
  dayTrades: number;
  dayTradesLimit: number;
  patternDayTrader: boolean;
  status: 'active' | 'restricted' | 'suspended';
  type: 'cash' | 'margin';
  lastUpdated: string;
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  type: 'momentum' | 'mean_reversion' | 'breakout' | 'scalping' | 'swing';
  status: 'active' | 'inactive' | 'paused';
  riskLevel: 'low' | 'medium' | 'high';
  targetProfit: number;
  maxLoss: number;
  timeframe: '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d';
  symbols: string[];
  parameters: Record<string, any>;
  performance: {
    totalTrades: number;
    winRate: number;
    avgProfit: number;
    avgLoss: number;
    profitFactor: number;
    sharpeRatio: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Alert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  symbol?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  read: boolean;
  createdAt: string;
  expiresAt?: string;
}

export interface RiskMetrics {
  portfolioRisk: number;
  var95: number;
  var99: number;
  maxDrawdown: number;
  sharpeRatio: number;
  beta: number;
  correlationMatrix: Record<string, Record<string, number>>;
  concentration: {
    topHoldings: Array<{
      symbol: string;
      weight: number;
    }>;
    sectorExposure: Record<string, number>;
  };
  liquidityRisk: number;
  lastCalculated: string;
}

export interface WebSocketMessage {
  type: 'market_data' | 'portfolio_update' | 'order_update' | 'alert' | 'system';
  channel: string;
  data: any;
  timestamp: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ChartData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicator {
  name: string;
  value: number;
  signal: 'buy' | 'sell' | 'neutral';
  strength: number;
  timestamp: string;
}

export interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
  symbols: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  impact: 'low' | 'medium' | 'high';
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  services: Record<
    string,
    {
      status: 'up' | 'down';
      latency: number;
      lastCheck: string;
    }
  >;
  marketDataStatus: 'connected' | 'disconnected' | 'delayed';
  tradingStatus: 'enabled' | 'disabled' | 'restricted';
  lastUpdated: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  timezone: string;
  defaultTimeframe: string;
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
    orderFills: boolean;
    alerts: boolean;
    systemUpdates: boolean;
  };
  trading: {
    confirmOrders: boolean;
    defaultOrderType: 'market' | 'limit';
    riskWarnings: boolean;
    autoRefresh: boolean;
    refreshInterval: number;
  };
  dashboard: {
    layout: string;
    widgets: string[];
    watchlist: string[];
  };
}
