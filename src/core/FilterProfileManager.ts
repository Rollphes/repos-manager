import * as vscode from 'vscode';
import { Repository, FilterProfile, FilterProfileExport, FilterCriteria, FilterProfileStats, CustomCondition } from '../types';

/**
 * Internal filter profile type for mutable operations
 */
interface MutableFilterProfile {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  filters: FilterCriteria;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

/**
 * Filter Profile storage structure
 */
interface FilterProfileStorage {
  profiles: Record<string, MutableFilterProfile>;
  activeProfileId?: string;
  lastModified: Date;
}

/**
 * Filter Profile Manager - Manages dynamic repository grouping based on filter conditions
 */
export class FilterProfileManager {
  private readonly context: vscode.ExtensionContext;
  private readonly storageKey = 'reposManager.filterProfiles';
  private readonly profiles: Map<string, MutableFilterProfile> = new Map();
  private activeProfileId?: string;

  // Event emitters
  private readonly _onDidChangeProfiles = new vscode.EventEmitter<void>();
  public readonly onDidChangeProfiles = this._onDidChangeProfiles.event;

  private readonly _onDidChangeActiveProfile = new vscode.EventEmitter<string | undefined>();
  public readonly onDidChangeActiveProfile = this._onDidChangeActiveProfile.event;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.loadProfiles();
  }

  /**
   * Create a new filter profile
   */
  async createProfile(name: string, filters: FilterCriteria, options?: {
    description?: string;
    icon?: string;
    color?: string;
    tags?: string[];
  }): Promise<FilterProfile> {
    const id = this.generateId();
    const now = new Date();

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
      tags: options?.tags || []
    };

    this.profiles.set(id, profile);
    await this.saveProfiles();
    this._onDidChangeProfiles.fire();

    return this.toReadonly(profile);
  }

  /**
   * Update an existing filter profile
   */
  async updateProfile(id: string, updates: Partial<FilterProfile>): Promise<FilterProfile> {
    const profile = this.profiles.get(id);
    if (!profile) {
      throw new Error(`Filter profile with ID ${id} not found`);
    }

    const updatedProfile: MutableFilterProfile = {
      ...profile,
      ...updates,
      id, // Preserve ID
      updatedAt: new Date(),
      tags: updates.tags ? [...updates.tags] : profile.tags
    };

    this.profiles.set(id, updatedProfile);
    await this.saveProfiles();
    this._onDidChangeProfiles.fire();

    return this.toReadonly(updatedProfile);
  }

  /**
   * Delete a filter profile
   */
  async deleteProfile(id: string): Promise<void> {
    if (!this.profiles.has(id)) {
      throw new Error(`Filter profile with ID ${id} not found`);
    }

    this.profiles.delete(id);

    // If this was the active profile, clear the active state
    if (this.activeProfileId === id) {
      this.activeProfileId = undefined;
      this._onDidChangeActiveProfile.fire(undefined);
    }

    await this.saveProfiles();
    this._onDidChangeProfiles.fire();
  }

  /**
   * Get all filter profiles
   */
  getProfiles(): FilterProfile[] {
    return Array.from(this.profiles.values()).map(profile => this.toReadonly(profile));
  }

  /**
   * Get a specific filter profile by ID
   */
  getProfile(id: string): FilterProfile | undefined {
    const profile = this.profiles.get(id);
    return profile ? this.toReadonly(profile) : undefined;
  }

  /**
   * Apply a filter profile (make it active and return matching repositories)
   */
  async applyProfile(id: string, repositories: Repository[]): Promise<Repository[]> {
    const profile = this.profiles.get(id);
    if (!profile) {
      throw new Error(`Filter profile with ID ${id} not found`);
    }

    // Update active state
    if (this.activeProfileId) {
      const previousActive = this.profiles.get(this.activeProfileId);
      if (previousActive) {
        previousActive.isActive = false;
      }
    }

    profile.isActive = true;
    this.activeProfileId = id;

    await this.saveProfiles();
    this._onDidChangeActiveProfile.fire(id);
    this._onDidChangeProfiles.fire();

    // Apply filters and return matching repositories
    return this.applyFilters(repositories, profile.filters);
  }

  /**
   * Get the currently active filter profile
   */
  getCurrentProfile(): FilterProfile | null {
    if (!this.activeProfileId) {
      return null;
    }
    const profile = this.profiles.get(this.activeProfileId);
    return profile ? this.toReadonly(profile) : null;
  }

  /**
   * Clear active filter profile
   */
  async clearActiveProfile(): Promise<void> {
    if (this.activeProfileId) {
      const profile = this.profiles.get(this.activeProfileId);
      if (profile) {
        profile.isActive = false;
      }
      this.activeProfileId = undefined;
      await this.saveProfiles();
      this._onDidChangeActiveProfile.fire(undefined);
      this._onDidChangeProfiles.fire();
    }
  }

  /**
   * Export a filter profile for sharing
   */
  async exportProfile(id: string): Promise<FilterProfileExport> {
    const profile = this.profiles.get(id);
    if (!profile) {
      throw new Error(`Filter profile with ID ${id} not found`);
    }

    return {
      version: '1.0.0',
      profile: {
        name: profile.name,
        description: profile.description,
        icon: profile.icon,
        color: profile.color,
        filters: profile.filters,
        tags: [...profile.tags]
      },
      metadata: {
        exportedBy: 'Repos Manager',
        exportedAt: new Date(),
        compatibilityVersion: '0.1.0'
      }
    };
  }

  /**
   * Import a filter profile from export data
   */
  async importProfile(data: FilterProfileExport): Promise<FilterProfile> {
    const id = this.generateId();
    const now = new Date();

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
      tags: [...(data.profile.tags || [])]
    };

    this.profiles.set(id, profile);
    await this.saveProfiles();
    this._onDidChangeProfiles.fire();

    return this.toReadonly(profile);
  }

  /**
   * Get statistics for a filter profile
   */
  async getProfileStatistics(id: string, repositories: Repository[]): Promise<FilterProfileStats> {
    const profile = this.profiles.get(id);
    if (!profile) {
      throw new Error(`Filter profile with ID ${id} not found`);
    }

    const matchingRepos = this.applyFilters(repositories, profile.filters);

    // Calculate language distribution
    const languageDistribution: Record<string, number> = {};
    matchingRepos.forEach(repo => {
      const lang = repo.metadata.language;
      languageDistribution[lang] = (languageDistribution[lang] || 0) + 1;
    });

    // Find last activity
    const lastActivity = matchingRepos.reduce((latest, repo) => {
      return repo.lastAccessed > latest ? repo.lastAccessed : latest;
    }, new Date(0));

    // Calculate average health (mock implementation)
    const DEFAULT_HEALTH_SCORE = 85; // Default health score for mock implementation
    const averageHealth = matchingRepos.length > 0 ? DEFAULT_HEALTH_SCORE : 0;

    return {
      totalRepositories: matchingRepos.length,
      languageDistribution,
      lastActivity,
      averageHealth,
      matchedRepositoryIds: matchingRepos.map(repo => repo.id)
    };
  }

  /**
   * Apply filters to repositories and return matching ones
   */
  private applyFilters(repositories: Repository[], filters: FilterCriteria): Repository[] {
    return repositories.filter(repo => {
      // Language filter
      if (filters.languages.length > 0 && !filters.languages.includes(repo.metadata.language)) {
        return false;
      }

      // Favorites filter
      if (filters.favoritesOnly && !repo.isFavorite) {
        return false;
      }

      // Archived filter
      if (filters.excludeArchived && repo.isArchived) {
        return false;
      }

      // Tags filter
      if (filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(tag => repo.tags.includes(tag));
        if (!hasMatchingTag) {
          return false;
        }
      }

      // Git state filter
      if (filters.gitStates.length > 0) {
        const repoGitState = this.getRepositoryGitState(repo);
        if (!filters.gitStates.includes(repoGitState)) {
          return false;
        }
      }

      // Date range filter
      if (filters.dateRange) {
        if (repo.lastAccessed < filters.dateRange.start || repo.lastAccessed > filters.dateRange.end) {
          return false;
        }
      }

      // Size range filter
      if (filters.sizeRange) {
        const fileCount = repo.metadata.projectSize.totalFiles;
        if (fileCount < filters.sizeRange.minFiles || fileCount > filters.sizeRange.maxFiles) {
          return false;
        }
      }

      // Tests filter
      if (filters.hasTests !== undefined && repo.metadata.hasTests !== filters.hasTests) {
        return false;
      }

      // CI/CD filter
      if (filters.hasCicd !== undefined && repo.metadata.hasCicd !== filters.hasCicd) {
        return false;
      }

      // Custom conditions
      if (filters.customConditions && filters.customConditions.length > 0) {
        for (const condition of filters.customConditions) {
          if (!this.evaluateCustomCondition(repo, condition)) {
            return false;
          }
        }
      }

      return true;
    });
  }

  /**
   * Get Git state for a repository
   */
  private getRepositoryGitState(repo: Repository): string {
    if (repo.gitInfo.hasUncommitted) {
      return 'modified';
    }
    if (repo.gitInfo.aheadBehind.behind > 0) {
      return 'behind';
    }
    if (repo.gitInfo.aheadBehind.ahead > 0) {
      return 'ahead';
    }
    return 'clean';
  }

  /**
   * Evaluate a custom condition against a repository
   */
  private evaluateCustomCondition(repo: Repository, condition: CustomCondition): boolean {
    // This is a simplified implementation
    // In a full implementation, you'd have proper field resolution and type checking
    const value = this.getRepositoryFieldValue(repo, condition.field);

    switch (condition.operator) {
    case 'equals':
      return value === condition.value;
    case 'contains':
      return typeof value === 'string' && value.includes(String(condition.value));
    case 'startsWith':
      return typeof value === 'string' && value.startsWith(String(condition.value));
    case 'endsWith':
      return typeof value === 'string' && value.endsWith(String(condition.value));
    case 'greaterThan':
      return typeof value === 'number' && value > Number(condition.value);
    case 'lessThan':
      return typeof value === 'number' && value < Number(condition.value);
    default:
      return false;
    }
  }

  /**
   * Get a field value from a repository (simplified implementation)
   */
  private getRepositoryFieldValue(repo: Repository, field: string): string | number | boolean | undefined {
    switch (field) {
    case 'name':
      return repo.name;
    case 'language':
      return repo.metadata.language;
    case 'accessCount':
      return repo.accessCount;
    case 'totalFiles':
      return repo.metadata.projectSize.totalFiles;
    case 'hasTests':
      return repo.metadata.hasTests;
    case 'hasCicd':
      return repo.metadata.hasCicd;
    default:
      return undefined;
    }
  }

  /**
   * Load filter profiles from storage
   */
  private async loadProfiles(): Promise<void> {
    try {
      const data = this.context.globalState.get<FilterProfileStorage>(this.storageKey);

      if (data?.profiles) {
        this.profiles.clear();

        Object.values(data.profiles).forEach(profile => {
          this.profiles.set(profile.id, {
            ...profile,
            createdAt: new Date(profile.createdAt),
            updatedAt: new Date(profile.updatedAt)
          });
        });

        this.activeProfileId = data.activeProfileId;
      }
    } catch (error) {
      console.error('Failed to load filter profiles:', error);
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
        lastModified: new Date()
      };

      this.profiles.forEach(profile => {
        data.profiles[profile.id] = profile;
      });

      await this.context.globalState.update(this.storageKey, data);
    } catch (error) {
      console.error('Failed to save filter profiles:', error);
      throw error;
    }
  }

  /**
   * Generate a unique ID for filter profiles
   */
  private generateId(): string {
    return `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Convert mutable profile to readonly version
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
      tags: [...profile.tags]
    };
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this._onDidChangeProfiles.dispose();
    this._onDidChangeActiveProfile.dispose();
  }
}
