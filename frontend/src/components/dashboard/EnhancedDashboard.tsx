import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  ShowChart,
  AccountBalance,
  Speed,
  Refresh,
  Warning,
  CheckCircle,
  Info,
  Error,
} from '@mui/icons-material';
import { apiService } from '../../services/apiService';

interface DashboardData {
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
  recent_orders: Array<{
    id: string;
    symbol: string;
    side: string;
    quantity: number;
    price: number;
    status: string;
    created_at: string;
  }>;
  market_data: Array<{
    symbol: string;
    close_price: number;
    high_price: number;
    low_price: number;
    volume: number;
    timestamp: string;
  }>;
  trading_signals: Array<{
    symbol: string;
    signal_type: string;
    strategy: string;
    confidence: number;
    price_target: number;
    created_at: string;
  }>;
  risk_alerts: Array<{
    id: string;
    severity: string;
    title: string;
    message: string;
    created_at: string;
  }>;
  risk_metrics: {
    var_1d: number;
    var_5d: number;
    sharpe_ratio: number;
    max_drawdown: number;
    beta: number;
    exposure: number;
  };
}

interface PerformanceData {
  portfolio_id: string;
  total_value: number;
  cash_balance: number;
  invested_amount: number;
  market_value: number;
  total_pnl: number;
  total_return_percent: number;
  cash_percentage: number;
  invested_percentage: number;
  positions: Array<{
    symbol: string;
    quantity: number;
    average_price: number;
    current_price: number;
    market_value: number;
    unrealized_pnl: number;
    unrealized_pnl_percent: number;
    weight: number;
  }>;
  diversification_score: number;
}

const EnhancedDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

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

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return <Error color="error" />;
      case 'medium':
        return <Warning color="warning" />;
      case 'low':
        return <Info color="info" />;
      default:
        return <CheckCircle color="success" />;
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch comprehensive dashboard data
      const dashboardResponse = await apiService.getComprehensiveDashboard();
      if (dashboardResponse.success) {
        setDashboardData(dashboardResponse.data);
      }

      // Fetch performance data
      const performanceResponse = await apiService.getPortfolioPerformance();
      if (performanceResponse.success) {
        setPerformanceData(performanceResponse.data);
      }

      setLastRefresh(new Date());
    } catch (err: unknown) {
      let errorMessage = 'Failed to fetch dashboard data';
      if (err instanceof Error) {
        errorMessage = (err as Error).message;
      }
      setError(errorMessage);
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !dashboardData) {
    return (
      <Box sx={{ width: '100%', p: 3 }}>
        <LinearProgress />
        <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
          Loading comprehensive dashboard data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <IconButton onClick={fetchDashboardData} color="primary">
          <Refresh />
        </IconButton>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Trading Dashboard
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </Typography>
          <Tooltip title="Refresh Dashboard">
            <IconButton onClick={fetchDashboardData} color="primary" disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {dashboardData && (
        <Grid container spacing={3}>
          {/* Portfolio Overview Cards */}
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AccountBalance sx={{ mr: 1 }} />
                  <Typography variant="h6">Total Value</Typography>
                </Box>
                <Typography variant="h4" sx={{ mb: 1 }}>
                  {formatCurrency(dashboardData.portfolio.total_value)}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: getPnLColor(dashboardData.portfolio.total_pnl),
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {dashboardData.portfolio.total_pnl > 0 ? <TrendingUp /> : <TrendingDown />}
                  {formatCurrency(dashboardData.portfolio.total_pnl)} ({formatPercent(dashboardData.portfolio.total_pnl_percent)})
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Cash Balance</Typography>
                <Typography variant="h4" sx={{ mb: 1 }}>
                  {formatCurrency(dashboardData.portfolio.cash_balance)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Available for trading
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Active Positions</Typography>
                <Typography variant="h4" sx={{ mb: 1 }}>
                  {dashboardData.portfolio.positions_count}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatCurrency(dashboardData.portfolio.positions_value)} invested
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Speed sx={{ mr: 1 }} />
                  <Typography variant="h6">Risk Score</Typography>
                </Box>
                <Typography variant="h4" sx={{ mb: 1 }}>
                  {dashboardData.risk_metrics.beta.toFixed(2)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Beta coefficient
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Market Data */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <ShowChart sx={{ mr: 1 }} />
                  Portfolio Holdings
                </Typography>
                <List dense>
                  {dashboardData.market_data.map((stock) => (
                    <ListItem key={stock.symbol} divider>
                      <ListItemText
                        primary={stock.symbol}
                        secondary={`Vol: ${stock.volume.toLocaleString()}`}
                      />
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                          {formatCurrency(stock.close_price)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          H: {formatCurrency(stock.high_price)} L: {formatCurrency(stock.low_price)}
                        </Typography>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Trading Signals */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Trading Signals
                </Typography>
                <List dense>
                  {dashboardData.trading_signals.map((signal, index) => (
                    <ListItem key={index} divider>
                      <ListItemIcon>
                        {signal.signal_type === 'buy' ? (
                          <TrendingUp color="success" />
                        ) : signal.signal_type === 'sell' ? (
                          <TrendingDown color="error" />
                        ) : (
                          <ShowChart color="warning" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={`${signal.symbol} - ${signal.signal_type.toUpperCase()}`}
                        secondary={`${signal.strategy} | Confidence: ${(signal.confidence * 100).toFixed(1)}%`}
                      />
                      <Box sx={{ textAlign: 'right' }}>
                        <Chip 
                          size="small" 
                          label={`Target: ${formatCurrency(signal.price_target)}`}
                          color={signal.signal_type === 'buy' ? 'success' : signal.signal_type === 'sell' ? 'error' : 'default'}
                        />
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Orders */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Orders
                </Typography>
                <List dense>
                  {dashboardData.recent_orders.map((order) => (
                    <ListItem key={order.id} divider>
                      <ListItemText
                        primary={`${order.symbol} - ${order.side.toUpperCase()}`}
                        secondary={`${order.quantity} @ ${formatCurrency(order.price)}`}
                      />
                      <Chip 
                        size="small" 
                        label={order.status}
                        color={order.status === 'filled' ? 'success' : order.status === 'pending' ? 'warning' : 'default'}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Risk Metrics & Alerts */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Risk Management
                </Typography>
                
                {/* Risk Metrics */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Key Metrics</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">1-Day VaR</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                        {formatCurrency(dashboardData.risk_metrics.var_1d)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Sharpe Ratio</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                        {dashboardData.risk_metrics.sharpe_ratio.toFixed(2)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Max Drawdown</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                        {formatPercent(dashboardData.risk_metrics.max_drawdown * 100)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Total Exposure</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {formatCurrency(dashboardData.risk_metrics.exposure)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                {/* Risk Alerts */}
                {dashboardData.risk_alerts.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>Active Alerts</Typography>
                    <List dense>
                      {dashboardData.risk_alerts.map((alert) => (
                        <ListItem key={alert.id}>
                          <ListItemIcon>
                            {getSeverityIcon(alert.severity)}
                          </ListItemIcon>
                          <ListItemText
                            primary={alert.title}
                            secondary={alert.message}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Portfolio Performance Details */}
          {performanceData && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Portfolio Performance Analysis
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>Allocation</Typography>
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">Cash</Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={performanceData.cash_percentage} 
                            sx={{ mb: 0.5 }}
                          />
                          <Typography variant="body2">{formatPercent(performanceData.cash_percentage)}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Invested</Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={performanceData.invested_percentage}
                            color="secondary"
                            sx={{ mb: 0.5 }}
                          />
                          <Typography variant="body2">{formatPercent(performanceData.invested_percentage)}</Typography>
                        </Box>
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>Returns</Typography>
                        <Typography variant="h5" sx={{ color: getPnLColor(performanceData.total_pnl) }}>
                          {formatPercent(performanceData.total_return_percent)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatCurrency(performanceData.total_pnl)} total P&L
                        </Typography>
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>Diversification</Typography>
                        <Typography variant="h5">
                          {performanceData.diversification_score}/100
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {performanceData.positions.length} positions
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  {/* Position Details */}
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>Position Details</Typography>
                    <Grid container spacing={2}>
                      {performanceData.positions.map((position) => (
                        <Grid item xs={12} md={6} lg={4} key={position.symbol}>
                          <Paper sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="h6">{position.symbol}</Typography>
                              <Chip 
                                size="small" 
                                label={`${position.weight.toFixed(1)}%`}
                                color="primary"
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {position.quantity} shares @ {formatCurrency(position.average_price)}
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                              {formatCurrency(position.market_value)}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: getPnLColor(position.unrealized_pnl),
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              {position.unrealized_pnl > 0 ? <TrendingUp fontSize="small" /> : <TrendingDown fontSize="small" />}
                              {formatCurrency(position.unrealized_pnl)} ({formatPercent(position.unrealized_pnl_percent)})
                            </Typography>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
};

export default EnhancedDashboard;
