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

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // ユーザーがログインしている場合、Firestoreにユーザー情報を保存/更新
        await createOrUpdateUserDoc(user);
        setUser(user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // リダイレクト結果をチェック（モバイル対応）
    getRedirectResult(auth).then(async (result) => {
      if (result?.user) {
        await createOrUpdateUserDoc(result.user);
      }
    }).catch((error) => {
      console.error('Redirect sign-in error:', error);
      setError(error.message);
    });

    return unsubscribe;
  }, []);

  const createOrUpdateUserDoc = async (user) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      const userData = {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        lastLogin: new Date(),
      };

      if (!userSnap.exists()) {
        // 新規ユーザーの場合、初期データを設定
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
      } else {
        // 既存ユーザーの場合、ログイン情報のみ更新
        await setDoc(userRef, userData, { merge: true });
      }
    } catch (error) {
      console.error('Error creating/updating user document:', error);
      setError(error.message);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      
      // デスクトップではポップアップ、モバイルではリダイレクトを使用
      if (window.innerWidth < 768) {
        await signInWithRedirect(auth, googleProvider);
      } else {
        await signInWithPopup(auth, googleProvider);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      setError(error.message);
    }
  };

  return { 
    user, 
    loading, 
    error, 
    signInWithGoogle, 
    logout 
  };
};
