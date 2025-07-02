import * as path from 'path';
import * as fs from 'fs/promises';
import { GitInfo, AheadBehind, RepositoryOwner } from '../types';

/**
 * Git service for repository information retrieval
 */
export class GitService {

  /**
   * Get git information for a repository
   */
  public async getGitInfo(repositoryPath: string): Promise<GitInfo> {
    try {
      const [
        remoteUrl,
        currentBranch,
        branches,
        lastCommitDate,
        hasUncommitted,
        aheadBehind,
        owner
      ] = await Promise.all([
        this.getRemoteUrl(repositoryPath),
        this.getCurrentBranch(repositoryPath),
        this.getBranches(repositoryPath),
        this.getLastCommitDate(repositoryPath),
        this.hasUncommittedChanges(repositoryPath),
        this.getAheadBehind(repositoryPath),
        this.getRepositoryOwner(repositoryPath)
      ]);

      const isFork = await this.isFork(repositoryPath, remoteUrl);

      return {
        ...(remoteUrl && { remoteUrl }),
        currentBranch,
        totalBranches: branches.length,
        lastCommitDate,
        hasUncommitted,
        aheadBehind,
        isFork,
        owner
      };

    } catch (error) {
      console.warn(`Failed to get git info for ${repositoryPath}:`, error);

      // Return minimal git info
      return {
        currentBranch: 'unknown',
        totalBranches: 0,
        lastCommitDate: new Date(0),
        hasUncommitted: false,
        aheadBehind: { ahead: 0, behind: 0 },
        isFork: false,
        owner: 'self'
      };
    }
  }

  /**
   * Execute git command and return output
   */
  private async executeGitCommand(repositoryPath: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const cp = require('child_process');

      cp.exec(
        `git ${args.join(' ')}`,
        {
          cwd: repositoryPath,
          encoding: 'utf8',
          timeout: 10000 // 10 seconds timeout
        },
        (error: Error | null, stdout: string, stderr: string) => {
          if (error) {
            reject(new Error(`Git command failed: ${error.message}`));
            return;
          }

          if (stderr && !stdout) {
            reject(new Error(`Git command stderr: ${stderr}`));
            return;
          }

          resolve(stdout.trim());
        }
      );
    });
  }

  /**
   * Get remote URL
   */
  private async getRemoteUrl(repositoryPath: string): Promise<string | undefined> {
    try {
      const output = await this.executeGitCommand(repositoryPath, ['remote', 'get-url', 'origin']);
      return output || undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Get current branch
   */
  private async getCurrentBranch(repositoryPath: string): Promise<string> {
    try {
      const output = await this.executeGitCommand(repositoryPath, ['branch', '--show-current']);
      return output || 'HEAD';
    } catch {
      return 'HEAD';
    }
  }

  /**
   * Get all branches
   */
  private async getBranches(repositoryPath: string): Promise<string[]> {
    try {
      const output = await this.executeGitCommand(repositoryPath, ['branch', '-a']);
      return output
        .split('\n')
        .map(line => line.replace(/^\*?\s*/, '').trim())
        .filter(branch => branch && !branch.startsWith('remotes/origin/HEAD'));
    } catch {
      return [];
    }
  }

  /**
   * Get last commit date
   */
  private async getLastCommitDate(repositoryPath: string): Promise<Date> {
    try {
      const output = await this.executeGitCommand(repositoryPath, ['log', '-1', '--format=%ci']);
      return output ? new Date(output) : new Date(0);
    } catch {
      return new Date(0);
    }
  }

  /**
   * Check for uncommitted changes
   */
  private async hasUncommittedChanges(repositoryPath: string): Promise<boolean> {
    try {
      const output = await this.executeGitCommand(repositoryPath, ['status', '--porcelain']);
      return output.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Get ahead/behind information
   */
  private async getAheadBehind(repositoryPath: string): Promise<AheadBehind> {
    try {
      const output = await this.executeGitCommand(repositoryPath, ['rev-list', '--count', '--left-right', 'HEAD...@{upstream}']);
      const [ahead, behind] = output.split('\t').map(n => parseInt(n, 10) || 0);
      return { ahead: ahead || 0, behind: behind || 0 };
    } catch {
      return { ahead: 0, behind: 0 };
    }
  }

  /**
   * Check if repository is a fork
   */
  private async isFork(repositoryPath: string, remoteUrl?: string): Promise<boolean> {
    if (!remoteUrl) {
      return false;
    }

    try {
      // Check if there's an upstream remote
      const output = await this.executeGitCommand(repositoryPath, ['remote']);
      const remotes = output.split('\n').map(r => r.trim());
      return remotes.includes('upstream');
    } catch {
      return false;
    }
  }

  /**
   * Get repository owner information
   */
  private async getRepositoryOwner(repositoryPath: string): Promise<RepositoryOwner> {
    try {
      const remoteUrl = await this.getRemoteUrl(repositoryPath);

      if (!remoteUrl) {
        return 'self';
      }

      // Parse GitHub/GitLab URLs
      const match = remoteUrl.match(/github\.com[:/]([^/]+)\/|gitlab\.com[:/]([^/]+)\//);
      if (match) {
        const ownerName = match[1] || match[2];
        if (ownerName) {
          return {
            name: ownerName,
            url: this.getOwnerUrl(remoteUrl, ownerName)
          };
        }
      }

      return 'self';
    } catch {
      return 'self';
    }
  }

  /**
   * Get owner URL from remote URL
   */
  private getOwnerUrl(remoteUrl: string, ownerName: string): string | undefined {
    if (remoteUrl.includes('github.com')) {
      return `https://github.com/${ownerName}`;
    }

    if (remoteUrl.includes('gitlab.com')) {
      return `https://gitlab.com/${ownerName}`;
    }

    return undefined;
  }

  /**
   * Check if path is a git repository
   */
  public async isGitRepository(repositoryPath: string): Promise<boolean> {
    try {
      const gitPath = path.join(repositoryPath, '.git');
      const stats = await fs.stat(gitPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Get git status summary
   */
  public async getStatusSummary(repositoryPath: string): Promise<GitStatusSummary> {
    try {
      const output = await this.executeGitCommand(repositoryPath, ['status', '--porcelain']);
      const lines = output.split('\n').filter(line => line.trim());

      let added = 0;
      let modified = 0;
      let deleted = 0;
      let untracked = 0;

      for (const line of lines) {
        const status = line.substring(0, 2);

        if (status.includes('A')) {
          added++;
        } else if (status.includes('M')) {
          modified++;
        } else if (status.includes('D')) {
          deleted++;
        } else if (status.includes('??')) {
          untracked++;
        }
      }

      return {
        added,
        modified,
        deleted,
        untracked,
        total: lines.length
      };

    } catch {
      return {
        added: 0,
        modified: 0,
        deleted: 0,
        untracked: 0,
        total: 0
      };
    }
  }

  /**
   * Get recent commits
   */
  public async getRecentCommits(repositoryPath: string, count = 10): Promise<GitCommit[]> {
    try {
      const output = await this.executeGitCommand(repositoryPath, [
        'log',
        `--max-count=${count}`,
        '--format=%H|%s|%an|%ae|%ci'
      ]);

      return output.split('\n')
        .filter(line => line.trim())
        .map(line => {
          const [hash, subject, authorName, authorEmail, date] = line.split('|');
          return {
            hash: hash || '',
            subject: subject || '',
            author: {
              name: authorName || '',
              email: authorEmail || ''
            },
            date: date ? new Date(date) : new Date()
          };
        });

    } catch {
      return [];
    }
  }
}

/**
 * Git status summary interface
 */
export interface GitStatusSummary {
  readonly added: number;
  readonly modified: number;
  readonly deleted: number;
  readonly untracked: number;
  readonly total: number;
}

/**
 * Git commit interface
 */
export interface GitCommit {
  readonly hash: string;
  readonly subject: string;
  readonly author: {
    readonly name: string;
    readonly email: string;
  };
  readonly date: Date;
}
