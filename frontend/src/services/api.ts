import { ApiResponse, PaginatedResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = window.location.hostname === 'localhost' 
      ? 'http://localhost:8000'
      : 'https://api.samrddhi.com';
      
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor for auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - redirect to login or refresh token
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Portfolio API
  async getPortfolio(): Promise<Portfolio> {
    const response = await this.api.get<ApiResponse<Portfolio>>('/api/portfolio');
    return response.data.data!;
  }

  async getPositions(): Promise<Position[]> {
    const response = await this.api.get<ApiResponse<Position[]>>('/api/portfolio/positions');
    return response.data.data!;
  }

  // Orders API
  async getOrders(page = 1, pageSize = 50): Promise<PaginatedResponse<Order>> {
    const response = await this.api.get<ApiResponse<PaginatedResponse<Order>>>(
      `/api/orders?page=${page}&page_size=${pageSize}`
    );
    return response.data.data!;
  }

  async createOrder(order: Partial<Order>): Promise<Order> {
    const response = await this.api.post<ApiResponse<Order>>('/api/orders', order);
    return response.data.data!;
  }

  async cancelOrder(orderId: string): Promise<void> {
    await this.api.delete(`/api/orders/${orderId}`);
  }

  // Account API
  async getAccount(): Promise<Account> {
    const response = await this.api.get<ApiResponse<Account>>('/api/account');
    return response.data.data!;
  }

  // Strategies API
  async getStrategies(): Promise<Strategy[]> {
    const response = await this.api.get<ApiResponse<Strategy[]>>('/api/strategies');
    return response.data.data!;
  }

  async createStrategy(strategy: Partial<Strategy>): Promise<Strategy> {
    const response = await this.api.post<ApiResponse<Strategy>>('/api/strategies', strategy);
    return response.data.data!;
  }

  async updateStrategy(id: string, strategy: Partial<Strategy>): Promise<Strategy> {
    const response = await this.api.put<ApiResponse<Strategy>>(`/api/strategies/${id}`, strategy);
    return response.data.data!;
  }

  async deleteStrategy(id: string): Promise<void> {
    await this.api.delete(`/api/strategies/${id}`);
  }

  async toggleStrategy(id: string): Promise<Strategy> {
    const response = await this.api.post<ApiResponse<Strategy>>(`/api/strategies/${id}/toggle`);
    return response.data.data!;
  }

  // Market Data API
  async getQuotes(symbols: string[]) {
    const response = await this.api.post('/api/market-data/quotes', { symbols });
    return response.data.data;
  }

  async getHistoricalData(symbol: string, timeframe: string, start: string, end: string) {
    const response = await this.api.get(
      `/api/market-data/historical/${symbol}?timeframe=${timeframe}&start=${start}&end=${end}`
    );
    return response.data.data;
  }

  // System API
  async getSystemHealth() {
    const response = await this.api.get('/api/system/health');
    return response.data.data;
  }

  async getTradingStatus() {
    const response = await this.api.get('/api/system/trading-status');
    return response.data.data;
  }

  async enableTrading(): Promise<void> {
    await this.api.post('/api/system/enable-trading');
  }

  async disableTrading(): Promise<void> {
    await this.api.post('/api/system/disable-trading');
  }

  // Authentication API
  async login(username: string, password: string): Promise<{ token: string; user: any }> {
    const response = await this.api.post('/api/auth/login', { username, password });
    const { token, user } = response.data.data;
    localStorage.setItem('auth_token', token);
    return { token, user };
  }

  async logout(): Promise<void> {
    try {
      await this.api.post('/api/auth/logout');
    } finally {
      localStorage.removeItem('auth_token');
    }
  }

  async refreshToken(): Promise<string> {
    const response = await this.api.post('/api/auth/refresh');
    const { token } = response.data.data;
    localStorage.setItem('auth_token', token);
    return token;
  }

  // Utility method for manual API calls
  getAxiosInstance(): AxiosInstance {
    return this.api;
  }
}

export const apiService = new ApiService();
