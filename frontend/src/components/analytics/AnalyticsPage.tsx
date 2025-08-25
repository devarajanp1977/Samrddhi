import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PerformancePage from './PerformancePage';
import RiskAnalysisPage from './RiskAnalysisPage';
import MarketAnalysisPage from './MarketAnalysisPage';

const AnalyticsPage: React.FC = () => {
  return (
    <Routes>
      <Route index element={<Navigate to="/analytics/performance" replace />} />
      <Route path="performance" element={<PerformancePage />} />
      <Route path="risk" element={<RiskAnalysisPage />} />
      <Route path="market" element={<MarketAnalysisPage />} />
    </Routes>
  );
};

export default AnalyticsPage;
