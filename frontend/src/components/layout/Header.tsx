import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Badge,
  Tooltip,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  ListItemIcon,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  AccountCircle,
  Logout,
  Dashboard,
  TrendingUp,
} from '@mui/icons-material';
import { useState } from 'react';
import { useAppSelector } from '../../hooks/redux';

interface HeaderProps {
  onMenuToggle: () => void;
  mobileOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle, mobileOpen }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);
  
  // Get portfolio and alerts from Redux store
  const portfolio = useAppSelector((state) => state.portfolio);
  const alerts = useAppSelector((state) => state.alerts);
  const account = useAppSelector((state) => state.account);
  
  const unreadAlertsCount = alerts.alerts.filter((alert) => !alert.read).length;
  
  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setNotificationAnchor(null);
  };

  const handleLogout = () => {
    // Handle logout logic
    handleClose();
  };

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

  const getPnLColor = (value: number): string => {
    if (value > 0) return '#4caf50';
    if (value < 0) return '#f44336';
    return '#ffffff';
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="toggle drawer"
          edge="start"
          onClick={onMenuToggle}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{ 
            flexGrow: 0,
            fontWeight: 700,
            background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            mr: 3
          }}
        >
          SAMRDDHI
        </Typography>

        {/* Portfolio Stats */}
        <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', mr: 2 }}>
          <Box sx={{ mx: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Portfolio Value
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              {formatCurrency(portfolio.totalValue)}
            </Typography>
          </Box>
          
          <Box sx={{ mx: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Today's P&L
            </Typography>
            <Typography 
              variant="h6" 
              fontWeight="bold"
              sx={{ color: getPnLColor(portfolio.dayPnL) }}
            >
              {formatCurrency(portfolio.dayPnL)} ({formatPercent(portfolio.dayPnLPercent)})
            </Typography>
          </Box>

          <Box sx={{ mx: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Buying Power
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              {formatCurrency(portfolio.buyingPower)}
            </Typography>
          </Box>

          {account.patternDayTrader && (
            <Box sx={{ mx: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Day Trades
              </Typography>
              <Typography 
                variant="h6" 
                fontWeight="bold"
                sx={{ 
                  color: account.dayTrades >= account.dayTradesLimit - 1 ? '#f44336' : '#ffffff' 
                }}
              >
                {account.dayTrades}/{account.dayTradesLimit}
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {/* Notification Bell */}
        <Tooltip title="Notifications">
          <IconButton
            color="inherit"
            onClick={handleNotificationClick}
            sx={{ mr: 1 }}
          >
            <Badge badgeContent={unreadAlertsCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* Settings */}
        <Tooltip title="Settings">
          <IconButton color="inherit" sx={{ mr: 1 }}>
            <SettingsIcon />
          </IconButton>
        </Tooltip>

        {/* Profile Menu */}
        <Tooltip title="Account">
          <IconButton
            onClick={handleProfileClick}
            sx={{ p: 0 }}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
              <AccountCircle />
            </Avatar>
          </IconButton>
        </Tooltip>

        {/* Profile Menu Dropdown */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          onClick={handleClose}
          PaperProps={{
            elevation: 0,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
              mt: 1.5,
              '& .MuiAvatar-root': {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
              '&:before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
              },
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={handleClose}>
            <ListItemIcon>
              <Dashboard fontSize="small" />
            </ListItemIcon>
            Dashboard
          </MenuItem>
          <MenuItem onClick={handleClose}>
            <ListItemIcon>
              <TrendingUp fontSize="small" />
            </ListItemIcon>
            Trading
          </MenuItem>
          <MenuItem onClick={handleClose}>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            Settings
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <Logout fontSize="small" />
            </ListItemIcon>
            Logout
          </MenuItem>
        </Menu>

        {/* Notifications Menu */}
        <Menu
          anchorEl={notificationAnchor}
          open={Boolean(notificationAnchor)}
          onClose={handleClose}
          PaperProps={{
            sx: {
              width: 320,
              maxHeight: 400,
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          {alerts.alerts.slice(0, 5).map((alert) => (
            <MenuItem key={alert.id} onClick={handleClose}>
              <Box sx={{ width: '100%' }}>
                <Typography variant="subtitle2" color="text.primary">
                  {alert.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {alert.message}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(alert.createdAt).toLocaleTimeString()}
                </Typography>
              </Box>
            </MenuItem>
          ))}
          {alerts.alerts.length === 0 && (
            <MenuItem>
              <Typography variant="body2" color="text.secondary">
                No new notifications
              </Typography>
            </MenuItem>
          )}
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
