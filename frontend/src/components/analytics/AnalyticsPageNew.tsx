import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AnalyticsPageOriginal from './AnalyticsPage';

const AnalyticsPage: React.FC = () => {
  return (
    <Routes>
      <Route index element={<Navigate to="/analytics/performance" replace />} />
      <Route path="performance" element={<AnalyticsPageOriginal />} />
      <Route path="risk" element={<AnalyticsPageOriginal />} />
      <Route path="market" element={<AnalyticsPageOriginal />} />
    </Routes>
  );
};

export default AnalyticsPage;
