import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

export const useCustomHabits = (userId) => {
  const [customHabits, setCustomHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const customHabitsQuery = query(
      collection(db, 'users', userId, 'customHabits'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      customHabitsQuery,
      (snapshot) => {
        const customHabitsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate()
        }));
        setCustomHabits(customHabitsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching custom habits:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // カスタム習慣を追加
  const addCustomHabit = async (customHabitData) => {
    if (!userId) throw new Error('ユーザーIDが必要です');

    // バリデーション
    if (!customHabitData.name || customHabitData.name.trim().length === 0) {
      throw new Error('習慣名を入力してください');
    }
    
    if (customHabitData.name.length > 20) {
      throw new Error('習慣名は20文字以内で入力してください');
    }

    // 数値のバリデーション
    const numericFields = ['lifeDays', 'medicalSavings', 'skillAssets', 'focusHours'];
    for (const field of numericFields) {
      const value = customHabitData[field];
      if (value !== undefined && (isNaN(value) || value < 0)) {
        throw new Error(`${field}は0以上の数値を入力してください`);
      }
    }

    // 重複名チェック
    const existingHabit = customHabits.find(h => 
      h.name.toLowerCase() === customHabitData.name.trim().toLowerCase()
    );
    if (existingHabit) {
      throw new Error('同じ名前の習慣が既に存在します');
    }

    try {
      const habitToAdd = {
        name: customHabitData.name.trim(),
        icon: customHabitData.icon || '',
        category: customHabitData.category || 'custom',
        description: customHabitData.description || '',
        detail: customHabitData.detail || '',
        lifeDays: Number(customHabitData.lifeMinutes || 0) / (24 * 60), // 分を日に変換
        medicalSavings: Number(customHabitData.medicalSavings) || 0,
        skillAssets: Number(customHabitData.skillAssets) || 0,
        focusHours: Number(customHabitData.focusHours) || 0,
        createdAt: Timestamp.now(),
        userId
      };

      await addDoc(collection(db, 'users', userId, 'customHabits'), habitToAdd);
    } catch (error) {
      console.error('Error adding custom habit:', error);
      setError(error.message);
      throw error;
    }
  };

  // カスタム習慣を更新
  const updateCustomHabit = async (habitId, updates) => {
    if (!userId || !habitId) throw new Error('ユーザーIDと習慣IDが必要です');

    // バリデーション
    if (updates.name !== undefined) {
      if (!updates.name || updates.name.trim().length === 0) {
        throw new Error('習慣名を入力してください');
      }
      
      if (updates.name.length > 20) {
        throw new Error('習慣名は20文字以内で入力してください');
      }

      // 重複名チェック（自分以外）
      const existingHabit = customHabits.find(h => 
        h.id !== habitId && 
        h.name.toLowerCase() === updates.name.trim().toLowerCase()
      );
      if (existingHabit) {
        throw new Error('同じ名前の習慣が既に存在します');
      }
    }

    try {
      const habitRef = doc(db, 'users', userId, 'customHabits', habitId);
      const updateData = { ...updates };
      
      // 文字列フィールドをトリム
      if (updateData.name) {
        updateData.name = updateData.name.trim();
      }
      
      // 数値フィールドを変換
      const numericFields = ['medicalSavings', 'skillAssets', 'focusHours'];
      numericFields.forEach(field => {
        if (updateData[field] !== undefined) {
          updateData[field] = Number(updateData[field]) || 0;
        }
      });

      // 健康寿命は分から日に変換
      if (updateData.lifeMinutes !== undefined) {
        updateData.lifeDays = Number(updateData.lifeMinutes || 0) / (24 * 60);
        delete updateData.lifeMinutes; // lifeMinutesフィールドは削除
      }

      await updateDoc(habitRef, updateData);
    } catch (error) {
      console.error('Error updating custom habit:', error);
      setError(error.message);
      throw error;
    }
  };

  // カスタム習慣を削除
  const deleteCustomHabit = async (habitId) => {
    if (!userId || !habitId) throw new Error('ユーザーIDと習慣IDが必要です');

    try {
      const habitRef = doc(db, 'users', userId, 'customHabits', habitId);
      await deleteDoc(habitRef);
    } catch (error) {
      console.error('Error deleting custom habit:', error);
      setError(error.message);
      throw error;
    }
  };

  // カスタム習慣をIDで取得
  const getCustomHabitById = (habitId) => {
    return customHabits.find(h => h.id === habitId);
  };

  // カスタム習慣をhabitTypesフォーマットに変換
  const getCustomHabitsAsHabitTypes = () => {
    const habitTypesFormat = {};
    customHabits.forEach(habit => {
      const key = `custom_${habit.id}`;
      habitTypesFormat[key] = {
        name: habit.name,
        icon: habit.icon,
        category: habit.category,
        description: habit.description,
        detail: habit.detail,
        lifeDays: habit.lifeDays,
        medicalSavings: habit.medicalSavings,
        skillAssets: habit.skillAssets,
        focusHours: habit.focusHours,
        isCustom: true,
        customId: habit.id
      };
    });
    return habitTypesFormat;
  };

  return {
    customHabits,
    loading,
    error,
    addCustomHabit,
    updateCustomHabit,
    deleteCustomHabit,
    getCustomHabitById,
    getCustomHabitsAsHabitTypes
  };
};

// モック用のカスタム習慣フック
export const useMockCustomHabits = (userId) => {
  const [customHabits, setCustomHabits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;

    // localStorage からカスタム習慣を読み込み
    const storageKey = `customHabits_${userId}`;
    try {
      const storedHabits = localStorage.getItem(storageKey);
      if (storedHabits) {
        const parsed = JSON.parse(storedHabits);
        setCustomHabits(parsed.map(h => ({
          ...h,
          createdAt: new Date(h.createdAt)
        })));
      }
    } catch (error) {
      console.error('Error loading custom habits from localStorage:', error);
    }
  }, [userId]);

  // localStorage に保存
  const saveToStorage = (habits) => {
    if (!userId) return;
    
    const storageKey = `customHabits_${userId}`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(habits));
    } catch (error) {
      console.error('Error saving custom habits to localStorage:', error);
    }
  };

  const addCustomHabit = async (customHabitData) => {
    if (!userId) throw new Error('ユーザーIDが必要です');

    // バリデーション（Firebaseと同じ）
    if (!customHabitData.name || customHabitData.name.trim().length === 0) {
      throw new Error('習慣名を入力してください');
    }
    
    if (customHabitData.name.length > 20) {
      throw new Error('習慣名は20文字以内で入力してください');
    }

    const existingHabit = customHabits.find(h => 
      h.name.toLowerCase() === customHabitData.name.trim().toLowerCase()
    );
    if (existingHabit) {
      throw new Error('同じ名前の習慣が既に存在します');
    }

    const newHabit = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: customHabitData.name.trim(),
      icon: customHabitData.icon || '',
      category: customHabitData.category || 'custom',
      description: customHabitData.description || '',
      detail: customHabitData.detail || '',
      lifeDays: Number(customHabitData.lifeMinutes || 0) / (24 * 60), // 分を日に変換
      medicalSavings: Number(customHabitData.medicalSavings) || 0,
      skillAssets: Number(customHabitData.skillAssets) || 0,
      focusHours: Number(customHabitData.focusHours) || 0,
      createdAt: new Date(),
      userId
    };

    const updatedHabits = [newHabit, ...customHabits];
    setCustomHabits(updatedHabits);
    saveToStorage(updatedHabits);
  };

  const updateCustomHabit = async (habitId, updates) => {
    if (!userId || !habitId) throw new Error('ユーザーIDと習慣IDが必要です');

    if (updates.name !== undefined) {
      if (!updates.name || updates.name.trim().length === 0) {
        throw new Error('習慣名を入力してください');
      }
      
      if (updates.name.length > 20) {
        throw new Error('習慣名は20文字以内で入力してください');
      }

      const existingHabit = customHabits.find(h => 
        h.id !== habitId && 
        h.name.toLowerCase() === updates.name.trim().toLowerCase()
      );
      if (existingHabit) {
        throw new Error('同じ名前の習慣が既に存在します');
      }
    }

    const updatedHabits = customHabits.map(habit => {
      if (habit.id === habitId) {
        const updateData = { ...updates };
        if (updateData.name) updateData.name = updateData.name.trim();
        
        const numericFields = ['medicalSavings', 'skillAssets', 'focusHours'];
        numericFields.forEach(field => {
          if (updateData[field] !== undefined) {
            updateData[field] = Number(updateData[field]) || 0;
          }
        });

        // 健康寿命は分から日に変換
        if (updateData.lifeMinutes !== undefined) {
          updateData.lifeDays = Number(updateData.lifeMinutes || 0) / (24 * 60);
          delete updateData.lifeMinutes;
        }

        return { ...habit, ...updateData };
      }
      return habit;
    });

    setCustomHabits(updatedHabits);
    saveToStorage(updatedHabits);
  };

  const deleteCustomHabit = async (habitId) => {
    if (!userId || !habitId) throw new Error('ユーザーIDと習慣IDが必要です');

    const updatedHabits = customHabits.filter(h => h.id !== habitId);
    setCustomHabits(updatedHabits);
    saveToStorage(updatedHabits);
  };

  const getCustomHabitById = (habitId) => {
    return customHabits.find(h => h.id === habitId);
  };

  const getCustomHabitsAsHabitTypes = () => {
    const habitTypesFormat = {};
    customHabits.forEach(habit => {
      const key = `custom_${habit.id}`;
      habitTypesFormat[key] = {
        name: habit.name,
        icon: habit.icon,
        category: habit.category,
        description: habit.description,
        detail: habit.detail,
        lifeDays: habit.lifeDays,
        medicalSavings: habit.medicalSavings,
        skillAssets: habit.skillAssets,
        focusHours: habit.focusHours,
        isCustom: true,
        customId: habit.id
      };
    });
    return habitTypesFormat;
  };

  return {
    customHabits,
    loading,
    error,
    addCustomHabit,
    updateCustomHabit,
    deleteCustomHabit,
    getCustomHabitById,
    getCustomHabitsAsHabitTypes
  };
};