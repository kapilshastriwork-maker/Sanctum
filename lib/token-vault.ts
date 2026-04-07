import { SUPPORTED_SERVICES } from './services-config';

export { SUPPORTED_SERVICES };

export type ServiceConnection = {
  id: string;
  name: string;
  icon: string;
  description: string;
  connection: string;
  scopes: string[];
  isConnected: boolean;
  connectedAt?: string;
};

export async function getConnectedServices(
  userId: string
): Promise<ServiceConnection[]> {
  const { supabaseServer } = await import('./supabase/server');
  
  const { data, error } = await supabaseServer
    .from('connected_services')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching connected services:', error);
    return SUPPORTED_SERVICES.map(s => ({ ...s, isConnected: false }));
  }

  return SUPPORTED_SERVICES.map(service => {
    const connected = data?.find(d => d.service_name === service.id);
    return {
      ...service,
      isConnected: !!connected,
      connectedAt: connected?.connected_at,
    };
  });
}

export async function saveConnectedService(
  userId: string,
  serviceName: string,
  scopes: string[]
): Promise<void> {
  const { supabaseServer } = await import('./supabase/server');

  const { error } = await supabaseServer
    .from('connected_services')
    .upsert({
      user_id: userId,
      service_name: serviceName,
      service_icon: SUPPORTED_SERVICES.find(s => s.id === serviceName)?.icon,
      scopes,
      is_active: true,
      connected_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,service_name',
    });

  if (error) {
    console.error('Error saving connected service:', error);
  }
}

export async function disconnectService(
  userId: string,
  serviceName: string
): Promise<void> {
  const { supabaseServer } = await import('./supabase/server');

  const { error } = await supabaseServer
    .from('connected_services')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('service_name', serviceName);

  if (error) {
    console.error('Error disconnecting service:', error);
  }
}
