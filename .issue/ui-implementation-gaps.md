# UI Implementation Gaps - Critical Issues

**ステータス**: 緊急対応必要
**作成日**: 2025-01-07
**優先度**: 最高

## 概要

Phase 3.4+で画面設計書準拠実装完了と報告したが、実際のUI状況と設計書の間に重大な差異が発見された。手動テスト実行前に以下の問題を解決する必要がある。

## 発見された問題

### 🚨 1. ローディング・空状態画面の設計書不適合

**問題**:
- 現在：通常のTreeView項目として表示
- 設計書：中央にモダンな形で表示、アクションボタン付き

**期待される仕様** (UI設計書 § 3.1, 3.2):
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

**タスク**:
- [ ] ReposManagerProvider.tsの空状態UI実装を設計書準拠に修正
- [ ] ローディング状態のUI実装を中央表示・モダンデザインに変更
- [ ] 空状態アクションボタンの正常動作確認

### 🚨 2. フィルター機能の欠損

**問題**:
- 検索アイコンのツールチップに"Filter"表示
- しかし実装では検索機能のみでフィルター機能が未実装

**期待される仕様** (requirements.md § 2.2):
- **標準フィルター**: 検知項目によるフィルタリング
- **高度な検索**: ファイル名検索、パターン検索、日付範囲検索
- **スマート検索**: 技術スタック検索、検索履歴

**タスク**:
- [ ] 過去実装のフィルター機能コードを調査・復活
- [ ] QuickPickベースのフィルターUIを再実装
- [ ] 検索・フィルター機能の統合実装

### 🚨 3. アイコン表示の問題

**問題**:
- アイコンが表示されない箇所
- 複数のアイコンが重複表示される箇所
- 絵文字が混在している

**期待される仕様** (UI設計書 § 1.3):
- **リポジトリ**: `source-repository`
- **お気に入りリポジトリ**: `source-repository` + `star`
- **フォルダ**: `folder`
- **最近更新**: `fire`
- **絵文字使用禁止**

**タスク**:
- [ ] ReposManagerProviderのアイコン体系を設計書準拠に修正
- [ ] 絵文字の完全除去とCodiconアイコンへの置換
- [ ] アイコン重複表示の問題解決

### 🚨 4. ソートボタンの機能不全

**問題**:
- ソートボタンがクリックしても動作しない

**期待される仕様** (requirements.md § 3):
```
1. 更新日順（新しい順） - デフォルト
2. 開いた履歴順
3. フォルダ名順
4. 言語名順
5. 使用技術順
```

**タスク**:
- [ ] CommandRegistry.tsのtoggleSortコマンド実装確認
- [ ] ソート機能のロジック実装・動作確認
- [ ] ソート状態の保存・復元機能

### 🚨 5. グループビューボタンの機能不全

**問題**:
- グループビューボタンがクリックしても動作しない

**期待される仕様** (requirements.md § 3):
```
1. フラット表示 - 全リポジトリを単一リストで表示
2. 言語別グループ - 主体言語ごとにグループ化
3. 技術別グループ - 使用技術スタックごとにグループ化
```

**タスク**:
- [ ] CommandRegistry.tsのtoggleGroupViewコマンド実装確認
- [ ] ReposManagerProviderのグループ化ロジック実装
- [ ] グループ表示状態の保存・復元機能

## 影響度分析

### 高影響 (使用不可レベル)
- **空状態・ローディングUI**: 初回ユーザー体験に致命的
- **フィルター機能**: 要件定義の主要機能が欠損

### 中影響 (操作性問題)
- **ソート・グループ機能**: 設計書の主要機能が動作しない
- **アイコン表示**: 視覚的品質問題

## 対応方針

### Phase 1: 緊急修正 (優先度最高)
1. 空状態・ローディングUIの設計書準拠修正
2. フィルター機能の復活・実装

### Phase 2: 機能完成 (優先度高)
3. ソート機能の完全実装
4. グループビュー機能の完全実装
5. アイコン体系の完全修正

### Phase 3: 品質向上
6. ESLintエラー0個の維持
7. 手動テスト実行・検証

## 関連ファイル

### 修正対象ファイル
- `src/ui/ReposManagerProvider.ts` - UI表示・アイコン・空状態
- `src/extension/CommandRegistry.ts` - コマンド実装・動作確認
- `src/types/index.ts` - フィルター関連型定義（必要に応じて）

### 参照設計書
- `/docs/design/ui-design.md` - 画面レイアウト・アイコン体系
- `/docs/design/requirements.md` - 機能要件・フィルター仕様
- `/docs/design/detailed-design.md` - システム構成・データモデル

## 次のアクション

1. **緊急**: 空状態UI修正 → フィルター機能復活 → ソート・グループ機能実装
2. **品質**: ESLintエラー確認 → アイコン統一 → 設計書適合性確認
3. **検証**: 手動テストチェックリスト実行 → 機能動作確認

---

**最終更新**: 2025-01-07
**担当者**: Copilot Assistant
**関連Issue**: manual-testing-checklist.md
**ブロッカー**: このissueの解決が手動テスト実行の前提条件

---

**STATUS UPDATE - 2025-01-07**:
- ✅ **Icon System Fixed**: Completely removed all emoji usage (🔥📁⭐🏷️🔗📅🌐⌨🔄 etc.)
- ✅ **Codicon Implementation**: All icons now use proper `$(icon-name)` format
- ✅ **Loading State Icons**: Improved with `$(sync~spin)` spinner
- ✅ **Empty State Icons**: Cleaned up action button icons
- ✅ **Tooltip Icons**: Updated with Codicon format throughout
- ✅ **Filter Dialog**: Removed emoji from all filter labels
- ✅ **ESLint Compliance**: Maintained 0 errors during refactoring
