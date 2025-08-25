import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Alert } from '../../types';

interface AlertsState {
  alerts: Alert[];
  loading: boolean;
  error: string | null;
}

const initialState: AlertsState = {
  alerts: [],
  loading: false,
  error: null,
};

const alertsSlice = createSlice({
  name: 'alerts',
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
    setAlerts: (state, action: PayloadAction<Alert[]>) => {
      state.alerts = action.payload;
      state.loading = false;
      state.error = null;
    },
    addAlert: (state, action: PayloadAction<Alert>) => {
      state.alerts.unshift(action.payload);
    },
    updateAlert: (state, action: PayloadAction<Alert>) => {
      const index = state.alerts.findIndex((alert) => alert.id === action.payload.id);
      if (index !== -1) {
        state.alerts[index] = action.payload;
      }
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const alert = state.alerts.find((alert) => alert.id === action.payload);
      if (alert) {
        alert.read = true;
      }
    },
    markAllAsRead: (state) => {
      state.alerts.forEach((alert) => {
        alert.read = true;
      });
    },
    removeAlert: (state, action: PayloadAction<string>) => {
      state.alerts = state.alerts.filter((alert) => alert.id !== action.payload);
    },
    clearExpiredAlerts: (state) => {
      const now = new Date().toISOString();
      state.alerts = state.alerts.filter((alert) => !alert.expiresAt || alert.expiresAt > now);
    },
  },
});

export const {
  setLoading,
  setError,
  setAlerts,
  addAlert,
  updateAlert,
  markAsRead,
  markAllAsRead,
  removeAlert,
  clearExpiredAlerts,
} = alertsSlice.actions;

export default alertsSlice.reducer;
