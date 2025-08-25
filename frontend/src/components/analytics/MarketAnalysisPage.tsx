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
  List,
  ListItem,
  ListItemText,
  Avatar,
} from '@mui/material';
import {
  ShowChart,
  TrendingUp,
  TrendingDown,
  Timeline,
  Assessment,
  Refresh,
  Business,
  AttachMoney,
} from '@mui/icons-material';

interface SectorAllocation {
  sector: string;
  percentage: number;
  value: number;
  change_24h: number;
}

interface MarketIndicator {
  name: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
}

interface MarketAnalysisData {
  sector_allocation: SectorAllocation[];
  market_indicators: MarketIndicator[];
  market_sentiment: {
    bullish: number;
    bearish: number;
    neutral: number;
  };
}

const MarketAnalysisPage: React.FC = () => {
  const [marketData, setMarketData] = useState<MarketAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getChangeColor = (value: number): string => {
    if (value > 0) return 'success.main';
    if (value < 0) return 'error.main';
    return 'text.primary';
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <TrendingUp sx={{ color: 'success.main' }} />;
      case 'down':
        return <TrendingDown sx={{ color: 'error.main' }} />;
      default:
        return <Timeline sx={{ color: 'warning.main' }} />;
    }
  };

  const fetchMarketData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data for now - replace with actual API call
      const mockData: MarketAnalysisData = {
        sector_allocation: [
          { sector: 'Technology', percentage: 35.2, value: 29480, change_24h: 2.1 },
          { sector: 'Finance', percentage: 22.1, value: 18520, change_24h: -0.8 },
          { sector: 'Healthcare', percentage: 15.3, value: 12830, change_24h: 1.5 },
          { sector: 'Consumer Discretionary', percentage: 12.8, value: 10730, change_24h: 0.3 },
          { sector: 'Energy', percentage: 8.4, value: 7040, change_24h: -1.2 },
          { sector: 'Industrials', percentage: 6.2, value: 5200, change_24h: 0.9 },
        ],
        market_indicators: [
          { name: 'S&P 500', value: 4150.2, change: 1.2, trend: 'up' },
          { name: 'NASDAQ', value: 12850.75, change: -0.5, trend: 'down' },
          { name: 'DOW', value: 33240.5, change: 0.8, trend: 'up' },
          { name: 'VIX', value: 18.45, change: -2.1, trend: 'down' },
          { name: 'USD Index', value: 103.25, change: 0.3, trend: 'up' },
          { name: '10Y Treasury', value: 4.25, change: 0.05, trend: 'up' },
        ],
        market_sentiment: {
          bullish: 62,
          bearish: 23,
          neutral: 15,
        },
      };

      // Simulate API delay
      setTimeout(() => {
        setMarketData(mockData);
        setLoading(false);
      }, 1000);
    } catch (err) {
      console.error('Error fetching market data:', err);
      setError('Failed to load market analysis data. Please try again.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
  }, []);

  const handleRefresh = () => {
    fetchMarketData();
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <ShowChart />
          Market Analysis
        </Typography>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading market analysis data...</Typography>
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
          <ShowChart />
          Market Analysis
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
          <ShowChart />
          Market Analysis
        </Typography>
        <Tooltip title="Refresh Data">
          <IconButton onClick={handleRefresh}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Market Indicators */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {marketData?.market_indicators.map((indicator, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 1,
                  }}
                >
                  <Typography variant="subtitle2" color="text.secondary">
                    {indicator.name}
                  </Typography>
                  {getTrendIcon(indicator.trend)}
                </Box>
                <Typography variant="h5" sx={{ mb: 1 }}>
                  {indicator.name === 'VIX' || indicator.name.includes('Treasury')
                    ? indicator.value.toFixed(2)
                    : indicator.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Typography>
                <Typography variant="body2" sx={{ color: getChangeColor(indicator.change) }}>
                  {formatPercent(indicator.change)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Sector Allocation */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <Business />
                Sector Allocation
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <strong>Sector</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Allocation</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Value</strong>
                      </TableCell>
                      <TableCell>
                        <strong>24h Change</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Status</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {marketData?.sector_allocation.map((sector, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar
                              sx={{
                                width: 24,
                                height: 24,
                                bgcolor: `hsl(${index * 60}, 70%, 50%)`,
                                fontSize: '0.75rem',
                              }}
                            >
                              {sector.sector.charAt(0)}
                            </Avatar>
                            {sector.sector}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {sector.percentage.toFixed(1)}%
                            <Box
                              sx={{
                                width: 50,
                                height: 4,
                                bgcolor: 'grey.300',
                                borderRadius: 2,
                                overflow: 'hidden',
                              }}
                            >
                              <Box
                                sx={{
                                  width: `${(sector.percentage / 40) * 100}%`,
                                  height: '100%',
                                  bgcolor: `hsl(${index * 60}, 70%, 50%)`,
                                }}
                              />
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>{formatCurrency(sector.value)}</TableCell>
                        <TableCell sx={{ color: getChangeColor(sector.change_24h) }}>
                          {formatPercent(sector.change_24h)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={sector.change_24h >= 0 ? 'Gaining' : 'Declining'}
                            color={sector.change_24h >= 0 ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Market Sentiment */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <Assessment />
                Market Sentiment
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="success.main">
                    Bullish
                  </Typography>
                  <Typography variant="body2">{marketData?.market_sentiment.bullish}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={marketData?.market_sentiment.bullish}
                  sx={{ height: 8, borderRadius: 4, bgcolor: 'grey.200' }}
                  color="success"
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="error.main">
                    Bearish
                  </Typography>
                  <Typography variant="body2">{marketData?.market_sentiment.bearish}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={marketData?.market_sentiment.bearish}
                  sx={{ height: 8, borderRadius: 4, bgcolor: 'grey.200' }}
                  color="error"
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="warning.main">
                    Neutral
                  </Typography>
                  <Typography variant="body2">{marketData?.market_sentiment.neutral}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={marketData?.market_sentiment.neutral}
                  sx={{ height: 8, borderRadius: 4, bgcolor: 'grey.200' }}
                  color="warning"
                />
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Market Insights
              </Typography>
              <List dense>
                <ListItem>
                  <TrendingUp sx={{ color: 'success.main', mr: 1 }} />
                  <ListItemText
                    primary="Technology Leading"
                    secondary="Tech sector shows strong momentum"
                  />
                </ListItem>
                <ListItem>
                  <Timeline sx={{ color: 'warning.main', mr: 1 }} />
                  <ListItemText
                    primary="Mixed Financial Performance"
                    secondary="Banking sector under pressure"
                  />
                </ListItem>
                <ListItem>
                  <TrendingDown sx={{ color: 'error.main', mr: 1 }} />
                  <ListItemText primary="Energy Weakness" secondary="Oil prices affecting sector" />
                </ListItem>
                <ListItem>
                  <AttachMoney sx={{ color: 'info.main', mr: 1 }} />
                  <ListItemText primary="Dollar Strength" secondary="USD index near highs" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MarketAnalysisPage;
