export const habitTypes = {
  exercise: { 
    name: '運動', 
    icon: '🏃‍♂️',
    category: 'health',
    lifeDays: 0.02, 
    medicalSavings: 60,
    focusHours: 0.5,
    description: '30分の運動'
  },
  floss: { 
    name: 'フロス', 
    icon: '🦷',
    category: 'health',
    lifeDays: 0.01, 
    medicalSavings: 12,
    description: '歯間ケア'
  },
  study: { 
    name: '勉強', 
    icon: '📚',
    category: 'learning',
    skillAssets: 84,
    focusHours: 1,
    description: '1時間の学習'
  },
  noAlcohol: { 
    name: '禁酒', 
    icon: '🚫🍺',
    category: 'health',
    lifeDays: 0.015,
    medicalSavings: 40,
    description: 'アルコール摂取なし'
  },
  limitPhone: { 
    name: 'スマホ制限', 
    icon: '📱',
    category: 'focus',
    focusHours: 0.5,
    skillAssets: 25,
    description: 'スマホ利用時間制限'
  },
  sleep8h: { 
    name: '8時間睡眠', 
    icon: '😴',
    category: 'health',
    lifeDays: 0.03,
    medicalSavings: 80,
    focusHours: 2,
    description: '8時間の質の良い睡眠'
  },
  meditation: { 
    name: '瞑想', 
    icon: '🧘‍♂️',
    category: 'mental',
    lifeDays: 0.01,
    medicalSavings: 30,
    focusHours: 1,
    description: '10-20分の瞑想'
  },
  reading: { 
    name: '読書', 
    icon: '📖',
    category: 'learning',
    skillAssets: 50,
    focusHours: 1,
    description: '30分以上の読書'
  },
  walk: {
    name: '散歩',
    icon: '🚶‍♂️',
    category: 'health',
    lifeDays: 0.01,
    medicalSavings: 30,
    focusHours: 0.3,
    description: '30分の散歩'
  },
  hydration: {
    name: '水分補給',
    icon: '💧',
    category: 'health',
    lifeDays: 0.005,
    medicalSavings: 10,
    description: '適切な水分摂取（2L以上）'
  }
};

export const categories = {
  health: { name: '健康', color: 'text-red-600', bgColor: 'bg-red-50' },
  learning: { name: '学習', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  focus: { name: '集中', color: 'text-purple-600', bgColor: 'bg-purple-50' },
  mental: { name: 'メンタル', color: 'text-green-600', bgColor: 'bg-green-50' }
};

// 習慣の価値を計算
export const calculateHabitValue = (habitType, duration = 1) => {
  const habit = habitTypes[habitType];
  if (!habit) return {};

  return {
    lifeDays: (habit.lifeDays || 0) * duration,
    medicalSavings: (habit.medicalSavings || 0) * duration,
    skillAssets: (habit.skillAssets || 0) * duration,
    focusHours: (habit.focusHours || 0) * duration
  };
};

// 総資産価値を計算（集中時間は1時間100円で換算）
export const calculateTotalAssetValue = (assets) => {
  return (assets.medicalSavings || 0) + 
         (assets.skillAssets || 0) + 
         (assets.focusHours || 0) * 100;
};
