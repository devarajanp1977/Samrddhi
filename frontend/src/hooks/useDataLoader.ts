import { useEffect } from 'react';
import { useAppDispatch } from '../hooks/redux';
import { apiService } from '../services/apiService';
import { webSocketService } from '../services/websocket';
import { 
  setLoading as setPortfolioLoading,
  setError as setPortfolioError,
  updatePortfolio 
} from '../store/slices/portfolioSlice';
import {
  setLoading as setAccountLoading,
  setError as setAccountError,
  updateAccount
} from '../store/slices/accountSlice';
import {
  setLoading as setAlertsLoading,
  setError as setAlertsError,
  setAlerts
} from '../store/slices/alertsSlice';
import {
  setLoading as setOrdersLoading,
  setError as setOrdersError,
  setOrders
} from '../store/slices/ordersSlice';
import {
  setLoading as setStrategiesLoading,
  setError as setStrategiesError,
  setStrategies
} from '../store/slices/strategiesSlice';
import {
  setLoading as setMarketDataLoading,
  setError as setMarketDataError,
  updateQuotes,
  setConnectionStatus
} from '../store/slices/marketDataSlice';
import {
  mockPortfolio,
  mockAccount,
  mockOrders,
  mockStrategies,
  mockAlerts,
  mockMarketData
} from '../utils/mockData';

const USE_MOCK_DATA = process.env.REACT_APP_USE_MOCK_DATA !== 'false';

export const useInitializeApp = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        if (!USE_MOCK_DATA) {
          // Try to connect to backend services
          webSocketService.connect();
          
          // Load real data from backend
          await Promise.allSettled([
            loadPortfolioData(),
            loadAccountData(),
            loadOrdersData(),
            loadStrategiesData(),
            loadAlertsData(),
            loadMarketData(),
          ]);
        } else {
          // Use mock data for development
          console.log('Using mock data for development');
          loadMockData();
        }
      } catch (error) {
        console.error('App initialization failed, falling back to mock data:', error);
        loadMockData();
      }
    };

    const loadMockData = () => {
      // Load mock data immediately
      dispatch(updatePortfolio(mockPortfolio));
      dispatch(updateAccount(mockAccount));
      dispatch(setOrders(mockOrders));
      dispatch(setStrategies(mockStrategies));
      dispatch(setAlerts(mockAlerts));
      
      // Convert mock market data object to array
      const marketDataArray = Object.values(mockMarketData);
      dispatch(updateQuotes(marketDataArray));
      dispatch(setConnectionStatus('disconnected'));
      
      console.log('Mock data loaded successfully');
    };

    const loadPortfolioData = async () => {
      try {
        dispatch(setPortfolioLoading(true));
        
        const [portfolioResponse, positionsResponse] = await Promise.all([
          apiService.getPortfolio(),
          apiService.getPositions()
        ]);

        if (portfolioResponse.success && portfolioResponse.data) {
          const portfolioWithPositions = {
            ...portfolioResponse.data,
            positions: positionsResponse.data || []
          };
          dispatch(updatePortfolio(portfolioWithPositions));
        }
      } catch (error) {
        console.error('Portfolio loading failed:', error);
        dispatch(setPortfolioError(error instanceof Error ? error.message : 'Failed to load portfolio'));
        // Fall back to mock data
        dispatch(updatePortfolio(mockPortfolio));
      }
    };

    const loadAccountData = async () => {
      try {
        dispatch(setAccountLoading(true));
        
        const response = await apiService.getAccount();
        if (response.success && response.data) {
          dispatch(updateAccount(response.data));
        }
      } catch (error) {
        console.error('Account loading failed:', error);
        dispatch(setAccountError(error instanceof Error ? error.message : 'Failed to load account'));
        dispatch(updateAccount(mockAccount));
      }
    };

    const loadOrdersData = async () => {
      try {
        dispatch(setOrdersLoading(true));
        
        const response = await apiService.getOrders(1, 100);
        if (response.success && response.data) {
          dispatch(setOrders(response.data.data));
        }
      } catch (error) {
        console.error('Orders loading failed:', error);
        dispatch(setOrdersError(error instanceof Error ? error.message : 'Failed to load orders'));
        dispatch(setOrders(mockOrders));
      }
    };

    const loadStrategiesData = async () => {
      try {
        dispatch(setStrategiesLoading(true));
        
        const response = await apiService.getStrategies();
        if (response.success && response.data) {
          dispatch(setStrategies(response.data));
        }
      } catch (error) {
        console.error('Strategies loading failed:', error);
        dispatch(setStrategiesError(error instanceof Error ? error.message : 'Failed to load strategies'));
        dispatch(setStrategies(mockStrategies));
      }
    };

    const loadAlertsData = async () => {
      try {
        dispatch(setAlertsLoading(true));
        
        const response = await apiService.getAlerts();
        if (response.success && response.data) {
          dispatch(setAlerts(response.data));
        }
      } catch (error) {
        console.error('Alerts loading failed:', error);
        dispatch(setAlertsError(error instanceof Error ? error.message : 'Failed to load alerts'));
        dispatch(setAlerts(mockAlerts));
      }
    };

    const loadMarketData = async () => {
      try {
        dispatch(setMarketDataLoading(true));
        
        const watchlistSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX'];
        const response = await apiService.getQuotes(watchlistSymbols);
        
        if (response.success && response.data) {
          dispatch(updateQuotes(response.data));
          dispatch(setConnectionStatus('connected'));
        }
      } catch (error) {
        console.error('Market data loading failed:', error);
        dispatch(setMarketDataError(error instanceof Error ? error.message : 'Failed to load market data'));
        const marketDataArray = Object.values(mockMarketData);
        dispatch(updateQuotes(marketDataArray));
        dispatch(setConnectionStatus('disconnected'));
      }
    };

    initializeApp();

    // Cleanup on unmount
    return () => {
      if (!USE_MOCK_DATA) {
        webSocketService.disconnect();
      }
    };
  }, [dispatch]);
};

export const useRefreshData = () => {
  const dispatch = useAppDispatch();

  const refreshPortfolio = async () => {
    try {
      dispatch(setPortfolioLoading(true));
      const response = await apiService.getPortfolio();
      if (response.success && response.data) {
        dispatch(updatePortfolio(response.data));
      }
    } catch (error) {
      dispatch(setPortfolioError(error instanceof Error ? error.message : 'Failed to refresh portfolio'));
    }
  };

  const refreshMarketData = async (symbols?: string[]) => {
    try {
      dispatch(setMarketDataLoading(true));
      const watchlistSymbols = symbols || ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX'];
      const response = await apiService.getQuotes(watchlistSymbols);
      
      if (response.success && response.data) {
        dispatch(updateQuotes(response.data));
      }
    } catch (error) {
      dispatch(setMarketDataError(error instanceof Error ? error.message : 'Failed to refresh market data'));
    }
  };

  const refreshOrders = async () => {
    try {
      dispatch(setOrdersLoading(true));
      const response = await apiService.getOrders(1, 100);
      if (response.success && response.data) {
        dispatch(setOrders(response.data.data));
      }
    } catch (error) {
      dispatch(setOrdersError(error instanceof Error ? error.message : 'Failed to refresh orders'));
    }
  };

  return {
    refreshPortfolio,
    refreshMarketData,
    refreshOrders,
  };
};
