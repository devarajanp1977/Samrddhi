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

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
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
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
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
}

export const apiService = new ApiService();
export default apiService;
