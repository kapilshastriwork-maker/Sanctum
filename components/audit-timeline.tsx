'use client';
import { useState, useCallback, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { toast } from 'sonner';

type AuditEvent = {
  id: string;
  event_type: string;
  action: string;
  service_name: string | null;
  scope_used: string | null;
  status: 'success' | 'blocked' | 'pending_approval' | 'denied';
  created_at: string;
  agents: { name: string; icon: string } | null;
};

const STATUS_CONFIG = {
  success: { 
    bg: 'bg-green-50', 
    border: 'border-green-200',
    dot: 'bg-green-500',
    text: 'text-green-700',
    label: 'Success'
  },
  blocked: { 
    bg: 'bg-red-50', 
    border: 'border-red-200',
    dot: 'bg-red-500',
    text: 'text-red-700',
    label: 'Blocked'
  },
  pending_approval: { 
    bg: 'bg-orange-50', 
    border: 'border-orange-200',
    dot: 'bg-orange-500',
    text: 'text-orange-700',
    label: 'Pending'
  },
  denied: { 
    bg: 'bg-gray-50', 
    border: 'border-gray-200',
    dot: 'bg-gray-400',
    text: 'text-gray-600',
    label: 'Denied'
  },
};

const EVENT_ICONS: Record<string, string> = {
  service_connected: '🔗',
  service_disconnected: '🔌',
  agent_registered: '🤖',
  mission_token_issued: '🎯',
  mission_token_revoked: '🚫',
  step_up_triggered: '⚡',
  step_up_approved: '✅',
  step_up_denied: '🚫',
};

export function AuditTimeline() {
  const { user } = useUser();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const fetchEvents = useCallback(async () => {
    if (!user?.sub) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/audit?userId=${encodeURIComponent(user.sub)}`
      );
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.sub]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const downloadReceipt = async () => {
    if (!user?.sub) return;
    setIsDownloading(true);
    try {
      const res = await fetch(
        `/api/audit/receipt?userId=${encodeURIComponent(user.sub)}`
      );
      const receipt = await res.json();
      const blob = new Blob(
        [JSON.stringify(receipt, null, 2)], 
        { type: 'application/json' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sanctum-audit-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Signed audit receipt downloaded');
    } catch {
      toast.error('Failed to download receipt');
    } finally {
      setIsDownloading(false);
    }
  };

  const filteredEvents = events.filter(e => {
    if (filter === 'all') return true;
    if (filter === 'blocked') return e.status === 'blocked' || e.status === 'denied';
    if (filter === 'tokens') return e.event_type.includes('token');
    if (filter === 'connections') return e.event_type.includes('service');
    return true;
  });

  const formatTime = (ts: string) => {
    const date = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Audit Trail</h2>
          <p className="text-sm text-gray-500">
            {events.length} events logged — every action recorded
          </p>
        </div>
        <button
          onClick={downloadReceipt}
          disabled={isDownloading || events.length === 0}
          className="flex items-center gap-2 bg-black text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {isDownloading ? (
            <>
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              📄 Download signed receipt
            </>
          )}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 px-5 py-3 border-b border-gray-100 overflow-x-auto">
        {[
          { id: 'all', label: 'All events' },
          { id: 'tokens', label: 'Tokens' },
          { id: 'blocked', label: 'Blocked' },
          { id: 'connections', label: 'Connections' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
              filter === f.id
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin mx-auto" />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-500">No events found</p>
          </div>
        ) : (
          filteredEvents.map((event, index) => {
            const config = STATUS_CONFIG[event.status] || STATUS_CONFIG.success;
            return (
              <div
                key={event.id}
                className={`flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors ${
                  index === 0 ? 'bg-blue-50/30' : ''
                }`}
              >
                {/* Icon */}
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm mt-0.5">
                  {EVENT_ICONS[event.event_type] || '📋'}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 leading-snug">
                        {event.action}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {event.agents?.name && (
                          <span className="text-xs text-gray-500">
                            {event.agents.icon} {event.agents.name}
                          </span>
                        )}
                        {event.service_name && (
                          <span className="text-xs text-gray-400">
                            · {event.service_name === 'google-oauth2' ? 'Gmail' : event.service_name}
                          </span>
                        )}
                        {event.scope_used && (
                          <span className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">
                            {event.scope_used.length > 30 
                              ? event.scope_used.slice(0, 30) + '...' 
                              : event.scope_used}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${config.bg} ${config.border} ${config.text}`}>
                        {config.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatTime(event.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {events.length > 0 && (
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <p className="text-xs text-gray-500 text-center">
            🔒 All events are tamper-evident and cryptographically signed · 
            Download receipt to verify integrity
          </p>
        </div>
      )}
    </div>
  );
}