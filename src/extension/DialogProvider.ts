import { FilterProfile } from '@types'
import * as vscode from 'vscode'

/**
 * Dialog Provider - Handles user dialogs and input prompts
 * Centralizes dialog management for better consistency and reusability
 */
export class DialogProvider {
  /**
   * Show confirmation dialog
   * @param message
   * @param options
   * @param options.modal
   * @param options.confirmLabel
   * @param options.cancelLabel
   */
  public async showConfirmationDialog(
    message: string,
    options?: {
      modal?: boolean
      confirmLabel?: string
      cancelLabel?: string
    },
  ): Promise<boolean> {
    const confirmLabel = options?.confirmLabel ?? 'Confirm'
    const cancelLabel = options?.cancelLabel ?? 'Cancel'

    const result = await vscode.window.showWarningMessage(
      message,
      { modal: options?.modal ?? false },
      confirmLabel,
      cancelLabel,
    )

    return result === confirmLabel
  }

  /**
   * Show input dialog for text input
   * @param prompt
   * @param options
   * @param options.placeholder
   * @param options.validateInput
   * @param options.password
   */
  public async showInputDialog(
    prompt: string,
    options?: {
      placeholder?: string

      validateInput?: (input: string) => string | null
      password?: boolean
    },
  ): Promise<string | undefined> {
    return vscode.window.showInputBox({
      prompt,
      placeHolder: options?.placeholder,
      validateInput: options?.validateInput
        ? (value: string): string | null => {
            return options.validateInput ? options.validateInput(value) : null
          }
        : undefined,
      password: options?.password ?? false,
    })
  }

  /**
   * Show filter profile selection dialog
   * @param profiles
   * @param options
   * @param options.title
   * @param options.canSelectMany
   * @param options.showActiveFirst
   */
  public async showFilterProfileSelection(
    profiles: FilterProfile[],
    options?: {
      title?: string
      canSelectMany?: boolean
      showActiveFirst?: boolean
    },
  ): Promise<FilterProfile | FilterProfile[] | undefined> {
    if (profiles.length === 0) {
      vscode.window.showWarningMessage('No filter profiles available')
      return undefined
    }

    // Sort profiles to show active first if requested
    let sortedProfiles = profiles
    if (options?.showActiveFirst) {
      sortedProfiles = [...profiles].sort((a, b) => {
        if (a.isActive && !b.isActive) return -1
        if (!a.isActive && b.isActive) return 1
        return 0
      })
    }

    interface ProfileQuickPickItem extends vscode.QuickPickItem {
      profile: FilterProfile
    }

    const items: ProfileQuickPickItem[] = sortedProfiles.map((profile) => ({
      label: profile.name,
      description: profile.description,
      detail: profile.isActive ? '(Active)' : undefined,
      profile,
    }))

    if (options?.canSelectMany) {
      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: options.title ?? 'Select filter profiles',
        canPickMany: true,
      })

      return selected ? selected.map((item) => item.profile) : undefined
    } else {
      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: options?.title ?? 'Select a filter profile',
      })

      return selected ? selected.profile : undefined
    }
  }

  /**
   * Show information message
   * @param message
   */
  public showInformation(message: string): void {
    vscode.window.showInformationMessage(message)
  }

  /**
   * Show warning message
   * @param message
   */
  public showWarning(message: string): void {
    vscode.window.showWarningMessage(message)
  }

  /**
   * Show error message
   * @param message
   */
  public showError(message: string): void {
    vscode.window.showErrorMessage(message)
  }

  /**
   * Show success message with emoji
   * @param message
   */
  public showSuccess(message: string): void {
    vscode.window.showInformationMessage(`✅ ${message}`)
  }

  /**
   * Show file/folder selection dialog
   * @param options
   * @param options.title
   * @param options.canSelectFiles
   * @param options.canSelectFolders
   * @param options.canSelectMany
   * @param options.defaultUri
   * @param options.filters
   */
  public async showFileSelection(options?: {
    title?: string
    canSelectFiles?: boolean
    canSelectFolders?: boolean
    canSelectMany?: boolean
    defaultUri?: vscode.Uri
    filters?: Record<string, string[]>
  }): Promise<vscode.Uri[] | undefined> {
    return vscode.window.showOpenDialog({
      title: options?.title,
      canSelectFiles: options?.canSelectFiles ?? true,
      canSelectFolders: options?.canSelectFolders ?? false,
      canSelectMany: options?.canSelectMany ?? false,
      defaultUri: options?.defaultUri,
      filters: options?.filters,
    })
  }

  /**
   * Show save dialog
   * @param options
   * @param options.title
   * @param options.defaultUri
   * @param options.filters
   */
  public async showSaveDialog(options?: {
    title?: string
    defaultUri?: vscode.Uri
    filters?: Record<string, string[]>
  }): Promise<vscode.Uri | undefined> {
    return vscode.window.showSaveDialog({
      title: options?.title,
      defaultUri: options?.defaultUri,
      filters: options?.filters,
    })
  }
}
