import * as vscode from 'vscode';
import { Repository, RepositoryFilter, Workspace } from '../types';
import { RepositoryManager } from '../core/RepositoryManager';
import { WorkspaceManager } from '../core/WorkspaceManager';

interface ExtendedTreeItem extends vscode.TreeItem {
  repositories?: Repository[];
  repository?: Repository;
  workspace?: Workspace;
}

/**
 * Tree data provider for the Repos Manager view
 */
export class ReposManagerProvider implements vscode.TreeDataProvider<TreeItem> {
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private currentFilter: RepositoryFilter = {};
  private groupBy: 'none' | 'language' | 'favorite' | 'workspace' = 'none';
  private isLoading = false;
  private readonly showWorkspaces = false;

  constructor(
    // eslint-disable-next-line no-unused-vars
    private readonly _repositoryManager: RepositoryManager,
    // eslint-disable-next-line no-unused-vars
    private readonly _workspaceManager: WorkspaceManager
  ) {
    // Listen for repository changes
    this._repositoryManager.onDidChangeRepositories(() => {
      this.setLoading(false);
      this.refresh();
    });

    // Listen for workspace changes
    this._workspaceManager.onDidChangeWorkspaces(() => {
      this.refresh();
    });
  }

  /**
   * Set loading state
   */
  public setLoading(isLoading: boolean): void {
    this.isLoading = isLoading;
    this.refresh();
  }

  /**
   * Refresh the tree view
   */
  public refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  /**
   * Set filter for repositories
   */
  public setFilter(filter: RepositoryFilter): void {
    this.currentFilter = filter;
    this.refresh();
  }

  /**
   * Set grouping mode
   */
  public setGroupBy(groupBy: 'none' | 'language' | 'favorite' | 'workspace'): void {
    this.groupBy = groupBy;
    this.refresh();
  }

  /**
   * Clear all filters
   */
  public clearFilters(): void {
    this.currentFilter = {};
    this.refresh();
  }

  /**
   * Set workspace view mode
   */
  // eslint-disable-next-line no-unused-vars
  public setShowWorkspaces(_showWorkspaces: boolean): void {
    // This would normally toggle workspace view, but for now keeping it readonly
    this.refresh();
  }

  /**
   * Filter repositories by workspace
   */
  public filterByWorkspace(workspaceId: string | undefined): void {
    this.currentFilter = { ...this.currentFilter, workspaceId };
    this.refresh();
  }

  /**
   * Get tree item representation
   */
  public getTreeItem(element: TreeItem): vscode.TreeItem {
    return element;
  }

  /**
   * Get children for tree item
   */
  public getChildren(element?: TreeItem): Promise<TreeItem[]> {
    if (!element) {
      // Root level - show groups or repositories
      return Promise.resolve(this.getRootItems());
    }

    if (element.contextValue === 'group') {
      // Group level - show repositories in group
      return Promise.resolve(this.getRepositoriesInGroup(element));
    }

    // Repository level - no children
    return Promise.resolve([]);
  }

  /**
   * Get root level items
   */
  private getRootItems(): TreeItem[] {
    // Show loading state
    if (this.isLoading) {
      return [this.createLoadingItem()];
    }

    const repositories = this._repositoryManager.getRepositories(
      this.currentFilter,
      { field: 'name', order: 'asc' }
    );

    console.warn('=== TREE DATA PROVIDER DEBUG ===');
    console.warn(`Total repositories: ${repositories.length}`);
    console.warn(`Group by: ${this.groupBy}`);
    console.warn('Current filter:', this.currentFilter);

    if (repositories.length === 0) {
      return [this.createEmptyStateItem()];
    }

    if (this.groupBy === 'none') {
      const items = repositories.map(repo => this.createRepositoryItem(repo));
      console.warn(`Created ${items.length} repository items`);
      return items;
    }

    const groupItems = this.createGroupItems(repositories);
    console.warn(`Created ${groupItems.length} group items`);
    return groupItems;
  }

  /**
   * Create group items
   */
  private createGroupItems(repositories: Repository[]): TreeItem[] {
    const groups = new Map<string, Repository[]>();

    // Group repositories
    for (const repo of repositories) {
      let groupKey: string;

      switch (this.groupBy) {
      case 'language':
        groupKey = repo.metadata.language || 'Unknown';
        break;
      case 'favorite':
        groupKey = repo.isFavorite ? 'Favorites' : 'Other';
        break;
      case 'workspace': {
        // Find workspace containing this repository
        const workspaces = this._workspaceManager.getWorkspaces();
        const containingWorkspace = workspaces.find(ws => ws.repositoryIds.includes(repo.id));
        groupKey = containingWorkspace ? containingWorkspace.name : 'No Workspace';
        break;
      }
      default:
        groupKey = 'All';
      }

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      const groupRepos = groups.get(groupKey);
      if (groupRepos) {
        groupRepos.push(repo);
      }
    }

    // Create group tree items
    const groupItems: TreeItem[] = [];
    const sortedGroups = Array.from(groups.entries()).sort(([a], [b]) => {
      // Favorites first
      if (a === 'Favorites') return -1;
      if (b === 'Favorites') return 1;
      return a.localeCompare(b);
    });

    for (const [groupName, repos] of sortedGroups) {
      const groupItem = new TreeItem(
        `${groupName} (${repos.length})`,
        vscode.TreeItemCollapsibleState.Expanded
      );
      groupItem.contextValue = 'group';
      groupItem.iconPath = this.getGroupIcon(groupName);
      groupItem.tooltip = `${repos.length} repositories in ${groupName}`;

      // Store repositories for this group
      (groupItem as ExtendedTreeItem).repositories = repos;

      groupItems.push(groupItem);
    }

    return groupItems;
  }

  /**
   * Get repositories in a group
   */
  private getRepositoriesInGroup(groupItem: TreeItem): TreeItem[] {
    const repositories = (groupItem as ExtendedTreeItem).repositories || [];
    return repositories.map(repo => this.createRepositoryItem(repo));
  }

  /**
   * Create repository tree item
   */
  private createRepositoryItem(repository: Repository): TreeItem {
    const label = this.getRepositoryLabel(repository);
    const item = new TreeItem(label, vscode.TreeItemCollapsibleState.None);

    // Set properties
    item.contextValue = 'repository';
    item.tooltip = this.getRepositoryTooltip(repository);
    item.iconPath = this.getRepositoryIcon(repository);
    item.description = this.getRepositoryDescription(repository);

    // Store repository data
    (item as ExtendedTreeItem).repository = repository;

    // Set command for opening repository
    item.command = {
      command: 'reposManager.openRepository',
      title: 'Open Repository',
      arguments: [repository]
    };

    return item;
  }

  /**
   * Get repository label
   */
  private getRepositoryLabel(repository: Repository): string {
    // お気に入り状態はlabelではなくdescriptionで表示する
    return repository.name;
  }

  /**
   * Get repository description
   */
  private getRepositoryDescription(repository: Repository): string {
    const parts: string[] = [];

    // Language display
    if (repository.metadata.language) {
      parts.push(repository.metadata.language);
    }

    // Git status indicators
    const gitStatus: string[] = [];
    if (repository.gitInfo.hasUncommitted) {
      gitStatus.push('●'); // Uncommitted changes
    }

    // Add branch info if not main/master
    const branch = repository.gitInfo.currentBranch;
    if (branch && !['main', 'master'].includes(branch.toLowerCase())) {
      gitStatus.push(`[${branch}]`);
    }

    if (gitStatus.length > 0) {
      parts.push(gitStatus.join(' '));
    }

    // Last commit time - relative
    const lastCommit = repository.gitInfo.lastCommitDate;
    const now = new Date();
    const diffMs = now.getTime() - lastCommit.getTime();

    // Time constants for relative date calculation
    const msPerSecond = 1000; // Milliseconds per second
    const secondsPerMinute = 60; // Seconds per minute
    const minutesPerHour = 60; // Minutes per hour
    const hoursPerDay = 24; // Hours per day
    const msPerDay = msPerSecond * secondsPerMinute * minutesPerHour * hoursPerDay; // Milliseconds per day
    const daysPerWeek = 7; // Days per week
    const daysPerMonth = 30; // Approximate days per month
    const daysPerYear = 365; // Days per year

    const diffDays = Math.floor(diffMs / msPerDay);

    let timeStr = '';
    if (diffDays === 0) {
      timeStr = 'today';
    } else if (diffDays === 1) {
      timeStr = '1d ago';
    } else if (diffDays < daysPerWeek) {
      timeStr = `${diffDays}d ago`;
    } else if (diffDays < daysPerMonth) {
      const weeks = Math.floor(diffDays / daysPerWeek);
      timeStr = `${weeks}w ago`;
    } else if (diffDays < daysPerYear) {
      const months = Math.floor(diffDays / daysPerMonth);
      timeStr = `${months}mo ago`;
    } else {
      const years = Math.floor(diffDays / daysPerYear);
      timeStr = `${years}y ago`;
    }

    parts.push(timeStr);

    // お気に入り状態を最後に追加
    if (repository.isFavorite) {
      parts.push('⭐');
    }

    return parts.join(' • ');
  }

  /**
   * Get repository tooltip
   */
  private getRepositoryTooltip(repository: Repository): string {
    const lines: string[] = [
      `Path: ${repository.path}`,
      `Language: ${repository.metadata.language || 'Unknown'}`,
      `Branch: ${repository.gitInfo.currentBranch}`,
      `Last Commit: ${repository.gitInfo.lastCommitDate.toLocaleDateString()}`
    ];

    if (repository.gitInfo.remoteUrl) {
      lines.push(`Remote: ${repository.gitInfo.remoteUrl}`);
    }

    if (repository.gitInfo.hasUncommitted) {
      lines.push('Has uncommitted changes');
    }

    if (repository.tags.length > 0) {
      lines.push(`Tags: ${repository.tags.join(', ')}`);
    }

    return lines.join('\n');
  }

  /**
   * Get repository icon
   */
  private getRepositoryIcon(repository: Repository): vscode.ThemeIcon {
    // Language-specific icons with better variety
    const language = repository.metadata.language?.toLowerCase();
    const iconMap: Record<string, { icon: string; color?: string }> = {
      // Web technologies
      javascript: { icon: 'symbol-method', color: 'charts.yellow' },
      typescript: { icon: 'symbol-interface', color: 'charts.blue' },
      html: { icon: 'symbol-tag', color: 'charts.orange' },
      css: { icon: 'symbol-color', color: 'charts.purple' },
      scss: { icon: 'symbol-color', color: 'charts.purple' },
      sass: { icon: 'symbol-color', color: 'charts.purple' },
      vue: { icon: 'symbol-class', color: 'charts.green' },
      react: { icon: 'symbol-module', color: 'charts.blue' },
      angular: { icon: 'symbol-module', color: 'charts.red' },
      svelte: { icon: 'symbol-module', color: 'charts.orange' },

      // Backend languages
      python: { icon: 'symbol-snake', color: 'charts.green' },
      java: { icon: 'symbol-class', color: 'charts.orange' },
      csharp: { icon: 'symbol-class', color: 'charts.purple' },
      'c#': { icon: 'symbol-class', color: 'charts.purple' },
      cpp: { icon: 'symbol-struct', color: 'charts.blue' },
      'c++': { icon: 'symbol-struct', color: 'charts.blue' },
      c: { icon: 'symbol-struct', color: 'charts.blue' },
      php: { icon: 'symbol-variable', color: 'charts.purple' },
      ruby: { icon: 'symbol-property', color: 'charts.red' },
      go: { icon: 'symbol-function', color: 'charts.blue' },
      rust: { icon: 'symbol-operator', color: 'charts.orange' },
      swift: { icon: 'symbol-event', color: 'charts.orange' },
      kotlin: { icon: 'symbol-class', color: 'charts.purple' },
      scala: { icon: 'symbol-class', color: 'charts.red' },

      // Scripting and config
      shell: { icon: 'terminal', color: 'terminal.foreground' },
      bash: { icon: 'terminal', color: 'terminal.foreground' },
      powershell: { icon: 'terminal', color: 'charts.blue' },
      dockerfile: { icon: 'symbol-package', color: 'charts.blue' },
      yaml: { icon: 'symbol-file', color: 'charts.gray' },
      yml: { icon: 'symbol-file', color: 'charts.gray' },
      json: { icon: 'symbol-object', color: 'charts.yellow' },
      xml: { icon: 'symbol-tag', color: 'charts.orange' },

      // Mobile
      dart: { icon: 'symbol-misc', color: 'charts.blue' },

      // Data and ML
      r: { icon: 'graph', color: 'charts.blue' },
      matlab: { icon: 'graph', color: 'charts.orange' },

      // Other
      markdown: { icon: 'markdown', color: 'charts.gray' },
      text: { icon: 'symbol-text', color: 'charts.gray' }
    };

    const iconConfig = language && iconMap[language] ? iconMap[language] : { icon: 'repo', color: undefined };

    // Create base icon
    let icon: vscode.ThemeIcon;
    if (iconConfig.color) {
      icon = new vscode.ThemeIcon(iconConfig.icon, new vscode.ThemeColor(iconConfig.color));
    } else {
      icon = new vscode.ThemeIcon(iconConfig.icon);
    }

    // Add git status indicator color
    if (repository.gitInfo.hasUncommitted) {
      return new vscode.ThemeIcon(iconConfig.icon, new vscode.ThemeColor('gitDecoration.modifiedResourceForeground'));
    }

    return icon;
  }

  /**
   * Get group icon
   */
  private getGroupIcon(groupName: string): vscode.ThemeIcon {
    if (groupName === 'Favorites') {
      return new vscode.ThemeIcon('star-full', new vscode.ThemeColor('charts.yellow'));
    }

    // Language-specific group icons
    const languageIcons: Record<string, { icon: string; color: string }> = {
      javascript: { icon: 'symbol-method', color: 'charts.yellow' },
      typescript: { icon: 'symbol-interface', color: 'charts.blue' },
      python: { icon: 'symbol-snake', color: 'charts.green' },
      java: { icon: 'symbol-class', color: 'charts.orange' },
      csharp: { icon: 'symbol-class', color: 'charts.purple' },
      'c#': { icon: 'symbol-class', color: 'charts.purple' },
      react: { icon: 'symbol-module', color: 'charts.blue' },
      vue: { icon: 'symbol-class', color: 'charts.green' },
      angular: { icon: 'symbol-module', color: 'charts.red' },
      go: { icon: 'symbol-function', color: 'charts.blue' },
      rust: { icon: 'symbol-operator', color: 'charts.orange' },
      php: { icon: 'symbol-variable', color: 'charts.purple' },
      ruby: { icon: 'symbol-property', color: 'charts.red' }
    };

    const lowerGroupName = groupName.toLowerCase();
    if (languageIcons[lowerGroupName]) {
      const config = languageIcons[lowerGroupName];
      return new vscode.ThemeIcon(config.icon, new vscode.ThemeColor(config.color));
    }

    // Default folder icon for other groups
    return new vscode.ThemeIcon('folder', new vscode.ThemeColor('charts.gray'));
  }

  /**
   * Create loading item with spinning animation
   */
  private createLoadingItem(): TreeItem {
    const loadingItem = new TreeItem(
      '$(loading~spin) Loading repositories...',
      vscode.TreeItemCollapsibleState.None
    );
    loadingItem.contextValue = 'loading';
    loadingItem.tooltip = 'Scanning directories for repositories...';
    loadingItem.description = 'Please wait';

    return loadingItem;
  }

  /**
   * Create empty state item when no repositories found
   */
  private createEmptyStateItem(): TreeItem {
    const emptyItem = new TreeItem(
      '$(folder) No repositories found',
      vscode.TreeItemCollapsibleState.None
    );
    emptyItem.contextValue = 'empty';
    emptyItem.tooltip = 'No Git repositories found in your workspace folders.\nTry adding a folder or refresh to scan again.';
    emptyItem.description = 'Add folders to get started';
    emptyItem.iconPath = new vscode.ThemeIcon('folder-opened', new vscode.ThemeColor('disabledForeground'));

    return emptyItem;
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    this._onDidChangeTreeData.dispose();
  }
}

/**
 * Tree item class extending VS Code TreeItem
 */
export class TreeItem extends vscode.TreeItem {
  constructor(
    public override readonly label: string,
    public override readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
  }
}
