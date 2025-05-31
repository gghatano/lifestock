import React, { useState } from 'react';
import { Plus, TrendingUp, Calendar, Award, Heart, Brain, DollarSign, Clock, LogOut, User } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useHabits } from '../hooks/useHabits';
import { habitTypes, calculateTotalAssetValue } from '../utils/habitTypes';

const HealthAssetTracker = ({ user, onLogout }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('record');
  const [pendingHabits, setPendingHabits] = useState([]);
  const [registering, setRegistering] = useState(false);

  const { 
    habits, 
    assets, 
    loading, 
    error, 
    addHabits, 
    getHabitsForDate, 
    getStats, 
    getAssetTrendData 
  } = useHabits(user?.uid);

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

  // 保留中の習慣を削除
  const removePendingHabit = (habitId) => {
    setPendingHabits(prev => prev.filter(h => h.id !== habitId));
  };

  // 習慣を登録
  const registerHabits = async () => {
    if (pendingHabits.length === 0) return;

    try {
      setRegistering(true);
      await addHabits(pendingHabits);
      setPendingHabits([]);
    } catch (error) {
      console.error('Registration failed:', error);
    } finally {
      setRegistering(false);
    }
  };

  const todayHabits = getHabitsForDate(selectedDate);
  const stats = getStats();
  const trendData = getAssetTrendData();

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
          <p className="text-sm opacity-75 mt-1">
            こんにちは、{user?.displayName?.split(' ')[0] || 'ユーザー'}さん
          </p>
        </div>

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

            {/* 習慣ボタン */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {Object.entries(habitTypes).map(([key, habit]) => (
                <button
                  key={key}
                  onClick={() => addPendingHabit(key)}
                  className="btn-secondary"
                >
                  <div className="text-2xl mb-1">{habit.icon}</div>
                  <div className="text-sm">{habit.name}</div>
                </button>
              ))}
            </div>

            {/* 保留中の習慣 */}
            {pendingHabits.length > 0 && (
              <div className="bg-yellow-50 rounded-xl p-4 mb-6 border border-yellow-200">
                <h3 className="font-bold text-yellow-800 mb-3">登録待ちの習慣</h3>
                <div className="space-y-2">
                  {pendingHabits.map((habit) => {
                    const config = habitTypes[habit.type];
                    return (
                      <div key={habit.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                        <div className="flex items-center">
                          <span className="text-xl mr-3">{config.icon}</span>
                          <span className="font-medium">{config.name}</span>
                        </div>
                        <button
                          onClick={() => removePendingHabit(habit.id)}
                          className="text-red-500 hover:text-red-700 font-bold"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 今日の記録 */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="font-bold text-gray-800 mb-3">今日の実績</h3>
              {todayHabits.length === 0 ? (
                <p className="text-gray-500 text-center py-4">まだ記録がありません</p>
              ) : (
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
                          {habit.value?.lifeDays && <div>寿命+{habit.value.lifeDays}日</div>}
                          {habit.value?.medicalSavings && <div>医療費-¥{habit.value.medicalSavings}</div>}
                          {habit.value?.skillAssets && <div>スキル+¥{habit.value.skillAssets}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 登録ボタン */}
            {pendingHabits.length > 0 && (
              <button
                onClick={registerHabits}
                disabled={registering}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {registering ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>登録中...</span>
                  </div>
                ) : (
                  `登録する (${pendingHabits.length}件)`
                )}
              </button>
            )}
          </div>
        )}

        {/* 資産タブ */}
        {activeTab === 'assets' && (
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">あなたの未来資産</h2>
            
            {/* 総資産価値 */}
            <div className="mb-6 p-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl text-white text-center">
              <div className="text-lg font-bold mb-2">総資産価値</div>
              <div className="text-4xl font-bold">
                ¥{calculateTotalAssetValue(assets).toLocaleString()}
              </div>
              <div className="text-sm opacity-90 mt-2">
                あなたの努力が生み出した価値
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="asset-card bg-gradient-to-r from-red-400 to-pink-500">
                <div className="flex items-center mb-2">
                  <Heart className="mr-2" size={24} />
                  <span className="font-bold">健康寿命</span>
                </div>
                <div className="text-3xl font-bold">+{(assets.lifeDays || 0).toFixed(1)}日</div>
                <div className="text-sm opacity-90">習慣による寿命延伸</div>
              </div>

              <div className="asset-card bg-gradient-to-r from-green-400 to-green-500">
                <div className="flex items-center mb-2">
                  <DollarSign className="mr-2" size={24} />
                  <span className="font-bold">医療費削減</span>
                </div>
                <div className="text-3xl font-bold">¥{(assets.medicalSavings || 0).toLocaleString()}</div>
                <div className="text-sm opacity-90">予防効果による節約</div>
              </div>

              <div className="asset-card bg-gradient-to-r from-blue-400 to-blue-500">
                <div className="flex items-center mb-2">
                  <Brain className="mr-2" size={24} />
                  <span className="font-bold">スキル資産</span>
                </div>
                <div className="text-3xl font-bold">¥{(assets.skillAssets || 0).toLocaleString()}</div>
                <div className="text-sm opacity-90">将来収入期待値</div>
              </div>

              <div className="asset-card bg-gradient-to-r from-purple-400 to-purple-500">
                <div className="flex items-center mb-2">
                  <Clock className="mr-2" size={24} />
                  <span className="font-bold">集中時間資産</span>
                </div>
                <div className="text-3xl font-bold">{(assets.focusHours || 0).toFixed(1)}時間</div>
                <div className="text-sm opacity-90">蓄積された集中力</div>
              </div>
            </div>
          </div>
        )}

        {/* 統計タブ */}
        {activeTab === 'stats' && (
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">継続統計</h2>
            
            {/* 資産推移グラフ */}
            {trendData.length > 1 && (
              <div className="mb-6 bg-white rounded-xl p-4 border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-4">資産価値の推移</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#666"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="#666"
                        fontSize={12}
                        tickFormatter={(value) => `¥${Math.floor(value/1000)}k`}
                      />
                      <Tooltip 
                        formatter={(value) => [`¥${value.toLocaleString()}`, '総資産価値']}
                        labelStyle={{ color: '#333' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="totalValue" 
                        stroke="#3B82F6" 
                        strokeWidth={3}
                        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2, fill: '#fff' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalDays}</div>
                <div className="text-sm text-blue-800">継続日数</div>
              </div>
              <div className="bg-green-50 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-green-600">{stats.totalHabits}</div>
                <div className="text-sm text-green-800">総実行回数</div>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-xl text-center mb-6">
              <div className="text-2xl font-bold text-purple-600">{stats.avgHabitsPerDay}</div>
              <div className="text-sm text-purple-800">1日平均実行数</div>
            </div>

            {/* 習慣別実行回数 */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-bold text-gray-800 mb-3">習慣別実行回数</h3>
              {Object.entries(habitTypes).map(([key, habit]) => {
                const count = habits.filter(h => h.type === key).length;
                return count > 0 ? (
                  <div key={key} className="flex items-center justify-between py-2">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">{habit.icon}</span>
                      <span>{habit.name}</span>
                    </div>
                    <span className="font-bold text-blue-600">{count}回</span>
                  </div>
                ) : null;
              })}
              {habits.length === 0 && (
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
