'use client';
import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { ServiceCard } from './service-card';
import { SUPPORTED_SERVICES } from '@/lib/services-config';

type Service = {
  id: string;
  name: string;
  icon: string;
  description: string;
  connection: string;
  scopes: string[];
  isConnected: boolean;
  connectedAt?: string;
};

export function ConnectedServices() {
  const { user } = useUser();
  const [services, setServices] = useState<Service[]>(
    SUPPORTED_SERVICES.map(s => ({ ...s, isConnected: false }))
  );
  const [isLoading, setIsLoading] = useState(true);

  const fetchServices = useCallback(async () => {
    if (!user?.sub) return;
    try {
      const res = await fetch(`/api/connections?userId=${encodeURIComponent(user.sub)}`);
      if (res.ok) {
        const data = await res.json();
        setServices(data.services);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.sub]);

  useEffect(() => {
    if (user?.sub) {
      fetchServices();
    }
  }, [fetchServices, user?.sub]);

  useEffect(() => {
    const handler = () => fetchServices();
    window.addEventListener('connections-updated', handler);
    return () => window.removeEventListener('connections-updated', handler);
  }, [fetchServices]);

  const handleDisconnect = async (serviceId: string) => {
    if (!user?.sub) return;
    await fetch('/api/connections/disconnect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceName: serviceId, userId: user.sub }),
    });
    setServices(prev =>
      prev.map(s => s.id === serviceId ? { ...s, isConnected: false } : s)
    );
  };

  if (!user || isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2].map(i => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-100 rounded-lg" />
              <div>
                <div className="h-4 bg-gray-100 rounded w-20 mb-1" />
                <div className="h-3 bg-gray-100 rounded w-32" />
              </div>
            </div>
            <div className="h-8 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const connectedCount = services.filter(s => s.isConnected).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Connected Services
          </h2>
          <p className="text-sm text-gray-500">
            {connectedCount} of {services.length} services connected via Token Vault
          </p>
        </div>
        {connectedCount > 0 && (
          <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-3 py-1">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-green-700 font-medium">Token Vault Active</span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {services.map(service => (
          <ServiceCard
            key={service.id}
            {...service}
            onDisconnect={handleDisconnect}
          />
        ))}
      </div>
    </div>
  );
}
