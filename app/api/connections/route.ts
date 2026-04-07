import { NextRequest, NextResponse } from 'next/server';
import { getConnectedServices } from '@/lib/token-vault';
import { SUPPORTED_SERVICES } from '@/lib/services-config';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ 
        services: SUPPORTED_SERVICES.map(s => ({ ...s, isConnected: false }))
      });
    }

    const services = await getConnectedServices(userId);
    return NextResponse.json({ services });
  } catch (error) {
    console.error('Connections error:', error);
    return NextResponse.json({ 
      services: SUPPORTED_SERVICES.map(s => ({ ...s, isConnected: false }))
    });
  }
}
