import { ConfigurationService } from '@services/ConfigurationService'
import { FavoriteService } from '@services/FavoriteService'
import { GitService } from '@services/GitService'
import { RepositoryAnalyzer } from '@services/RepositoryAnalyzer'
import { Repository, RepositoryFilter, SortOption } from '@types'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as vscode from 'vscode'

/**
 * Repository statistics interface
 */
export interface RepositoryStatistics {
  total: number
  favorites: number
  archived: number
  byLanguage: Record<string, number>
  lastScanTime: Date
}

/**
 * Progress callback type for scanning
 */

export type ProgressCallback = (message: string, increment?: number) => void

/**
 * Main repository management class
 * Handles repository scanning, filtering, and operations
 */
export class RepositoryManager {
  // Progress constants

  private static readonly SCAN_COMPLETION_PERCENTAGE = 90 // Reserve 10% for final steps

  private static readonly DATA_UPDATE_PERCENTAGE = 90

  private static readonly FAVORITES_LOAD_PERCENTAGE = 95

  private repositories = new Map<string, Repository>()
  private readonly gitService: GitService
  private readonly analyzer: RepositoryAnalyzer
  private readonly favoriteService: FavoriteService
  private isScanning = false
  private readonly onDidChangeRepositories = new vscode.EventEmitter<void>()

  // eslint-disable-next-line @typescript-eslint/member-ordering
  public readonly onDidChangeRepositoriesEvent =
    this.onDidChangeRepositories.event

  constructor(
    private readonly configService: ConfigurationService,

    private readonly context?: vscode.ExtensionContext,
  ) {
    this.gitService = new GitService()
    this.analyzer = new RepositoryAnalyzer()
    this.favoriteService = new FavoriteService(this.context)

    // Listen for configuration changes
    this.configService.onDidChangeConfigurationEvent(
      this.handleConfigurationChange.bind(this),
    )
  }

  /**
   * Scan for repositories in configured paths with progress reporting
   * @param cancellationToken
   * @param progressCallback
   */
  public async scanRepositories(
    cancellationToken?: vscode.CancellationToken,
    progressCallback?: ProgressCallback,
  ): Promise<void> {
    if (this.isScanning) {
      console.warn('Scan already in progress')
      return
    }

    this.isScanning = true

    try {
      const config = this.configService.getConfiguration()
      const { rootPaths, scanDepth, excludePaths, includeHidden } =
        config.scanning

      console.warn(`Starting repository scan. Paths: ${rootPaths.join(', ')}`)
      progressCallback?.('Preparing to scan...', 0)

      if (rootPaths.length === 0) {
        console.warn('No root paths configured for scanning')
        progressCallback?.('No scan paths configured', 100)
        return
      }

      const foundRepositories = new Map<string, Repository>()
      const totalPaths = rootPaths.length
      let completedPaths = 0
      const scanPercent = RepositoryManager.SCAN_COMPLETION_PERCENTAGE

      const invalidPaths: string[] = []

      for (const rootPath of rootPaths) {
        if (cancellationToken?.isCancellationRequested) {
          console.warn('Repository scan cancelled')
          progressCallback?.('Scan cancelled by user', 100)
          return
        }

        const pathProgress = Math.floor(
          (completedPaths / totalPaths) * scanPercent,
        )
        progressCallback?.(
          `Scanning folder: ${path.basename(rootPath)}`,
          pathProgress,
        )
        console.warn(`Scanning path: ${rootPath}`)

        // Check if path exists
        try {
          await fs.access(rootPath)
        } catch {
          console.warn(`Path does not exist or is not accessible: ${rootPath}`)
          invalidPaths.push(rootPath)
          completedPaths++
          continue
        }

        const pathRepositories = await this.scanPath(
          rootPath,
          scanDepth,
          includeHidden,
          [...excludePaths],
          cancellationToken,
        )

        // Merge found repositories
        for (const [id, repo] of pathRepositories)
          foundRepositories.set(id, repo)

        completedPaths++
        const pathCompleteProgress = Math.floor(
          (completedPaths / totalPaths) * scanPercent,
        )
        progressCallback?.(
          `Found ${String(pathRepositories.size)} repos in ${path.basename(rootPath)}`,
          pathCompleteProgress,
        )
        console.warn(
          `Path scan completed: ${rootPath}, found: ${String(foundRepositories.size)} total repos`,
        )
      }

      // Report invalid paths to user
      if (invalidPaths.length > 0) {
        const errorMessage = `⚠️ Some scan paths were not accessible: ${invalidPaths.join(', ')}`
        console.error(errorMessage)
        // This will be displayed by the progress callback
        progressCallback?.(errorMessage, undefined)
      }

      // Update repositories map
      progressCallback?.(
        'Updating repository data...',
        RepositoryManager.DATA_UPDATE_PERCENTAGE,
      )
      this.repositories = foundRepositories

      // Load favorites
      progressCallback?.(
        'Loading your favorites...',
        RepositoryManager.FAVORITES_LOAD_PERCENTAGE,
      )
      this.loadFavorites()

      progressCallback?.(
        `✨ Complete! Found ${String(this.repositories.size)} repositories`,
        100,
      )
      console.warn(
        `Repository scan completed. Found ${String(this.repositories.size)} repositories`,
      )
      console.warn('Found repositories:', Array.from(this.repositories.keys()))
      this.onDidChangeRepositories.fire()
    } catch (error) {
      console.error('Repository scan failed:', error)
      progressCallback?.('Scan failed', 100)
      vscode.window.showErrorMessage(`Repository scan failed: ${String(error)}`)
      throw error
    } finally {
      this.isScanning = false
    }
  }

  /**
   * Get all repositories with optional filtering and sorting
   * @param filter
   * @param sort
   */
  public getRepositories(
    filter?: RepositoryFilter,
    sort?: SortOption,
  ): Repository[] {
    let repos = Array.from(this.repositories.values())

    // Apply filters
    if (filter) repos = this.applyFilters(repos, filter)

    // Apply sorting
    if (sort) repos = this.applySorting(repos, sort)

    return repos
  }

  /**
   * Get repository by ID
   * @param id
   */
  public getRepository(id: string): Repository | undefined {
    return this.repositories.get(id)
  }

  /**
   * Toggle favorite status
   * @param repositoryId
   */
  public async toggleFavorite(repositoryId: string): Promise<void> {
    const repo = this.repositories.get(repositoryId)
    if (!repo) throw new Error(`Repository not found: ${repositoryId}`)

    await this.setFavorite(repositoryId, !repo.isFavorite)
  }

  /**
   * Set favorite status
   * @param repositoryId
   * @param isFavorite
   */
  public async setFavorite(
    repositoryId: string,
    isFavorite: boolean,
  ): Promise<void> {
    console.warn(
      `Setting favorite for ${repositoryId}: ${isFavorite ? 'TRUE' : 'FALSE'}`,
    )

    const repo = this.repositories.get(repositoryId)
    if (!repo) {
      console.error(`Repository not found: ${repositoryId}`)
      throw new Error(`Repository not found: ${repositoryId}`)
    }

    const updatedRepo: Repository = {
      ...repo,
      isFavorite,
      updatedAt: new Date(),
    }

    this.repositories.set(repositoryId, updatedRepo)
    console.warn(
      `Repository ${repositoryId} updated, isFavorite: ${String(updatedRepo.isFavorite)}`,
    )

    // Persist favorites
    await this.favoriteService.setFavorite(repositoryId, isFavorite)
    console.warn(`FavoriteService updated for ${repositoryId}`)

    this.onDidChangeRepositories.fire()
    console.warn('Repository change event fired')
  }

  /**
   * Get repository statistics
   */
  public getStatistics(): RepositoryStatistics {
    const repos = Array.from(this.repositories.values())

    return {
      total: repos.length,
      favorites: repos.filter((r) => r.isFavorite).length,
      archived: repos.filter((r) => r.isArchived).length,
      byLanguage: this.getLanguageDistribution(repos),
      lastScanTime: new Date(),
    }
  }

  /**
   * Refresh repository data
   * @param repositoryId
   */
  public async refreshRepository(repositoryId: string): Promise<void> {
    const repo = this.repositories.get(repositoryId)
    if (!repo) throw new Error(`Repository not found: ${repositoryId}`)

    // Re-analyze repository
    const updatedMetadata = await this.analyzer.analyzeRepository(repo.path)
    const updatedGitInfo = await this.gitService.getGitInfo(repo.path)

    const updatedRepo: Repository = {
      ...repo,
      metadata: updatedMetadata,
      gitInfo: updatedGitInfo,
      updatedAt: new Date(),
    }

    this.repositories.set(repositoryId, updatedRepo)
    this.onDidChangeRepositories.fire()
  }

  /**
   * Clear all repository data
   */
  public clearRepositories(): void {
    this.repositories.clear()
    this.onDidChangeRepositories.fire()
  }

  /**
   * Get the favorite service instance
   */
  public getFavoriteService(): FavoriteService {
    return this.favoriteService
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    this.onDidChangeRepositories.dispose()
    this.favoriteService.dispose()
  }

  // Private methods

  /**
   * Scan a single path for repositories
   * @param rootPath
   * @param maxDepth
   * @param includeHidden
   * @param excludePaths
   * @param cancellationToken
   */
  private async scanPath(
    rootPath: string,
    maxDepth: number,
    includeHidden: boolean,
    excludePaths: string[],
    cancellationToken?: vscode.CancellationToken,
  ): Promise<Map<string, Repository>> {
    const repositories = new Map<string, Repository>()

    await this.scanDirectoryRecursive(
      rootPath,
      0,
      maxDepth,
      includeHidden,
      excludePaths,
      repositories,
      cancellationToken,
    )

    return repositories
  }

  /**
   * Recursively scan directory for repositories
   * @param dirPath
   * @param currentDepth
   * @param maxDepth
   * @param includeHidden
   * @param excludePaths
   * @param repositories
   * @param cancellationToken
   */
  private async scanDirectoryRecursive(
    dirPath: string,
    currentDepth: number,
    maxDepth: number,
    includeHidden: boolean,
    excludePaths: string[],
    repositories: Map<string, Repository>,
    cancellationToken?: vscode.CancellationToken,
  ): Promise<void> {
    if (cancellationToken?.isCancellationRequested) return

    if (currentDepth > maxDepth) return

    // Check if path should be excluded
    if (this.shouldExcludePath(dirPath, excludePaths)) return

    try {
      // Check if this directory is a repository
      if (await this.isRepository(dirPath)) {
        const repository = await this.createRepository(dirPath)
        if (repository) {
          repositories.set(repository.id, repository)
          console.warn(`Found repository: ${repository.name} at ${dirPath}`)
          // Don't scan inside repository directories
          return
        }
      }

      // Scan subdirectories
      const entries = await fs.readdir(dirPath, { withFileTypes: true })

      for (const entry of entries) {
        if (cancellationToken?.isCancellationRequested) return

        if (!entry.isDirectory()) continue

        // Skip hidden directories unless includeHidden is true
        if (!includeHidden && entry.name.startsWith('.')) continue

        const subPath = path.join(dirPath, entry.name)
        await this.scanDirectoryRecursive(
          subPath,
          currentDepth + 1,
          maxDepth,
          includeHidden,
          excludePaths,
          repositories,
          cancellationToken,
        )
      }
    } catch (error) {
      console.warn(`Failed to scan directory ${dirPath}:`, error)
    }
  }

  /**
   * Check if path should be excluded
   * @param dirPath
   * @param excludePaths
   */
  private shouldExcludePath(dirPath: string, excludePaths: string[]): boolean {
    const normalized = path.normalize(dirPath)

    return excludePaths.some((excludePath) => {
      const normalizedExclude = path.normalize(excludePath)
      return (
        normalized.includes(normalizedExclude) ||
        normalized.startsWith(normalizedExclude)
      )
    })
  }

  /**
   * Check if directory is a repository
   * @param dirPath
   */
  private async isRepository(dirPath: string): Promise<boolean> {
    return await this.gitService.isGitRepository(dirPath)
  }

  /**
   * Create repository object from path
   * @param dirPath
   */
  private async createRepository(dirPath: string): Promise<Repository | null> {
    try {
      const name = path.basename(dirPath)
      const id = this.generateRepositoryId(dirPath)

      // Get repository metadata and git info
      const [metadata, gitInfo] = await Promise.all([
        this.analyzer.analyzeRepository(dirPath),
        this.gitService.getGitInfo(dirPath),
      ])

      const repository: Repository = {
        id,
        name,
        path: dirPath,
        metadata,
        gitInfo,
        isFavorite: false,
        isArchived: false,
        tags: [],
        lastAccessed: new Date(),
        accessCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastScanAt: new Date(),
      }

      return repository
    } catch (error) {
      console.error(`Failed to create repository object for ${dirPath}:`, error)
      return null
    }
  }

  /**
   * Generate unique repository ID
   * @param dirPath
   */
  private generateRepositoryId(dirPath: string): string {
    // Use normalized path as ID for consistency
    return path.normalize(dirPath).replace(/\\/g, '/')
  }

  /**
   * Apply filters to repositories
   * @param repositories
   * @param filter
   */
  private applyFilters(
    repositories: Repository[],
    filter: RepositoryFilter,
  ): Repository[] {
    // eslint-disable-next-line complexity
    return repositories.filter((repo) => {
      // Search term filter
      if (
        filter.searchTerm &&
        !repo.name.toLowerCase().includes(filter.searchTerm.toLowerCase())
      )
        return false

      // Language filter
      if (
        filter.language &&
        repo.metadata.language.toLowerCase() !== filter.language.toLowerCase()
      )
        return false

      // Tags filter
      if (filter.tags && filter.tags.length > 0) {
        const hasAnyTag = filter.tags.some((tag) => repo.tags.includes(tag))
        if (!hasAnyTag) return false
      }

      // Favorite filter
      if (
        filter.isFavorite !== undefined &&
        repo.isFavorite !== filter.isFavorite
      )
        return false

      // Archived filter
      if (
        filter.isArchived !== undefined &&
        repo.isArchived !== filter.isArchived
      )
        return false

      // Has uncommitted filter
      if (
        filter.hasUncommitted !== undefined &&
        repo.gitInfo.hasUncommitted !== filter.hasUncommitted
      )
        return false

      // Date range filter
      if (filter.dateRange) {
        const { startDate, endDate } = filter.dateRange
        const repoDate = repo.gitInfo.lastCommitDate

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (startDate && repoDate < startDate) return false

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (endDate && repoDate > endDate) return false
      }

      // Last modified after filter
      if (filter.lastModifiedAfter)
        if (repo.gitInfo.lastCommitDate < filter.lastModifiedAfter) return false

      // Name filter (for search functionality)
      if (
        filter.name &&
        !repo.name.toLowerCase().includes(filter.name.toLowerCase())
      )
        return false

      return true
    })
  }

  /**
   * Apply sorting to repositories
   * @param repositories
   * @param sort
   */
  private applySorting(
    repositories: Repository[],
    sort: SortOption,
  ): Repository[] {
    return repositories.sort((a, b) => {
      let comparison = 0

      switch (sort.field) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'language':
          comparison = (a.metadata.language || '').localeCompare(
            b.metadata.language || '',
          )
          break
        case 'lastCommit':
          comparison =
            a.gitInfo.lastCommitDate.getTime() -
            b.gitInfo.lastCommitDate.getTime()
          break
        case 'lastAccessed':
          comparison = a.lastAccessed.getTime() - b.lastAccessed.getTime()
          break
        case 'size':
          comparison =
            (a.metadata.projectSize.totalFiles || 0) -
            (b.metadata.projectSize.totalFiles || 0)
          break
        case 'favorite':
          comparison = (a.isFavorite ? 1 : 0) - (b.isFavorite ? 1 : 0)
          break
        default:
          return 0
      }

      return sort.order === 'desc' ? -comparison : comparison
    })
  }

  /**
   * Handle configuration changes
   */
  private handleConfigurationChange(): void {
    // Trigger re-scan if needed
    console.warn('Configuration changed, consider re-scanning repositories')
  }

  /**
   * Load favorites from service and update repository states
   */
  private loadFavorites(): void {
    console.warn('Loading favorites from FavoriteService...')
    const favoriteIds = this.favoriteService.getFavorites()
    console.warn('Loaded favorite IDs:', favoriteIds)

    let updatedCount = 0
    for (const [id, repo] of this.repositories) {
      const isFavorite = favoriteIds.includes(id)
      if (repo.isFavorite !== isFavorite) {
        this.repositories.set(id, {
          ...repo,
          isFavorite,
        })
        updatedCount++
      }
    }

    console.warn(
      `Updated ${String(updatedCount)} repositories with favorite status`,
    )
  }

  /**
   * Get language distribution statistics
   * @param repositories
   */
  private getLanguageDistribution(
    repositories: Repository[],
  ): Record<string, number> {
    const distribution: Record<string, number> = {}

    repositories.forEach((repo) => {
      const language = repo.metadata.language || 'Unknown'
      distribution[language] = (distribution[language] ?? 0) + 1
    })

    return distribution
  }
}
