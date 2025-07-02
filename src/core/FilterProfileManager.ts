import {
  CustomCondition,
  FilterCriteria,
  FilterProfile,
  FilterProfileExport,
  FilterProfileStats,
  GitState,
  Repository,
} from '@types'
import * as vscode from 'vscode'

/**
 * Internal filter profile type for mutable operations
 */
interface MutableFilterProfile {
  id: string
  name: string
  description?: string
  icon?: string
  color?: string
  filters: FilterCriteria
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  tags: string[]
}

/**
 * Filter Profile storage structure
 */
interface FilterProfileStorage {
  profiles: Record<string, MutableFilterProfile>
  activeProfileId?: string
  lastModified: Date
}

/**
 * Filter Profile Manager - Manages dynamic repository grouping based on filter conditions
 */
export class FilterProfileManager {
  // Public events
  public readonly onDidChangeProfilesEvent: vscode.Event<void>
  public readonly onDidChangeActiveProfileEvent: vscode.Event<
    string | undefined
  >

  // Private properties
  private readonly context: vscode.ExtensionContext
  private readonly storageKey = 'reposManager.filterProfiles'
  private readonly profiles = new Map<string, MutableFilterProfile>()
  private activeProfileId?: string

  // Event emitters
  private readonly onDidChangeProfiles = new vscode.EventEmitter<void>()
  private readonly onDidChangeActiveProfile = new vscode.EventEmitter<
    string | undefined
  >()

  constructor(context: vscode.ExtensionContext) {
    this.context = context
    this.onDidChangeProfilesEvent = this.onDidChangeProfiles.event
    this.onDidChangeActiveProfileEvent = this.onDidChangeActiveProfile.event
    this.loadProfiles()
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    this.onDidChangeProfiles.dispose()
    this.onDidChangeActiveProfile.dispose()
  }

  /**
   * Create a new filter profile
   * @param name
   * @param filters
   * @param options
   * @param options.description
   * @param options.icon
   * @param options.color
   * @param options.tags
   */
  public async createProfile(
    name: string,
    filters: FilterCriteria,
    options?: {
      description?: string
      icon?: string
      color?: string
      tags?: string[]
    },
  ): Promise<FilterProfile> {
    const id = this.generateId()
    const now = new Date()

    const profile: MutableFilterProfile = {
      id,
      name,
      description: options?.description,
      icon: options?.icon,
      color: options?.color,
      filters,
      isActive: false,
      createdAt: now,
      updatedAt: now,
      tags: options?.tags ?? [],
    }

    this.profiles.set(id, profile)
    await this.saveProfiles()
    this.onDidChangeProfiles.fire()

    return this.toReadonly(profile)
  }

  /**
   * Update an existing filter profile
   * @param id
   * @param updates
   */
  public async updateProfile(
    id: string,
    updates: Partial<FilterProfile>,
  ): Promise<FilterProfile> {
    const profile = this.profiles.get(id)
    if (!profile) throw new Error(`Filter profile with ID ${id} not found`)

    const updatedProfile: MutableFilterProfile = {
      ...profile,
      ...updates,
      id, // Preserve ID
      updatedAt: new Date(),
      tags: updates.tags ? [...updates.tags] : profile.tags,
    }

    this.profiles.set(id, updatedProfile)
    await this.saveProfiles()
    this.onDidChangeProfiles.fire()

    return this.toReadonly(updatedProfile)
  }

  /**
   * Delete a filter profile
   * @param id
   */
  public async deleteProfile(id: string): Promise<void> {
    if (!this.profiles.has(id))
      throw new Error(`Filter profile with ID ${id} not found`)

    this.profiles.delete(id)

    // If this was the active profile, clear the active state
    if (this.activeProfileId === id) {
      this.activeProfileId = undefined
      this.onDidChangeActiveProfile.fire(undefined)
    }

    await this.saveProfiles()
    this.onDidChangeProfiles.fire()
  }

  /**
   * Get all filter profiles
   */
  public getProfiles(): FilterProfile[] {
    return Array.from(this.profiles.values()).map((profile) =>
      this.toReadonly(profile),
    )
  }

  /**
   * Get a specific filter profile by ID
   * @param id
   */
  public getProfile(id: string): FilterProfile | undefined {
    const profile = this.profiles.get(id)
    return profile ? this.toReadonly(profile) : undefined
  }

  /**
   * Apply a filter profile (make it active and return matching repositories)
   * @param id
   * @param repositories
   */
  public async applyProfile(
    id: string,
    repositories: Repository[],
  ): Promise<Repository[]> {
    const profile = this.profiles.get(id)
    if (!profile) throw new Error(`Filter profile with ID ${id} not found`)

    // Update active state
    if (this.activeProfileId) {
      const previousActive = this.profiles.get(this.activeProfileId)
      if (previousActive) previousActive.isActive = false
    }

    profile.isActive = true
    this.activeProfileId = id

    await this.saveProfiles()
    this.onDidChangeActiveProfile.fire(id)
    this.onDidChangeProfiles.fire()

    // Apply filters and return matching repositories
    return this.applyFilters(repositories, profile.filters)
  }

  /**
   * Get the currently active filter profile
   */
  public getCurrentProfile(): FilterProfile | null {
    if (!this.activeProfileId) return null

    const profile = this.profiles.get(this.activeProfileId)
    return profile ? this.toReadonly(profile) : null
  }

  /**
   * Clear active filter profile
   */
  public async clearActiveProfile(): Promise<void> {
    if (this.activeProfileId) {
      const profile = this.profiles.get(this.activeProfileId)
      if (profile) profile.isActive = false

      this.activeProfileId = undefined
      await this.saveProfiles()
      this.onDidChangeActiveProfile.fire(undefined)
      this.onDidChangeProfiles.fire()
    }
  }

  /**
   * Export a filter profile for sharing
   * @param id
   */
  public exportProfile(id: string): FilterProfileExport {
    const profile = this.profiles.get(id)
    if (!profile) throw new Error(`Filter profile with ID ${id} not found`)

    return {
      version: '1.0.0',
      profile: {
        name: profile.name,
        description: profile.description,
        icon: profile.icon,
        color: profile.color,
        filters: profile.filters,
        tags: [...profile.tags],
      },
      metadata: {
        exportedBy: 'Repos Manager',
        exportedAt: new Date(),
        compatibilityVersion: '0.1.0',
      },
    }
  }

  /**
   * Import a filter profile from export data
   * @param data
   */
  public async importProfile(
    data: FilterProfileExport,
  ): Promise<FilterProfile> {
    const id = this.generateId()
    const now = new Date()

    const profile: MutableFilterProfile = {
      id,
      name: data.profile.name,
      description: data.profile.description,
      icon: data.profile.icon,
      color: data.profile.color,
      filters: data.profile.filters,
      isActive: false,
      createdAt: now,
      updatedAt: now,
      tags: [...data.profile.tags],
    }

    this.profiles.set(id, profile)
    await this.saveProfiles()
    this.onDidChangeProfiles.fire()

    return this.toReadonly(profile)
  }

  /**
   * Get statistics for a filter profile
   * @param id
   * @param repositories
   */
  public getProfileStatistics(
    id: string,
    repositories: Repository[],
  ): FilterProfileStats {
    const profile = this.profiles.get(id)
    if (!profile) throw new Error(`Filter profile with ID ${id} not found`)

    const matchingRepos = this.applyFilters(repositories, profile.filters)

    // Calculate language distribution
    const languageDistribution: Record<string, number> = {}
    matchingRepos.forEach((repo) => {
      const lang = repo.metadata.language
      languageDistribution[lang] = (languageDistribution[lang] ?? 0) + 1
    })

    // Find last activity
    const lastActivity = matchingRepos.reduce((latest, repo) => {
      return repo.lastAccessed > latest ? repo.lastAccessed : latest
    }, new Date(0))

    // Calculate average health (mock implementation)
    const defaultHealthScore = 85 // Default health score for mock implementation
    const averageHealth = matchingRepos.length > 0 ? defaultHealthScore : 0

    return {
      totalRepositories: matchingRepos.length,
      languageDistribution,
      lastActivity,
      averageHealth,
      matchedRepositoryIds: matchingRepos.map((repo) => repo.id),
    }
  }

  /**
   * Apply filters to repositories and return matching ones
   * @param repositories
   * @param filters
   */
  private applyFilters(
    repositories: Repository[],
    filters: FilterCriteria,
  ): Repository[] {
    return repositories.filter((repo) => this.matchesAllFilters(repo, filters))
  }

  /**
   * Check if repository matches all filters
   * @param repo
   * @param filters
   */
  private matchesAllFilters(
    repo: Repository,
    filters: FilterCriteria,
  ): boolean {
    return (
      this.matchesLanguageFilter(repo, filters) &&
      this.matchesFavoritesFilter(repo, filters) &&
      this.matchesArchivedFilter(repo, filters) &&
      this.matchesTagsFilter(repo, filters) &&
      this.matchesGitStateFilter(repo, filters) &&
      this.matchesDateRangeFilter(repo, filters) &&
      this.matchesSizeRangeFilter(repo, filters) &&
      this.matchesTestsFilter(repo, filters) &&
      this.matchesCicdFilter(repo, filters) &&
      this.matchesCustomConditions(repo, filters)
    )
  }

  /**
   * Check language filter match
   */
  private matchesLanguageFilter(
    repo: Repository,
    filters: FilterCriteria,
  ): boolean {
    return (
      filters.languages.length === 0 ||
      filters.languages.includes(repo.metadata.language)
    )
  }

  /**
   * Check favorites filter match
   */
  private matchesFavoritesFilter(
    repo: Repository,
    filters: FilterCriteria,
  ): boolean {
    return !filters.favoritesOnly || repo.isFavorite
  }

  /**
   * Check archived filter match
   */
  private matchesArchivedFilter(
    repo: Repository,
    filters: FilterCriteria,
  ): boolean {
    return !filters.excludeArchived || !repo.isArchived
  }

  /**
   * Check tags filter match
   */
  private matchesTagsFilter(
    repo: Repository,
    filters: FilterCriteria,
  ): boolean {
    if (filters.tags.length === 0) return true
    return filters.tags.some((tag) => repo.tags.includes(tag))
  }

  /**
   * Check git state filter match
   */
  private matchesGitStateFilter(
    repo: Repository,
    filters: FilterCriteria,
  ): boolean {
    if (filters.gitStates.length === 0) return true
    const repoGitState = this.getRepositoryGitState(repo)
    return filters.gitStates.includes(repoGitState)
  }

  /**
   * Check date range filter match
   */
  private matchesDateRangeFilter(
    repo: Repository,
    filters: FilterCriteria,
  ): boolean {
    if (!filters.dateRange) return true
    return (
      repo.lastAccessed >= filters.dateRange.start &&
      repo.lastAccessed <= filters.dateRange.end
    )
  }

  /**
   * Check size range filter match
   */
  private matchesSizeRangeFilter(
    repo: Repository,
    filters: FilterCriteria,
  ): boolean {
    if (!filters.sizeRange) return true
    const fileCount = repo.metadata.projectSize.totalFiles
    return (
      fileCount >= filters.sizeRange.minFiles &&
      fileCount <= filters.sizeRange.maxFiles
    )
  }

  /**
   * Check tests filter match
   */
  private matchesTestsFilter(
    repo: Repository,
    filters: FilterCriteria,
  ): boolean {
    return (
      filters.hasTests === undefined ||
      repo.metadata.hasTests === filters.hasTests
    )
  }

  /**
   * Check CI/CD filter match
   */
  private matchesCicdFilter(
    repo: Repository,
    filters: FilterCriteria,
  ): boolean {
    return (
      filters.hasCicd === undefined || repo.metadata.hasCicd === filters.hasCicd
    )
  }

  /**
   * Check custom conditions match
   */
  private matchesCustomConditions(
    repo: Repository,
    filters: FilterCriteria,
  ): boolean {
    if (!filters.customConditions || filters.customConditions.length === 0)
      return true

    return filters.customConditions.every((condition) =>
      this.evaluateCustomCondition(repo, condition),
    )
  }

  /**
   * Get Git state for a repository
   * @param repo
   */
  private getRepositoryGitState(repo: Repository): GitState {
    if (repo.gitInfo.hasUncommitted) return 'modified'

    if (repo.gitInfo.aheadBehind.behind > 0) return 'behind'

    if (repo.gitInfo.aheadBehind.ahead > 0) return 'ahead'

    return 'clean'
  }

  /**
   * Evaluate a custom condition against a repository
   * @param repo
   * @param condition
   */
  private evaluateCustomCondition(
    repo: Repository,
    condition: CustomCondition,
  ): boolean {
    // This is a simplified implementation
    // In a full implementation, you'd have proper field resolution and type checking
    const value = this.getRepositoryFieldValue(repo, condition.field)

    switch (condition.operator) {
      case 'equals':
        return value === condition.value
      case 'contains':
        return (
          typeof value === 'string' && value.includes(String(condition.value))
        )
      case 'startsWith':
        return (
          typeof value === 'string' && value.startsWith(String(condition.value))
        )
      case 'endsWith':
        return (
          typeof value === 'string' && value.endsWith(String(condition.value))
        )
      case 'greaterThan':
        return typeof value === 'number' && value > Number(condition.value)
      case 'lessThan':
        return typeof value === 'number' && value < Number(condition.value)
      default:
        return false
    }
  }

  /**
   * Get a field value from a repository (simplified implementation)
   * @param repo
   * @param field
   */
  private getRepositoryFieldValue(
    repo: Repository,
    field: string,
  ): string | number | boolean | undefined {
    switch (field) {
      case 'name':
        return repo.name
      case 'language':
        return repo.metadata.language
      case 'accessCount':
        return repo.accessCount
      case 'totalFiles':
        return repo.metadata.projectSize.totalFiles
      case 'hasTests':
        return repo.metadata.hasTests
      case 'hasCicd':
        return repo.metadata.hasCicd
      default:
        return undefined
    }
  }

  /**
   * Load filter profiles from storage
   */
  private loadProfiles(): void {
    try {
      const data = this.context.globalState.get<FilterProfileStorage>(
        this.storageKey,
      )

      if (data?.profiles) {
        this.profiles.clear()

        Object.values(data.profiles).forEach((profile) => {
          this.profiles.set(profile.id, {
            ...profile,
            createdAt: new Date(profile.createdAt),
            updatedAt: new Date(profile.updatedAt),
          })
        })

        this.activeProfileId = data.activeProfileId
      }
    } catch (error) {
      console.error('Failed to load filter profiles:', error)
    }
  }

  /**
   * Save filter profiles to storage
   */
  private async saveProfiles(): Promise<void> {
    try {
      const data: FilterProfileStorage = {
        profiles: {},
        activeProfileId: this.activeProfileId,
        lastModified: new Date(),
      }

      this.profiles.forEach((profile) => {
        data.profiles[profile.id] = profile
      })

      await this.context.globalState.update(this.storageKey, data)
    } catch (error) {
      console.error('Failed to save filter profiles:', error)
      throw error
    }
  }

  /**
   * Generate a unique ID for filter profiles
   */
  private generateId(): string {
    const base36 = 36 // Base for generating random string
    const randomStringLength = 9 // Length of random string suffix
    return `profile_${Date.now().toString()}_${Math.random()
      .toString(base36)
      .substring(2, 2 + randomStringLength)}`
  }

  /**
   * Convert mutable profile to readonly version
   * @param profile
   */
  private toReadonly(profile: MutableFilterProfile): FilterProfile {
    return {
      id: profile.id,
      name: profile.name,
      description: profile.description,
      icon: profile.icon,
      color: profile.color,
      filters: profile.filters,
      isActive: profile.isActive,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      tags: [...profile.tags],
    }
  }
}
