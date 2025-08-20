import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Account } from '../../types';

interface AccountState extends Account {
  loading: boolean;
  error: string | null;
}

const initialState: AccountState = {
  id: '',
  accountNumber: '',
  totalValue: 0,
  buyingPower: 0,
  cash: 0,
  dayTrades: 0,
  dayTradesLimit: 3,
  patternDayTrader: false,
  status: 'active',
  type: 'cash',
  lastUpdated: new Date().toISOString(),
  loading: false,
  error: null,
};

const accountSlice = createSlice({
  name: 'account',
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
    updateAccount: (state, action: PayloadAction<Partial<Account>>) => {
      Object.assign(state, action.payload);
      state.lastUpdated = new Date().toISOString();
      state.loading = false;
      state.error = null;
    },
    updateDayTrades: (state, action: PayloadAction<number>) => {
      state.dayTrades = action.payload;
      state.lastUpdated = new Date().toISOString();
    },
    updateBuyingPower: (state, action: PayloadAction<number>) => {
      state.buyingPower = action.payload;
      state.lastUpdated = new Date().toISOString();
    },
    updateCash: (state, action: PayloadAction<number>) => {
      state.cash = action.payload;
      state.lastUpdated = new Date().toISOString();
    },
    setAccountStatus: (state, action: PayloadAction<'active' | 'restricted' | 'suspended'>) => {
      state.status = action.payload;
      state.lastUpdated = new Date().toISOString();
    },
  },
});

export const {
  setLoading,
  setError,
  updateAccount,
  updateDayTrades,
  updateBuyingPower,
  updateCash,
  setAccountStatus,
} = accountSlice.actions;

export default accountSlice.reducer;
