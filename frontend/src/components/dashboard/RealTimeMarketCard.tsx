import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Refresh,
  ShowChart,
  Speed,
} from '@mui/icons-material';
import { apiService } from '../../services/apiService';

interface MarketDataItem {
  symbol: string;
  close_price: number;
  high_price: number;
  low_price: number;
  volume: number;
  timestamp: string;
}

interface TradingSignal {
  symbol: string;
  signal_type: string;
  strategy: string;
  confidence: number;
  price_target: number;
  created_at: string;
}

const RealTimeMarketCard: React.FC = () => {
  const [marketData, setMarketData] = useState<MarketDataItem[]>([]);
  const [tradingSignals, setTradingSignals] = useState<TradingSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatVolume = (volume: number): string => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
  };

  const getSignalColor = (signalType: string): 'success' | 'error' | 'warning' => {
    switch (signalType.toLowerCase()) {
      case 'buy':
        return 'success';
      case 'sell':
        return 'error';
      default:
        return 'warning';
    }
  };

  const getSignalIcon = (signalType: string) => {
    switch (signalType.toLowerCase()) {
      case 'buy':
        return <TrendingUp />;
      case 'sell':
        return <TrendingDown />;
      default:
        return <ShowChart />;
    }
  };

  const fetchMarketData = async () => {
    try {
      setError(null);
      
      const response = await apiService.getComprehensiveDashboard();
      if (response.success) {
        setMarketData(response.data.market_data || []);
        setTradingSignals(response.data.trading_signals || []);
        setLastUpdate(new Date());
      } else {
        setError('Failed to fetch market data');
      }
    } catch (err: unknown) {
      let errorMessage = 'Failed to fetch market data';
      if (err instanceof Error) {
        errorMessage = (err as Error).message;
      }
      setError(errorMessage);
      console.error('Market data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();

    // Auto-refresh every 10 seconds for market data
    const interval = setInterval(fetchMarketData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading && marketData.length === 0) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ width: '100%' }}>
            <LinearProgress />
            <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
              Loading real-time market data...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <IconButton onClick={fetchMarketData} color="primary">
              <Refresh />
            </IconButton>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            <ShowChart sx={{ mr: 1 }} />
            Live Market Data
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {lastUpdate.toLocaleTimeString()}
            </Typography>
            <Tooltip title="Refresh Market Data">
              <IconButton size="small" onClick={fetchMarketData} disabled={loading}>
                <Refresh fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Market Data Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Current Holdings Price
          </Typography>
          {marketData.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No market data available
            </Typography>
          ) : (
            <List dense>
              {marketData.map((stock) => (
                <ListItem 
                  key={stock.symbol} 
                  sx={{ 
                    px: 0, 
                    py: 0.5,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:last-child': { borderBottom: 'none' }
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {stock.symbol}
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                          {formatCurrency(stock.close_price)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          H: {formatCurrency(stock.high_price)} L: {formatCurrency(stock.low_price)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Vol: {formatVolume(stock.volume)}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        {/* Trading Signals Section */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <Speed sx={{ mr: 1, fontSize: 16 }} />
            Live Trading Signals
          </Typography>
          {tradingSignals.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No active signals
            </Typography>
          ) : (
            <List dense>
              {tradingSignals.slice(0, 4).map((signal, index) => (
                <ListItem 
                  key={index} 
                  sx={{ 
                    px: 0, 
                    py: 0.5,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:last-child': { borderBottom: 'none' }
                  }}
                >
                  <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                    {getSignalIcon(signal.signal_type)}
                  </Box>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {signal.symbol}
                        </Typography>
                        <Chip
                          size="small"
                          label={signal.signal_type.toUpperCase()}
                          color={getSignalColor(signal.signal_type)}
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" color="text.secondary">
                            {signal.strategy}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Target: {formatCurrency(signal.price_target)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                            Confidence:
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={signal.confidence * 100}
                            sx={{ 
                              flexGrow: 1, 
                              mr: 1, 
                              height: 4, 
                              borderRadius: 2,
                              bgcolor: 'grey.300'
                            }}
                            color={signal.confidence > 0.7 ? 'success' : signal.confidence > 0.5 ? 'warning' : 'error'}
                          />
                          <Typography variant="body2" color="text.secondary">
                            {(signal.confidence * 100).toFixed(0)}%
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        {/* Market Status Indicator */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          p: 1, 
          bgcolor: 'success.light', 
          borderRadius: 1, 
          color: 'success.contrastText' 
        }}>
          <Box sx={{ width: 8, height: 8, bgcolor: 'success.main', borderRadius: '50%', mr: 1 }} />
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            Market Open - Live Data
          </Typography>
        </Box>

        {loading && (
          <Box sx={{ mt: 1 }}>
            <LinearProgress sx={{ height: 2 }} />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default RealTimeMarketCard;
