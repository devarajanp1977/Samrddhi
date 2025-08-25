import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  Avatar,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  Person,
  AccountBalance,
  CreditCard,
  Receipt,
  Security,
  Settings,
  Edit,
  Save,
  Cancel,
} from '@mui/icons-material';

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

const AccountPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [profileData, setProfileData] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    dateOfBirth: '1985-05-15',
    address: '123 Trading St, Finance City, FC 12345',
    accountType: 'Premium',
    accountId: 'AC-2024-001',
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: true,
    smsAlerts: true,
    emailAlerts: true,
    loginNotifications: true,
  });

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setError(null);

    // Simulate API call
    setTimeout(() => {
      setSuccess('Profile updated successfully!');
      setEditing(false);
      setLoading(false);
    }, 1000);
  };

  const handleSecurityToggle = (setting: keyof typeof securitySettings) => {
    setSecuritySettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Account Management
        </Typography>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Profile Overview Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: 'fit-content', position: 'sticky', top: 20 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  mx: 'auto',
                  mb: 2,
                  fontSize: '3rem',
                  bgcolor: 'primary.main',
                }}
              >
                {profileData.firstName[0]}
                {profileData.lastName[0]}
              </Avatar>
              <Typography variant="h5" gutterBottom>
                {profileData.firstName} {profileData.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {profileData.email}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Account ID: {profileData.accountId}
              </Typography>
              <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>
                {profileData.accountType} Account
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Main Content */}
        <Grid item xs={12} md={8}>
          <Card>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={activeTab} onChange={handleTabChange}>
                <Tab icon={<Person />} label="Profile" />
                <Tab icon={<AccountBalance />} label="Banking" />
                <Tab icon={<Security />} label="Security" />
                <Tab icon={<Receipt />} label="Billing" />
              </Tabs>
            </Box>

            {/* Profile Tab */}
            <TabPanel value={activeTab} index={0}>
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3,
                  }}
                >
                  <Typography variant="h6">Personal Information</Typography>
                  {!editing ? (
                    <Button
                      startIcon={<Edit />}
                      onClick={() => setEditing(true)}
                      variant="outlined"
                    >
                      Edit Profile
                    </Button>
                  ) : (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        startIcon={<Save />}
                        onClick={handleSaveProfile}
                        variant="contained"
                        disabled={loading}
                      >
                        Save
                      </Button>
                      <Button
                        startIcon={<Cancel />}
                        onClick={() => setEditing(false)}
                        variant="outlined"
                      >
                        Cancel
                      </Button>
                    </Box>
                  )}
                </Box>

                {loading && <LinearProgress sx={{ mb: 2 }} />}

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="First Name"
                      value={profileData.firstName}
                      onChange={(e) =>
                        setProfileData((prev) => ({ ...prev, firstName: e.target.value }))
                      }
                      disabled={!editing}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      value={profileData.lastName}
                      onChange={(e) =>
                        setProfileData((prev) => ({ ...prev, lastName: e.target.value }))
                      }
                      disabled={!editing}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      value={profileData.email}
                      onChange={(e) =>
                        setProfileData((prev) => ({ ...prev, email: e.target.value }))
                      }
                      disabled={!editing}
                      type="email"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      value={profileData.phone}
                      onChange={(e) =>
                        setProfileData((prev) => ({ ...prev, phone: e.target.value }))
                      }
                      disabled={!editing}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Date of Birth"
                      value={profileData.dateOfBirth}
                      onChange={(e) =>
                        setProfileData((prev) => ({ ...prev, dateOfBirth: e.target.value }))
                      }
                      disabled={!editing}
                      type="date"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Address"
                      value={profileData.address}
                      onChange={(e) =>
                        setProfileData((prev) => ({ ...prev, address: e.target.value }))
                      }
                      disabled={!editing}
                      multiline
                      rows={2}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </TabPanel>

            {/* Banking Tab */}
            <TabPanel value={activeTab} index={1}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Connected Bank Accounts
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <CreditCard />
                    </ListItemIcon>
                    <ListItemText
                      primary="Chase Checking (***1234)"
                      secondary="Primary funding source"
                    />
                    <Button variant="outlined" size="small">
                      Manage
                    </Button>
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemIcon>
                      <AccountBalance />
                    </ListItemIcon>
                    <ListItemText
                      primary="Wells Fargo Savings (***5678)"
                      secondary="Backup funding source"
                    />
                    <Button variant="outlined" size="small">
                      Manage
                    </Button>
                  </ListItem>
                </List>
                <Button variant="contained" startIcon={<AccountBalance />} sx={{ mt: 2 }}>
                  Add Bank Account
                </Button>
              </CardContent>
            </TabPanel>

            {/* Security Tab */}
            <TabPanel value={activeTab} index={2}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Security Settings
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Two-Factor Authentication"
                      secondary="Add an extra layer of security to your account"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={securitySettings.twoFactorAuth}
                          onChange={() => handleSecurityToggle('twoFactorAuth')}
                        />
                      }
                      label=""
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="SMS Alerts"
                      secondary="Receive trade confirmations via SMS"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={securitySettings.smsAlerts}
                          onChange={() => handleSecurityToggle('smsAlerts')}
                        />
                      }
                      label=""
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="Email Alerts"
                      secondary="Receive account notifications via email"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={securitySettings.emailAlerts}
                          onChange={() => handleSecurityToggle('emailAlerts')}
                        />
                      }
                      label=""
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="Login Notifications"
                      secondary="Get notified of new device logins"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={securitySettings.loginNotifications}
                          onChange={() => handleSecurityToggle('loginNotifications')}
                        />
                      }
                      label=""
                    />
                  </ListItem>
                </List>
                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                  <Button variant="outlined">Change Password</Button>
                  <Button variant="outlined">View Login History</Button>
                </Box>
              </CardContent>
            </TabPanel>

            {/* Billing Tab */}
            <TabPanel value={activeTab} index={3}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Billing Information
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ p: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Current Plan
                      </Typography>
                      <Typography variant="h6" color="primary">
                        Premium Trading Plan
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        $29.99/month • Next billing: Feb 15, 2025
                      </Typography>
                      <Button variant="outlined" size="small">
                        Change Plan
                      </Button>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ p: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Payment Method
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        Visa ending in 1234
                      </Typography>
                      <Button variant="outlined" size="small">
                        Update Payment
                      </Button>
                    </Card>
                  </Grid>
                </Grid>
                <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
                  Billing History
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Premium Plan - January 2025"
                      secondary="Paid on Jan 15, 2025"
                    />
                    <Typography variant="body2">$29.99</Typography>
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="Premium Plan - December 2024"
                      secondary="Paid on Dec 15, 2024"
                    />
                    <Typography variant="body2">$29.99</Typography>
                  </ListItem>
                </List>
              </CardContent>
            </TabPanel>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AccountPage;
