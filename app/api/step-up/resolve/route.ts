import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { requestId, decision, userId } = await req.json();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: request } = await supabaseServer
      .from('step_up_requests')
      .select('*, agents(name)')
      .eq('id', requestId)
      .single();

    await supabaseServer
      .from('step_up_requests')
      .update({
        status: decision,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .eq('user_id', userId);

    await supabaseServer.from('audit_events').insert({
      user_id: userId,
      agent_id: request?.agent_id,
      event_type: decision === 'approved' ? 'step_up_approved' : 'step_up_denied',
      action: `${decision === 'approved' ? '✅ APPROVED' : '🚫 DENIED'}: ${request?.action}`,
      status: decision === 'approved' ? 'success' : 'blocked',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}