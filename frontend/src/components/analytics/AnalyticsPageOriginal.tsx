import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
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
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Refresh,
  Assessment,
  ShowChart,
  Speed,
  Security,
  Timeline,
  PieChart,
} from '@mui/icons-material';
import { apiService } from '../../services/apiService';

interface AnalyticsData {
  performance_metrics: {
    total_return: number;
    annualized_return: number;
    volatility: number;
    sharpe_ratio: number;
    max_drawdown: number;
    win_rate: number;
    avg_win: number;
    avg_loss: number;
    profit_factor: number;
  };
  risk_metrics: {
    beta: number;
    alpha: number;
    var_95: number;
    correlation_spy: number;
    information_ratio: number;
  };
  sector_allocation: Array<{
    sector: string;
    percentage: number;
    value: number;
  }>;
  monthly_returns: Array<{
    month: string;
    return: number;
    benchmark: number;
  }>;
  top_performers: Array<{
    symbol: string;
    return: number;
    contribution: number;
  }>;
  worst_performers: Array<{
    symbol: string;
    return: number;
    contribution: number;
  }>;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = ({ children, value, index }: TabPanelProps) => {
  return (
    <div hidden={value !== index}>{value === index && <Box sx={{ pt: 3 }}>{children}</Box>}</div>
  );
};

const AnalyticsPage: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

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

  const getPerformanceColor = (value: number): string => {
    if (value > 0) return 'success.main';
    if (value < 0) return 'error.main';
    return 'text.primary';
  };

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Since we don't have a specific analytics endpoint yet, we'll simulate data
      // In a real implementation, this would call apiService.getAnalytics()
      const mockData: AnalyticsData = {
        performance_metrics: {
          total_return: 12.5,
          annualized_return: 15.2,
          volatility: 18.5,
          sharpe_ratio: 0.82,
          max_drawdown: -8.3,
          win_rate: 65.2,
          avg_win: 3.2,
          avg_loss: -2.1,
          profit_factor: 1.45,
        },
        risk_metrics: {
          beta: 1.15,
          alpha: 0.05,
          var_95: -2.3,
          correlation_spy: 0.78,
          information_ratio: 0.35,
        },
        sector_allocation: [
          { sector: 'Technology', percentage: 35.2, value: 29480 },
          { sector: 'Finance', percentage: 22.1, value: 18520 },
          { sector: 'Healthcare', percentage: 15.3, value: 12830 },
          { sector: 'Consumer', percentage: 12.8, value: 10730 },
          { sector: 'Energy', percentage: 8.4, value: 7040 },
          { sector: 'Utilities', percentage: 6.2, value: 5200 },
        ],
        monthly_returns: [
          { month: 'Jan', return: 2.1, benchmark: 1.8 },
          { month: 'Feb', return: -1.2, benchmark: -0.8 },
          { month: 'Mar', return: 3.5, benchmark: 2.9 },
          { month: 'Apr', return: 1.8, benchmark: 2.2 },
          { month: 'May', return: -0.5, benchmark: 0.3 },
          { month: 'Jun', return: 2.8, benchmark: 1.9 },
        ],
        top_performers: [
          { symbol: 'AAPL', return: 25.3, contribution: 3.2 },
          { symbol: 'MSFT', return: 18.7, contribution: 2.8 },
          { symbol: 'GOOGL', return: 15.2, contribution: 2.1 },
        ],
        worst_performers: [
          { symbol: 'XYZ', return: -12.5, contribution: -1.8 },
          { symbol: 'ABC', return: -8.3, contribution: -1.2 },
          { symbol: 'DEF', return: -6.7, contribution: -0.9 },
        ],
      };

      setAnalyticsData(mockData);
    } catch (err) {
      setError('Failed to fetch analytics data');
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress sx={{ mb: 2 }} />
        <Typography>Loading analytics data...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={fetchAnalyticsData} variant="contained">
          Retry
        </Button>
      </Box>
    );
  }

  if (!analyticsData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">No analytics data available</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Portfolio Analytics
        </Typography>
        <Tooltip title="Refresh Data">
          <IconButton onClick={fetchAnalyticsData} disabled={loading}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab icon={<Assessment />} label="Performance" />
          <Tab icon={<Security />} label="Risk Analysis" />
          <Tab icon={<PieChart />} label="Allocation" />
          <Tab icon={<Timeline />} label="Returns History" />
        </Tabs>
      </Box>

      {/* Performance Tab */}
      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={3}>
          {/* Performance Metrics */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ display: 'flex', alignItems: 'center' }}
                >
                  <TrendingUp sx={{ mr: 1 }} />
                  Performance Metrics
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Total Return
                      </Typography>
                      <Typography
                        variant="h5"
                        sx={{
                          color: getPerformanceColor(
                            analyticsData.performance_metrics.total_return
                          ),
                        }}
                      >
                        {formatPercent(analyticsData.performance_metrics.total_return)}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Volatility
                      </Typography>
                      <Typography variant="h5">
                        {formatPercent(analyticsData.performance_metrics.volatility)}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Max Drawdown
                      </Typography>
                      <Typography variant="h5" sx={{ color: 'error.main' }}>
                        {formatPercent(analyticsData.performance_metrics.max_drawdown)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Annualized Return
                      </Typography>
                      <Typography
                        variant="h5"
                        sx={{
                          color: getPerformanceColor(
                            analyticsData.performance_metrics.annualized_return
                          ),
                        }}
                      >
                        {formatPercent(analyticsData.performance_metrics.annualized_return)}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Sharpe Ratio
                      </Typography>
                      <Typography variant="h5">
                        {analyticsData.performance_metrics.sharpe_ratio.toFixed(2)}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Win Rate
                      </Typography>
                      <Typography variant="h5" sx={{ color: 'success.main' }}>
                        {formatPercent(analyticsData.performance_metrics.win_rate)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Top/Worst Performers */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ display: 'flex', alignItems: 'center' }}
                >
                  <ShowChart sx={{ mr: 1 }} />
                  Top & Worst Performers
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="success.main" gutterBottom>
                    Top Performers
                  </Typography>
                  <List dense>
                    {analyticsData.top_performers.map((performer, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemText
                          primary={performer.symbol}
                          secondary={`Contribution: ${formatPercent(performer.contribution)}`}
                        />
                        <Typography
                          variant="body2"
                          sx={{ color: 'success.main', fontWeight: 'bold' }}
                        >
                          {formatPercent(performer.return)}
                        </Typography>
                      </ListItem>
                    ))}
                  </List>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="error.main" gutterBottom>
                    Worst Performers
                  </Typography>
                  <List dense>
                    {analyticsData.worst_performers.map((performer, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemText
                          primary={performer.symbol}
                          secondary={`Contribution: ${formatPercent(performer.contribution)}`}
                        />
                        <Typography
                          variant="body2"
                          sx={{ color: 'error.main', fontWeight: 'bold' }}
                        >
                          {formatPercent(performer.return)}
                        </Typography>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Risk Analysis Tab */}
      <TabPanel value={activeTab} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ display: 'flex', alignItems: 'center' }}
                >
                  <Security sx={{ mr: 1 }} />
                  Risk Metrics
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={6} md={4}>
                    <Box
                      sx={{ textAlign: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 1 }}
                    >
                      <Typography variant="h4" sx={{ mb: 1 }}>
                        {analyticsData.risk_metrics.beta.toFixed(2)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Beta
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={4}>
                    <Box
                      sx={{ textAlign: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 1 }}
                    >
                      <Typography variant="h4" sx={{ mb: 1 }}>
                        {analyticsData.risk_metrics.alpha.toFixed(3)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Alpha
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={4}>
                    <Box
                      sx={{ textAlign: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 1 }}
                    >
                      <Typography variant="h4" sx={{ mb: 1, color: 'error.main' }}>
                        {formatPercent(analyticsData.risk_metrics.var_95)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        VaR (95%)
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={4}>
                    <Box
                      sx={{ textAlign: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 1 }}
                    >
                      <Typography variant="h4" sx={{ mb: 1 }}>
                        {analyticsData.risk_metrics.correlation_spy.toFixed(2)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Correlation (SPY)
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={4}>
                    <Box
                      sx={{ textAlign: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 1 }}
                    >
                      <Typography variant="h4" sx={{ mb: 1 }}>
                        {analyticsData.risk_metrics.information_ratio.toFixed(2)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Information Ratio
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={4}>
                    <Box
                      sx={{ textAlign: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 1 }}
                    >
                      <Typography variant="h4" sx={{ mb: 1 }}>
                        {analyticsData.performance_metrics.profit_factor.toFixed(2)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Profit Factor
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Risk Assessment
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Risk Level
                  </Typography>
                  <Chip label="Moderate" color="warning" sx={{ mb: 2 }} />
                  <Typography variant="body2" gutterBottom>
                    Your portfolio shows moderate risk with a beta of{' '}
                    {analyticsData.risk_metrics.beta.toFixed(2)}, indicating higher volatility than
                    the market.
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Recommendations
                  </Typography>
                  <List dense>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="Consider diversification"
                        secondary="Add defensive stocks to reduce volatility"
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="Monitor correlation"
                        secondary="High correlation with SPY increases systemic risk"
                      />
                    </ListItem>
                  </List>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Allocation Tab */}
      <TabPanel value={activeTab} index={2}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <PieChart sx={{ mr: 1 }} />
              Sector Allocation
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Sector</TableCell>
                    <TableCell align="right">Allocation %</TableCell>
                    <TableCell align="right">Value</TableCell>
                    <TableCell align="right">Allocation Bar</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analyticsData.sector_allocation.map((sector) => (
                    <TableRow key={sector.sector}>
                      <TableCell>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                          {sector.sector}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{formatPercent(sector.percentage)}</TableCell>
                      <TableCell align="right">{formatCurrency(sector.value)}</TableCell>
                      <TableCell align="right" sx={{ width: '200px' }}>
                        <LinearProgress
                          variant="determinate"
                          value={sector.percentage}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Returns History Tab */}
      <TabPanel value={activeTab} index={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Timeline sx={{ mr: 1 }} />
              Monthly Returns vs Benchmark
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Month</TableCell>
                    <TableCell align="right">Portfolio Return</TableCell>
                    <TableCell align="right">Benchmark Return</TableCell>
                    <TableCell align="right">Outperformance</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analyticsData.monthly_returns.map((month) => (
                    <TableRow key={month.month}>
                      <TableCell>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                          {month.month}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          sx={{
                            color: getPerformanceColor(month.return),
                            fontWeight: 'bold',
                          }}
                        >
                          {formatPercent(month.return)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          sx={{
                            color: getPerformanceColor(month.benchmark),
                          }}
                        >
                          {formatPercent(month.benchmark)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          sx={{
                            color: getPerformanceColor(month.return - month.benchmark),
                            fontWeight: 'bold',
                          }}
                        >
                          {formatPercent(month.return - month.benchmark)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>
    </Box>
  );
};

export default AnalyticsPage;
