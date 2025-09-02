import React from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { LoginForm } from './components/LoginForm';
import { Dashboard } from './components/Dashboard';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useAuthStore } from './lib/store';

function AppContent() {
  const { user } = useAuthStore();

  // if (loading) {
  //   return <LoadingSpinner />;
  // }
console.log("uz",user);
  if (!user) {
    return <LoginForm />;
  }

  return <Dashboard />;
}

function App() {
  return (
    // <AuthProvider>
      <AppContent />
    // </AuthProvider>
  );
}

export default App;