import React from 'react';
import { ConfigProvider, theme, App as AntApp } from 'antd';
import { AutomationTabs } from './components/automation/AutomationTabs';
import { LoginForm } from './components/LoginForm';
import { useAuthStore } from './lib/store';

function AppContent() {
  const { user } = useAuthStore();

  if (!user) {
    return <LoginForm />;
  }

  return <AutomationTabs />;
}

function App() {
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 8,
        },
      }}
    >
      <AntApp>
        <AppContent />
      </AntApp>
    </ConfigProvider>
  );
}

export default App;