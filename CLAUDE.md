# カスタム習慣登録機能の実装

## 目標
LifeStockアプリにユーザーがオリジナル習慣を登録できる機能を追加する。ユーザーが習慣名、アイコン、効果値（金銭価値・健康寿命）を設定し、既存の習慣システムと統合する。

## 技術要件
- React + Firebase/モック対応
- 既存のhabitTypesとの互換性維持
- レスポンシブUI（Tailwind CSS）
- データ永続化対応

## 実装する機能

### 1. データ構造設計
```typescript
interface CustomHabit {
  id: string;
  name: string;
  icon: string; // 絵文字
  category: 'health' | 'learning' | 'focus' | 'mental' | 'custom';
  description: string;
  detail: string;
  lifeDays: number; // 1日あたりの健康寿命延伸（日）
  medicalSavings: number; // 1日あたりの医療費削減（円）
  skillAssets: number; // 1日あたりのスキル資産価値（円）
  focusHours: number; // 1日あたりの集中時間（時間）
  createdAt: Date;
  userId: string;
}
2. 必要なファイル修正・追加
A. /src/components/CustomHabitModal.jsx（新規作成）

カスタム習慣登録・編集モーダル
フォームバリデーション
アイコン選択UI（絵文字ピッカー風）
効果値入力（数値入力+プレビュー）

B. /src/hooks/useCustomHabits.js（新規作成）

カスタム習慣のCRUD操作
Firebase/モック対応
既存habitTypesとの統合

C. /src/utils/habitTypes.js（修正）

カスタム習慣との統合ロジック
動的習慣リスト生成

D. /src/components/HealthAssetTracker.jsx（修正）

カスタム習慣管理UI追加
「習慣を追加」ボタン
カスタム習慣の表示・編集・削除

3. UI実装詳細
カスタム習慣登録モーダル
┌─────────────────────────────────┐
│ ✨ 新しい習慣を追加              │
├─────────────────────────────────┤
│ 習慣名: [テキスト入力]            │
│ アイコン: [🏃‍♂️] [選択ボタン]        │ 
│ カテゴリ: [ドロップダウン]         │
│ 説明: [テキストエリア]            │
│                                │
│ 💰 効果設定                     │
│ ├ 健康寿命: [0.01] 日/回        │
│ ├ 医療費削減: [50] 円/回         │
│ ├ スキル価値: [0] 円/回          │
│ └ 集中時間: [0.5] 時間/回        │
│                                │
│ [キャンセル] [保存]              │
└─────────────────────────────────┘
記録画面への統合

既存習慣ボタンの下に「+ カスタム習慣」セクション
カスタム習慣の編集・削除ボタン
「新しい習慣を追加」ボタン

4. 実装順序

データ層: useCustomHabits.jsでCRUD機能
UI層: CustomHabitModal.jsxでフォーム作成
統合層: habitTypes.js修正で既存システム統合
メイン画面: HealthAssetTracker.jsxにUI追加
モック対応: useMockData.jsにカスタム習慣対応
テスト: 追加・編集・削除・記録の動作確認

5. 技術的考慮事項
Firebase実装

Firestore: users/{userId}/customHabits/{habitId}
セキュリティルール更新
リアルタイム同期

モック実装

localStorage風の永続化シミュレーション
ユーザー別データ分離

バリデーション

習慣名: 1-20文字、必須
効果値: 0以上の数値
アイコン: 絵文字のみ許可、空でもOK

6. エラーハンドリング

ネットワークエラー対応
入力値検証
重複名チェック
削除確認ダイアログ

実装開始コマンド
最初にuseCustomHabits.jsから実装を開始し、段階的に機能を追加してください。既存コードとの互換性を保ちながら、モジュール化された設計で進めてください。
