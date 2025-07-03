import { RepositoryManager } from '@core/RepositoryManager'
import { ExtensionManager } from '@extension/ExtensionManager'
import { ProgressManager } from '@extension/ProgressManager'
import type { PathDetectionResult, Repository } from '@types'
import { ReposManagerProvider } from '@ui/ReposManagerProvider'
import * as vscode from 'vscode'

interface ExtendedTreeItem extends vscode.TreeItem {
  repository?: Repository
}

export class CommandRegistry {
  private readonly disposables: vscode.Disposable[] = []

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly repositoryManager: RepositoryManager,
    private readonly treeDataProvider: ReposManagerProvider,
    private readonly progressManager: ProgressManager,
    private readonly extensionManager: ExtensionManager,
  ) {}

  public registerAllCommands(): void {
    this.registerMainCommands()
    this.registerRepositoryCommands()
  }

  public dispose(): void {
    this.disposables.forEach((disposable) => {
      disposable.dispose()
    })
    this.disposables.length = 0
  }

  private registerMainCommands(): void {
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

    const openSettingsCommand = vscode.commands.registerCommand(
      'reposManager.openSettings',
      () => {
        vscode.commands.executeCommand(
          'workbench.action.openSettings',
          'reposManager',
        )
      },
    )

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

    const clearFiltersCommand = vscode.commands.registerCommand(
      'reposManager.clearFilters',
      () => {
        this.treeDataProvider.clearFilters()
      },
    )

    const autoDetectPathsCommand = vscode.commands.registerCommand(
      'reposManager.autoDetectPaths',
      async () => {
        await this.executeAutoDetectPaths()
      },
    )

    const addFolderCommand = vscode.commands.registerCommand(
      'reposManager.addFolder',
      async () => {
        await this.executeAddFolder()
      },
    )

    const openExtensionSettingsCommand = vscode.commands.registerCommand(
      'reposManager.openExtensionSettings',
      async () => {
        await this.executeOpenSettings()
      },
    )

    // New UI commands based on design specifications
    const toggleGroupViewCommand = vscode.commands.registerCommand(
      'reposManager.toggleGroupView',
      () => {
        this.executeToggleGroupView()
      },
    )

    const toggleSortCommand = vscode.commands.registerCommand(
      'reposManager.toggleSort',
      () => {
        this.executeToggleSort()
      },
    )

    const openHomepageCommand = vscode.commands.registerCommand(
      'reposManager.openHomepage',
      async (item: ExtendedTreeItem) => {
        await this.executeOpenHomepage(item)
      },
    )

    const openInFileExplorerCommand = vscode.commands.registerCommand(
      'reposManager.openInFileExplorer',
      async (item: ExtendedTreeItem) => {
        await this.executeOpenInFileExplorer(item)
      },
    )

    this.disposables.push(
      refreshCommand,
      openSettingsCommand,
      scanCommand,
      searchCommand,
      filterCommand,
      clearFiltersCommand,
      autoDetectPathsCommand,
      addFolderCommand,
      openExtensionSettingsCommand,
      toggleGroupViewCommand,
      toggleSortCommand,
      openHomepageCommand,
      openInFileExplorerCommand,
    )
  }

  private registerRepositoryCommands(): void {
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

  private async executeAutoDetectPaths(): Promise<void> {
    try {
      const pathDetectionService =
        this.extensionManager.getPathDetectionService()
      const detectedPaths =
        (await pathDetectionService.detectCommonPaths()) as PathDetectionResult[]

      if (detectedPaths.length === 0) {
        vscode.window.showInformationMessage(
          'No common repository paths found.',
        )
        return
      }

      interface QuickPickItemWithResult extends vscode.QuickPickItem {
        readonly label: string
        readonly description: string
        readonly detail: string
        readonly picked: boolean
        readonly result: PathDetectionResult
      }

      const quickPickItems: QuickPickItemWithResult[] = detectedPaths.map(
        (result: PathDetectionResult): QuickPickItemWithResult => ({
          label: result.path,
          description: `${String(result.repositoryCount)} repos, ${String(result.folderCount)} folders`,
          detail: result.hasRepositories
            ? '✓ Contains repositories'
            : '○ Empty directory',
          picked: result.hasRepositories,
          result,
        }),
      )

      const selectedItems = await vscode.window.showQuickPick(quickPickItems, {
        canPickMany: true,
        title: 'Select paths to add to scan targets',
        placeHolder: 'Choose directories to scan for repositories',
      })

      if (selectedItems && selectedItems.length > 0) {
        const selectedPaths = selectedItems.map((item) => item.label)

        const config = vscode.workspace.getConfiguration('reposManager')
        const currentPaths = config.get<string[]>('scanPaths', [])
        const uniquePaths = [...new Set([...currentPaths, ...selectedPaths])]
        await config.update(
          'scanPaths',
          uniquePaths,
          vscode.ConfigurationTarget.Global,
        )

        this.treeDataProvider.setLoading(true)
        await this.repositoryManager.scanRepositories()
        this.treeDataProvider.refresh()

        vscode.window.showInformationMessage(
          `Added ${String(selectedPaths.length)} path(s) to scan targets.`,
        )
      }
    } catch (error) {
      console.error('Auto-detect paths failed:', error)
      vscode.window.showErrorMessage('Failed to auto-detect paths')
    } finally {
      this.treeDataProvider.setLoading(false)
    }
  }

  private async executeAddFolder(): Promise<void> {
    try {
      const selectedFolders = await vscode.window.showOpenDialog({
        canSelectFolders: true,
        canSelectMany: true,
        title: 'Select folders to scan for repositories',
      })

      if (selectedFolders && selectedFolders.length > 0) {
        const folderPaths = selectedFolders.map((uri) => uri.fsPath)

        const config = vscode.workspace.getConfiguration('reposManager')
        const currentPaths = config.get<string[]>('scanPaths', [])
        const uniquePaths = [...new Set([...currentPaths, ...folderPaths])]
        await config.update(
          'scanPaths',
          uniquePaths,
          vscode.ConfigurationTarget.Global,
        )

        this.treeDataProvider.setLoading(true)
        await this.repositoryManager.scanRepositories()
        this.treeDataProvider.refresh()

        vscode.window.showInformationMessage(
          `Added ${String(folderPaths.length)} folder(s) to scan targets.`,
        )
      }
    } catch (error) {
      console.error('Add folder failed:', error)
      vscode.window.showErrorMessage('Failed to add folder')
    } finally {
      this.treeDataProvider.setLoading(false)
    }
  }

  private async executeOpenSettings(): Promise<void> {
    try {
      await vscode.commands.executeCommand(
        'workbench.action.openSettings',
        'reposManager',
      )
    } catch (error) {
      console.error('Open settings failed:', error)
      vscode.window.showErrorMessage('Failed to open settings')
    }
  }

  private executeToggleGroupView(): void {
    try {
      // Toggle between flat, language-based, and technology-based grouping
      this.treeDataProvider.toggleGroupView()
      vscode.window.showInformationMessage(
        `Group view: ${this.treeDataProvider.getGroupViewMode()}`,
      )
    } catch (error) {
      console.error('Toggle group view failed:', error)
      vscode.window.showErrorMessage('Failed to toggle group view')
    }
  }

  private executeToggleSort(): void {
    try {
      // Cycle through different sort orders
      this.treeDataProvider.toggleSort()
      vscode.window.showInformationMessage(
        `Sort order: ${this.treeDataProvider.getSortMode()}`,
      )
    } catch (error) {
      console.error('Toggle sort failed:', error)
      vscode.window.showErrorMessage('Failed to change sort order')
    }
  }

  private async executeOpenHomepage(item: ExtendedTreeItem): Promise<void> {
    try {
      if (!item.repository) {
        vscode.window.showWarningMessage('No repository selected')
        return
      }

      const repository = item.repository
      if (!repository.gitInfo.remoteUrl) {
        vscode.window.showWarningMessage(
          'No remote URL found for this repository',
        )
        return
      }

      // Convert Git URL to web URL
      const webUrl = this.convertGitUrlToWebUrl(repository.gitInfo.remoteUrl)
      if (webUrl) {
        await vscode.env.openExternal(vscode.Uri.parse(webUrl))
      } else {
        vscode.window.showWarningMessage(
          'Could not determine repository homepage',
        )
      }
    } catch (error) {
      console.error('Open homepage failed:', error)
      vscode.window.showErrorMessage('Failed to open repository homepage')
    }
  }

  private async executeOpenInFileExplorer(
    item: ExtendedTreeItem,
  ): Promise<void> {
    try {
      if (!item.repository) {
        vscode.window.showWarningMessage('No repository selected')
        return
      }

      const uri = vscode.Uri.file(item.repository.path)
      await vscode.commands.executeCommand('revealFileInOS', uri)
    } catch (error) {
      console.error('Open in file explorer failed:', error)
      vscode.window.showErrorMessage('Failed to open in file explorer')
    }
  }

  private convertGitUrlToWebUrl(gitUrl: string): string | null {
    try {
      // Handle GitHub URLs
      if (gitUrl.includes('github.com')) {
        return gitUrl
          .replace(/^git@github\.com:/, 'https://github.com/')
          .replace(/\.git$/, '')
      }

      // Handle GitLab URLs
      if (gitUrl.includes('gitlab.com')) {
        return gitUrl
          .replace(/^git@gitlab\.com:/, 'https://gitlab.com/')
          .replace(/\.git$/, '')
      }

      // Handle Bitbucket URLs
      if (gitUrl.includes('bitbucket.org')) {
        return gitUrl
          .replace(/^git@bitbucket\.org:/, 'https://bitbucket.org/')
          .replace(/\.git$/, '')
      }

      // Handle HTTPS URLs
      if (gitUrl.startsWith('https://')) return gitUrl.replace(/\.git$/, '')

      return null
    } catch (error) {
      console.error('Error converting Git URL to web URL:', error)
      return null
    }
  }
}
