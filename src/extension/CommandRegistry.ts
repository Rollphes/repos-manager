import { FilterProfileManager } from '@core/FilterProfileManager'
import { RepositoryManager } from '@core/RepositoryManager'
import { ProgressManager } from '@extension/ProgressManager'
import { FilterProfile, Repository } from '@types'
import { ReposManagerProvider } from '@ui/ReposManagerProvider'
import * as vscode from 'vscode'

/**
 * Command Registry - Manages all extension commands
 * Responsible for registering and handling VS Code commands
 */
export class CommandRegistry {
  private readonly disposables: vscode.Disposable[] = []

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly repositoryManager: RepositoryManager,
    private readonly filterProfileManager: FilterProfileManager,
    private readonly treeDataProvider: ReposManagerProvider,
    private readonly progressManager: ProgressManager,
  ) {}

  /**
   * Register all extension commands
   */
  public registerAllCommands(): void {
    this.registerMainCommands()
    this.registerRepositoryCommands()
    this.registerFilterProfileCommands()
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
        }
      },
    )

    this.disposables.push(refreshCommand, openSettingsCommand, scanCommand)
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

    this.disposables.push(
      openRepoCommand,
      openRepoNewWindowCommand,
      openInTerminalCommand,
      copyPathCommand,
    )
  }

  /**
   * Register filter profile commands
   */
  private registerFilterProfileCommands(): void {
    // Create filter profile command
    const createProfileCommand = vscode.commands.registerCommand(
      'reposManager.createFilterProfile',
      async () => {
        try {
          const name = await vscode.window.showInputBox({
            prompt: 'Enter filter profile name',
            validateInput: (value) => {
              if (!value || value.trim().length === 0)
                return 'Profile name is required'

              if (
                this.filterProfileManager
                  .getProfiles()
                  .some((p) => p.name === value.trim())
              )
                return 'Profile name already exists'

              return null
            },
          })

          if (!name) return

          await this.filterProfileManager.createProfile(name.trim(), {
            languages: [],
            owners: [],
            gitStates: [],
            tags: [],
            favoritesOnly: false,
            excludeArchived: true,
            customConditions: [],
          })

          vscode.window.showInformationMessage(
            `✅ Filter profile '${name}' created successfully`,
          )
          this.treeDataProvider.refresh()
        } catch (error) {
          console.error('Failed to create filter profile:', error)
          vscode.window.showErrorMessage('Failed to create filter profile')
        }
      },
    )

    // Apply filter profile command
    const applyProfileCommand = vscode.commands.registerCommand(
      'reposManager.applyFilterProfile',
      async (profile?: FilterProfile) => {
        try {
          let selectedProfile = profile

          if (!selectedProfile) {
            const profiles = this.filterProfileManager.getProfiles()
            if (profiles.length === 0) {
              vscode.window.showWarningMessage('No filter profiles available')
              return
            }

            interface ProfileQuickPickItem extends vscode.QuickPickItem {
              profile: FilterProfile
            }

            const items: ProfileQuickPickItem[] = profiles.map((p) => ({
              label: p.name,
              description: p.description,
              profile: p,
            }))

            const selected = await vscode.window.showQuickPick(items, {
              placeHolder: 'Select a filter profile to apply',
            })

            if (!selected) return

            selectedProfile = selected.profile
          }

          await this.filterProfileManager.applyProfile(selectedProfile.id, [])
          this.treeDataProvider.refresh()
          vscode.window.showInformationMessage(
            `✅ Filter profile '${selectedProfile.name}' applied successfully`,
          )
        } catch (error) {
          console.error('Failed to apply filter profile:', error)
          vscode.window.showErrorMessage('Failed to apply filter profile')
        }
      },
    )

    // Delete filter profile command
    const deleteProfileCommand = vscode.commands.registerCommand(
      'reposManager.deleteFilterProfile',
      async (profile?: FilterProfile) => {
        if (!profile) {
          vscode.window.showWarningMessage('No profile selected')
          return
        }

        try {
          const confirm = await vscode.window.showWarningMessage(
            `Are you sure you want to delete the filter profile '${profile.name}'?`,
            { modal: true },
            'Delete',
          )

          if (confirm === 'Delete') {
            await this.filterProfileManager.deleteProfile(profile.id)
            vscode.window.showInformationMessage(
              `✅ Filter profile '${profile.name}' deleted successfully`,
            )
            this.treeDataProvider.refresh()
          }
        } catch (error) {
          console.error('Failed to delete filter profile:', error)
          vscode.window.showErrorMessage('Failed to delete filter profile')
        }
      },
    )

    this.disposables.push(
      createProfileCommand,
      applyProfileCommand,
      deleteProfileCommand,
    )
  }
}
