import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Portfolio, Position } from '../../types';

interface PortfolioState extends Portfolio {
  loading: boolean;
  error: string | null;
}

const initialState: PortfolioState = {
  totalValue: 0,
  totalCost: 0,
  totalPnL: 0,
  totalPnLPercent: 0,
  dayPnL: 0,
  dayPnLPercent: 0,
  buyingPower: 0,
  cash: 0,
  positions: [],
  lastUpdated: new Date().toISOString(),
  loading: false,
  error: null,
};

const portfolioSlice = createSlice({
  name: 'portfolio',
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
    updatePortfolio: (state, action: PayloadAction<Partial<Portfolio>>) => {
      Object.assign(state, action.payload);
      state.lastUpdated = new Date().toISOString();
      state.loading = false;
      state.error = null;
    },
    updatePosition: (state, action: PayloadAction<Position>) => {
      const index = state.positions.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        state.positions[index] = action.payload;
      } else {
        state.positions.push(action.payload);
      }
      state.lastUpdated = new Date().toISOString();
    },
    removePosition: (state, action: PayloadAction<string>) => {
      state.positions = state.positions.filter((p) => p.id !== action.payload);
      state.lastUpdated = new Date().toISOString();
    },
    updatePortfolioValue: (
      state,
      action: PayloadAction<{ totalValue: number; dayPnL: number; dayPnLPercent: number }>
    ) => {
      state.totalValue = action.payload.totalValue;
      state.dayPnL = action.payload.dayPnL;
      state.dayPnLPercent = action.payload.dayPnLPercent;
      state.totalPnL = state.totalValue - state.totalCost;
      state.totalPnLPercent = state.totalCost > 0 ? (state.totalPnL / state.totalCost) * 100 : 0;
      state.lastUpdated = new Date().toISOString();
    },
  },
});

export const {
  setLoading,
  setError,
  updatePortfolio,
  updatePosition,
  removePosition,
  updatePortfolioValue,
} = portfolioSlice.actions;

export default portfolioSlice.reducer;
