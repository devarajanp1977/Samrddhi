import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Badge,
  Divider,
} from '@mui/material';
import {
  NotificationsActive,
  TrendingUp,
  TrendingDown,
  Warning,
  Info,
  CheckCircle,
  Error,
  Settings,
  Add,
  Delete,
  Edit,
  VolumeUp,
  Email,
  Sms,
  Phone,
} from '@mui/icons-material';

interface Alert {
  id: string;
  type: 'price' | 'volume' | 'news' | 'risk' | 'system';
  symbol?: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
  read: boolean;
  active: boolean;
}

interface AlertRule {
  id: string;
  name: string;
  type: 'price_above' | 'price_below' | 'volume_spike' | 'news_sentiment';
  symbol: string;
  condition: string;
  threshold: number;
  enabled: boolean;
  notification_methods: string[];
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

const AlertsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<AlertRule | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const [newRule, setNewRule] = useState({
    name: '',
    type: 'price_above' as const,
    symbol: '',
    threshold: 0,
    notification_methods: ['email'] as string[],
  });

  const [globalSettings, setGlobalSettings] = useState({
    email_notifications: true,
    sms_notifications: true,
    push_notifications: true,
    sound_alerts: true,
  });

  // Mock data
  useEffect(() => {
    const mockAlerts: Alert[] = [
      {
        id: '1',
        type: 'price',
        symbol: 'AAPL',
        title: 'AAPL Price Alert',
        message: 'AAPL has reached your target price of $180.00',
        severity: 'success',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        read: false,
        active: true,
      },
      {
        id: '2',
        type: 'risk',
        title: 'Portfolio Risk Alert',
        message: 'Your portfolio volatility has increased to 18.5%',
        severity: 'warning',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        read: false,
        active: true,
      },
      {
        id: '3',
        type: 'volume',
        symbol: 'TSLA',
        title: 'Volume Spike Alert',
        message: 'TSLA volume is 3x above average',
        severity: 'info',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        read: true,
        active: true,
      },
      {
        id: '4',
        type: 'system',
        title: 'Maintenance Notice',
        message: 'Scheduled maintenance tonight from 2-4 AM EST',
        severity: 'info',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        read: true,
        active: true,
      },
    ];

    const mockRules: AlertRule[] = [
      {
        id: '1',
        name: 'AAPL Target Price',
        type: 'price_above',
        symbol: 'AAPL',
        condition: 'above',
        threshold: 180,
        enabled: true,
        notification_methods: ['email', 'push'],
      },
      {
        id: '2',
        name: 'TSLA Stop Loss',
        type: 'price_below',
        symbol: 'TSLA',
        condition: 'below',
        threshold: 200,
        enabled: true,
        notification_methods: ['email', 'sms'],
      },
      {
        id: '3',
        name: 'MSFT Volume Alert',
        type: 'volume_spike',
        symbol: 'MSFT',
        condition: 'volume spike',
        threshold: 2,
        enabled: false,
        notification_methods: ['email'],
      },
    ];

    setAlerts(mockAlerts);
    setAlertRules(mockRules);
    setUnreadCount(mockAlerts.filter((alert) => !alert.read).length);
  }, []);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const getAlertIcon = (type: string, severity: string) => {
    switch (type) {
      case 'price':
        return severity === 'success' ? (
          <TrendingUp color="success" />
        ) : (
          <TrendingDown color="error" />
        );
      case 'volume':
        return <VolumeUp color="info" />;
      case 'risk':
        return <Warning color="warning" />;
      case 'system':
        return <Info color="info" />;
      default:
        return <NotificationsActive />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  };

  const markAsRead = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) => (alert.id === alertId ? { ...alert, read: true } : alert))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setAlerts((prev) => prev.map((alert) => ({ ...alert, read: true })));
    setUnreadCount(0);
  };

  const deleteAlert = (alertId: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
  };

  const handleCreateRule = () => {
    const rule: AlertRule = {
      id: Date.now().toString(),
      ...newRule,
      condition: `${newRule.type} ${newRule.threshold}`, // Add missing condition field
      enabled: true,
    };
    setAlertRules((prev) => [...prev, rule]);
    setNewRule({
      name: '',
      type: 'price_above',
      symbol: '',
      threshold: 0,
      notification_methods: ['email'],
    });
    setCreateDialogOpen(false);
  };

  const toggleRuleEnabled = (ruleId: string) => {
    setAlertRules((prev) =>
      prev.map((rule) => (rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule))
    );
  };

  const deleteRule = (ruleId: string) => {
    setAlertRules((prev) => prev.filter((rule) => rule.id !== ruleId));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Alerts & Notifications
          </Typography>
          {unreadCount > 0 && (
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsActive />
            </Badge>
          )}
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setCreateDialogOpen(true)}>
          Create Alert Rule
        </Button>
      </Box>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab
              icon={<NotificationsActive />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Alerts
                  {unreadCount > 0 && (
                    <Chip
                      label={unreadCount}
                      color="error"
                      size="small"
                      sx={{ height: 20, minWidth: 20 }}
                    />
                  )}
                </Box>
              }
            />
            <Tab icon={<Settings />} label="Rules" />
            <Tab icon={<Settings />} label="Settings" />
          </Tabs>
        </Box>

        {/* Alerts Tab */}
        <TabPanel value={activeTab} index={0}>
          <CardContent>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}
            >
              <Typography variant="h6">Recent Alerts</Typography>
              {unreadCount > 0 && (
                <Button onClick={markAllAsRead} variant="outlined" size="small">
                  Mark All as Read
                </Button>
              )}
            </Box>

            {alerts.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <NotificationsActive sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No alerts yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Set up alert rules to get notified about important events
                </Typography>
              </Box>
            ) : (
              <List>
                {alerts.map((alert, index) => (
                  <React.Fragment key={alert.id}>
                    <ListItem
                      sx={{
                        bgcolor: !alert.read ? 'action.hover' : 'transparent',
                        borderRadius: 1,
                        mb: 1,
                      }}
                    >
                      <ListItemIcon>{getAlertIcon(alert.type, alert.severity)}</ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography
                              variant="subtitle2"
                              sx={{ fontWeight: !alert.read ? 'bold' : 'normal' }}
                            >
                              {alert.title}
                            </Typography>
                            <Chip
                              label={alert.type.toUpperCase()}
                              size="small"
                              color={getSeverityColor(alert.severity) as any}
                            />
                            {alert.symbol && (
                              <Chip label={alert.symbol} size="small" variant="outlined" />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              {alert.message}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(alert.timestamp).toLocaleString()}
                            </Typography>
                          </Box>
                        }
                      />
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1,
                          alignItems: 'flex-end',
                        }}
                      >
                        {!alert.read && (
                          <Button
                            size="small"
                            onClick={() => markAsRead(alert.id)}
                            variant="outlined"
                          >
                            Mark Read
                          </Button>
                        )}
                        <IconButton
                          size="small"
                          onClick={() => deleteAlert(alert.id)}
                          color="error"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </ListItem>
                    {index < alerts.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </CardContent>
        </TabPanel>

        {/* Rules Tab */}
        <TabPanel value={activeTab} index={1}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Alert Rules
            </Typography>

            {alertRules.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Settings sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No alert rules configured
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Create your first alert rule to get notified about price movements, volume spikes,
                  and more
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setCreateDialogOpen(true)}
                >
                  Create First Rule
                </Button>
              </Box>
            ) : (
              <List>
                {alertRules.map((rule, index) => (
                  <React.Fragment key={rule.id}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                              {rule.name}
                            </Typography>
                            <Chip
                              label={rule.enabled ? 'Active' : 'Disabled'}
                              color={rule.enabled ? 'success' : 'default'}
                              size="small"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              {rule.symbol} - {rule.condition} ${rule.threshold}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              {rule.notification_methods.map((method) => (
                                <Chip
                                  key={method}
                                  label={method}
                                  size="small"
                                  variant="outlined"
                                  icon={
                                    method === 'email' ? (
                                      <Email />
                                    ) : method === 'sms' ? (
                                      <Sms />
                                    ) : (
                                      <Phone />
                                    )
                                  }
                                />
                              ))}
                            </Box>
                          </Box>
                        }
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={rule.enabled}
                              onChange={() => toggleRuleEnabled(rule.id)}
                              size="small"
                            />
                          }
                          label=""
                        />
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedRule(rule);
                            setEditDialogOpen(true);
                          }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => deleteRule(rule.id)} color="error">
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </ListItem>
                    {index < alertRules.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </CardContent>
        </TabPanel>

        {/* Settings Tab */}
        <TabPanel value={activeTab} index={2}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Notification Settings
            </Typography>

            <List>
              <ListItem>
                <ListItemIcon>
                  <Email />
                </ListItemIcon>
                <ListItemText primary="Email Notifications" secondary="Receive alerts via email" />
                <FormControlLabel
                  control={
                    <Switch
                      checked={globalSettings.email_notifications}
                      onChange={(e) =>
                        setGlobalSettings((prev) => ({
                          ...prev,
                          email_notifications: e.target.checked,
                        }))
                      }
                    />
                  }
                  label=""
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemIcon>
                  <Sms />
                </ListItemIcon>
                <ListItemText
                  primary="SMS Notifications"
                  secondary="Receive alerts via text message"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={globalSettings.sms_notifications}
                      onChange={(e) =>
                        setGlobalSettings((prev) => ({
                          ...prev,
                          sms_notifications: e.target.checked,
                        }))
                      }
                    />
                  }
                  label=""
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemIcon>
                  <NotificationsActive />
                </ListItemIcon>
                <ListItemText primary="Push Notifications" secondary="Browser push notifications" />
                <FormControlLabel
                  control={
                    <Switch
                      checked={globalSettings.push_notifications}
                      onChange={(e) =>
                        setGlobalSettings((prev) => ({
                          ...prev,
                          push_notifications: e.target.checked,
                        }))
                      }
                    />
                  }
                  label=""
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemIcon>
                  <VolumeUp />
                </ListItemIcon>
                <ListItemText primary="Sound Alerts" secondary="Play sound for important alerts" />
                <FormControlLabel
                  control={
                    <Switch
                      checked={globalSettings.sound_alerts}
                      onChange={(e) =>
                        setGlobalSettings((prev) => ({
                          ...prev,
                          sound_alerts: e.target.checked,
                        }))
                      }
                    />
                  }
                  label=""
                />
              </ListItem>
            </List>
          </CardContent>
        </TabPanel>
      </Card>

      {/* Create Rule Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create Alert Rule</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Rule Name"
              value={newRule.name}
              onChange={(e) => setNewRule((prev) => ({ ...prev, name: e.target.value }))}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Alert Type</InputLabel>
              <Select
                value={newRule.type}
                onChange={(e) => setNewRule((prev) => ({ ...prev, type: e.target.value as any }))}
              >
                <MenuItem value="price_above">Price Above</MenuItem>
                <MenuItem value="price_below">Price Below</MenuItem>
                <MenuItem value="volume_spike">Volume Spike</MenuItem>
                <MenuItem value="news_sentiment">News Sentiment</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Symbol"
              value={newRule.symbol}
              onChange={(e) =>
                setNewRule((prev) => ({ ...prev, symbol: e.target.value.toUpperCase() }))
              }
              placeholder="AAPL, TSLA, etc."
              fullWidth
            />
            <TextField
              label="Threshold"
              type="number"
              value={newRule.threshold}
              onChange={(e) =>
                setNewRule((prev) => ({ ...prev, threshold: parseFloat(e.target.value) }))
              }
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateRule}
            variant="contained"
            disabled={!newRule.name || !newRule.symbol || newRule.threshold <= 0}
          >
            Create Rule
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AlertsPage;
