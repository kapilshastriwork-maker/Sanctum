import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { tokenId, userId } = await req.json();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { error } = await supabaseServer
      .from('mission_tokens')
      .update({ 
        status: 'revoked',
        revoked_at: new Date().toISOString()
      })
      .eq('id', tokenId)
      .eq('user_id', userId);

    if (error) throw error;

    // Log revocation
    await supabaseServer.from('audit_events').insert({
      user_id: userId,
      mission_token_id: tokenId,
      event_type: 'mission_token_revoked',
      action: 'Mission token manually revoked by user',
      status: 'success',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}