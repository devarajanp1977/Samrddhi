import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  LinearProgress,
  Box,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Paper,
  Divider,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  ShowChart,
  Assessment,
  MonetizationOn,
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

interface DashboardResponse {
  timestamp: string;
  portfolio: {
    id: string;
    name: string;
    total_value: number;
    cash_balance: number;
    total_pnl: number;
    total_pnl_percent: number;
    positions_count: number;
    positions_value: number;
  };
  recent_orders: any[];
  market_data: any[];
  trading_signals: any[];
  risk_alerts: any[];
  risk_metrics: any;
}

const RealTimePortfolioCard: React.FC = () => {
  const [portfolioData, setPortfolioData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (amount: number | undefined): string => {
    if (typeof amount !== 'number') return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercent = (value: number | undefined): string => {
    if (typeof value !== 'number') return '0.00%';
    return `${value.toFixed(2)}%`;
  };

  const fetchPortfolioData = async () => {
    try {
      setLoading(true);
      const response = await apiService.getDashboard();
      if (response.success) {
        setPortfolioData(response.data);
      } else {
        setError('Failed to fetch portfolio data');
      }
    } catch (err) {
      setError('Error fetching portfolio data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolioData();
    const interval = setInterval(fetchPortfolioData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading && !portfolioData) {
    return (
      <Card sx={{ minHeight: 400 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <MonetizationOn sx={{ mr: 1 }} />
            <Typography variant="h6">Portfolio Overview</Typography>
          </Box>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>
            Loading portfolio data...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ minHeight: 400 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <MonetizationOn sx={{ mr: 1 }} />
            <Typography variant="h6">Portfolio Overview</Typography>
          </Box>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  if (!portfolioData?.portfolio) {
    return (
      <Card sx={{ minHeight: 400 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <MonetizationOn sx={{ mr: 1 }} />
            <Typography variant="h6">Portfolio Overview</Typography>
          </Box>
          <Typography>No portfolio data available</Typography>
        </CardContent>
      </Card>
    );
  }

  const portfolio = portfolioData.portfolio;
  const totalReturn = portfolio.total_pnl || 0;
  const totalReturnPercent = portfolio.total_pnl_percent || 0;
  const cashPercentage = portfolio.total_value
    ? (portfolio.cash_balance / portfolio.total_value) * 100
    : 0;
  const investedPercentage = portfolio.total_value
    ? (portfolio.positions_value / portfolio.total_value) * 100
    : 0;

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <MonetizationOn />
          </Avatar>
        }
        title="Real-Time Portfolio"
        subheader={`Last updated: ${new Date().toLocaleTimeString()}`}
      />
      <CardContent>
        <Grid container spacing={3}>
          {/* Portfolio Value */}
          <Grid item xs={12} sm={6}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {formatCurrency(portfolio.total_value)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Portfolio Value
              </Typography>
            </Paper>
          </Grid>

          {/* Total Return */}
          <Grid item xs={12} sm={6}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                {totalReturn >= 0 ? (
                  <TrendingUp sx={{ color: 'success.main', mr: 1 }} />
                ) : (
                  <TrendingDown sx={{ color: 'error.main', mr: 1 }} />
                )}
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 'bold',
                    color: totalReturn >= 0 ? 'success.main' : 'error.main',
                  }}
                >
                  {formatCurrency(totalReturn)}
                </Typography>
              </Box>
              <Chip
                label={formatPercent(totalReturnPercent)}
                color={totalReturn >= 0 ? 'success' : 'error'}
                size="small"
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Total Return
              </Typography>
            </Paper>
          </Grid>

          {/* Cash Balance */}
          <Grid item xs={12} sm={6}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccountBalance sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h6">Cash</Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {formatCurrency(portfolio.cash_balance)}
              </Typography>
              <Box sx={{ mt: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={cashPercentage}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {formatPercent(cashPercentage)} of portfolio
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Invested Amount */}
          <Grid item xs={12} sm={6}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ShowChart sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h6">Invested</Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {formatCurrency(portfolio.positions_value)}
              </Typography>
              <Box sx={{ mt: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={investedPercentage}
                  color="warning"
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {formatPercent(investedPercentage)} of portfolio
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Portfolio Metrics */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <Assessment sx={{ mr: 1 }} />
                Portfolio Metrics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">
                    Total Positions
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {portfolio.positions_count}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">
                    Cash Ratio
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {formatPercent(cashPercentage)}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">
                    Investment Ratio
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {formatPercent(investedPercentage)}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">
                    Portfolio ID
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {portfolio.id.substring(0, 8)}...
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Recent Activity */}
          {portfolioData.recent_orders && portfolioData.recent_orders.length > 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Recent Orders
                </Typography>
                <List dense>
                  {portfolioData.recent_orders.slice(0, 3).map((order: any, index: number) => (
                    <ListItem key={index}>
                      <ListItemAvatar>
                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                          {order.symbol?.substring(0, 2)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${order.side} ${order.quantity} ${order.symbol}`}
                        secondary={`${formatCurrency(order.price)} - ${order.status}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default RealTimePortfolioCard;
