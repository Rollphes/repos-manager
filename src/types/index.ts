/**
 * Repository metadata interface
 */
export interface Repository {
  readonly id: string;
  readonly name: string;
  readonly path: string;
  readonly displayName?: string;
  readonly gitInfo: GitInfo;
  readonly metadata: RepositoryMetadata;
  readonly tags: readonly string[];
  readonly isFavorite: boolean;
  readonly isArchived: boolean;
  readonly lastAccessed: Date;
  readonly accessCount: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly lastScanAt: Date;
}

/**
 * Git repository information
 */
export interface GitInfo {
  readonly remoteUrl?: string;
  readonly currentBranch: string;
  readonly totalBranches: number;
  readonly lastCommitDate: Date;
  readonly hasUncommitted: boolean;
  readonly aheadBehind: AheadBehind;
  readonly isFork: boolean;
  readonly owner: RepositoryOwner;
}

/**
 * Repository metadata from analysis
 */
export interface RepositoryMetadata {
  readonly language: string;
  readonly runtime?: string;
  readonly databases: readonly string[];
  readonly dependencies: readonly Dependency[];
  readonly projectSize: ProjectSize;
  readonly readmeQuality: ReadmeQuality;
  readonly hasTests: boolean;
  readonly hasCicd: boolean;
  readonly license?: string;
}

/**
 * Ahead/Behind status for Git
 */
export interface AheadBehind {
  readonly ahead: number;
  readonly behind: number;
}

/**
 * Repository owner (can be self or external)
 */
export type RepositoryOwner = 'self' | {
  readonly name: string;
  readonly avatar?: string;
  readonly url?: string;
};

/**
 * Dependency information
 */
export interface Dependency {
  readonly name: string;
  readonly version: string;
  readonly type: DependencyType;
}

/**
 * Dependency type
 */
export type DependencyType = 'runtime' | 'development' | 'peer' | 'optional';

/**
 * Project size metrics
 */
export interface ProjectSize {
  readonly totalFiles: number;
  readonly totalSize: number;
  readonly codeFiles: number;
  readonly codeSize: number;
}

/**
 * README quality assessment
 */
export interface ReadmeQuality {
  readonly exists: boolean;
  readonly hasDescription: boolean;
  readonly hasInstallation: boolean;
  readonly hasUsage: boolean;
  readonly score: number;
}

/**
 * Scanning options
 */
export interface ScanOptions {
  readonly maxDepth: number;
  readonly maxFileCount: number;
  readonly timeoutSeconds: number;
  readonly excludePatterns: readonly string[];
  readonly lightweightMode: boolean;
}

/**
 * Search query interface
 */
export interface SearchQuery {
  readonly keyword: string;
  readonly type: SearchType;
  readonly filters: FilterCriteria;
}

/**
 * Search types
 */
export type SearchType = 'name' | 'file' | 'techstack';

/**
 * Filter criteria for searching
 */
export interface FilterCriteria {
  readonly languages: readonly string[];
  readonly owners: readonly RepositoryOwner[];
  readonly gitStates: readonly GitState[];
  readonly dateRange?: DateRange;
  readonly sizeRange?: SizeRange;
  readonly tags: readonly string[];
  readonly favoritesOnly: boolean;
  readonly excludeArchived: boolean;
  readonly hasTests?: boolean;
  readonly hasCicd?: boolean;
}

/**
 * Git states for filtering
 */
export type GitState = 'clean' | 'modified' | 'behind' | 'ahead' | 'conflict';

/**
 * Date range for filtering
 */
export interface DateRange {
  readonly start: Date;
  readonly end: Date;
}

/**
 * Size range for filtering
 */
export interface SizeRange {
  readonly minFiles: number;
  readonly maxFiles: number;
  readonly minLines?: number;
  readonly maxLines?: number;
}

/**
 * Configuration schema
 */
export interface ReposManagerConfig {
  readonly scanning: ScanningConfig;
  readonly display: DisplayConfig;
  readonly ui: UIConfig;
  readonly performance: PerformanceConfig;
  readonly integrations: IntegrationsConfig;
}

/**
 * Scanning configuration
 */
export interface ScanningConfig {
  readonly rootPaths: readonly string[];
  readonly excludePaths: readonly string[];
  readonly scanDepth: number;
  readonly includeHidden: boolean;
  readonly autoScanOnConfigChange: boolean;
  readonly maxConcurrentScans: number;
}

/**
 * Display configuration
 */
export interface DisplayConfig {
  readonly viewMode: ViewMode;
  readonly groupBy: GroupBy;
  readonly sortBy: string;
  readonly sortOrder: SortOrder;
  readonly showIcons: boolean;
  readonly showGitStatus: boolean;
  readonly compactMode: boolean;
}

/**
 * UI configuration
 */
export interface UIConfig {
  readonly enableKeyboardShortcuts: boolean;
  readonly enableContextMenu: boolean;
  readonly enableDragDrop: boolean;
  readonly autoRefresh: boolean;
  readonly refreshInterval: number;
}

/**
 * Performance configuration
 */
export interface PerformanceConfig {
  readonly enableCaching: boolean;
  readonly cacheTimeout: number;
  readonly enableLazyLoading: boolean;
  readonly maxRepositories: number;
}

/**
 * Integrations configuration
 */
export interface IntegrationsConfig {
  readonly github: GitHubConfig;
  readonly gitlab: GitLabConfig;
}

/**
 * GitHub API configuration
 */
export interface GitHubConfig {
  readonly enabled: boolean;
  readonly token?: string;
}

/**
 * GitLab API configuration
 */
export interface GitLabConfig {
  readonly enabled: boolean;
  readonly token?: string;
  readonly url?: string;
}

/**
 * Group by options
 */
export type GroupBy = 'none' | 'language' | 'owner' | 'favorite';

/**
 * Sort order
 */
export type SortOrder = 'asc' | 'desc';

/**
 * View mode options
 */
export type ViewMode = 'compact' | 'standard' | 'detailed';

/**
 * Workspace interface
 */
export interface Workspace {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly repositoryIds: readonly string[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Analysis result interface
 */
export interface AnalysisResult {
  readonly repository: Repository;
  readonly errors: readonly AnalysisError[];
  readonly warnings: readonly string[];
  readonly analysisTime: number;
}

/**
 * Analysis error interface
 */
export interface AnalysisError {
  readonly code: string;
  readonly message: string;
  readonly severity: ErrorSeverity;
}

/**
 * Error severity levels
 */
export type ErrorSeverity = 'error' | 'warning' | 'info';

/**
 * Repository filter interface
 */
export interface RepositoryFilter {
  readonly searchTerm?: string;
  readonly language?: string;
  readonly tags?: readonly string[];
  readonly isFavorite?: boolean;
  readonly isArchived?: boolean;
  readonly owner?: RepositoryOwner;
  readonly hasUncommitted?: boolean;
  readonly dateRange?: DateRange;
}

/**
 * Sort option interface
 */
export interface SortOption {
  readonly field: SortField;
  readonly order: SortOrder;
}

/**
 * Sort field options
 */
export type SortField = 'name' | 'lastAccessed' | 'lastCommit' | 'language' | 'size' | 'favorite';
