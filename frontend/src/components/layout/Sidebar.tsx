import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  Box,
  Typography,
  Collapse,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  TrendingUp as TradingIcon,
  AccountBalance as PortfolioIcon,
  Assessment as AnalyticsIcon,
  Settings as SettingsIcon,
  Notifications as AlertsIcon,
  History as HistoryIcon,
  Security as RiskIcon,
  AutoMode as StrategyIcon,
  ExpandLess,
  ExpandMore,
  ShowChart,
  AccountBalanceWallet,
  Receipt,
  TrendingUp,
  Speed,
  Shield,
  Assessment,
} from '@mui/icons-material';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface SidebarProps {
  mobileOpen: boolean;
  onDrawerToggle: () => void;
  drawerWidth: number;
}

interface MenuItem {
  text: string;
  icon: React.ReactNode;
  path?: string;
  children?: MenuItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onDrawerToggle, drawerWidth }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [openItems, setOpenItems] = useState<string[]>(['trading', 'analytics']);

  const handleItemClick = (item: MenuItem) => {
    if (item.children) {
      const isOpen = openItems.includes(item.text);
      if (isOpen) {
        setOpenItems(openItems.filter((openItem) => openItem !== item.text));
      } else {
        setOpenItems([...openItems, item.text]);
      }
    } else if (item.path) {
      navigate(item.path);
    }
  };

  const isItemSelected = (path?: string): boolean => {
    return path ? location.pathname === path : false;
  };

  const menuItems: MenuItem[] = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/',
    },
    {
      text: 'Trading',
      icon: <TradingIcon />,
      children: [
        {
          text: 'Live Trading',
          icon: <ShowChart />,
          path: '/trading/live',
        },
        {
          text: 'Orders',
          icon: <Receipt />,
          path: '/trading/orders',
        },
        {
          text: 'Positions',
          icon: <TrendingUp />,
          path: '/trading/positions',
        },
        {
          text: 'Candidates',
          icon: <Speed />,
          path: '/trading/watchlist',
        },
        {
          text: 'Alpaca Test',
          icon: <Assessment />,
          path: '/alpaca-test',
        },
      ],
    },
    {
      text: 'Portfolio',
      icon: <PortfolioIcon />,
      path: '/portfolio',
    },
    {
      text: 'Analytics',
      icon: <AnalyticsIcon />,
      children: [
        {
          text: 'Performance',
          icon: <Assessment />,
          path: '/analytics/performance',
        },
        {
          text: 'Risk Analysis',
          icon: <RiskIcon />,
          path: '/analytics/risk',
        },
        {
          text: 'Market Analysis',
          icon: <Speed />,
          path: '/analytics/market',
        },
      ],
    },
    {
      text: 'Strategies',
      icon: <StrategyIcon />,
      path: '/strategies',
    },
    {
      text: 'History',
      icon: <HistoryIcon />,
      path: '/history',
    },
    {
      text: 'Risk Management',
      icon: <Shield />,
      path: '/risk',
    },
    {
      text: 'Account',
      icon: <AccountBalanceWallet />,
      path: '/account',
    },
    {
      text: 'Alerts',
      icon: <AlertsIcon />,
      path: '/alerts',
    },
    {
      text: 'Settings',
      icon: <SettingsIcon />,
      path: '/settings',
    },
  ];

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isOpen = openItems.includes(item.text);
    const isSelected = isItemSelected(item.path);

    return (
      <React.Fragment key={item.text}>
        <ListItem disablePadding sx={{ display: 'block' }}>
          <ListItemButton
            onClick={() => handleItemClick(item)}
            sx={{
              minHeight: 48,
              justifyContent: 'initial',
              px: 2.5,
              pl: level > 0 ? 4 : 2.5,
              backgroundColor: isSelected ? 'rgba(102, 126, 234, 0.12)' : 'transparent',
              borderRight: isSelected ? '3px solid #667eea' : '3px solid transparent',
              '&:hover': {
                backgroundColor: 'rgba(102, 126, 234, 0.08)',
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: 3,
                justifyContent: 'center',
                color: isSelected ? '#667eea' : 'inherit',
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.text}
              sx={{
                opacity: 1,
                '& .MuiListItemText-primary': {
                  fontSize: level > 0 ? '0.875rem' : '1rem',
                  fontWeight: isSelected ? 600 : 400,
                  color: isSelected ? '#667eea' : 'inherit',
                },
              }}
            />
            {hasChildren && (
              <Box sx={{ color: 'text.secondary' }}>{isOpen ? <ExpandLess /> : <ExpandMore />}</Box>
            )}
          </ListItemButton>
        </ListItem>
        {hasChildren && (
          <Collapse in={isOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children!.map((child) => renderMenuItem(child, level + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
            }}
          >
            SAMRDDHI
          </Typography>
        </Box>
      </Toolbar>
      <Divider />

      {/* Trading Status Indicator */}
      <Box
        sx={{
          p: 2,
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          border: '1px solid rgba(76, 175, 80, 0.3)',
        }}
      >
        <Typography variant="caption" color="success.main" fontWeight="bold">
          ● LIVE TRADING ACTIVE
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          All systems operational
        </Typography>
      </Box>

      <List sx={{ flexGrow: 1, py: 1 }}>{menuItems.map((item) => renderMenuItem(item))}</List>

      <Divider />

      {/* Footer Info */}
      <Box sx={{ p: 2, backgroundColor: 'rgba(0,0,0,0.2)' }}>
        <Typography variant="caption" color="text.secondary" display="block">
          Version 1.0.0
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          Market: {new Date().toLocaleDateString()}
        </Typography>
        <Typography variant="caption" color="success.main" display="block">
          Connection: Stable
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
