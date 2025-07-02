import {
  Dependency,
  ProjectSize,
  ReadmeQuality,
  RepositoryMetadata,
} from '@types'
import * as fs from 'fs/promises'
import * as path from 'path'

/**
 * Repository analyzer service for detecting project metadata
 */
export class RepositoryAnalyzer {
  private static readonly MAX_SCAN_DEPTH = 3 // Maximum directory scan depth for analysis

  private static readonly MIN_README_LENGTH = 100 // Minimum README length for description score

  private static readonly MAX_README_SCORE = 10 // Maximum README quality score

  /**
   * Analyze a repository and extract metadata
   * @param repositoryPath
   */
  public async analyzeRepository(
    repositoryPath: string,
  ): Promise<RepositoryMetadata> {
    try {
      const [
        language,
        runtime,
        databases,
        dependencies,
        projectSize,
        readmeQuality,
        hasTests,
        hasCicd,
        license,
      ] = await Promise.all([
        this.detectPrimaryLanguage(repositoryPath),
        this.detectRuntime(repositoryPath),
        this.detectDatabases(repositoryPath),
        this.analyzeDependencies(repositoryPath),
        this.calculateProjectSize(repositoryPath),
        this.analyzeReadmeQuality(repositoryPath),
        this.hasTests(repositoryPath),
        this.hasCiCd(repositoryPath),
        this.detectLicense(repositoryPath),
      ])

      return {
        language,
        ...(runtime && { runtime }),
        databases,
        dependencies,
        projectSize,
        readmeQuality,
        hasTests,
        hasCicd,
        ...(license && { license }),
      }
    } catch {
      // Return minimal metadata on error
      return {
        language: 'Unknown',
        databases: [],
        dependencies: [],
        projectSize: {
          totalFiles: 0,
          totalSize: 0,
          codeFiles: 0,
          codeSize: 0,
        },
        readmeQuality: {
          exists: false,
          hasDescription: false,
          hasInstallation: false,
          hasUsage: false,
          score: 0,
        },
        hasTests: false,
        hasCicd: false,
      }
    }
  }

  /**
   * Detect primary programming language
   * @param repositoryPath
   */
  private async detectPrimaryLanguage(repositoryPath: string): Promise<string> {
    const languageStats: Record<string, number> = {}

    try {
      await this.scanForLanguages(
        repositoryPath,
        languageStats,
        0,
        RepositoryAnalyzer.MAX_SCAN_DEPTH,
      )

      if (Object.keys(languageStats).length === 0) return 'Unknown'

      // Return language with highest line count
      const sortedLanguages = Object.entries(languageStats).sort(
        ([, a], [, b]) => b - a,
      )
      return sortedLanguages.length > 0
        ? (sortedLanguages[0]?.[0] ?? 'Unknown')
        : 'Unknown'
    } catch {
      return 'Unknown'
    }
  }

  /**
   * Recursively scan for languages
   * @param dirPath
   * @param stats
   * @param currentDepth
   * @param maxDepth
   */
  private async scanForLanguages(
    dirPath: string,
    stats: Record<string, number>,
    currentDepth: number,
    maxDepth: number,
  ): Promise<void> {
    if (currentDepth > maxDepth) return

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })

      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry.name)

        if (entry.isDirectory()) {
          // Skip common non-source directories
          if (this.shouldSkipDirectory(entry.name)) continue

          await this.scanForLanguages(
            entryPath,
            stats,
            currentDepth + 1,
            maxDepth,
          )
        } else if (entry.isFile()) {
          const language = this.getLanguageFromExtension(entry.name)
          if (language) {
            const lineCount = await this.countLines(entryPath)
            stats[language] = (stats[language] ?? 0) + lineCount
          }
        }
      }
    } catch {
      // Skip directories that can't be read
    }
  }

  /**
   * Check if directory should be skipped
   * @param name
   */
  private shouldSkipDirectory(name: string): boolean {
    const skipDirs = [
      'node_modules',
      '.git',
      '.vscode',
      '.idea',
      'dist',
      'build',
      'out',
      'target',
      'bin',
      'obj',
      '.next',
      '.nuxt',
      'coverage',
      '__pycache__',
      '.pytest_cache',
      'vendor',
      'Pods',
    ]
    return skipDirs.includes(name) || name.startsWith('.')
  }

  /**
   * Get programming language from file extension
   * @param filename
   */
  private getLanguageFromExtension(filename: string): string | null {
    const ext = path.extname(filename).toLowerCase()
    const languageMap: Record<string, string> = {
      '.js': 'JavaScript',
      '.jsx': 'JavaScript',
      '.ts': 'TypeScript',
      '.tsx': 'TypeScript',
      '.py': 'Python',
      '.java': 'Java',
      '.c': 'C',
      '.cpp': 'C++',
      '.cc': 'C++',
      '.cxx': 'C++',
      '.cs': 'C#',
      '.php': 'PHP',
      '.rb': 'Ruby',
      '.go': 'Go',
      '.rs': 'Rust',
      '.swift': 'Swift',
      '.kt': 'Kotlin',
      '.scala': 'Scala',
      '.clj': 'Clojure',
      '.hs': 'Haskell',
      '.elm': 'Elm',
      '.dart': 'Dart',
      '.r': 'R',
      '.m': 'Objective-C',
      '.mm': 'Objective-C++',
      '.pl': 'Perl',
      '.lua': 'Lua',
      '.sh': 'Shell',
      '.bash': 'Shell',
      '.ps1': 'PowerShell',
      '.sql': 'SQL',
      '.html': 'HTML',
      '.css': 'CSS',
      '.scss': 'SCSS',
      '.less': 'Less',
      '.vue': 'Vue',
      '.svelte': 'Svelte',
    }

    return languageMap[ext] ?? null
  }

  /**
   * Count lines in a file
   * @param filePath
   */
  private async countLines(filePath: string): Promise<number> {
    try {
      const content = await fs.readFile(filePath, 'utf8')
      return content.split('\n').length
    } catch {
      return 0
    }
  }

  /**
   * Detect runtime environment
   * @param repositoryPath
   */
  private async detectRuntime(
    repositoryPath: string,
  ): Promise<string | undefined> {
    try {
      const files = await fs.readdir(repositoryPath)

      // Node.js
      if (files.includes('package.json')) return 'Node.js'

      // Python
      if (
        files.includes('requirements.txt') ||
        files.includes('setup.py') ||
        files.includes('pyproject.toml')
      )
        return 'Python'

      // Java
      if (files.includes('pom.xml') || files.includes('build.gradle'))
        return 'JVM'

      // .NET
      if (files.some((f) => f.endsWith('.csproj') || f.endsWith('.sln')))
        return '.NET'

      // PHP
      if (files.includes('composer.json')) return 'PHP'

      // Ruby
      if (files.includes('Gemfile')) return 'Ruby'

      // Go
      if (files.includes('go.mod')) return 'Go'

      // Rust
      if (files.includes('Cargo.toml')) return 'Rust'

      return undefined
    } catch {
      return undefined
    }
  }

  /**
   * Detect database technologies
   * @param repositoryPath
   */
  private async detectDatabases(repositoryPath: string): Promise<string[]> {
    const databases = new Set<string>()

    try {
      // Check different sources for database information
      await this.detectNodeJsDatabases(repositoryPath, databases)
      await this.detectPythonDatabases(repositoryPath, databases)
      await this.detectDockerDatabases(repositoryPath, databases)
    } catch {
      // Ignore errors
    }

    return Array.from(databases)
  }

  /**
   * Detect databases from Node.js dependencies
   * @param repositoryPath
   * @param databases
   */
  private async detectNodeJsDatabases(
    repositoryPath: string,
    databases: Set<string>,
  ): Promise<void> {
    const packageJsonPath = path.join(repositoryPath, 'package.json')

    if (await this.fileExists(packageJsonPath)) {
      const packageContent = await fs.readFile(packageJsonPath, 'utf8')
      const packageJson = JSON.parse(packageContent) as Record<string, unknown>
      const deps = {
        // eslint-disable-next-line dot-notation
        ...((packageJson['dependencies'] as
          | Record<string, unknown>
          | undefined) ?? {}),
        // eslint-disable-next-line dot-notation
        ...((packageJson['devDependencies'] as
          | Record<string, unknown>
          | undefined) ?? {}),
      }

      if (
        this.hasDependency(deps, 'mongoose') ||
        this.hasDependency(deps, 'mongodb')
      )
        databases.add('MongoDB')

      if (
        this.hasDependency(deps, 'mysql') ||
        this.hasDependency(deps, 'mysql2')
      )
        databases.add('MySQL')

      if (
        this.hasDependency(deps, 'pg') ||
        this.hasDependency(deps, 'postgresql')
      )
        databases.add('PostgreSQL')

      if (
        this.hasDependency(deps, 'sqlite3') ||
        this.hasDependency(deps, 'sqlite')
      )
        databases.add('SQLite')

      if (this.hasDependency(deps, 'redis')) databases.add('Redis')

      if (this.hasDependency(deps, 'elasticsearch'))
        databases.add('Elasticsearch')
    }
  }

  /**
   * Detect databases from Python dependencies
   * @param repositoryPath
   * @param databases
   */
  private async detectPythonDatabases(
    repositoryPath: string,
    databases: Set<string>,
  ): Promise<void> {
    const requirementsPath = path.join(repositoryPath, 'requirements.txt')

    if (await this.fileExists(requirementsPath)) {
      const content = await fs.readFile(requirementsPath, 'utf8')
      if (content.includes('pymongo')) databases.add('MongoDB')
      if (content.includes('mysql')) databases.add('MySQL')
      if (content.includes('psycopg2') || content.includes('postgresql'))
        databases.add('PostgreSQL')
      if (content.includes('sqlite')) databases.add('SQLite')
      if (content.includes('redis')) databases.add('Redis')
    }
  }

  /**
   * Detect databases from Docker configuration
   * @param repositoryPath
   * @param databases
   */
  private async detectDockerDatabases(
    repositoryPath: string,
    databases: Set<string>,
  ): Promise<void> {
    const dockerComposePath = path.join(repositoryPath, 'docker-compose.yml')

    if (await this.fileExists(dockerComposePath)) {
      const content = await fs.readFile(dockerComposePath, 'utf8')
      if (content.includes('mongo:') || content.includes('mongodb:'))
        databases.add('MongoDB')
      if (content.includes('mysql:')) databases.add('MySQL')
      if (content.includes('postgres:') || content.includes('postgresql:'))
        databases.add('PostgreSQL')
      if (content.includes('redis:')) databases.add('Redis')
      if (content.includes('elasticsearch:')) databases.add('Elasticsearch')
    }
  }

  /**
   * Check if dependency exists safely
   * @param deps
   * @param depName
   */
  private hasDependency(
    deps: Record<string, unknown>,
    depName: string,
  ): boolean {
    return Object.prototype.hasOwnProperty.call(deps, depName)
  }

  /**
   * Analyze project dependencies
   * @param repositoryPath
   */
  private async analyzeDependencies(
    repositoryPath: string,
  ): Promise<Dependency[]> {
    const dependencies: Dependency[] = []

    try {
      // Node.js
      const packageJsonPath = path.join(repositoryPath, 'package.json')
      if (await this.fileExists(packageJsonPath)) {
        const content = await fs.readFile(packageJsonPath, 'utf8')
        const packageJson = JSON.parse(content) as Record<string, unknown>

        // eslint-disable-next-line dot-notation
        if (packageJson['dependencies']) {
          for (const [name, version] of Object.entries(
            // eslint-disable-next-line dot-notation
            packageJson['dependencies'],
          )) {
            dependencies.push({
              name,
              version: version as string,
              type: 'runtime',
            })
          }
        }
      }
    } catch {
      // Ignore parsing errors
    }

    return dependencies
  }

  /**
   * Calculate project size metrics
   * @param repositoryPath
   */
  private async calculateProjectSize(
    repositoryPath: string,
  ): Promise<ProjectSize> {
    let totalFiles = 0
    let totalSize = 0
    let codeFiles = 0
    let codeSize = 0

    try {
      await this.calculateSizeRecursive(
        repositoryPath,
        (filePath, size) => {
          totalFiles++
          totalSize += size

          if (this.isCodeFile(filePath)) {
            codeFiles++
            codeSize += size
          }
        },
        0,
        RepositoryAnalyzer.MAX_SCAN_DEPTH,
      )
    } catch {
      // Use defaults on error
    }

    return {
      totalFiles,
      totalSize,
      codeFiles,
      codeSize,
    }
  }

  /**
   * Recursively calculate directory size
   * @param dirPath
   * @param _callback
   * @param currentDepth
   * @param maxDepth
   */
  private async calculateSizeRecursive(
    dirPath: string,

    _callback: (_filePath: string, _size: number) => void,
    currentDepth: number,
    maxDepth: number,
  ): Promise<void> {
    if (currentDepth > maxDepth) return

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })

      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry.name)

        if (entry.isDirectory()) {
          if (!this.shouldSkipDirectory(entry.name)) {
            await this.calculateSizeRecursive(
              entryPath,
              _callback,
              currentDepth + 1,
              maxDepth,
            )
          }
        } else if (entry.isFile()) {
          try {
            const stats = await fs.stat(entryPath)
            _callback(entryPath, stats.size)
          } catch {
            // Skip files that can't be read
          }
        }
      }
    } catch {
      // Skip directories that can't be read
    }
  }

  /**
   * Check if file is a code file
   * @param filePath
   */
  private isCodeFile(filePath: string): boolean {
    const codeExtensions = [
      '.js',
      '.jsx',
      '.ts',
      '.tsx',
      '.py',
      '.java',
      '.c',
      '.cpp',
      '.cs',
      '.php',
      '.rb',
      '.go',
      '.rs',
      '.swift',
      '.kt',
      '.scala',
      '.hs',
      '.dart',
      '.vue',
      '.svelte',
      '.html',
      '.css',
      '.scss',
      '.less',
    ]

    const ext = path.extname(filePath).toLowerCase()
    return codeExtensions.includes(ext)
  }

  /**
   * Analyze README quality
   * @param repositoryPath
   */
  private async analyzeReadmeQuality(
    repositoryPath: string,
  ): Promise<ReadmeQuality> {
    try {
      const readmeFiles = ['README.md', 'README.txt', 'README.rst', 'README']
      let readmeContent = ''
      let exists = false

      for (const filename of readmeFiles) {
        const filePath = path.join(repositoryPath, filename)
        if (await this.fileExists(filePath)) {
          readmeContent = await fs.readFile(filePath, 'utf8')
          exists = true
          break
        }
      }

      if (!exists) {
        return {
          exists: false,
          hasDescription: false,
          hasInstallation: false,
          hasUsage: false,
          score: 0,
        }
      }

      const contentLower = readmeContent.toLowerCase()
      const hasDescription =
        readmeContent.length > RepositoryAnalyzer.MIN_README_LENGTH
      const hasInstallation =
        contentLower.includes('install') || contentLower.includes('setup')
      const hasUsage =
        contentLower.includes('usage') || contentLower.includes('example')

      let score = 1 // Base score for existence
      if (hasDescription) score += 2
      if (hasInstallation) score += 2
      if (hasUsage) score += 2

      // Bonus for sections, badges, etc.
      if (contentLower.includes('##') || contentLower.includes('#')) score += 1
      if (contentLower.includes('badge') || contentLower.includes('[!['))
        score += 1

      return {
        exists,
        hasDescription,
        hasInstallation,
        hasUsage,
        score: Math.min(score, RepositoryAnalyzer.MAX_README_SCORE),
      }
    } catch {
      return {
        exists: false,
        hasDescription: false,
        hasInstallation: false,
        hasUsage: false,
        score: 0,
      }
    }
  }

  /**
   * Check if project has tests
   * @param repositoryPath
   */
  private async hasTests(repositoryPath: string): Promise<boolean> {
    try {
      const entries = await fs.readdir(repositoryPath, { withFileTypes: true })

      // Check for test directories
      const testDirs = ['test', 'tests', '__tests__', 'spec', 'specs']
      for (const entry of entries) {
        if (entry.isDirectory() && testDirs.includes(entry.name.toLowerCase()))
          return true
      }

      // Check for test files in root
      for (const entry of entries) {
        if (entry.isFile()) {
          const name = entry.name.toLowerCase()
          if (name.includes('test') || name.includes('spec')) return true
        }
      }

      return false
    } catch {
      return false
    }
  }

  /**
   * Check if project has CI/CD configuration
   * @param repositoryPath
   */
  private async hasCiCd(repositoryPath: string): Promise<boolean> {
    try {
      const ciFiles = [
        '.github/workflows',
        '.gitlab-ci.yml',
        '.travis.yml',
        'circle.yml',
        '.circleci/config.yml',
        'azure-pipelines.yml',
        'Jenkinsfile',
        '.drone.yml',
      ]

      for (const file of ciFiles) {
        const filePath = path.join(repositoryPath, file)
        if (await this.fileExists(filePath)) return true
      }

      return false
    } catch {
      return false
    }
  }

  /**
   * Detect project license
   * @param repositoryPath
   */
  private async detectLicense(
    repositoryPath: string,
  ): Promise<string | undefined> {
    try {
      const licenseFiles = [
        'LICENSE',
        'LICENSE.txt',
        'LICENSE.md',
        'LICENCE',
        'COPYING',
      ]

      for (const filename of licenseFiles) {
        const filePath = path.join(repositoryPath, filename)
        if (await this.fileExists(filePath)) {
          const content = await fs.readFile(filePath, 'utf8')
          return this.identifyLicense(content)
        }
      }

      // Check package.json
      const packageJsonPath = path.join(repositoryPath, 'package.json')
      if (await this.fileExists(packageJsonPath)) {
        const content = await fs.readFile(packageJsonPath, 'utf8')
        const packageJson = JSON.parse(content) as Record<string, unknown>
        // eslint-disable-next-line dot-notation
        if (packageJson['license']) return packageJson['license'] as string
      }

      return undefined
    } catch {
      return undefined
    }
  }

  /**
   * Identify license from content
   * @param content
   */
  private identifyLicense(content: string): string {
    const contentLower = content.toLowerCase()

    if (contentLower.includes('mit license')) return 'MIT'
    if (contentLower.includes('apache license')) return 'Apache-2.0'
    if (contentLower.includes('gnu general public license')) return 'GPL-3.0'
    if (contentLower.includes('bsd license')) return 'BSD'
    if (contentLower.includes('mozilla public license')) return 'MPL-2.0'
    if (contentLower.includes('unlicense')) return 'Unlicense'

    return 'Unknown'
  }

  /**
   * Check if file exists
   * @param filePath
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  }
}
