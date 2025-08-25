import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, Button, Chip, CircularProgress, Alert } from '@mui/material';
import { TrendingUp, TrendingDown, AccountBalance, ShowChart } from '@mui/icons-material';
import alpacaApi, { AlpacaAccount, AlpacaPosition } from '../../services/alpacaApi';

const AlpacaTestPage: React.FC = () => {
  const [account, setAccount] = useState<AlpacaAccount | null>(null);
  const [positions, setPositions] = useState<AlpacaPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load account info
      const accountInfo = await alpacaApi.getAccount();
      setAccount(accountInfo);

      // Load positions
      const positionsList = await alpacaApi.getPositions();
      setPositions(positionsList);

      console.log('Alpaca data loaded successfully');
    } catch (err) {
      console.error('Error loading Alpaca data:', err);
      setError('Failed to load Alpaca data. Service may be using demo keys.');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyStock = async (symbol: string) => {
    try {
      const order = await alpacaApi.buyStock(symbol, 1);
      if (order) {
        alert(`Order placed: ${order.side} ${order.qty} shares of ${order.symbol}`);
        loadData(); // Reload data
      } else {
        alert('Failed to place order');
      }
    } catch (err) {
      console.error('Error placing order:', err);
      alert('Error placing order (demo mode)');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
        <Typography variant="h6" ml={2}>
          Loading Alpaca Integration...
        </Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        <AccountBalance sx={{ mr: 1, verticalAlign: 'middle' }} />
        Alpaca Paper Trading Test Environment
      </Typography>

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Account Information */}
      <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ flex: '1 1 400px' }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Account Information
            </Typography>
            {account ? (
              <Box>
                <Typography>
                  <strong>Status:</strong> {account.status}
                </Typography>
                <Typography>
                  <strong>Buying Power:</strong> ${account.buying_power.toFixed(2)}
                </Typography>
                <Typography>
                  <strong>Cash:</strong> ${account.cash.toFixed(2)}
                </Typography>
                <Typography>
                  <strong>Portfolio Value:</strong> ${account.portfolio_value.toFixed(2)}
                </Typography>
                <Typography>
                  <strong>Equity:</strong> ${account.equity.toFixed(2)}
                </Typography>
                <Chip
                  label={account.paper_trading ? 'Paper Trading' : 'Live Trading'}
                  color={account.paper_trading ? 'info' : 'success'}
                  sx={{ mt: 1 }}
                />
              </Box>
            ) : (
              <Typography color="text.secondary">
                No account data available (using demo keys)
              </Typography>
            )}
          </Paper>
        </Box>

        <Box sx={{ flex: '1 1 400px' }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Current Positions
            </Typography>
            {positions.length > 0 ? (
              positions.map((pos, index) => (
                <Box key={index} mb={1}>
                  <Typography>
                    <strong>{pos.symbol}:</strong> {pos.qty} shares @ $
                    {pos.current_price.toFixed(2)}
                  </Typography>
                  <Typography
                    variant="body2"
                    color={pos.unrealized_pl >= 0 ? 'success.main' : 'error.main'}
                  >
                    P&L: ${pos.unrealized_pl.toFixed(2)} ({(pos.unrealized_plpc * 100).toFixed(2)}%)
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography color="text.secondary">No positions found</Typography>
            )}
          </Paper>
        </Box>
      </Box>

      {/* Alpaca Service Connection Test */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          <ShowChart sx={{ mr: 1, verticalAlign: 'middle' }} />
          Alpaca Service Connection Test
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography variant="body2">
            Service Status:{' '}
            {account ? (
              <Chip label="Connected" color="success" size="small" />
            ) : (
              <Chip label="Using Demo Data" color="warning" size="small" />
            )}
          </Typography>

          <Typography variant="body2">API Endpoint: http://localhost:8200/candidates</Typography>

          <Typography variant="body2">
            Mode: {account?.paper_trading ? 'Paper Trading' : 'Demo Mode'}
          </Typography>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            This page tests the Alpaca integration service. For full candidates analysis and
            trading, use the <strong>Candidates</strong> page from the sidebar.
          </Typography>
        </Box>
      </Paper>

      <Box mt={3} textAlign="center">
        <Button variant="outlined" onClick={loadData} startIcon={<ShowChart />}>
          Refresh Data
        </Button>
      </Box>
    </Box>
  );
};

export default AlpacaTestPage;
