import {
  ApiResponse,
  PaginatedResponse,
  Portfolio,
  Position,
  Order,
  Strategy,
  Account,
  MarketData,
  Alert,
  SystemHealth,
  UserPreferences,
  NewsItem,
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const DASHBOARD_API_URL = process.env.REACT_APP_DASHBOARD_API_URL || 'http://localhost:8300';

class ApiService {
  private baseURL: string;
  private dashboardURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.dashboardURL = DASHBOARD_API_URL;
    this.loadToken();
  }

  private loadToken() {
    this.token = localStorage.getItem('auth_token');
  }

  private saveToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  private clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit & { baseURL?: string } = {}
  ): Promise<ApiResponse<T>> {
    const { baseURL, ...fetchOptions } = options;
    const url = `${baseURL || this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return {
        success: true,
        data: data,
      } as ApiResponse<T>;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      } as ApiResponse<T>;
    }
  }

  // Authentication
  async login(username: string, password: string) {
    const response = await this.request<{ access_token: string; token_type: string }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }
    );

    if (response.success && response.data) {
      this.saveToken(response.data.access_token);
    }

    return response;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearToken();
    }
  }

  // Portfolio endpoints
  async getPortfolio(): Promise<ApiResponse<Portfolio>> {
    return this.request('/api/v1/portfolio');
  }

  async getPositions(): Promise<ApiResponse<Position[]>> {
    return this.request('/api/v1/portfolio/positions');
  }

  // Account endpoints
  async getAccount(): Promise<ApiResponse<Account>> {
    return this.request('/api/v1/account');
  }

  // Market data endpoints
  async getQuote(symbol: string): Promise<ApiResponse<MarketData>> {
    return this.request(`/api/v1/market-data/quote/${symbol}`);
  }

  async getQuotes(symbols: string[]): Promise<ApiResponse<MarketData[]>> {
    return this.request('/api/v1/market-data/quotes', {
      method: 'POST',
      body: JSON.stringify({ symbols }),
    });
  }

  // Orders endpoints
  async getOrders(
    page: number = 1,
    limit: number = 50
  ): Promise<ApiResponse<PaginatedResponse<Order>>> {
    return this.request(`/api/v1/orders?page=${page}&limit=${limit}`);
  }

  async createOrder(orderData: {
    symbol: string;
    side: 'buy' | 'sell';
    quantity: number;
    type: 'market' | 'limit';
    price?: number;
  }): Promise<ApiResponse<Order>> {
    return this.request('/api/v1/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async cancelOrder(orderId: string): Promise<ApiResponse<Order>> {
    return this.request(`/api/v1/orders/${orderId}/cancel`, {
      method: 'POST',
    });
  }

  // Strategies endpoints
  async getStrategies(): Promise<ApiResponse<Strategy[]>> {
    return this.request('/api/v1/strategies');
  }

  async toggleStrategy(strategyId: string): Promise<ApiResponse<Strategy>> {
    return this.request(`/api/v1/strategies/${strategyId}/toggle`, {
      method: 'POST',
    });
  }

  // Alerts endpoints
  async getAlerts(): Promise<ApiResponse<Alert[]>> {
    return this.request('/api/v1/alerts');
  }

  async markAlertAsRead(alertId: string): Promise<ApiResponse<Alert>> {
    return this.request(`/api/v1/alerts/${alertId}/read`, {
      method: 'POST',
    });
  }

  // System health endpoints
  async getSystemHealth(): Promise<ApiResponse<SystemHealth>> {
    return this.request('/api/v1/system/health');
  }

  // User preferences endpoints
  async getUserPreferences(): Promise<ApiResponse<UserPreferences>> {
    return this.request('/api/v1/user/preferences');
  }

  async updateUserPreferences(
    preferences: Partial<UserPreferences>
  ): Promise<ApiResponse<UserPreferences>> {
    return this.request('/api/v1/user/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }

  // NEW: Dashboard API Integration
  async getComprehensiveDashboard(): Promise<ApiResponse<any>> {
    try {
      // Get both portfolio and market data from the working APIs
      const portfolioResponse = await this.request('/api/v1/portfolio');
      const marketDataResponse = await this.request('/api/v1/market-data');

      if (portfolioResponse.success && marketDataResponse.success) {
        const portfolioData = portfolioResponse.data as any;
        const marketDataRaw = marketDataResponse.data as any;

        // Transform market data from object to array format with proper field mapping
        const marketDataArray = marketDataRaw.data
          ? Object.values(marketDataRaw.data).map((stock: any) => ({
              symbol: stock.symbol,
              close_price: stock.price,
              high_price: stock.price * 1.02, // Mock high price (2% above current)
              low_price: stock.price * 0.98, // Mock low price (2% below current)
              volume: stock.volume,
              timestamp: stock.timestamp,
              change: stock.change,
              change_percent: stock.change_percent,
            }))
          : Object.values(marketDataRaw).map((stock: any) => ({
              symbol: stock.symbol,
              close_price: stock.price,
              high_price: stock.price * 1.02,
              low_price: stock.price * 0.98,
              volume: stock.volume,
              timestamp: stock.timestamp,
              change: stock.change,
              change_percent: stock.change_percent,
            }));

        // Transform comprehensive dashboard format with BOTH portfolio and market data
        const comprehensiveDashboard = {
          timestamp: new Date().toISOString(),
          portfolio: {
            id: portfolioData.id,
            name: portfolioData.name,
            total_value: portfolioData.account_value, // Fixed: using account_value from API
            cash_balance: portfolioData.cash_balance,
            total_pnl: portfolioData.total_return,
            total_pnl_percent: portfolioData.total_return_percent,
            positions_count: portfolioData.positions_count,
            positions_value: portfolioData.account_value - portfolioData.cash_balance,
            positions: [], // Mock positions for now
          },
          market_data: marketDataArray, // Now it's an array with proper field names
          trading_signals: [], // Mock for now
          system_health: 'healthy',
          active_positions: 0,
          recent_orders: [], // Mock for now
          risk_alerts: [], // Mock for now
          risk_metrics: {}, // Mock for now
        };

        return {
          success: true,
          data: comprehensiveDashboard,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: false,
        error: 'Failed to fetch comprehensive dashboard data',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: `Comprehensive dashboard error: ${error}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getDashboard(): Promise<ApiResponse<any>> {
    try {
      // Get portfolio data from the working API
      const portfolioResponse = await this.request('/api/v1/portfolio');
      const marketDataResponse = await this.request('/api/v1/market-data');

      if (portfolioResponse.success && marketDataResponse.success) {
        // Cast the data to access properties
        const portfolioData = portfolioResponse.data as any;
        const marketDataRaw = marketDataResponse.data as any;

        // Transform market data from object to array format with proper field mapping
        const marketDataArray = marketDataRaw.data
          ? Object.values(marketDataRaw.data).map((stock: any) => ({
              symbol: stock.symbol,
              close_price: stock.price,
              high_price: stock.price * 1.02, // Mock high price (2% above current)
              low_price: stock.price * 0.98, // Mock low price (2% below current)
              volume: stock.volume,
              timestamp: stock.timestamp,
              change: stock.change,
              change_percent: stock.change_percent,
            }))
          : Object.values(marketDataRaw).map((stock: any) => ({
              symbol: stock.symbol,
              close_price: stock.price,
              high_price: stock.price * 1.02,
              low_price: stock.price * 0.98,
              volume: stock.volume,
              timestamp: stock.timestamp,
              change: stock.change,
              change_percent: stock.change_percent,
            }));

        // Combine portfolio and market data into dashboard format
        const dashboard = {
          timestamp: new Date().toISOString(),
          portfolio: {
            id: portfolioData.id,
            name: portfolioData.name,
            total_value: portfolioData.account_value, // Fixed: using account_value from API
            cash_balance: portfolioData.cash_balance,
            total_pnl: portfolioData.total_return,
            total_pnl_percent: portfolioData.total_return_percent,
            positions_count: portfolioData.positions_count,
            positions_value: portfolioData.account_value - portfolioData.cash_balance,
            positions: [], // Mock positions for now
          },
          market_data: marketDataArray,
          system_status: 'operational',
        };
        return {
          success: true,
          data: dashboard,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: false,
        error: 'Failed to fetch dashboard data',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: `Dashboard error: ${error}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getPortfolioPerformance(): Promise<ApiResponse<any>> {
    return this.request('/dashboard', { baseURL: this.dashboardURL });
  }

  async getDashboardHealth(): Promise<ApiResponse<any>> {
    return this.request('/health', { baseURL: this.dashboardURL });
  }

  // Enhanced Market Data with Database Integration
  async getMarketDataLatest(symbol: string): Promise<ApiResponse<any>> {
    return this.request(`/market-data/${symbol}/latest`, { baseURL: 'http://localhost:8141' });
  }

  async getTradingSignals(): Promise<ApiResponse<any>> {
    return this.request('/trading-signals', { baseURL: 'http://localhost:8141' });
  }

  // Enhanced Portfolio Service Database Integration
  async getPortfolioFromDB(): Promise<ApiResponse<any>> {
    return this.request('/portfolios', { baseURL: 'http://localhost:8100' });
  }

  async getPositionsFromDB(): Promise<ApiResponse<any>> {
    return this.request('/positions', { baseURL: 'http://localhost:8100' });
  }

  // Enhanced Order Management Database Integration
  async getOrdersFromDB(): Promise<ApiResponse<any>> {
    return this.request('/orders', { baseURL: 'http://localhost:8160' });
  }

  async createOrderDB(order: any): Promise<ApiResponse<any>> {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(order),
      baseURL: 'http://localhost:8160',
    });
  }

  // Risk Management Integration
  async getRiskMetrics(): Promise<ApiResponse<any>> {
    return this.request('/risk-metrics', { baseURL: 'http://localhost:8180' });
  }

  async getRiskAlerts(): Promise<ApiResponse<any>> {
    return this.request('/risk-alerts', { baseURL: 'http://localhost:8180' });
  }

  async checkTradeRisk(trade: any): Promise<ApiResponse<any>> {
    return this.request('/check-trade-risk', {
      method: 'POST',
      body: JSON.stringify(trade),
      baseURL: 'http://localhost:8180',
    });
  }

  // Alpaca Integration (direct service access on :8200 until gateway route added)
  async getAlpacaHealth(): Promise<ApiResponse<any>> {
    return this.request('/health', { baseURL: 'http://localhost:8200' });
  }

  async getAlpacaAccount(): Promise<ApiResponse<any>> {
    return this.request('/account', { baseURL: 'http://localhost:8200' });
  }

  async injectAlpacaCredentials(payload: {
    environment: 'paper' | 'live';
    api_key: string;
    secret_key: string;
    persist: boolean;
    encrypt: boolean;
  }): Promise<ApiResponse<any>> {
    return this.request('/credentials', {
      method: 'POST',
      body: JSON.stringify(payload),
      baseURL: 'http://localhost:8200',
    });
  }
}

export const apiService = new ApiService();
export default apiService;
