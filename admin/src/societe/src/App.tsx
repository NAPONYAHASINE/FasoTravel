/**
 * @file App.tsx
 * @description Main App component for FasoTravel Societe (Admin Dashboard)
 * 
 * This is the migrated version that uses the Shared layer
 */

import { AppProvider, useApp } from './contexts/AppContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function AppContent() {
  const { isAuthenticated } = useApp();

  if (!isAuthenticated) {
    return <Login />;
  }

  return <Dashboard />;
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
