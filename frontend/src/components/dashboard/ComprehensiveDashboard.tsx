import React from 'react';
import { Grid, Box, Typography, Divider } from '@mui/material';
import { Dashboard, TrendingUp } from '@mui/icons-material';
import EnhancedDashboard from './EnhancedDashboard';
import RealTimePortfolioCard from './RealTimePortfolioCard';
import RealTimeMarketCard from './RealTimeMarketCard';
import TradingInterface from '../trading/TradingInterface';

const ComprehensiveDashboard: React.FC = () => {
  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Dashboard Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Dashboard sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Comprehensive Trading Platform
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Real-time portfolio management with advanced analytics and trading capabilities
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={3}>
        {/* Main Enhanced Dashboard - Full Width */}
        <Grid item xs={12}>
          <EnhancedDashboard />
        </Grid>
        
        {/* Real-Time Components and Trading Interface Row */}
        <Grid item xs={12} md={4}>
          <RealTimePortfolioCard />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <RealTimeMarketCard />
        </Grid>

        <Grid item xs={12} md={4}>
          <TradingInterface />
        </Grid>
      </Grid>

      {/* Footer Information */}
      <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <TrendingUp sx={{ mr: 1 }} />
          Samrddhi Trading Platform - Database-Integrated Real-Time Trading System
        </Typography>
      </Box>
    </Box>
  );
};

export default ComprehensiveDashboard;
