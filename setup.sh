#!/bin/bash

echo "🚀 LifeStock プロジェクトセットアップスクリプト"
echo "=============================================="

# 1. 依存関係のインストール
echo "📦 依存関係をインストール中..."
npm install

# 2. 環境変数ファイルの作成
if [ ! -f .env ]; then
    echo "📄 環境変数ファイルを作成中..."
    cp .env.example .env
    echo "✅ .env ファイルが作成されました。Firebase設定を入力してください。"
else
    echo "✅ .env ファイルは既に存在します。"
fi

# 3. Firebase CLI のインストール確認
if ! command -v firebase &> /dev/null; then
    echo "🔥 Firebase CLIをインストール中..."
    npm install -g firebase-tools
else
    echo "✅ Firebase CLIは既にインストールされています。"
fi

echo ""
echo "🎉 セットアップ完了！"
echo ""
echo "次のステップ:"
echo "1. .env ファイルにFirebase設定を入力"
echo "2. firebase login でログイン"
echo "3. firebase use your-project-id でプロジェクトを選択"
echo "4. npm run dev で開発サーバーを起動"
echo ""
echo "詳細は README.md をご確認ください。"
