import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Strategy } from '../../types';

interface StrategiesState {
  strategies: Strategy[];
  activeStrategies: string[];
  loading: boolean;
  error: string | null;
}

const initialState: StrategiesState = {
  strategies: [],
  activeStrategies: [],
  loading: false,
  error: null,
};

const strategiesSlice = createSlice({
  name: 'strategies',
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
    setStrategies: (state, action: PayloadAction<Strategy[]>) => {
      state.strategies = action.payload;
      state.activeStrategies = action.payload.filter(s => s.status === 'active').map(s => s.id);
      state.loading = false;
      state.error = null;
    },
    addStrategy: (state, action: PayloadAction<Strategy>) => {
      state.strategies.push(action.payload);
      if (action.payload.status === 'active') {
        state.activeStrategies.push(action.payload.id);
      }
    },
    updateStrategy: (state, action: PayloadAction<Strategy>) => {
      const index = state.strategies.findIndex(strategy => strategy.id === action.payload.id);
      if (index !== -1) {
        const oldStrategy = state.strategies[index];
        state.strategies[index] = action.payload;
        
        // Update active strategies list
        if (oldStrategy.status === 'active' && action.payload.status !== 'active') {
          state.activeStrategies = state.activeStrategies.filter(id => id !== action.payload.id);
        } else if (oldStrategy.status !== 'active' && action.payload.status === 'active') {
          state.activeStrategies.push(action.payload.id);
        }
      }
    },
    removeStrategy: (state, action: PayloadAction<string>) => {
      state.strategies = state.strategies.filter(strategy => strategy.id !== action.payload);
      state.activeStrategies = state.activeStrategies.filter(id => id !== action.payload);
    },
    toggleStrategyStatus: (state, action: PayloadAction<string>) => {
      const strategy = state.strategies.find(s => s.id === action.payload);
      if (strategy) {
        const wasActive = strategy.status === 'active';
        strategy.status = wasActive ? 'inactive' : 'active';
        strategy.updatedAt = new Date().toISOString();
        
        if (wasActive) {
          state.activeStrategies = state.activeStrategies.filter(id => id !== action.payload);
        } else {
          state.activeStrategies.push(action.payload);
        }
      }
    },
    updateStrategyPerformance: (state, action: PayloadAction<{ id: string; performance: Strategy['performance'] }>) => {
      const strategy = state.strategies.find(s => s.id === action.payload.id);
      if (strategy) {
        strategy.performance = action.payload.performance;
        strategy.updatedAt = new Date().toISOString();
      }
    },
  },
});

export const {
  setLoading,
  setError,
  setStrategies,
  addStrategy,
  updateStrategy,
  removeStrategy,
  toggleStrategyStatus,
  updateStrategyPerformance,
} = strategiesSlice.actions;

export default strategiesSlice.reducer;
