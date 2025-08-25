/**
 * Alpaca Trading API Service
 * Handles paper trading operations and account management
 */

export interface AlpacaAccount {
  account_id: string;
  status: string;
  buying_power: number;
  cash: number;
  portfolio_value: number;
  equity: number;
  day_trading_buying_power: number;
  paper_trading: boolean;
}

export interface AlpacaPosition {
  symbol: string;
  qty: number;
  side: string;
  market_value: number;
  cost_basis: number;
  unrealized_pl: number;
  unrealized_plpc: number;
  current_price: number;
}

export interface AlpacaOrder {
  order_id: string;
  symbol: string;
  qty: number;
  filled_qty: number;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop';
  status: string;
  submitted_at?: string;
  filled_at?: string;
  filled_avg_price: number;
}

export interface OrderRequest {
  symbol: string;
  qty: number;
  side: 'buy' | 'sell';
  type?: 'market' | 'limit';
  time_in_force?: 'day' | 'gtc';
  limit_price?: number;
  stop_price?: number;
}

class AlpacaApiService {
  private readonly BASE_URL = 'http://localhost:8200';

  /**
   * Get account information
   */
  async getAccount(): Promise<AlpacaAccount | null> {
    try {
      const response = await fetch(`${this.BASE_URL}/account`);
      if (!response.ok) {
        throw new Error(`Failed to fetch account: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching account:', error);
      return null;
    }
  }

  /**
   * Get current positions
   */
  async getPositions(): Promise<AlpacaPosition[]> {
    try {
      const response = await fetch(`${this.BASE_URL}/positions`);
      if (!response.ok) {
        throw new Error(`Failed to fetch positions: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching positions:', error);
      return [];
    }
  }

  /**
   * Get market data for a symbol
   */
  async getMarketData(symbol: string): Promise<any> {
    try {
      const response = await fetch(`${this.BASE_URL}/market-data/${symbol}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch market data for ${symbol}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching market data for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Place a trading order
   */
  async placeOrder(orderRequest: OrderRequest): Promise<AlpacaOrder | null> {
    try {
      const response = await fetch(`${this.BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderRequest),
      });

      if (!response.ok) {
        throw new Error(`Failed to place order: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error placing order:', error);
      return null;
    }
  }

  /**
   * Get recent orders
   */
  async getOrders(): Promise<AlpacaOrder[]> {
    try {
      const response = await fetch(`${this.BASE_URL}/orders`);
      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  }

  /**
   * Check service health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.BASE_URL}/health`);
      return response.ok;
    } catch (error) {
      console.error('Alpaca service health check failed:', error);
      return false;
    }
  }

  /**
   * Buy a stock (market order)
   */
  async buyStock(symbol: string, quantity: number): Promise<AlpacaOrder | null> {
    return this.placeOrder({
      symbol,
      qty: quantity,
      side: 'buy',
      type: 'market',
      time_in_force: 'day',
    });
  }

  /**
   * Sell a stock (market order)
   */
  async sellStock(symbol: string, quantity: number): Promise<AlpacaOrder | null> {
    return this.placeOrder({
      symbol,
      qty: quantity,
      side: 'sell',
      type: 'market',
      time_in_force: 'day',
    });
  }

  /**
   * Place a limit order
   */
  async placeLimitOrder(
    symbol: string,
    quantity: number,
    side: 'buy' | 'sell',
    limitPrice: number
  ): Promise<AlpacaOrder | null> {
    return this.placeOrder({
      symbol,
      qty: quantity,
      side,
      type: 'limit',
      limit_price: limitPrice,
      time_in_force: 'day',
    });
  }

  /**
   * Get WebSocket connection for real-time updates
   */
  connectWebSocket(): WebSocket | null {
    try {
      const ws = new WebSocket(`ws://localhost:8200/ws`);

      ws.onopen = () => {
        console.log('Connected to Alpaca WebSocket');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Alpaca WebSocket message:', data);
          // Handle real-time updates here
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('Alpaca WebSocket connection closed');
      };

      ws.onerror = (error) => {
        console.error('Alpaca WebSocket error:', error);
      };

      return ws;
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      return null;
    }
  }
}

// Export singleton instance
export const alpacaApi = new AlpacaApiService();
export default alpacaApi;
