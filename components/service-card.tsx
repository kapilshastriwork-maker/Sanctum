'use client';
import { useState } from 'react';
import { toast } from 'sonner';

type ServiceCardProps = {
  id: string;
  name: string;
  icon: string;
  description: string;
  connection: string;
  scopes: string[];
  isConnected: boolean;
  connectedAt?: string;
  onDisconnect?: (id: string) => void;
};

export function ServiceCard({
  id,
  name,
  icon,
  description,
  connection,
  scopes,
  isConnected,
  connectedAt,
  onDisconnect,
}: ServiceCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = () => {
    setIsLoading(true);
    const returnTo = `/dashboard?connected=${id}`;
    window.location.href = `/api/auth/connect/${connection}?returnTo=${encodeURIComponent(returnTo)}`;
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/connections/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceName: id }),
      });
      if (res.ok) {
        toast.success(`${name} disconnected`);
        onDisconnect?.(id);
      }
    } catch {
      toast.error('Failed to disconnect');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`bg-white rounded-xl border p-5 transition-all ${
      isConnected ? 'border-green-200 bg-green-50/30' : 'border-gray-200'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xl">
            {icon}
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{name}</h3>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
        </div>
        <div className={`w-2 h-2 rounded-full mt-1 ${
          isConnected ? 'bg-green-500' : 'bg-gray-300'
        }`} />
      </div>

      <div className="mb-4">
        <p className="text-xs text-gray-400 mb-1.5">Requested scopes:</p>
        <div className="flex flex-wrap gap-1">
          {scopes.map(scope => (
            <span
              key={scope}
              className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
            >
              {scope.split('/').pop() || scope}
            </span>
          ))}
        </div>
      </div>

      {isConnected && connectedAt && (
        <p className="text-xs text-green-600 mb-3">
          Connected {new Date(connectedAt).toLocaleDateString()}
        </p>
      )}

      <button
        onClick={isConnected ? handleDisconnect : handleConnect}
        disabled={isLoading}
        className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
          isConnected
            ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
            : 'bg-black text-white hover:bg-gray-800'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isLoading ? 'Loading...' : isConnected ? 'Disconnect' : 'Connect'}
      </button>
    </div>
  );
}
