import { RepositoryManager } from '@core/RepositoryManager'
import { FavoriteService } from '@services/FavoriteService'
import { Repository, RepositoryFilter } from '@types'
import * as vscode from 'vscode'

interface ExtendedTreeItem extends vscode.TreeItem {
  repositories?: Repository[]
  repository?: Repository
}

/**
 * Tree data provider for the Repos Manager view
 */
export class ReposManagerProvider implements vscode.TreeDataProvider<TreeItem> {
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<
    TreeItem | TreeItem[] | undefined | null
  >()
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public readonly onDidChangeTreeData = this._onDidChangeTreeData.event

  private currentFilter: RepositoryFilter = {}
  private groupBy: 'none' | 'language' | 'favorite' = 'none'
  private isLoading = false

  constructor(
    private readonly repositoryManager: RepositoryManager,
    private readonly favoriteService: FavoriteService,
  ) {
    // Listen for repository changes
    this.repositoryManager.onDidChangeRepositoriesEvent(() => {
      this.setLoading(false)
      this.refresh()
    })

    // Listen for favorite changes
    this.favoriteService.onDidChangeFavoritesEvent(() => {
      this.refresh()
    })
  }

  /**
   * Set loading state
   * @param isLoading
   */
  public setLoading(isLoading: boolean): void {
    this.isLoading = isLoading
    this.refresh()
  }

  /**
   * Refresh the tree view
   */
  public refresh(): void {
    this._onDidChangeTreeData.fire(undefined)
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    this._onDidChangeTreeData.dispose()
  }

  /**
   * Set filter for repositories
   * @param filter
   */
  public setFilter(filter: RepositoryFilter): void {
    this.currentFilter = filter
    this.refresh()
  }

  /**
   * Set grouping mode
   * @param groupBy
   */
  public setGroupBy(groupBy: 'none' | 'language' | 'favorite'): void {
    this.groupBy = groupBy
    this.refresh()
  }

  /**
   * Clear all filters
   */
  public clearFilters(): void {
    this.currentFilter = {}
    this.refresh()
  }

  /**
   * Show search dialog
   */
  public async showSearchDialog(): Promise<void> {
    const searchText = await vscode.window.showInputBox({
      prompt: 'Search repositories by name',
      placeHolder: 'Enter search term...',
    })

    if (searchText !== undefined) this.setFilter({ name: searchText })
  }

  /**
   * Show filter dialog
   */
  public async showFilterDialog(): Promise<void> {
    const filterOptions = [
      { label: '🗂️ All Languages', value: 'all' },
      { label: '⭐ Favorites Only', value: 'favorites' },
      { label: '📅 Recently Modified', value: 'recent' },
      { label: '🌟 JavaScript', value: 'JavaScript' },
      { label: '🔷 TypeScript', value: 'TypeScript' },
      { label: '🐍 Python', value: 'Python' },
      { label: '☕ Java', value: 'Java' },
      { label: '⚡ C++', value: 'C++' },
      { label: '🦀 Rust', value: 'Rust' },
      { label: '💎 Ruby', value: 'Ruby' },
      { label: '🐘 PHP', value: 'PHP' },
      { label: '🔵 Go', value: 'Go' },
      { label: '💜 C#', value: 'C#' },
    ]

    const selectedOption = await vscode.window.showQuickPick(filterOptions, {
      placeHolder: 'Select filter criteria',
    })

    if (selectedOption) {
      switch (selectedOption.value) {
        case 'all': {
          this.clearFilters()
          break
        }
        case 'favorites': {
          this.setFilter({ isFavorite: true })
          break
        }
        case 'recent': {
          const oneWeekAgo = new Date()
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
          this.setFilter({ lastModifiedAfter: oneWeekAgo })
          break
        }
        default: {
          this.setFilter({ language: selectedOption.value })
          break
        }
      }
    }
  }

  /**
   * Set filter profile view mode
   * @param showProfiles
   */
  /**
   * Get tree item representation
   * @param element
   */
  public getTreeItem(element: TreeItem): vscode.TreeItem {
    return element
  }

  /**
   * Get children for tree item
   * @param element
   */
  public getChildren(element?: TreeItem): Promise<TreeItem[]> {
    if (!element) {
      // Root level - show groups or repositories
      return Promise.resolve(this.getRootItems())
    }

    if (element.contextValue === 'group') {
      // Group level - show repositories in group
      return Promise.resolve(this.getRepositoriesInGroup(element))
    }

    // Repository level - no children
    return Promise.resolve([])
  }

  /**
   * Get root level items
   */
  private getRootItems(): TreeItem[] {
    // Show loading state
    if (this.isLoading) return [this.createLoadingItem()]

    // Get repositories, potentially filtered by active profile
    const repositories = this.repositoryManager.getRepositories(
      this.currentFilter,
      { field: 'name', order: 'asc' },
    )

    console.warn('=== TREE DATA PROVIDER DEBUG ===')
    console.warn(`Total repositories: ${String(repositories.length)}`)
    console.warn(`Group by: ${this.groupBy}`)
    console.warn('Current filter:', this.currentFilter)

    if (repositories.length === 0) return [this.createEmptyStateItem()]

    if (this.groupBy === 'none') {
      const items = repositories.map((repo) => this.createRepositoryItem(repo))
      console.warn(`Created ${String(items.length)} repository items`)
      return items
    }

    const groupItems = this.createGroupItems(repositories)
    console.warn(`Created ${String(groupItems.length)} group items`)
    return groupItems
  }

  /**
   * Create group items
   * @param repositories
   */
  private createGroupItems(repositories: Repository[]): TreeItem[] {
    const groups = new Map<string, Repository[]>()

    // Group repositories
    for (const repo of repositories) {
      let groupKey: string

      switch (this.groupBy) {
        case 'language':
          groupKey = repo.metadata.language || 'Unknown'
          break
        case 'favorite':
          groupKey = repo.isFavorite ? 'Favorites' : 'Other'
          break
        default:
          groupKey = 'Unknown'
          break
      }

      if (!groups.has(groupKey)) groups.set(groupKey, [])

      const groupRepos = groups.get(groupKey)
      if (groupRepos) groupRepos.push(repo)
    }

    // Create group tree items
    const groupItems: TreeItem[] = []
    const sortedGroups = Array.from(groups.entries()).sort(([a], [b]) => {
      // Favorites first
      if (a === 'Favorites') return -1
      if (b === 'Favorites') return 1
      return a.localeCompare(b)
    })

    for (const [groupName, repos] of sortedGroups) {
      const groupItem = new TreeItem(
        `${groupName} (${String(repos.length)})`,
        vscode.TreeItemCollapsibleState.Expanded,
      )
      groupItem.contextValue = 'group'
      groupItem.iconPath = this.getGroupIcon(groupName)
      groupItem.tooltip = `${String(repos.length)} repositories in ${groupName}`

      // Store repositories for this group
      ;(groupItem as ExtendedTreeItem).repositories = repos

      groupItems.push(groupItem)
    }

    return groupItems
  }

  /**
   * Get repositories in a group
   * @param groupItem
   */
  private getRepositoriesInGroup(groupItem: TreeItem): TreeItem[] {
    const repositories = (groupItem as ExtendedTreeItem).repositories ?? []
    return repositories.map((repo) => this.createRepositoryItem(repo))
  }

  /**
   * Create repository tree item
   * @param repository
   */
  private createRepositoryItem(repository: Repository): TreeItem {
    const label = this.getRepositoryLabel(repository)
    const item = new TreeItem(label, vscode.TreeItemCollapsibleState.None)

    // Check if repository is favorite
    const isFavorite = this.favoriteService.isFavorite(repository.path)

    // Set properties
    item.contextValue = isFavorite ? 'repositoryFavorite' : 'repository'
    item.tooltip = this.getRepositoryTooltip(repository)
    item.iconPath = this.getRepositoryIcon(repository)
    item.description = this.getRepositoryDescription(repository)

    // Set color based on Git status
    if (repository.gitInfo.hasUncommitted)
      item.resourceUri = vscode.Uri.file(repository.path)
      // Use Git decorations - VS Code will automatically apply colors

      // Store repository data
    ;(item as ExtendedTreeItem).repository = repository

    // Set command for opening repository
    item.command = {
      command: 'reposManager.openRepository',
      title: 'Open Repository',
      arguments: [repository],
    }

    return item
  }

  /**
   * Get repository label
   * @param repository
   */
  private getRepositoryLabel(repository: Repository): string {
    const isFavorite = this.favoriteService.isFavorite(repository.path)
    return isFavorite ? `⭐ ${repository.name}` : repository.name
  }

  /**
   * Get repository description
   * @param repository
   */
  private getRepositoryDescription(repository: Repository): string {
    const parts: string[] = []

    // Language display
    if (repository.metadata.language) parts.push(repository.metadata.language)

    // Git status indicators
    const gitStatus: string[] = []
    if (repository.gitInfo.hasUncommitted) gitStatus.push('●') // Uncommitted changes

    // Add branch info if not main/master
    const branch = repository.gitInfo.currentBranch
    if (branch && !['main', 'master'].includes(branch.toLowerCase()))
      gitStatus.push(`[${branch}]`)

    if (gitStatus.length > 0) parts.push(gitStatus.join(' '))

    // Last commit time - relative
    const lastCommit = repository.gitInfo.lastCommitDate
    const now = new Date()
    const diffMs = now.getTime() - lastCommit.getTime()

    // Time constants for relative date calculation
    const msPerSecond = 1000 // Milliseconds per second
    const secondsPerMinute = 60 // Seconds per minute
    const minutesPerHour = 60 // Minutes per hour
    const hoursPerDay = 24 // Hours per day
    const msPerDay =
      msPerSecond * secondsPerMinute * minutesPerHour * hoursPerDay // Milliseconds per day
    const daysPerWeek = 7 // Days per week
    const daysPerMonth = 30 // Approximate days per month
    const daysPerYear = 365 // Days per year

    const diffDays = Math.floor(diffMs / msPerDay)

    let timeStr = ''
    if (diffDays === 0) {
      timeStr = 'today'
    } else if (diffDays === 1) {
      timeStr = '1d ago'
    } else if (diffDays < daysPerWeek) {
      timeStr = `${String(diffDays)}d ago`
    } else if (diffDays < daysPerMonth) {
      const weeks = Math.floor(diffDays / daysPerWeek)
      timeStr = `${String(weeks)}w ago`
    } else if (diffDays < daysPerYear) {
      const months = Math.floor(diffDays / daysPerMonth)
      timeStr = `${String(months)}mo ago`
    } else {
      const years = Math.floor(diffDays / daysPerYear)
      timeStr = `${String(years)}y ago`
    }

    // Highlight recent updates (within 1 week)
    if (diffDays < daysPerWeek) timeStr = `🔥 ${timeStr}` // Fire emoji for recent updates

    parts.push(timeStr)

    return parts.join(' • ')
  }

  /**
   * Get repository tooltip
   * @param repository
   */
  private getRepositoryTooltip(repository: Repository): string {
    const lines: string[] = [
      `Path: ${repository.path}`,
      `Language: ${repository.metadata.language || 'Unknown'}`,
      `Branch: ${repository.gitInfo.currentBranch}`,
      `Last Commit: ${repository.gitInfo.lastCommitDate.toLocaleDateString()}`,
    ]

    if (repository.gitInfo.remoteUrl)
      lines.push(`Remote: ${repository.gitInfo.remoteUrl}`)

    if (repository.gitInfo.hasUncommitted) lines.push('Has uncommitted changes')

    if (repository.tags.length > 0)
      lines.push(`Tags: ${repository.tags.join(', ')}`)

    return lines.join('\n')
  }

  /**
   * Get repository icon
   * @param repository
   */
  private getRepositoryIcon(repository: Repository): vscode.ThemeIcon {
    // Language-specific icons with better variety
    const language = repository.metadata.language.toLowerCase()
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
      text: { icon: 'symbol-text', color: 'charts.gray' },
    }

    const iconConfig =
      language && iconMap[language]
        ? iconMap[language]
        : { icon: 'repo', color: undefined }

    // Create base icon
    let icon: vscode.ThemeIcon
    if (iconConfig.color) {
      icon = new vscode.ThemeIcon(
        iconConfig.icon,
        new vscode.ThemeColor(iconConfig.color),
      )
    } else {
      icon = new vscode.ThemeIcon(iconConfig.icon)
    }

    // Add git status indicator color
    if (repository.gitInfo.hasUncommitted) {
      return new vscode.ThemeIcon(
        iconConfig.icon,
        new vscode.ThemeColor('gitDecoration.modifiedResourceForeground'),
      )
    }

    return icon
  }

  /**
   * Get group icon
   * @param groupName
   */
  private getGroupIcon(groupName: string): vscode.ThemeIcon {
    if (groupName === 'Favorites') {
      return new vscode.ThemeIcon(
        'star-full',
        new vscode.ThemeColor('charts.yellow'),
      )
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
      ruby: { icon: 'symbol-property', color: 'charts.red' },
    }

    const lowerGroupName = groupName.toLowerCase()
    if (languageIcons[lowerGroupName]) {
      const config = languageIcons[lowerGroupName]
      return new vscode.ThemeIcon(
        config.icon,
        new vscode.ThemeColor(config.color),
      )
    }

    // Default folder icon for other groups
    return new vscode.ThemeIcon('folder', new vscode.ThemeColor('charts.gray'))
  }

  /**
   * Create loading item with spinning animation
   */
  private createLoadingItem(): TreeItem {
    const loadingItem = new TreeItem(
      '$(sync~spin) Scanning repositories...',
      vscode.TreeItemCollapsibleState.None,
    )
    loadingItem.contextValue = 'loading'
    loadingItem.tooltip =
      'Analyzing directory structure and Git repositories...'
    loadingItem.description = '$(loading~spin) Please wait...'
    loadingItem.iconPath = new vscode.ThemeIcon(
      'sync~spin',
      new vscode.ThemeColor('progressBar.background'),
    )

    return loadingItem
  }

  /**
   * Create empty state item when no repositories found
   */
  private createEmptyStateItem(): TreeItem {
    const emptyItem = new TreeItem(
      '$(folder) No repositories found',
      vscode.TreeItemCollapsibleState.None,
    )
    emptyItem.contextValue = 'empty'
    emptyItem.tooltip =
      'No Git repositories found in your workspace folders.\nTry adding a folder or refresh to scan again.'
    emptyItem.description = 'Add folders to get started'
    emptyItem.iconPath = new vscode.ThemeIcon(
      'folder-opened',
      new vscode.ThemeColor('disabledForeground'),
    )

    return emptyItem
  }

  /**
   * Apply filter profile to repositories
   * @param repositories
   * @param profile
   */
}

/**
 * Tree item class extending VS Code TreeItem
 */
export class TreeItem extends vscode.TreeItem {
  constructor(
    public override readonly label: string,
    public override readonly collapsibleState: vscode.TreeItemCollapsibleState,
  ) {
    super(label, collapsibleState)
  }
}
