import * as vscode from 'vscode'

/**
 * Progress Manager - Manages progress indication for long-running operations
 * Provides a consistent interface for showing progress to users
 */
export class ProgressManager {
  /**
   * Execute a task with progress indication
   * @param options
   * @param options.title
   * @param options.cancellable
   * @param options.location
   * @param task
   */
  public async withProgress<T>(
    options: {
      title: string
      cancellable?: boolean
      location?: vscode.ProgressLocation
    },

    task: (
      progress: vscode.Progress<{ message?: string; increment?: number }>,
      token: vscode.CancellationToken,
    ) => Promise<T>,
  ): Promise<T> {
    return vscode.window.withProgress(
      {
        location: options.location ?? vscode.ProgressLocation.Notification,
        title: options.title,
        cancellable: options.cancellable ?? false,
      },
      (progress, token) => task(progress, token),
    )
  }

  /**
   * Show a simple progress notification
   * @param title
   * @param task
   * @param cancellable
   */
  public async showProgress(
    title: string,
    task: () => Promise<void>,
    cancellable = false,
  ): Promise<void> {
    return this.withProgress({ title, cancellable }, async () => {
      await task()
    })
  }

  /**
   * Show progress with incremental updates
   * @param title
   * @param task
   * @param cancellable
   */
  public async showIncrementalProgress<T>(
    title: string,
    task: (
      reportProgress: (message: string, increment?: number) => void,
    ) => Promise<T>,
    cancellable = false,
  ): Promise<T> {
    return this.withProgress({ title, cancellable }, async (progress) => {
      return await task((message: string, increment?: number) => {
        if (increment !== undefined) progress.report({ increment, message })
        else progress.report({ message })
      })
    })
  }
}
