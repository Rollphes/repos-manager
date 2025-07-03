import type { CachedRepository, Repository, RepositoryCache } from '@types'
import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'

export class CacheService {
  private readonly cacheFile: string
  private readonly cacheVersion = '1.0.0'
  private readonly defaultMaxAge = 24 * 60 * 60

  constructor(private readonly context: vscode.ExtensionContext) {
    this.cacheFile = path.join(
      context.globalStorageUri.fsPath,
      'repository-cache.json',
    )
  }

  public async loadCache(): Promise<readonly CachedRepository[] | null> {
    try {
      if (!fs.existsSync(this.cacheFile)) return null

      const cacheData = JSON.parse(
        await fs.promises.readFile(this.cacheFile, 'utf8'),
      ) as RepositoryCache

      if (cacheData.version !== this.cacheVersion) return null

      const currentTargetDirs = this.getTargetDirectories()
      if (!this.areArraysEqual(cacheData.targetDirectories, currentTargetDirs))
        return null

      const maxAge = this.getCacheMaxAge()
      if (Date.now() - cacheData.timestamp > maxAge * 1000) return null

      return cacheData.repositories
    } catch (error) {
      console.warn('Failed to load cache:', error)
      return null
    }
  }

  public async saveCache(repositories: readonly Repository[]): Promise<void> {
    try {
      const cacheData: RepositoryCache = {
        version: this.cacheVersion,
        timestamp: Date.now(),
        targetDirectories: this.getTargetDirectories(),
        repositories: await Promise.all(
          repositories.map(async (repo) => ({
            ...repo,
            cacheTimestamp: Date.now(),
            directoryLastModified: await this.getDirectoryLastModified(
              repo.path,
            ),
          })),
        ),
      }
      const cacheDir = path.dirname(this.cacheFile)
      if (!fs.existsSync(cacheDir))
        await fs.promises.mkdir(cacheDir, { recursive: true })

      await fs.promises.writeFile(
        this.cacheFile,
        JSON.stringify(cacheData, null, 2),
      )
    } catch (error) {
      console.warn('Failed to save cache:', error)
    }
  }

  public async updateRepositoryCache(repository: Repository): Promise<void> {
    const cache = await this.loadCache()
    if (!cache) return

    const mutableCache = [...cache]
    const index = mutableCache.findIndex((r) => r.id === repository.id)
    const cachedRepo: CachedRepository = {
      ...repository,
      cacheTimestamp: Date.now(),
      directoryLastModified: await this.getDirectoryLastModified(
        repository.path,
      ),
    }

    if (index >= 0) mutableCache[index] = cachedRepo
    else mutableCache.push(cachedRepo)

    await this.saveCache(mutableCache)
  }

  public async cleanupCache(validPaths: readonly string[]): Promise<void> {
    const cache = await this.loadCache()
    if (!cache) return

    const validCache = cache.filter((repo) => validPaths.includes(repo.path))
    await this.saveCache(validCache)
  }

  public async isDirectoryChanged(
    cachedRepo: CachedRepository,
  ): Promise<boolean> {
    try {
      const currentLastModified = await this.getDirectoryLastModified(
        cachedRepo.path,
      )
      return currentLastModified > cachedRepo.directoryLastModified
    } catch {
      return true
    }
  }

  public async clearCache(): Promise<void> {
    try {
      if (fs.existsSync(this.cacheFile))
        await fs.promises.unlink(this.cacheFile)
    } catch (error) {
      console.warn('Failed to clear cache:', error)
    }
  }

  public async getCacheStats(): Promise<{
    exists: boolean
    repositoryCount: number
    lastUpdated: Date | null
    size: number
  }> {
    try {
      if (!fs.existsSync(this.cacheFile)) {
        return {
          exists: false,
          size: 0,
          repositoryCount: 0,
          lastUpdated: null,
        }
      }

      const stats = await fs.promises.stat(this.cacheFile)
      const cache = await this.loadCache()

      return {
        exists: true,
        size: stats.size,
        repositoryCount: cache?.length ?? 0,
        lastUpdated: stats.mtime,
      }
    } catch {
      return {
        exists: false,
        size: 0,
        repositoryCount: 0,
        lastUpdated: null,
      }
    }
  }

  private getTargetDirectories(): readonly string[] {
    const config = vscode.workspace.getConfiguration('reposManager')
    return config.get<string[]>('scan.targetDirectories', [])
  }

  private getCacheMaxAge(): number {
    const config = vscode.workspace.getConfiguration('reposManager')
    return config.get<number>('cache.maxAge', this.defaultMaxAge)
  }

  private async getDirectoryLastModified(dirPath: string): Promise<number> {
    try {
      const stats = await fs.promises.stat(dirPath)
      return stats.mtime.getTime()
    } catch {
      return 0
    }
  }

  private areArraysEqual(
    arr1: readonly string[],
    arr2: readonly string[],
  ): boolean {
    if (arr1.length !== arr2.length) return false

    const sorted1 = [...arr1].sort()
    const sorted2 = [...arr2].sort()
    return sorted1.every((val, index) => val === sorted2[index])
  }
}
