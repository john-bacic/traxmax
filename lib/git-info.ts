import { execSync } from 'child_process';

export function getGitCommitHash(): string {
  try {
    // Try to get the current commit hash
    const hash = execSync('git rev-parse --short HEAD', { 
      encoding: 'utf8',
      cwd: process.cwd()
    }).trim();
    return hash;
  } catch (error) {
    console.warn('Could not get Git commit hash:', error);
    return 'unknown';
  }
}

export function getGitBranch(): string {
  try {
    // Try to get the current branch name
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { 
      encoding: 'utf8',
      cwd: process.cwd()
    }).trim();
    return branch;
  } catch (error) {
    console.warn('Could not get Git branch:', error);
    return 'unknown';
  }
}

export function getGitInfo() {
  return {
    commit: getGitCommitHash(),
    branch: getGitBranch()
  };
} 