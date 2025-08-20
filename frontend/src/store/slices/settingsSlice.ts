import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserPreferences } from '../../types';

interface SettingsState extends UserPreferences {
  loading: boolean;
  error: string | null;
}

const initialState: SettingsState = {
  theme: 'dark',
  timezone: 'America/New_York',
  defaultTimeframe: '5m',
  notifications: {
    email: true,
    push: true,
    desktop: true,
    orderFills: true,
    alerts: true,
    systemUpdates: true,
  },
  trading: {
    confirmOrders: true,
    defaultOrderType: 'limit',
    riskWarnings: true,
    autoRefresh: true,
    refreshInterval: 5000,
  },
  dashboard: {
    layout: 'default',
    widgets: ['portfolio', 'positions', 'watchlist', 'orders', 'news'],
    watchlist: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'],
  },
  loading: false,
  error: null,
};

const settingsSlice = createSlice({
  name: 'settings',
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
    updateSettings: (state, action: PayloadAction<Partial<UserPreferences>>) => {
      Object.assign(state, action.payload);
      state.loading = false;
      state.error = null;
    },
    updateTheme: (state, action: PayloadAction<'light' | 'dark' | 'auto'>) => {
      state.theme = action.payload;
    },
    updateTimezone: (state, action: PayloadAction<string>) => {
      state.timezone = action.payload;
    },
    updateNotificationSettings: (state, action: PayloadAction<Partial<UserPreferences['notifications']>>) => {
      state.notifications = { ...state.notifications, ...action.payload };
    },
    updateTradingSettings: (state, action: PayloadAction<Partial<UserPreferences['trading']>>) => {
      state.trading = { ...state.trading, ...action.payload };
    },
    updateDashboardSettings: (state, action: PayloadAction<Partial<UserPreferences['dashboard']>>) => {
      state.dashboard = { ...state.dashboard, ...action.payload };
    },
    addWidgetToDashboard: (state, action: PayloadAction<string>) => {
      if (!state.dashboard.widgets.includes(action.payload)) {
        state.dashboard.widgets.push(action.payload);
      }
    },
    removeWidgetFromDashboard: (state, action: PayloadAction<string>) => {
      state.dashboard.widgets = state.dashboard.widgets.filter(widget => widget !== action.payload);
    },
    updateDefaultTimeframe: (state, action: PayloadAction<string>) => {
      state.defaultTimeframe = action.payload;
    },
  },
});

export const {
  setLoading,
  setError,
  updateSettings,
  updateTheme,
  updateTimezone,
  updateNotificationSettings,
  updateTradingSettings,
  updateDashboardSettings,
  addWidgetToDashboard,
  removeWidgetFromDashboard,
  updateDefaultTimeframe,
} = settingsSlice.actions;

export default settingsSlice.reducer;
