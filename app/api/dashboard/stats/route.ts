import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ 
        agents: 0, connectedServices: 0, 
        missionTokens: 0, auditEvents: 0 
      });
    }

    const [agents, services, tokens, events] = await Promise.all([
      supabaseServer
        .from('agents')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_active', true),
      supabaseServer
        .from('connected_services')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_active', true),
      supabaseServer
        .from('mission_tokens')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'active'),
      supabaseServer
        .from('audit_events')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
    ]);

    return NextResponse.json({
      agents: agents.count || 0,
      connectedServices: services.count || 0,
      missionTokens: tokens.count || 0,
      auditEvents: events.count || 0,
    });
  } catch (error) {
    return NextResponse.json({ 
      agents: 0, connectedServices: 0, 
      missionTokens: 0, auditEvents: 0 
    });
  }
}
