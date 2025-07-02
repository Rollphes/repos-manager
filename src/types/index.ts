/**
 * Repository metadata interface
 */
export interface Repository {
  readonly id: string
  readonly name: string
  readonly path: string
  readonly displayName?: string
  readonly gitInfo: GitInfo
  readonly metadata: RepositoryMetadata
  readonly tags: readonly string[]
  readonly isFavorite: boolean
  readonly isArchived: boolean
  readonly lastAccessed: Date
  readonly accessCount: number
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly lastScanAt: Date
}

/**
 * Git repository information
 */
export interface GitInfo {
  readonly remoteUrl?: string
  readonly currentBranch: string
  readonly totalBranches: number
  readonly lastCommitDate: Date
  readonly hasUncommitted: boolean
  readonly aheadBehind: AheadBehind
  readonly isFork: boolean
  readonly owner: RepositoryOwner
}

/**
 * Repository metadata from analysis
 */
export interface RepositoryMetadata {
  readonly language: string
  readonly runtime?: string
  readonly databases: readonly string[]
  readonly dependencies: readonly Dependency[]
  readonly projectSize: ProjectSize
  readonly readmeQuality: ReadmeQuality
  readonly hasTests: boolean
  readonly hasCicd: boolean
  readonly license?: string
}

/**
 * Ahead/Behind status for Git
 */
export interface AheadBehind {
  readonly ahead: number
  readonly behind: number
}

/**
 * Repository owner (can be self or external)
 */
export type RepositoryOwner =
  | 'self'
  | {
      readonly name: string
      readonly avatar?: string
      readonly url?: string
    }

/**
 * Dependency information
 */
export interface Dependency {
  readonly name: string
  readonly version: string
  readonly type: DependencyType
}

/**
 * Dependency type
 */
export type DependencyType = 'runtime' | 'development' | 'peer' | 'optional'

/**
 * Project size metrics
 */
export interface ProjectSize {
  readonly totalFiles: number
  readonly totalSize: number
  readonly codeFiles: number
  readonly codeSize: number
}

/**
 * README quality assessment
 */
export interface ReadmeQuality {
  readonly exists: boolean
  readonly hasDescription: boolean
  readonly hasInstallation: boolean
  readonly hasUsage: boolean
  readonly score: number
}

/**
 * Scanning options
 */
export interface ScanOptions {
  readonly maxDepth: number
  readonly maxFileCount: number
  readonly timeoutSeconds: number
  readonly excludePatterns: readonly string[]
  readonly lightweightMode: boolean
}

/**
 * Search query interface
 */
export interface SearchQuery {
  readonly keyword: string
  readonly type: SearchType
  readonly filters: FilterCriteria
}

/**
 * Search types
 */
export type SearchType = 'name' | 'file' | 'techstack'

/**
 * Filter criteria for searching
 */
export interface FilterCriteria {
  readonly languages: readonly string[]
  readonly owners: readonly RepositoryOwner[]
  readonly gitStates: readonly GitState[]
  readonly dateRange?: DateRange
  readonly sizeRange?: SizeRange
  readonly tags: readonly string[]
  readonly favoritesOnly: boolean
  readonly excludeArchived: boolean
  readonly hasTests?: boolean
  readonly hasCicd?: boolean
  readonly customConditions?: readonly CustomCondition[]
}

/**
 * Git states for filtering
 */
export type GitState = 'clean' | 'modified' | 'behind' | 'ahead' | 'conflict'

/**
 * Date range for filtering
 */
export interface DateRange {
  readonly start: Date
  readonly end: Date
}

/**
 * Size range for filtering
 */
export interface SizeRange {
  readonly minFiles: number
  readonly maxFiles: number
  readonly minLines?: number
  readonly maxLines?: number
}

/**
 * Configuration schema
 */
export interface ReposManagerConfig {
  readonly scanning: ScanningConfig
  readonly display: DisplayConfig
  readonly ui: UIConfig
  readonly performance: PerformanceConfig
  readonly integrations: IntegrationsConfig
}

/**
 * Scanning configuration
 */
export interface ScanningConfig {
  readonly rootPaths: readonly string[]
  readonly excludePaths: readonly string[]
  readonly scanDepth: number
  readonly includeHidden: boolean
  readonly autoScanOnConfigChange: boolean
  readonly maxConcurrentScans: number
}

/**
 * Display configuration
 */
export interface DisplayConfig {
  readonly viewMode: ViewMode
  readonly groupBy: GroupBy
  readonly sortBy: string
  readonly sortOrder: SortOrder
  readonly showIcons: boolean
  readonly showGitStatus: boolean
  readonly compactMode: boolean
}

/**
 * UI configuration
 */
export interface UIConfig {
  readonly enableKeyboardShortcuts: boolean
  readonly enableContextMenu: boolean
  readonly enableDragDrop: boolean
  readonly autoRefresh: boolean
  readonly refreshInterval: number
}

/**
 * Performance configuration
 */
export interface PerformanceConfig {
  readonly enableCaching: boolean
  readonly cacheTimeout: number
  readonly enableLazyLoading: boolean
  readonly maxRepositories: number
}

/**
 * Integrations configuration
 */
export interface IntegrationsConfig {
  readonly github: GitHubConfig
  readonly gitlab: GitLabConfig
}

/**
 * GitHub API configuration
 */
export interface GitHubConfig {
  readonly enabled: boolean
  readonly token?: string
}

/**
 * GitLab API configuration
 */
export interface GitLabConfig {
  readonly enabled: boolean
  readonly token?: string
  readonly url?: string
}

/**
 * Group by options
 */
export type GroupBy = 'none' | 'language' | 'owner' | 'favorite'

/**
 * Sort order
 */
export type SortOrder = 'asc' | 'desc'

/**
 * View mode options
 */
export type ViewMode = 'compact' | 'standard' | 'detailed'

/**
 * Workspace interface
 */
export interface Workspace {
  readonly id: string
  readonly name: string
  readonly description?: string
  readonly icon?: string
  readonly repositoryIds: readonly string[]
  readonly createdAt: Date
  readonly lastAccessedAt: Date
  readonly isActive: boolean
  readonly tags: readonly string[]
}

/**
 * Workspace export/import format for sharing between developers
 */
export interface WorkspaceExport {
  readonly version: string
  readonly workspace: Omit<
    Workspace,
    'id' | 'createdAt' | 'lastAccessedAt' | 'isActive'
  >
  readonly repositoryPaths: readonly string[] // Export paths instead of IDs for portability
}

/**
 * Workspace statistics and analytics
 */
export interface WorkspaceStats {
  readonly totalRepositories: number
  readonly languageDistribution: Record<string, number>
  readonly healthScore: number
  readonly lastActivity: Date
  readonly totalSize: ProjectSize
  readonly averageActivity: number // Access frequency
}

/**
 * Activity record for tracking repository usage
 */
export interface ActivityRecord {
  readonly repositoryId: string
  readonly timestamp: Date
  readonly action: ActivityAction
  readonly duration?: number // Duration in seconds for 'open' actions
}

/**
 * Activity action types
 */
export type ActivityAction =
  | 'open' // Opened repository
  | 'close' // Closed repository
  | 'access' // General access/view
  | 'edit' // File editing activity
  | 'commit' // Git commit
  | 'pull' // Git pull
  | 'push' // Git push

/**
 * Project health score components
 */
export interface HealthScore {
  readonly overall: number // 0-100 overall score
  readonly factors: {
    readonly recentActivity: number // How recently was it updated
    readonly commitFrequency: number // How often commits happen
    readonly dependencyHealth: number // How up-to-date dependencies are
    readonly testCoverage: number // Presence and quality of tests
    readonly documentation: number // README and docs quality
  }
  readonly warnings: readonly string[] // Specific health warnings
  readonly recommendations: readonly string[] // Improvement suggestions
}

/**
 * Usage statistics for analytics
 */
export interface UsageStats {
  readonly totalRepositories: number
  readonly totalWorkspaces: number
  readonly mostUsedLanguages: readonly LanguageUsage[]
  readonly mostAccessedRepositories: readonly RepositoryUsage[]
  readonly activityTrend: readonly ActivityTrend[]
  readonly healthDistribution: HealthDistribution
  readonly periodStart: Date
  readonly periodEnd: Date
}

/**
 * Language usage statistics
 */
export interface LanguageUsage {
  readonly language: string
  readonly repositoryCount: number
  readonly accessCount: number
  readonly percentage: number
}

/**
 * Repository usage statistics
 */
export interface RepositoryUsage {
  readonly repositoryId: string
  readonly name: string
  readonly accessCount: number
  readonly lastAccessed: Date
  readonly totalTime: number // Total time spent in seconds
}

/**
 * Activity trend data point
 */
export interface ActivityTrend {
  readonly date: Date
  readonly accessCount: number
  readonly uniqueRepositories: number
  readonly totalTime: number
}

/**
 * Health score distribution
 */
export interface HealthDistribution {
  readonly excellent: number // 90-100
  readonly good: number // 70-89
  readonly fair: number // 50-69
  readonly poor: number // 0-49
}

/**
 * Repository filter options
 */
export interface RepositoryFilter {
  readonly name?: string
  readonly language?: string
  readonly tags?: readonly string[]
  readonly isFavorite?: boolean
  readonly isArchived?: boolean
  readonly hasUncommitted?: boolean
  readonly workspaceId?: string
  readonly searchTerm?: string
  readonly dateRange?: {
    readonly startDate: Date
    readonly endDate: Date
  }
  readonly workspaceRepositoryIds?: readonly string[]
}

/**
 * Sort options for repositories
 */
export interface SortOption {
  readonly field:
    | 'name'
    | 'lastAccessed'
    | 'accessCount'
    | 'createdAt'
    | 'updatedAt'
    | 'language'
    | 'lastCommit'
    | 'size'
    | 'favorite'
  readonly order: 'asc' | 'desc'
}

/**
 * Filter Profile interface - replaces static Workspace with dynamic filter-based grouping
 */
export interface FilterProfile {
  readonly id: string
  readonly name: string
  readonly description?: string
  readonly icon?: string
  readonly color?: string
  readonly filters: FilterCriteria
  readonly isActive: boolean
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly tags: readonly string[]
}

/**
 * Filter Profile export/import format for sharing between developers
 */
export interface FilterProfileExport {
  readonly version: string
  readonly profile: Omit<
    FilterProfile,
    'id' | 'createdAt' | 'updatedAt' | 'isActive'
  >
  readonly metadata: {
    readonly exportedBy: string
    readonly exportedAt: Date
    readonly compatibilityVersion: string
  }
}

/**
 * Filter Profile statistics and analytics
 */
export interface FilterProfileStats {
  readonly totalRepositories: number
  readonly languageDistribution: Record<string, number>
  readonly lastActivity: Date
  readonly averageHealth: number
  readonly matchedRepositoryIds: readonly string[]
}

/**
 * Custom filter condition for advanced filtering
 */
export interface CustomCondition {
  readonly field: string
  readonly operator:
    | 'equals'
    | 'contains'
    | 'startsWith'
    | 'endsWith'
    | 'regex'
    | 'greaterThan'
    | 'lessThan'
  readonly value: string | number | boolean
  readonly caseSensitive?: boolean
}
