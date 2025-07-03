# Repos-Manager 画面設計書

## 1. UI/UX設計原則

### ```text
┌──────────────────────────────────────────┐
│ ▾ REPOS MANAGER             <refresh>    │
├──────────────────────────────────────────┤
│ ▾ REPOSITORIES (3)  <magnify> <view-list> <sort> <cog> │
│   <source-repository+star> <typescript> repos-manager *main <fire> 3 days ago [<open-in-new>] │
│   <source-repository> <python> another-project                     [<open-in-new>] │
│   <folder> <javascript> non-git-project                            [<open-in-new>] │
└──────────────────────────────────────────┘
```
1. **最重要**: リポジトリ名、主要言語
2. **重要**: Git状態、最終更新日時
3. **補助**: フルパス、お気に入り状態

### 1.2. 色彩設計 (VS Codeテーマに準拠)

- **Git Decoration**: VS Code標準のファイル状態に基づく色分けを利用 (例: `gitDecoration.modifiedResourceForeground`)
- **エラー**: `errorForeground`
- **警告**: `list.warningForeground`
- **ハイライト**: `list.highlightForeground`

### 1.3. アイコン体系

- **アイコンライブラリ**: [Material Design Icons](https://pictogrammers.com/library/mdi/) を基本として使用する。
- **リポジトリ**: `source-repository`
- **お気に入りのリポジトリ**: `source-repository`の右下に`star`をあわせたもの
- **フォルダ**: `folder`
- **お気に入りのフォルダ**: `folder`の右下に`star`をあわせたもの
- **最近更新**: `fire` (炎のアイコン)
- **ローディング**: `sync` (回転アニメーション付き)
- **更新ボタン**: `refresh`
- **検索ボタン**: `magnify` (虫眼鏡アイコン)
- **グループ表示切り替えボタン**: `view-list` (フラット ⇔ 言語別 ⇔ 技術別の切り替え)
- **ソートボタン**: `sort` (ソートアイコン、設定による順序選択)
- **設定ボタン**: `cog` (歯車アイコン)
- **新しいウィンドウで開く**: `open-in-new` (外部リンクアイコン)
- **言語アイコン**: [Simple Icons](https://simpleicons.org/) の利用を検討 (将来的な機能)

### 1.4. インタラクション設計

- **項目クリック**: 現在のウィンドウでリポジトリ/フォルダを開く
- **右クリック**: コンテキストメニュー表示
- **ホバー**: ツールチップでフルパスや詳細情報を表示

## 2. 画面レイアウト

### 2.1. メインサイドバー (Webview)

Webview を使用して、HTMLとCSSで柔軟なUIを構築する。

#### 2.1.1. 基本レイアウト

```text
┌──────────────────────────────────────────┐
│ ▾ REPOS MANAGER             <refresh>    │
├──────────────────────────────────────────┤
│ ▾ REPOSITORIES (3) <magnify> <view-list> <sort> <cog> │
│   <source-repository+star> <typescript> repos-manager *main <fire> 3 days ago [<open-in-new>] │
│   <source-repository> <python> another-project                     [<open-in-new>] │
│   <folder> <javascript> non-git-project                            [<open-in-new>] │
└──────────────────────────────────────────┘
```

**レイアウト説明:**

- `<magnify>`: 検索ボタン（クリックで検索入力フィールドを表示）
- `<view-list>`: グループ表示切り替えボタン（フラット ⇔ 言語別 ⇔ 技術別の切り替え）
- `<sort>`: ソートボタン（設定・コマンドによる順序選択）
- `<cog>`: 設定ボタン（VS Code設定の拡張機能セクションを開く）
- `<source-repository+star>`: お気に入りリポジトリアイコン
- `<typescript>`: 主体言語アイコン（Simple Icons）
- `repos-manager`: フォルダ名
- `*main`: 未コミット変更がある場合の現在ブランチ名（`*` prefix付き）
- `<fire> 3 days ago`: 最近更新の場合の最終更新日（炎アイコン prefix付き）
- `[<open-in-new>]`: マウスオーバー時に右端に表示される「新しいウィンドウで開く」ボタン

**アイコン機能:**

- **検索アイコン (`<magnify>`)**:
  - クリックで検索・フィルター機能を起動
  - リポジトリ名、フォルダ名、技術スタック、Git状態による絞り込み機能
- **表示切り替えアイコン (`<view-list>`)**:
  - フラット表示 → 言語別グループ → 技術スタック別グループ → フラット表示の順に切り替え
  - 現在の表示モードをツールチップで表示
- **ソートアイコン (`<sort>`)**:
  - クリックでコマンドパレットまたは設定メニューを開く
  - ソート順序は拡張機能設定で選択可能（更新日順、履歴順、フォルダ名順、言語名順、使用技術順）
  - 現在のソート順序をツールチップで表示
- **設定アイコン (`<cog>`)**:
  - VS Code設定の拡張機能セクション（repos-manager）を開く
  - スキャン対象フォルダ、除外パターン、表示設定等を変更可能

#### 2.1.2. 表示モード

- **コンパクト表示 (デフォルト)**
  - 各リポジトリ項目は、以下の順序で1行に表示されます：
    1. リポジトリ/フォルダアイコン（お気に入りの場合は`star`付き）
    2. 主体言語アイコン（Simple Icons）
    3. フォルダ名
    4. 未コミット変更がある場合：`*` + ブランチ名
    5. 最近更新した場合：`<fire>` + 最終更新日
  - マウスオーバー時に右端に「新しいウィンドウで開く」ボタン（`<open-in-new>`）が表示されます
  - 多くの情報を一覧できるように、必要な情報を1行にコンパクトに配置します。

- **クリック動作**
  - **項目全体のクリック（ボタン以外）**: 現在のウィンドウでフォルダを開く
  - **「新しいウィンドウで開く」ボタンのクリック**: 新しいウィンドウでフォルダを開く

- **詳細表示 (マウスオーバー時のツールチップ)**
  - リポジトリ項目にマウスカーソルを合わせると、ツールチップが表示されます。
  - このツールチップにより、ユーザーはクリックすることなく、各リポジトリの詳細情報を素早く確認できます。

- **グループ表示切り替え**
  - `<view-list>` ボタンをクリックするたびに表示モードが切り替わります：
    1. **フラット表示** - 全リポジトリを単一リストで表示
    2. **言語別グループ** - 主体言語ごとにグループ化して表示
    3. **技術別グループ** - 使用技術スタック（フレームワーク）ごとにグループ化して表示

  **言語別グループ表示例:**

  ```text
  ┌──────────────────────────────────────────┐
  │ ▾ REPOSITORIES (3) <magnify> <view-list> <sort> <cog> │
  │ ├─ ▾ TypeScript (2)                      │
  │ │   <source-repository+star> <typescript> repos-manager *main <fire> 3 days ago [<open-in-new>] │
  │ │   <source-repository> <typescript> another-ts-app                              [<open-in-new>] │
  │ ├─ ▾ Python (1)                          │
  │ │   <source-repository> <python> python-project                                 [<open-in-new>] │
  │ └─ ▾ Other (1)                           │
  │     <folder> <javascript> non-git-project                                      [<open-in-new>] │
  └──────────────────────────────────────────┘
  ```

  **技術別グループ表示例:**

  ```text
  ┌──────────────────────────────────────────┐
  │ ▾ REPOSITORIES (3) <magnify> <view-list> <sort> <cog> │
  │ ├─ ▾ Node.js (2)                         │
  │ │   <source-repository+star> <nodejs> repos-manager *main <fire> 3 days ago [<open-in-new>] │
  │ │   <source-repository> <nodejs> express-api                                 [<open-in-new>] │
  │ ├─ ▾ React (1)                           │
  │ │   <source-repository> <react> react-app                                    [<open-in-new>] │
  │ └─ ▾ Other (1)                           │
  │     <folder> <html5> static-site                                            [<open-in-new>] │
  └──────────────────────────────────────────┘
  ```

  **ツールチップのレイアウト例:**

```text
┌─────────────────────────────────────────────────────────────────┐
│ 📁 repos-manager                           🔥 3 days ago        │
│ C:\Users\YourUser\Documents\github\repos-manager                │
│ ─────────────────────────────────────────────────────────────── │
│ 📄 README: Advanced repository management for VS Code          │
│ 🌿 main *2 commits ahead                                        │
│ 📊 1,247 files • 15,892 lines • 2.3 MB                        │
│ ─────────────────────────────────────────────────────────────── │
│ 🏷️ TypeScript  Node.js  VS Code Extension  MIT License         │
│ ⭐ In Favorites • 🔗 GitHub Repository                         │
│ ─────────────────────────────────────────────────────────────── │
│ 🔧 npm test ✅ • CI/CD ✅ • Dependencies 📦 23 packages       │
│ 📅 Last commit: Fix repository scanning logic (2025-01-02)     │
│ ─────────────────────────────────────────────────────────────── │
│ [🌐 Open Homepage] [📁 Explorer] [⌨ Terminal] [🔄 Update]      │
└─────────────────────────────────────────────────────────────────┘
```

**ツールチップ構成要素:**

1. **ヘッダー行**
   - フォルダアイコン + フォルダ名
   - 最終更新日時（最近更新の場合は🔥アイコン付き）

2. **フルパス表示**
   - 完全なローカルパス

3. **基本情報セクション**
   - README品質（最初の1行を表示）
   - Git状態（ブランチ名、ahead/behind状況、未コミット変更）
   - プロジェクト規模（ファイル数、総行数、サイズ）

4. **技術情報セクション**
   - 主体言語（TypeScript、Python等）
   - Runtime環境（Node.js、Python等）
   - プロジェクトタイプ（VS Code Extension、React App等）
   - ライセンス情報

5. **状態・メタ情報セクション**
   - お気に入り状態
   - Fork/Own repository状態
   - リモートリポジトリの有無

6. **品質・設定情報セクション**
   - テスト設定の有無
   - CI/CD設定の有無
   - 依存関係パッケージ数

7. **最新コミット情報**
   - コミットメッセージ
   - コミット日時

8. **クイックアクション**
   - ホームページを開く（Gitリポジトリのみ）
   - ファイルエクスプローラーで開く
   - ターミナルで開く
   - 情報を更新

**非Gitフォルダの場合:**

```text
┌─────────────────────────────────────────────────────────────────┐
│ 📁 static-website                          📅 1 week ago       │
│ C:\Users\YourUser\Documents\projects\static-website            │
│ ─────────────────────────────────────────────────────────────── │
│ 📊 47 files • 2,341 lines • 890 KB                            │
│ ─────────────────────────────────────────────────────────────── │
│ 🏷️ HTML  CSS  JavaScript  Static Site                         │
│ 📁 Local Folder (Non-Git)                                      │
│ ─────────────────────────────────────────────────────────────── │
│ [📁 Explorer] [⌨ Terminal] [🔄 Update]                        │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2. コンテキストメニュー (右クリック時)

リポジトリ項目を右クリックすると、コンテキストメニューが表示されます。
`package.json` の `menus.view/item/context` と同期させる。

#### 2.2.1. お気に入りリポジトリの場合

```text
┌─────────────────────────────┐
│ ↪ Open in Current Window    │
│ ⧉ Open in New Window       │
│ ────────────────────────    │
│ 🌐 Open Repository Homepage │
│ ⭐ Remove from Favorites    │
│ ────────────────────────    │
│ ⌨ Open in Terminal         │
│ 📁 Reveal in File Explorer │
└─────────────────────────────┘
```

**対象: お気に入り (`contextValue: repositoryFavorite`)**

| コマンドID                          | 表示名                       | アイコン |
| ----------------------------------- | ---------------------------- | -------- |
| `repos-manager.openRepository`      | Open in Current Window       | ↪        |
| `repos-manager.openInNewWindow`     | Open in New Window           | ⧉        |
| `repos-manager.openHomepage`        | Open Repository Homepage     | 🌐       |
| `repos-manager.removeFromFavorites` | Remove from Favorites        | ⭐       |
| `repos-manager.openInTerminal`      | Open in Terminal             | ⌨        |
| `repos-manager.openInFileExplorer`  | Reveal in File Explorer      | 📁       |

#### 2.2.2. 通常リポジトリの場合

```text
┌─────────────────────────────┐
│ ↪ Open in Current Window    │
│ ⧉ Open in New Window       │
│ ────────────────────────    │
│ 🌐 Open Repository Homepage │
│ ☆ Add to Favorites         │
│ ────────────────────────    │
│ ⌨ Open in Terminal         │
│ 📁 Reveal in File Explorer │
└─────────────────────────────┘
```

**対象: 通常リポジトリ (`contextValue: repository`)**

| コマンドID                       | 表示名                    | アイコン |
| -------------------------------- | ------------------------- | -------- |
| `repos-manager.openRepository`   | Open in Current Window    | ↪        |
| `repos-manager.openInNewWindow`  | Open in New Window        | ⧉        |
| `repos-manager.openHomepage`     | Open Repository Homepage  | 🌐       |
| `repos-manager.addToFavorites`   | Add to Favorites          | ☆        |
| `repos-manager.openInTerminal`   | Open in Terminal          | ⌨        |
| `repos-manager.openInFileExplorer` | Reveal in File Explorer   | 📁       |

#### 2.2.3. 非Gitフォルダの場合

```text
┌─────────────────────────────┐
│ ↪ Open in Current Window    │
│ ⧉ Open in New Window       │
│ ────────────────────────    │
│ ☆ Add to Favorites         │
│ ────────────────────────    │
│ ⌨ Open in Terminal         │
│ 📁 Reveal in File Explorer │
└─────────────────────────────┘
```

**対象: 非Gitフォルダ (`contextValue: folder`)**

| コマンドID                       | 表示名                    | アイコン |
| -------------------------------- | ------------------------- | -------- |
| `repos-manager.openRepository`   | Open in Current Window    | ↪        |
| `repos-manager.openInNewWindow`  | Open in New Window        | ⧉        |
| `repos-manager.addToFavorites`   | Add to Favorites          | ☆        |
| `repos-manager.openInTerminal`   | Open in Terminal          | ⌨        |
| `repos-manager.openInFileExplorer` | Reveal in File Explorer   | 📁       |

**注意**: 非Gitフォルダの場合、リモートリポジトリ情報が存在しないため「Open Repository Homepage」は表示されません。

## 3. 状態表示

### 3.1. ローディング中

- ツリービューに `<sync>` (回転付き) `Scanning repositories...` というメッセージを持つ項目を画面中央に一時的に表示する。

### 3.2. 空の状態

- スキャン対象ディレクトリにリポジトリ/フォルダが一つも見つからない場合、以下の要素を画面中央に表示する：

```text
┌──────────────────────────────────────────┐
│                                          │
│         📁 No repositories found         │
│                                          │
│   Repos Manager couldn't find any       │
│   repositories in your scan paths.      │
│                                          │
│   [🔍 Auto-detect Paths] [⚙️ Settings]   │
│   [📂 Add Folder]                        │
│                                          │
└──────────────────────────────────────────┘
```

**アクションボタン:**

- **🔍 Auto-detect Paths**:
  - 一般的なリポジトリ保存場所を自動検知してスキャンパスに追加
  - 検知対象: `~/Documents/GitHub`, `~/Documents/github`, `~/Projects`, `~/workspace`, `~/dev`, `~/code` など
  - 検知後は自動的にリポジトリスキャンを実行
- **⚙️ Settings**:
  - VS Code設定の拡張機能セクション（repos-manager）を開く
  - スキャン対象フォルダの手動設定が可能
- **📂 Add Folder**:
  - フォルダ選択ダイアログを開いてスキャンパスに追加
  - 選択後は自動的にリポジトリスキャンを実行

## 4. 設定画面 (settings.json)

ユーザーはVS Codeの `settings.json` で拡張機能の挙動を直接設定する。

```json
{
  "reposManager.scan.targetDirectories": [
    "C:\\Users\\YourUser\\Documents\\github"
  ],
  "reposManager.scan.excludePatterns": [
    "**/node_modules",
    "**/.git"
  ],
  "reposManager.display.highlightUpdatedWithinDays": 7,
  "reposManager.scan.autoDetectPaths": [
    "~/Documents/GitHub",
    "~/Documents/github",
    "~/Projects",
    "~/workspace",
    "~/dev",
    "~/code"
  ]
}
```

**設定項目:**

- **reposManager.scan.targetDirectories**: 手動で指定したスキャン対象ディレクトリのリスト
- **reposManager.scan.excludePatterns**: スキャン時に除外するパターン（glob形式）
- **reposManager.display.highlightUpdatedWithinDays**: 最近更新とみなす日数（🔥アイコン表示の基準）
- **reposManager.scan.autoDetectPaths**: 自動検知機能で検索する候補パス（ユーザーカスタマイズ可能）
