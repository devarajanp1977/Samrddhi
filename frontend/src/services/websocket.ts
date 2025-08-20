import { store } from '../store';
import {
  updateQuote,
  updateQuotes,
  setConnectionStatus,
} from '../store/slices/marketDataSlice';
import {
  updatePortfolio,
  updatePosition,
} from '../store/slices/portfolioSlice';
import {
  addOrder,
  updateOrder,
} from '../store/slices/ordersSlice';
import {
  addAlert,
} from '../store/slices/alertsSlice';
import { WebSocketMessage } from '../types';

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectInterval: number = 5000;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private url: string;

  constructor() {
    this.url = process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws';
  }

  connect() {
    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = this.onOpen.bind(this);
      this.ws.onmessage = this.onMessage.bind(this);
      this.ws.onclose = this.onClose.bind(this);
      this.ws.onerror = this.onError.bind(this);
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.scheduleReconnect();
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private onOpen() {
    console.log('WebSocket connected');
    store.dispatch(setConnectionStatus('connected'));
    this.reconnectAttempts = 0;
    
    // Subscribe to market data for watchlist
    this.subscribe('market_data', {
      symbols: store.getState().marketData.watchlist,
    });
    
    // Subscribe to portfolio updates
    this.subscribe('portfolio_updates', {});
    
    // Subscribe to order updates
    this.subscribe('order_updates', {});
    
    // Subscribe to alerts
    this.subscribe('alerts', {});
  }

  private onMessage(event: MessageEvent) {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      this.handleMessage(message);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  private onClose() {
    console.log('WebSocket disconnected');
    store.dispatch(setConnectionStatus('disconnected'));
    this.scheduleReconnect();
  }

  private onError(error: Event) {
    console.error('WebSocket error:', error);
    store.dispatch(setConnectionStatus('disconnected'));
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect in ${this.reconnectInterval}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        store.dispatch(setConnectionStatus('connecting'));
        this.connect();
      }, this.reconnectInterval);
      
      // Exponential backoff
      this.reconnectInterval = Math.min(this.reconnectInterval * 2, 30000);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  private handleMessage(message: WebSocketMessage) {
    const { type, data } = message;
    
    switch (type) {
      case 'market_data':
        if (Array.isArray(data)) {
          store.dispatch(updateQuotes(data));
        } else {
          store.dispatch(updateQuote(data));
        }
        break;
        
      case 'portfolio_update':
        if (data.type === 'portfolio') {
          store.dispatch(updatePortfolio(data.portfolio));
        } else if (data.type === 'position') {
          store.dispatch(updatePosition(data.position));
        }
        break;
        
      case 'order_update':
        if (data.action === 'create') {
          store.dispatch(addOrder(data.order));
        } else if (data.action === 'update') {
          store.dispatch(updateOrder(data.order));
        }
        break;
        
      case 'alert':
        store.dispatch(addAlert(data));
        break;
        
      case 'system':
        console.log('System message:', data);
        break;
        
      default:
        console.log('Unknown message type:', type);
    }
  }

  subscribe(channel: string, params: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = {
        action: 'subscribe',
        channel,
        params,
      };
      this.ws.send(JSON.stringify(message));
    }
  }

  unsubscribe(channel: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = {
        action: 'unsubscribe',
        channel,
      };
      this.ws.send(JSON.stringify(message));
    }
  }

  send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }
}

export const webSocketService = new WebSocketService();
