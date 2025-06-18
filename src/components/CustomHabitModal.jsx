import React, { useState, useEffect } from 'react';
import { X, Sparkles, Heart, DollarSign, Brain, Clock, Smile } from 'lucide-react';

const EMOJI_OPTIONS = [
  '', // 絵文字なしオプション
  '⭐', '🏃‍♂️', '📚', '🧘‍♂️', '💪', '🎯', '🌅', '🍎', '💧', '🚶‍♂️',
  '📖', '✍️', '🎨', '🎵', '🧠', '💤', '🕐', '🔥', '✨', '🌟',
  '🎪', '🎭', '🎨', '🎯', '🎲', '🎳', '🎸', '🎹', '🎺', '🎻',
  '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏓', '🏸', '🥊', '🥋',
  '🧘', '🤸', '🏋️', '🚴', '🏊', '🏃', '⛹️', '🤾', '🏌️', '🏇'
];

const CATEGORY_OPTIONS = [
  { value: 'health', label: '健康', icon: '❤️' },
  { value: 'learning', label: '学習', icon: '📚' },
  { value: 'focus', label: '集中', icon: '🎯' },
  { value: 'mental', label: 'メンタル', icon: '🧘‍♂️' },
  { value: 'custom', label: 'その他', icon: '⭐' }
];

const CustomHabitModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  editingHabit = null,
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    icon: '',
    category: 'custom',
    description: '',
    detail: '',
    lifeMinutes: 0,
    medicalSavings: 0,
    skillAssets: 0,
    focusHours: 0
  });
  
  const [errors, setErrors] = useState({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // 編集モード時にフォームデータを設定
  useEffect(() => {
    if (editingHabit) {
      setFormData({
        name: editingHabit.name || '',
        icon: editingHabit.icon || '',
        category: editingHabit.category || 'custom',
        description: editingHabit.description || '',
        detail: editingHabit.detail || '',
        lifeMinutes: Math.round((editingHabit.lifeDays || 0) * 24 * 60), // 日を分に変換
        medicalSavings: editingHabit.medicalSavings || 0,
        skillAssets: editingHabit.skillAssets || 0,
        focusHours: editingHabit.focusHours || 0
      });
    } else {
      setFormData({
        name: '',
        icon: '',
        category: 'custom',
        description: '',
        detail: '',
        lifeMinutes: 0,
        medicalSavings: 0,
        skillAssets: 0,
        focusHours: 0
      });
    }
    setErrors({});
  }, [editingHabit, isOpen]);

  // バリデーション
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = '習慣名を入力してください';
    } else if (formData.name.length > 20) {
      newErrors.name = '習慣名は20文字以内で入力してください';
    }

    const numericFields = [
      { key: 'lifeMinutes', label: '健康寿命' },
      { key: 'medicalSavings', label: '医療費削減' },
      { key: 'skillAssets', label: 'スキル価値' },
      { key: 'focusHours', label: '集中時間' }
    ];

    numericFields.forEach(({ key, label }) => {
      const value = formData[key];
      if (value !== '' && (isNaN(value) || value < 0)) {
        newErrors[key] = `${label}は0以上の数値を入力してください`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // エラーをクリア
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      setErrors({ submit: error.message });
    }
  };

  const handleEmojiSelect = (emoji) => {
    setFormData(prev => ({ ...prev, icon: emoji }));
    setShowEmojiPicker(false);
  };

  // 効果プレビューを計算
  const calculatePreview = () => {
    const lifeMinutes = formData.lifeMinutes || 0;
    const totalAssetValue = (formData.medicalSavings || 0) + 
                           (formData.skillAssets || 0) + 
                           (formData.focusHours || 0) * 100;
    
    return { lifeMinutes, totalAssetValue };
  };

  const preview = calculatePreview();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Sparkles className="text-purple-600" size={24} />
            <h2 className="text-xl font-bold text-gray-800">
              {editingHabit ? '習慣を編集' : '新しい習慣を追加'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 基本情報 */}
          <div className="space-y-4">
            <h3 className="font-bold text-gray-800">基本情報</h3>
            
            {/* 習慣名 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                習慣名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="例: 朝のヨガ"
                maxLength={20}
                disabled={loading}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                {formData.name.length}/20文字
              </p>
            </div>

            {/* アイコン選択 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                アイコン
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={loading}
                >
                  <span className="text-2xl w-8 text-center">
                    {formData.icon || '📝'}
                  </span>
                  <span className="text-gray-600">
                    {formData.icon ? '変更する' : 'アイコンを選択'}
                  </span>
                  <Smile size={20} className="text-gray-400" />
                </button>
                
                {showEmojiPicker && (
                  <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10 w-80">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      アイコンを選択
                    </h4>
                    <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto">
                      {EMOJI_OPTIONS.map((emoji, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleEmojiSelect(emoji)}
                          className="p-2 text-xl hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
                          title={emoji === '' ? 'アイコンなし' : emoji}
                        >
                          {emoji === '' ? (
                            <span className="text-xs text-gray-500 font-medium">なし</span>
                          ) : (
                            emoji
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* カテゴリー */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                カテゴリー
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={loading}
              >
                {CATEGORY_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.icon} {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 説明 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                簡単な説明
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="例: 10分間のヨガ"
                disabled={loading}
              />
            </div>
          </div>

          {/* 効果設定 */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="text-green-600" size={20} />
              <h3 className="font-bold text-gray-800">効果設定</h3>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-blue-800 text-sm">
                💡 1回実行したときの効果を入力してください
              </p>
            </div>

            {/* 健康寿命 */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Heart className="text-red-500" size={16} />
                <span>健康寿命延伸（分）</span>
              </label>
              <input
                type="number"
                min="0"
                value={formData.lifeMinutes}
                onChange={(e) => handleInputChange('lifeMinutes', e.target.value)}
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.lifeMinutes ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="15"
                disabled={loading}
              />
              {errors.lifeMinutes && (
                <p className="text-red-500 text-sm mt-1">{errors.lifeMinutes}</p>
              )}
            </div>

            {/* 医療費削減 */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="text-green-500" size={16} />
                <span>医療費削減（円）</span>
              </label>
              <input
                type="number"
                min="0"
                value={formData.medicalSavings}
                onChange={(e) => handleInputChange('medicalSavings', e.target.value)}
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.medicalSavings ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="50"
                disabled={loading}
              />
              {errors.medicalSavings && (
                <p className="text-red-500 text-sm mt-1">{errors.medicalSavings}</p>
              )}
            </div>

            {/* スキル資産 */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Brain className="text-blue-500" size={16} />
                <span>スキル資産価値（円）</span>
              </label>
              <input
                type="number"
                min="0"
                value={formData.skillAssets}
                onChange={(e) => handleInputChange('skillAssets', e.target.value)}
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.skillAssets ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="100"
                disabled={loading}
              />
              {errors.skillAssets && (
                <p className="text-red-500 text-sm mt-1">{errors.skillAssets}</p>
              )}
            </div>

            {/* 集中時間 */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Clock className="text-purple-500" size={16} />
                <span>集中時間（時間）</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.focusHours}
                onChange={(e) => handleInputChange('focusHours', e.target.value)}
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.focusHours ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.5"
                disabled={loading}
              />
              {errors.focusHours && (
                <p className="text-red-500 text-sm mt-1">{errors.focusHours}</p>
              )}
            </div>
          </div>

          {/* プレビュー */}
          {(preview.lifeMinutes > 0 || preview.totalAssetValue > 0) && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
              <h4 className="font-bold text-gray-800 mb-2 flex items-center">
                <Sparkles size={16} className="mr-1 text-purple-600" />
                効果プレビュー
              </h4>
              <div className="space-y-2 text-sm">
                {preview.lifeMinutes > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">健康寿命延伸:</span>
                    <span className="font-bold text-red-600">+{preview.lifeMinutes}分</span>
                  </div>
                )}
                {preview.totalAssetValue > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">資産価値合計:</span>
                    <span className="font-bold text-green-600">¥{preview.totalAssetValue.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* エラーメッセージ */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* ボタン */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>保存中...</span>
                </div>
              ) : (
                editingHabit ? '更新' : '保存'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomHabitModal;