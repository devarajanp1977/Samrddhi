import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  LinearProgress,
  Alert,
  CircularProgress,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
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
  Pause,
  PauseCircle,
  Visibility,
  ShoppingCart,
  AutoMode,
  PrecisionManufacturing,
  Assessment,
  TrendingFlat,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import candidatesApi, { TradingCandidate } from '../../services/candidatesApi';

// Enhanced interface for trading candidates - now imported from candidatesApi
// interface TradingCandidate - imported from candidatesApi

// Props interface for the enhanced watchlist
interface CandidatesWatchlistProps {
  autoTradingEnabled: boolean;
  onAutoTradingToggle: () => void;
}

const CandidatesWatchlist: React.FC<CandidatesWatchlistProps> = ({
  autoTradingEnabled,
  onAutoTradingToggle,
}) => {
  const [candidates, setCandidates] = useState<TradingCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newSymbol, setNewSymbol] = useState('');
  const [candidateCount, setCandidateCount] = useState<number>(10);
  const [sortBy, setSortBy] = useState<'profit_projection' | 'signal_strength' | 'risk_score'>(
    'profit_projection'
  );

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

  const getAutomationStatusColor = (status: string) => {
    switch (status) {
      case 'auto':
        return 'success';
      case 'buying':
        return 'info';
      case 'paused':
        return 'warning';
      case 'watch-only':
        return 'default';
      default:
        return 'default';
    }
  };

  const getAutomationStatusIcon = (status: string) => {
    switch (status) {
      case 'auto':
        return <AutoMode fontSize="small" />;
      case 'buying':
        return <ShoppingCart fontSize="small" />;
      case 'paused':
        return <PauseCircle fontSize="small" />;
      case 'watch-only':
        return <Visibility fontSize="small" />;
      default:
        return <TrendingFlat fontSize="small" />;
    }
  };

  const getTimeSensitivityColor = (sensitivity: string) => {
    switch (sensitivity) {
      case 'high':
        return '#f44336';
      case 'medium':
        return '#ff9800';
      case 'low':
        return '#4caf50';
      default:
        return '#666';
    }
  };

  const getRiskColor = (risk: number) => {
    if (risk <= 0.3) return '#4caf50';
    if (risk <= 0.6) return '#ff9800';
    return '#f44336';
  };

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      // Use the real candidates API
      const candidates = await candidatesApi.getCandidates(candidateCount * 2); // Get extra to allow for filtering
      setCandidates(candidates);
    } catch (error) {
      console.error('Failed to fetch candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const scanAndAddSymbol = async () => {
    if (!newSymbol.trim()) return;

    setLoading(true);
    try {
      // Scan the symbol for signals
      const scanResult = await candidatesApi.scanSymbol(newSymbol.toUpperCase());

      if (scanResult.signals_generated > 0) {
        // Refresh the candidates list to include the new symbol
        await fetchCandidates();
        setNewSymbol('');
        setAddDialogOpen(false);
      } else {
        console.log(`No signals generated for ${newSymbol}`);
      }
    } catch (error) {
      console.error('Error scanning symbol:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCandidateCountChange = (event: SelectChangeEvent<number>) => {
    setCandidateCount(event.target.value as number);
  };

  const handleSortChange = (event: SelectChangeEvent<string>) => {
    setSortBy(event.target.value as 'profit_projection' | 'signal_strength' | 'risk_score');
  };

  const toggleAutomationStatus = async (symbol: string, newStatus: string) => {
    // Update locally immediately for responsive UI
    setCandidates((prev) =>
      prev.map((candidate) =>
        candidate.symbol === symbol
          ? { ...candidate, automation_status: newStatus as any }
          : candidate
      )
    );

    // Update via API
    try {
      await candidatesApi.updateAutomationStatus(symbol, newStatus as any);
    } catch (error) {
      console.error(`Error updating automation status for ${symbol}:`, error);
      // Revert on error
      setCandidates((prev) =>
        prev.map((candidate) =>
          candidate.symbol === symbol
            ? { ...candidate, automation_status: candidate.automation_status }
            : candidate
        )
      );
    }
  };

  const handleForceBuy = async (symbol: string, positionSize: number) => {
    try {
      const success = await candidatesApi.forceBuyCandidate(symbol, positionSize);
      if (success) {
        // Update status to buying
        setCandidates((prev) =>
          prev.map((candidate) =>
            candidate.symbol === symbol
              ? { ...candidate, automation_status: 'buying' as any }
              : candidate
          )
        );
      }
    } catch (error) {
      console.error(`Error executing force buy for ${symbol}:`, error);
    }
  };

  const toggleFavorite = (symbol: string) => {
    setCandidates((prev) =>
      prev.map((candidate) =>
        candidate.symbol === symbol
          ? { ...candidate, is_favorite: !candidate.is_favorite }
          : candidate
      )
    );
  };

  const removeFromWatchlist = (symbol: string) => {
    setCandidates((prev) => prev.filter((candidate) => candidate.symbol !== symbol));
  };

  const addToWatchlist = () => {
    // Use the new scanAndAddSymbol function
    scanAndAddSymbol();
  };

  // Sort and filter candidates based on user selection
  const sortedCandidates = [...candidates]
    .sort((a, b) => {
      switch (sortBy) {
        case 'profit_projection':
          return b.profit_projection - a.profit_projection;
        case 'signal_strength':
          return b.signal_strength - a.signal_strength;
        case 'risk_score':
          return a.risk_score - b.risk_score; // Lower risk is better
        default:
          return 0;
      }
    })
    .slice(0, candidateCount);

  const autoTradingCandidates = candidates.filter((c) => c.automation_status === 'auto').length;
  const buyingCandidates = candidates.filter((c) => c.automation_status === 'buying').length;

  useEffect(() => {
    fetchCandidates();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header with Master Auto-Trading Status */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
          <PrecisionManufacturing sx={{ mr: 2, color: 'primary.main' }} />
          Candidates Command Center
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Alert
            severity={autoTradingEnabled ? 'success' : 'warning'}
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            {autoTradingEnabled ? (
              <>
                Auto-Trading: <strong>ACTIVE</strong> • {autoTradingCandidates} candidates queued
              </>
            ) : (
              <>
                Auto-Trading: <strong>PAUSED</strong> • Manual mode
              </>
            )}
            {buyingCandidates > 0 && (
              <>
                {' '}
                • <CircularProgress size={16} sx={{ ml: 1 }} /> {buyingCandidates} buying
              </>
            )}
          </Alert>

          <Button variant="contained" startIcon={<Add />} onClick={() => setAddDialogOpen(true)}>
            Add Symbol
          </Button>

          <Tooltip title="Refresh Candidates">
            <IconButton onClick={fetchCandidates} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Control Panel */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Box sx={{ minWidth: 200 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Show Candidates</InputLabel>
              <Select
                value={candidateCount}
                label="Show Candidates"
                onChange={handleCandidateCountChange}
              >
                <MenuItem value={5}>Top 5 Candidates</MenuItem>
                <MenuItem value={10}>Top 10 Candidates</MenuItem>
                <MenuItem value={15}>Top 15 Candidates</MenuItem>
                <MenuItem value={20}>Top 20 Candidates</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ minWidth: 200 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Sort By</InputLabel>
              <Select value={sortBy} label="Sort By" onChange={handleSortChange}>
                <MenuItem value="profit_projection">Profit Potential</MenuItem>
                <MenuItem value="signal_strength">Signal Strength</MenuItem>
                <MenuItem value="risk_score">Risk Level (Low to High)</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ flex: 1, textAlign: 'right' }}>
            <Typography variant="body2" color="text.secondary">
              Showing top {Math.min(candidateCount, candidates.length)} of {candidates.length}{' '}
              candidates
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Candidates Table */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Rank</TableCell>
              <TableCell>Symbol</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Change</TableCell>
              <TableCell>Profit Proj.</TableCell>
              <TableCell>Signal</TableCell>
              <TableCell>Risk</TableCell>
              <TableCell>Strategy</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedCandidates.map((candidate, index) => (
              <TableRow
                key={candidate.symbol}
                hover
                sx={{
                  bgcolor: candidate.is_favorite ? alpha('#ff9800', 0.1) : 'inherit',
                }}
              >
                {/* Rank */}
                <TableCell>
                  <Badge badgeContent={`#${index + 1}`} color="primary">
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: getTimeSensitivityColor(candidate.time_sensitivity),
                      }}
                    />
                  </Badge>
                </TableCell>

                {/* Symbol & Company */}
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {candidate.symbol}
                      {candidate.is_favorite && (
                        <Star fontSize="small" color="warning" sx={{ ml: 0.5 }} />
                      )}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {candidate.company_name}
                    </Typography>
                  </Box>
                </TableCell>

                {/* Price */}
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {formatCurrency(candidate.current_price)}
                  </Typography>
                </TableCell>

                {/* Change */}
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {candidate.change >= 0 ? (
                      <TrendingUp fontSize="small" color="success" sx={{ mr: 0.5 }} />
                    ) : (
                      <TrendingDown fontSize="small" color="error" sx={{ mr: 0.5 }} />
                    )}
                    <Typography
                      variant="body2"
                      color={candidate.change >= 0 ? 'success.main' : 'error.main'}
                      fontWeight="medium"
                    >
                      {formatPercent(candidate.change_percent)}
                    </Typography>
                  </Box>
                </TableCell>

                {/* Profit Projection */}
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="bold" color="success.main">
                      +{candidate.profit_projection.toFixed(1)}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={candidate.profit_confidence * 100}
                      sx={{ width: 60, height: 3, borderRadius: 2 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {(candidate.profit_confidence * 100).toFixed(0)}%
                    </Typography>
                  </Box>
                </TableCell>

                {/* Signal Strength */}
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 80 }}>
                    <LinearProgress
                      variant="determinate"
                      value={candidate.signal_strength * 100}
                      sx={{ flexGrow: 1, height: 4, borderRadius: 2 }}
                    />
                    <Typography variant="caption" sx={{ ml: 1 }}>
                      {(candidate.signal_strength * 100).toFixed(0)}%
                    </Typography>
                  </Box>
                </TableCell>

                {/* Risk Score */}
                <TableCell>
                  <Typography
                    variant="body2"
                    fontWeight="medium"
                    color={getRiskColor(candidate.risk_score)}
                  >
                    {(candidate.risk_score * 100).toFixed(0)}%
                  </Typography>
                </TableCell>

                {/* Strategy */}
                <TableCell>
                  <Chip size="small" label={candidate.strategy} variant="outlined" />
                </TableCell>

                {/* Automation Status */}
                <TableCell>
                  <Chip
                    icon={getAutomationStatusIcon(candidate.automation_status)}
                    label={candidate.automation_status.toUpperCase().replace('-', ' ')}
                    color={getAutomationStatusColor(candidate.automation_status) as any}
                    variant={candidate.automation_status === 'auto' ? 'filled' : 'outlined'}
                    size="small"
                  />
                </TableCell>

                {/* Actions */}
                <TableCell>
                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title="Toggle Favorite">
                      <IconButton
                        size="small"
                        onClick={() => toggleFavorite(candidate.symbol)}
                        color={candidate.is_favorite ? 'warning' : 'default'}
                      >
                        {candidate.is_favorite ? (
                          <Star fontSize="small" />
                        ) : (
                          <StarBorder fontSize="small" />
                        )}
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Auto Trade">
                      <IconButton
                        size="small"
                        color={candidate.automation_status === 'auto' ? 'success' : 'default'}
                        onClick={() => toggleAutomationStatus(candidate.symbol, 'auto')}
                      >
                        <AutoMode fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Pause">
                      <IconButton
                        size="small"
                        color={candidate.automation_status === 'paused' ? 'warning' : 'default'}
                        onClick={() => toggleAutomationStatus(candidate.symbol, 'paused')}
                      >
                        <Pause fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Watch Only">
                      <IconButton
                        size="small"
                        color={candidate.automation_status === 'watch-only' ? 'info' : 'default'}
                        onClick={() => toggleAutomationStatus(candidate.symbol, 'watch-only')}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Force Buy">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleForceBuy(candidate.symbol, candidate.position_size)}
                      >
                        <ShoppingCart fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Remove">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => removeFromWatchlist(candidate.symbol)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {candidates.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Assessment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No candidates identified yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            The AI is scanning markets for profitable opportunities. Check back soon or add symbols
            manually.
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => setAddDialogOpen(true)}>
            Add Symbol to Scan
          </Button>
        </Box>
      )}

      {/* Add Symbol Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)}>
        <DialogTitle>Add Symbol for Analysis</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Stock Symbol"
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
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            The AI will analyze this symbol for profit opportunities and add it to your candidates
            list.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button onClick={addToWatchlist} variant="contained" disabled={!newSymbol.trim()}>
            Add & Analyze
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CandidatesWatchlist;
