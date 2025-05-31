import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  // Firebase Console から取得する設定値
  // 環境変数で管理することを推奨
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "your-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "lifestock-xxx.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "lifestock-xxx",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "lifestock-xxx.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef"
};

// Firebase初期化
const app = initializeApp(firebaseConfig);

// サービス初期化
export const auth = getAuth(app);
export const db = getFirestore(app);

// Google認証プロバイダー
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

// 開発環境でのエミュレーター設定（オプション）
if (import.meta.env.DEV && !globalThis.FIREBASE_EMULATOR_CONNECTED) {
  try {
    // Firestore エミュレーター（localhost:8080で起動している場合）
    // connectFirestoreEmulator(db, 'localhost', 8080);
    globalThis.FIREBASE_EMULATOR_CONNECTED = true;
  } catch (error) {
    console.log('Firebase emulator already connected or not available');
  }
}

export default app;
