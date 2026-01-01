import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ErrorCode } from '@glint/types';

// Logout is handled locally (clear Supabase session)
// No need to proxy to backend
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.INTERNAL_ERROR,
            message: 'Failed to logout',
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  } catch (error) {
    console.error('POST /api/v1/auth/logout error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: 'Internal server error',
        },
      },
      { status: 500 }
    );
  }
}
