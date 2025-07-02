# Copilot Instructions - Repos Manager Project

## 現在の作業状況 (2025-07-02 作業開始)

### 完了した作業

- [DOCS] requirements.md: 要件定義書のリファクタリングと機能拡充
- [DOCS] detailed-design.md: 詳細設計書の新規作成（システム構成、データモデル、API設計）
- [DOCS] ui-design.md: 画面設計書の新規作成（UI/UX原則、画面レイアウト、アクセシビリティ）
- [DOCS] DEVELOPMENT_RULES.md: 開発・実装ルールの策定
- [CONFIG] .github/copilot-instructions.md: 作業状況管理ファイルの初期化
- [SETUP] package.json、tsconfig.json、webpack.config.js、eslint.config.mjs、jest.config.jsの設定完了
- [SETUP] src/ディレクトリ構造とtests/ディレクトリの作成
- [CORE] src/types/index.ts: 主要型定義の実装
- [CORE] src/extension.ts: 拡張機能エントリーポイントの実装
- [CORE] src/core/RepositoryManager.ts: リポジトリ管理クラスの実装
- [SERVICE] src/services/ConfigurationService.ts: 設定サービスの実装
- [SERVICE] src/services/GitService.ts: Gitサービスの実装
- [SERVICE] src/services/RepositoryAnalyzer.ts: リポジトリ分析サービスの実装
- [SERVICE] src/services/FavoriteService.ts: お気に入り管理サービスの実装
- [UI] src/ui/ReposManagerProvider.ts: ツリービュープロバイダーの実装
- [COMPLETE] ESLintエラーの完全解消（23→0個達成！）
- [COMPLETE] Jestテスト実行成功（7テスト全通過）
- [COMPLETE] 拡張機能のパッケージング・VS Codeインストール成功！
- [COMPLETE] Phase 1 MVP動作確認完了（リポジトリ表示・主体言語検知OK）
- [COMPLETE] Phase 1.5 検索・フィルターUI実装完了（QuickPick方式採用）
- [COMPLETE] Phase 2 進捗バー・フィードバック機能実装完了（詳細進捗表示、キャンセル対応）
- [COMPLETE] Phase 2 ローディング・空状態UI実装完了（スピナー表示、空状態メッセージ）

### 進行中の作業

**Phase 3 設計変更：ワークスペース → フィルタープロファイル機能**

- ✅ requirements.md フィルタープロファイル機能の詳細設計完了
- ✅ detailed-design.md FilterProfileManagerコンポーネント設計完了
- ✅ ui-design.md フィルタープロファイル管理画面設計完了
- ✅ phase3-workspace-management.md 設計変更内容反映完了
- 🚧 実装ファイル（WorkspaceManager.ts等）のリファクタリング作業
- ⭕ package.json コマンド定義の更新
- ⭕ extension.ts フィルタープロファイル機能統合
- ⭕ 既存ワークスペース実装の段階的移行

### 次の予定

- [REFACTOR] WorkspaceManager.ts → FilterProfileManager.ts への実装変更
- [UPDATE] extension.ts フィルタープロファイル機能の統合
- [UPDATE] package.json コマンド定義の更新（workspace → profile）
- [MIGRATION] 既存ワークスペースデータのマイグレーション機能
- [TEST] フィルタープロファイル機能の動作確認・UI/UXテスト
- [ENHANCEMENT] パフォーマンス最適化・仮想化機能
- [POLISH] UI/UX改善項目の実装

### 技術的課題・メモ

- 🎉 Phase 1 MVP達成！リポジトリスキャン・表示・主体言語検知が動作確認済み
- 🎉 Phase 2 完了！進捗バー・ローディング・空状態UI実装完了
- ローディング中スピナー（$(loading~spin)）とメッセージ表示が動作確認済み
- 空状態時の分かりやすい案内表示が動作確認済み
- 設計ドキュメントと実装の整合性は保たれている
- ESLintルール適用済み、コード品質は良好
- UI/UX改善項目は .issue/ui-improvements.md で管理
- 5回のファイル変更ごとに本ファイルの更新が必要

## プロジェクト概要

**目的**: Project Managerの課題を解決する新しいVS Code拡張「Repos-Manager」の開発

**主要機能**:
- リポジトリの自動検知・分析
- 高度なフィルタリング・検索
- リッチなサイドバー表示（コンパクトモードをデフォルト）
- プロジェクト管理・ワークスペース機能

**各種基本情報**:
- 設計フォルダ : '/docs/design'
- Issueフォルダ : '/.issue'

## 重要な開発ルール

1. **コミット規約**: `[prefix] 英語メッセージ` 形式を厳守
2. **コメント**: マジックナンバーは必ず説明、その他は最小限
3. **作業記録**: 5回のファイル変更ごとに本ファイルを更新
4. **問題管理**: 困ったことは`.issue`ディレクトリに記録
5. **品質**: ESLintエラー0、型エラー0を維持
6. **CIルール**: コンパイル及びパッケージング・Vscodeへのインストールが成功したら、コミットを作成してプッシュ
7. **Issueルール**: `.issue`ディレクトリに問題を記録し、定期的に更新
    1. 問題に遭遇したら速やかにissueファイルを作成
    2. 定期的に未解決のissueを確認・更新
    3. 解決済みのissueは削除せず、参考資料として保持。但しファイル名にprefixとしてclose--を追加
    4. 状況はステータス:に記載。但し完了とする場合はすべて[x]となっている事

## ファイル変更カウンター

現在の変更数: 0/5 ← **リセット完了**

**最新変更履歴**:
1. requirements.md: フィルタープロファイル管理機能の詳細仕様追加
2. ui-design.md: ワークスペース管理画面 → フィルタープロファイル管理画面への設計変更
3. .issue/phase3-workspace-management.md: フィルタープロファイル機能への設計変更完了
4. .github/copilot-instructions.md: 進行状況・予定をフィルタープロファイル対応に更新
5. (次回変更予定)

---
*Last Updated: 2025-07-02*
*Next Update Required: 5回のファイル変更後*
