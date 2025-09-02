import React from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { LoginForm } from './components/LoginForm';
import { Dashboard } from './components/Dashboard';
import { LoadingSpinner } from './components/LoadingSpinner';
import {AutomationDashboard} from './components/automation/index';
import {EventDetailsModal} from './components/automation/EventDetailsModal';
import { useAuthStore } from './lib/store';

function AppContent() {
  const { user } = useAuthStore();

console.log("uz",user);
  if (!user) {
    return <LoginForm />;
  }

  return <AutomationDashboard/>;
}

function App() {
  return (
      <AppContent />
  );
}

export default App;