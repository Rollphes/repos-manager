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
  private sortBy: 'lastModified' | 'name' | 'language' | 'favorite' =
    'lastModified'

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
   * Toggle group view mode
   */
  public toggleGroupView(): void {
    const modes: ('none' | 'language' | 'favorite')[] = [
      'none',
      'language',
      'favorite',
    ]
    const currentIndex = modes.indexOf(this.groupBy)
    const nextIndex = (currentIndex + 1) % modes.length
    this.groupBy = modes[nextIndex] ?? 'none'
    this.refresh()
  }

  /**
   * Get current group view mode
   */
  public getGroupViewMode(): string {
    switch (this.groupBy) {
      case 'none':
        return 'Flat view'
      case 'language':
        return 'Language groups'
      case 'favorite':
        return 'Favorites groups'
      default:
        return 'Unknown'
    }
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
      { label: 'All Languages', value: 'all' },
      { label: 'Favorites Only', value: 'favorites' },
      { label: 'Recently Modified', value: 'recent' },
      { label: 'JavaScript', value: 'JavaScript' },
      { label: 'TypeScript', value: 'TypeScript' },
      { label: 'Python', value: 'Python' },
      { label: 'Java', value: 'Java' },
      { label: 'C++', value: 'C++' },
      { label: 'Rust', value: 'Rust' },
      { label: 'Ruby', value: 'Ruby' },
      { label: 'PHP', value: 'PHP' },
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
   * Toggle sort order
   */
  public toggleSort(): void {
    const modes = ['lastModified', 'name', 'language', 'favorite'] as const
    const currentIndex = modes.indexOf(this.sortBy)
    const nextIndex = (currentIndex + 1) % modes.length
    this.sortBy = modes[nextIndex] ?? 'lastModified'
    this.refresh()
  }

  /**
   * Get current sort mode
   */
  public getSortMode(): string {
    switch (this.sortBy) {
      case 'lastModified':
        return 'Last modified'
      case 'name':
        return 'Name'
      case 'language':
        return 'Language'
      case 'favorite':
        return 'Favorites first'
      default:
        return 'Unknown'
    }
  }

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
   * Get sort configuration based on current sort mode
   */
  private getSortConfig(): {
    field: 'name' | 'language' | 'favorite' | 'updatedAt'
    order: 'asc' | 'desc'
  } {
    switch (this.sortBy) {
      case 'name':
        return { field: 'name', order: 'asc' }
      case 'language':
        return { field: 'language', order: 'asc' }
      case 'favorite':
        return { field: 'favorite', order: 'desc' }
      case 'lastModified':
      default:
        return { field: 'updatedAt', order: 'desc' }
    }
  }

  /**
   * Get root level items
   */
  private getRootItems(): TreeItem[] {
    // Show loading state
    if (this.isLoading) return [this.createLoadingItem()]

    // Get repositories, potentially filtered by active profile
    const sortConfig = this.getSortConfig()
    const repositories = this.repositoryManager.getRepositories(
      this.currentFilter,
      sortConfig,
    )

    console.warn('=== TREE DATA PROVIDER DEBUG ===')
    console.warn(`Total repositories: ${String(repositories.length)}`)
    console.warn(`Group by: ${this.groupBy}`)
    console.warn('Current filter:', this.currentFilter)

    if (repositories.length === 0) return this.createEmptyStateItem()

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

    // Determine context value based on Git status and favorite status
    let contextValue: string
    if (repository.gitInfo.remoteUrl) {
      // Git repository
      contextValue = isFavorite ? 'repositoryFavorite' : 'repository'
    } else {
      // Non-Git folder
      contextValue = isFavorite ? 'folderFavorite' : 'folder'
    }

    // Set properties
    item.contextValue = contextValue
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
    return repository.name
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

    // Highlight recent updates based on configuration
    const config = vscode.workspace.getConfiguration('reposManager')
    const highlightDays = config.get<number>(
      'display.highlightUpdatedWithinDays',
      7,
    )

    if (highlightDays > 0 && diffDays < highlightDays)
      timeStr = `Recent: ${timeStr}` // Recent updates indicator

    parts.push(timeStr)

    return parts.join(' • ')
  }

  /**
   * Get repository tooltip based on UI design specifications
   * @param repository
   */
  private getRepositoryTooltip(repository: Repository): string {
    const lines: string[] = []

    this.addTooltipHeader(lines, repository)
    this.addTooltipReadmeInfo(lines, repository)
    this.addTooltipGitInfo(lines, repository)
    this.addTooltipProjectSize(lines, repository)
    this.addTooltipTechInfo(lines, repository)
    this.addTooltipStatusInfo(lines, repository)
    this.addTooltipQualityInfo(lines, repository)
    this.addTooltipCommitInfo(lines, repository)
    this.addTooltipQuickActions(lines, repository)

    return lines.join('\n')
  }

  /**
   * Add header section to tooltip
   */
  private addTooltipHeader(lines: string[], repository: Repository): void {
    const lastCommitDate = repository.gitInfo.lastCommitDate
    const timeDiff = new Date().getTime() - lastCommitDate.getTime()
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
    const timeStr =
      daysDiff === 0
        ? 'today'
        : daysDiff === 1
          ? '1 day ago'
          : daysDiff < 7
            ? `${String(daysDiff)} days ago`
            : daysDiff < 30
              ? `${String(Math.floor(daysDiff / 7))} weeks ago`
              : daysDiff < 365
                ? `${String(Math.floor(daysDiff / 30))} months ago`
                : `${String(Math.floor(daysDiff / 365))} years ago`

    const headerIcon = daysDiff < 7 ? '$(flame)' : '$(folder)'
    lines.push(
      `${headerIcon} ${repository.name}                           ${daysDiff < 7 ? '$(flame) ' : '$(calendar) '}${timeStr}`,
    )
    lines.push(repository.path)
    lines.push('─'.repeat(65))
  }

  /**
   * Add README info to tooltip
   */
  private addTooltipReadmeInfo(lines: string[], repository: Repository): void {
    if (repository.metadata.readmeQuality.exists) {
      lines.push(
        `$(book) README: ${repository.displayName ?? 'Repository description'}`,
      )
    }
  }

  /**
   * Add Git info to tooltip
   */
  private addTooltipGitInfo(lines: string[], repository: Repository): void {
    const isGitRepository =
      !!repository.gitInfo.remoteUrl || !!repository.gitInfo.currentBranch
    if (isGitRepository) {
      let gitStatus = `🌿 ${repository.gitInfo.currentBranch}`
      if (repository.gitInfo.hasUncommitted)
        gitStatus += ' *uncommitted changes'
      if (repository.gitInfo.aheadBehind.ahead > 0)
        gitStatus += ` *${String(repository.gitInfo.aheadBehind.ahead)} commits ahead`
      lines.push(gitStatus)
    }
  }

  /**
   * Add project size info to tooltip
   */
  private addTooltipProjectSize(lines: string[], repository: Repository): void {
    const size = repository.metadata.projectSize
    lines.push(
      `📊 ${String(size.totalFiles)} files • ${String(size.codeFiles)} code files • ${this.formatFileSize(size.codeSize)}`,
    )
    lines.push('─'.repeat(65))
  }

  /**
   * Add technology info to tooltip
   */
  private addTooltipTechInfo(lines: string[], repository: Repository): void {
    const techInfo: string[] = []
    if (repository.metadata.language)
      techInfo.push(repository.metadata.language)
    if (repository.metadata.runtime) techInfo.push(repository.metadata.runtime)
    if (repository.metadata.license)
      techInfo.push(`${repository.metadata.license} License`)

    if (techInfo.length > 0) lines.push(`$(tag) ${techInfo.join('  ')}`)
  }

  /**
   * Add status info to tooltip
   */
  private addTooltipStatusInfo(lines: string[], repository: Repository): void {
    const statusInfo: string[] = []
    if (this.favoriteService.isFavorite(repository.path))
      statusInfo.push('$(star-full) In Favorites')
    if (repository.gitInfo.remoteUrl)
      statusInfo.push('$(link) GitHub Repository')
    else statusInfo.push('$(folder) Local Folder (Non-Git)')

    if (statusInfo.length > 0) lines.push(statusInfo.join(' • '))
    lines.push('─'.repeat(65))
  }

  /**
   * Add quality info to tooltip
   */
  private addTooltipQualityInfo(lines: string[], repository: Repository): void {
    const qualityInfo: string[] = []
    if (repository.metadata.hasTests) qualityInfo.push('npm test ✅')
    if (repository.metadata.hasCicd) qualityInfo.push('CI/CD ✅')
    if (repository.metadata.dependencies.length > 0) {
      qualityInfo.push(
        `Dependencies 📦 ${String(repository.metadata.dependencies.length)} packages`,
      )
    }

    if (qualityInfo.length > 0) lines.push(`🔧 ${qualityInfo.join(' • ')}`)
  }

  /**
   * Add commit info to tooltip
   */
  private addTooltipCommitInfo(lines: string[], repository: Repository): void {
    lines.push(
      `$(calendar) Last commit: ${repository.gitInfo.lastCommitDate.toLocaleDateString()}`,
    )
    lines.push('─'.repeat(65))
  }

  /**
   * Add quick actions to tooltip
   */
  private addTooltipQuickActions(
    lines: string[],
    repository: Repository,
  ): void {
    const quickActions: string[] = []
    if (repository.gitInfo.remoteUrl)
      quickActions.push('[$(globe) Open Homepage]')
    quickActions.push('[$(folder) Explorer]')
    quickActions.push('[$(terminal) Terminal]')
    quickActions.push('[$(sync) Update]')

    lines.push(quickActions.join(' '))
  }

  /**
   * Format file size in human readable format
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    const size = sizes[i]

    if (!size) return `${String(bytes)} B`

    return `${String(parseFloat((bytes / Math.pow(k, i)).toFixed(1)))} ${size}`
  }

  /**
   * Get repository icon based on type and favorite status (UI design compliant)
   */
  private getRepositoryIcon(repository: Repository): vscode.ThemeIcon {
    const isFavorite = this.favoriteService.isFavorite(repository.path)
    const isGitRepository =
      !!repository.gitInfo.remoteUrl || !!repository.gitInfo.currentBranch

    // For favorites, use star icon as per UI design
    if (isFavorite) {
      return new vscode.ThemeIcon(
        'star-full',
        new vscode.ThemeColor('charts.yellow'),
      )
    }

    // For non-Git folders, use folder icon
    if (!isGitRepository) return new vscode.ThemeIcon('folder')

    // For Git repositories, use source-repository icon
    // Add git status indicator color for uncommitted changes
    if (repository.gitInfo.hasUncommitted) {
      return new vscode.ThemeIcon(
        'source-repository',
        new vscode.ThemeColor('gitDecoration.modifiedResourceForeground'),
      )
    }

    return new vscode.ThemeIcon('source-repository')
  }

  /**
   * Get group icon
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
    }

    const iconConfig = languageIcons[groupName.toLowerCase()]
    if (iconConfig) {
      return new vscode.ThemeIcon(
        iconConfig.icon,
        new vscode.ThemeColor(iconConfig.color),
      )
    }

    // Default folder icon for other groups
    return new vscode.ThemeIcon('folder', new vscode.ThemeColor('charts.gray'))
  }

  /**
   * Create loading item
   */
  private createLoadingItem(): TreeItem {
    const loadingItem = new TreeItem(
      'Scanning repositories...',
      vscode.TreeItemCollapsibleState.None,
    )
    loadingItem.contextValue = 'loading'
    loadingItem.iconPath = new vscode.ThemeIcon(
      'sync~spin',
      new vscode.ThemeColor('progressBar.background'),
    )
    loadingItem.tooltip =
      'Scanning for Git repositories and analyzing project metadata...'

    return loadingItem
  }

  /**
   * Create empty state items
   */
  private createEmptyStateItem(): TreeItem[] {
    const emptyItem = new TreeItem(
      'No repositories found',
      vscode.TreeItemCollapsibleState.None,
    )
    emptyItem.contextValue = 'empty'
    emptyItem.description = 'Add folders to get started'
    emptyItem.iconPath = new vscode.ThemeIcon(
      'folder',
      new vscode.ThemeColor('descriptionForeground'),
    )
    emptyItem.tooltip =
      'No Git repositories found in your workspace folders.\nTry adding a folder or refresh to scan again.'

    // Auto-detect paths button
    const autoDetectItem = new TreeItem(
      'Auto-detect Paths',
      vscode.TreeItemCollapsibleState.None,
    )
    autoDetectItem.command = {
      command: 'reposManager.autoDetectPaths',
      title: 'Auto-detect Paths',
    }
    autoDetectItem.contextValue = 'autoDetect'
    autoDetectItem.iconPath = new vscode.ThemeIcon('search')
    autoDetectItem.tooltip = 'Automatically detect Git repository paths'

    // Add folder button
    const addFolderItem = new TreeItem(
      'Add Folder',
      vscode.TreeItemCollapsibleState.None,
    )
    addFolderItem.command = {
      command: 'reposManager.addFolder',
      title: 'Add Folder',
    }
    addFolderItem.contextValue = 'addFolder'
    addFolderItem.iconPath = new vscode.ThemeIcon('folder-opened')
    addFolderItem.tooltip = 'Add a folder to workspace'

    // Settings button
    const settingsItem = new TreeItem(
      'Settings',
      vscode.TreeItemCollapsibleState.None,
    )
    settingsItem.command = {
      command: 'reposManager.openSettings',
      title: 'Settings',
    }
    settingsItem.contextValue = 'settings'
    settingsItem.iconPath = new vscode.ThemeIcon('settings-gear')
    settingsItem.tooltip = 'Configure repository scanner settings'

    return [emptyItem, autoDetectItem, addFolderItem, settingsItem]
  }
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
