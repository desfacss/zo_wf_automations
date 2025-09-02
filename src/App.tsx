import React from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { LoginForm } from './components/LoginForm';
import { Dashboard } from './components/Dashboard';
import { LoadingSpinner } from './components/LoadingSpinner';
import {AutomationDashboard} from './components/automation/index';
import { useAuthStore } from './lib/store';

function AppContent() {
  const { user } = useAuthStore();

console.log("uz",user);
  if (!user) {
    return <LoginForm />;
  }

  //return <Dashboard />;
  return <AutomationDashboard/>;
}

function App() {
  return (
      <AppContent />
  );
}

export default App;