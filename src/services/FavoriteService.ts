import * as vscode from 'vscode'

/**
 * Service for managing favorite repositories
 */
export class FavoriteService {
  private readonly storageKey = 'reposManager.favorites'
  private favorites = new Set<string>()
  private readonly onDidChangeFavorites = new vscode.EventEmitter<string[]>()

  // eslint-disable-next-line @typescript-eslint/member-ordering
  public readonly onDidChangeFavoritesEvent = this.onDidChangeFavorites.event

  constructor(private readonly context?: vscode.ExtensionContext) {
    console.warn('[FavoriteService] Initializing with context:', !!this.context)
    this.loadFavorites()
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    this.onDidChangeFavorites.dispose()
  }

  /**
   * Get all favorite repository IDs
   */
  public getFavorites(): string[] {
    return Array.from(this.favorites)
  }

  /**
   * Check if repository is favorite
   * @param repositoryId
   */
  public isFavorite(repositoryId: string): boolean {
    return this.favorites.has(repositoryId)
  }

  /**
   * Add repository to favorites
   * @param repositoryId
   */
  public async addFavorite(repositoryId: string): Promise<void> {
    console.warn(`FavoriteService: Adding favorite ${repositoryId}`)
    if (!this.favorites.has(repositoryId)) {
      this.favorites.add(repositoryId)
      await this.saveFavorites()
      console.warn(
        `FavoriteService: Added ${repositoryId}, total favorites: ${String(this.favorites.size)}`,
      )
      this.onDidChangeFavorites.fire(this.getFavorites())
    } else {
      console.warn(`FavoriteService: ${repositoryId} already is favorite`)
    }
  }

  /**
   * Remove repository from favorites
   * @param repositoryId
   */
  public async removeFavorite(repositoryId: string): Promise<void> {
    console.warn(`FavoriteService: Removing favorite ${repositoryId}`)
    if (this.favorites.has(repositoryId)) {
      this.favorites.delete(repositoryId)
      await this.saveFavorites()
      console.warn(
        `FavoriteService: Removed ${repositoryId}, total favorites: ${String(this.favorites.size)}`,
      )
      this.onDidChangeFavorites.fire(this.getFavorites())
    } else {
      console.warn(`FavoriteService: ${repositoryId} was not favorite`)
    }
  }

  /**
   * Set favorite status for repository
   * @param repositoryId
   * @param isFavorite
   */
  public async setFavorite(
    repositoryId: string,
    isFavorite: boolean,
  ): Promise<void> {
    if (isFavorite) await this.addFavorite(repositoryId)
    else await this.removeFavorite(repositoryId)
  }

  /**
   * Toggle favorite status
   * @param repositoryId
   */
  public async toggleFavorite(repositoryId: string): Promise<boolean> {
    const wasFavorite = this.isFavorite(repositoryId)
    await this.setFavorite(repositoryId, !wasFavorite)
    return !wasFavorite
  }

  /**
   * Clear all favorites
   */
  public async clearFavorites(): Promise<void> {
    this.favorites.clear()
    await this.saveFavorites()
    this.onDidChangeFavorites.fire(this.getFavorites())
  }

  /**
   * Import favorites from array
   * @param favoriteIds
   */
  public async importFavorites(favoriteIds: string[]): Promise<void> {
    this.favorites = new Set(favoriteIds)
    await this.saveFavorites()
    this.onDidChangeFavorites.fire(this.getFavorites())
  }

  /**
   * Export favorites as array
   */
  public exportFavorites(): string[] {
    return this.getFavorites()
  }

  /**
   * Get favorites count
   */
  public getCount(): number {
    return this.favorites.size
  }

  /**
   * Load favorites from storage
   */
  private loadFavorites(): void {
    try {
      if (this.context) {
        // Use VS Code's global state for persistence
        const stored = this.context.globalState.get<string[]>(
          this.storageKey,
          [],
        )
        this.favorites = new Set(stored)
        console.warn(
          `FavoriteService: Loaded ${String(stored.length)} favorites from storage:`,
          stored,
        )
      } else {
        // Fallback to in-memory storage for testing
        this.favorites = new Set()
        console.warn(
          'FavoriteService: No context provided, using in-memory storage',
        )
      }
    } catch (error) {
      console.warn('Failed to load favorites:', error)
      this.favorites = new Set()
    }
  }

  /**
   * Save favorites to storage
   */
  private async saveFavorites(): Promise<void> {
    try {
      if (this.context) {
        const favoritesArray = this.getFavorites()
        await this.context.globalState.update(this.storageKey, favoritesArray)
        console.warn(
          `FavoriteService: Saved ${String(favoritesArray.length)} favorites to storage:`,
          favoritesArray,
        )
      } else {
        console.warn(
          'FavoriteService: No context provided, cannot save to storage',
        )
      }
    } catch (error) {
      console.warn('Failed to save favorites:', error)
    }
  }
}
