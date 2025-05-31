# LifeStock - 健康習慣資産トラッカー

健康・学習習慣を "未来の資産" として可視化するWebアプリケーションです。
毎日の良い行動を数値化し、健康寿命の延伸・医療費削減・スキル向上による将来収入を計算します。

## 🎯 特徴

- **習慣の資産化**: 運動、勉強、睡眠などの習慣を金銭価値・寿命延伸に換算
- **リアルタイム同期**: Firebaseによるマルチデバイス対応
- **視覚的な成長**: グラフで資産の積み上がりを確認
- **簡単記録**: ワンタップで習慣を記録
- **統計機能**: 継続日数や効果を分析

## 🛠️ 技術スタック

- **フロントエンド**: React 18 + Vite
- **スタイリング**: Tailwind CSS
- **認証**: Firebase Auth (Google OAuth)
- **データベース**: Firestore
- **グラフ**: Recharts
- **ホスティング**: Firebase Hosting

## 🚀 セットアップ

### 1. 依存関係をインストール

```bash
npm install
```

### 2. Firebase プロジェクトの設定

1. [Firebase Console](https://console.firebase.google.com/) で新しいプロジェクトを作成
2. Authentication を有効化し、Google認証を設定
3. Firestore データベースを作成
4. Web アプリを追加し、設定情報を取得

### 3. 環境変数の設定

```bash
cp .env.example .env
```

`.env` ファイルにFirebaseの設定情報を入力：

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### 4. Firebase CLI の設定

```bash
npm install -g firebase-tools
firebase login
firebase use your-project-id
```

### 5. Firestore セキュリティルールとインデックスをデプロイ

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### 6. 開発サーバーを起動

```bash
npm run dev
```

## 📁 プロジェクト構造

```
src/
├── components/
│   ├── HealthAssetTracker.jsx    # メインアプリコンポーネント
│   └── LoginScreen.jsx           # ログイン画面
├── hooks/
│   ├── useAuth.js                # 認証フック
│   └── useHabits.js              # 習慣データ管理フック
├── config/
│   └── firebase.js               # Firebase設定
├── utils/
│   └── habitTypes.js             # 習慣タイプと価値計算
└── index.css                     # スタイル
```

## 🔧 主要機能

### 習慣記録
- 10種類の健康・学習習慣をワンタップで記録
- 日付別の記録管理
- 一括登録機能

### 資産可視化
- 健康寿命延伸（日数）
- 医療費削減額（円）
- スキル資産価値（円）
- 集中時間蓄積（時間）

### 統計・分析
- 継続日数と実行回数
- 資産価値の推移グラフ
- 習慣別実行回数

## 📊 データベース設計

### users コレクション
```javascript
{
  email: "user@example.com",
  displayName: "田中太郎",
  assets: {
    lifeDays: 28.2,
    medicalSavings: 42000,
    skillAssets: 93000,
    focusHours: 82
  }
}
```

### users/{userId}/habits コレクション
```javascript
{
  type: "exercise",
  duration: 30,
  date: "2024-05-31",
  value: {
    lifeDays: 0.02,
    medicalSavings: 60,
    focusHours: 0.5
  }
}
```

## 🚀 デプロイ

### Firebase Hosting へのデプロイ

```bash
npm run build
firebase deploy
```

## 📝 開発・運用

### 開発時の注意点
- Firestore のセキュリティルールは本番環境で必須
- 環境変数は `.env` ファイルで管理（Gitにコミットしない）
- エラーハンドリングを適切に実装

### 今後の拡張可能性
- カスタム習慣の追加機能
- 目標設定・進捗管理
- ソーシャル機能（友人との共有）
- プッシュ通知
- データエクスポート機能

## 📄 ライセンス

このプロジェクトはMITライセンスのもとで公開されています。

## 🤝 コントリビューション

プルリクエストやイシューの報告を歓迎します。
