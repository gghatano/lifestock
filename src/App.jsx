import React, { useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useMockAuth } from './hooks/useMockData';
import LoginScreen from './components/LoginScreen';
import HealthAssetTracker from './components/HealthAssetTracker';

function App() {
  // モックモードとFirebaseモードの切り替え
  const isMockMode = import.meta.env.VITE_MOCK_MODE === 'true';
  const authHook = isMockMode ? useMockAuth : useAuth;
  const { user, loading, error, signInWithGoogle, logout } = authHook();

  // デバッグ用: 認証状態の変化をログ出力
  useEffect(() => {
    console.log('App: Auth state changed', {
      user: user ? { uid: user.uid, email: user.email } : null,
      loading,
      error,
      isMockMode,
      url: window.location.href
    });
  }, [user, loading, error, isMockMode]);

  // デバッグ用: ページロード時の環境情報をログ出力
  useEffect(() => {
    console.log('App: Environment info', {
      userAgent: navigator.userAgent,
      windowSize: { width: window.innerWidth, height: window.innerHeight },
      hasTouch: 'ontouchstart' in window,
      url: window.location.href,
      isMockMode,
      firebaseConfig: {
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID
      }
    });
  }, []);

  if (loading) {
    console.log('App: Showing loading screen');
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">アプリを起動中...</p>
          {/* デバッグ情報 */}
          {import.meta.env.DEV && (
            <p className="text-xs text-gray-400 mt-2">
              Debug: Loading auth state...
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('App: Showing login screen');
    return (
      <LoginScreen 
        onSignIn={signInWithGoogle}
        loading={loading}
        error={error}
      />
    );
  }

  console.log('App: Showing main app for user', user.uid);
  return (
    <HealthAssetTracker 
      user={user}
      onLogout={logout}
    />
  );
}

export default App;
