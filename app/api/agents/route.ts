import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ agents: [] });

  const { data } = await supabaseServer
    .from('agents')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  return NextResponse.json({ agents: data || [] });
}

export async function POST(req: NextRequest) {
  try {
    const { name, description, icon, userId } = await req.json();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabaseServer
      .from('agents')
      .insert({
        user_id: userId,
        name,
        description,
        icon: icon || '🤖',
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    await supabaseServer.from('audit_events').insert({
      user_id: userId,
      agent_id: data.id,
      event_type: 'agent_registered',
      action: `Registered agent: ${name}`,
      status: 'success',
    });

    return NextResponse.json({ agent: data });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { agentId, userId } = await req.json();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await supabaseServer
      .from('agents')
      .update({ is_active: false })
      .eq('id', agentId)
      .eq('user_id', userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
