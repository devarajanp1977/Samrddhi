import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Alert,
} from '@mui/material';
import { TrendingUp, TrendingDown, Cancel, Edit, Refresh, FilterList } from '@mui/icons-material';

interface Order {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  filled_quantity: number;
  order_type: 'market' | 'limit';
  price?: number;
  status: 'pending' | 'filled' | 'partially_filled' | 'cancelled';
  created_at: string;
  filled_at?: string;
  estimated_value: number;
}

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'filled' | 'cancelled'>('all');

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'filled':
        return 'success';
      case 'pending':
        return 'warning';
      case 'partially_filled':
        return 'info';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockOrders: Order[] = [
        {
          id: '1',
          symbol: 'AAPL',
          side: 'buy',
          quantity: 100,
          filled_quantity: 100,
          order_type: 'limit',
          price: 175.5,
          status: 'filled',
          created_at: '2025-01-15T10:30:00Z',
          filled_at: '2025-01-15T10:32:00Z',
          estimated_value: 17550,
        },
        {
          id: '2',
          symbol: 'TSLA',
          side: 'sell',
          quantity: 50,
          filled_quantity: 30,
          order_type: 'market',
          status: 'partially_filled',
          created_at: '2025-01-15T14:15:00Z',
          estimated_value: 12000,
        },
        {
          id: '3',
          symbol: 'GOOGL',
          side: 'buy',
          quantity: 25,
          filled_quantity: 0,
          order_type: 'limit',
          price: 140.0,
          status: 'pending',
          created_at: '2025-01-15T09:45:00Z',
          estimated_value: 3500,
        },
        {
          id: '4',
          symbol: 'MSFT',
          side: 'buy',
          quantity: 75,
          filled_quantity: 0,
          order_type: 'limit',
          price: 420.0,
          status: 'cancelled',
          created_at: '2025-01-14T16:20:00Z',
          estimated_value: 31500,
        },
      ];
      setOrders(mockOrders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      // Mock cancel order - replace with actual API call
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: 'cancelled' as const } : order
        )
      );
      setCancelDialogOpen(false);
      setSelectedOrderId(null);
    } catch (error) {
      console.error('Failed to cancel order:', error);
    }
  };

  const filteredOrders = orders.filter((order) => filter === 'all' || order.status === filter);

  const getOrderProgress = (order: Order) => {
    return (order.filled_quantity / order.quantity) * 100;
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Orders
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant={filter === 'all' ? 'contained' : 'outlined'}
            onClick={() => setFilter('all')}
            size="small"
          >
            All
          </Button>
          <Button
            variant={filter === 'pending' ? 'contained' : 'outlined'}
            onClick={() => setFilter('pending')}
            size="small"
            color="warning"
          >
            Pending
          </Button>
          <Button
            variant={filter === 'filled' ? 'contained' : 'outlined'}
            onClick={() => setFilter('filled')}
            size="small"
            color="success"
          >
            Filled
          </Button>
          <Button
            variant={filter === 'cancelled' ? 'contained' : 'outlined'}
            onClick={() => setFilter('cancelled')}
            size="small"
            color="error"
          >
            Cancelled
          </Button>
          <Tooltip title="Refresh Orders">
            <IconButton onClick={fetchOrders} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Card>
        <CardContent>
          <TableContainer component={Paper} sx={{ bgcolor: 'transparent' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Symbol</TableCell>
                  <TableCell>Side</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Filled</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="right">Value</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {order.symbol}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {order.side === 'buy' ? (
                          <TrendingUp fontSize="small" color="success" sx={{ mr: 1 }} />
                        ) : (
                          <TrendingDown fontSize="small" color="error" sx={{ mr: 1 }} />
                        )}
                        <Typography
                          variant="body2"
                          color={order.side === 'buy' ? 'success.main' : 'error.main'}
                          sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}
                        >
                          {order.side}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {order.order_type}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">{order.quantity.toLocaleString()}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box>
                        <Typography variant="body2">
                          {order.filled_quantity.toLocaleString()}
                        </Typography>
                        {order.status === 'partially_filled' && (
                          <Typography variant="caption" color="text.secondary">
                            ({getOrderProgress(order).toFixed(0)}%)
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {order.price ? formatCurrency(order.price) : 'Market'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {formatCurrency(order.estimated_value)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={order.status.replace('_', ' ').toUpperCase()}
                        color={getStatusColor(order.status) as any}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(order.created_at).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        {(order.status === 'pending' || order.status === 'partially_filled') && (
                          <>
                            <Tooltip title="Cancel Order">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  setSelectedOrderId(order.id);
                                  setCancelDialogOpen(true);
                                }}
                              >
                                <Cancel fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit Order">
                              <IconButton size="small">
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredOrders.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                No orders found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {filter === 'all'
                  ? "You haven't placed any orders yet"
                  : `No ${filter} orders found`}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Cancel Order Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
        <DialogTitle>Cancel Order</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to cancel this order? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => selectedOrderId && handleCancelOrder(selectedOrderId)}
            color="error"
            variant="contained"
          >
            Cancel Order
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrdersPage;
