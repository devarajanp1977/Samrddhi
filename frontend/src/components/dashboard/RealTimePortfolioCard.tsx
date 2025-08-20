import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Grid,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Refresh,
  Speed,
  ShowChart,
} from '@mui/icons-material';
import { apiService } from '../../services/apiService';

interface Position {
  symbol: string;
  quantity: number;
  average_price: number;
  current_price: number;
  market_value: number;
  unrealized_pnl: number;
  unrealized_pnl_percent: number;
  weight: number;
}

interface PortfolioPerformance {
  portfolio_id: string;
  total_value: number;
  cash_balance: number;
  invested_amount: number;
  market_value: number;
  total_pnl: number;
  total_return_percent: number;
  cash_percentage: number;
  invested_percentage: number;
  positions: Position[];
  diversification_score: number;
}

const RealTimePortfolioCard: React.FC = () => {
  const [portfolio, setPortfolio] = useState<PortfolioPerformance | null>(null);
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

  const formatPercent = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getPnLColor = (value: number): string => {
    if (value > 0) return '#4caf50';
    if (value < 0) return '#f44336';
    return '#666666';
  };

  const fetchPortfolioData = async () => {
    try {
      setError(null);
      
      const response = await apiService.getPortfolioPerformance();
      if (response.success) {
        setPortfolio(response.data);
        setLastUpdate(new Date());
      } else {
        setError('Failed to fetch portfolio data');
      }
    } catch (err: unknown) {
      let errorMessage = 'Failed to fetch portfolio data';
      if (err instanceof Error) {
        errorMessage = (err as Error).message;
      }
      setError(errorMessage);
      console.error('Portfolio data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolioData();

    // Auto-refresh every 15 seconds
    const interval = setInterval(fetchPortfolioData, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !portfolio) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ width: '100%' }}>
            <LinearProgress />
            <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
              Loading real-time portfolio data...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <IconButton onClick={fetchPortfolioData} color="primary">
              <Refresh />
            </IconButton>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!portfolio) {
    return (
      <Card>
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            No portfolio data available
          </Typography>
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
            Real-Time Portfolio
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {lastUpdate.toLocaleTimeString()}
            </Typography>
            <Tooltip title="Refresh Portfolio">
              <IconButton size="small" onClick={fetchPortfolioData} disabled={loading}>
                <Refresh fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Portfolio Summary */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {formatCurrency(portfolio.total_value)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Value
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 'bold',
                  color: getPnLColor(portfolio.total_pnl),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {portfolio.total_pnl > 0 ? <TrendingUp /> : <TrendingDown />}
                {formatPercent(portfolio.total_return_percent)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Return ({formatCurrency(portfolio.total_pnl)})
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Allocation Overview */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>Allocation</Typography>
          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2">Cash</Typography>
              <Typography variant="body2">{formatPercent(portfolio.cash_percentage)}</Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={portfolio.cash_percentage} 
              sx={{ mb: 1, height: 6, borderRadius: 3 }}
            />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2">Invested</Typography>
              <Typography variant="body2">{formatPercent(portfolio.invested_percentage)}</Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={portfolio.invested_percentage}
              color="secondary"
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        </Box>

        {/* Top Positions */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Top Holdings</Typography>
          {portfolio.positions.slice(0, 3).map((position) => (
            <Box key={position.symbol} sx={{ mb: 1.5, p: 1, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {position.symbol}
                </Typography>
                <Chip 
                  size="small" 
                  label={`${position.weight.toFixed(1)}%`}
                  color="primary"
                  variant="outlined"
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  {position.quantity} @ {formatCurrency(position.average_price)}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {formatCurrency(position.market_value)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Current: {formatCurrency(position.current_price)}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: getPnLColor(position.unrealized_pnl),
                    display: 'flex',
                    alignItems: 'center',
                    fontWeight: 'bold'
                  }}
                >
                  {position.unrealized_pnl > 0 ? <TrendingUp fontSize="small" /> : <TrendingDown fontSize="small" />}
                  {formatPercent(position.unrealized_pnl_percent)}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>

        {/* Portfolio Health */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, bgcolor: 'primary.light', borderRadius: 1, color: 'primary.contrastText' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Speed sx={{ mr: 1 }} />
            <Typography variant="body2">
              Diversification Score
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            {portfolio.diversification_score}/100
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

export default RealTimePortfolioCard;
