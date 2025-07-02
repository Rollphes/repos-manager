import { ReposManagerConfig } from '@types'
import * as vscode from 'vscode'

/**
 * Configuration service for managing extension settings
 */
export class ConfigurationService {
  // Default configuration constants
  private static readonly DEFAULT_SCAN_DEPTH = 3 // Maximum directory depth for scanning
  private static readonly DEFAULT_MAX_CONCURRENT_SCANS = 5 // Maximum concurrent scan operations
  private static readonly DEFAULT_SCAN_TIMEOUT = 30000 // Timeout for scanning operations (30 seconds)
  private static readonly DEFAULT_CACHE_TTL = 300000 // Cache time-to-live (5 minutes)
  private static readonly DEFAULT_CACHE_CHECK_INTERVAL = 1000 // Cache check interval (1 second)
  private static readonly DEFAULT_DEBOUNCE_DELAY = 1000 // Debounce delay for events (1 second)
  private static readonly DEFAULT_AUTO_REFRESH_INTERVAL = 5000 // Auto refresh interval (5 seconds)

  private readonly configSection = 'reposManager'
  private readonly onDidChangeConfiguration =
    new vscode.EventEmitter<ReposManagerConfig>()

  // eslint-disable-next-line @typescript-eslint/member-ordering
  public readonly onDidChangeConfigurationEvent =
    this.onDidChangeConfiguration.event

  constructor() {
    // Listen for configuration changes
    vscode.workspace.onDidChangeConfiguration(
      this.handleConfigurationChange.bind(this),
    )
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    this.onDidChangeConfiguration.dispose()
  }

  /**
   * Get the current configuration
   */
  public getConfiguration(): ReposManagerConfig {
    const config = vscode.workspace.getConfiguration(this.configSection)

    console.warn('=== CONFIGURATION SERVICE DEBUG ===')
    console.warn('Available config keys:', Object.keys(config))

    // Get values with logging
    const scanPaths = config.get<string[]>('scanPaths', [])
    const excludePatterns = config.get<string[]>('excludePatterns', [
      'node_modules',
      '.git',
      '.vscode',
    ])
    const maxDepth = config.get<number>(
      'maxDepth',
      ConfigurationService.DEFAULT_SCAN_DEPTH,
    )

    console.warn('scanPaths:', scanPaths)
    console.warn('excludePatterns:', excludePatterns)
    console.warn('maxDepth:', maxDepth)

    return {
      scanning: {
        rootPaths: scanPaths,
        excludePaths: excludePatterns,
        scanDepth: maxDepth,
        includeHidden: config.get<boolean>('includeHidden', false),
        autoScanOnConfigChange: config.get<boolean>(
          'autoScanOnConfigChange',
          true,
        ),
        maxConcurrentScans: config.get<number>(
          'maxConcurrentScans',
          ConfigurationService.DEFAULT_MAX_CONCURRENT_SCANS,
        ),
      },
      display: {
        viewMode: config.get('viewMode', 'compact') as
          | 'compact'
          | 'standard'
          | 'detailed',
        groupBy: config.get('groupBy', 'none') as
          | 'none'
          | 'language'
          | 'owner'
          | 'favorite',
        sortBy: config.get<string>('sortBy', 'name'),
        sortOrder: config.get('sortOrder', 'asc') as 'asc' | 'desc',
        showIcons: config.get<boolean>('showIcons', true),
        showGitStatus: config.get<boolean>('showGitStatus', true),
        compactMode: config.get<boolean>('compactMode', true),
      },
      ui: {
        enableKeyboardShortcuts: config.get<boolean>(
          'enableKeyboardShortcuts',
          true,
        ),
        enableContextMenu: config.get<boolean>('enableContextMenu', true),
        enableDragDrop: config.get<boolean>('enableDragDrop', false),
        autoRefresh: config.get<boolean>('autoRefresh', false),
        refreshInterval: config.get<number>(
          'refreshInterval',
          ConfigurationService.DEFAULT_SCAN_TIMEOUT,
        ),
      },
      performance: {
        enableCaching: config.get<boolean>('enableCaching', true),
        cacheTimeout: config.get<number>(
          'cacheTimeout',
          ConfigurationService.DEFAULT_CACHE_TTL,
        ),
        enableLazyLoading: config.get<boolean>('enableLazyLoading', true),
        maxRepositories: config.get<number>(
          'maxRepositories',
          ConfigurationService.DEFAULT_CACHE_CHECK_INTERVAL,
        ),
      },
      integrations: {
        github: {
          enabled: config.get<boolean>('github.enabled', false),
          token: config.get<string>('github.token'),
        },
        gitlab: {
          enabled: config.get<boolean>('gitlab.enabled', false),
          token: config.get<string>('gitlab.token'),
          url: config.get<string>('gitlab.url'),
        },
      },
    }
  }

  /**
   * Update a configuration value
   * @param key
   * @param value
   * @param target
   */
  public async updateConfiguration(
    key: string,
    value: unknown,
    target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global,
  ): Promise<void> {
    const config = vscode.workspace.getConfiguration(this.configSection)
    await config.update(key, value, target)
  }

  /**
   * Get a specific configuration value
   * @param key
   * @param defaultValue
   */
  public getConfigurationValue<T>(key: string, defaultValue: T): T {
    const config = vscode.workspace.getConfiguration(this.configSection)
    return config.get<T>(key, defaultValue)
  }

  /**
   * Reset configuration to defaults
   */
  public async resetConfiguration(): Promise<void> {
    const config = vscode.workspace.getConfiguration(this.configSection)
    const keys = Object.keys(config)

    for (const key of keys)
      await config.update(key, undefined, vscode.ConfigurationTarget.Global)
  }

  /**
   * Validate configuration
   */
  public validateConfiguration(): ValidationResult {
    const config = this.getConfiguration()
    const errors: string[] = []
    const warnings: string[] = []

    // Validate scanning configuration
    if (config.scanning.rootPaths.length === 0)
      warnings.push('No root paths configured for scanning')

    if (config.scanning.scanDepth < 1)
      errors.push('Scan depth must be at least 1')

    if (config.scanning.maxConcurrentScans < 1)
      errors.push('Max concurrent scans must be at least 1')

    // Validate performance configuration
    if (config.performance.maxRepositories < 1)
      errors.push('Max repositories must be at least 1')

    if (
      config.performance.cacheTimeout <
      ConfigurationService.DEFAULT_CACHE_CHECK_INTERVAL
    )
      warnings.push('Cache timeout is very low, may impact performance')

    // Validate UI configuration
    if (
      config.ui.refreshInterval <
      ConfigurationService.DEFAULT_AUTO_REFRESH_INTERVAL
    )
      warnings.push('Refresh interval is very low, may impact performance')

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Handle configuration changes
   * @param event
   */
  private handleConfigurationChange(
    event: vscode.ConfigurationChangeEvent,
  ): void {
    if (event.affectsConfiguration(this.configSection)) {
      const newConfig = this.getConfiguration()
      this.onDidChangeConfiguration.fire(newConfig)
    }
  }
}

/**
 * Configuration validation result
 */
export interface ValidationResult {
  readonly isValid: boolean
  readonly errors: readonly string[]
  readonly warnings: readonly string[]
}

// Configuration service implementation ends here
