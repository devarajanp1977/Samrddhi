import React from 'react';
import { Routes, Route, Navigate, useOutletContext } from 'react-router-dom';
import LiveTradingPage from './LiveTradingPage';
import OrdersPage from './OrdersPage';
import PositionsPage from './PositionsPage';
import CandidatesWatchlist from './CandidatesWatchlist';

interface LayoutContext {
  autoTradingEnabled: boolean;
  onAutoTradingToggle: () => void;
}

const TradingPage: React.FC = () => {
  const { autoTradingEnabled, onAutoTradingToggle } = useOutletContext<LayoutContext>();

  return (
    <Routes>
      <Route index element={<Navigate to="/trading/live" replace />} />
      <Route path="live" element={<LiveTradingPage />} />
      <Route path="positions" element={<PositionsPage />} />
      <Route path="orders" element={<OrdersPage />} />
      <Route
        path="watchlist"
        element={
          <CandidatesWatchlist
            autoTradingEnabled={autoTradingEnabled}
            onAutoTradingToggle={onAutoTradingToggle}
          />
        }
      />
    </Routes>
  );
};

export default TradingPage;
