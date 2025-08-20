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
  NewsItem
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

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication
  async login(username: string, password: string) {
    const response = await this.request<{ access_token: string; token_type: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

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
  async getOrders(page: number = 1, limit: number = 50): Promise<ApiResponse<PaginatedResponse<Order>>> {
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

  async updateUserPreferences(preferences: Partial<UserPreferences>): Promise<ApiResponse<UserPreferences>> {
    return this.request('/api/v1/user/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }

  // NEW: Dashboard API Integration
  async getComprehensiveDashboard(): Promise<ApiResponse<any>> {
    return this.request('/dashboard', { baseURL: this.dashboardURL });
  }

  async getPortfolioPerformance(): Promise<ApiResponse<any>> {
    return this.request('/portfolio/performance', { baseURL: this.dashboardURL });
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
      baseURL: 'http://localhost:8160'
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
      baseURL: 'http://localhost:8180'
    });
  }
}

export const apiService = new ApiService();
export default apiService;
