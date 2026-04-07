import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { nanoid } from 'nanoid';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ tokens: [] });

  const { data } = await supabaseServer
    .from('mission_tokens')
    .select('*, agents(name, icon)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  return NextResponse.json({ tokens: data || [] });
}

export async function POST(req: NextRequest) {
  try {
    const { 
      agentId, agentName, serviceName, scopes, purpose, userId, 
      expiresInMinutes, mandateName, maxActionsPerHour, forbiddenKeywords,
      domainWhitelist, autoRevokeOnViolation, constraintSummary
    } = await req.json();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const expiresAt = new Date(Date.now() + (expiresInMinutes || 60) * 60 * 1000);
    const tokenId = nanoid(16);

    const { data, error } = await supabaseServer
      .from('mission_tokens')
      .insert({
        id: tokenId,
        user_id: userId,
        agent_id: agentId,
        service_name: serviceName,
        scopes: scopes,
        purpose: purpose,
        status: 'active',
        expires_at: expiresAt.toISOString(),
        mandate_name: mandateName || null,
        max_actions_per_hour: maxActionsPerHour || 0,
        forbidden_keywords: forbiddenKeywords || [],
        domain_whitelist: domainWhitelist || [],
        auto_revoke_on_violation: autoRevokeOnViolation || false,
        constraint_summary: constraintSummary || null,
      })
      .select()
      .single();

    if (error) throw error;

    await supabaseServer.from('audit_events').insert({
      user_id: userId,
      agent_id: agentId,
      mission_token_id: tokenId,
      event_type: 'mission_token_issued',
      service_name: serviceName,
      action: `Mission token issued to ${agentName} for: ${purpose}`,
      scope_used: scopes.join(', '),
      status: 'success',
    });

    return NextResponse.json({ token: data });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}