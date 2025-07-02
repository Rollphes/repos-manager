import { FilterProfileManager } from '@core/FilterProfileManager'
import { RepositoryManager } from '@core/RepositoryManager'
import { CommandRegistry } from '@extension/CommandRegistry'
import { DialogProvider } from '@extension/DialogProvider'
import { ProgressManager } from '@extension/ProgressManager'
import { ConfigurationService } from '@services/ConfigurationService'
import { ReposManagerProvider } from '@ui/ReposManagerProvider'
import * as vscode from 'vscode'

/**
 * Extension Manager - Manages the entire extension lifecycle
 * Responsible for initialization, service management, and cleanup
 */
export class ExtensionManager {
  private repositoryManager?: RepositoryManager
  private filterProfileManager?: FilterProfileManager
  private treeDataProvider?: ReposManagerProvider
  private commandRegistry?: CommandRegistry
  private readonly configService: ConfigurationService
  private readonly progressManager: ProgressManager
  private readonly dialogProvider: DialogProvider

  constructor(private readonly context: vscode.ExtensionContext) {
    this.configService = new ConfigurationService()
    this.progressManager = new ProgressManager()
    this.dialogProvider = new DialogProvider()
  }

  /**
   * Activate the extension
   */
  public async activate(): Promise<void> {
    console.warn('🚀 [Repos Manager] Extension is being activated')

    try {
      this.initializeServices()
      this.registerTreeView()
      this.setContext()
      this.registerCommands()
      await this.performInitialScan()

      console.warn('🚀 [Repos Manager] Extension activated successfully')
    } catch (error) {
      console.error('Failed to activate extension:', error)
      vscode.window.showErrorMessage(
        '❌ Failed to activate Repos Manager extension',
      )
      throw error
    }
  }

  /**
   * Deactivate the extension
   */
  public deactivate(): void {
    console.warn('🛑 [Repos Manager] Extension is being deactivated')

    if (this.filterProfileManager) this.filterProfileManager.dispose()

    if (this.treeDataProvider) this.treeDataProvider.dispose()
  }

  /**
   * Get repository manager instance
   */
  public getRepositoryManager(): RepositoryManager {
    if (!this.repositoryManager)
      throw new Error('Repository manager not initialized')

    return this.repositoryManager
  }

  /**
   * Get filter profile manager instance
   */
  public getFilterProfileManager(): FilterProfileManager {
    if (!this.filterProfileManager)
      throw new Error('Filter profile manager not initialized')

    return this.filterProfileManager
  }

  /**
   * Get tree data provider instance
   */
  public getTreeDataProvider(): ReposManagerProvider {
    if (!this.treeDataProvider)
      throw new Error('Tree data provider not initialized')

    return this.treeDataProvider
  }

  /**
   * Initialize all services
   */
  private initializeServices(): void {
    console.warn('⚙️ [Repos Manager] Initializing services...')

    this.repositoryManager = new RepositoryManager(
      this.configService,
      this.context,
    )
    this.filterProfileManager = new FilterProfileManager(this.context)
    this.treeDataProvider = new ReposManagerProvider(
      this.repositoryManager,
      this.filterProfileManager,
    )

    console.warn('✅ [Repos Manager] Services initialized')
  }

  /**
   * Register tree view
   */
  private registerTreeView(): void {
    if (!this.treeDataProvider)
      throw new Error('Tree data provider not initialized')

    vscode.window.createTreeView('reposManager', {
      treeDataProvider: this.treeDataProvider,
      showCollapseAll: true,
      canSelectMany: false,
    })
  }

  /**
   * Set extension context
   */
  private setContext(): void {
    vscode.commands.executeCommand('setContext', 'reposManager.enabled', true)
  }

  /**
   * Register all commands
   */
  private registerCommands(): void {
    if (
      !this.repositoryManager ||
      !this.filterProfileManager ||
      !this.treeDataProvider
    )
      throw new Error('Services not initialized')

    this.commandRegistry = new CommandRegistry(
      this.context,
      this.repositoryManager,
      this.filterProfileManager,
      this.treeDataProvider,
      this.progressManager,
    )

    this.commandRegistry.registerAllCommands()
  }

  /**
   * Perform initial repository scan
   */
  private async performInitialScan(): Promise<void> {
    if (!this.repositoryManager || !this.treeDataProvider)
      throw new Error('Services not initialized')

    const config = this.configService.getConfiguration()
    console.warn('📋 [CONFIG] Configuration loaded:', {
      rootPaths: config.scanning.rootPaths,
      scanDepth: config.scanning.scanDepth,
    })

    if (config.scanning.rootPaths.length > 0) {
      console.warn('🔍 [SCAN] Starting initial repository scan...')

      await this.progressManager.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: '🔍 Initializing Repos Manager...',
          cancellable: false,
        },
        async (progress) => {
          try {
            if (this.repositoryManager && this.treeDataProvider) {
              await this.repositoryManager.scanRepositories(
                undefined,
                (message, increment) => {
                  if (increment !== undefined)
                    progress.report({ increment, message: `🔍 ${message}` })
                  else progress.report({ message: `🔍 ${message}` })
                },
              )
              this.treeDataProvider.refresh()
              vscode.window.showInformationMessage(
                '✅ Repos Manager initialized successfully',
              )
            }
          } catch (error) {
            console.error('Initial repository scan failed:', error)
            vscode.window.showErrorMessage(
              '❌ Failed to initialize Repos Manager. Check the output panel for details.',
            )
          }
        },
      )
    } else {
      console.warn('⚠️ [SCAN] No root paths configured - skipping initial scan')
      vscode.window.showWarningMessage(
        '⚙️ No scan paths configured. Please configure scan paths in settings.',
      )
    }
  }
}
