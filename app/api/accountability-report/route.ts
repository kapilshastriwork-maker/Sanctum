import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  const agentId = req.nextUrl.searchParams.get('agentId');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: agent } = await supabaseServer
    .from('agents')
    .select('*')
    .eq('id', agentId)
    .eq('user_id', userId)
    .single();

  const { data: tokens } = await supabaseServer
    .from('mission_tokens')
    .select('*')
    .eq('agent_id', agentId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  const { data: events } = await supabaseServer
    .from('audit_events')
    .select('*')
    .eq('agent_id', agentId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  const violations = (events || []).filter(e => e.event_type === 'mandate_violation');
  const autoRevocations = (events || []).filter(e => e.event_type === 'mandate_auto_revoked');
  const allowedActions = (events || []).filter(e => e.event_type === 'mandate_action_allowed');
  const stepUpBlocked = (events || []).filter(e => e.event_type === 'step_up_triggered');

  const verdictLines: string[] = [];
  if (violations.length === 0 && autoRevocations.length === 0) {
    verdictLines.push('✅ All recorded actions were within mandate boundaries.');
    verdictLines.push('Accountable party: Agent acted within granted authority.');
  } else {
    verdictLines.push(`⚠️ ${violations.length} mandate violation(s) detected.`);
    if (autoRevocations.length > 0) {
      verdictLines.push(`🚨 ${autoRevocations.length} mandate(s) were auto-revoked due to violations.`);
      verdictLines.push('Accountable party: Agent exceeded defined authority — mandate was automatically invalidated.');
    } else {
      verdictLines.push('Accountable party: Agent attempted out-of-scope actions but mandate was not auto-revoked.');
    }
  }
  if (stepUpBlocked.length > 0) {
    verdictLines.push(`⛔ ${stepUpBlocked.length} high-risk action(s) intercepted and required human approval.`);
  }

  const report = {
    generated_at: new Date().toISOString(),
    agent: {
      id: agent?.id,
      name: agent?.name,
      icon: agent?.icon,
      identity_status: agent?.identity_status || 'active',
      registered_at: agent?.created_at,
    },
    summary: {
      total_mandates_issued: tokens?.length || 0,
      active_mandates: (tokens || []).filter(t => t.status === 'active').length,
      revoked_mandates: (tokens || []).filter(t => t.status === 'revoked').length,
      total_actions_logged: events?.length || 0,
      allowed_actions: allowedActions.length,
      blocked_violations: violations.length,
      auto_revocations: autoRevocations.length,
      step_up_intercepts: stepUpBlocked.length,
    },
    verdict: verdictLines,
    mandate_history: (tokens || []).map(t => ({
      mandate: t.mandate_name || t.purpose,
      service: t.service_name,
      issued_at: t.created_at,
      status: t.status,
      constraint_summary: t.constraint_summary,
    })),
    violation_log: violations.map(v => ({
      timestamp: v.created_at,
      action_attempted: v.action,
      status: v.status,
    })),
  };

  return NextResponse.json(report);
}
