import { useState, useEffect } from 'react';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';

export const useUserPreferences = (userId) => {
  const [preferences, setPreferences] = useState({
    disabledDefaultHabits: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const preferencesRef = doc(db, 'users', userId, 'settings', 'preferences');

    const unsubscribe = onSnapshot(
      preferencesRef,
      (doc) => {
        if (doc.exists()) {
          setPreferences(doc.data());
        } else {
          // デフォルト設定で初期化
          setPreferences({
            disabledDefaultHabits: []
          });
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching user preferences:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // デフォルト習慣を無効化
  const disableDefaultHabit = async (habitKey) => {
    if (!userId) return;

    try {
      const preferencesRef = doc(db, 'users', userId, 'settings', 'preferences');
      const newDisabledHabits = [...(preferences.disabledDefaultHabits || [])];
      
      if (!newDisabledHabits.includes(habitKey)) {
        newDisabledHabits.push(habitKey);
        
        await setDoc(preferencesRef, {
          ...preferences,
          disabledDefaultHabits: newDisabledHabits,
          lastUpdated: new Date()
        }, { merge: true });
      }
    } catch (error) {
      console.error('Error disabling habit:', error);
      throw error;
    }
  };

  // デフォルト習慣の無効化を解除
  const enableDefaultHabit = async (habitKey) => {
    if (!userId) return;

    try {
      const preferencesRef = doc(db, 'users', userId, 'settings', 'preferences');
      const newDisabledHabits = (preferences.disabledDefaultHabits || [])
        .filter(key => key !== habitKey);
      
      await setDoc(preferencesRef, {
        ...preferences,
        disabledDefaultHabits: newDisabledHabits,
        lastUpdated: new Date()
      }, { merge: true });
    } catch (error) {
      console.error('Error enabling habit:', error);
      throw error;
    }
  };

  // 習慣が無効化されているかチェック
  const isDefaultHabitDisabled = (habitKey) => {
    return (preferences.disabledDefaultHabits || []).includes(habitKey);
  };

  return {
    preferences,
    loading,
    error,
    disableDefaultHabit,
    enableDefaultHabit,
    isDefaultHabitDisabled
  };
};

// モック版（開発用）
export const useMockUserPreferences = (userId) => {
  const [preferences, setPreferences] = useState({
    disabledDefaultHabits: JSON.parse(localStorage.getItem(`userPreferences_${userId}`) || '{"disabledDefaultHabits":[]}').disabledDefaultHabits || []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const saveToLocalStorage = (newPreferences) => {
    localStorage.setItem(`userPreferences_${userId}`, JSON.stringify(newPreferences));
  };

  const disableDefaultHabit = async (habitKey) => {
    const newDisabledHabits = [...preferences.disabledDefaultHabits];
    if (!newDisabledHabits.includes(habitKey)) {
      newDisabledHabits.push(habitKey);
      const newPreferences = { ...preferences, disabledDefaultHabits: newDisabledHabits };
      setPreferences(newPreferences);
      saveToLocalStorage(newPreferences);
    }
  };

  const enableDefaultHabit = async (habitKey) => {
    const newDisabledHabits = preferences.disabledDefaultHabits.filter(key => key !== habitKey);
    const newPreferences = { ...preferences, disabledDefaultHabits: newDisabledHabits };
    setPreferences(newPreferences);
    saveToLocalStorage(newPreferences);
  };

  const isDefaultHabitDisabled = (habitKey) => {
    return preferences.disabledDefaultHabits.includes(habitKey);
  };

  return {
    preferences,
    loading,
    error,
    disableDefaultHabit,
    enableDefaultHabit,
    isDefaultHabitDisabled
  };
};