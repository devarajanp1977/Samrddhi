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
} from '@mui/material';
import {
  Security,
  Warning,
  CheckCircle,
  TrendingDown,
  Assessment,
  Refresh,
  Shield,
  Speed,
} from '@mui/icons-material';

interface RiskMetrics {
  beta: number;
  alpha: number;
  var_95: number;
  correlation_spy: number;
  information_ratio: number;
  tracking_error: number;
  downside_deviation: number;
  calmar_ratio: number;
}

const RiskAnalysisPage: React.FC = () => {
  const [riskData, setRiskData] = useState<RiskMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatPercent = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatDecimal = (value: number, decimals: number = 2): string => {
    return value.toFixed(decimals);
  };

  const getRiskLevel = (
    value: number,
    thresholds: { low: number; high: number }
  ): 'low' | 'medium' | 'high' => {
    if (Math.abs(value) <= thresholds.low) return 'low';
    if (Math.abs(value) <= thresholds.high) return 'medium';
    return 'high';
  };

  const getRiskColor = (level: 'low' | 'medium' | 'high'): 'success' | 'warning' | 'error' => {
    switch (level) {
      case 'low':
        return 'success';
      case 'medium':
        return 'warning';
      case 'high':
        return 'error';
    }
  };

  const fetchRiskData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data for now - replace with actual API call
      const mockData: RiskMetrics = {
        beta: 1.15,
        alpha: 0.05,
        var_95: -2.3,
        correlation_spy: 0.78,
        information_ratio: 0.35,
        tracking_error: 12.5,
        downside_deviation: 8.7,
        calmar_ratio: 0.92,
      };

      // Simulate API delay
      setTimeout(() => {
        setRiskData(mockData);
        setLoading(false);
      }, 1000);
    } catch (err) {
      console.error('Error fetching risk data:', err);
      setError('Failed to load risk analysis data. Please try again.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiskData();
  }, []);

  const handleRefresh = () => {
    fetchRiskData();
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <Security />
          Risk Analysis
        </Typography>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading risk analysis data...</Typography>
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
          <Security />
          Risk Analysis
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

  const betaRisk = getRiskLevel(riskData?.beta || 0 - 1, { low: 0.2, high: 0.5 });
  const varRisk = getRiskLevel(riskData?.var_95 || 0, { low: 2, high: 5 });

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Security />
          Risk Analysis
        </Typography>
        <Tooltip title="Refresh Data">
          <IconButton onClick={handleRefresh}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Risk Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Shield sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Beta
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ mb: 1 }}>
                {formatDecimal(riskData?.beta || 0)}
              </Typography>
              <Chip
                label={
                  betaRisk === 'low'
                    ? 'Low Risk'
                    : betaRisk === 'medium'
                      ? 'Medium Risk'
                      : 'High Risk'
                }
                color={getRiskColor(betaRisk)}
                size="small"
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Assessment sx={{ color: 'secondary.main', mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Alpha
                </Typography>
              </Box>
              <Typography
                variant="h4"
                sx={{ mb: 1, color: (riskData?.alpha || 0) >= 0 ? 'success.main' : 'error.main' }}
              >
                {formatPercent((riskData?.alpha || 0) * 100)}
              </Typography>
              <Chip
                label={(riskData?.alpha || 0) >= 0 ? 'Outperforming' : 'Underperforming'}
                color={(riskData?.alpha || 0) >= 0 ? 'success' : 'error'}
                size="small"
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingDown sx={{ color: 'error.main', mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  VaR (95%)
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ mb: 1, color: 'error.main' }}>
                {formatPercent(riskData?.var_95 || 0)}
              </Typography>
              <Chip
                label={
                  varRisk === 'low' ? 'Acceptable' : varRisk === 'medium' ? 'Moderate' : 'High Risk'
                }
                color={getRiskColor(varRisk)}
                size="small"
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Speed sx={{ color: 'info.main', mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Correlation (SPY)
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ mb: 1 }}>
                {formatDecimal(riskData?.correlation_spy || 0)}
              </Typography>
              <Chip
                label={(riskData?.correlation_spy || 0) > 0.8 ? 'High Correlation' : 'Diversified'}
                color={(riskData?.correlation_spy || 0) > 0.8 ? 'warning' : 'success'}
                size="small"
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detailed Risk Metrics */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <Assessment />
                Risk Metrics Details
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
                        <strong>Description</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Status</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Information Ratio</TableCell>
                      <TableCell>{formatDecimal(riskData?.information_ratio || 0)}</TableCell>
                      <TableCell>Risk-adjusted excess return</TableCell>
                      <TableCell>
                        <Chip
                          label={(riskData?.information_ratio || 0) > 0.5 ? 'Good' : 'Poor'}
                          color={(riskData?.information_ratio || 0) > 0.5 ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Tracking Error</TableCell>
                      <TableCell>{formatPercent(riskData?.tracking_error || 0)}</TableCell>
                      <TableCell>Deviation from benchmark</TableCell>
                      <TableCell>
                        <Chip
                          label={(riskData?.tracking_error || 0) < 15 ? 'Low' : 'High'}
                          color={(riskData?.tracking_error || 0) < 15 ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Downside Deviation</TableCell>
                      <TableCell>{formatPercent(riskData?.downside_deviation || 0)}</TableCell>
                      <TableCell>Volatility of negative returns</TableCell>
                      <TableCell>
                        <Chip
                          label={(riskData?.downside_deviation || 0) < 10 ? 'Controlled' : 'High'}
                          color={(riskData?.downside_deviation || 0) < 10 ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Calmar Ratio</TableCell>
                      <TableCell>{formatDecimal(riskData?.calmar_ratio || 0)}</TableCell>
                      <TableCell>Return to drawdown ratio</TableCell>
                      <TableCell>
                        <Chip
                          label={(riskData?.calmar_ratio || 0) > 1 ? 'Excellent' : 'Moderate'}
                          color={(riskData?.calmar_ratio || 0) > 1 ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <Warning />
                Risk Alerts
              </Typography>
              <List>
                <ListItem>
                  <CheckCircle sx={{ color: 'success.main', mr: 1 }} />
                  <ListItemText
                    primary="Portfolio Beta Stable"
                    secondary="Beta within acceptable range"
                  />
                </ListItem>
                <ListItem>
                  <Warning sx={{ color: 'warning.main', mr: 1 }} />
                  <ListItemText
                    primary="High Market Correlation"
                    secondary="Consider diversification"
                  />
                </ListItem>
                <ListItem>
                  <CheckCircle sx={{ color: 'success.main', mr: 1 }} />
                  <ListItemText primary="VaR Under Control" secondary="Risk exposure manageable" />
                </ListItem>
                <ListItem>
                  <Warning sx={{ color: 'warning.main', mr: 1 }} />
                  <ListItemText
                    primary="Monitor Tracking Error"
                    secondary="Slight deviation from benchmark"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RiskAnalysisPage;
