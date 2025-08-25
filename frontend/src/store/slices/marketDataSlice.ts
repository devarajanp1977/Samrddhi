import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MarketData } from '../../types';

interface MarketDataState {
  quotes: Record<string, MarketData>;
  watchlist: string[];
  loading: boolean;
  error: string | null;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
}

const initialState: MarketDataState = {
  quotes: {},
  watchlist: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX'],
  loading: false,
  error: null,
  connectionStatus: 'disconnected',
};

const marketDataSlice = createSlice({
  name: 'marketData',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    setConnectionStatus: (
      state,
      action: PayloadAction<'connected' | 'connecting' | 'disconnected'>
    ) => {
      state.connectionStatus = action.payload;
    },
    updateQuote: (state, action: PayloadAction<MarketData>) => {
      state.quotes[action.payload.symbol] = action.payload;
    },
    updateQuotes: (state, action: PayloadAction<MarketData[]>) => {
      action.payload.forEach((quote) => {
        state.quotes[quote.symbol] = quote;
      });
      state.loading = false;
      state.error = null;
    },
    addToWatchlist: (state, action: PayloadAction<string>) => {
      if (!state.watchlist.includes(action.payload)) {
        state.watchlist.push(action.payload);
      }
    },
    removeFromWatchlist: (state, action: PayloadAction<string>) => {
      state.watchlist = state.watchlist.filter((symbol) => symbol !== action.payload);
    },
    setWatchlist: (state, action: PayloadAction<string[]>) => {
      state.watchlist = action.payload;
    },
    clearQuotes: (state) => {
      state.quotes = {};
    },
  },
});

export const {
  setLoading,
  setError,
  setConnectionStatus,
  updateQuote,
  updateQuotes,
  addToWatchlist,
  removeFromWatchlist,
  setWatchlist,
  clearQuotes,
} = marketDataSlice.actions;

export default marketDataSlice.reducer;
