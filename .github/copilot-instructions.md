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
- ✅ 実装ファイル（WorkspaceManager.ts等）のリファクタリング作業完了
- ✅ package.json コマンド定義の更新完了
- ✅ extension.ts フィルタープロファイル機能統合完了
- ✅ 既存ワークスペース実装の完全削除・置き換え完了
- ✅ ESLintエラー完全解消（28→0個達成！）
- ✅ エントリーポイント完全クラス化・分割完了（ExtensionManager, CommandRegistry, ProgressManager, DialogProvider）
- ✅ src/ui/ReposManagerProvider.ts フィルタープロファイル機能統合完了

### 次の予定

- [TEST] ✅ 完了準備 - 動作確認・UI/UXテスト（ESLintエラー完全解消完了！）
- [TESTING] 手動テスト実行・機能検証（manual-testing-checklist.md参照）
- [ENHANCEMENT] パフォーマンス最適化・仮想化機能
- [POLISH] UI/UX改善項目の実装
- [MIGRATION] 既存ワークスペースデータのマイグレーション機能

### 技術的課題・メモ

- 🎉 Phase 1 MVP達成！リポジトリスキャン・表示・主体言語検知が動作確認済み
- 🎉 Phase 2 完了！進捗バー・ローディング・空状態UI実装完了
- 🎉 Phase 3 Phase A完了！フィルタープロファイル基盤実装・ワークスペース削除完了
- 🎉 Phase 3 エントリーポイント完全クラス化完了！1ファイル1クラス原則適用済み
- 🎉 Phase 3 Phase B完了！ESLintエラー完全解消（109→0個達成）
- 🎉 動作確認準備完了！VS Codeインストール・パッケージング成功
- ✅ ビルド・パッケージング成功！vsixファイル生成・インストール可能状態達成
- ✅ VS Codeインストール成功！動作確認可能状態達成
- ✅ 手動テストチェックリスト作成済み（manual-testing-checklist.md）
- ローディング中スピナー（$(loading~spin)）とメッセージ表示が動作確認済み
- 空状態時の分かりやすい案内表示が動作確認済み
- フィルタープロファイル作成・管理・インポート・エクスポート関数実装完了
- 設計ドキュメントと実装の整合性は保たれている
- UI/UX改善項目は .issue/ui-improvements.md で管理
- 20回のファイル変更ごとに本ファイルの更新が必要
- CommandRegistry, ProgressManager, DialogProvider, ExtensionManagerクラス分割完了

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

1. **コミット規約**:
   - `[prefix] 英語メッセージ` 形式を厳守
2. **コメント**:
   - マジックナンバーは必ず説明、その他は最小限
   - JsDoc遵守
3. **作業記録**: 20回のファイル変更ごとに本ファイルを更新
   - 変更内容は「ファイル変更カウンター」に記録
   - 変更後は必ずCIを実行し、問題がないことを確認
   - CI実行後、`.issue/manual-testing-checklist.md`のステータスを更新
4. **問題管理**:
   - 困ったことは`.issue`ディレクトリに記録
   - CIが完了したら '.issue'ディレクトリの内容を確認し、未完のものに関しては解決・状況変化を記録
   - 解決したら、ファイル名に `close--` を付けて保持（例: `close--issue-123.md`）
   - 解決するには、内容のタスクがすべてクリアしていることが前提
5. **品質**:
   - ESLintエラー0、型エラー0を維持
   - CI実行時は必ず品質チェックを行い、問題があれば修正
   - ケースはeslintのルールに従うこと
   - 型以外は基本的にオブジェクト思考で記述する事。
   - 各クラスは単一責任原則に従い、1つの機能に特化すること
   - 短すぎるメソッドは避け、適切な長さに保つこと
   - functionはできる限り使用しないこと
   - メソッド内でfunctionは定義しないこと
   - eslintのエラーは無視せずしっかり解決する事
   - クラス系のファイル名はパスカルケースにすること 例: `FilterProfileManager.ts`、`RepositoryAnalyzer.ts`
   - 関数系のファイル名はキャメルケースにすること 例: `getRepositoryList.ts`、`filterRepositories.ts`
   - 型定義ファイルは `index.ts` としてまとめること
   - 型定義ファイルは `src/types/` 以下に配置すること
   - 1ファイル1クラス又は1ファイル1関数を基本とする(但し型はこの限りではない)
   - アンダースコアプレフィックス使用禁止
   - Eslintルール変更禁止
7. **Issueルール**: `.issue`ディレクトリに問題を記録し、定期的に更新
   1. 問題に遭遇したら速やかにissueファイルを作成
   2. 定期的に未解決のissueを確認・更新
   3. 解決済みのissueは削除せず、参考資料として保持。但しファイル名にprefixとしてclose--を追加
   4. 状況はステータス:に記載。但し完了とする場合はすべて[x]となっている事
8. **ドキュメントルール**:
   - ドキュメントは `/docs` 以下に配置
   - 各種設計書は `/docs/design` 以下に配置
   - 要件定義書は `/docs/requirements.md`
   - 詳細設計書は `/docs/detailed-design.md`
   - UI設計書は `/docs/ui-design.md`
   - 開発ルールは '.github/copilot-instructions.md'
   - Issueは `.issue` 以下に配置
9. terminalルール
   - eslint, jest, webpack, vscode系のコマンドは必ず `npm run` を使用
   - `npm run`を使用する際ははユーザーに実行してもらう事
   - コマンド実行後は必ず結果を確認し、問題があれば修正

## ファイル変更カウンター

現在の変更数: 5/20 ← **本ファイル更新のタイミング（Phase 3.1 お気に入り・UI/UX修正完了）**

**最新変更履歴**:

1. src/ui/ReposManagerProvider.ts: FavoriteService注入、お気に入り表示（⭐）、contextValue分岐、最近更新ハイライト（🔥）、Git色分け対応
2. src/extension/ExtensionManager.ts: FavoriteService追加、コンストラクタ修正（破損ファイル復元）
3. src/extension/CommandRegistry.ts: お気に入りコマンド修正（TreeItem引数対応、ExtensionManager注入）
4. package.json: 右クリックメニュー修正（repository/repositoryFavorite分岐）
5. .issue/manual-testing-checklist.md: Phase 3.1修正完了項目の更新・ステータス反映

**Phase 3.1 お気に入り・UI/UX修正完了**:
- ✅ FavoriteServiceを正しくReposManagerProviderに注入
- ✅ お気に入りリポジトリに⭐マーク表示（labelに表示）
- ✅ contextValue分岐による右クリックメニュー最適化（repository/repositoryFavorite）
- ✅ ローディングスピナー改善（$(sync~spin)、ThemeColor、詳細メッセージ）
- ✅ 最近更新リポジトリのハイライト（🔥絵文字、1週間以内）
- ✅ Git状態による色分け（resourceUri設定でVS Code装飾適用）
- ✅ ExtensionManager.ts破損ファイル復元完了

**次回変更予定**: VSIXビルド・インストール・機能テスト実行

---

_Last Updated: 2025-07-03_
_Next Update Required: 20回のファイル変更後_
