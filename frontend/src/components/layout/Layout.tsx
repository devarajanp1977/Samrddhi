import React from 'react';
import { Box, Toolbar } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { useState } from 'react';

const drawerWidth = 280;

const Layout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [autoTradingEnabled, setAutoTradingEnabled] = useState(true); // Default ON per requirements

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleAutoTradingToggle = () => {
    setAutoTradingEnabled((prev) => !prev);
    // TODO: Add API call to backend to update auto-trading status
    console.log(`Auto-trading ${!autoTradingEnabled ? 'enabled' : 'disabled'}`);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Header
        onMenuToggle={handleDrawerToggle}
        mobileOpen={mobileOpen}
        autoTradingEnabled={autoTradingEnabled}
        onAutoTradingToggle={handleAutoTradingToggle}
      />

      <Sidebar
        mobileOpen={mobileOpen}
        onDrawerToggle={handleDrawerToggle}
        drawerWidth={drawerWidth}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          backgroundColor: 'background.default',
          minHeight: '100vh',
        }}
      >
        <Toolbar /> {/* This provides spacing for the fixed header */}
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          <Outlet context={{ autoTradingEnabled, onAutoTradingToggle: handleAutoTradingToggle }} />
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
