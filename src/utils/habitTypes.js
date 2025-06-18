export const habitTypes = {
  exercise: { 
    name: '運動', 
    icon: '🏃‍♂️',
    category: 'health',
    lifeDays: 0.02, 
    medicalSavings: 60,
    focusHours: 0.5,
    description: '30分程の運動',
    detail: 'ウォーキング、ジョギング、筋トレなど'
  },
  dental: { 
    name: 'オーラルケア', 
    icon: '🦷',
    category: 'health',
    lifeDays: 0.015, 
    medicalSavings: 25,
    description: '歯磨き・フロス・歯間ブラシ',
    detail: '朝晩の歯磨き+フロス+歯間ブラシ'
  },
  study: { 
    name: '勉強', 
    icon: '📚',
    category: 'learning',
    skillAssets: 84,
    focusHours: 0.5,
    description: '30分ほどの勉強',
    detail: '新しいスキル習得、資格勉強など'
  },
  reading: { 
    name: '読書', 
    icon: '📖',
    category: 'learning',
    skillAssets: 50,
    focusHours: 0.5,
    description: '30分程の読書',
    detail: 'ビジネス書、小説、専門書など'
  },
  sleep: { 
    name: '良質な睡眠', 
    icon: '😴',
    category: 'health',
    lifeDays: 0.04,
    medicalSavings: 80,
    focusHours: 1.5,
    description: '7.5時間の睡眠',
    detail: '質の良い7.5時間睡眠'
  },
  noAlcohol: { 
    name: '禁酒', 
    icon: '🚫🍺',
    category: 'health',
    lifeDays: 0.02,
    medicalSavings: 45,
    description: 'アルコール摂取なし',
    detail: '1日アルコールを摂取しない'
  },
  noSmoking: {
    name: '禁煙',
    icon: '🚭',
    category: 'health',
    lifeDays: 0.05,
    medicalSavings: 120,
    description: 'タバコを吸わない',
    detail: '1日タバコを吸わずに過ごす'
  },
  limitPhone: { 
    name: 'スマホ制限', 
    icon: '📱',
    category: 'focus',
    focusHours: 1.0,
    skillAssets: 30,
    description: 'スマホ利用時間制限',
    detail: 'SNS、ゲームなどを制限'
  }
};

export const categories = {
  health: { name: '健康', color: 'text-red-600', bgColor: 'bg-red-50' },
  learning: { name: '学習', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  focus: { name: '集中', color: 'text-purple-600', bgColor: 'bg-purple-50' },
  mental: { name: 'メンタル', color: 'text-green-600', bgColor: 'bg-green-50' },
  custom: { name: 'カスタム', color: 'text-orange-600', bgColor: 'bg-orange-50' }
};

// カスタム習慣と統合した全習慣リストを取得
export const getAllHabitTypes = (customHabitTypes = {}) => {
  return { ...habitTypes, ...customHabitTypes };
};

// 習慣の価値を計算（カスタム習慣対応）
export const calculateHabitValue = (habitType, duration = 1, customHabitTypes = {}) => {
  const allHabitTypes = getAllHabitTypes(customHabitTypes);
  const habit = allHabitTypes[habitType];
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
  // assetsがnullやundefinedの場合のエラーハンドリング
  if (!assets || typeof assets !== 'object') {
    console.warn('calculateTotalAssetValue: 無効なassets値:', assets);
    return 0;
  }
  
  try {
    return (assets.medicalSavings || 0) + 
           (assets.skillAssets || 0) + 
           (assets.focusHours || 0) * 100;
  } catch (error) {
    console.error('calculateTotalAssetValueエラー:', error, 'assets:', assets);
    return 0;
  }
};

// 健康寿命を分単位で計算
export const calculateLifeMinutes = (lifeDays) => {
  if (typeof lifeDays !== 'number' || isNaN(lifeDays)) {
    console.warn('calculateLifeMinutes: 無効なlifeDays値:', lifeDays);
    return 0;
  }
  
  try {
    return Math.round(lifeDays * 24 * 60); // 日 → 分
  } catch (error) {
    console.error('calculateLifeMinutesエラー:', error, 'lifeDays:', lifeDays);
    return 0;
  }
};
