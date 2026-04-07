import { NextRequest, NextResponse } from 'next/server';
import { saveConnectedService } from '@/lib/token-vault';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { serviceName, scopes, userId } = await req.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'No userId provided' }, { status: 401 });
    }

    await saveConnectedService(userId, serviceName, scopes);

    await supabaseServer.from('audit_events').insert({
      user_id: userId,
      event_type: 'service_connected',
      service_name: serviceName,
      action: `Connected ${serviceName} via Token Vault`,
      scope_used: scopes.join(', '),
      status: 'success',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
