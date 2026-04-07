import { NextRequest, NextResponse } from 'next/server';
import { disconnectService } from '@/lib/token-vault';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { serviceName, userId } = await req.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'No userId provided' }, { status: 401 });
    }

    await disconnectService(userId, serviceName);

    await supabaseServer.from('audit_events').insert({
      user_id: userId,
      event_type: 'service_disconnected',
      service_name: serviceName,
      action: `Disconnected ${serviceName}`,
      status: 'success',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
