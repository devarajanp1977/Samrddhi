import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
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
  LinearProgress,
  Alert,
  Button,
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material';
import { TrendingUp, Refresh, Assessment, ShowChart, Speed } from '@mui/icons-material';

interface PerformanceMetrics {
  total_return: number;
  annualized_return: number;
  volatility: number;
  sharpe_ratio: number;
  max_drawdown: number;
  win_rate: number;
  avg_win: number;
  avg_loss: number;
  profit_factor: number;
}

const PerformancePage: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatPercent = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getPerformanceColor = (value: number): string => {
    if (value > 0) return 'success.main';
    if (value < 0) return 'error.main';
    return 'text.primary';
  };

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data for now - replace with actual API call
      const mockData: PerformanceMetrics = {
        total_return: 12.5,
        annualized_return: 15.2,
        volatility: 18.5,
        sharpe_ratio: 0.82,
        max_drawdown: -8.3,
        win_rate: 65.2,
        avg_win: 3.2,
        avg_loss: -2.1,
        profit_factor: 1.45,
      };

      // Simulate API delay
      setTimeout(() => {
        setPerformanceData(mockData);
        setLoading(false);
      }, 1000);
    } catch (err) {
      console.error('Error fetching performance data:', err);
      setError('Failed to load performance data. Please try again.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const handleRefresh = () => {
    fetchPerformanceData();
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <Assessment />
          Performance Analytics
        </Typography>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading performance data...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <Assessment />
          Performance Analytics
        </Typography>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={handleRefresh} startIcon={<Refresh />}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Assessment />
          Performance Analytics
        </Typography>
        <Tooltip title="Refresh Data">
          <IconButton onClick={handleRefresh}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Performance Metrics Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUp sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Total Return
                </Typography>
              </Box>
              <Typography
                variant="h4"
                sx={{ color: getPerformanceColor(performanceData?.total_return || 0) }}
              >
                {formatPercent(performanceData?.total_return || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ShowChart sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Annualized Return
                </Typography>
              </Box>
              <Typography
                variant="h4"
                sx={{ color: getPerformanceColor(performanceData?.annualized_return || 0) }}
              >
                {formatPercent(performanceData?.annualized_return || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Speed sx={{ color: 'warning.main', mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Volatility
                </Typography>
              </Box>
              <Typography variant="h4" color="warning.main">
                {formatPercent(performanceData?.volatility || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Assessment sx={{ color: 'info.main', mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Sharpe Ratio
                </Typography>
              </Box>
              <Typography variant="h4" color="info.main">
                {(performanceData?.sharpe_ratio || 0).toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detailed Performance Metrics */}
      <Card>
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <Assessment />
            Detailed Performance Metrics
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Metric</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Value</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Status</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Maximum Drawdown</TableCell>
                  <TableCell sx={{ color: 'error.main' }}>
                    {formatPercent(performanceData?.max_drawdown || 0)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={
                        Math.abs(performanceData?.max_drawdown || 0) < 10 ? 'Good' : 'High Risk'
                      }
                      color={
                        Math.abs(performanceData?.max_drawdown || 0) < 10 ? 'success' : 'error'
                      }
                      size="small"
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Win Rate</TableCell>
                  <TableCell sx={{ color: 'success.main' }}>
                    {formatPercent(performanceData?.win_rate || 0)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={(performanceData?.win_rate || 0) > 60 ? 'Excellent' : 'Average'}
                      color={(performanceData?.win_rate || 0) > 60 ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Average Win</TableCell>
                  <TableCell sx={{ color: 'success.main' }}>
                    {formatPercent(performanceData?.avg_win || 0)}
                  </TableCell>
                  <TableCell>
                    <Chip label="Active" color="success" size="small" />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Average Loss</TableCell>
                  <TableCell sx={{ color: 'error.main' }}>
                    {formatPercent(performanceData?.avg_loss || 0)}
                  </TableCell>
                  <TableCell>
                    <Chip label="Controlled" color="info" size="small" />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Profit Factor</TableCell>
                  <TableCell
                    sx={{ color: getPerformanceColor(performanceData?.profit_factor || 0 - 1) }}
                  >
                    {(performanceData?.profit_factor || 0).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={(performanceData?.profit_factor || 0) > 1.2 ? 'Strong' : 'Weak'}
                      color={(performanceData?.profit_factor || 0) > 1.2 ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PerformancePage;
