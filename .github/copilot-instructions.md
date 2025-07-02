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

- [TEST] ✅ ビルド・パッケージング成功 - 次は動作確認・UI/UXテスト
- [FIX] ESLintエラー段階的解消（109個→目標0個）
  - 主要パターン: template expressions（多数）、nullish coalescing（多数）、complexity（2個）、member ordering（多数）
- [MIGRATION] 既存ワークスペースデータのマイグレーション機能
- [ENHANCEMENT] パフォーマンス最適化・仮想化機能
- [POLISH] UI/UX改善項目の実装
- [ENHANCEMENT] パフォーマンス最適化・仮想化機能
- [POLISH] UI/UX改善項目の実装
- [REFACTOR] 型エラー完全解消（imports, any型、non-null assertion等）

### 技術的課題・メモ

- 🎉 Phase 1 MVP達成！リポジトリスキャン・表示・主体言語検知が動作確認済み
- 🎉 Phase 2 完了！進捗バー・ローディング・空状態UI実装完了
- 🎉 Phase 3 Phase A完了！フィルタープロファイル基盤実装・ワークスペース削除完了
- 🎉 Phase 3 エントリーポイント完全クラス化完了！1ファイル1クラス原則適用済み
- 🔧 FilterProfileManager.ts複雑度問題解決！関数分割で25→20以下実現
- ✅ ビルド・パッケージング成功！vsixファイル生成・インストール可能状態達成
- ✅ VS Codeインストール成功！動作確認可能状態達成
- ローディング中スピナー（$(loading~spin)）とメッセージ表示が動作確認済み
- 空状態時の分かりやすい案内表示が動作確認済み
- フィルタープロファイル作成・管理・インポート・エクスポート関数実装完了
- 設計ドキュメントと実装の整合性は保たれている
- ESLintエラー109個（90エラー+19警告）- 動作には影響しないが品質改善要
- UI/UX改善項目は .issue/ui-improvements.md で管理
- 5回のファイル変更ごとに本ファイルの更新が必要
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
   - コミットする直前にはCI系コマンドを実行し、品質チェックを行う
2. **コメント**:
   - マジックナンバーは必ず説明、その他は最小限
   - JsDoc遵守
3. **作業記録**: 5回のファイル変更ごとに本ファイルを更新し、コミット・プッシュを行う。
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
   - メソッドやfunctionの戻り値は明記する事
   - メソッドやフィールド、プロパティ、クラスの前には必ずpublicやprivateを記述すること
   - eslintのエラーは無視せずしっかり解決する事
   - クラス系のファイル名はパスカルケースにすること 例: `FilterProfileManager.ts`、`RepositoryAnalyzer.ts`
   - 関数系のファイル名はキャメルケースにすること 例: `getRepositoryList.ts`、`filterRepositories.ts`
   - 型定義ファイルは `index.ts` としてまとめること
   - 型定義ファイルは `src/types/` 以下に配置すること
   - 1ファイル1クラス又は1ファイル1関数を基本とする(但し型はこの限りではない)
   - アンダースコアプレフィックス使用禁止
   - Eslintルール変更禁止
6. **CIルール**:
   - **完全版**: ドキュメント・機能完了時は `npm run ci:install` でフル品質チェック後にコミット・プッシュ
   - **簡易版**: 一時的なコード変更は `npm run ci` でlint・コンパイル・パッケージングが成功したらコミット・プッシュ
   - **クイック版**: 単純な修正は `npm run lint` が成功したらコミット可能
   - **待機ルール**:
     - CI系コマンド実行時は1分待機を確実にしてターミナル状況を確認
     - この確認にechoを使ってはならない、なぜならComplete等のメッセージでechoした場合クリアしたと誤認識する為だ
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
9. **CIスクリプト**:
   - `npm run ci:install`: フル品質チェック + VS Codeインストール
   - `npm run ci`: lint + コンパイル + パッケージング
   - `npm run lint:fix`: lintのみ
10. **テストルール**:
    - Jestを使用したユニットテストを実装
    - テストは `/tests` 以下に配置
    - テストはCI実行時に自動で実行される

## ファイル変更カウンター

現在の変更数: 1/5 ← **次回更新は5回のファイル変更後**

**最新変更履歴**:

1. .github/copilot-instructions.md: ファイル変更カウンターリセット・進捗・技術課題セクション更新
2. （次回変更予定）
3. （次回変更予定）
4. （次回変更予定）
5. （次回変更予定）

---

_Last Updated: 2025-07-03_
_Next Update Required: 5回のファイル変更後_
