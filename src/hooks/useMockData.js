import { useState } from 'react';

// モックユーザーデータ
const mockUser = {
  uid: 'mock-user-123',
  email: 'demo@example.com',
  displayName: 'デモユーザー',
  photoURL: 'https://via.placeholder.com/40'
};

// モック習慣データ
const generateMockHabits = () => {
  const habits = [];
  const types = ['exercise', 'dental', 'study', 'reading', 'sleep', 'noAlcohol', 'noSmoking', 'limitPhone'];
  const today = new Date();
  
  // 過去7日分のデータを生成
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // ランダムに3-5個の習慣を生成（重複なし）
    const numHabits = Math.floor(Math.random() * 3) + 3;
    const selectedTypes = [...types].sort(() => 0.5 - Math.random()).slice(0, numHabits);
    
    selectedTypes.forEach((type, j) => {
      const habitConfig = {
        exercise: { lifeDays: 0.02, medicalSavings: 60, focusHours: 0.5 },
        dental: { lifeDays: 0.015, medicalSavings: 25 },
        study: { skillAssets: 84, focusHours: 0.5 },
        reading: { skillAssets: 50, focusHours: 0.5 },
        sleep: { lifeDays: 0.04, medicalSavings: 80, focusHours: 1.5 },
        noAlcohol: { lifeDays: 0.02, medicalSavings: 45 },
        noSmoking: { lifeDays: 0.05, medicalSavings: 120 },
        limitPhone: { focusHours: 1.0, skillAssets: 30 }
      };
      
      habits.push({
        id: `mock-${i}-${j}`,
        type,
        duration: 1,
        date: dateStr,
        timestamp: new Date(date.getTime() + j * 1000000),
        value: habitConfig[type] || {}
      });
    });
  }
  
  return habits;
};

export const useMockAuth = () => {
  const [user, setUser] = useState(mockUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const signInWithGoogle = async () => {
    setLoading(true);
    // 2秒後にログイン完了をシミュレート
    setTimeout(() => {
      setUser(mockUser);
      setLoading(false);
    }, 2000);
  };

  const logout = async () => {
    setUser(null);
  };

  return { 
    user, 
    loading, 
    error, 
    signInWithGoogle, 
    logout 
  };
};

export const useMockHabits = (userId) => {
  const mockHabits = generateMockHabits();
  const [habits] = useState(mockHabits);
  
  // モックデータから実際の累積資産を計算
  const calculateRealAssets = () => {
    let totalAssets = { lifeDays: 0, medicalSavings: 0, skillAssets: 0, focusHours: 0 };
    
    mockHabits.forEach(habit => {
      if (habit.value) {
        totalAssets.lifeDays += habit.value.lifeDays || 0;
        totalAssets.medicalSavings += habit.value.medicalSavings || 0;
        totalAssets.skillAssets += habit.value.skillAssets || 0;
        totalAssets.focusHours += habit.value.focusHours || 0;
      }
    });
    
    return totalAssets;
  };
  
  const [assets] = useState(calculateRealAssets());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addHabits = async (habitDataArray) => {
    // モックでは何もしない（UIテスト用）
    console.log('Mock: 習慣を追加しました', habitDataArray);
  };

  const addHabit = async (habitData) => {
    await addHabits([habitData]);
  };

  // モック削除機能（実際には何もしない）
  const removeHabits = async (habitsToRemove) => {
    console.log('Mock: 習慣を削除しました', habitsToRemove);
  };

  const removeHabit = async (habitData) => {
    await removeHabits([habitData]);
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
    
    return { 
      totalDays, 
      totalHabits, 
      avgHabitsPerDay, 
      categoryStats: {},
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
    removeHabit,
    removeHabits, 
    getHabitsForDate,
    getStats,
    getAssetTrendData
  };
};
