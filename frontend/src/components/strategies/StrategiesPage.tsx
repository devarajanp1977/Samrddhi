import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Fab,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  Add,
  Edit,
  Delete,
  Refresh,
  AutoMode,
  TrendingUp,
  TrendingDown,
  Speed,
  Assessment,
  Settings,
  Code,
} from '@mui/icons-material';

interface Strategy {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'stopped';
  type: 'momentum' | 'mean_reversion' | 'arbitrage' | 'custom';
  created_at: string;
  last_run: string;
  performance: {
    total_return: number;
    win_rate: number;
    trades_count: number;
    avg_return_per_trade: number;
    max_drawdown: number;
  };
  parameters: {
    [key: string]: any;
  };
  risk_limits: {
    max_position_size: number;
    stop_loss: number;
    take_profit: number;
  };
}

interface StrategyTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  default_parameters: {
    [key: string]: any;
  };
}

const StrategiesPage: React.FC = () => {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [templates, setTemplates] = useState<StrategyTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  // New strategy form
  const [newStrategy, setNewStrategy] = useState({
    name: '',
    description: '',
    type: 'momentum' as Strategy['type'],
    parameters: {},
    risk_limits: {
      max_position_size: 10000,
      stop_loss: 5,
      take_profit: 10,
    },
  });

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

  const getStatusColor = (status: Strategy['status']): 'success' | 'warning' | 'default' => {
    switch (status) {
      case 'active':
        return 'success';
      case 'paused':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getTypeIcon = (type: Strategy['type']) => {
    switch (type) {
      case 'momentum':
        return <TrendingUp />;
      case 'mean_reversion':
        return <TrendingDown />;
      case 'arbitrage':
        return <Speed />;
      default:
        return <Code />;
    }
  };

  const fetchStrategiesData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data for strategies
      const mockStrategies: Strategy[] = [
        {
          id: '1',
          name: 'Momentum Breakout',
          description: 'Identifies stocks breaking through resistance levels with high volume',
          status: 'active',
          type: 'momentum',
          created_at: '2024-01-15T10:00:00Z',
          last_run: '2024-01-20T14:30:00Z',
          performance: {
            total_return: 15.3,
            win_rate: 68.5,
            trades_count: 47,
            avg_return_per_trade: 2.8,
            max_drawdown: -4.2,
          },
          parameters: {
            lookback_period: 20,
            volume_threshold: 1.5,
            price_threshold: 0.02,
          },
          risk_limits: {
            max_position_size: 10000,
            stop_loss: 5,
            take_profit: 12,
          },
        },
        {
          id: '2',
          name: 'Mean Reversion RSI',
          description: 'Buys oversold stocks and sells overbought stocks based on RSI',
          status: 'paused',
          type: 'mean_reversion',
          created_at: '2024-01-10T09:00:00Z',
          last_run: '2024-01-19T16:00:00Z',
          performance: {
            total_return: 8.7,
            win_rate: 72.3,
            trades_count: 83,
            avg_return_per_trade: 1.4,
            max_drawdown: -6.1,
          },
          parameters: {
            rsi_overbought: 70,
            rsi_oversold: 30,
            holding_period: 5,
          },
          risk_limits: {
            max_position_size: 8000,
            stop_loss: 4,
            take_profit: 8,
          },
        },
        {
          id: '3',
          name: 'Pairs Trading',
          description: 'Statistical arbitrage strategy trading correlated stock pairs',
          status: 'stopped',
          type: 'arbitrage',
          created_at: '2024-01-05T11:00:00Z',
          last_run: '2024-01-18T10:15:00Z',
          performance: {
            total_return: 4.2,
            win_rate: 58.9,
            trades_count: 156,
            avg_return_per_trade: 0.6,
            max_drawdown: -2.8,
          },
          parameters: {
            correlation_threshold: 0.8,
            z_score_entry: 2.0,
            z_score_exit: 0.5,
          },
          risk_limits: {
            max_position_size: 15000,
            stop_loss: 3,
            take_profit: 6,
          },
        },
      ];

      // Mock templates
      const mockTemplates: StrategyTemplate[] = [
        {
          id: 'momentum_template',
          name: 'Momentum Strategy',
          description: 'Template for momentum-based trading strategies',
          type: 'momentum',
          default_parameters: {
            lookback_period: 20,
            volume_threshold: 1.2,
            price_threshold: 0.015,
          },
        },
        {
          id: 'mean_reversion_template',
          name: 'Mean Reversion Strategy',
          description: 'Template for mean reversion strategies',
          type: 'mean_reversion',
          default_parameters: {
            rsi_overbought: 70,
            rsi_oversold: 30,
            holding_period: 3,
          },
        },
        {
          id: 'arbitrage_template',
          name: 'Arbitrage Strategy',
          description: 'Template for arbitrage trading strategies',
          type: 'arbitrage',
          default_parameters: {
            correlation_threshold: 0.75,
            z_score_entry: 1.5,
            z_score_exit: 0.3,
          },
        },
      ];

      setStrategies(mockStrategies);
      setTemplates(mockTemplates);
    } catch (err) {
      setError('Failed to fetch strategies data');
      console.error('Strategies fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStrategyAction = (strategyId: string, action: 'start' | 'pause' | 'stop') => {
    setStrategies((prev) =>
      prev.map((strategy) =>
        strategy.id === strategyId
          ? {
              ...strategy,
              status: action === 'start' ? 'active' : action === 'pause' ? 'paused' : 'stopped',
              last_run: action === 'start' ? new Date().toISOString() : strategy.last_run,
            }
          : strategy
      )
    );
  };

  const handleCreateStrategy = () => {
    const strategy: Strategy = {
      id: Date.now().toString(),
      name: newStrategy.name,
      description: newStrategy.description,
      status: 'stopped',
      type: newStrategy.type,
      created_at: new Date().toISOString(),
      last_run: '',
      performance: {
        total_return: 0,
        win_rate: 0,
        trades_count: 0,
        avg_return_per_trade: 0,
        max_drawdown: 0,
      },
      parameters: newStrategy.parameters,
      risk_limits: newStrategy.risk_limits,
    };

    setStrategies((prev) => [...prev, strategy]);
    setCreateDialogOpen(false);
    setNewStrategy({
      name: '',
      description: '',
      type: 'momentum',
      parameters: {},
      risk_limits: {
        max_position_size: 10000,
        stop_loss: 5,
        take_profit: 10,
      },
    });
    setSelectedTemplate('');
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setNewStrategy((prev) => ({
        ...prev,
        type: template.type as Strategy['type'],
        parameters: template.default_parameters,
      }));
    }
    setSelectedTemplate(templateId);
  };

  const handleDeleteStrategy = (strategyId: string) => {
    setStrategies((prev) => prev.filter((s) => s.id !== strategyId));
  };

  useEffect(() => {
    fetchStrategiesData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress sx={{ mb: 2 }} />
        <Typography>Loading strategies...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Trading Strategies
        </Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{ mr: 1 }}
          >
            Create Strategy
          </Button>
          <Tooltip title="Refresh Data">
            <IconButton onClick={fetchStrategiesData} disabled={loading}>
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

      {/* Strategy Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AutoMode sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Total Strategies</Typography>
              </Box>
              <Typography variant="h4">{strategies.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PlayArrow sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">Active</Typography>
              </Box>
              <Typography variant="h4">
                {strategies.filter((s) => s.status === 'active').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Assessment sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h6">Avg Win Rate</Typography>
              </Box>
              <Typography variant="h4">
                {strategies.length > 0
                  ? `${(strategies.reduce((sum, s) => sum + s.performance.win_rate, 0) / strategies.length).toFixed(1)}%`
                  : '0%'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUp sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">Total Return</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: 'success.main' }}>
                {formatPercent(strategies.reduce((sum, s) => sum + s.performance.total_return, 0))}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Strategies Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Strategy Performance
          </Typography>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Strategy</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Total Return</TableCell>
                  <TableCell align="right">Win Rate</TableCell>
                  <TableCell align="right">Trades</TableCell>
                  <TableCell align="right">Max Drawdown</TableCell>
                  <TableCell>Last Run</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {strategies.map((strategy) => (
                  <TableRow key={strategy.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                          {strategy.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {strategy.description}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getTypeIcon(strategy.type)}
                        label={strategy.type.replace('_', ' ')}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={strategy.status.toUpperCase()}
                        color={getStatusColor(strategy.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        sx={{
                          color:
                            strategy.performance.total_return >= 0 ? 'success.main' : 'error.main',
                          fontWeight: 'bold',
                        }}
                      >
                        {formatPercent(strategy.performance.total_return)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{strategy.performance.win_rate.toFixed(1)}%</TableCell>
                    <TableCell align="right">{strategy.performance.trades_count}</TableCell>
                    <TableCell align="right">
                      <Typography sx={{ color: 'error.main' }}>
                        {formatPercent(strategy.performance.max_drawdown)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {strategy.last_run ? new Date(strategy.last_run).toLocaleString() : 'Never'}
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {strategy.status !== 'active' && (
                          <Tooltip title="Start">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleStrategyAction(strategy.id, 'start')}
                            >
                              <PlayArrow />
                            </IconButton>
                          </Tooltip>
                        )}
                        {strategy.status === 'active' && (
                          <Tooltip title="Pause">
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={() => handleStrategyAction(strategy.id, 'pause')}
                            >
                              <Pause />
                            </IconButton>
                          </Tooltip>
                        )}
                        {strategy.status !== 'stopped' && (
                          <Tooltip title="Stop">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleStrategyAction(strategy.id, 'stop')}
                            >
                              <Stop />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedStrategy(strategy);
                              setEditDialogOpen(true);
                            }}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteStrategy(strategy.id)}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Create Strategy Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Strategy</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Choose Template (Optional)
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Strategy Template</InputLabel>
                <Select
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateSelect(e.target.value)}
                >
                  <MenuItem value="">Custom Strategy</MenuItem>
                  {templates.map((template) => (
                    <MenuItem key={template.id} value={template.id}>
                      {template.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Strategy Name"
                value={newStrategy.name}
                onChange={(e) => setNewStrategy({ ...newStrategy, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Strategy Type</InputLabel>
                <Select
                  value={newStrategy.type}
                  onChange={(e) =>
                    setNewStrategy({ ...newStrategy, type: e.target.value as Strategy['type'] })
                  }
                >
                  <MenuItem value="momentum">Momentum</MenuItem>
                  <MenuItem value="mean_reversion">Mean Reversion</MenuItem>
                  <MenuItem value="arbitrage">Arbitrage</MenuItem>
                  <MenuItem value="custom">Custom</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={newStrategy.description}
                onChange={(e) => setNewStrategy({ ...newStrategy, description: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Risk Limits
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Max Position Size ($)"
                value={newStrategy.risk_limits.max_position_size}
                onChange={(e) =>
                  setNewStrategy({
                    ...newStrategy,
                    risk_limits: {
                      ...newStrategy.risk_limits,
                      max_position_size: parseFloat(e.target.value) || 0,
                    },
                  })
                }
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Stop Loss (%)"
                value={newStrategy.risk_limits.stop_loss}
                onChange={(e) =>
                  setNewStrategy({
                    ...newStrategy,
                    risk_limits: {
                      ...newStrategy.risk_limits,
                      stop_loss: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                inputProps={{ step: '0.1' }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Take Profit (%)"
                value={newStrategy.risk_limits.take_profit}
                onChange={(e) =>
                  setNewStrategy({
                    ...newStrategy,
                    risk_limits: {
                      ...newStrategy.risk_limits,
                      take_profit: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                inputProps={{ step: '0.1' }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateStrategy}
            variant="contained"
            disabled={!newStrategy.name.trim()}
          >
            Create Strategy
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Strategy Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Strategy: {selectedStrategy?.name}</DialogTitle>
        <DialogContent>
          {selectedStrategy && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Strategy Parameters
              </Typography>
              <Grid container spacing={2}>
                {Object.entries(selectedStrategy.parameters).map(([key, value]) => (
                  <Grid item xs={12} md={4} key={key}>
                    <TextField
                      fullWidth
                      label={key.replace('_', ' ').toUpperCase()}
                      value={value}
                      type="number"
                      inputProps={{ step: '0.01' }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button variant="contained">Save Changes</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StrategiesPage;
