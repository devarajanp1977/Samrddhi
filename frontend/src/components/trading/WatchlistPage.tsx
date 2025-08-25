import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Grid,
  Paper,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Star,
  StarBorder,
  Add,
  Delete,
  Refresh,
  ShowChart,
} from '@mui/icons-material';

interface WatchlistItem {
  symbol: string;
  company_name: string;
  current_price: number;
  change: number;
  change_percent: number;
  volume: number;
  high_price: number;
  low_price: number;
  is_favorite: boolean;
  market_cap?: number;
  pe_ratio?: number;
}

const WatchlistPage: React.FC = () => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newSymbol, setNewSymbol] = useState('');

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

  const formatVolume = (value: number): string => {
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(1)}B`;
    } else if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toLocaleString();
  };

  const fetchWatchlist = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockWatchlist: WatchlistItem[] = [
        {
          symbol: 'AAPL',
          company_name: 'Apple Inc.',
          current_price: 178.25,
          change: 2.75,
          change_percent: 1.57,
          volume: 45620000,
          high_price: 179.5,
          low_price: 175.8,
          is_favorite: true,
          market_cap: 2800000000000,
          pe_ratio: 28.5,
        },
        {
          symbol: 'GOOGL',
          company_name: 'Alphabet Inc.',
          current_price: 138.5,
          change: -1.25,
          change_percent: -0.89,
          volume: 23450000,
          high_price: 140.2,
          low_price: 137.9,
          is_favorite: false,
          market_cap: 1750000000000,
          pe_ratio: 25.2,
        },
        {
          symbol: 'MSFT',
          company_name: 'Microsoft Corporation',
          current_price: 422.3,
          change: 5.8,
          change_percent: 1.39,
          volume: 18230000,
          high_price: 423.1,
          low_price: 418.5,
          is_favorite: true,
          market_cap: 3150000000000,
          pe_ratio: 32.1,
        },
        {
          symbol: 'TSLA',
          company_name: 'Tesla, Inc.',
          current_price: 242.4,
          change: -8.6,
          change_percent: -3.43,
          volume: 89450000,
          high_price: 251.2,
          low_price: 240.1,
          is_favorite: false,
          market_cap: 770000000000,
          pe_ratio: 65.8,
        },
        {
          symbol: 'NVDA',
          company_name: 'NVIDIA Corporation',
          current_price: 875.6,
          change: 15.3,
          change_percent: 1.78,
          volume: 34560000,
          high_price: 878.9,
          low_price: 862.4,
          is_favorite: true,
          market_cap: 2150000000000,
          pe_ratio: 58.7,
        },
      ];
      setWatchlist(mockWatchlist);
    } catch (error) {
      console.error('Failed to fetch watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (symbol: string) => {
    setWatchlist((prev) =>
      prev.map((item) =>
        item.symbol === symbol ? { ...item, is_favorite: !item.is_favorite } : item
      )
    );
  };

  const removeFromWatchlist = (symbol: string) => {
    setWatchlist((prev) => prev.filter((item) => item.symbol !== symbol));
  };

  const addToWatchlist = () => {
    if (!newSymbol.trim()) return;

    // Mock adding symbol - replace with actual API call
    const newItem: WatchlistItem = {
      symbol: newSymbol.toUpperCase(),
      company_name: `${newSymbol.toUpperCase()} Inc.`,
      current_price: Math.random() * 200 + 50,
      change: (Math.random() - 0.5) * 10,
      change_percent: (Math.random() - 0.5) * 5,
      volume: Math.floor(Math.random() * 50000000) + 1000000,
      high_price: 0,
      low_price: 0,
      is_favorite: false,
    };

    newItem.high_price = newItem.current_price * 1.02;
    newItem.low_price = newItem.current_price * 0.98;

    setWatchlist((prev) => [...prev, newItem]);
    setNewSymbol('');
    setAddDialogOpen(false);
  };

  const sortedWatchlist = [...watchlist].sort((a, b) => {
    if (a.is_favorite && !b.is_favorite) return -1;
    if (!a.is_favorite && b.is_favorite) return 1;
    return a.symbol.localeCompare(b.symbol);
  });

  useEffect(() => {
    fetchWatchlist();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Watchlist
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" startIcon={<Add />} onClick={() => setAddDialogOpen(true)}>
            Add Symbol
          </Button>
          <Tooltip title="Refresh Watchlist">
            <IconButton onClick={fetchWatchlist} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {sortedWatchlist.map((item) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={item.symbol}>
            <Card
              sx={{
                height: '100%',
                border: item.is_favorite ? '2px solid' : '1px solid',
                borderColor: item.is_favorite ? 'warning.main' : 'divider',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 4,
                },
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 2,
                  }}
                >
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {item.symbol}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {item.company_name}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton
                      size="small"
                      onClick={() => toggleFavorite(item.symbol)}
                      color={item.is_favorite ? 'warning' : 'default'}
                    >
                      {item.is_favorite ? <Star /> : <StarBorder />}
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => removeFromWatchlist(item.symbol)}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(item.current_price)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    {item.change >= 0 ? (
                      <TrendingUp fontSize="small" color="success" sx={{ mr: 0.5 }} />
                    ) : (
                      <TrendingDown fontSize="small" color="error" sx={{ mr: 0.5 }} />
                    )}
                    <Typography
                      variant="body2"
                      sx={{
                        color: item.change >= 0 ? 'success.main' : 'error.main',
                        fontWeight: 'bold',
                      }}
                    >
                      {formatCurrency(Math.abs(item.change))} ({formatPercent(item.change_percent)})
                    </Typography>
                  </Box>
                </Box>

                <Grid container spacing={1} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'action.hover' }}>
                      <Typography variant="caption" color="text.secondary">
                        High
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {formatCurrency(item.high_price)}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'action.hover' }}>
                      <Typography variant="caption" color="text.secondary">
                        Low
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {formatCurrency(item.low_price)}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Volume: {formatVolume(item.volume)}
                  </Typography>
                </Box>

                {(item.market_cap || item.pe_ratio) && (
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {item.market_cap && (
                      <Chip
                        size="small"
                        label={`MCap: ${formatVolume(item.market_cap)}`}
                        variant="outlined"
                      />
                    )}
                    {item.pe_ratio && (
                      <Chip size="small" label={`P/E: ${item.pe_ratio}`} variant="outlined" />
                    )}
                  </Box>
                )}

                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                  <Button variant="outlined" size="small" startIcon={<ShowChart />} fullWidth>
                    View Chart
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {watchlist.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <ShowChart sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Your watchlist is empty
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Add symbols to track their performance and get real-time updates
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => setAddDialogOpen(true)}>
            Add Your First Symbol
          </Button>
        </Box>
      )}

      {/* Add Symbol Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)}>
        <DialogTitle>Add Symbol to Watchlist</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Symbol"
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
            placeholder="AAPL, TSLA, GOOGL..."
            fullWidth
            variant="outlined"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                addToWatchlist();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button onClick={addToWatchlist} variant="contained" disabled={!newSymbol.trim()}>
            Add Symbol
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WatchlistPage;
