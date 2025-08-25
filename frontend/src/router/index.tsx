import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Dashboard from '../components/dashboard/Dashboard';
import TradingPage from '../components/trading/TradingPage';
import PortfolioPage from '../components/portfolio/PortfolioPage';
import AnalyticsPage from '../components/analytics/AnalyticsPage';
import StrategiesPage from '../components/strategies/StrategiesPage';
import HistoryPage from '../components/history/HistoryPage';
import RiskPage from '../components/risk/RiskPage';
import SettingsPage from '../components/settings/SettingsPage';
import AccountPage from '../components/account/AccountPage';
import AlertsPage from '../components/alerts/AlertsPage';
import AlpacaTestPage from '../components/trading/AlpacaTestPage';

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
        path: '/alpaca-test',
        element: <AlpacaTestPage />,
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
