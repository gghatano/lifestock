import React from 'react';
import { useAuth } from './hooks/useAuth';
import LoginScreen from './components/LoginScreen';
import HealthAssetTracker from './components/HealthAssetTracker';

function App() {
  const { user, loading, error, signInWithGoogle, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">アプリを起動中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <LoginScreen 
        onSignIn={signInWithGoogle}
        loading={loading}
        error={error}
      />
    );
  }

  return (
    <HealthAssetTracker 
      user={user}
      onLogout={logout}
    />
  );
}

export default App;
