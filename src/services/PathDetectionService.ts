import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

interface PathDetectionResult {
  readonly path: string
  readonly hasRepositories: boolean
  readonly repositoryCount: number
  readonly folderCount: number
}

export class PathDetectionService {
  private readonly defaultPaths = [
    '~/Documents/GitHub',
    '~/Documents/github',
    '~/Projects',
    '~/workspace',
    '~/dev',
    '~/code',
    '~/source',
    '~/repos',
  ]

  public async detectCommonPaths(): Promise<PathDetectionResult[]> {
    const results: PathDetectionResult[] = []

    for (const defaultPath of this.defaultPaths) {
      try {
        const expandedPath = this.expandPath(defaultPath)

        if (await this.pathExists(expandedPath)) {
          const result = await this.scanPath(expandedPath)
          results.push(result)
        }
      } catch (error) {
        console.warn(`Failed to scan path ${defaultPath}:`, error)
      }
    }

    return results.sort((a, b) => {
      if (a.hasRepositories && !b.hasRepositories) return -1
      if (!a.hasRepositories && b.hasRepositories) return 1
      return (
        b.repositoryCount + b.folderCount - (a.repositoryCount + a.folderCount)
      )
    })
  }

  public async scanPath(targetPath: string): Promise<PathDetectionResult> {
    const expandedPath = this.expandPath(targetPath)
    let repositoryCount = 0
    let folderCount = 0

    try {
      if (!(await this.pathExists(expandedPath))) {
        return {
          path: expandedPath,
          hasRepositories: false,
          repositoryCount: 0,
          folderCount: 0,
        }
      }

      const entries = await fs.promises.readdir(expandedPath, {
        withFileTypes: true,
      })

      for (const entry of entries) {
        if (entry.isDirectory()) {
          folderCount++

          const fullPath = path.join(expandedPath, entry.name)

          if (await this.isGitRepository(fullPath)) repositoryCount++
        }
      }
    } catch (error) {
      console.warn(`Failed to scan path ${expandedPath}:`, error)
    }

    return {
      path: expandedPath,
      hasRepositories: repositoryCount > 0,
      repositoryCount,
      folderCount,
    }
  }

  private expandPath(targetPath: string): string {
    if (targetPath.startsWith('~/'))
      return path.join(os.homedir(), targetPath.slice(2))
    return targetPath
  }

  private async pathExists(targetPath: string): Promise<boolean> {
    try {
      await fs.promises.access(targetPath)
      return true
    } catch {
      return false
    }
  }

  private async isGitRepository(dirPath: string): Promise<boolean> {
    try {
      const gitDir = path.join(dirPath, '.git')
      const stats = await fs.promises.stat(gitDir)

      if (stats.isDirectory()) return true

      if (stats.isFile()) {
        const content = await fs.promises.readFile(gitDir, 'utf8')
        return content.startsWith('gitdir:')
      }

      return false
    } catch {
      return false
    }
  }
}
