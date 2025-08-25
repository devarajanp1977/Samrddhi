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
  Chip,
  IconButton,
  Tooltip,
  Alert,
  LinearProgress,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Refresh,
  Download,
  FilterList,
  TrendingUp,
  TrendingDown,
  Receipt,
  AccountBalance,
  Assessment,
} from '@mui/icons-material';
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface Transaction {
  id: string;
  date: string;
  type: 'buy' | 'sell' | 'dividend' | 'deposit' | 'withdrawal';
  symbol?: string;
  quantity?: number;
  price?: number;
  amount: number;
  fees: number;
  description: string;
}

interface PerformanceRecord {
  date: string;
  portfolio_value: number;
  daily_pnl: number;
  daily_return: number;
  cumulative_return: number;
  benchmark_return: number;
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

const HistoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSymbol, setFilterSymbol] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | null>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  );
  const [endDate, setEndDate] = useState<Date | null>(new Date());

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

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'buy':
        return <TrendingUp color="success" />;
      case 'sell':
        return <TrendingDown color="error" />;
      case 'dividend':
        return <Assessment color="info" />;
      case 'deposit':
        return <AccountBalance color="primary" />;
      case 'withdrawal':
        return <AccountBalance color="secondary" />;
      default:
        return <Receipt />;
    }
  };

  const getTransactionColor = (
    type: Transaction['type']
  ): 'success' | 'error' | 'info' | 'default' => {
    switch (type) {
      case 'buy':
        return 'success';
      case 'sell':
        return 'error';
      case 'dividend':
        return 'info';
      default:
        return 'default';
    }
  };

  const fetchHistoryData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock transaction data
      const mockTransactions: Transaction[] = [
        {
          id: '1',
          date: '2024-01-20T10:30:00Z',
          type: 'buy',
          symbol: 'AAPL',
          quantity: 100,
          price: 175.5,
          amount: -17550.0,
          fees: 1.0,
          description: 'Bought 100 shares of AAPL at $175.50',
        },
        {
          id: '2',
          date: '2024-01-19T14:45:00Z',
          type: 'sell',
          symbol: 'TSLA',
          quantity: 50,
          price: 210.25,
          amount: 10512.5,
          fees: 1.0,
          description: 'Sold 50 shares of TSLA at $210.25',
        },
        {
          id: '3',
          date: '2024-01-18T09:00:00Z',
          type: 'dividend',
          symbol: 'MSFT',
          amount: 68.4,
          fees: 0,
          description: 'Quarterly dividend from MSFT (120 shares @ $0.57)',
        },
        {
          id: '4',
          date: '2024-01-15T11:20:00Z',
          type: 'deposit',
          amount: 10000.0,
          fees: 0,
          description: 'Cash deposit',
        },
        {
          id: '5',
          date: '2024-01-12T13:15:00Z',
          type: 'buy',
          symbol: 'GOOGL',
          quantity: 25,
          price: 138.75,
          amount: -3468.75,
          fees: 1.0,
          description: 'Bought 25 shares of GOOGL at $138.75',
        },
        {
          id: '6',
          date: '2024-01-10T16:30:00Z',
          type: 'sell',
          symbol: 'NVDA',
          quantity: 15,
          price: 590.8,
          amount: 8862.0,
          fees: 1.0,
          description: 'Sold 15 shares of NVDA at $590.80',
        },
      ];

      // Mock performance data
      const mockPerformance: PerformanceRecord[] = [];
      let baseValue = 80000;
      const today = new Date();

      for (let i = 29; i >= 0; i--) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        const dailyReturn = (Math.random() - 0.5) * 4; // Random daily return between -2% and 2%
        const benchmarkReturn = (Math.random() - 0.48) * 3; // Slightly positive bias for benchmark

        baseValue *= 1 + dailyReturn / 100;

        mockPerformance.push({
          date: date.toISOString().split('T')[0],
          portfolio_value: baseValue,
          daily_pnl: (baseValue * dailyReturn) / 100,
          daily_return: dailyReturn,
          cumulative_return: ((baseValue - 80000) / 80000) * 100,
          benchmark_return: benchmarkReturn,
        });
      }

      setTransactions(mockTransactions);
      setPerformanceHistory(mockPerformance);
    } catch (err) {
      setError('Failed to fetch history data');
      console.error('History fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.date);
    const matchesType = filterType === 'all' || transaction.type === filterType;
    const matchesSymbol =
      !filterSymbol ||
      (transaction.symbol && transaction.symbol.toLowerCase().includes(filterSymbol.toLowerCase()));
    const matchesDateRange =
      (!startDate || transactionDate >= startDate) && (!endDate || transactionDate <= endDate);

    return matchesType && matchesSymbol && matchesDateRange;
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleExportData = () => {
    // In a real implementation, this would generate and download a CSV/Excel file
    alert('Export functionality would be implemented here');
  };

  const clearFilters = () => {
    setFilterType('all');
    setFilterSymbol('');
    setStartDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    setEndDate(new Date());
  };

  useEffect(() => {
    fetchHistoryData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress sx={{ mb: 2 }} />
        <Typography>Loading history data...</Typography>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ flexGrow: 1, p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Trading History
          </Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={handleExportData}
              sx={{ mr: 1 }}
            >
              Export
            </Button>
            <Tooltip title="Refresh Data">
              <IconButton onClick={fetchHistoryData} disabled={loading}>
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Total Transactions
                </Typography>
                <Typography variant="h4">{transactions.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Total Volume
                </Typography>
                <Typography variant="h4">
                  {formatCurrency(
                    Math.abs(transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0))
                  )}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Total Fees
                </Typography>
                <Typography variant="h4">
                  {formatCurrency(transactions.reduce((sum, t) => sum + t.fees, 0))}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Net Flow
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    color:
                      transactions.reduce((sum, t) => sum + t.amount, 0) >= 0
                        ? 'success.main'
                        : 'error.main',
                  }}
                >
                  {formatCurrency(transactions.reduce((sum, t) => sum + t.amount, 0))}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab icon={<Receipt />} label="Transactions" />
            <Tab icon={<Assessment />} label="Performance" />
          </Tabs>
        </Box>

        {/* Transactions Tab */}
        <TabPanel value={activeTab} index={0}>
          {/* Filters */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <FilterList sx={{ mr: 1 }} />
                <Typography variant="h6">Filters</Typography>
              </Box>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Type</InputLabel>
                    <Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                      <MenuItem value="all">All Types</MenuItem>
                      <MenuItem value="buy">Buy</MenuItem>
                      <MenuItem value="sell">Sell</MenuItem>
                      <MenuItem value="dividend">Dividend</MenuItem>
                      <MenuItem value="deposit">Deposit</MenuItem>
                      <MenuItem value="withdrawal">Withdrawal</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Symbol"
                    value={filterSymbol}
                    onChange={(e) => setFilterSymbol(e.target.value)}
                    placeholder="AAPL, TSLA..."
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <MuiDatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={(date) => setStartDate(date)}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <MuiDatePicker
                    label="End Date"
                    value={endDate}
                    onChange={(date) => setEndDate(date)}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button variant="outlined" onClick={clearFilters} fullWidth>
                    Clear Filters
                  </Button>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Typography variant="body2" color="text.secondary">
                    {filteredTransactions.length} of {transactions.length} transactions
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Transactions Table */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Transaction History
              </Typography>
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Symbol</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="right">Fees</TableCell>
                      <TableCell>Description</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id} hover>
                        <TableCell>{new Date(transaction.date).toLocaleString()}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {getTransactionIcon(transaction.type)}
                            <Chip
                              label={transaction.type.toUpperCase()}
                              color={getTransactionColor(transaction.type)}
                              size="small"
                              sx={{ ml: 1, textTransform: 'capitalize' }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body1"
                            sx={{ fontWeight: transaction.symbol ? 'bold' : 'normal' }}
                          >
                            {transaction.symbol || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {transaction.quantity ? transaction.quantity.toLocaleString() : '-'}
                        </TableCell>
                        <TableCell align="right">
                          {transaction.price ? formatCurrency(transaction.price) : '-'}
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            sx={{
                              color: transaction.amount >= 0 ? 'success.main' : 'error.main',
                              fontWeight: 'bold',
                            }}
                          >
                            {formatCurrency(transaction.amount)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{formatCurrency(transaction.fees)}</TableCell>
                        <TableCell>
                          <Typography variant="body2">{transaction.description}</Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Performance Tab */}
        <TabPanel value={activeTab} index={1}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Daily Performance History
              </Typography>
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Portfolio Value</TableCell>
                      <TableCell align="right">Daily P&L</TableCell>
                      <TableCell align="right">Daily Return</TableCell>
                      <TableCell align="right">Cumulative Return</TableCell>
                      <TableCell align="right">Benchmark Return</TableCell>
                      <TableCell align="right">Outperformance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {performanceHistory.map((record) => (
                      <TableRow key={record.date} hover>
                        <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                        <TableCell align="right">
                          <Typography sx={{ fontWeight: 'bold' }}>
                            {formatCurrency(record.portfolio_value)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            sx={{
                              color: record.daily_pnl >= 0 ? 'success.main' : 'error.main',
                              fontWeight: 'bold',
                            }}
                          >
                            {formatCurrency(record.daily_pnl)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            sx={{
                              color: record.daily_return >= 0 ? 'success.main' : 'error.main',
                              fontWeight: 'bold',
                            }}
                          >
                            {formatPercent(record.daily_return)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            sx={{
                              color: record.cumulative_return >= 0 ? 'success.main' : 'error.main',
                              fontWeight: 'bold',
                            }}
                          >
                            {formatPercent(record.cumulative_return)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            sx={{
                              color: record.benchmark_return >= 0 ? 'success.main' : 'error.main',
                            }}
                          >
                            {formatPercent(record.benchmark_return)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            sx={{
                              color:
                                record.daily_return - record.benchmark_return >= 0
                                  ? 'success.main'
                                  : 'error.main',
                              fontWeight: 'bold',
                            }}
                          >
                            {formatPercent(record.daily_return - record.benchmark_return)}
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
    </LocalizationProvider>
  );
};

export default HistoryPage;
