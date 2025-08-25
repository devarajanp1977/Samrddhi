import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Switch,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Divider,
  Alert,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  Radio,
} from '@mui/material';
import {
  Settings,
  Notifications,
  Security,
  Palette,
  Api,
  Save,
  Refresh,
  Key,
  AccountCircle,
  Email,
  Phone,
  Lock,
  Visibility,
  VisibilityOff,
  LightMode,
  DarkMode,
} from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';

interface TradingSettings {
  auto_execute_orders: boolean;
  default_order_type: 'market' | 'limit';
  default_quantity: number;
  enable_stop_loss: boolean;
  default_stop_loss: number;
  enable_take_profit: boolean;
  default_take_profit: number;
  max_daily_trades: number;
  enable_pre_market: boolean;
  enable_after_hours: boolean;
}

interface NotificationSettings {
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  order_confirmations: boolean;
  price_alerts: boolean;
  risk_alerts: boolean;
  portfolio_summary: boolean;
  market_news: boolean;
}

interface UserProfile {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  timezone: string;
  currency: string;
  experience_level: 'beginner' | 'intermediate' | 'advanced';
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

const SettingsPage: React.FC = () => {
  const { mode, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [tradingSettings, setTradingSettings] = useState<TradingSettings>({
    auto_execute_orders: false,
    default_order_type: 'market',
    default_quantity: 100,
    enable_stop_loss: true,
    default_stop_loss: 5,
    enable_take_profit: true,
    default_take_profit: 10,
    max_daily_trades: 50,
    enable_pre_market: false,
    enable_after_hours: false,
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email_notifications: true,
    sms_notifications: false,
    push_notifications: true,
    order_confirmations: true,
    price_alerts: true,
    risk_alerts: true,
    portfolio_summary: true,
    market_news: false,
  });

  const [userProfile, setUserProfile] = useState<UserProfile>({
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    timezone: 'America/New_York',
    currency: 'USD',
    experience_level: 'intermediate',
  });

  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleTradingSettingChange = (key: keyof TradingSettings, value: any) => {
    setTradingSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleNotificationSettingChange = (key: keyof NotificationSettings, value: boolean) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleProfileChange = (key: keyof UserProfile, value: string) => {
    setUserProfile((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveSettings = async () => {
    try {
      // In a real implementation, save to API
      console.log('Saving settings:', {
        trading: tradingSettings,
        notifications: notificationSettings,
        profile: userProfile,
        theme: mode,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      alert('New passwords do not match');
      return;
    }

    if (passwordForm.new_password.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }

    try {
      // In a real implementation, call API to change password
      console.log('Changing password');
      setChangePasswordOpen(false);
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
      alert('Password changed successfully');
    } catch (error) {
      console.error('Failed to change password:', error);
    }
  };

  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Asia/Shanghai',
  ];

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Settings
        </Typography>
        <Box>
          {saveSuccess && (
            <Alert severity="success" sx={{ mr: 2, display: 'inline-flex' }}>
              Settings saved successfully!
            </Alert>
          )}
          <Button variant="contained" startIcon={<Save />} onClick={handleSaveSettings}>
            Save Settings
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab icon={<AccountCircle />} label="Profile" />
          <Tab icon={<Settings />} label="Trading" />
          <Tab icon={<Notifications />} label="Notifications" />
          <Tab icon={<Security />} label="Security" />
          <Tab icon={<Palette />} label="Appearance" />
        </Tabs>
      </Box>

      {/* Profile Tab */}
      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Personal Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="First Name"
                      value={userProfile.first_name}
                      onChange={(e) => handleProfileChange('first_name', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      value={userProfile.last_name}
                      onChange={(e) => handleProfileChange('last_name', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      type="email"
                      value={userProfile.email}
                      onChange={(e) => handleProfileChange('email', e.target.value)}
                      InputProps={{
                        startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      value={userProfile.phone}
                      onChange={(e) => handleProfileChange('phone', e.target.value)}
                      InputProps={{
                        startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Preferences
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Timezone</InputLabel>
                      <Select
                        value={userProfile.timezone}
                        onChange={(e) => handleProfileChange('timezone', e.target.value)}
                      >
                        {timezones.map((tz) => (
                          <MenuItem key={tz} value={tz}>
                            {tz.replace('_', ' ')}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Currency</InputLabel>
                      <Select
                        value={userProfile.currency}
                        onChange={(e) => handleProfileChange('currency', e.target.value)}
                      >
                        <MenuItem value="USD">USD - US Dollar</MenuItem>
                        <MenuItem value="EUR">EUR - Euro</MenuItem>
                        <MenuItem value="GBP">GBP - British Pound</MenuItem>
                        <MenuItem value="JPY">JPY - Japanese Yen</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Experience Level</InputLabel>
                      <Select
                        value={userProfile.experience_level}
                        onChange={(e) => handleProfileChange('experience_level', e.target.value)}
                      >
                        <MenuItem value="beginner">Beginner</MenuItem>
                        <MenuItem value="intermediate">Intermediate</MenuItem>
                        <MenuItem value="advanced">Advanced</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Trading Tab */}
      <TabPanel value={activeTab} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Order Defaults
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Default Order Type</InputLabel>
                    <Select
                      value={tradingSettings.default_order_type}
                      onChange={(e) =>
                        handleTradingSettingChange('default_order_type', e.target.value)
                      }
                    >
                      <MenuItem value="market">Market Order</MenuItem>
                      <MenuItem value="limit">Limit Order</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    type="number"
                    label="Default Quantity"
                    value={tradingSettings.default_quantity}
                    onChange={(e) =>
                      handleTradingSettingChange('default_quantity', parseInt(e.target.value) || 0)
                    }
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    type="number"
                    label="Max Daily Trades"
                    value={tradingSettings.max_daily_trades}
                    onChange={(e) =>
                      handleTradingSettingChange('max_daily_trades', parseInt(e.target.value) || 0)
                    }
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Risk Management
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={tradingSettings.enable_stop_loss}
                      onChange={(e) =>
                        handleTradingSettingChange('enable_stop_loss', e.target.checked)
                      }
                    />
                  }
                  label="Enable Stop Loss by Default"
                />
                {tradingSettings.enable_stop_loss && (
                  <TextField
                    fullWidth
                    type="number"
                    label="Default Stop Loss (%)"
                    value={tradingSettings.default_stop_loss}
                    onChange={(e) =>
                      handleTradingSettingChange(
                        'default_stop_loss',
                        parseFloat(e.target.value) || 0
                      )
                    }
                    sx={{ mb: 2, mt: 1 }}
                    inputProps={{ step: '0.1' }}
                  />
                )}

                <FormControlLabel
                  control={
                    <Switch
                      checked={tradingSettings.enable_take_profit}
                      onChange={(e) =>
                        handleTradingSettingChange('enable_take_profit', e.target.checked)
                      }
                    />
                  }
                  label="Enable Take Profit by Default"
                />
                {tradingSettings.enable_take_profit && (
                  <TextField
                    fullWidth
                    type="number"
                    label="Default Take Profit (%)"
                    value={tradingSettings.default_take_profit}
                    onChange={(e) =>
                      handleTradingSettingChange(
                        'default_take_profit',
                        parseFloat(e.target.value) || 0
                      )
                    }
                    sx={{ mt: 1 }}
                    inputProps={{ step: '0.1' }}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Trading Hours
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={tradingSettings.auto_execute_orders}
                          onChange={(e) =>
                            handleTradingSettingChange('auto_execute_orders', e.target.checked)
                          }
                        />
                      }
                      label="Auto-Execute Orders"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={tradingSettings.enable_pre_market}
                          onChange={(e) =>
                            handleTradingSettingChange('enable_pre_market', e.target.checked)
                          }
                        />
                      }
                      label="Enable Pre-Market Trading"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={tradingSettings.enable_after_hours}
                          onChange={(e) =>
                            handleTradingSettingChange('enable_after_hours', e.target.checked)
                          }
                        />
                      }
                      label="Enable After-Hours Trading"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Notifications Tab */}
      <TabPanel value={activeTab} index={2}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Notification Preferences
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <Email />
                </ListItemIcon>
                <ListItemText
                  primary="Email Notifications"
                  secondary="Receive notifications via email"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={notificationSettings.email_notifications}
                    onChange={(e) =>
                      handleNotificationSettingChange('email_notifications', e.target.checked)
                    }
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />

              <ListItem>
                <ListItemIcon>
                  <Phone />
                </ListItemIcon>
                <ListItemText
                  primary="SMS Notifications"
                  secondary="Receive notifications via text message"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={notificationSettings.sms_notifications}
                    onChange={(e) =>
                      handleNotificationSettingChange('sms_notifications', e.target.checked)
                    }
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />

              <ListItem>
                <ListItemIcon>
                  <Notifications />
                </ListItemIcon>
                <ListItemText primary="Push Notifications" secondary="Browser push notifications" />
                <ListItemSecondaryAction>
                  <Switch
                    checked={notificationSettings.push_notifications}
                    onChange={(e) =>
                      handleNotificationSettingChange('push_notifications', e.target.checked)
                    }
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />

              <Typography variant="subtitle1" sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>
                Notification Types
              </Typography>

              <ListItem>
                <ListItemText
                  primary="Order Confirmations"
                  secondary="Notifications when orders are filled or cancelled"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={notificationSettings.order_confirmations}
                    onChange={(e) =>
                      handleNotificationSettingChange('order_confirmations', e.target.checked)
                    }
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />

              <ListItem>
                <ListItemText
                  primary="Price Alerts"
                  secondary="Notifications when stocks reach target prices"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={notificationSettings.price_alerts}
                    onChange={(e) =>
                      handleNotificationSettingChange('price_alerts', e.target.checked)
                    }
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />

              <ListItem>
                <ListItemText
                  primary="Risk Alerts"
                  secondary="Notifications for risk management triggers"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={notificationSettings.risk_alerts}
                    onChange={(e) =>
                      handleNotificationSettingChange('risk_alerts', e.target.checked)
                    }
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />

              <ListItem>
                <ListItemText
                  primary="Portfolio Summary"
                  secondary="Daily portfolio performance summaries"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={notificationSettings.portfolio_summary}
                    onChange={(e) =>
                      handleNotificationSettingChange('portfolio_summary', e.target.checked)
                    }
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />

              <ListItem>
                <ListItemText primary="Market News" secondary="Important market news and updates" />
                <ListItemSecondaryAction>
                  <Switch
                    checked={notificationSettings.market_news}
                    onChange={(e) =>
                      handleNotificationSettingChange('market_news', e.target.checked)
                    }
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Security Tab */}
      <TabPanel value={activeTab} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Password & Authentication
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<Key />}
                  onClick={() => setChangePasswordOpen(true)}
                  sx={{ mb: 2 }}
                >
                  Change Password
                </Button>
                <Typography variant="body2" color="text.secondary">
                  Last password change: January 15, 2024
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Two-Factor Authentication
                </Typography>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Two-factor authentication is not enabled. Enable it for better security.
                </Alert>
                <Button variant="contained" color="primary">
                  Enable 2FA
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  API Keys
                </Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                  API keys allow third-party applications to access your account. Keep them secure.
                </Alert>
                <Button variant="outlined" startIcon={<Api />}>
                  Manage API Keys
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Appearance Tab */}
      <TabPanel value={activeTab} index={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Theme & Display
            </Typography>

            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Theme Selection
            </Typography>
            <FormControl component="fieldset">
              <RadioGroup
                value={mode}
                onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
              >
                <FormControlLabel
                  value="light"
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LightMode />
                      <Box>
                        <Typography variant="body2">Light Theme</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Clean, bright interface for daytime use
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="dark"
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DarkMode />
                      <Box>
                        <Typography variant="body2">Dark Theme</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Eye-friendly dark interface, ideal for trading
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Display Preferences
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Currency Display</InputLabel>
                  <Select value="USD" disabled>
                    <MenuItem value="USD">USD ($)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Number Format</InputLabel>
                  <Select value="US" disabled>
                    <MenuItem value="US">US (1,234.56)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Change Password Dialog */}
      <Dialog
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type={showPasswords.current ? 'text' : 'password'}
                label="Current Password"
                value={passwordForm.current_password}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, current_password: e.target.value })
                }
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() =>
                        setShowPasswords({ ...showPasswords, current: !showPasswords.current })
                      }
                      edge="end"
                    >
                      {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type={showPasswords.new ? 'text' : 'password'}
                label="New Password"
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() =>
                        setShowPasswords({ ...showPasswords, new: !showPasswords.new })
                      }
                      edge="end"
                    >
                      {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type={showPasswords.confirm ? 'text' : 'password'}
                label="Confirm New Password"
                value={passwordForm.confirm_password}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, confirm_password: e.target.value })
                }
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() =>
                        setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })
                      }
                      edge="end"
                    >
                      {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangePasswordOpen(false)}>Cancel</Button>
          <Button
            onClick={handleChangePassword}
            variant="contained"
            disabled={
              !passwordForm.current_password ||
              !passwordForm.new_password ||
              !passwordForm.confirm_password
            }
          >
            Change Password
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SettingsPage;
