import React from 'react';
import { LogIn } from 'lucide-react';

const LoginScreen = ({ onSignIn, loading, error }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* ロゴ・タイトル */}
        <div className="mb-8">
          <div className="text-6xl mb-4">📈</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            LifeStock
          </h1>
          <p className="text-gray-600">
            健康習慣を未来資産に変換
          </p>
        </div>

        {/* 説明 */}
        <div className="mb-8 text-left">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            今日の良い行動が、未来の財産になる
          </h2>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🏃‍♂️</span>
              <span>運動で健康寿命を延ばす</span>
            </div>
            <div className="flex items-center">
              <span className="text-2xl mr-3">📚</span>
              <span>学習でスキル資産を蓄積</span>
            </div>
            <div className="flex items-center">
              <span className="text-2xl mr-3">💰</span>
              <span>予防で医療費を削減</span>
            </div>
            <div className="flex items-center">
              <span className="text-2xl mr-3">⏰</span>
              <span>集中力で時間資産を構築</span>
            </div>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* ログインボタン */}
        <button
          onClick={onSignIn}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl shadow-lg transform transition-all hover:scale-105 active:scale-95 flex items-center justify-center space-x-3"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>ログイン中...</span>
            </>
          ) : (
            <>
              <LogIn size={20} />
              <span>Googleでログイン</span>
            </>
          )}
        </button>

        {/* 注意事項 */}
        <p className="mt-6 text-xs text-gray-500">
          Googleアカウントでログインすることで、
          <br />
          利用規約とプライバシーポリシーに同意したものとみなします
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
