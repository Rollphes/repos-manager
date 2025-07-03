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

**Phase 3.4+ 画面設計書準拠実装完了**

- ✅ package.json設計書準拠（ヘッダーアイコン、コマンド、コンテキストメニュー、設定項目）
- ✅ CommandRegistry新規コマンド実装（toggleGroupView, toggleSort, openHomepage, openInFileExplorer）
- ✅ ReposManagerProvider contextValue修正（folder, folderFavorite対応）
- ✅ UI設計書準拠ツールチップ実装（詳細情報表示、設定ベース🔥アイコン）
- ✅ アイコン体系完全実装（お気に入り=star-full、repository=source-repository、folder=folder）
- ✅ ツールチップ詳細化（README、Git状態、プロジェクト規模、技術情報、クイックアクション）
- ✅ 設計書準拠機能すべて実装完了・ESLintエラー0個達成

### 次の予定

- [TESTING] 設計準拠実装の動作確認・機能検証
- [TESTING] 手動テスト実行・機能検証（manual-testing-checklist.md作成完了）
- [ENHANCEMENT] パフォーマンス最適化・仮想化機能
- [MIGRATION] 既存ワークスペースデータのマイグレーション機能

### 技術的課題・メモ

- 🎉 Phase 1 MVP達成！リポジトリスキャン・表示・主体言語検知が動作確認済み
- 🎉 Phase 2 完了！進捗バー・ローディング・空状態UI実装完了
- 🎉 Phase 3 Phase A完了！フィルタープロファイル基盤実装・ワークスペース削除完了
- 🎉 Phase 3 エントリーポイント完全クラス化完了！1ファイル1クラス原則適用済み
- 🎉 Phase 3 Phase B完了！ESLintエラー完全解消（109→0個達成）
- 🎉 Phase 3.4+ 画面設計書準拠実装完了！package.json準拠、新規コマンド実装、UI設計書準拠アイコン体系、ツールチップ詳細化、ESLint0個達成
- ✅ ビルド・パッケージング成功！vsixファイル生成・インストール可能状態達成
- ✅ VS Codeインストール成功！動作確認可能状態達成
- ✅ 手動テストチェックリスト作成済み（manual-testing-checklist.md）
- キャッシュベーススキャン・自動パス検知・空状態アクションボタンが実装完了
- CacheService・PathDetectionService統合によるパフォーマンス向上実現
- 空状態UI拡張（自動検知・フォルダ追加・設定画面）完了
- 設計ドキュメントと実装の整合性完全達成（package.json、CommandRegistry、ReposManagerProvider）
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
   - 日本語禁止
3. **作業記録**: 20回のファイル変更ごとに本ファイルを更新
   - 変更内容は「ファイル変更カウンター」に記録
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
   - 1ファイル1クラス又は1ファイル1関数を基本とする(但し型はこの限りではない)
   - アンダースコアプレフィックス使用禁止
   - Eslintルール変更禁止
6. **Issueルール**: `.issue`ディレクトリに問題を記録し、定期的に更新
   1. 問題に遭遇したら速やかにissueファイルを作成
   2. 定期的に未解決のissueを確認・更新
   3. 解決済みのissueは削除せず、参考資料として保持。但しファイル名にprefixとしてclose--を追加
   4. 状況はステータス:に記載。但し完了とする場合はすべて[x]となっている事
7. **ドキュメントルール**:
   - ドキュメントは `/docs` 以下に配置
   - 各種設計書は `/docs/design` 以下に配置
   - 要件定義書は `/docs/requirements.md`
   - 詳細設計書は `/docs/detailed-design.md`
   - UI設計書は `/docs/ui-design.md`
   - 開発ルールは '.github/copilot-instructions.md'
   - Issueは `.issue` 以下に配置
8. terminalルール
   - eslint, jest, webpack, vscode系のコマンドは必ず `npm run` を使用
   - `npm run`を使用する際ははユーザーに実行してもらう事
   - コマンド実行後は必ず結果を確認し、問題があれば修正

## ファイル変更カウンター

現在の変更数: 20/20 ← **Icon System Complete Implementation - ESLint 0 Errors Achieved**

**最新変更履歴**:

**Phase 3.5 Critical UI/UX Gap Resolution（アイコンシステム完全実装・ESLintエラー0個達成）**:

12. ReposManagerProvider.ts: ESLintメンバー順序修正（getTreeItem, getChildren位置調整）
13. ReposManagerProvider.ts: 完全emoji削除開始（空状態アクションボタン、ローディングアイテム）
14. ReposManagerProvider.ts: フィルターダイアログemoji完全削除（All Languages, Favorites等）
15. ReposManagerProvider.ts: リポジトリラベルemoji削除（⭐マーク除去、シンプルなname表示）
16. ReposManagerProvider.ts: 時間表示emoji削除（🔥Recent表示に変更、ESLint修正）
17. ReposManagerProvider.ts: ツールチップヘッダーアイコン修正（🔥📁→$(flame)$(folder)、📅→$(calendar)）
18. ReposManagerProvider.ts: README・技術情報アイコン修正（📄→$(book)、🏷️→$(tag)）
19. ReposManagerProvider.ts: ステータス・コミット・クイックアクションアイコン修正（⭐🔗📁📅🌐⌨🔄→$(star-full)$(link)$(folder)$(calendar)$(globe)$(terminal)$(sync)、ESLint修正）
20. FavoriteService.ts: コンソールログemoji削除（🔥→通常ログ、ESLint修正）

**次回変更予定**: 手動テスト実行・機能検証・残りUI/UX問題解決（フィルター機能、ソート・グループビュー、ローディング状態UI改善）

**🎉 重要達成事項**:

- ✅ **完全emoji削除**: UI全体からemoji完全除去（🔥📁⭐🏷️🔗📅🌐⌨🔄等27種類）
- ✅ **Codiconアイコン体系**: VS Code標準アイコン`$(icon-name)`完全適用
- ✅ **ESLintエラー0**: アイコンシステム実装中も品質維持
- ✅ **テスト通過**: 7件全テスト成功、機能保持確認
- ✅ **ビルド成功**: TypeScript型エラー0、コンパイル成功

---

_Last Updated: 2025-07-03_
_Next Update Required: 20回のファイル変更後_
