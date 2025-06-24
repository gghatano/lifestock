import React, { useState } from 'react';
import { Plus, TrendingUp, Calendar, Award, Heart, Brain, DollarSign, Clock, LogOut, User, ArrowRight, CheckCircle, Edit2, Trash2, Settings } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useHabits } from '../hooks/useHabits';
import { useMockHabits } from '../hooks/useMockData';
import { useCustomHabits, useMockCustomHabits } from '../hooks/useCustomHabits';
import { useUserPreferences, useMockUserPreferences } from '../hooks/useUserPreferences';
import CustomHabitModal from './CustomHabitModal';
import { habitTypes, getAllHabitTypes, calculateTotalAssetValue, calculateLifeMinutes } from '../utils/habitTypes';

const HealthAssetTracker = ({ user, onLogout }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('record');
  const [pendingHabits, setPendingHabits] = useState([]);
  const [pendingRemovals, setPendingRemovals] = useState([]);
  const [registering, setRegistering] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [selectedStatCategory, setSelectedStatCategory] = useState('all');
  
  // カスタム習慣モーダル関連
  const [showCustomHabitModal, setShowCustomHabitModal] = useState(false);
  const [editingCustomHabit, setEditingCustomHabit] = useState(null);
  const [customHabitLoading, setCustomHabitLoading] = useState(false);

  // モックモードとFirebaseモードの切り替え
  const isMockMode = import.meta.env.VITE_MOCK_MODE === 'true';
  const habitsHook = isMockMode ? useMockHabits : useHabits;
  const customHabitsHook = isMockMode ? useMockCustomHabits : useCustomHabits;
  
  const { 
    habits, 
    assets, 
    loading, 
    error, 
    addHabits,
    removeHabits, 
    getHabitsForDate, 
    getStats, 
    getAssetTrendData 
  } = habitsHook(user?.uid);

  const {
    customHabits,
    loading: customHabitsLoading,
    error: customHabitsError,
    addCustomHabit,
    updateCustomHabit,
    deleteCustomHabit,
    getCustomHabitsAsHabitTypes
  } = customHabitsHook(user?.uid);

  // ユーザー設定
  const userPreferencesHook = isMockMode ? useMockUserPreferences : useUserPreferences;
  const {
    preferences,
    loading: preferencesLoading,
    error: preferencesError,
    disableDefaultHabit,
    enableDefaultHabit,
    isDefaultHabitDisabled
  } = userPreferencesHook(user?.uid);

  // 全習慣タイプ（既存 + カスタム）- 無効化された習慣を除外
  const enabledDefaultHabits = Object.fromEntries(
    Object.entries(habitTypes).filter(([key, habit]) => !isDefaultHabitDisabled(key))
  );
  const allHabitTypes = { ...enabledDefaultHabits, ...getCustomHabitsAsHabitTypes() };

  // 今日実行済みの習慣タイプを取得
  const todayCompletedHabits = getHabitsForDate(selectedDate).map(h => h.type);
  const todayHabitRecords = getHabitsForDate(selectedDate);

  // 習慣のON/OFFを切り替え（常時編集モード）
  const toggleHabit = (habitType) => {
    const isCompleted = todayCompletedHabits.includes(habitType);
    const isPendingRemoval = pendingRemovals.some(r => r.type === habitType);
    const isPendingAdd = pendingHabits.some(h => h.type === habitType);

    if (isCompleted && !isPendingRemoval) {
      // 完了済みを削除待ちに
      removeCompletedHabit(habitType);
    } else if (isPendingRemoval) {
      // 削除待ちを取消
      const habit = pendingRemovals.find(r => r.type === habitType);
      if (habit) cancelRemoval(habit.id);
    } else if (isPendingAdd) {
      // 追加待ちを取消
      const habit = pendingHabits.find(h => h.type === habitType);
      if (habit) removePendingHabit(habit.id);
    } else {
      // 新しく追加
      addPendingHabit(habitType);
    }
  };

  // 保留中の習慣を追加
  const addPendingHabit = (habitType, duration = 1) => {
    const habit = {
      id: `temp-${Date.now()}`,  // 文字列に変換
      type: habitType,
      duration,
      date: selectedDate,
    };
    setPendingHabits(prev => [...prev, habit]);
  };

  // 完了済み習慣を削除（削除待ちリストに追加）
  const removeCompletedHabit = (habitType) => {
    const habitToRemove = todayHabitRecords.find(h => h.type === habitType);
    if (habitToRemove) {
      setPendingRemovals(prev => [...prev, habitToRemove]);
    }
  };

  // 削除待ちから取り消し
  const cancelRemoval = (habitId) => {
    setPendingRemovals(prev => prev.filter(h => h.id !== habitId));
  };

  // 保留中の習慣を削除
  const removePendingHabit = (habitId) => {
    setPendingHabits(prev => prev.filter(h => h.id !== habitId));
  };

  // 習慣を登録/削除
  const registerChanges = async () => {
    if (pendingHabits.length === 0 && pendingRemovals.length === 0) return;

    try {
      setRegistering(true);
      
      // 新しい習慣を追加
      if (pendingHabits.length > 0) {
        await addHabits(pendingHabits);
      }
      
      // 習慣を削除
      if (pendingRemovals.length > 0) {
        await removeHabits(pendingRemovals);
      }
      
      setPendingHabits([]);
      setPendingRemovals([]);
      
      // 成功メッセージを表示
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Registration failed:', error);
      alert(`処理に失敗しました: ${error.message}`);
    } finally {
      setRegistering(false);
    }
  };

  const todayHabits = getHabitsForDate(selectedDate);
  const stats = getStats();
  const trendData = getAssetTrendData();

  // 今日の累積健康寿命延伸（分）
  const todayLifeMinutes = todayHabits.reduce((sum, habit) => {
    return sum + calculateLifeMinutes(habit.value?.lifeDays || 0);
  }, 0);

  // 今日の累積資産増加
  const todayAssetIncrease = todayHabits.reduce((sum, habit) => {
    return sum + calculateTotalAssetValue(habit.value || {});
  }, 0);

  // 連続記録を計算
  const calculateStreaks = () => {
    if (!habits || habits.length === 0) return { current: 0, longest: 0 };
    
    // 日付でソート（新しい順）
    const sortedDates = [...new Set(habits.map(h => h.date))].sort((a, b) => 
      new Date(b) - new Date(a)
    );
    
    if (sortedDates.length === 0) return { current: 0, longest: 0 };
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;
    
    // 今日の日付
    const today = new Date().toISOString().split('T')[0];
    
    // 現在の連続記録を計算
    if (sortedDates[0] === today || sortedDates[0] === new Date(Date.now() - 86400000).toISOString().split('T')[0]) {
      currentStreak = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        const prevDate = new Date(sortedDates[i - 1]);
        const currDate = new Date(sortedDates[i]);
        const diffDays = Math.floor((prevDate - currDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }
    
    // 最長連続記録を計算
    tempStreak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      const diffDays = Math.floor((prevDate - currDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);
    
    return { current: currentStreak, longest: longestStreak };
  };

  // 曜日別統計を計算
  const calculateWeekdayStats = () => {
    if (!habits || habits.length === 0) return [];
    
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const weekdayData = weekdays.map((day, index) => ({
      day,
      dayIndex: index,
      count: 0,
      habits: {}
    }));
    
    // 選択されたカテゴリーでフィルタリング
    const filteredHabits = selectedStatCategory === 'all' 
      ? habits 
      : habits.filter(h => h.type === selectedStatCategory);
    
    filteredHabits.forEach(habit => {
      const date = new Date(habit.date);
      const dayIndex = date.getDay();
      weekdayData[dayIndex].count++;
      
      // 習慣タイプ別の集計
      if (!weekdayData[dayIndex].habits[habit.type]) {
        weekdayData[dayIndex].habits[habit.type] = 0;
      }
      weekdayData[dayIndex].habits[habit.type]++;
    });
    
    // 最大値を見つける（グラフのスケール用）
    const maxCount = Math.max(...weekdayData.map(d => d.count));
    
    return weekdayData.map(data => ({
      ...data,
      percentage: maxCount > 0 ? (data.count / maxCount) * 100 : 0
    }));
  };

  const streaks = calculateStreaks();
  const weekdayStats = calculateWeekdayStats();

  // カスタム習慣の管理機能
  const handleAddCustomHabit = () => {
    setEditingCustomHabit(null);
    setShowCustomHabitModal(true);
  };

  const handleEditCustomHabit = (habit) => {
    setEditingCustomHabit(habit);
    setShowCustomHabitModal(true);
  };

  const handleDeleteCustomHabit = async (habitId, habitName) => {
    if (!confirm(`「${habitName}」を削除しますか？\n\n削除すると、この習慣の記録は残りますが、編集や新規記録ができなくなります。`)) {
      return;
    }

    try {
      await deleteCustomHabit(habitId);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      alert(`削除に失敗しました: ${error.message}`);
    }
  };

  // デフォルト習慣の編集
  const handleEditDefaultHabit = (habitKey, habitConfig) => {
    console.log('handleEditDefaultHabit called:', { habitKey, habitConfig });
    // デフォルト習慣をカスタム習慣として複製してモーダルを開く
    const customHabitData = {
      name: habitConfig.name,
      icon: habitConfig.icon,
      category: habitConfig.category,
      lifeDays: habitConfig.lifeDays || 0,
      medicalSavings: habitConfig.medicalSavings || 0,
      skillAssets: habitConfig.skillAssets || 0,
      focusHours: habitConfig.focusHours || 0,
      description: habitConfig.description,
      detail: habitConfig.detail,
      isEditingDefault: true,
      originalDefaultKey: habitKey
    };
    console.log('Setting editing custom habit:', customHabitData);
    setEditingCustomHabit(customHabitData);
    setShowCustomHabitModal(true);
  };

  // デフォルト習慣の削除（無効化）
  const handleDeleteDefaultHabit = async (habitKey, habitName) => {
    console.log('handleDeleteDefaultHabit called:', { habitKey, habitName });
    if (!confirm(`「${habitName}」を無効化しますか？\n\n無効化すると習慣リストから非表示になりますが、過去の記録は残ります。設定から再度有効化できます。`)) {
      return;
    }

    try {
      console.log('Calling disableDefaultHabit:', habitKey);
      await disableDefaultHabit(habitKey);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('handleDeleteDefaultHabit error:', error);
      alert(`無効化に失敗しました: ${error.message}`);
    }
  };

  const handleSaveCustomHabit = async (formData) => {
    setCustomHabitLoading(true);
    try {
      if (editingCustomHabit?.isEditingDefault) {
        // デフォルト習慣を編集している場合：新しいカスタム習慣として保存＋元の無効化
        const { isEditingDefault, originalDefaultKey, ...cleanFormData } = formData;
        await addCustomHabit(cleanFormData);
        await disableDefaultHabit(originalDefaultKey);
      } else if (editingCustomHabit) {
        // 既存のカスタム習慣を更新
        await updateCustomHabit(editingCustomHabit.id, formData);
      } else {
        // 新しいカスタム習慣を追加
        await addCustomHabit(formData);
      }
      setShowCustomHabitModal(false);
      setEditingCustomHabit(null);
    } catch (error) {
      throw error;
    } finally {
      setCustomHabitLoading(false);
    }
  };

  // 統計データのフィルタリング
  const getFilteredStats = () => {
    if (selectedStatCategory === 'all') {
      return {
        habits: habits || [],
        title: '全習慣',
        data: trendData || []
      };
    }
    
    const filteredHabits = (habits || []).filter(h => h && h.type === selectedStatCategory);
    const habitConfig = habitTypes[selectedStatCategory];
    
    return {
      habits: filteredHabits,
      title: habitConfig?.name || '選択された習慣',
      data: getHabitSpecificTrendData(selectedStatCategory)
    };
  };

  // 特定習慣の推移データ生成
  const getHabitSpecificTrendData = (habitType) => {
    const filteredHabits = habits.filter(h => h && h.type === habitType);
    
    const dateGroups = {};
    let cumulativeCount = 0;
    
    const sortedHabits = [...filteredHabits].sort((a, b) => {
      const dateA = a && a.date ? new Date(a.date) : new Date(0);
      const dateB = b && b.date ? new Date(b.date) : new Date(0);
      return dateA - dateB;
    });
    
    sortedHabits.forEach(habit => {
      if (!habit || !habit.date) {
        return;
      }
      
      const date = habit.date;
      cumulativeCount++;
      dateGroups[date] = cumulativeCount;
    });

    return Object.entries(dateGroups).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }),
      totalValue: count,
      count: count
    }));
  };

  if (loading || customHabitsLoading || preferencesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">データを読み込み中...</p>
        </div>
      </div>
    );
  }

  const filteredStats = getFilteredStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold">LifeStock</h1>
            <div className="flex items-center space-x-2">
              <img 
                src={user?.photoURL} 
                alt={user?.displayName} 
                className="w-8 h-8 rounded-full"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <button
                onClick={onLogout}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="ログアウト"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
          <p className="opacity-90">今日の良い行動が、未来の財産になる</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-sm opacity-75">
              こんにちは、{user?.displayName?.split(' ')[0] || 'ユーザー'}さん
            </p>
            {isMockMode && (
              <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full">
                デモモード
              </span>
            )}
          </div>
        </div>

        {/* 成功メッセージ */}
        {showSuccessMessage && (
          <div className="bg-green-500 text-white p-4 text-center">
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle size={20} />
              <span className="font-bold">今日もお疲れ様でした！</span>
            </div>
            <p className="text-sm mt-1">良い習慣の積み重ねが未来を変えます✨</p>
          </div>
        )}

        {/* エラー表示 */}
        {(error || customHabitsError) && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 m-4">
            <p className="text-red-700 text-sm">{error || customHabitsError}</p>
          </div>
        )}

        {/* タブナビゲーション */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('record')}
            className={`flex-1 py-3 px-4 text-center font-medium ${
              activeTab === 'record' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500'
            }`}
          >
            記録
          </button>
          <button
            onClick={() => setActiveTab('assets')}
            className={`flex-1 py-3 px-4 text-center font-medium ${
              activeTab === 'assets' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500'
            }`}
          >
            資産
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-3 px-4 text-center font-medium ${
              activeTab === 'stats' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500'
            }`}
          >
            統計
          </button>
        </div>

        {/* 記録タブ */}
        {activeTab === 'record' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">今日の習慣記録</h2>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
              />
            </div>

            {/* 使い方説明 */}
            <div className="bg-blue-50 rounded-lg p-3 mb-4 border border-blue-200">
              <p className="text-blue-800 text-sm">
                💡 <strong>操作方法</strong>: 習慣ボタンをタップしてON/OFFを切り替えできます。変更後は「変更を登録」で確定してください。
              </p>
            </div>

            {/* 習慣ボタン */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {Object.entries(allHabitTypes).map(([habitKey, habit]) => {
                const isCompleted = todayCompletedHabits.includes(habitKey) && !pendingRemovals.some(r => r.type === habitKey);
                const isPending = pendingHabits.some(h => h.type === habitKey);
                const isPendingRemoval = pendingRemovals.some(r => r.type === habitKey);
                
                // 状態に応じたスタイルを決定
                const getButtonStyle = () => {
                  if (isPendingRemoval) {
                    return 'bg-red-200 text-red-700 border-2 border-red-400';
                  } else if (isCompleted || isPending) {
                    return 'bg-green-200 text-green-700 border-2 border-green-400';
                  } else {
                    return 'bg-gray-100 text-gray-600 border-2 border-gray-300 hover:bg-gray-200';
                  }
                };

                const getIcon = () => {
                  if (isPendingRemoval) return '❌';
                  if (isCompleted || isPending) return '✅';
                  return habit.icon;
                };

                const getStatusText = () => {
                  if (isPendingRemoval) return '削除予定';
                  if (isPending) return '追加予定';
                  if (isCompleted) return '完了済み';
                  return habit.description;
                };
                
                return (
                  <div key={habitKey} className="relative">
                    <button
                      onClick={() => toggleHabit(habitKey)}
                      className={`w-full p-4 rounded-xl font-medium shadow-lg transform transition-all hover:scale-105 active:scale-95 ${getButtonStyle()}`}
                    >
                      <div className="text-2xl mb-1">
                        {getIcon()}
                      </div>
                      <div className="text-sm">{habit.name}</div>
                      <div className="text-xs mt-1 opacity-80">
                        {getStatusText()}
                      </div>
                    </button>
                    
                    {/* 編集・削除ボタン */}
                    <div className="absolute top-1 right-1 flex space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (habit.isCustom) {
                            const customHabit = customHabits.find(h => h.id === habit.customId);
                            if (customHabit) handleEditCustomHabit(customHabit);
                          } else {
                            // デフォルト習慣の編集
                            handleEditDefaultHabit(habitKey, habit);
                          }
                        }}
                        className="p-1 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full shadow-sm transition-all"
                        title="編集"
                      >
                        <Edit2 size={12} className="text-gray-600" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (habit.isCustom) {
                            const customHabit = customHabits.find(h => h.id === habit.customId);
                            if (customHabit) handleDeleteCustomHabit(habit.customId, customHabit.name);
                          } else {
                            // デフォルト習慣の削除（無効化）
                            handleDeleteDefaultHabit(habitKey, habit.name);
                          }
                        }}
                        className="p-1 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full shadow-sm transition-all"
                        title={habit.isCustom ? "削除" : "無効化"}
                      >
                        <Trash2 size={12} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* カスタム習慣追加ボタン */}
            <div className="mb-6">
              <button
                onClick={handleAddCustomHabit}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-all flex items-center justify-center space-x-2"
              >
                <Plus size={20} />
                <span className="font-medium">新しい習慣を追加</span>
              </button>
            </div>

            {/* 変更概要 */}
            {(pendingHabits.length > 0 || pendingRemovals.length > 0) && (
              <div className="bg-yellow-50 rounded-xl p-4 mb-6 border border-yellow-200">
                <h3 className="font-bold text-yellow-800 mb-3">変更内容</h3>
                
                {pendingHabits.length > 0 && (
                  <div className="mb-2">
                    <h4 className="text-green-700 font-medium mb-1">追加予定 ({pendingHabits.length}件)</h4>
                    <div className="text-sm text-green-600">
                      {pendingHabits.map(h => allHabitTypes[h.type]?.name || h.type).join(', ')}
                    </div>
                  </div>
                )}
                
                {pendingRemovals.length > 0 && (
                  <div>
                    <h4 className="text-red-700 font-medium mb-1">削除予定 ({pendingRemovals.length}件)</h4>
                    <div className="text-sm text-red-600">
                      {pendingRemovals.map(h => allHabitTypes[h.type]?.name || h.type).join(', ')}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 今日の実績 */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="font-bold text-gray-800 mb-3">今日の実績</h3>
              {todayHabits.length === 0 ? (
                <p className="text-gray-500 text-center py-4">まだ記録がありません</p>
              ) : (
                <>
                  <div className="bg-blue-50 rounded-lg p-3 mb-3 text-center">
                    <div className="text-blue-800 font-bold text-lg">
                      健康寿命 +{todayLifeMinutes}分
                    </div>
                    <div className="text-blue-600 text-sm">今日の努力で延びた寿命</div>
                  </div>
                  <div className="space-y-2">
                    {todayHabits.map((habit) => {
                      const config = allHabitTypes[habit.type];
                      return (
                        <div key={habit.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                          <div className="flex items-center">
                            <span className="text-xl mr-3 w-6 text-center">
                              {config?.icon || '📝'}
                            </span>
                            <span className="font-medium">{config?.name || habit.type}</span>
                          </div>
                          <div className="text-right text-sm text-gray-600">
                            {habit.value?.lifeDays && (
                              <div>健康寿命+{calculateLifeMinutes(habit.value.lifeDays)}分</div>
                            )}
                            {habit.value?.medicalSavings && <div>医療費-¥{habit.value.medicalSavings}</div>}
                            {habit.value?.skillAssets && <div>スキル+¥{habit.value.skillAssets}</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* 登録ボタン */}
            {(pendingHabits.length > 0 || pendingRemovals.length > 0) && (
              <button
                onClick={registerChanges}
                disabled={registering}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed mb-4"
              >
                {registering ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>更新中...</span>
                  </div>
                ) : (
                  `変更を登録 (追加${pendingHabits.length}件 / 削除${pendingRemovals.length}件)`
                )}
              </button>
            )}

            {/* 資産確認ボタン */}
            {todayHabits.length > 0 && (
              <button
                onClick={() => setActiveTab('assets')}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform transition-all hover:scale-105 active:scale-95 flex items-center justify-center space-x-2"
              >
                <span>未来資産を確認！</span>
                <ArrowRight size={20} />
              </button>
            )}
          </div>
        )}

        {/* 資産タブ */}
        {activeTab === 'assets' && (
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">あなたの未来資産</h2>
            
            {/* 総資産価値 */}
            <div className="mb-6 p-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl text-white text-center relative">
              <div className="text-lg font-bold mb-2">総資産価値</div>
              <div className="text-4xl font-bold">
                ¥{calculateTotalAssetValue(assets).toLocaleString()}
              </div>
              <div className="text-sm opacity-90 mt-2">
                あなたの努力が生み出した価値
              </div>
              {todayAssetIncrease > 0 && (
                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  +¥{todayAssetIncrease.toLocaleString()}
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <div className="asset-card bg-gradient-to-r from-red-400 to-pink-500 relative">
                <div className="flex items-center mb-2">
                  <Heart className="mr-2" size={24} />
                  <span className="font-bold">健康寿命</span>
                </div>
                <div className="text-3xl font-bold">+{calculateLifeMinutes(assets.lifeDays || 0)}分</div>
                <div className="text-sm opacity-90">習慣による寿命延伸</div>
                {todayLifeMinutes > 0 && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    +{todayLifeMinutes}分
                  </div>
                )}
              </div>

              <div className="asset-card bg-gradient-to-r from-green-400 to-green-500 relative">
                <div className="flex items-center mb-2">
                  <DollarSign className="mr-2" size={24} />
                  <span className="font-bold">医療費削減</span>
                </div>
                <div className="text-3xl font-bold">¥{(assets.medicalSavings || 0).toLocaleString()}</div>
                <div className="text-sm opacity-90">予防効果による節約</div>
                {todayHabits.some(h => h.value?.medicalSavings) && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    +¥{todayHabits.reduce((sum, h) => sum + (h.value?.medicalSavings || 0), 0)}
                  </div>
                )}
              </div>

              <div className="asset-card bg-gradient-to-r from-blue-400 to-blue-500 relative">
                <div className="flex items-center mb-2">
                  <Brain className="mr-2" size={24} />
                  <span className="font-bold">スキル資産</span>
                </div>
                <div className="text-3xl font-bold">¥{(assets.skillAssets || 0).toLocaleString()}</div>
                <div className="text-sm opacity-90">将来収入期待値</div>
                {todayHabits.some(h => h.value?.skillAssets) && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    +¥{todayHabits.reduce((sum, h) => sum + (h.value?.skillAssets || 0), 0)}
                  </div>
                )}
              </div>

              <div className="asset-card bg-gradient-to-r from-purple-400 to-purple-500 relative">
                <div className="flex items-center mb-2">
                  <Clock className="mr-2" size={24} />
                  <span className="font-bold">集中時間資産</span>
                </div>
                <div className="text-3xl font-bold">{(assets.focusHours || 0).toFixed(1)}時間</div>
                <div className="text-sm opacity-90">蓄積された集中力</div>
                {todayHabits.some(h => h.value?.focusHours) && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    +{todayHabits.reduce((sum, h) => sum + (h.value?.focusHours || 0), 0).toFixed(1)}h
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 統計タブ */}
        {activeTab === 'stats' && (
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">継続統計</h2>
            
            {/* カテゴリー選択 */}
            <div className="mb-6">
              <label className="text-sm text-gray-600 mb-2 block">表示する習慣</label>
              <select
                value={selectedStatCategory}
                onChange={(e) => setSelectedStatCategory(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">全ての習慣</option>
                {Object.entries(allHabitTypes).map(([key, habit]) => (
                  <option key={key} value={key}>
                    {habit.icon} {habit.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* 基本統計 */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-orange-50 p-4 rounded-xl text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-orange-100 rounded-full -mr-10 -mt-10 opacity-50"></div>
                <div className="relative z-10">
                  <div className="text-2xl font-bold text-orange-600">
                    {streaks.current}
                  </div>
                  <div className="text-sm text-orange-800">現在の連続記録</div>
                  {streaks.longest > 0 && (
                    <div className="text-xs text-orange-600 mt-1">
                      最長: {streaks.longest}日
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-green-600">
                  {selectedStatCategory === 'all' 
                    ? (habits ? habits.length : 0)
                    : (habits ? habits.filter(h => h.type === selectedStatCategory).length : 0)
                  }
                </div>
                <div className="text-sm text-green-800">
                  {selectedStatCategory === 'all' ? '総実行回数' : '実行回数'}
                </div>
              </div>
            </div>
            
            {/* グラフ表示エリア */}
            {filteredStats.data && filteredStats.data.length > 0 ? (
              <div className="mb-6">
                <h3 className="font-bold text-gray-800 mb-3">
                  {filteredStats.title}の推移
                </h3>
                <div className="bg-white rounded-xl p-4 shadow-sm" style={{ height: '200px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={filteredStats.data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="date" 
                        fontSize={12}
                        tick={{ fill: '#666' }}
                      />
                      <YAxis 
                        fontSize={12}
                        tick={{ fill: '#666' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey={selectedStatCategory === 'all' ? 'totalValue' : 'count'}
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        dot={{ fill: '#3B82F6', r: 4 }}
                        name={selectedStatCategory === 'all' ? '総資産価値' : '実行回数'}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-8 mb-6 text-center">
                <p className="text-gray-500">データがまだありません</p>
                <p className="text-gray-400 text-sm mt-2">習慣を記録すると、グラフが表示されます</p>
              </div>
            )}
            
            {/* 習慣別実行回数 */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-bold text-gray-800 mb-3">習慣別実行回数</h3>
              {habits && habits.length > 0 ? (
                Object.entries(allHabitTypes)
                  .map(([key, habit]) => {
                    const count = habits.filter(h => h && h.type === key).length;
                    const totalInputDays = getStats().totalDays;
                    const percentage = totalInputDays > 0 
                      ? Math.round((count / totalInputDays) * 100) 
                      : 0;
                    return { key, habit, count, percentage };
                  })
                  .filter(item => item.count > 0)
                  .sort((a, b) => b.count - a.count)
                  .map(({ key, habit, count, percentage }, index) => (
                    <div key={key} className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center">
                          <span className="text-lg mr-2">{habit.icon}</span>
                          <span className="font-medium">{habit.name}</span>
                          {index === 0 && (
                            <span className="ml-2 text-xs bg-yellow-400 text-yellow-800 px-2 py-0.5 rounded-full">
                              TOP
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-blue-600">{count}回</span>
                          <span className="text-xs text-gray-500 ml-1">({percentage}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  習慣を記録して統計を確認しましょう
                </p>
              )}
            </div>
            
            {/* 曜日別傾向分析 */}
            {weekdayStats.some(d => d.count > 0) && (
              <div className="mt-6">
                <h3 className="font-bold text-gray-800 mb-4">曜日別傾向分析</h3>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="grid grid-cols-7 gap-2">
                    {weekdayStats.map((data, index) => {
                      const isToday = new Date().getDay() === index;
                      const hasData = data.count > 0;
                      
                      return (
                        <div key={data.day} className="text-center">
                          <div className={`text-sm font-medium mb-2 ${
                            isToday ? 'text-blue-600 font-bold' : 'text-gray-600'
                          }`}>
                            {data.day}
                          </div>
                          <div className="relative h-24 bg-gray-100 rounded-lg overflow-hidden">
                            {hasData && (
                              <div 
                                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-500 to-blue-400 transition-all duration-500"
                                style={{ height: `${data.percentage}%` }}
                              >
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">
                                    {data.count}
                                  </span>
                                </div>
                              </div>
                            )}
                            {!hasData && (
                              <div className="h-full flex items-center justify-center">
                                <span className="text-gray-400 text-xs">0</span>
                              </div>
                            )}
                          </div>
                          {isToday && (
                            <div className="mt-1">
                              <div className="w-2 h-2 bg-blue-600 rounded-full mx-auto"></div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* 曜日別の最も多い習慣 */}
                  {selectedStatCategory === 'all' && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-600 mb-2">曜日別の人気習慣</div>
                      <div className="grid grid-cols-7 gap-1 text-xs">
                        {weekdayStats.map((data) => {
                          const topHabit = Object.entries(data.habits)
                            .sort(([,a], [,b]) => b - a)[0];
                          
                          return (
                            <div key={data.day} className="text-center">
                              {topHabit ? (
                                <div className="text-lg" title={allHabitTypes[topHabit[0]]?.name}>
                                  {allHabitTypes[topHabit[0]]?.icon || '📝'}
                                </div>
                              ) : (
                                <div className="text-gray-300">-</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-3 text-xs text-gray-500 text-center">
                    {weekdayStats.reduce((max, d) => d.count > max.count ? d : max).day}曜日が最も活発です
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* カスタム習慣モーダル */}
        <CustomHabitModal
          isOpen={showCustomHabitModal}
          onClose={() => {
            setShowCustomHabitModal(false);
            setEditingCustomHabit(null);
          }}
          onSave={handleSaveCustomHabit}
          editingHabit={editingCustomHabit}
          loading={customHabitLoading}
        />
      </div>
    </div>
  );
};

export default HealthAssetTracker;