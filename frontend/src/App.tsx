import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import AppRouter from './router';
import { ThemeProvider } from './contexts/ThemeContext';
import { useInitializeApp } from './hooks/useDataLoader';

const AppContent: React.FC = () => {
  useInitializeApp();
  return <AppRouter />;
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </Provider>
  );
};

export default App;
