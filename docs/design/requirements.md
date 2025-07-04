# Repos-Manager 要件定義書

## 概要

本Repositoryは[Project Manager](https://marketplace.visualstudio.com/items?itemName=alefragnani.project-manager)の課題を解決し、より使いやすいGitリポジトリ管理を提供するRepos-Managerという新たなVS Code拡張機能開発のためのリポジトリです。

### Project Managerの課題

- タグは手動設定が必要で、リポジトリが増えると管理が困難
- 検索・フィルタリング機能が限定的
- リポジトリの状態や活動状況が一目で分からない

## 機能要件

### 1. リポジトリ検知・分析機能

以下の項目を検知・分析します（手動更新）：

#### 基本情報

1. **主体言語** - ファイル拡張子とコード量から判定
2. **Runtime環境** - package.json、requirements.txt等から検出
3. **データベース種類** - 設定ファイルや依存関係から検出
4. **依存関係・キーワード** - package.json、Gemfile等から抽出
5. **ライセンス** - LICENSE ファイルから検出

#### Git情報

1. **Fork状態** - GitHub/GitLab APIで判定
2. **所有者** - リモートURLから判定（自分/他人）
3. **ブランチ情報** - アクティブブランチと総ブランチ数
4. **最終コミット日時**
5. **未コミット変更の有無**
6. **リモート同期状態** - ahead/behindの状況

#### プロジェクト規模・品質

1. **プロジェクトサイズ** - ファイル数、総行数
2. **README品質** - README.mdの存在と充実度
3. **テストカバレッジ** - テストファイルの存在
4. **CI/CD設定** - GitHub Actions、Jenkins等の設定ファイル

### 2. 高度なフィルタリング・検索機能

#### 標準フィルター

- 上記検知項目によるフィルタリング
- **ユーザー定義タグ** - 手動で設定可能なカスタムタグ
- **お気に入り** - 頻繁に使用するリポジトリのマーク（⭐アイコン表示）
- **アーカイブ状態** - 非アクティブなプロジェクトの分類

#### 高度な検索

- **ファイル名検索** - README、package.json等の主要ファイル内検索
- **基本パターン検索** - 単純なキーワードマッチング
- **日付範囲検索** - 最終更新日、作成日での絞り込み
- **サイズ範囲検索** - プロジェクトサイズでの絞り込み

#### スマート検索

- **技術スタック検索** - 言語・フレームワークでの類似検索
- **検索履歴** - 過去の検索条件を保存・再利用

### 3. リッチなサイドバー表示

#### 基本表示項目

1. **リポジトリ/フォルダアイコン** - Gitリポジトリは`source-repository`、フォルダは`folder`、お気に入りは`star`付き
2. **主体言語アイコン** - [Simple Icons](https://simpleicons.org/)を使用（`<typescript>`, `<python>`等）
3. **フォルダ名** - ローカルパス名
4. **Git状態** - 未コミット変更がある場合は`*`付きブランチ名（例：`*main`）
5. **最終更新日時** - 相対時間で表示、最近更新は`<fire>`アイコン付き
6. **新しいウィンドウボタン** - マウスオーバー時に`[<open-in-new>]`ボタンを右端に表示

#### マウスオーバー時の追加アクション

- **詳細ツールチップ表示** - マウスオーバー時に以下の詳細情報をツールチップで表示：
  - フルパス、README内容（最初の1行）
  - Git状態（ブランチ名、ahead/behind、未コミット変更）
  - プロジェクト規模（ファイル数、総行数、サイズ）
  - 技術情報（主体言語、Runtime環境、ライセンス）
  - 状態情報（お気に入り状態、Fork/Own状態）
  - 品質情報（テスト・CI/CD設定、依存関係パッケージ数）
  - 最新コミット情報（メッセージ、日時）
  - クイックアクション（ホームページ、エクスプローラー、ターミナル、更新）
- **新しいウィンドウで開く** ボタン - 項目の右端に表示されるボタン。クリックすると新しいウィンドウでフォルダを開く
- **使用技術スタック表示** - [shields.io](https://shields.io/)を利用したバッジで言語やフレームワークを表示

##### 項目のクリック動作

- **「新しいウィンドウで開く」ボタン以外をクリック**: 現在のウィンドウでフォルダを開く
- **「新しいウィンドウで開く」ボタンをクリック**: 新しいウィンドウでフォルダを開く

#### 表示カスタマイズ

- **設定画面アクセス** - REPOSITORIESヘッダーの設定アイコン（`<cog>`）をクリックしてVS Code設定の拡張機能セクションを開く
- **表示項目の選択** - 各項目の表示/非表示切り替え
- **ソート機能** - ソートアイコン（`<sort>`）をクリックして以下の順序で表示順を切り替え：
  1. **更新日順（新しい順）** - 最終更新日時で降順ソート（デフォルト）
  2. **開いた履歴順** - 最近アクセスしたリポジトリを上位表示
  3. **フォルダ名順** - アルファベット順でソート
  4. **言語名順** - 主体言語のアルファベット順でソート
  5. **使用技術順** - Runtime環境・フレームワーク順でソート
- **表示モード** - デフォルトは情報豊富なコンパクト表示（フォルダアイコン、主体言語アイコン、フォルダ名、Git状態、更新日時を1行で表示）。マウスオーバーで詳細情報をツールチップ形式で表示し、右端に「新しいウィンドウで開く」ボタンが表示される。
- **グループ表示** - グループ表示切り替えボタンで以下の3つのモードを切り替え可能：
  1. **フラット表示** - 全リポジトリを単一リストで表示
  2. **言語別グループ** - 主体言語ごとにグループ化して表示
  3. **技術別グループ** - 使用技術スタック（フレームワーク）ごとにグループ化して表示

##### ヘッダーアイコン機能

- **更新アイコン** (`<refresh>`) - リポジトリリストの手動更新
- **検索アイコン** (`<magnify>`) - 検索・フィルター機能の起動
- **表示切り替えアイコン** (`<view-list>`) - グループ表示モードの切り替え
- **ソートアイコン** (`<sort>`) - 表示順序の切り替え（更新日順 → 履歴順 → フォルダ名順 → 言語名順 → 技術順 → 更新日順の順で切り替え）
- **設定アイコン** (`<cog>`) - VS Code設定画面（拡張機能セクション）を開く

### 3.1. アイコン体系・UI設計

#### アイコンライブラリ

- **メインアイコン**: [Material Design Icons](https://pictogrammers.com/library/mdi/) を基本として使用
- **言語アイコン**: [Simple Icons](https://simpleicons.org/) を使用（TypeScript、Python等）

#### 基本アイコン定義

- **リポジトリ**: `source-repository`
- **お気に入りリポジトリ**: `source-repository` + `star`
- **フォルダ**: `folder`
- **お気に入りフォルダ**: `folder` + `star`
- **最近更新**: `fire` (炎のアイコン)
- **ローディング**: `sync` (回転アニメーション付き)

#### ヘッダーアイコン

- **更新ボタン**: `refresh`
- **検索ボタン**: `magnify` (虫眼鏡アイコン)
- **グループ表示切り替え**: `view-list` (フラット ⇔ 言語別 ⇔ 技術別)
- **ソートボタン**: `sort` (ソートアイコン、表示順序切り替え)
- **設定ボタン**: `cog` (歯車アイコン)
- **新しいウィンドウで開く**: `open-in-new` (外部リンクアイコン)

#### 色彩設計

- **Git Decoration**: VS Code標準のファイル状態に基づく色分けを利用
- **エラー**: `errorForeground`
- **警告**: `list.warningForeground`
- **ハイライト**: `list.highlightForeground`

### 4. プロジェクト管理機能

#### リポジトリ登録・管理

- **手動スキャン** - 指定フォルダ内のGitリポジトリを手動でスキャン
- **更新ボタン** - サイドバーに更新ボタンを配置し、必要時に情報を更新
- **手動登録** - Git管理下にないフォルダも含め、任意のフォルダを手動でリストに追加
- **登録解除** - 不要になったフォルダをリストから削除
- **選択的更新** - 特定のリポジトリのみを個別に更新

#### 基本プロジェクト管理

- **クイックアクセス** - 最近使用したリポジトリへの高速アクセス
- **カスタマイズ表示** - リポジトリ表示順序やグループ化の設定保存

#### プロジェクト分析

- **アクティビティ履歴** - リポジトリへのアクセス頻度記録
- **使用統計** - 最も使用される言語・フレームワークの統計
- **健康状態チェック** - 長期間更新されていないプロジェクトの警告

### 5. 拡張性・カスタマイズ機能

#### 基本設定

1. **スキャン対象ルートフォルダ** - 複数フォルダの指定
2. **除外設定** - 特定フォルダ・パターンの除外
3. **スキャン深度** - 検索階層の制限
4. **更新時の処理範囲** - 軽量更新（基本情報のみ）/完全更新（全項目）の選択

#### 高度な設定

1. **カスタムアイコン** - 言語・フレームワーク別のアイコン設定
2. **カラーテーマ** - 状態表示色のカスタマイズ
3. **ショートカット** - よく使う操作のキーバインド設定
4. **更新通知** - 手動更新完了時の通知設定

#### API・連携機能

1. **GitHub/GitLab連携** - API経由での詳細情報取得
2. **GitHubページ表示** - リポジトリのWebページを直接開く
3. **エクスポート機能** - リポジトリリストのCSV/JSON出力
4. **インポート機能** - 他のツールからの設定移行

### 6. パフォーマンス・ユーザビリティ

#### パフォーマンス

- **高速起動** - 初回起動時の応答性向上のためのキャッシュ機能
- **キャッシュベース読み込み** - 前回スキャン結果をキャッシュして即座に表示
- **背景スキャン** - キャッシュ表示後に差分スキャンを背景実行
- **差分更新** - 変更されたリポジトリのみを再スキャンして効率化
- **段階的スキャン** - 軽量→詳細の段階的な情報取得
- **オンデマンド処理** - 必要な時のみ情報を更新
- **バックグラウンド処理** - UIブロックを避けた非同期処理

#### ユーザビリティ

- **クイックアクセス** - 最近使用したリポジトリへの高速アクセス
- **キーボードナビゲーション** - マウスを使わない操作
- **コンテキストメニュー** - 右クリックでの豊富な操作メニュー
- **ドラッグ&ドロップ** - ファイルエクスプローラーとの連携
- **手動追加UI** - フォルダ選択ダイアログによる簡単登録
- **更新進捗表示** - スキャン中のプログレスバー表示

### 7. キャッシュ・パフォーマンス要件

#### 7.1. 起動パフォーマンス

##### 高速起動戦略

1. **キャッシュファースト**: 前回スキャン結果のキャッシュを最優先で読み込み
2. **即座表示**: キャッシュデータを使用してUI表示を高速化（< 500ms）
3. **背景更新**: 表示完了後に差分スキャンを背景で実行
4. **無停止UI**: スキャン中もUIの操作性を維持

##### キャッシュ戦略

1. **ファイルベースキャッシュ**: JSON形式でローカルファイルシステムに保存
2. **バージョン管理**: キャッシュフォーマットのバージョン管理と互換性保証
3. **設定変更検知**: スキャン対象ディレクトリ変更時のキャッシュ無効化
4. **有効期限管理**: 設定可能なキャッシュ有効期限（デフォルト24時間）

#### 7.2. 差分スキャン機能

##### 変更検知メカニズム

1. **ディレクトリタイムスタンプ**: フォルダの最終更新時刻による変更検知
2. **パス存在チェック**: リポジトリの削除・移動を検知
3. **新規リポジトリ検知**: 新しく追加されたリポジトリを発見
4. **選択的再分析**: 変更されたリポジトリのみを再分析

##### スキャン最適化

1. **並列処理**: 複数リポジトリの同時分析
2. **早期終了**: 変更がない場合のスキップ処理
3. **プログレッシブスキャン**: 軽量情報→詳細情報の段階的取得
4. **エラー回復**: スキャンエラー時の継続処理

#### 7.3. ユーザー体験設計

##### ローディング状態

1. **ローディングインジケーター**: スキャン進行状況の視覚的表示
2. **進捗バー**: 全体進捗とリポジトリ単位の詳細進捗
3. **キャンセル機能**: 長時間スキャンの中断機能
4. **状態メッセージ**: 現在の処理内容をユーザーに通知

##### 空状態対応

1. **初回セットアップ支援**: リポジトリが見つからない場合のガイダンス
2. **自動パス検知**: 一般的なリポジトリ保存場所の自動検出
3. **手動フォルダ追加**: フォルダ選択ダイアログによる追加機能
4. **設定画面アクセス**: ワンクリックで設定画面へアクセス

#### 7.4. キャッシュ管理設定

##### ユーザー設定可能項目

```json
{
  "reposManager.cache.enabled": true,
  "reposManager.cache.maxAge": 86400,
  "reposManager.cache.backgroundScan": true,
  "reposManager.cache.cleanupOnStartup": true,
  "reposManager.performance.parallelScan": true,
  "reposManager.performance.maxConcurrency": 5
}
```

1. **キャッシュ有効/無効**: キャッシュ機能の制御
2. **キャッシュ有効期限**: 秒単位での有効期限設定
3. **背景スキャン**: 背景での差分スキャンの有効/無効
4. **起動時クリーンアップ**: 無効キャッシュの自動削除
5. **並列スキャン**: 複数リポジトリの同時処理
6. **最大同時処理数**: システム負荷制御のための上限設定

## 技術的課題と対応策

### 🚨 技術的に困難・課題がある機能

#### 1. データベース種類の自動検出

**課題**: 設定ファイルから確実にDB種類を判定するのは困難

**対応策**:

- 主要なDB（MySQL、PostgreSQL、MongoDB等）の設定ファイルパターンのみ対応
- 不明な場合は「Unknown」と表示
- 将来的にはユーザーによる手動設定を優先

#### 2. README品質の自動判定

**課題**: 品質の評価基準が主観的で自動化が困難

**対応策**:

- 単純な指標のみ使用（文字数、セクション数、リンク数）
- 「高/中/低」の3段階評価に簡略化
- 完全自動化ではなく参考値として提供

#### 3. 検索機能のパフォーマンス

**課題**: 大量のファイルがある場合、検索が非常に重くなる

**対応策**:

- 検索対象をREADME、package.json等の主要ファイルに限定
- ファイルサイズ制限を設ける（例：1MB以下）
- 検索のタイムアウト設定（10秒）

#### 4. GitHub/GitLab API制限

**課題**: API レート制限により大量リポジトリの処理が困難

**対応策**:

- APIアクセスは必要最小限に限定
- レート制限に達した場合の適切なエラーハンドリング
- ローカル情報を優先し、APIは補助的に使用

### ⚠️ パフォーマンス上の制約

#### 1. プロジェクトサイズ計算

**制約**: 大規模プロジェクト（10万ファイル以上）で処理時間が長くなる

**対応策**:

- ファイル数上限設定（デフォルト：10,000ファイル）
- タイムアウト設定（デフォルト：30秒）
- 段階的処理：基本情報→詳細情報の順

#### 2. 同時処理数の制限

**制約**: 多数のリポジトリを同時処理するとメモリ不足

**対応策**:

- 同時処理数を制限（デフォルト：5リポジトリ）
- 処理キューシステムの実装
- メモリ使用量のモニタリング

### 🔒 セキュリティ上の考慮事項

#### 1. プライベートリポジトリ対応

**課題**: アクセス権限の適切な管理

**対応策**:

- VS Code Secretsを使用したトークン管理
- 権限エラー時の適切な表示
- ローカルファイルアクセスのみでも基本機能は動作

#### 2. APIトークンの安全性

**対応策**:

- トークンの暗号化保存
- 必要最小限の権限のみ要求
- トークンの有効期限チェック

### 📋 機能の優先度調整

#### Phase 4に移行する機能

- **依存関係の可視化** → **関連プロジェクト分析**に簡略化
- **全文検索・正規表現検索** → **基本的なファイル名検索**に簡略化
- **類似プロジェクト検索** → **技術スタック検索**に簡略化

## 実装優先度

### Phase 1: 基本機能（MVP）

- 基本的なリポジトリスキャン・表示（手動更新）
- 主体言語の検知
- 基本的なフィルタリング
- シンプルなサイドバー表示
- 更新ボタンの実装

### Phase 2: 検索・フィルタ強化

- 高度な検索機能
- Git情報の表示
- お気に入り・タグ機能
- 表示カスタマイズ

### Phase 3: 基本プロジェクト管理・分析機能

- **空状態での自動パス検知・フォルダ追加機能**
- **キャッシュベース高速起動** - 前回スキャン結果の保存・読み込み
- **背景差分スキャン** - UI表示後の背景での変更検知・更新
- UI/UXの最適化(画面設計書ベース)
- 現段階でのリファクタリング
- 基本プロジェクト管理機能
- リポジトリアクティビティ追跡
- 使用統計・健康状態チェック
- 外部API連携（GitHub/GitLab）
- パフォーマンス最適化（段階的スキャン）

### Phase 4: 高度な機能

- 関連プロジェクト分析の高度化
- 高度なセキュリティ機能
- エンタープライズ向け機能
- 高度なGitHub/GitLab API活用

## 技術仕様

### 対応環境

- **VS Code**: 1.80.0以上
- **Node.js**: 18.0以上
- **OS**: Windows、macOS、Linux

### 使用技術

- **フレームワーク**: TypeScript、VS Code Extension API
- **ビルドツール**: webpack、esbuild
- **テスト**: Jest、VS Code Test API
- **パッケージマネージャー**: npm/yarn

### データ保存

- **設定**: VS Code Settings API
- **キャッシュ**: ローカルファイルシステム
- **認証情報**: VS Code Secrets API

## ライセンス・配布

- **ライセンス**: MIT License
- **配布方法**: VS Code Marketplace
- **オープンソース**: GitHub公開リポジトリ

## 関連ドキュメント

- [詳細設計書](./detailed-design.md) - システム構成、データモデル、API設計等の技術仕様
- [画面設計書](./ui-design.md) - UI/UX設計、画面レイアウト、アクセシビリティ対応
