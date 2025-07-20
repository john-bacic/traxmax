import { NextResponse } from 'next/server';
import { getGitInfo } from '@/lib/git-info';

export async function GET() {
  try {
    const gitInfo = getGitInfo();
    
    return NextResponse.json({
      success: true,
      data: gitInfo
    });
  } catch (error) {
    console.error('Error getting Git info:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get Git information',
      data: {
        commit: 'unknown',
        branch: 'unknown'
      }
    }, { status: 500 });
  }
} 