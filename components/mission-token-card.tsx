'use client';
import { useState } from 'react';
import { toast } from 'sonner';

type MissionTokenCardProps = {
  id: string;
  agentName: string;
  agentIcon: string;
  serviceName: string;
  scopes: string[];
  purpose: string;
  status: 'active' | 'expired' | 'revoked';
  createdAt: string;
  expiresAt: string;
  userId: string;
  mandateName?: string;
  constraintSummary?: string;
  autoRevokeOnViolation?: boolean;
  onRevoke: (id: string) => void;
};

export function MissionTokenCard({
  id, agentName, agentIcon, serviceName, scopes, purpose,
  status, expiresAt, userId, mandateName, constraintSummary, autoRevokeOnViolation, onRevoke
}: MissionTokenCardProps) {
  const [isRevoking, setIsRevoking] = useState(false);

  const isExpired = new Date(expiresAt) < new Date();
  const effectiveStatus = isExpired && status === 'active' ? 'expired' : status;

  const statusConfig = {
    active: { color: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500', label: 'Active' },
    expired: { color: 'bg-gray-50 text-gray-600 border-gray-200', dot: 'bg-gray-400', label: 'Expired' },
    revoked: { color: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500', label: 'Revoked' },
  };

  const config = statusConfig[effectiveStatus];

  const timeLeft = () => {
    if (effectiveStatus !== 'active') return null;
    const diff = new Date(expiresAt).getTime() - Date.now();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    if (hours > 0) return `${hours}h ${mins % 60}m left`;
    return `${mins}m left`;
  };

  const handleRevoke = async () => {
    if (!confirm('Revoke this mission token? The agent will lose access immediately.')) return;
    setIsRevoking(true);
    try {
      await fetch('/api/mission-tokens/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId: id, userId }),
      });
      toast.success('Token revoked — agent access removed');
      onRevoke(id);
    } catch {
      toast.error('Failed to revoke token');
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className={`bg-white rounded-xl border p-4 ${
      effectiveStatus === 'active' ? 'border-gray-200' : 'border-gray-100 opacity-70'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{agentIcon}</span>
          <div>
            <p className="text-sm font-medium text-gray-900">{agentName}</p>
            <p className="text-xs text-gray-500">
              {serviceName === 'google-oauth2' ? '📧 Gmail' : '🐙 GitHub'}
            </p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium ${config.color}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
          {config.label}
        </div>
      </div>

      <p className="text-xs text-gray-600 mb-2 font-medium">&ldquo;{purpose}&rdquo;</p>

      {mandateName && (
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full font-medium">
            {mandateName}
          </span>
          {autoRevokeOnViolation && (
            <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded-full">
              Auto-revoke
            </span>
          )}
        </div>
      )}
      {constraintSummary && (
        <p className="text-xs text-gray-400 mb-2">{constraintSummary}</p>
      )}

      <div className="flex flex-wrap gap-1 mb-3">
        {scopes.map(scope => (
          <span key={scope} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-mono">
            {scope}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-400">
          {timeLeft() ? (
            <span className="text-orange-500 font-medium">{timeLeft()}</span>
          ) : (
            `${effectiveStatus === 'revoked' ? 'Revoked' : 'Expired'} ${new Date(expiresAt).toLocaleDateString()}`
          )}
        </div>
        {effectiveStatus === 'active' && (
          <button
            onClick={handleRevoke}
            disabled={isRevoking}
            className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
          >
            {isRevoking ? 'Revoking...' : 'Revoke'}
          </button>
        )}
      </div>
    </div>
  );
}