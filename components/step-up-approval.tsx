'use client';
import { useState } from 'react';
import { toast } from 'sonner';

type StepUpRequest = {
  id: string;
  action: string;
  reason: string;
  status: 'pending' | 'approved' | 'denied';
  created_at: string;
  agents: { name: string; icon: string } | null;
};

type StepUpApprovalProps = {
  requests: StepUpRequest[];
  userId: string;
  onResolved: () => void;
};

export function StepUpApproval({ requests, userId, onResolved }: StepUpApprovalProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const resolve = async (requestId: string, decision: 'approved' | 'denied') => {
    setLoadingId(requestId);
    try {
      await fetch('/api/step-up/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, decision, userId }),
      });

      if (decision === 'approved') {
        toast.success('Action approved — agent may proceed');
      } else {
        toast.error('Action denied — agent has been blocked');
      }
      onResolved();
    } catch {
      toast.error('Failed to resolve request');
    } finally {
      setLoadingId(null);
    }
  };

  const pending = requests.filter(r => r.status === 'pending');
  const resolved = requests.filter(r => r.status !== 'pending');

  if (requests.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Pending approvals — shown prominently */}
      {pending.length > 0 && (
        <div className="border-2 border-red-200 bg-red-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <h3 className="text-sm font-semibold text-red-800">
              {pending.length} action{pending.length > 1 ? 's' : ''} awaiting your approval
            </h3>
          </div>
          <div className="space-y-3">
            {pending.map(req => (
              <div key={req.id} className="bg-white rounded-lg border border-red-200 p-3">
                <div className="flex items-start gap-2 mb-3">
                  <span className="text-lg">{req.agents?.icon || '🤖'}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {req.agents?.name || 'Agent'} wants to:
                    </p>
                    <p className="text-sm text-red-700 font-medium mt-0.5">
                      {req.action}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      ⚠️ {req.reason}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => resolve(req.id, 'denied')}
                    disabled={loadingId === req.id}
                    className="flex-1 bg-red-500 text-white text-sm py-2 rounded-lg hover:bg-red-600 font-medium disabled:opacity-50"
                  >
                    🚫 Deny
                  </button>
                  <button
                    onClick={() => resolve(req.id, 'approved')}
                    disabled={loadingId === req.id}
                    className="flex-1 bg-green-500 text-white text-sm py-2 rounded-lg hover:bg-green-600 font-medium disabled:opacity-50"
                  >
                    ✅ Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resolved requests */}
      {resolved.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Recent decisions
          </p>
          {resolved.slice(0, 3).map(req => (
            <div
              key={req.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                req.status === 'approved'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{req.agents?.icon || '🤖'}</span>
                <p className="text-xs text-gray-700 line-clamp-1">{req.action}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                req.status === 'approved'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {req.status === 'approved' ? '✅ Approved' : '🚫 Denied'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}