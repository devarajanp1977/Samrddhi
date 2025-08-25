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
  Grid,
} from '@mui/material';
import { TrendingUp, TrendingDown, Refresh, Visibility } from '@mui/icons-material';
import { apiService } from '../../services/apiService';

interface Position {
  symbol: string;
  quantity: number;
  average_price: number;
  current_price: number;
  market_value: number;
  unrealized_pnl: number;
  unrealized_pnl_percent: number;
  day_pnl: number;
  day_pnl_percent: number;
  total_cost: number;
}

const PositionsPage: React.FC = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({
    totalValue: 0,
    totalCost: 0,
    totalPnL: 0,
    totalPnLPercent: 0,
    dayPnL: 0,
    dayPnLPercent: 0,
  });

  const formatCurrency = (value: number | undefined): string => {
    if (value === undefined || value === null) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number | undefined): string => {
    if (value === undefined || value === null) return '0.00%';
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getPnLColor = (value: number | undefined): 'success' | 'error' | 'default' => {
    if (value === undefined || value === null) return 'default';
    if (value > 0) return 'success';
    if (value < 0) return 'error';
    return 'default';
  };

  const fetchPositions = async () => {
    setLoading(true);
    try {
      const response = await apiService.getPositionsFromDB();
      if (response.success && response.data) {
        const positionsData = response.data.map((pos: any) => ({
          symbol: pos.symbol,
          quantity: pos.quantity,
          average_price: pos.average_price || pos.avg_price || 0,
          current_price: pos.current_price || pos.average_price || 0,
          market_value:
            pos.market_value || pos.quantity * (pos.current_price || pos.average_price || 0),
          unrealized_pnl: pos.unrealized_pnl || 0,
          unrealized_pnl_percent: pos.unrealized_pnl_percent || 0,
          day_pnl: pos.day_pnl || 0,
          day_pnl_percent: pos.day_pnl_percent || 0,
          total_cost: pos.total_cost || pos.quantity * (pos.average_price || pos.avg_price || 0),
        }));

        setPositions(positionsData);

        // Calculate summary
        const totalValue = positionsData.reduce(
          (sum: number, pos: Position) => sum + pos.market_value,
          0
        );
        const totalCost = positionsData.reduce(
          (sum: number, pos: Position) => sum + pos.total_cost,
          0
        );
        const totalPnL = positionsData.reduce(
          (sum: number, pos: Position) => sum + pos.unrealized_pnl,
          0
        );
        const dayPnL = positionsData.reduce((sum: number, pos: Position) => sum + pos.day_pnl, 0);

        setSummary({
          totalValue,
          totalCost,
          totalPnL,
          totalPnLPercent: totalCost > 0 ? (totalPnL / totalCost) * 100 : 0,
          dayPnL,
          dayPnLPercent: totalValue > 0 ? (dayPnL / (totalValue - dayPnL)) * 100 : 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch positions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Positions
        </Typography>
        <Tooltip title="Refresh Positions">
          <IconButton onClick={fetchPositions} disabled={loading}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Total Value
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {formatCurrency(summary.totalValue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Total Cost
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {formatCurrency(summary.totalCost)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Total P&L
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 'bold',
                  color: summary.totalPnL >= 0 ? 'success.main' : 'error.main',
                }}
              >
                {formatCurrency(summary.totalPnL)}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: summary.totalPnL >= 0 ? 'success.main' : 'error.main',
                }}
              >
                {formatPercent(summary.totalPnLPercent)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Day P&L
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 'bold',
                  color: summary.dayPnL >= 0 ? 'success.main' : 'error.main',
                }}
              >
                {formatCurrency(summary.dayPnL)}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: summary.dayPnL >= 0 ? 'success.main' : 'error.main',
                }}
              >
                {formatPercent(summary.dayPnLPercent)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <TableContainer component={Paper} sx={{ bgcolor: 'transparent' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Symbol</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Avg Price</TableCell>
                  <TableCell align="right">Current Price</TableCell>
                  <TableCell align="right">Market Value</TableCell>
                  <TableCell align="right">Unrealized P&L</TableCell>
                  <TableCell align="right">Day P&L</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {positions.map((position) => (
                  <TableRow key={position.symbol} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {position.symbol}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">{position.quantity.toLocaleString()}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {formatCurrency(position.average_price)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {formatCurrency(position.current_price)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {formatCurrency(position.market_value)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}
                      >
                        {position.unrealized_pnl >= 0 ? (
                          <TrendingUp fontSize="small" color="success" sx={{ mr: 0.5 }} />
                        ) : (
                          <TrendingDown fontSize="small" color="error" sx={{ mr: 0.5 }} />
                        )}
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 'bold',
                              color: position.unrealized_pnl >= 0 ? 'success.main' : 'error.main',
                            }}
                          >
                            {formatCurrency(position.unrealized_pnl)}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: position.unrealized_pnl >= 0 ? 'success.main' : 'error.main',
                            }}
                          >
                            {formatPercent(position.unrealized_pnl_percent)}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}
                      >
                        {position.day_pnl >= 0 ? (
                          <TrendingUp fontSize="small" color="success" sx={{ mr: 0.5 }} />
                        ) : (
                          <TrendingDown fontSize="small" color="error" sx={{ mr: 0.5 }} />
                        )}
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 'bold',
                              color: position.day_pnl >= 0 ? 'success.main' : 'error.main',
                            }}
                          >
                            {formatCurrency(position.day_pnl)}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: position.day_pnl >= 0 ? 'success.main' : 'error.main',
                            }}
                          >
                            {formatPercent(position.day_pnl_percent)}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Details">
                        <IconButton size="small">
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {positions.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                No positions found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your current positions will appear here once you have open positions
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default PositionsPage;
