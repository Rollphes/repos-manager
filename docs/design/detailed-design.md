# Repos-Manager 詳細設計書

## システム構成

### アーキテクチャ概要

```text
┌─────────────────────────────────────────┐
│              VS Code Extension          │
├─────────────────────────────────────────┤
│  Presentation Layer (UI)                │
│  ├─ TreeDataProvider (サイドバー)       │
│  ├─ WebviewProvider (設定画面)          │
│  └─ CommandProvider (コマンド)          │
├─────────────────────────────────────────┤
│  Business Logic Layer                   │
│  ├─ RepositoryManager                   │
│  ├─ AnalysisEngine                      │
│  ├─ SearchEngine                        │
│  └─ FilterProfileManager                │
├─────────────────────────────────────────┤
│  Data Access Layer                      │
│  ├─ FileSystemService                   │
│  ├─ GitService                          │
│  ├─ CacheService                        │
│  └─ ConfigService                       │
├─────────────────────────────────────────┤
│  External Services                      │
│  ├─ GitHub API                          │
│  ├─ GitLab API                          │
│  └─ VS Code APIs                        │
└─────────────────────────────────────────┘
```

## 主要コンポーネント設計

### 1. RepositoryManager

**責務**: リポジトリの検知、登録、管理

```typescript
interface RepositoryManager {
  scanRepositories(rootPaths: string[]): Promise<Repository[]>
  addRepository(path: string): Promise<Repository>
  removeRepository(id: string): Promise<void>
  updateRepository(id: string): Promise<Repository>
  getRepositories(): Repository[]
  refreshRepository(id: string): Promise<Repository>
  bulkUpdate(ids: string[]): Promise<Repository[]>
}

interface Repository {
  id: string
  name: string
  path: string
  language: string
  lastModified: Date
  gitInfo: GitInfo
  metadata: RepositoryMetadata
  tags: string[]
  isFavorite: boolean
  isArchived: boolean
}
```

### 2. AnalysisEngine

**責務**: リポジトリの分析・メタデータ抽出

```typescript
interface AnalysisEngine {
  analyzeRepository(path: string, options?: AnalysisOptions): Promise<RepositoryMetadata>
  detectLanguage(path: string): Promise<LanguageInfo>
  extractDependencies(path: string): Promise<Dependency[]>
  calculateProjectSize(path: string): Promise<ProjectSize>
  assessReadmeQuality(readmePath: string): Promise<ReadmeQuality>
  detectRuntime(path: string): Promise<RuntimeInfo>
  detectDatabases(path: string): Promise<DatabaseInfo[]>
  checkTestCoverage(path: string): Promise<TestInfo>
  detectCICD(path: string): Promise<CICDInfo>
  analyzeLicense(path: string): Promise<LicenseInfo>
}

interface RepositoryMetadata {
  language: LanguageInfo
  runtime?: RuntimeInfo
  databases: DatabaseInfo[]
  dependencies: Dependency[]
  projectSize: ProjectSize
  readmeQuality: ReadmeQuality
  testInfo: TestInfo
  cicdInfo: CICDInfo
  license?: LicenseInfo
  lastAnalyzed: Date
}

interface AnalysisOptions {
  lightweight?: boolean  // 軽量スキャンモード
  timeout?: number      // タイムアウト（秒）
  maxFiles?: number     // 最大ファイル数
}
```

### 3. SearchEngine

**責務**: 検索・フィルタリング機能

```typescript
interface SearchEngine {
  search(query: SearchQuery): Promise<SearchResult>
  filter(repositories: Repository[], filters: FilterCriteria): Repository[]
  saveSearchFilter(name: string, filter: FilterCriteria): Promise<void>
  getSearchHistory(): SearchQuery[]
  getSavedFilters(): SavedFilter[]
  clearHistory(): Promise<void>
}

interface SearchQuery {
  keyword: string
  type: 'name' | 'file' | 'techstack' | 'tag'
  filters: FilterCriteria
  options: SearchOptions
}

interface SearchResult {
  repositories: Repository[]
  totalCount: number
  searchTime: number
  suggestions?: string[]
}

interface FilterCriteria {
  languages?: string[]
  owners?: ('self' | 'other')[]
  gitStatus?: ('clean' | 'modified' | 'ahead' | 'behind')[]
  dateRange?: DateRange
  sizeRange?: SizeRange
  tags?: string[]
  favorites?: boolean
  archived?: boolean
}
```

### 4. FilterProfileManager

**責務**: フィルタープロファイル管理

```typescript
interface FilterProfileManager {
  createProfile(name: string, filters: FilterCriteria, options?: ProfileOptions): Promise<FilterProfile>
  updateProfile(id: string, updates: Partial<FilterProfile>): Promise<FilterProfile>
  deleteProfile(id: string): Promise<void>
  getProfiles(): FilterProfile[]
  applyProfile(id: string): Promise<Repository[]>
  getCurrentProfile(): FilterProfile | null
  exportProfile(id: string): Promise<FilterProfileExport>
  importProfile(data: FilterProfileExport): Promise<FilterProfile>
  getProfileStatistics(id: string): Promise<ProfileStats>
}

interface FilterProfile {
  id: string
  name: string
  description?: string
  filters: FilterCriteria
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  icon?: string
  color?: string
  tags: string[]
}

interface ProfileStats {
  totalRepositories: number
  languageDistribution: Record<string, number>
  lastActivity: Date
  averageHealth: number
}

interface FilterProfileExport {
  version: string
  profile: Omit<FilterProfile, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>
  metadata: {
    exportedBy: string
    exportedAt: Date
    compatibilityVersion: string
  }
}
```

### 5. GitService

**責務**: Git操作とリモート連携

```typescript
interface GitService {
  getGitInfo(repoPath: string): Promise<GitInfo>
  checkRemoteStatus(repoPath: string): Promise<RemoteStatus>
  getBranches(repoPath: string): Promise<BranchInfo[]>
  getCommitHistory(repoPath: string, limit?: number): Promise<CommitInfo[]>
  hasUncommittedChanges(repoPath: string): Promise<boolean>
  getRemoteUrl(repoPath: string): Promise<string | null>
  isGitRepository(path: string): Promise<boolean>
}

interface GitInfo {
  currentBranch: string
  totalBranches: number
  lastCommitDate: Date
  lastCommitMessage: string
  lastCommitAuthor: string
  hasUncommitted: boolean
  remoteStatus: RemoteStatus
  remoteUrl?: string
  isFork: boolean
  owner: 'self' | 'other'
}

interface RemoteStatus {
  ahead: number
  behind: number
  isUpToDate: boolean
  lastFetch?: Date
}
```

### 6. CacheService

**責務**: キャッシュ管理

```typescript
interface CacheService {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttl?: number): Promise<void>
  delete(key: string): Promise<void>
  clear(): Promise<void>
  has(key: string): Promise<boolean>
  getStats(): Promise<CacheStats>
  cleanup(): Promise<number>  // 期限切れエントリ数を返す
}

interface CacheStats {
  totalEntries: number
  totalSize: number
  hitRate: number
  expiredEntries: number
}
```

## データモデル設計

### 1. Repository Entity（詳細版）

```typescript
interface Repository {
  // 基本情報
  id: string                    // UUID
  name: string                  // リポジトリ名
  displayName?: string          // 表示用名前（カスタム）
  path: string                  // ローカルパス

  // Git情報
  gitInfo: GitInfo

  // メタデータ
  metadata: RepositoryMetadata

  // ユーザー設定
  tags: string[]
  isFavorite: boolean
  isArchived: boolean
  customColor?: string
  customIcon?: string
  notes?: string

  // アクセス情報
  lastAccessed: Date
  accessCount: number
  accessHistory: AccessRecord[]

  // システム情報
  createdAt: Date
  updatedAt: Date
  lastScanAt: Date
  scanVersion: string           // スキャンロジックのバージョン

  // パフォーマンス情報
  scanDuration: number          // 最後のスキャン時間（ms）
  scanErrors?: string[]         // スキャン時のエラー
}

interface AccessRecord {
  timestamp: Date
  action: 'open' | 'scan' | 'view'
  duration?: number
}
```

### 2. Configuration Schema（詳細版）

```typescript
interface ReposManagerConfig {
  // バージョン情報
  version: string

  // スキャン設定
  scanning: {
    rootPaths: string[]
    excludePatterns: string[]
    includePatterns?: string[]
    maxDepth: number
    maxFileCount: number
    timeoutSeconds: number
    concurrentScans: number
    autoScanOnStartup: boolean
    scanSchedule?: CronExpression

    // 言語検出設定
    languageDetection: {
      minFileSize: number
      maxFileSize: number
      sampleFiles: number
      excludeExtensions: string[]
    }
  }

  // 表示設定
  display: {
    visibleColumns: string[]
    columnOrder: string[]
    columnWidths: { [column: string]: number }
    groupBy: 'none' | 'language' | 'owner' | 'workspace' | 'tag'
    sortBy: string
    sortOrder: 'asc' | 'desc'
    viewMode: 'compact' | 'standard' | 'detailed'
    showIcons: boolean
    showTooltips: boolean
    relativeTimestamps: boolean

    // テーマ設定
    theme: {
      colors: { [status: string]: string }
      icons: { [type: string]: string }
      fonts: FontSettings
    }
  }

  // 検索設定
  search: {
    maxResults: number
    searchTimeout: number
    enableFuzzySearch: boolean
    saveHistory: boolean
    maxHistoryItems: number
    indexFiles: boolean
    indexContent: boolean
  }

  // パフォーマンス設定
  performance: {
    maxConcurrentScans: number
    cacheEnabled: boolean
    cacheTtlHours: number
    maxCacheSize: number
    enableLazyLoading: boolean
    backgroundRefresh: boolean
    refreshInterval: number
  }

  // API設定
  api: {
    github: GitHubConfig
    gitlab: GitLabConfig
    requestTimeout: number
    retryAttempts: number
    rateLimitBuffer: number
  }

  // 通知設定
  notifications: {
    enabled: boolean
    scanComplete: boolean
    scanErrors: boolean
    newRepositories: boolean
    repositoryUpdates: boolean
    lowActivity: boolean
  }

  // セキュリティ設定
  security: {
    encryptCache: boolean
    excludePrivateData: boolean
    anonymizeUserData: boolean
    auditLog: boolean
  }
}

interface GitHubConfig {
  enabled: boolean
  token?: string
  baseUrl?: string
  timeout: number
  rateLimitWarning: boolean
}

interface GitLabConfig {
  enabled: boolean
  token?: string
  url: string
  timeout: number
  rateLimitWarning: boolean
}
```

### 3. UI State Management

```typescript
interface UIState {
  // サイドバー状態
  sidebar: {
    expanded: boolean
    width: number
    selectedItem?: string
    expandedGroups: string[]
    scrollPosition: number
  }

  // 検索状態
  search: {
    query: string
    filters: FilterCriteria
    results: Repository[]
    isSearching: boolean
    selectedFilter?: string
  }

  // ワークスペース状態
  workspace: {
    currentId?: string
    isManaging: boolean
    selectedRepositories: string[]
  }

  // 設定状態
  settings: {
    isOpen: boolean
    activeTab: string
    isDirty: boolean
    validationErrors: { [field: string]: string }
  }

  // 進行状況
  progress: {
    isScanning: boolean
    current: number
    total: number
    currentRepository?: string
    errors: string[]
  }
}
```

## API設計

### 1. Extension Commands

```typescript
// VS Code拡張機能のコマンド定義
const COMMANDS = {
  // 基本操作
  REFRESH_ALL: 'repos-manager.refreshAll',
  REFRESH_REPOSITORY: 'repos-manager.refreshRepository',
  OPEN_REPOSITORY: 'repos-manager.openRepository',
  OPEN_IN_NEW_WINDOW: 'repos-manager.openInNewWindow',
  OPEN_IN_EXPLORER: 'repos-manager.openInExplorer',
  OPEN_IN_TERMINAL: 'repos-manager.openInTerminal',
  OPEN_ON_GITHUB: 'repos-manager.openOnGitHub',

  // リポジトリ管理
  ADD_REPOSITORY: 'repos-manager.addRepository',
  REMOVE_REPOSITORY: 'repos-manager.removeRepository',
  TOGGLE_FAVORITE: 'repos-manager.toggleFavorite',
  TOGGLE_ARCHIVE: 'repos-manager.toggleArchive',
  ADD_TAG: 'repos-manager.addTag',
  REMOVE_TAG: 'repos-manager.removeTag',

  // 検索・フィルタ
  FOCUS_SEARCH: 'repos-manager.focusSearch',
  CLEAR_SEARCH: 'repos-manager.clearSearch',
  SAVE_FILTER: 'repos-manager.saveFilter',
  LOAD_FILTER: 'repos-manager.loadFilter',

  // ワークスペース
  CREATE_WORKSPACE: 'repos-manager.createWorkspace',
  SWITCH_WORKSPACE: 'repos-manager.switchWorkspace',
  MANAGE_WORKSPACES: 'repos-manager.manageWorkspaces',

  // 設定
  OPEN_SETTINGS: 'repos-manager.openSettings',
  EXPORT_DATA: 'repos-manager.exportData',
  IMPORT_DATA: 'repos-manager.importData',

  // 表示制御
  CHANGE_VIEW_MODE: 'repos-manager.changeViewMode',
  TOGGLE_GROUP_BY: 'repos-manager.toggleGroupBy',
  SORT_BY: 'repos-manager.sortBy'
} as const
```

### 2. Event System

```typescript
interface EventSystem {
  // リポジトリイベント
  onRepositoryAdded: Event<Repository>
  onRepositoryRemoved: Event<string>
  onRepositoryUpdated: Event<Repository>
  onRepositoryScanned: Event<{ repository: Repository, duration: number }>

  // スキャンイベント
  onScanStarted: Event<{ repositoryCount: number }>
  onScanProgress: Event<{ current: number, total: number, repository: Repository }>
  onScanCompleted: Event<{ duration: number, successCount: number, errorCount: number }>
  onScanError: Event<{ repository: Repository, error: Error }>

  // 検索イベント
  onSearchStarted: Event<SearchQuery>
  onSearchCompleted: Event<SearchResult>
  onFilterChanged: Event<FilterCriteria>

  // ワークスペースイベント
  onWorkspaceCreated: Event<Workspace>
  onWorkspaceChanged: Event<Workspace>
  onWorkspaceDeleted: Event<string>

  // 設定イベント
  onConfigurationChanged: Event<Partial<ReposManagerConfig>>

  // UIイベント
  onViewModeChanged: Event<string>
  onGroupByChanged: Event<string>
  onSortChanged: Event<{ by: string, order: 'asc' | 'desc' }>
}
```

## エラーハンドリング

### 1. エラー分類

```typescript
enum ErrorType {
  // システムエラー
  FILESYSTEM_ERROR = 'filesystem_error',
  GIT_ERROR = 'git_error',
  NETWORK_ERROR = 'network_error',

  // APIエラー
  API_RATE_LIMIT = 'api_rate_limit',
  API_AUTHENTICATION = 'api_authentication',
  API_NOT_FOUND = 'api_not_found',

  // ユーザーエラー
  INVALID_PATH = 'invalid_path',
  INVALID_CONFIGURATION = 'invalid_configuration',
  PERMISSION_DENIED = 'permission_denied',

  // パフォーマンスエラー
  TIMEOUT_ERROR = 'timeout_error',
  MEMORY_ERROR = 'memory_error',
  SCAN_TOO_LARGE = 'scan_too_large'
}

interface ReposManagerError extends Error {
  type: ErrorType
  code: string
  context?: any
  recoverable: boolean
  userMessage: string
  technicalMessage: string
}
```

### 2. エラー回復戦略

```typescript
interface ErrorRecoveryStrategy {
  canRecover(error: ReposManagerError): boolean
  recover(error: ReposManagerError): Promise<void>
  getRetryDelay(attempt: number): number
  getMaxRetries(): number
  shouldNotifyUser(error: ReposManagerError): boolean
  getUserActionSuggestion(error: ReposManagerError): string
}
```

## パフォーマンス最適化

### 1. 仮想化戦略

```typescript
interface VirtualizationConfig {
  enabled: boolean
  itemHeight: number
  bufferSize: number
  renderThreshold: number
  lazyLoadThreshold: number
}
```

### 2. メモリ管理

```typescript
interface MemoryManager {
  getCurrentUsage(): Promise<MemoryUsage>
  cleanup(): Promise<void>
  setMemoryLimit(limitMB: number): void
  getMemoryLimit(): number
  onMemoryWarning: Event<MemoryUsage>
}

interface MemoryUsage {
  heapUsed: number
  heapTotal: number
  external: number
  resident: number
}
```

### 3. バックグラウンドタスク

```typescript
interface BackgroundTaskManager {
  scheduleTask(task: BackgroundTask): Promise<string>
  cancelTask(taskId: string): Promise<void>
  getTasks(): BackgroundTask[]
  onTaskCompleted: Event<{ taskId: string, result: any }>
  onTaskFailed: Event<{ taskId: string, error: Error }>
}

interface BackgroundTask {
  id: string
  type: 'scan' | 'refresh' | 'cleanup' | 'index'
  priority: 'low' | 'normal' | 'high'
  params: any
  timeout?: number
  retries?: number
  schedule?: CronExpression
}
```

## テスト戦略

### 1. テスト分類

```typescript
interface TestSuite {
  unit: UnitTests
  integration: IntegrationTests
  e2e: E2ETests
  performance: PerformanceTests
}

interface UnitTests {
  repositoryManager: TestCase[]
  analysisEngine: TestCase[]
  searchEngine: TestCase[]
  gitService: TestCase[]
  cacheService: TestCase[]
}

interface TestCase {
  name: string
  description: string
  setup?: () => Promise<void>
  test: () => Promise<void>
  teardown?: () => Promise<void>
  timeout?: number
  skip?: boolean
}
```

### 2. モックデータ

```typescript
interface MockDataGenerator {
  generateRepository(overrides?: Partial<Repository>): Repository
  generateRepositories(count: number): Repository[]
  generateGitInfo(overrides?: Partial<GitInfo>): GitInfo
  generateWorkspace(repositoryCount: number): Workspace
  generateConfig(overrides?: Partial<ReposManagerConfig>): ReposManagerConfig
}
```

## デプロイメント・配布

### 1. パッケージ構成

```typescript
interface PackageStructure {
  src: SourceFiles
  out: CompiledFiles
  resources: ResourceFiles
  tests: TestFiles
  docs: DocumentationFiles
}

interface BuildConfiguration {
  target: 'development' | 'production'
  minify: boolean
  sourceMaps: boolean
  bundleAnalyzer: boolean
  externals: string[]
}
```

### 2. リリースプロセス

```typescript
interface ReleaseProcess {
  preRelease: ReleaseStep[]
  build: ReleaseStep[]
  test: ReleaseStep[]
  package: ReleaseStep[]
  publish: ReleaseStep[]
  postRelease: ReleaseStep[]
}

interface ReleaseStep {
  name: string
  command: string
  condition?: string
  continueOnError?: boolean
  timeout?: number
}
```
