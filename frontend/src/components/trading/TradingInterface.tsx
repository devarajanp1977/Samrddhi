import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import { TrendingUp, TrendingDown, Refresh, Send } from '@mui/icons-material';
import { apiService } from '../../services/apiService';

interface OrderFormData {
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  order_type: 'market' | 'limit';
  price?: number;
}

interface Order {
  id: string;
  symbol: string;
  side: string;
  quantity: number;
  price: number;
  status: string;
  created_at: string;
}

const TradingInterface: React.FC = () => {
  const [orderForm, setOrderForm] = useState<OrderFormData>({
    symbol: '',
    side: 'buy',
    quantity: 0,
    order_type: 'market',
    price: undefined,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const getStatusColor = (status: string): 'success' | 'error' | 'warning' | 'default' => {
    switch (status.toLowerCase()) {
      case 'filled':
        return 'success';
      case 'cancelled':
      case 'rejected':
        return 'error';
      case 'pending':
      case 'partial':
        return 'warning';
      default:
        return 'default';
    }
  };

  const fetchRecentOrders = async () => {
    try {
      setRefreshing(true);
      const response = await apiService.getComprehensiveDashboard();
      if (response.success) {
        setRecentOrders(response.data.recent_orders || []);
      }
    } catch (err: unknown) {
      console.error('Failed to fetch recent orders:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleInputChange = (field: keyof OrderFormData, value: any) => {
    setOrderForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
    setSuccess(null);
  };

  const validateOrder = (): string | null => {
    if (!orderForm.symbol.trim()) {
      return 'Symbol is required';
    }
    if (orderForm.quantity <= 0) {
      return 'Quantity must be greater than 0';
    }
    if (orderForm.order_type === 'limit' && (!orderForm.price || orderForm.price <= 0)) {
      return 'Price is required for limit orders';
    }
    return null;
  };

  const handleSubmitOrder = async () => {
    const validationError = validateOrder();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // For demo purposes, we'll simulate the order submission
      // In a real implementation, this would call apiService.submitOrder()
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate API call

      setSuccess(
        `${orderForm.side.toUpperCase()} order for ${orderForm.quantity} shares of ${orderForm.symbol.toUpperCase()} submitted successfully!`
      );

      // Reset form
      setOrderForm({
        symbol: '',
        side: 'buy',
        quantity: 0,
        order_type: 'market',
        price: undefined,
      });

      // Refresh orders
      await fetchRecentOrders();
    } catch (err: unknown) {
      setError('Failed to submit order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const estimatedTotal = () => {
    if (orderForm.order_type === 'limit' && orderForm.price) {
      return orderForm.quantity * orderForm.price;
    }
    // For market orders, we'd typically get current market price
    // For demo, using a placeholder calculation
    return orderForm.quantity * 150; // Placeholder price
  };

  useEffect(() => {
    fetchRecentOrders();
  }, []);

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <Send sx={{ mr: 1 }} />
          Quick Trade
        </Typography>

        {/* Order Form */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Symbol"
                value={orderForm.symbol}
                onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
                placeholder="AAPL, TSLA, GOOGL..."
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Side</InputLabel>
                <Select
                  value={orderForm.side}
                  onChange={(e) => handleInputChange('side', e.target.value)}
                  disabled={loading}
                >
                  <MenuItem value="buy">Buy</MenuItem>
                  <MenuItem value="sell">Sell</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Quantity"
                value={orderForm.quantity || ''}
                onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Order Type</InputLabel>
                <Select
                  value={orderForm.order_type}
                  onChange={(e) => handleInputChange('order_type', e.target.value)}
                  disabled={loading}
                >
                  <MenuItem value="market">Market</MenuItem>
                  <MenuItem value="limit">Limit</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {orderForm.order_type === 'limit' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Limit Price"
                  value={orderForm.price || ''}
                  onChange={(e) =>
                    handleInputChange('price', parseFloat(e.target.value) || undefined)
                  }
                  disabled={loading}
                  inputProps={{ step: '0.01' }}
                />
              </Grid>
            )}
          </Grid>

          {/* Order Summary */}
          {orderForm.symbol && orderForm.quantity > 0 && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Order Summary
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Action:</Typography>
                <Chip
                  size="small"
                  label={orderForm.side.toUpperCase()}
                  color={orderForm.side === 'buy' ? 'success' : 'error'}
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Symbol:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {orderForm.symbol.toUpperCase()}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Quantity:</Typography>
                <Typography variant="body2">{orderForm.quantity} shares</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Type:</Typography>
                <Typography variant="body2">{orderForm.order_type.toUpperCase()}</Typography>
              </Box>
              {orderForm.order_type === 'limit' && orderForm.price && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Price:</Typography>
                  <Typography variant="body2">{formatCurrency(orderForm.price)}</Typography>
                </Box>
              )}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mt: 2,
                  pt: 1,
                  borderTop: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  Estimated Total:
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {formatCurrency(estimatedTotal())}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Messages */}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {success}
            </Alert>
          )}

          {/* Submit Button */}
          <Box sx={{ mt: 2 }}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleSubmitOrder}
              disabled={loading || !orderForm.symbol || orderForm.quantity <= 0}
              startIcon={
                loading ? undefined : orderForm.side === 'buy' ? <TrendingUp /> : <TrendingDown />
              }
              color={orderForm.side === 'buy' ? 'success' : 'error'}
            >
              {loading
                ? 'Submitting Order...'
                : `${orderForm.side.toUpperCase()} ${orderForm.symbol.toUpperCase() || 'Stock'}`}
            </Button>
            {loading && <LinearProgress sx={{ mt: 1, height: 2 }} />}
          </Box>
        </Box>

        {/* Recent Orders */}
        <Box>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}
          >
            <Typography variant="subtitle2">Recent Orders</Typography>
            <Tooltip title="Refresh Orders">
              <IconButton size="small" onClick={fetchRecentOrders} disabled={refreshing}>
                <Refresh fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {recentOrders.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              No recent orders
            </Typography>
          ) : (
            <List dense>
              {recentOrders.slice(0, 5).map((order) => (
                <ListItem
                  key={order.id}
                  sx={{
                    px: 0,
                    py: 0.5,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:last-child': { borderBottom: 'none' },
                  }}
                >
                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {order.side === 'buy' ? (
                            <TrendingUp fontSize="small" color="success" />
                          ) : (
                            <TrendingDown fontSize="small" color="error" />
                          )}
                          <Typography variant="body2" sx={{ fontWeight: 'bold', ml: 1 }}>
                            {order.symbol}
                          </Typography>
                        </Box>
                        <Chip
                          size="small"
                          label={order.status.toUpperCase()}
                          color={getStatusColor(order.status)}
                        />
                      </Box>
                    }
                    secondary={
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mt: 0.5,
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          {order.quantity} @ {formatCurrency(order.price)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(order.created_at).toLocaleTimeString()}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default TradingInterface;
