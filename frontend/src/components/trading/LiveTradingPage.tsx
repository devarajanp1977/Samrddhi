import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
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
  side: 'buy' | 'sell';
  quantity: number;
  order_type: 'market' | 'limit';
  price?: number;
  status: 'pending' | 'filled' | 'cancelled';
  created_at: string;
  filled_at?: string;
}

const LiveTradingPage: React.FC = () => {
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

  const fetchRecentOrders = async () => {
    try {
      setRefreshing(true);
      setError(null);

      // Mock data for now - replace with actual API call
      const mockOrders: Order[] = [
        {
          id: '1',
          symbol: 'AAPL',
          side: 'buy',
          quantity: 100,
          order_type: 'limit',
          price: 175.5,
          status: 'filled',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          filled_at: new Date(Date.now() - 3500000).toISOString(),
        },
        {
          id: '2',
          symbol: 'TSLA',
          side: 'sell',
          quantity: 50,
          order_type: 'market',
          status: 'pending',
          created_at: new Date(Date.now() - 1800000).toISOString(),
        },
        {
          id: '3',
          symbol: 'GOOGL',
          side: 'buy',
          quantity: 25,
          order_type: 'limit',
          price: 140.0,
          status: 'cancelled',
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
      ];

      setRecentOrders(mockOrders);
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
      // Mock order submission - replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSuccess(
        `${orderForm.side.toUpperCase()} order for ${orderForm.quantity} ${orderForm.symbol.toUpperCase()} submitted successfully!`
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
      fetchRecentOrders();
    } catch (err: unknown) {
      setError('Failed to submit order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getEstimatedCost = (): number => {
    if (orderForm.order_type === 'limit' && orderForm.price) {
      return orderForm.quantity * orderForm.price;
    }
    // Mock market price estimate
    return orderForm.quantity * 150; // Placeholder price
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'filled':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  useEffect(() => {
    fetchRecentOrders();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Live Trading
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Real-time market execution
        </Typography>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Order Form */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Send sx={{ mr: 1 }} />
                Place Order
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Symbol"
                      value={orderForm.symbol}
                      onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
                      placeholder="AAPL, TSLA, GOOGL..."
                      disabled={loading}
                    />
                  </Grid>

                  {/* Enhanced Side Selection with Radio Buttons */}
                  <Grid item xs={12}>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium' }}>
                      Side
                    </Typography>
                    <FormControl component="fieldset" fullWidth>
                      <RadioGroup
                        row
                        value={orderForm.side}
                        onChange={(e) => handleInputChange('side', e.target.value)}
                        sx={{ gap: 2 }}
                      >
                        <FormControlLabel
                          value="buy"
                          control={<Radio sx={{ color: 'success.main' }} />}
                          label={
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                p: 1,
                                px: 2,
                                borderRadius: 1,
                                bgcolor: orderForm.side === 'buy' ? 'success.main' : 'transparent',
                                color:
                                  orderForm.side === 'buy'
                                    ? 'success.contrastText'
                                    : 'text.primary',
                                border: `1px solid`,
                                borderColor: orderForm.side === 'buy' ? 'success.main' : 'divider',
                                transition: 'all 0.2s',
                                cursor: 'pointer',
                                '&:hover': {
                                  bgcolor:
                                    orderForm.side === 'buy' ? 'success.main' : 'success.light',
                                  color:
                                    orderForm.side === 'buy'
                                      ? 'success.contrastText'
                                      : 'success.contrastText',
                                },
                              }}
                            >
                              <TrendingUp sx={{ mr: 1, fontSize: 20 }} />
                              BUY
                            </Box>
                          }
                          sx={{ m: 0 }}
                        />
                        <FormControlLabel
                          value="sell"
                          control={<Radio sx={{ color: 'error.main' }} />}
                          label={
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                p: 1,
                                px: 2,
                                borderRadius: 1,
                                bgcolor: orderForm.side === 'sell' ? 'error.main' : 'transparent',
                                color:
                                  orderForm.side === 'sell' ? 'error.contrastText' : 'text.primary',
                                border: `1px solid`,
                                borderColor: orderForm.side === 'sell' ? 'error.main' : 'divider',
                                transition: 'all 0.2s',
                                cursor: 'pointer',
                                '&:hover': {
                                  bgcolor: orderForm.side === 'sell' ? 'error.main' : 'error.light',
                                  color:
                                    orderForm.side === 'sell'
                                      ? 'error.contrastText'
                                      : 'error.contrastText',
                                },
                              }}
                            >
                              <TrendingDown sx={{ mr: 1, fontSize: 20 }} />
                              SELL
                            </Box>
                          }
                          sx={{ m: 0 }}
                        />
                      </RadioGroup>
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
                      <RadioGroup
                        value={orderForm.order_type}
                        onChange={(e) => handleInputChange('order_type', e.target.value)}
                      >
                        <FormControlLabel value="market" control={<Radio />} label="Market Order" />
                        <FormControlLabel value="limit" control={<Radio />} label="Limit Order" />
                      </RadioGroup>
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
                        icon={orderForm.side === 'buy' ? <TrendingUp /> : <TrendingDown />}
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
                      sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}
                    >
                      <Typography variant="body2">Est. Cost:</Typography>
                      <Typography variant="body2">{formatCurrency(getEstimatedCost())}</Typography>
                    </Box>
                  </Box>
                )}

                <Box sx={{ mt: 3 }}>
                  <Button
                    fullWidth
                    size="large"
                    variant="contained"
                    onClick={handleSubmitOrder}
                    disabled={loading || !orderForm.symbol || orderForm.quantity <= 0}
                    startIcon={
                      loading ? undefined : orderForm.side === 'buy' ? (
                        <TrendingUp />
                      ) : (
                        <TrendingDown />
                      )
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
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Orders */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant="h6">Recent Orders</Typography>
                <Tooltip title="Refresh Orders">
                  <IconButton size="small" onClick={fetchRecentOrders} disabled={refreshing}>
                    <Refresh fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>

              {recentOrders.length === 0 ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ textAlign: 'center', py: 4 }}
                >
                  No recent orders
                </Typography>
              ) : (
                <List dense>
                  {recentOrders.slice(0, 8).map((order) => (
                    <ListItem
                      key={order.id}
                      sx={{
                        px: 0,
                        py: 1,
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
                              color={getStatusColor(order.status) as any}
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
                              {order.quantity} @{' '}
                              {order.price ? formatCurrency(order.price) : 'Market'}
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
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LiveTradingPage;
