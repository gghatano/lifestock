import React, { useState } from 'react';
import { Plus, TrendingUp, Calendar, Award, Heart, Brain, DollarSign, Clock, LogOut, User, ArrowRight, CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useHabits } from '../hooks/useHabits';
import { useMockHabits } from '../hooks/useMockData';
import { habitTypes, calculateTotalAssetValue, calculateLifeMinutes } from '../utils/habitTypes';

const HealthAssetTracker = ({ user, onLogout }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('record');
  const [pendingHabits, setPendingHabits] = useState([]);
  const [pendingRemovals, setPendingRemovals] = useState([]);
  const [registering, setRegistering] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [selectedStatCategory, setSelectedStatCategory] = useState('all');

  // モックモードとFirebaseモードの切り替え
  const isMockMode = import.meta.env.VITE_MOCK_MODE === 'true';
  const habitsHook = isMockMode ? useMockHabits : useHabits;
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
      id: Date.now(),
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

    console.log('=== 削除処理開始 ===');
    console.log('モックモード:', isMockMode);
    console.log('追加予定:', pendingHabits);
    console.log('削除予定:', pendingRemovals);
    console.log('removeHabits関数:', typeof removeHabits);

    try {
      setRegistering(true);
      
      // 新しい習慣を追加
      if (pendingHabits.length > 0) {
        await addHabits(pendingHabits);
      }
      
      // 習慣を削除
      if (pendingRemovals.length > 0) {
        if (isMockMode) {
          console.log('モック: 習慣を削除しました', pendingRemovals);
        } else {
          // Firebaseの場合は実際の削除処理を実行
          console.log('Firebase: 削除処理実行中...');
          await removeHabits(pendingRemovals);
          console.log('Firebase: 削除処理完了');
        }
      }
      
      setPendingHabits([]);
      setPendingRemovals([]);
      
      // 成功メッセージを表示
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
      
      console.log('=== 削除処理成功 ===');
    } catch (error) {
      console.error('=== 削除処理エラー ===', error);
      console.error('Registration failed:', error);
      // setErrorはコンポーネントにstateがないためコメントアウト
      // setError('削除処理に失敗しました: ' + error.message);
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

  // 統計データのフィルタリング
  const getFilteredStats = () => {
    console.log('getFilteredStats開始 - selectedStatCategory:', selectedStatCategory, 'habits:', habits);
    
    if (selectedStatCategory === 'all') {
      const result = {
        habits: habits || [],
        title: '全習慣',
        data: trendData || []
      };
      console.log('getFilteredStats(全習慣) - result:', result);
      return result;
    }
    
    const filteredHabits = (habits || []).filter(h => h && h.type === selectedStatCategory);
    const habitConfig = habitTypes[selectedStatCategory];
    
    const result = {
      habits: filteredHabits,
      title: habitConfig?.name || '選択された習慣',
      data: getHabitSpecificTrendData(selectedStatCategory)
    };
    
    console.log('getFilteredStats(特定習慣) - result:', result);
    return result;
  };

  // 特定習慣の推移データ生成
  const getHabitSpecificTrendData = (habitType) => {
    console.log('getHabitSpecificTrendData開始 - habitType:', habitType, 'habits:', habits);
    
    const filteredHabits = habits.filter(h => h && h.type === habitType);
    console.log('filteredHabits:', filteredHabits);
    
    const dateGroups = {};
    let cumulativeCount = 0;
    
    const sortedHabits = [...filteredHabits].sort((a, b) => {
      const dateA = a && a.date ? new Date(a.date) : new Date(0);
      const dateB = b && b.date ? new Date(b.date) : new Date(0);
      return dateA - dateB;
    });
    
    sortedHabits.forEach(habit => {
      if (!habit || !habit.date) {
        console.warn('無効なhabitデータ:', habit);
        return;
      }
      
      const date = habit.date;
      cumulativeCount++;
      dateGroups[date] = cumulativeCount;
    });

    const result = Object.entries(dateGroups).map(([date, count]) => {
      const item = {
        date: new Date(date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }),
        totalValue: count,
        count: count
      };
      console.log('habitSpecific resultItem:', item);
      return item;
    });
    
    console.log('getHabitSpecificTrendData完了 - result:', result);
    return result;
  };

  if (loading) {
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
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 m-4">
            <p className="text-red-700 text-sm">{error}</p>
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
              {Object.entries(habitTypes).map(([key, habit]) => {
                const isCompleted = todayCompletedHabits.includes(key) && !pendingRemovals.some(r => r.type === key);
                const isPending = pendingHabits.some(h => h.type === key);
                const isPendingRemoval = pendingRemovals.some(r => r.type === key);
                
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
                  <button
                    key={key}
                    onClick={() => toggleHabit(key)}
                    className={`p-4 rounded-xl font-medium shadow-lg transform transition-all hover:scale-105 active:scale-95 ${getButtonStyle()}`}
                  >
                    <div className="text-2xl mb-1">
                      {getIcon()}
                    </div>
                    <div className="text-sm">{habit.name}</div>
                    <div className="text-xs mt-1 opacity-80">
                      {getStatusText()}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 変更概要 */}
            {(pendingHabits.length > 0 || pendingRemovals.length > 0) && (
              <div className="bg-yellow-50 rounded-xl p-4 mb-6 border border-yellow-200">
                <h3 className="font-bold text-yellow-800 mb-3">変更内容</h3>
                
                {pendingHabits.length > 0 && (
                  <div className="mb-2">
                    <h4 className="text-green-700 font-medium mb-1">追加予定 ({pendingHabits.length}件)</h4>
                    <div className="text-sm text-green-600">
                      {pendingHabits.map(h => habitTypes[h.type].name).join(', ')}
                    </div>
                  </div>
                )}
                
                {pendingRemovals.length > 0 && (
                  <div>
                    <h4 className="text-red-700 font-medium mb-1">削除予定 ({pendingRemovals.length}件)</h4>
                    <div className="text-sm text-red-600">
                      {pendingRemovals.map(h => habitTypes[h.type].name).join(', ')}
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
                      const config = habitTypes[habit.type];
                      return (
                        <div key={habit.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                          <div className="flex items-center">
                            <span className="text-xl mr-3">{config.icon}</span>
                            <span className="font-medium">{config.name}</span>
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
            
            {/* エラー回避のため一時的にシンプル表示 */}
            <div className="bg-blue-50 rounded-xl p-4 mb-6 text-center">
              <div className="text-blue-800 text-lg font-bold">🛠️ メンテナンス中</div>
              <div className="text-blue-600 text-sm mt-2">統計機能を修正中です。しばらくお待ちください。</div>
            </div>
            
            {/* シンプルな統計情報 */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {habits ? new Set(habits.map(h => h.date)).size : 0}
                </div>
                <div className="text-sm text-blue-800">継続日数</div>
              </div>
              <div className="bg-green-50 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-green-600">
                  {habits ? habits.length : 0}
                </div>
                <div className="text-sm text-green-800">総実行回数</div>
              </div>
            </div>
            
            {/* 習慣別実行回数 */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-bold text-gray-800 mb-3">習慣別実行回数</h3>
              {habits && habits.length > 0 ? (
                Object.entries(habitTypes).map(([key, habit]) => {
                  const count = habits.filter(h => h && h.type === key).length;
                  return count > 0 ? (
                    <div key={key} className="flex items-center justify-between py-2">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{habit.icon}</span>
                        <span>{habit.name}</span>
                      </div>
                      <span className="font-bold text-blue-600">{count}回</span>
                    </div>
                  ) : null;
                })
              ) : (
                <p className="text-gray-500 text-center py-4">
                  習慣を記録して統計を確認しましょう
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthAssetTracker;