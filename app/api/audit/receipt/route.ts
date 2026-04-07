import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { createHmac } from 'crypto';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: events } = await supabaseServer
    .from('audit_events')
    .select('*, agents(name, icon)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  const receipt = {
    sanctum_audit_receipt: true,
    generated_at: new Date().toISOString(),
    user_id: userId,
    total_events: events?.length || 0,
    events: events?.map(e => ({
      id: e.id,
      timestamp: e.created_at,
      event_type: e.event_type,
      agent: e.agents?.name || 'System',
      action: e.action,
      service: e.service_name,
      scope_used: e.scope_used,
      status: e.status,
    })),
  };

  // Sign with HMAC
  const secret = process.env.AUTH0_SECRET || 'sanctum-audit-secret';
  const signature = createHmac('sha256', secret)
    .update(JSON.stringify(receipt))
    .digest('hex');

  const signedReceipt = {
    ...receipt,
    signature,
    verification: 'HMAC-SHA256',
  };

  return NextResponse.json(signedReceipt);
}