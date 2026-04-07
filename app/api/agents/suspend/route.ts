import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { agentId, agentName, reason, userId } = await req.json();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await supabaseServer
      .from('agents')
      .update({
        identity_status: 'suspended',
        suspended_at: new Date().toISOString(),
        suspension_reason: reason || 'Manually suspended',
      })
      .eq('id', agentId)
      .eq('user_id', userId);

    await supabaseServer.from('audit_events').insert({
      user_id: userId,
      agent_id: agentId,
      event_type: 'agent_suspended',
      action: `🔴 AGENT SUSPENDED: ${agentName} — ${reason || 'Manually suspended'}`,
      status: 'blocked',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
