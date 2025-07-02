# フィルター機能とお気に入り機能のUX改善

## ステータス: ✅ 完了

作成日: 2025-07-02
優先度: 高
対象Phase: Phase 2.9（Phase 3前の改善）

## 問題の概要

Phase 3に進む前に、現在の実装で以下の2つのUX問題を解決する必要がある。

## 問題1: フィルター機能の分離問題

### 現在の実装

フィルター関連のコマンドが3つに分かれている：

```typescript
// 現在のコマンド構成
'reposManager.filter'         // 基本フィルター
'reposManager.advancedFilter' // 高度なフィルター
'reposManager.clearFilters'   // フィルタークリア
```

### 問題点

1. **機能の統一性に欠ける**: Filter系の機能が分散している
2. **ユーザーの混乱**: どのフィルターを使えばいいかわからない
3. **設計との乖離**: 設計書では統一されたFilter機能として記載

### 改善提案

Filter系コマンドを統一し、段階的なUI提供：

```typescript
// 改善後のコマンド構成
'reposManager.filter'      // 統一フィルターコマンド
  ├─ 基本フィルター (QuickPick)
  ├─ 高度なフィルター (Multi-step QuickPick)
  └─ フィルタークリア (オプション)
```

## 問題2: お気に入り機能のUX問題

### お気に入りの現在の実装

```typescript
// 現在のお気に入り操作方法
右クリック → "Add to Favorites"    // 追加
右クリック → "Remove from Favorites" // 削除
```

### お気に入り機能の問題点

1. **操作が煩雑**: 右クリック必須で手間がかかる
2. **削除機能の視認性**: Remove機能があることに気づきにくい
3. **トグル操作不可**: ワンクリックでの状態切り替えができない
4. **UI設計との乖離**: 設計書では★クリックでトグル予定だった

### お気に入り機能の改善提案

お気に入り操作をより直感的に：

```typescript
// 改善後のお気に入り操作
1. ★アイコンクリックでトグル (メイン操作)
2. 右クリックメニューは補助的に保持
3. ホバー時の視覚的フィードバック強化
```

## 実装計画

### Step 1: フィルター機能統合

1. **reposManager.filter** を主要コマンドとして統合
2. 基本→高度の段階的UI提供
3. 古いコマンドは非推奨化（後方互換性維持）

### Step 2: お気に入りUX改善

1. ★アイコンクリックでトグル機能追加
2. ホバー時の視覚的フィードバック
3. 右クリックメニューは補助として維持

### Step 3: テスト・検証

1. 新機能の動作確認
2. UXの使いやすさ検証
3. パフォーマンス影響確認

## 期待される効果

### フィルター機能

- ✅ 統一されたフィルター体験
- ✅ 初心者にも分かりやすい操作フロー
- ✅ 設計書との整合性確保

### お気に入り機能

- ✅ 直感的なワンクリック操作
- ✅ 操作効率の大幅向上
- ✅ 視覚的に分かりやすいUI

## 技術メモ

### フィルター統合の実装ポイント

```typescript
// 統合フィルターの段階的UI設計
async function showUnifiedFilter() {
  // Step 1: フィルター種別選択
  const filterType = await vscode.window.showQuickPick([
    { label: '🔍 Quick Filter', description: 'Basic filtering options' },
    { label: '⚙️ Advanced Filter', description: 'Detailed filtering with categories' },
    { label: '🔄 Clear Filters', description: 'Remove all active filters' }
  ]);

  // Step 2: 選択に応じた処理分岐
  switch(filterType?.label) {
    case '🔍 Quick Filter': return showBasicFilter();
    case '⚙️ Advanced Filter': return showAdvancedFilter();
    case '🔄 Clear Filters': return clearAllFilters();
  }
}
```

### お気に入りトグルの実装ポイント

```typescript
// TreeItem上で★クリック可能にする
// command プロパティでトグル機能を設定
item.command = {
  command: 'reposManager.toggleFavorite',
  title: 'Toggle Favorite',
  arguments: [repository]
};
```

## 関連ファイル

- `src/extension.ts`: コマンド登録・実装
- `src/ui/ReposManagerProvider.ts`: TreeDataProvider・UI表示ロジック
- `package.json`: コマンド定義・メニュー設定
- `docs/design/ui-design.md`: UI设计书（要更新）

## 完了条件

- [ ] フィルターコマンドの統合完了
- [ ] お気に入り★クリックトグル機能実装
- [ ] 新機能のテスト通過
- [ ] VS Codeでの動作確認
- [ ] 設計書の更新
- [ ] README.mdの更新（必要に応じて）

---

**Note:** この改善完了後、Phase 3（ワークスペース管理機能）に進む予定
