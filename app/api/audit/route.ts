import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ events: [] });

  const { data } = await supabaseServer
    .from('audit_events')
    .select('*, agents(name, icon)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  return NextResponse.json({ events: data || [] });
}