import * as vscode from 'vscode';
import { ReposManagerProvider } from './ui/ReposManagerProvider';
import { RepositoryManager } from './core/RepositoryManager';
import { WorkspaceManager } from './core/WorkspaceManager';
import { ConfigurationService } from './services/ConfigurationService';
import { Repository, Workspace, WorkspaceExport } from './types';

let repositoryManager: RepositoryManager;
let workspaceManager: WorkspaceManager;
let treeDataProvider: ReposManagerProvider;

/**
 * Extension activation function
 * Called when the extension is activated
 */
export function activate(context: vscode.ExtensionContext): void {
  console.warn('🚀 [Repos Manager] Extension is being activated');

  // Initialize services
  const configService = new ConfigurationService();
  repositoryManager = new RepositoryManager(configService, context);
  workspaceManager = new WorkspaceManager(context);
  treeDataProvider = new ReposManagerProvider(repositoryManager, workspaceManager);

  console.warn('✅ [Repos Manager] Services initialized');

  // Register tree data provider
  vscode.window.createTreeView('reposManager', {
    treeDataProvider,
    showCollapseAll: true,
    canSelectMany: false
  });

  // Set context for when clause
  vscode.commands.executeCommand('setContext', 'reposManager.enabled', true);

  // Register commands
  registerCommands(context);

  // Initial scan if configured
  const config = configService.getConfiguration();
  console.warn('📋 [CONFIG] Configuration loaded:', {
    rootPaths: config.scanning.rootPaths,
    scanDepth: config.scanning.scanDepth
  });

  if (config.scanning.rootPaths.length > 0) {
    console.warn('🔍 [SCAN] Starting initial repository scan...');
    // Perform initial scan with progress indication
    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: '🔍 Initializing Repos Manager...',
        cancellable: false
      },
      async (progress) => {
        try {
          await repositoryManager.scanRepositories(undefined, (message, increment) => {
            if (increment !== undefined) {
              progress.report({ increment, message: `🔍 ${message}` });
            } else {
              progress.report({ message: `🔍 ${message}` });
            }
          });
          treeDataProvider.refresh();
          vscode.window.showInformationMessage('✅ Repos Manager initialized successfully');
        } catch (error) {
          console.error('Initial repository scan failed:', error);
          vscode.window.showErrorMessage('❌ Failed to initialize Repos Manager. Check the output panel for details.');
        }
      }
    );
  } else {
    console.warn('⚠️ [SCAN] No root paths configured - skipping initial scan');
    vscode.window.showWarningMessage('⚙️ No scan paths configured. Please configure scan paths in settings.');
  }

  console.warn('🚀 [Repos Manager] Extension activated successfully');
}

/**
 * Extension deactivation function
 * Called when the extension is deactivated
 */
export function deactivate(): void {
  console.warn('🛑 [Repos Manager] Extension is being deactivated');

  // Dispose of managers
  if (workspaceManager) {
    workspaceManager.dispose();
  }

  if (treeDataProvider) {
    treeDataProvider.dispose();
  }
}

/**
 * Register all extension commands
 */
function registerCommands(context: vscode.ExtensionContext): void {
  const commands = [
    // Main commands
    vscode.commands.registerCommand('reposManager.refresh', async () => {
      try {
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: '🔄 Refreshing repositories...',
            cancellable: true
          },
          async (progress, token) => {
            await repositoryManager.scanRepositories(token, (message, increment) => {
              if (increment !== undefined) {
                progress.report({ increment, message: `🔄 ${message}` });
              } else {
                progress.report({ message: `🔄 ${message}` });
              }
            });
            treeDataProvider.refresh();
          }
        );
        vscode.window.showInformationMessage('✅ Repository refresh completed successfully');
      } catch (error) {
        console.error('Refresh command failed:', error);
        vscode.window.showErrorMessage('Failed to refresh repositories');
      }
    }),

    vscode.commands.registerCommand('reposManager.openSettings', () => {
      vscode.commands.executeCommand('workbench.action.openSettings', 'reposManager');
    }),

    vscode.commands.registerCommand('reposManager.scanRepositories', async () => {
      try {
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: '🔍 Scanning repositories...',
            cancellable: true
          },
          async (progress, token) => {
            await repositoryManager.scanRepositories(token, (message, increment) => {
              if (increment !== undefined) {
                progress.report({ increment, message: `🔍 ${message}` });
              } else {
                progress.report({ message: `🔍 ${message}` });
              }
            });
            treeDataProvider.refresh();
          }
        );
        vscode.window.showInformationMessage('✅ Repository scan completed successfully');
      } catch (error) {
        console.error('Scan repositories command failed:', error);
        vscode.window.showErrorMessage('Failed to scan repositories');
      }
    }),

    // Repository actions
    vscode.commands.registerCommand('reposManager.openRepository', (treeItem) => {
      // Extract repository from TreeItem
      const repository = (treeItem as { repository?: Repository })?.repository;

      if (repository?.path) {
        const uri = vscode.Uri.file(repository.path);
        vscode.commands.executeCommand('vscode.openFolder', uri, { forceNewWindow: false });
      }
    }),

    vscode.commands.registerCommand('reposManager.openRepositoryInNewWindow', (treeItem) => {
      // Extract repository from TreeItem
      const repository = (treeItem as { repository?: Repository })?.repository;

      if (repository?.path) {
        const uri = vscode.Uri.file(repository.path);
        vscode.commands.executeCommand('vscode.openFolder', uri, { forceNewWindow: true });
      }
    }),

    // Favorite management commands
    vscode.commands.registerCommand('reposManager.toggleFavorite', async (repository) => {
      console.warn('🔥 [FAVORITES] Toggle Favorite command triggered');

      if (repository?.id) {
        try {
          const repositories = repositoryManager.getRepositories();
          const currentRepo = repositories.find(r => r.id === repository.id);
          const newFavoriteStatus = !currentRepo?.isFavorite;

          await repositoryManager.setFavorite(repository.id, newFavoriteStatus);
          treeDataProvider.refresh();

          const status = newFavoriteStatus ? 'added to' : 'removed from';
          vscode.window.showInformationMessage(`${repository.name} ${status} favorites`);
        } catch (error) {
          console.error('Toggle favorite failed:', error);
          vscode.window.showErrorMessage('Failed to toggle favorite status');
        }
      }
    }),

    vscode.commands.registerCommand('reposManager.addToFavorites', async (treeItem) => {
      console.warn('🔥 [FAVORITES] Add to Favorites command triggered. TreeItem:', !!treeItem);

      // Extract repository from TreeItem
      const repository = (treeItem as { repository?: Repository })?.repository;
      console.warn('🔥 [FAVORITES] Extracted repository:', repository?.id, repository?.name);

      if (repository?.id) {
        try {
          await repositoryManager.setFavorite(repository.id, true);
          treeDataProvider.refresh();
          vscode.window.showInformationMessage(`Added ${repository.name} to favorites`);
          console.warn('🔥 [FAVORITES] Successfully added to favorites');
        } catch (error) {
          console.error('Add to favorites failed:', error);
          vscode.window.showErrorMessage('Failed to add to favorites');
        }
      } else {
        console.warn('🔥 [FAVORITES] No repository found in TreeItem:', treeItem);
      }
    }),

    vscode.commands.registerCommand('reposManager.removeFromFavorites', async (treeItem) => {
      // Extract repository from TreeItem
      const repository = (treeItem as { repository?: Repository })?.repository;
      console.warn('🔥 [FAVORITES] Remove from Favorites command triggered:', repository?.id);

      if (repository?.id) {
        try {
          await repositoryManager.setFavorite(repository.id, false);
          treeDataProvider.refresh();
          vscode.window.showInformationMessage(`Removed ${repository.name} from favorites`);
        } catch (error) {
          console.error('Remove from favorites failed:', error);
          vscode.window.showErrorMessage('Failed to remove from favorites');
        }
      }
    }),

    // Search and filter commands
    vscode.commands.registerCommand('reposManager.search', async () => {
      try {
        await showSearchDialog();
      } catch (error) {
        console.error('Search command failed:', error);
        vscode.window.showErrorMessage('Failed to open search dialog');
      }
    }),

    vscode.commands.registerCommand('reposManager.filter', async () => {
      try {
        await showUnifiedFilterDialog();
      } catch (error) {
        console.error('Filter command failed:', error);
        vscode.window.showErrorMessage('Failed to open filter dialog');
      }
    }),

    // Legacy commands for backward compatibility (deprecated)
    vscode.commands.registerCommand('reposManager.basicFilter', async () => {
      try {
        await showBasicFilterDialog();
      } catch (error) {
        console.error('Basic filter command failed:', error);
        vscode.window.showErrorMessage('Failed to open basic filter dialog');
      }
    }),

    vscode.commands.registerCommand('reposManager.advancedFilter', async () => {
      try {
        await showAdvancedFilterDialog();
      } catch (error) {
        console.error('Advanced filter command failed:', error);
        vscode.window.showErrorMessage('Failed to open advanced filter dialog');
      }
    }),

    vscode.commands.registerCommand('reposManager.clearFilters', () => {
      try {
        treeDataProvider.clearFilters();
        vscode.window.showInformationMessage('All filters cleared');
      } catch (error) {
        console.error('Clear filters command failed:', error);
        vscode.window.showErrorMessage('Failed to clear filters');
      }
    }),

    // Workspace management commands
    vscode.commands.registerCommand('reposManager.createWorkspace', async () => {
      try {
        await showCreateWorkspaceDialog();
      } catch (error) {
        console.error('Create workspace command failed:', error);
        vscode.window.showErrorMessage('Failed to create workspace');
      }
    }),

    vscode.commands.registerCommand('reposManager.switchWorkspace', async () => {
      try {
        await showSwitchWorkspaceDialog();
      } catch (error) {
        console.error('Switch workspace command failed:', error);
        vscode.window.showErrorMessage('Failed to switch workspace');
      }
    }),

    vscode.commands.registerCommand('reposManager.manageWorkspaces', async () => {
      try {
        await showManageWorkspacesDialog();
      } catch (error) {
        console.error('Manage workspaces command failed:', error);
        vscode.window.showErrorMessage('Failed to open workspace management');
      }
    }),

    vscode.commands.registerCommand('reposManager.exportWorkspace', async () => {
      try {
        await showExportWorkspaceDialog();
      } catch (error) {
        console.error('Export workspace command failed:', error);
        vscode.window.showErrorMessage('Failed to export workspace');
      }
    }),

    vscode.commands.registerCommand('reposManager.importWorkspace', async () => {
      try {
        await showImportWorkspaceDialog();
      } catch (error) {
        console.error('Import workspace command failed:', error);
        vscode.window.showErrorMessage('Failed to import workspace');
      }
    })
  ];

  // Add all commands to context for proper disposal
  commands.forEach(command => context.subscriptions.push(command));
}

/**
 * Show search dialog for repositories
 */
async function showSearchDialog(): Promise<void> {
  const searchTerm = await vscode.window.showInputBox({
    prompt: 'Search repositories by name',
    placeHolder: 'Enter repository name...',
    ignoreFocusOut: true
  });

  if (searchTerm !== undefined) {
    // Apply search filter
    const filter = searchTerm.trim() === '' ? {} : { searchTerm: searchTerm.trim() };
    treeDataProvider.setFilter(filter);

    if (searchTerm.trim() === '') {
      vscode.window.showInformationMessage('Search cleared');
    } else {
      vscode.window.showInformationMessage(`Searching for: ${searchTerm}`);
    }
  }
}

/**
 * Show unified filter dialog - main entry point for filtering
 */
async function showUnifiedFilterDialog(): Promise<void> {
  interface FilterTypeQuickPickItem extends vscode.QuickPickItem {
    type: 'basic' | 'advanced' | 'clear';
  }

  const filterOptions: FilterTypeQuickPickItem[] = [
    {
      label: '$(search) Quick Filter',
      description: 'Basic filtering options (language, favorites, recent)',
      type: 'basic'
    },
    {
      label: '$(settings-gear) Advanced Filter',
      description: 'Detailed filtering with multiple categories',
      type: 'advanced'
    },
    {
      label: '$(clear-all) Clear All Filters',
      description: 'Remove all active filters and show all repositories',
      type: 'clear'
    }
  ];

  const selected = await vscode.window.showQuickPick(filterOptions, {
    placeHolder: 'Choose filter type',
    ignoreFocusOut: true
  });

  if (selected) {
    switch (selected.type) {
    case 'basic':
      await showBasicFilterDialog();
      break;
    case 'advanced':
      await showAdvancedFilterDialog();
      break;
    case 'clear':
      treeDataProvider.clearFilters();
      vscode.window.showInformationMessage('All filters cleared');
      break;
    }
  }
}

/**
 * Show basic filter dialog for repositories
 */
async function showBasicFilterDialog(): Promise<void> {
  // Get available languages from repositories
  const repositories = repositoryManager.getRepositories();
  const languages = [...new Set(repositories.map(r => r.metadata.language).filter(Boolean))];

  interface FilterQuickPickItem extends vscode.QuickPickItem {
    id: string;
    type: 'language' | 'favorites' | 'recent' | 'group';
  }

  const quickPickItems: FilterQuickPickItem[] = [
    {
      id: 'all',
      label: '$(list-unordered) All Repositories',
      description: 'Show all repositories',
      type: 'group'
    },
    {
      id: 'favorites',
      label: '$(star-full) Favorites Only',
      description: 'Show only favorite repositories',
      type: 'favorites'
    },
    {
      id: 'recent',
      label: '$(clock) Recent Activity',
      description: 'Show recently updated repositories',
      type: 'recent'
    }
  ];

  // Add language filters
  if (languages.length > 0) {
    quickPickItems.push(
      {
        id: 'lang-separator',
        label: '$(symbol-class) Languages',
        description: '',
        kind: vscode.QuickPickItemKind.Separator,
        type: 'group'
      } as FilterQuickPickItem
    );

    languages.forEach(language => {
      quickPickItems.push({
        id: `lang-${language}`,
        label: `$(code) ${language}`,
        description: `Show ${language} repositories`,
        type: 'language'
      });
    });
  }

  const selected = await vscode.window.showQuickPick(quickPickItems, {
    placeHolder: 'Select filter for repositories',
    ignoreFocusOut: true
  });

  if (selected) {
    let filter = {};
    let message = '';

    switch (selected.type) {
    case 'language': {
      const language = selected.id.replace('lang-', '');
      filter = { language };
      message = `Filtering by language: ${language}`;
      break;
    }
    case 'favorites':
      filter = { isFavorite: true };
      message = 'Showing only favorites';
      break;
    case 'recent': {
      // Show repositories updated in last 7 days
      const sevenDaysAgo = new Date();
      const daysBack = 7; // Number of days to look back for recent repositories
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - daysBack);
      filter = { dateRange: { start: sevenDaysAgo, end: new Date() } };
      message = 'Showing recent repositories (last 7 days)';
      break;
    }
    default:
      filter = {};
      message = 'Showing all repositories';
    }

    treeDataProvider.setFilter(filter);
    vscode.window.showInformationMessage(message);
  }
}

/**
 * Show advanced filter dialog with multiple criteria
 */
async function showAdvancedFilterDialog(): Promise<void> {
  const repositories = repositoryManager.getRepositories();

  // Collect available options
  const languages = [...new Set(repositories.map(r => r.metadata.language).filter(Boolean))];

  interface AdvancedFilterQuickPickItem extends vscode.QuickPickItem {
    id: string;
    type: 'category' | 'language' | 'git-status' | 'date' | 'size' | 'feature' | 'action';
    value?: string | number;
  }

  const quickPickItems: AdvancedFilterQuickPickItem[] = [
    // Category headers
    {
      id: 'lang-header',
      label: '$(symbol-class) Programming Languages',
      description: 'Filter by primary language',
      kind: vscode.QuickPickItemKind.Separator,
      type: 'category'
    }
  ];

  // Add language options
  languages.forEach(language => {
    const count = repositories.filter(r => r.metadata.language === language).length;
    quickPickItems.push({
      id: `lang-${language}`,
      label: `$(code) ${language}`,
      description: `${count} repositories`,
      type: 'language',
      value: language
    });
  });

  // Git status filters
  quickPickItems.push(
    {
      id: 'git-header',
      label: '$(git-branch) Git Status',
      description: 'Filter by repository state',
      kind: vscode.QuickPickItemKind.Separator,
      type: 'category'
    },
    {
      id: 'git-clean',
      label: '$(check) Clean Repositories',
      description: 'No uncommitted changes',
      type: 'git-status',
      value: 'clean'
    },
    {
      id: 'git-modified',
      label: '$(edit) Modified Repositories',
      description: 'Has uncommitted changes',
      type: 'git-status',
      value: 'modified'
    },
    {
      id: 'git-behind',
      label: '$(arrow-down) Behind Remote',
      description: 'Local branch is behind remote',
      type: 'git-status',
      value: 'behind'
    }
  );

  // Date filters
  quickPickItems.push(
    {
      id: 'date-header',
      label: '$(calendar) Date Filters',
      description: 'Filter by last activity',
      kind: vscode.QuickPickItemKind.Separator,
      type: 'category'
    },
    {
      id: 'date-today',
      label: '$(clock) Updated Today',
      description: 'Modified in the last 24 hours',
      type: 'date',
      value: 1
    },
    {
      id: 'date-week',
      label: '$(history) This Week',
      description: 'Modified in the last 7 days',
      type: 'date',
      value: 7
    },
    {
      id: 'date-month',
      label: '$(archive) This Month',
      description: 'Modified in the last 30 days',
      type: 'date',
      value: 30
    }
  );

  // Project features
  quickPickItems.push(
    {
      id: 'feature-header',
      label: '$(beaker) Project Features',
      description: 'Filter by project characteristics',
      kind: vscode.QuickPickItemKind.Separator,
      type: 'category'
    },
    {
      id: 'feature-tests',
      label: '$(check-all) Has Tests',
      description: 'Projects with test files',
      type: 'feature',
      value: 'hasTests'
    },
    {
      id: 'feature-cicd',
      label: '$(gear) Has CI/CD',
      description: 'Projects with CI/CD configuration',
      type: 'feature',
      value: 'hasCicd'
    },
    {
      id: 'feature-large',
      label: '$(file-zip) Large Projects',
      description: 'Projects with 1000+ files',
      type: 'size',
      value: 'large'
    }
  );

  // Special actions
  quickPickItems.push(
    {
      id: 'action-header',
      label: '$(tools) Special Filters',
      description: 'Advanced filtering options',
      kind: vscode.QuickPickItemKind.Separator,
      type: 'category'
    },
    {
      id: 'action-combine',
      label: '$(combine) Combine Filters',
      description: 'Apply multiple filters at once',
      type: 'action',
      value: 'combine'
    },
    {
      id: 'action-exclude',
      label: '$(exclude) Exclude Mode',
      description: 'Show repositories NOT matching criteria',
      type: 'action',
      value: 'exclude'
    }
  );

  const selected = await vscode.window.showQuickPick(quickPickItems, {
    placeHolder: 'Select advanced filter criteria',
    ignoreFocusOut: true,
    canPickMany: false
  });

  if (selected) {
    await applyAdvancedFilter(selected);
  }
}

/**
 * Apply the selected advanced filter
 */
async function applyAdvancedFilter(selected: { id: string; type: string; value?: string | number }): Promise<void> {
  // Time period constants
  const ONE_DAY = 1;
  const ONE_WEEK = 7;
  const ONE_MONTH = 30;
  const LARGE_PROJECT_MIN_FILES = 1000;

  let filter = {};
  let message = '';

  switch (selected.type) {
  case 'language':
    filter = { language: selected.value };
    message = `Filtering by language: ${selected.value}`;
    break;

  case 'git-status':
    if (selected.value === 'clean') {
      filter = { hasUncommitted: false };
      message = 'Showing clean repositories';
    } else if (selected.value === 'modified') {
      filter = { hasUncommitted: true };
      message = 'Showing modified repositories';
    } else if (selected.value === 'behind') {
      // This would need git status checking - for now, show all
      filter = {};
      message = 'Git status filtering (coming soon)';
    }
    break;

  case 'date': {
    const daysBack = selected.value as number;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    filter = { dateRange: { start: cutoffDate, end: new Date() } };

    let timeframe: string;
    if (daysBack === ONE_DAY) {
      timeframe = 'today';
    } else if (daysBack === ONE_WEEK) {
      timeframe = 'this week';
    } else if (daysBack === ONE_MONTH) {
      timeframe = 'this month';
    } else {
      timeframe = `last ${daysBack} days`;
    }
    message = `Showing repositories updated ${timeframe}`;
    break;
  }

  case 'feature':
    if (selected.value === 'hasTests') {
      filter = { hasTests: true };
      message = 'Showing projects with tests';
    } else if (selected.value === 'hasCicd') {
      filter = { hasCicd: true };
      message = 'Showing projects with CI/CD';
    }
    break;

  case 'size':
    if (selected.value === 'large') {
      filter = { sizeRange: { min: LARGE_PROJECT_MIN_FILES } };
      message = 'Showing large projects (1000+ files)';
    }
    break;

  case 'action':
    if (selected.value === 'combine') {
      await showCombineFiltersDialog();
      return;
    } else if (selected.value === 'exclude') {
      // For now, just show a message about future feature
      vscode.window.showInformationMessage('🚧 Exclude mode coming in future update!');
      return;
    }
    break;

  default:
    filter = {};
    message = 'No filter applied';
  }

  treeDataProvider.setFilter(filter);
  vscode.window.showInformationMessage(message);
}

/**
 * Show dialog for combining multiple filters
 */
async function showCombineFiltersDialog(): Promise<void> {
  vscode.window.showInformationMessage(
    '🚧 Multi-filter combination is coming in the next update! For now, you can apply filters one at a time.',
    'Got it'
  );
}

// =============================================================================
// Workspace Management Dialog Functions
// =============================================================================

/**
 * Show create workspace dialog
 */
async function showCreateWorkspaceDialog(): Promise<void> {
  // Step 1: Get workspace name
  const name = await vscode.window.showInputBox({
    prompt: 'Enter workspace name',
    placeHolder: 'My Workspace',
    ignoreFocusOut: true,
    validateInput: (value) => {
      if (!value.trim()) {
        return 'Workspace name cannot be empty';
      }
      const existingWorkspaces = workspaceManager.getWorkspaces();
      if (existingWorkspaces.some(w => w.name === value.trim())) {
        return 'Workspace with this name already exists';
      }
      return undefined;
    }
  });

  if (!name) {
    return;
  }

  // Step 2: Select repositories
  const repositories = repositoryManager.getRepositories();
  if (repositories.length === 0) {
    vscode.window.showWarningMessage('No repositories found. Please scan for repositories first.');
    return;
  }

  interface RepositoryQuickPickItem extends vscode.QuickPickItem {
    repository: Repository;
  }

  const repoItems: RepositoryQuickPickItem[] = repositories.map(repo => ({
    label: `$(folder) ${repo.name}`,
    description: repo.metadata.language || 'Unknown',
    detail: repo.path,
    repository: repo
  }));

  const selectedRepos = await vscode.window.showQuickPick(repoItems, {
    placeHolder: 'Select repositories for this workspace',
    canPickMany: true,
    ignoreFocusOut: true
  });

  if (!selectedRepos || selectedRepos.length === 0) {
    vscode.window.showWarningMessage('No repositories selected. Workspace creation cancelled.');
    return;
  }

  // Step 3: Optional description
  const description = await vscode.window.showInputBox({
    prompt: 'Enter workspace description (optional)',
    placeHolder: 'A collection of related projects...',
    ignoreFocusOut: true
  });

  // Step 4: Create workspace
  try {
    const repositoryIds = selectedRepos.map(item => item.repository.id);
    const workspace = await workspaceManager.createWorkspace(name.trim(), repositoryIds, {
      description: description?.trim(),
      icon: '📁',
      tags: []
    });

    vscode.window.showInformationMessage(
      `Workspace "${workspace.name}" created with ${repositoryIds.length} repositories`
    );
  } catch (error) {
    console.error('Failed to create workspace:', error);
    vscode.window.showErrorMessage('Failed to create workspace');
  }
}

/**
 * Show switch workspace dialog
 */
async function showSwitchWorkspaceDialog(): Promise<void> {
  const workspaces = workspaceManager.getWorkspaces();
  if (workspaces.length === 0) {
    vscode.window.showInformationMessage('No workspaces found. Create a workspace first.');
    return;
  }

  interface WorkspaceQuickPickItem extends vscode.QuickPickItem {
    workspace: Workspace;
  }

  const workspaceItems: WorkspaceQuickPickItem[] = workspaces.map(workspace => ({
    label: `${workspace.icon || '📁'} ${workspace.name}`,
    description: workspace.isActive ? '$(check) Active' : `${workspace.repositoryIds.length} repositories`,
    detail: workspace.description,
    workspace
  }));

  const selected = await vscode.window.showQuickPick(workspaceItems, {
    placeHolder: 'Select workspace to switch to',
    ignoreFocusOut: true
  });

  if (selected) {
    try {
      await workspaceManager.switchWorkspace(selected.workspace.id);
      vscode.window.showInformationMessage(`Switched to workspace "${selected.workspace.name}"`);

      // Apply workspace filter to tree view
      const repositoryIds = selected.workspace.repositoryIds;
      treeDataProvider.setFilter({ workspaceRepositoryIds: repositoryIds });
    } catch (error) {
      console.error('Failed to switch workspace:', error);
      vscode.window.showErrorMessage('Failed to switch workspace');
    }
  }
}

/**
 * Show manage workspaces dialog
 */
async function showManageWorkspacesDialog(): Promise<void> {
  const workspaces = workspaceManager.getWorkspaces();
  if (workspaces.length === 0) {
    vscode.window.showInformationMessage('No workspaces found. Create a workspace first.');
    return;
  }

  interface WorkspaceManageQuickPickItem extends vscode.QuickPickItem {
    workspace: Workspace;
    action: 'switch' | 'edit' | 'delete' | 'export';
  }

  const workspaceItems: WorkspaceManageQuickPickItem[] = [];

  workspaces.forEach(workspace => {
    workspaceItems.push(
      {
        label: `$(folder) Switch to "${workspace.name}"`,
        description: workspace.isActive ? '$(check) Active' : `${workspace.repositoryIds.length} repositories`,
        detail: workspace.description,
        workspace,
        action: 'switch'
      },
      {
        label: `$(edit) Edit "${workspace.name}"`,
        description: 'Modify name, description, or repositories',
        workspace,
        action: 'edit'
      },
      {
        label: `$(export) Export "${workspace.name}"`,
        description: 'Export workspace configuration',
        workspace,
        action: 'export'
      },
      {
        label: `$(trash) Delete "${workspace.name}"`,
        description: 'Permanently delete this workspace',
        workspace,
        action: 'delete'
      }
    );
  });

  const selected = await vscode.window.showQuickPick(workspaceItems, {
    placeHolder: 'Select workspace action',
    ignoreFocusOut: true
  });

  if (selected) {
    switch (selected.action) {
    case 'switch':
      await workspaceManager.switchWorkspace(selected.workspace.id);
      vscode.window.showInformationMessage(`Switched to workspace "${selected.workspace.name}"`);
      break;
    case 'edit':
      await showEditWorkspaceDialog(selected.workspace);
      break;
    case 'export':
      await exportWorkspace(selected.workspace);
      break;
    case 'delete':
      await deleteWorkspace(selected.workspace);
      break;
    }
  }
}

/**
 * Show export workspace dialog
 */
async function showExportWorkspaceDialog(): Promise<void> {
  const activeWorkspace = workspaceManager.getActiveWorkspace();
  if (!activeWorkspace) {
    // Show workspace selection if no active workspace
    const workspaces = workspaceManager.getWorkspaces();
    if (workspaces.length === 0) {
      vscode.window.showInformationMessage('No workspaces found to export.');
      return;
    }

    interface WorkspaceQuickPickItem extends vscode.QuickPickItem {
      workspace: Workspace;
    }

    const workspaceItems: WorkspaceQuickPickItem[] = workspaces.map(workspace => ({
      label: `${workspace.icon || '📁'} ${workspace.name}`,
      description: `${workspace.repositoryIds.length} repositories`,
      detail: workspace.description,
      workspace
    }));

    const selected = await vscode.window.showQuickPick(workspaceItems, {
      placeHolder: 'Select workspace to export',
      ignoreFocusOut: true
    });

    if (selected) {
      await exportWorkspace(selected.workspace);
    }
  } else {
    await exportWorkspace(activeWorkspace);
  }
}

/**
 * Show import workspace dialog
 */
async function showImportWorkspaceDialog(): Promise<void> {
  const fileUri = await vscode.window.showOpenDialog({
    canSelectFiles: true,
    canSelectFolders: false,
    canSelectMany: false,
    filters: {
      'Workspace files': ['json']
    },
    openLabel: 'Import Workspace'
  });

  if (fileUri && fileUri[0]) {
    try {
      const fileContent = await vscode.workspace.fs.readFile(fileUri[0]);
      const workspaceData = JSON.parse(fileContent.toString()) as WorkspaceExport;

      const repositories = repositoryManager.getRepositories();
      const workspace = await workspaceManager.importWorkspace(workspaceData, repositories);

      vscode.window.showInformationMessage(
        `Workspace "${workspace.name}" imported successfully with ${workspace.repositoryIds.length} repositories`
      );
    } catch (error) {
      console.error('Failed to import workspace:', error);
      vscode.window.showErrorMessage('Failed to import workspace. Please check the file format.');
    }
  }
}

/**
 * Helper function to edit workspace
 */
async function showEditWorkspaceDialog(workspace: Workspace): Promise<void> {
  // Get current values
  const currentName = workspace.name;
  const currentDescription = workspace.description || '';
  const currentIcon = workspace.icon || '📁';

  // Show name input
  const name = await vscode.window.showInputBox({
    title: 'Edit Workspace',
    prompt: 'Enter workspace name',
    value: currentName,
    validateInput: (value) => {
      if (!value || value.trim().length === 0) {
        return 'Workspace name cannot be empty';
      }

      // Check for duplicate names (excluding current workspace)
      const existingWorkspaces = workspaceManager.getWorkspaces();
      const isDuplicate = existingWorkspaces.some(ws =>
        ws.id !== workspace.id && ws.name.toLowerCase() === value.trim().toLowerCase()
      );

      if (isDuplicate) {
        return 'A workspace with this name already exists';
      }

      return undefined;
    }
  });

  if (!name) {
    return; // User cancelled
  }

  // Show description input
  const description = await vscode.window.showInputBox({
    title: 'Edit Workspace - Description',
    prompt: 'Enter workspace description (optional)',
    value: currentDescription,
    placeHolder: 'Description for this workspace...'
  });

  if (description === undefined) {
    return; // User cancelled
  }

  // Show icon selection
  const iconOptions: Array<{ label: string; description: string; icon: string }> = [
    { label: '📁', description: 'Folder', icon: '📁' },
    { label: '🚀', description: 'Project', icon: '🚀' },
    { label: '⚡', description: 'Development', icon: '⚡' },
    { label: '🏠', description: 'Home', icon: '🏠' },
    { label: '💼', description: 'Work', icon: '💼' },
    { label: '🎯', description: 'Target', icon: '🎯' },
    { label: '⭐', description: 'Favorite', icon: '⭐' },
    { label: '🔧', description: 'Tools', icon: '🔧' },
    { label: '📚', description: 'Learning', icon: '📚' },
    { label: '🌟', description: 'Special', icon: '🌟' }
  ];

  const selectedIcon = await vscode.window.showQuickPick(iconOptions, {
    title: 'Edit Workspace - Select Icon',
    placeHolder: 'Choose an icon for the workspace',
    matchOnDescription: true
  });

  const icon = selectedIcon ? selectedIcon.icon : currentIcon;

  try {
    await workspaceManager.updateWorkspace(workspace.id, {
      name: name.trim(),
      description: description.trim() || undefined,
      icon
    });

    vscode.window.showInformationMessage(`Workspace "${name}" updated successfully`);
  } catch (error) {
    console.error('Failed to update workspace:', error);
    vscode.window.showErrorMessage('Failed to update workspace');
  }
}

/**
 * Helper function to export workspace
 */
async function exportWorkspace(workspace: Workspace): Promise<void> {
  try {
    const repositories = repositoryManager.getRepositories();
    const exportData = await workspaceManager.exportWorkspace(workspace.id, repositories);

    const saveUri = await vscode.window.showSaveDialog({
      filters: {
        'Workspace files': ['json']
      },
      defaultUri: vscode.Uri.file(`${workspace.name}-workspace.json`)
    });

    if (saveUri) {
      const jsonContent = JSON.stringify(exportData, null, 2);
      await vscode.workspace.fs.writeFile(saveUri, Buffer.from(jsonContent));
      vscode.window.showInformationMessage(`Workspace "${workspace.name}" exported successfully`);
    }
  } catch (error) {
    console.error('Failed to export workspace:', error);
    vscode.window.showErrorMessage('Failed to export workspace');
  }
}

/**
 * Helper function to delete workspace
 */
async function deleteWorkspace(workspace: Workspace): Promise<void> {
  const confirmation = await vscode.window.showWarningMessage(
    `Are you sure you want to delete workspace "${workspace.name}"?`,
    { modal: true },
    'Delete',
    'Cancel'
  );

  if (confirmation === 'Delete') {
    try {
      await workspaceManager.deleteWorkspace(workspace.id);
      vscode.window.showInformationMessage(`Workspace "${workspace.name}" deleted successfully`);
    } catch (error) {
      console.error('Failed to delete workspace:', error);
      vscode.window.showErrorMessage('Failed to delete workspace');
    }
  }
}
