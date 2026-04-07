import { supabaseServer } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from('agents')
      .select('count')
      .limit(1);

    if (error) throw error;

    return NextResponse.json({ 
      status: 'connected', 
      message: 'Supabase connection successful' 
    });
  } catch (error) {
    return NextResponse.json({ 
      status: 'error', 
      message: String(error) 
    }, { status: 500 });
  }
}
