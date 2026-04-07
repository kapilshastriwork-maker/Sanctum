import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { agentId, agentName, userId } = await req.json();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: revokedTokens } = await supabaseServer
      .from('mission_tokens')
      .update({ 
        status: 'revoked',
        revoked_at: new Date().toISOString()
      })
      .eq('agent_id', agentId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .select();

    await supabaseServer
      .from('step_up_requests')
      .update({ 
        status: 'denied',
        resolved_at: new Date().toISOString()
      })
      .eq('agent_id', agentId)
      .eq('user_id', userId)
      .eq('status', 'pending');

    await supabaseServer.from('audit_events').insert({
      user_id: userId,
      agent_id: agentId,
      event_type: 'agent_access_revoked',
      action: `🚨 ALL ACCESS REVOKED for ${agentName} — ${revokedTokens?.length || 0} token(s) invalidated`,
      status: 'blocked',
    });

    return NextResponse.json({ 
      success: true, 
      revokedTokens: revokedTokens?.length || 0 
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}