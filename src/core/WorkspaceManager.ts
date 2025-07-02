import * as vscode from 'vscode';
import { Repository, Workspace, WorkspaceExport } from '../types';

/**
 * Internal workspace type for mutable operations
 */
interface MutableWorkspace {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  repositoryIds: string[];
  createdAt: Date;
  lastAccessedAt: Date;
  isActive: boolean;
  tags: string[];
}

/**
 * Workspace storage structure
 */
interface WorkspaceStorage {
  workspaces: Record<string, MutableWorkspace>;
  activeWorkspaceId?: string;
  lastModified: Date;
}

/**
 * Workspace Manager - Manages collections of repositories as workspaces
 */
export class WorkspaceManager {
  private readonly context: vscode.ExtensionContext;
  private readonly storageKey = 'reposManager.workspaces';
  private readonly workspaces: Map<string, MutableWorkspace> = new Map();
  private activeWorkspaceId?: string;

  // Event emitters
  private readonly _onDidChangeWorkspaces = new vscode.EventEmitter<void>();
  public readonly onDidChangeWorkspaces = this._onDidChangeWorkspaces.event;

  private readonly _onDidChangeActiveWorkspace = new vscode.EventEmitter<string | undefined>();
  public readonly onDidChangeActiveWorkspace = this._onDidChangeActiveWorkspace.event;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.loadWorkspaces();
  }

  /**
   * Create a new workspace
   */
  public async createWorkspace(
    name: string,
    repositoryIds: string[],
    options?: {
      description?: string;
      icon?: string;
      tags?: string[];
    }
  ): Promise<Workspace> {
    const id = this.generateWorkspaceId();
    const now = new Date();

    const workspace: MutableWorkspace = {
      id,
      name,
      description: options?.description,
      icon: options?.icon || '📁',
      repositoryIds: [...repositoryIds],
      createdAt: now,
      lastAccessedAt: now,
      isActive: false,
      tags: options?.tags || []
    };

    this.workspaces.set(id, workspace);
    await this.saveWorkspaces();
    this._onDidChangeWorkspaces.fire();

    return this.toReadonlyWorkspace(workspace);
  }

  /**
   * Delete a workspace
   */
  public async deleteWorkspace(id: string): Promise<void> {
    if (!this.workspaces.has(id)) {
      throw new Error(`Workspace with id ${id} not found`);
    }

    // If deleting active workspace, clear active state
    if (this.activeWorkspaceId === id) {
      this.activeWorkspaceId = undefined;
      this._onDidChangeActiveWorkspace.fire(undefined);
    }

    this.workspaces.delete(id);
    await this.saveWorkspaces();
    this._onDidChangeWorkspaces.fire();
  }

  /**
   * Switch to a different workspace
   */
  public async switchWorkspace(id: string): Promise<void> {
    if (!this.workspaces.has(id)) {
      throw new Error(`Workspace with id ${id} not found`);
    }

    // Update active workspace
    const previousActiveId = this.activeWorkspaceId;
    this.activeWorkspaceId = id;

    // Update workspace access times
    const workspace = this.workspaces.get(id);
    if (!workspace) {
      throw new Error(`Workspace with id ${id} not found during switch`);
    }

    workspace.lastAccessedAt = new Date();
    workspace.isActive = true;

    // Deactivate previous workspace
    if (previousActiveId && this.workspaces.has(previousActiveId)) {
      const previousWorkspace = this.workspaces.get(previousActiveId);
      if (previousWorkspace) {
        previousWorkspace.isActive = false;
      }
    }

    await this.saveWorkspaces();
    this._onDidChangeActiveWorkspace.fire(id);
    this._onDidChangeWorkspaces.fire();
  }

  /**
   * Get all workspaces
   */
  public getWorkspaces(): Workspace[] {
    return Array.from(this.workspaces.values())
      .sort((a, b) => b.lastAccessedAt.getTime() - a.lastAccessedAt.getTime())
      .map(w => this.toReadonlyWorkspace(w));
  }

  /**
   * Get workspace by ID
   */
  public getWorkspace(id: string): Workspace | undefined {
    const workspace = this.workspaces.get(id);
    return workspace ? this.toReadonlyWorkspace(workspace) : undefined;
  }

  /**
   * Get active workspace
   */
  public getActiveWorkspace(): Workspace | undefined {
    if (!this.activeWorkspaceId) {
      return undefined;
    }
    const workspace = this.workspaces.get(this.activeWorkspaceId);
    return workspace ? this.toReadonlyWorkspace(workspace) : undefined;
  }

  /**
   * Update workspace
   */
  public async updateWorkspace(
    id: string,
    updates: Partial<Pick<Workspace, 'name' | 'description' | 'icon' | 'repositoryIds' | 'tags'>>
  ): Promise<void> {
    const workspace = this.workspaces.get(id);
    if (!workspace) {
      throw new Error(`Workspace with id ${id} not found`);
    }

    Object.assign(workspace, updates);
    await this.saveWorkspaces();
    this._onDidChangeWorkspaces.fire();
  }

  /**
   * Add repository to workspace
   */
  public async addRepositoryToWorkspace(workspaceId: string, repositoryId: string): Promise<void> {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) {
      throw new Error(`Workspace with id ${workspaceId} not found`);
    }

    if (!workspace.repositoryIds.includes(repositoryId)) {
      workspace.repositoryIds.push(repositoryId);
      await this.saveWorkspaces();
      this._onDidChangeWorkspaces.fire();
    }
  }

  /**
   * Remove repository from workspace
   */
  public async removeRepositoryFromWorkspace(workspaceId: string, repositoryId: string): Promise<void> {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) {
      throw new Error(`Workspace with id ${workspaceId} not found`);
    }

    const index = workspace.repositoryIds.indexOf(repositoryId);
    if (index !== -1) {
      workspace.repositoryIds.splice(index, 1);
      await this.saveWorkspaces();
      this._onDidChangeWorkspaces.fire();
    }
  }

  /**
   * Export workspace to JSON
   */
  public async exportWorkspace(id: string, repositories: Repository[]): Promise<WorkspaceExport> {
    const workspace = this.workspaces.get(id);
    if (!workspace) {
      throw new Error(`Workspace with id ${id} not found`);
    }

    // Convert repository IDs to paths for portability
    const repositoryPaths = workspace.repositoryIds
      .map(repoId => repositories.find(r => r.id === repoId)?.path)
      .filter((path): path is string => path !== undefined);

    return {
      version: '1.0.0',
      workspace: {
        name: workspace.name,
        description: workspace.description,
        icon: workspace.icon,
        repositoryIds: [], // Will be remapped during import
        tags: workspace.tags
      },
      repositoryPaths
    };
  }

  /**
   * Import workspace from JSON
   */
  public async importWorkspace(
    data: WorkspaceExport,
    repositories: Repository[]
  ): Promise<Workspace> {
    // Map paths back to repository IDs
    const repositoryIds = data.repositoryPaths
      .map(path => repositories.find(r => r.path === path)?.id)
      .filter((id): id is string => id !== undefined);

    return this.createWorkspace(
      data.workspace.name,
      repositoryIds,
      {
        description: data.workspace.description,
        icon: data.workspace.icon,
        tags: [...data.workspace.tags]
      }
    );
  }

  /**
   * Clear active workspace
   */
  public async clearActiveWorkspace(): Promise<void> {
    if (this.activeWorkspaceId) {
      const workspace = this.workspaces.get(this.activeWorkspaceId);
      if (workspace) {
        workspace.isActive = false;
      }
      this.activeWorkspaceId = undefined;
      await this.saveWorkspaces();
      this._onDidChangeActiveWorkspace.fire(undefined);
      this._onDidChangeWorkspaces.fire();
    }
  }

  /**
   * Generate unique workspace ID
   */
  private generateWorkspaceId(): string {
    const baseNumber = 36; // Base for toString conversion
    const randomStringLength = 9; // Length of random string
    return `ws_${Date.now()}_${Math.random().toString(baseNumber).substr(2, randomStringLength)}`;
  }

  /**
   * Load workspaces from storage
   */
  private loadWorkspaces(): void {
    try {
      const stored = this.context.globalState.get<WorkspaceStorage>(this.storageKey);
      if (stored) {
        // Convert stored data to Map
        this.workspaces.clear();
        Object.entries(stored.workspaces).forEach(([id, workspace]) => {
          // Convert date strings back to Date objects
          workspace.createdAt = new Date(workspace.createdAt);
          workspace.lastAccessedAt = new Date(workspace.lastAccessedAt);
          this.workspaces.set(id, workspace);
        });

        this.activeWorkspaceId = stored.activeWorkspaceId;
      }
    } catch (error) {
      console.error('Failed to load workspaces from storage:', error);
      // Initialize with empty state
      this.workspaces.clear();
      this.activeWorkspaceId = undefined;
    }
  }

  /**
   * Save workspaces to storage
   */
  private async saveWorkspaces(): Promise<void> {
    try {
      const storage: WorkspaceStorage = {
        workspaces: Object.fromEntries(this.workspaces),
        activeWorkspaceId: this.activeWorkspaceId,
        lastModified: new Date()
      };

      await this.context.globalState.update(this.storageKey, storage);
    } catch (error) {
      console.error('Failed to save workspaces to storage:', error);
      throw new Error('Failed to save workspace data');
    }
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    this._onDidChangeWorkspaces.dispose();
    this._onDidChangeActiveWorkspace.dispose();
  }

  /**
   * Convert MutableWorkspace to readonly Workspace
   */
  private toReadonlyWorkspace(workspace: MutableWorkspace): Workspace {
    return {
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      icon: workspace.icon,
      repositoryIds: workspace.repositoryIds,
      createdAt: workspace.createdAt,
      lastAccessedAt: workspace.lastAccessedAt,
      isActive: workspace.isActive,
      tags: workspace.tags
    };
  }
}
