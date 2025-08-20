import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Dashboard from '../components/dashboard/Dashboard';

// Placeholder components for other routes
const TradingPage = () => <div>Trading Page - Coming Soon</div>;
const PortfolioPage = () => <div>Portfolio Page - Coming Soon</div>;
const AnalyticsPage = () => <div>Analytics Page - Coming Soon</div>;
const StrategiesPage = () => <div>Strategies Page - Coming Soon</div>;
const HistoryPage = () => <div>History Page - Coming Soon</div>;
const RiskPage = () => <div>Risk Management Page - Coming Soon</div>;
const AccountPage = () => <div>Account Page - Coming Soon</div>;
const AlertsPage = () => <div>Alerts Page - Coming Soon</div>;
const SettingsPage = () => <div>Settings Page - Coming Soon</div>;

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: '/trading/*',
        element: <TradingPage />,
      },
      {
        path: '/portfolio',
        element: <PortfolioPage />,
      },
      {
        path: '/analytics/*',
        element: <AnalyticsPage />,
      },
      {
        path: '/strategies',
        element: <StrategiesPage />,
      },
      {
        path: '/history',
        element: <HistoryPage />,
      },
      {
        path: '/risk',
        element: <RiskPage />,
      },
      {
        path: '/account',
        element: <AccountPage />,
      },
      {
        path: '/alerts',
        element: <AlertsPage />,
      },
      {
        path: '/settings',
        element: <SettingsPage />,
      },
    ],
  },
]);

const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;
