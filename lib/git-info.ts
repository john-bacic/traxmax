import { execSync } from 'child_process';

export function getGitCommitHash(): string {
  // Try Vercel environment variables
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7); // Short hash like git rev-parse --short
  }
  
  // Try other common CI environment variables
  if (process.env.GITHUB_SHA) {
    return process.env.GITHUB_SHA.slice(0, 7);
  }
  
  // Fallback to local git command (for development)
  try {
    const hash = execSync('git rev-parse --short HEAD', { 
      encoding: 'utf8',
      cwd: process.cwd()
    }).trim();
    return hash;
  } catch (error) {
    console.warn('Could not get Git commit hash:', error);
    return 'dev-local';
  }
}

export function getGitBranch(): string {
  // Try Vercel environment variables
  if (process.env.VERCEL_GIT_COMMIT_REF) {
    return process.env.VERCEL_GIT_COMMIT_REF;
  }
  
  // Try other common CI environment variables
  if (process.env.GITHUB_REF_NAME) {
    return process.env.GITHUB_REF_NAME;
  }
  
  if (process.env.GITHUB_HEAD_REF) {
    return process.env.GITHUB_HEAD_REF;
  }
  
  // Fallback to local git command (for development)
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { 
      encoding: 'utf8',
      cwd: process.cwd()
    }).trim();
    return branch;
  } catch (error) {
    console.warn('Could not get Git branch:', error);
    return 'dev-local';
  }
}

export function getGitInfo() {
  const commit = getGitCommitHash();
  const branch = getGitBranch();
  
  console.log('Git info:', { commit, branch });
  console.log('Available env vars:', {
    VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 10) + '...',
    VERCEL_GIT_COMMIT_REF: process.env.VERCEL_GIT_COMMIT_REF,
    GITHUB_SHA: process.env.GITHUB_SHA?.slice(0, 10) + '...',
    GITHUB_REF_NAME: process.env.GITHUB_REF_NAME,
    GITHUB_HEAD_REF: process.env.GITHUB_HEAD_REF,
    NODE_ENV: process.env.NODE_ENV
  });
  
  return {
    commit,
    branch
  };
} 