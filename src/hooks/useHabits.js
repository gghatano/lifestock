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
  increment,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { calculateHabitValue } from '../utils/habitTypes';

export const useHabits = (userId) => {
  const [habits, setHabits] = useState([]);
  const [assets, setAssets] = useState({
    lifeDays: 0,
    medicalSavings: 0,
    skillAssets: 0,
    focusHours: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const habitsQuery = query(
      collection(db, `users/${userId}/habits`),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(
      habitsQuery, 
      (snapshot) => {
        const habitsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate(), // Timestampを Date に変換
          date: doc.data().date
        }));
        setHabits(habitsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching habits:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    // ユーザーの資産情報を取得
    const userDoc = doc(db, 'users', userId);
    const unsubscribeUser = onSnapshot(
      userDoc,
      (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          setAssets(userData.assets || {
            lifeDays: 0,
            medicalSavings: 0,
            skillAssets: 0,
            focusHours: 0
          });
        }
      },
      (error) => {
        console.error('Error fetching user assets:', error);
      }
    );

    return () => {
      unsubscribe();
      unsubscribeUser();
    };
  }, [userId]);

  const addHabits = async (habitDataArray) => {
    if (!userId || !habitDataArray.length) return;

    try {
      const batch = writeBatch(db);
      let totalValue = { lifeDays: 0, medicalSavings: 0, skillAssets: 0, focusHours: 0 };

      // 各習慣をバッチに追加
      habitDataArray.forEach(habitData => {
        const habitRef = doc(collection(db, `users/${userId}/habits`));
        const value = calculateHabitValue(habitData.type, habitData.duration);
        
        batch.set(habitRef, {
          ...habitData,
          value,
          timestamp: Timestamp.now()
        });

        // 総価値を累積
        totalValue.lifeDays += value.lifeDays || 0;
        totalValue.medicalSavings += value.medicalSavings || 0;
        totalValue.skillAssets += value.skillAssets || 0;
        totalValue.focusHours += value.focusHours || 0;
      });

      // ユーザーの総資産を更新
      const userRef = doc(db, 'users', userId);
      batch.update(userRef, {
        'assets.lifeDays': increment(totalValue.lifeDays),
        'assets.medicalSavings': increment(totalValue.medicalSavings),
        'assets.skillAssets': increment(totalValue.skillAssets),
        'assets.focusHours': increment(totalValue.focusHours),
        'assets.lastUpdated': Timestamp.now()
      });

      await batch.commit();
    } catch (error) {
      console.error('Error adding habits:', error);
      setError(error.message);
      throw error;
    }
  };

  const addHabit = async (habitData) => {
    await addHabits([habitData]);
  };

  // 指定日の習慣を取得
  const getHabitsForDate = (date) => {
    return habits.filter(habit => habit.date === date);
  };

  // 統計データを計算
  const getStats = () => {
    const uniqueDates = new Set(habits.map(h => h.date));
    const totalDays = uniqueDates.size;
    const totalHabits = habits.length;
    const avgHabitsPerDay = totalDays > 0 ? (totalHabits / totalDays).toFixed(1) : 0;
    
    // カテゴリ別の集計
    const categoryStats = {};
    habits.forEach(habit => {
      // habitTypes から category を取得（動的import が必要な場合は別途処理）
      const category = 'general'; // 簡略化
      categoryStats[category] = (categoryStats[category] || 0) + 1;
    });

    return { 
      totalDays, 
      totalHabits, 
      avgHabitsPerDay, 
      categoryStats,
      uniqueDates: Array.from(uniqueDates).sort()
    };
  };

  // 日別の資産推移データを生成
  const getAssetTrendData = () => {
    const dateGroups = {};
    let cumulativeAssets = { lifeDays: 0, medicalSavings: 0, skillAssets: 0, focusHours: 0 };
    
    // 日付順にソート
    const sortedHabits = [...habits].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    sortedHabits.forEach(habit => {
      const date = habit.date;
      if (!dateGroups[date]) {
        dateGroups[date] = { ...cumulativeAssets };
      }
      
      if (habit.value) {
        cumulativeAssets.lifeDays += habit.value.lifeDays || 0;
        cumulativeAssets.medicalSavings += habit.value.medicalSavings || 0;
        cumulativeAssets.skillAssets += habit.value.skillAssets || 0;
        cumulativeAssets.focusHours += habit.value.focusHours || 0;
      }
      
      dateGroups[date] = { ...cumulativeAssets };
    });

    return Object.entries(dateGroups).map(([date, assets]) => ({
      date: new Date(date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }),
      fullDate: date,
      totalValue: (assets.medicalSavings || 0) + (assets.skillAssets || 0) + (assets.focusHours || 0) * 100,
      lifeDays: Number((assets.lifeDays || 0).toFixed(2)),
      medicalSavings: assets.medicalSavings || 0,
      skillAssets: assets.skillAssets || 0,
      focusHours: Number((assets.focusHours || 0).toFixed(1))
    }));
  };

  return { 
    habits, 
    assets,
    loading, 
    error,
    addHabit,
    addHabits, 
    getHabitsForDate,
    getStats,
    getAssetTrendData
  };
};
