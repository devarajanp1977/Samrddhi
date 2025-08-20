import React from 'react';
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
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  ShowChart,
  AccountBalance,
  Speed,
  Refresh,
} from '@mui/icons-material';
import { useAppSelector } from '../../hooks/redux';
import { MarketData } from '../../types';

const Dashboard: React.FC = () => {
  const portfolio = useAppSelector((state) => state.portfolio);
  const account = useAppSelector((state) => state.account);
  const alerts = useAppSelector((state) => state.alerts);
  const marketData = useAppSelector((state) => state.marketData);
  const orders = useAppSelector((state) => state.orders);
  const strategies = useAppSelector((state) => state.strategies);

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
    return '#ffffff';
  };

  const getTopMovers = (): MarketData[] => {
    return marketData.watchlist
      .map((symbol: string) => marketData.quotes[symbol])
      .filter((quote): quote is MarketData => Boolean(quote))
      .sort((a: MarketData, b: MarketData) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
      .slice(0, 5);
  };

  const getRecentOrders = () => {
    return orders.orders
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  };

  const getActiveAlerts = () => {
    return alerts.alerts
      .filter(alert => !alert.read && alert.severity === 'high')
      .slice(0, 3);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Portfolio Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Portfolio Value
                  </Typography>
                  <Typography variant="h5" component="div" fontWeight="bold">
                    {formatCurrency(portfolio.totalValue)}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: getPnLColor(portfolio.totalPnL) }}
                  >
                    {formatCurrency(portfolio.totalPnL)} ({formatPercent(portfolio.totalPnLPercent)})
                  </Typography>
                </Box>
                <AccountBalance color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Today's P&L
                  </Typography>
                  <Typography variant="h5" component="div" fontWeight="bold">
                    {formatCurrency(portfolio.dayPnL)}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: getPnLColor(portfolio.dayPnL) }}
                  >
                    {formatPercent(portfolio.dayPnLPercent)}
                  </Typography>
                </Box>
                {portfolio.dayPnL >= 0 ? (
                  <TrendingUp color="success" sx={{ fontSize: 40 }} />
                ) : (
                  <TrendingDown color="error" sx={{ fontSize: 40 }} />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Buying Power
                  </Typography>
                  <Typography variant="h5" component="div" fontWeight="bold">
                    {formatCurrency(portfolio.buyingPower)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Cash: {formatCurrency(portfolio.cash)}
                  </Typography>
                </Box>
                <ShowChart color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Active Positions
                  </Typography>
                  <Typography variant="h5" component="div" fontWeight="bold">
                    {portfolio.positions.length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {portfolio.positions.filter(p => p.unrealizedPnL > 0).length} profitable
                  </Typography>
                </Box>
                <Speed color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Trading Status */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" component="div">
                  Trading Status
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip
                    label={marketData.connectionStatus.toUpperCase()}
                    color={marketData.connectionStatus === 'connected' ? 'success' : 'error'}
                    size="small"
                  />
                  <Chip
                    label={`${strategies.activeStrategies.length} STRATEGIES ACTIVE`}
                    color="info"
                    size="small"
                  />
                </Box>
              </Box>

              {account.patternDayTrader && (
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">
                      Day Trades Used
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {account.dayTrades} / {account.dayTradesLimit}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(account.dayTrades / account.dayTradesLimit) * 100}
                    color={account.dayTrades >= account.dayTradesLimit - 1 ? 'error' : 'primary'}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Active Orders
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {orders.orders.filter(o => o.status === 'pending').length}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Filled Today
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {orders.orders.filter(o => 
                      o.status === 'filled' && 
                      new Date(o.updatedAt).toDateString() === new Date().toDateString()
                    ).length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div" gutterBottom>
                System Alerts
              </Typography>
              {getActiveAlerts().length === 0 ? (
                <Typography variant="body2" color="textSecondary">
                  No active alerts
                </Typography>
              ) : (
                getActiveAlerts().map((alert) => (
                  <Box key={alert.id} sx={{ mb: 2, p: 1, backgroundColor: 'rgba(244, 67, 54, 0.1)', borderRadius: 1 }}>
                    <Typography variant="body2" fontWeight="bold" color="error">
                      {alert.title}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {alert.message}
                    </Typography>
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Market Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" component="div">
                  Top Movers
                </Typography>
                <Tooltip title="Refresh">
                  <IconButton size="small">
                    <Refresh />
                  </IconButton>
                </Tooltip>
              </Box>
              
              {getTopMovers().length === 0 ? (
                <Typography variant="body2" color="textSecondary">
                  Loading market data...
                </Typography>
              ) : (
                getTopMovers().map((stock: MarketData) => (
                  <Box key={stock.symbol} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {stock.symbol}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        ${stock.price.toFixed(2)}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography
                        variant="body2"
                        sx={{ color: getPnLColor(stock.change) }}
                      >
                        {stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: getPnLColor(stock.changePercent) }}
                      >
                        {formatPercent(stock.changePercent)}
                      </Typography>
                    </Box>
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div" gutterBottom>
                Recent Orders
              </Typography>
              
              {getRecentOrders().length === 0 ? (
                <Typography variant="body2" color="textSecondary">
                  No recent orders
                </Typography>
              ) : (
                getRecentOrders().map((order) => (
                  <Box key={order.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {order.side.toUpperCase()} {order.symbol}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {order.quantity} @ ${order.price.toFixed(2)}
                      </Typography>
                    </Box>
                    <Chip
                      label={order.status.toUpperCase()}
                      color={
                        order.status === 'filled' ? 'success' :
                        order.status === 'cancelled' ? 'error' :
                        order.status === 'rejected' ? 'error' : 'warning'
                      }
                      size="small"
                    />
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
