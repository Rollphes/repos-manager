import { RepositoryManager } from '@core/RepositoryManager'
import { ExtensionManager } from '@extension/ExtensionManager'
import { ProgressManager } from '@extension/ProgressManager'
import { Repository } from '@types'
import { ReposManagerProvider } from '@ui/ReposManagerProvider'
import * as vscode from 'vscode'

interface ExtendedTreeItem extends vscode.TreeItem {
  repository?: Repository
}

/**
 * Command Registry - Manages all extension commands
 * Responsible for registering and handling VS Code commands
 */
export class CommandRegistry {
  private readonly disposables: vscode.Disposable[] = []

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly repositoryManager: RepositoryManager,
    private readonly treeDataProvider: ReposManagerProvider,
    private readonly progressManager: ProgressManager,
    private readonly extensionManager: ExtensionManager,
  ) {}

  /**
   * Register all extension commands
   */
  public registerAllCommands(): void {
    this.registerMainCommands()
    this.registerRepositoryCommands()
  }

  /**
   * Dispose all registered commands
   */
  public dispose(): void {
    this.disposables.forEach((disposable) => {
      disposable.dispose()
    })
    this.disposables.length = 0
  }

  /**
   * Register main commands
   */
  private registerMainCommands(): void {
    // Refresh command
    const refreshCommand = vscode.commands.registerCommand(
      'reposManager.refresh',
      async () => {
        try {
          this.treeDataProvider.setLoading(true)
          await this.progressManager.withProgress(
            {
              title: '🔄 Refreshing repositories...',
              cancellable: true,
            },
            async (progress, token) => {
              await this.repositoryManager.scanRepositories(
                token,
                (message, increment) => {
                  if (increment !== undefined)
                    progress.report({ increment, message: `🔄 ${message}` })
                  else progress.report({ message: `🔄 ${message}` })
                },
              )
              this.treeDataProvider.refresh()
            },
          )
          vscode.window.showInformationMessage(
            '✅ Repository refresh completed successfully',
          )
        } catch (error) {
          console.error('Refresh command failed:', error)
          vscode.window.showErrorMessage('Failed to refresh repositories')
        } finally {
          this.treeDataProvider.setLoading(false)
        }
      },
    )

    // Open settings command
    const openSettingsCommand = vscode.commands.registerCommand(
      'reposManager.openSettings',
      () => {
        vscode.commands.executeCommand(
          'workbench.action.openSettings',
          'reposManager',
        )
      },
    )

    // Scan repositories command
    const scanCommand = vscode.commands.registerCommand(
      'reposManager.scanRepositories',
      async () => {
        try {
          this.treeDataProvider.setLoading(true)
          await this.progressManager.withProgress(
            {
              title: '🔍 Scanning repositories...',
              cancellable: true,
            },
            async (progress, token) => {
              await this.repositoryManager.scanRepositories(
                token,
                (message, increment) => {
                  if (increment !== undefined)
                    progress.report({ increment, message: `🔍 ${message}` })
                  else progress.report({ message: `🔍 ${message}` })
                },
              )
              this.treeDataProvider.refresh()
            },
          )
          vscode.window.showInformationMessage(
            '✅ Repository scan completed successfully',
          )
        } catch (error) {
          console.error('Scan command failed:', error)
          vscode.window.showErrorMessage('Failed to scan repositories')
        } finally {
          this.treeDataProvider.setLoading(false)
        }
      },
    )

    // Search repositories command
    const searchCommand = vscode.commands.registerCommand(
      'reposManager.search',
      async () => {
        await this.treeDataProvider.showSearchDialog()
      },
    )

    // Filter repositories command
    const filterCommand = vscode.commands.registerCommand(
      'reposManager.filter',
      async () => {
        await this.treeDataProvider.showFilterDialog()
      },
    )

    // Clear filters command
    const clearFiltersCommand = vscode.commands.registerCommand(
      'reposManager.clearFilters',
      () => {
        this.treeDataProvider.clearFilters()
      },
    )

    this.disposables.push(
      refreshCommand,
      openSettingsCommand,
      scanCommand,
      searchCommand,
      filterCommand,
      clearFiltersCommand,
    )
  }

  /**
   * Register repository-related commands
   */
  private registerRepositoryCommands(): void {
    // Open repository command
    const openRepoCommand = vscode.commands.registerCommand(
      'reposManager.openRepository',
      async (repository?: Repository) => {
        if (!repository) {
          vscode.window.showWarningMessage('No repository selected')
          return
        }

        try {
          await vscode.commands.executeCommand(
            'vscode.openFolder',
            vscode.Uri.file(repository.path),
          )
        } catch (error) {
          console.error('Failed to open repository:', error)
          vscode.window.showErrorMessage(
            `Failed to open repository: ${repository.name}`,
          )
        }
      },
    )

    // Open repository in new window command
    const openRepoNewWindowCommand = vscode.commands.registerCommand(
      'reposManager.openRepositoryInNewWindow',
      async (repository?: Repository) => {
        if (!repository) {
          vscode.window.showWarningMessage('No repository selected')
          return
        }

        try {
          await vscode.commands.executeCommand(
            'vscode.openFolder',
            vscode.Uri.file(repository.path),
            true,
          )
        } catch (error) {
          console.error('Failed to open repository in new window:', error)
          vscode.window.showErrorMessage(
            `Failed to open repository in new window: ${repository.name}`,
          )
        }
      },
    )

    // Open in terminal command
    const openInTerminalCommand = vscode.commands.registerCommand(
      'reposManager.openInTerminal',
      (repository?: Repository) => {
        if (!repository) {
          vscode.window.showWarningMessage('No repository selected')
          return
        }

        try {
          const terminal = vscode.window.createTerminal({
            name: `Terminal - ${repository.name}`,
            cwd: repository.path,
          })
          terminal.show()
        } catch (error) {
          console.error('Failed to open terminal:', error)
          vscode.window.showErrorMessage(
            `Failed to open terminal for repository: ${repository.name}`,
          )
        }
      },
    )

    // Copy path command
    const copyPathCommand = vscode.commands.registerCommand(
      'reposManager.copyPath',
      async (repository?: Repository) => {
        if (!repository) {
          vscode.window.showWarningMessage('No repository selected')
          return
        }

        try {
          await vscode.env.clipboard.writeText(repository.path)
          vscode.window.showInformationMessage(
            `Path copied: ${repository.path}`,
          )
        } catch (error) {
          console.error('Failed to copy path:', error)
          vscode.window.showErrorMessage('Failed to copy repository path')
        }
      },
    )

    // Toggle favorite command
    const toggleFavoriteCommand = vscode.commands.registerCommand(
      'reposManager.toggleFavorite',
      async (repository?: Repository) => {
        if (!repository) {
          vscode.window.showWarningMessage('No repository selected')
          return
        }

        try {
          const favoriteService = this.repositoryManager.getFavoriteService()
          const isFavorite = favoriteService.isFavorite(repository.id)

          if (isFavorite) {
            await favoriteService.removeFavorite(repository.id)
            vscode.window.showInformationMessage(
              `✅ Removed ${repository.name} from favorites`,
            )
          } else {
            await favoriteService.addFavorite(repository.id)
            vscode.window.showInformationMessage(
              `⭐ Added ${repository.name} to favorites`,
            )
          }

          this.treeDataProvider.refresh()
        } catch (error) {
          console.error('Failed to toggle favorite:', error)
          vscode.window.showErrorMessage('Failed to toggle favorite status')
        }
      },
    )

    // Add to favorites command
    const addToFavoritesCommand = vscode.commands.registerCommand(
      'reposManager.addToFavorites',
      async (treeItem?: vscode.TreeItem) => {
        if (!treeItem || !(treeItem as ExtendedTreeItem).repository) {
          vscode.window.showWarningMessage('No repository selected')
          return
        }

        const repository = (treeItem as ExtendedTreeItem).repository

        if (!repository) {
          vscode.window.showWarningMessage('No repository selected')
          return
        }

        try {
          const favoriteService = this.extensionManager.getFavoriteService()
          await favoriteService.addFavorite(repository.path)
          vscode.window.showInformationMessage(
            `⭐ Added ${repository.name} to favorites`,
          )
          this.treeDataProvider.refresh()
        } catch (error) {
          console.error('Failed to add to favorites:', error)
          vscode.window.showErrorMessage('Failed to add to favorites')
        }
      },
    )

    // Remove from favorites command
    const removeFromFavoritesCommand = vscode.commands.registerCommand(
      'reposManager.removeFromFavorites',
      async (treeItem?: vscode.TreeItem) => {
        if (!treeItem || !(treeItem as ExtendedTreeItem).repository) {
          vscode.window.showWarningMessage('No repository selected')
          return
        }

        const repository = (treeItem as ExtendedTreeItem).repository

        if (!repository) {
          vscode.window.showWarningMessage('No repository selected')
          return
        }

        try {
          const favoriteService = this.extensionManager.getFavoriteService()
          await favoriteService.removeFavorite(repository.path)
          vscode.window.showInformationMessage(
            `✅ Removed ${repository.name} from favorites`,
          )
          this.treeDataProvider.refresh()
        } catch (error) {
          console.error('Failed to remove from favorites:', error)
          vscode.window.showErrorMessage('Failed to remove from favorites')
        }
      },
    )

    this.disposables.push(
      openRepoCommand,
      openRepoNewWindowCommand,
      openInTerminalCommand,
      copyPathCommand,
      toggleFavoriteCommand,
      addToFavoritesCommand,
      removeFromFavoritesCommand,
    )
  }
}
