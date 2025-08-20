import React from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Provider } from 'react-redux';
import { store } from './store';
import AppRouter from './router';
import theme from './styles/theme';
import { useInitializeApp } from './hooks/useDataLoader';

const AppContent: React.FC = () => {
  useInitializeApp();
  return <AppRouter />;
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppContent />
      </ThemeProvider>
    </Provider>
  );
};

export default App;
