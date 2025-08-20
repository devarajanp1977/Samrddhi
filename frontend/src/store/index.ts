import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';

// Import slices (we'll create these next)
import portfolioSlice from './slices/portfolioSlice';
import alertsSlice from './slices/alertsSlice';
import accountSlice from './slices/accountSlice';
import marketDataSlice from './slices/marketDataSlice';
import ordersSlice from './slices/ordersSlice';
import strategiesSlice from './slices/strategiesSlice';
import settingsSlice from './slices/settingsSlice';

export const store = configureStore({
  reducer: {
    portfolio: portfolioSlice,
    alerts: alertsSlice,
    account: accountSlice,
    marketData: marketDataSlice,
    orders: ordersSlice,
    strategies: strategiesSlice,
    settings: settingsSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
