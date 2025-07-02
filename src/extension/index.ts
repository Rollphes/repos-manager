import { ExtensionManager } from '@extension/ExtensionManager'
import * as vscode from 'vscode'

let extensionManager: ExtensionManager

/**
 * Extension activation function
 * Called when the extension is activated
 * @param context
 */
export async function activate(
  context: vscode.ExtensionContext,
): Promise<void> {
  try {
    extensionManager = new ExtensionManager(context)
    await extensionManager.activate()
  } catch (error) {
    console.error('Failed to activate Repos Manager extension:', error)
    vscode.window.showErrorMessage(
      '❌ Failed to activate Repos Manager extension',
    )
    throw error
  }
}

/**
 * Extension deactivation function
 * Called when the extension is deactivated
 */
export function deactivate(): void {
  extensionManager.deactivate()
}
