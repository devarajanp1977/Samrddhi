import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Alert,
  Button,
  Switch,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Slider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Security,
  Warning,
  Shield,
  Speed,
  TrendingDown,
  Settings,
  Refresh,
  Add,
  Edit,
  Delete,
  NotificationImportant,
} from '@mui/icons-material';

interface RiskRule {
  id: string;
  name: string;
  type: 'position_size' | 'portfolio_value' | 'daily_loss' | 'sector_concentration' | 'correlation';
  threshold: number;
  action: 'alert' | 'block' | 'reduce';
  enabled: boolean;
  description: string;
}

interface RiskAlert {
  id: string;
  rule_id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
}

interface RiskMetrics {
  portfolio_var: number;
  beta: number;
  correlation_spy: number;
  max_drawdown: number;
  sharpe_ratio: number;
  risk_score: number;
  concentration_risk: number;
  leverage: number;
}

const RiskPage: React.FC = () => {
  const [riskRules, setRiskRules] = useState<RiskRule[]>([]);
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RiskRule | null>(null);

  // New rule form state
  const [newRule, setNewRule] = useState<Partial<RiskRule>>({
    name: '',
    type: 'position_size',
    threshold: 0,
    action: 'alert',
    enabled: true,
    description: '',
  });

  const formatPercent = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getRiskScoreColor = (score: number): 'success' | 'warning' | 'error' => {
    if (score < 40) return 'success';
    if (score < 70) return 'warning';
    return 'error';
  };

  const getSeverityColor = (
    severity: RiskAlert['severity']
  ): 'default' | 'info' | 'warning' | 'error' => {
    switch (severity) {
      case 'low':
        return 'info';
      case 'medium':
        return 'warning';
      case 'high':
        return 'error';
      case 'critical':
        return 'error';
      default:
        return 'default';
    }
  };

  const getActionColor = (action: RiskRule['action']): 'default' | 'warning' | 'error' => {
    switch (action) {
      case 'alert':
        return 'default';
      case 'reduce':
        return 'warning';
      case 'block':
        return 'error';
      default:
        return 'default';
    }
  };

  const fetchRiskData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock risk metrics
      const mockMetrics: RiskMetrics = {
        portfolio_var: -2.8,
        beta: 1.15,
        correlation_spy: 0.78,
        max_drawdown: -8.5,
        sharpe_ratio: 1.24,
        risk_score: 65,
        concentration_risk: 35.2,
        leverage: 1.0,
      };

      // Mock risk rules
      const mockRules: RiskRule[] = [
        {
          id: '1',
          name: 'Maximum Position Size',
          type: 'position_size',
          threshold: 15,
          action: 'block',
          enabled: true,
          description: 'Prevent any single position from exceeding 15% of portfolio',
        },
        {
          id: '2',
          name: 'Daily Loss Limit',
          type: 'daily_loss',
          threshold: 5,
          action: 'alert',
          enabled: true,
          description: 'Alert when daily portfolio loss exceeds 5%',
        },
        {
          id: '3',
          name: 'Sector Concentration',
          type: 'sector_concentration',
          threshold: 40,
          action: 'reduce',
          enabled: true,
          description: 'Reduce positions when sector allocation exceeds 40%',
        },
        {
          id: '4',
          name: 'Portfolio Drawdown',
          type: 'portfolio_value',
          threshold: 10,
          action: 'alert',
          enabled: false,
          description: 'Alert when portfolio drawdown exceeds 10%',
        },
      ];

      // Mock risk alerts
      const mockAlerts: RiskAlert[] = [
        {
          id: '1',
          rule_id: '1',
          severity: 'high',
          message: 'AAPL position has reached 16.8% of portfolio, exceeding the 15% limit',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          resolved: false,
        },
        {
          id: '2',
          rule_id: '2',
          severity: 'medium',
          message: 'Daily portfolio loss has reached 3.2%, approaching the 5% threshold',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          resolved: false,
        },
        {
          id: '3',
          rule_id: '3',
          severity: 'low',
          message: 'Technology sector allocation is at 38%, approaching the 40% limit',
          timestamp: new Date(Date.now() - 14400000).toISOString(),
          resolved: true,
        },
      ];

      setRiskMetrics(mockMetrics);
      setRiskRules(mockRules);
      setRiskAlerts(mockAlerts);
    } catch (err) {
      setError('Failed to fetch risk data');
      console.error('Risk data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRuleToggle = (ruleId: string) => {
    setRiskRules((prev) =>
      prev.map((rule) => (rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule))
    );
  };

  const handleCreateRule = () => {
    if (!newRule.name || !newRule.threshold) return;

    const rule: RiskRule = {
      id: Date.now().toString(),
      name: newRule.name!,
      type: newRule.type!,
      threshold: newRule.threshold!,
      action: newRule.action!,
      enabled: newRule.enabled!,
      description: newRule.description!,
    };

    setRiskRules((prev) => [...prev, rule]);
    setRuleDialogOpen(false);
    setNewRule({
      name: '',
      type: 'position_size',
      threshold: 0,
      action: 'alert',
      enabled: true,
      description: '',
    });
  };

  const handleDeleteRule = (ruleId: string) => {
    setRiskRules((prev) => prev.filter((rule) => rule.id !== ruleId));
  };

  const handleResolveAlert = (alertId: string) => {
    setRiskAlerts((prev) =>
      prev.map((alert) => (alert.id === alertId ? { ...alert, resolved: true } : alert))
    );
  };

  useEffect(() => {
    fetchRiskData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress sx={{ mb: 2 }} />
        <Typography>Loading risk management data...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={fetchRiskData} variant="contained">
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Risk Management
        </Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setRuleDialogOpen(true)}
            sx={{ mr: 1 }}
          >
            Add Rule
          </Button>
          <Tooltip title="Refresh Data">
            <IconButton onClick={fetchRiskData} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Risk Score & Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Security sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Portfolio Risk Score</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant="h2"
                  sx={{
                    color:
                      getRiskScoreColor(riskMetrics?.risk_score || 0) === 'success'
                        ? 'success.main'
                        : getRiskScoreColor(riskMetrics?.risk_score || 0) === 'warning'
                          ? 'warning.main'
                          : 'error.main',
                    mb: 2,
                  }}
                >
                  {riskMetrics?.risk_score || 0}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={riskMetrics?.risk_score || 0}
                  color={getRiskScoreColor(riskMetrics?.risk_score || 0)}
                  sx={{ height: 10, borderRadius: 5, mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  {(riskMetrics?.risk_score || 0) < 40
                    ? 'Low Risk'
                    : (riskMetrics?.risk_score || 0) < 70
                      ? 'Moderate Risk'
                      : 'High Risk'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Risk Metrics Overview
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 1 }}>
                    <Typography variant="h5" sx={{ color: 'error.main', mb: 0.5 }}>
                      {formatPercent(riskMetrics?.portfolio_var || 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      VaR (95%)
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 1 }}>
                    <Typography variant="h5" sx={{ mb: 0.5 }}>
                      {riskMetrics?.beta.toFixed(2) || '0.00'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Beta
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 1 }}>
                    <Typography variant="h5" sx={{ color: 'error.main', mb: 0.5 }}>
                      {formatPercent(riskMetrics?.max_drawdown || 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Max Drawdown
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 1 }}>
                    <Typography variant="h5" sx={{ mb: 0.5 }}>
                      {riskMetrics?.sharpe_ratio.toFixed(2) || '0.00'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Sharpe Ratio
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Active Alerts */}
      {riskAlerts.filter((alert) => !alert.resolved).length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <NotificationImportant sx={{ mr: 1, color: 'error.main' }} />
              <Typography variant="h6">Active Risk Alerts</Typography>
            </Box>
            {riskAlerts
              .filter((alert) => !alert.resolved)
              .map((alert) => (
                <Alert
                  key={alert.id}
                  severity={getSeverityColor(alert.severity) as any}
                  sx={{ mb: 1 }}
                  action={
                    <Button
                      color="inherit"
                      size="small"
                      onClick={() => handleResolveAlert(alert.id)}
                    >
                      Resolve
                    </Button>
                  }
                >
                  <Typography variant="body2">{alert.message}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(alert.timestamp).toLocaleString()}
                  </Typography>
                </Alert>
              ))}
          </CardContent>
        </Card>
      )}

      {/* Risk Rules */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Risk Management Rules
          </Typography>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Rule Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Threshold</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {riskRules.map((rule) => (
                  <TableRow key={rule.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                          {rule.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {rule.description}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={rule.type.replace('_', ' ')}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography sx={{ fontWeight: 'bold' }}>
                        {rule.type.includes('loss') ||
                        rule.type.includes('concentration') ||
                        rule.type.includes('position')
                          ? formatPercent(rule.threshold)
                          : formatCurrency(rule.threshold)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={rule.action.toUpperCase()}
                        color={getActionColor(rule.action)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <FormControlLabel
                        control={
                          <Switch
                            checked={rule.enabled}
                            onChange={() => handleRuleToggle(rule.id)}
                            color="primary"
                          />
                        }
                        label=""
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit Rule">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditingRule(rule);
                            setRuleDialogOpen(true);
                          }}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Rule">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteRule(rule.id)}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Create/Edit Rule Dialog */}
      <Dialog
        open={ruleDialogOpen}
        onClose={() => setRuleDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{editingRule ? 'Edit Risk Rule' : 'Create New Risk Rule'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Rule Name"
                value={editingRule?.name || newRule.name}
                onChange={(e) =>
                  editingRule
                    ? setEditingRule({ ...editingRule, name: e.target.value })
                    : setNewRule({ ...newRule, name: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Rule Type</InputLabel>
                <Select
                  value={editingRule?.type || newRule.type}
                  onChange={(e) => {
                    const type = e.target.value as RiskRule['type'];
                    editingRule
                      ? setEditingRule({ ...editingRule, type })
                      : setNewRule({ ...newRule, type });
                  }}
                >
                  <MenuItem value="position_size">Position Size</MenuItem>
                  <MenuItem value="daily_loss">Daily Loss</MenuItem>
                  <MenuItem value="portfolio_value">Portfolio Value</MenuItem>
                  <MenuItem value="sector_concentration">Sector Concentration</MenuItem>
                  <MenuItem value="correlation">Correlation</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Threshold (%)"
                value={editingRule?.threshold || newRule.threshold}
                onChange={(e) => {
                  const threshold = parseFloat(e.target.value) || 0;
                  editingRule
                    ? setEditingRule({ ...editingRule, threshold })
                    : setNewRule({ ...newRule, threshold });
                }}
                inputProps={{ step: '0.1', min: '0' }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Action</InputLabel>
                <Select
                  value={editingRule?.action || newRule.action}
                  onChange={(e) => {
                    const action = e.target.value as RiskRule['action'];
                    editingRule
                      ? setEditingRule({ ...editingRule, action })
                      : setNewRule({ ...newRule, action });
                  }}
                >
                  <MenuItem value="alert">Alert Only</MenuItem>
                  <MenuItem value="reduce">Reduce Position</MenuItem>
                  <MenuItem value="block">Block Trading</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editingRule?.enabled ?? newRule.enabled}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      editingRule
                        ? setEditingRule({ ...editingRule, enabled })
                        : setNewRule({ ...newRule, enabled });
                    }}
                  />
                }
                label="Enable Rule"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={editingRule?.description || newRule.description}
                onChange={(e) =>
                  editingRule
                    ? setEditingRule({ ...editingRule, description: e.target.value })
                    : setNewRule({ ...newRule, description: e.target.value })
                }
                multiline
                rows={2}
                placeholder="Describe what this rule does..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setRuleDialogOpen(false);
              setEditingRule(null);
              setNewRule({
                name: '',
                type: 'position_size',
                threshold: 0,
                action: 'alert',
                enabled: true,
                description: '',
              });
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateRule}
            variant="contained"
            disabled={
              !(editingRule?.name || newRule.name) || !(editingRule?.threshold || newRule.threshold)
            }
          >
            {editingRule ? 'Update Rule' : 'Create Rule'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RiskPage;
