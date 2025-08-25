import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LiveTradingPage from './LiveTradingPage';
import OrdersPage from './OrdersPage';
import PositionsPage from './PositionsPage';
import WatchlistPage from './WatchlistPage';

const TradingPage: React.FC = () => {
  return (
    <Routes>
      <Route index element={<Navigate to="/trading/live" replace />} />
      <Route path="live" element={<LiveTradingPage />} />
      <Route path="positions" element={<PositionsPage />} />
      <Route path="orders" element={<OrdersPage />} />
      <Route path="watchlist" element={<WatchlistPage />} />
    </Routes>
  );
};

export default TradingPage;
