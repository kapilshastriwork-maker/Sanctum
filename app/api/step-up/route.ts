import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ requests: [] });

  const { data } = await supabaseServer
    .from('step_up_requests')
    .select('*, agents(name, icon)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  return NextResponse.json({ requests: data || [] });
}

export async function POST(req: NextRequest) {
  try {
    const { agentId, agentName, action, reason, userId } = await req.json();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabaseServer
      .from('step_up_requests')
      .insert({
        user_id: userId,
        agent_id: agentId,
        action,
        reason,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    // Log the interception
    await supabaseServer.from('audit_events').insert({
      user_id: userId,
      agent_id: agentId,
      event_type: 'step_up_triggered',
      action: `HIGH-RISK ACTION INTERCEPTED: ${action}`,
      status: 'pending_approval',
    });

    return NextResponse.json({ request: data });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}