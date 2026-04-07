import { NextRequest, NextResponse } from 'next/server';
import { validateAction } from '@/lib/scope-engine';

export async function POST(req: NextRequest) {
  try {
    const { tokenId, action, userId } = await req.json();

    if (!tokenId || !action || !userId) {
      return NextResponse.json(
        { error: 'tokenId, action, and userId are required' },
        { status: 400 }
      );
    }

    const result = await validateAction(tokenId, action, userId);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
