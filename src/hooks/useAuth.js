import { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../config/firebase';

// より正確なモバイル判定関数
const isMobileDevice = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  
  // モバイルデバイスのUser Agentパターン
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  
  // タッチサポートの確認
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // 画面サイズとの組み合わせ判定
  const isSmallScreen = window.innerWidth < 768;
  
  const result = mobileRegex.test(userAgent) || (hasTouch && isSmallScreen);
  
  console.log('🔍 Mobile Detection:', {
    userAgent: userAgent.slice(0, 100) + '...',
    mobileRegex: mobileRegex.test(userAgent),
    hasTouch,
    isSmallScreen,
    maxTouchPoints: navigator.maxTouchPoints,
    finalResult: result
  });
  
  return result;
};

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🚀 useAuth: Initializing auth state listener');
    console.log('🔧 Firebase Auth instance:', auth);
    console.log('🌐 Current URL:', window.location.href);
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔄 useAuth: Auth state changed', { 
        hasUser: !!firebaseUser,
        uid: firebaseUser?.uid,
        email: firebaseUser?.email,
        timestamp: new Date().toISOString()
      });
      
      if (firebaseUser) {
        console.log('👤 User detected, creating/updating doc...');
        try {
          await createOrUpdateUserDoc(firebaseUser);
          setUser(firebaseUser);
          console.log('✅ User set successfully');
        } catch (err) {
          console.error('❌ Error in user doc creation:', err);
          setError(err.message);
        }
      } else {
        console.log('👤 No user detected, setting user to null');
        setUser(null);
      }
      setLoading(false);
      console.log('⏱️ Loading set to false');
    });

    // リダイレクト結果をチェック（モバイル対応）
    const checkRedirectResult = async () => {
      try {
        console.log('🔍 useAuth: Checking redirect result...');
        console.log('🔧 Auth state before getRedirectResult:', {
          currentUser: auth.currentUser?.uid || 'none',
          url: window.location.href,
          hasFragment: window.location.hash.length > 0,
          hasQuery: window.location.search.length > 0
        });
        
        // リダイレクト結果取得の詳細ログ
        console.log('⏳ Calling getRedirectResult...');
        const result = await getRedirectResult(auth);
        console.log('📋 getRedirectResult returned:', {
          hasResult: !!result,
          hasUser: !!result?.user,
          userUid: result?.user?.uid || 'none',
          userEmail: result?.user?.email || 'none',
          operationType: result?.operationType || 'none',
          hasCredential: !!result?.credential
        });
        
        if (result?.user) {
          console.log('🎉 useAuth: Redirect sign-in successful!', {
            uid: result.user.uid,
            email: result.user.email,
            accessToken: result._tokenResponse?.oauthAccessToken ? 'present' : 'missing'
          });
          
          await createOrUpdateUserDoc(result.user);
          setUser(result.user);
          console.log('✅ User state updated after redirect');
        } else {
          console.log('ℹ️ useAuth: No redirect result found');
          console.log('🔧 Checking auth.currentUser as fallback:', {
            hasCurrentUser: !!auth.currentUser,
            currentUserUid: auth.currentUser?.uid || 'none'
          });
          
          // フォールバック: auth.currentUser をチェック
          if (auth.currentUser) {
            console.log('🔄 Using auth.currentUser as fallback');
            await createOrUpdateUserDoc(auth.currentUser);
            setUser(auth.currentUser);
          }
        }
      } catch (error) {
        console.error('❌ useAuth: Redirect sign-in error:', error);
        console.error('❌ Error details:', {
          code: error.code,
          message: error.message,
          customData: error.customData
        });
        setError(error.message);
      }
    };

    checkRedirectResult();

    return () => {
      console.log('🔄 useAuth: Cleaning up auth listener');
      unsubscribe();
    };
  }, []);

  const createOrUpdateUserDoc = async (user) => {
    try {
      console.log('📝 useAuth: Creating/updating user doc for', user.uid);
      
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      const userData = {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        lastLogin: new Date(),
      };

      if (!userSnap.exists()) {
        console.log('🆕 useAuth: Creating new user document');
        await setDoc(userRef, {
          ...userData,
          createdAt: new Date(),
          settings: {
            timezone: 'Asia/Tokyo',
            notifications: true,
            theme: 'light'
          },
          assets: {
            lifeDays: 0,
            medicalSavings: 0,
            skillAssets: 0,
            focusHours: 0,
            lastUpdated: new Date()
          }
        });
        console.log('✅ New user document created');
      } else {
        console.log('📝 useAuth: Updating existing user document');
        await setDoc(userRef, userData, { merge: true });
        console.log('✅ User document updated');
      }
    } catch (error) {
      console.error('❌ Error creating/updating user document:', error);
      setError(error.message);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const isMobile = isMobileDevice();
      console.log('🔐 useAuth: Sign in attempt started', { 
        isMobile,
        willUsePopup: true, // サードパーティCookie問題のためポップアップを使用
        currentUrl: window.location.href,
        timestamp: new Date().toISOString()
      });
      
      // モバイルでもポップアップ認証を使用（サードパーティCookie問題への対処）
      const USE_POPUP_FOR_MOBILE = true;
      
      if (isMobile && !USE_POPUP_FOR_MOBILE) {
        console.log('📱 useAuth: Using redirect flow for mobile');
        console.log('🔧 Provider config:', {
          providerId: googleProvider.providerId,
          customParameters: googleProvider.customParameters || 'none'
        });
        
        await signInWithRedirect(auth, googleProvider);
        console.log('🚀 Redirect initiated - page should change now');
        // リダイレクト時はloadingをfalseにしない（リダイレクト先で処理される）
      } else {
        console.log('🖥️ useAuth: Using popup flow for desktop/mobile');
        const result = await signInWithPopup(auth, googleProvider);
        if (result?.user) {
          console.log('✅ Popup sign-in successful');
          await createOrUpdateUserDoc(result.user);
        }
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ Authentication error:', error);
      console.error('❌ Error details:', {
        code: error.code,
        message: error.message,
        customData: error.customData
      });
      setError(error.message);
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      console.log('🚪 useAuth: Signing out user');
      await signOut(auth);
      console.log('✅ Sign out successful');
    } catch (error) {
      console.error('❌ Logout error:', error);
      setError(error.message);
    }
  };

  // デバッグ用の状態ログ
  useEffect(() => {
    console.log('📈 useAuth State Update:', {
      hasUser: !!user,
      loading,
      error,
      timestamp: new Date().toISOString()
    });
  }, [user, loading, error]);

  return { 
    user, 
    loading, 
    error, 
    signInWithGoogle, 
    logout 
  };
};
