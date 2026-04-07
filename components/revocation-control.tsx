'use client';
import { useState, useEffect, useRef } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { toast } from 'sonner';

type Agent = {
  id: string;
  name: string;
  icon: string;
  description: string | null;
};

type RevocationEvent = {
  type: string;
  agentId?: string;
  agentName?: string;
  tokensRevoked?: number;
  timestamp?: string;
};

export function RevocationControl() {
  const { user } = useUser();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [revocationLog, setRevocationLog] = useState<RevocationEvent[]>([]);
  const [revoking, setRevoking] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!user?.sub) return;

    fetch(`/api/agents?userId=${encodeURIComponent(user.sub)}`)
      .then(r => r.json())
      .then(d => setAgents(d.agents || []));

    const es = new EventSource(
      `/api/revocation-stream?userId=${encodeURIComponent(user.sub)}`
    );
    eventSourceRef.current = es;

    es.onopen = () => setIsConnected(true);
    
    es.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'connected') {
        setIsConnected(true);
      } else if (data.type === 'revocation') {
        setRevocationLog(prev => [data, ...prev.slice(0, 9)]);
        toast.error(`🚨 ${data.agentName} access revoked`, {
          description: `${data.tokensRevoked} token(s) invalidated in real-time`,
          duration: 5000,
        });
      }
    };

    es.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      es.close();
      setIsConnected(false);
    };
  }, [user?.sub]);

  const revokeAgent = async (agent: Agent) => {
    if (!user?.sub) return;
    if (!confirm(`Revoke ALL access for ${agent.name}? This cannot be undone.`)) return;

    setRevoking(agent.id);
    try {
      const res = await fetch('/api/agents/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id,
          agentName: agent.name,
          userId: user.sub,
        }),
      });

      const data = await res.json();
      
      if (res.ok) {
        const event: RevocationEvent = {
          type: 'revocation',
          agentId: agent.id,
          agentName: agent.name,
          tokensRevoked: data.revokedTokens,
          timestamp: new Date().toISOString(),
        };
        setRevocationLog(prev => [event, ...prev.slice(0, 9)]);
        
        toast.error(`🚨 ${agent.name} fully revoked`, {
          description: `${data.revokedTokens} token(s) invalidated instantly`,
          duration: 5000,
        });
      }
    } catch {
      toast.error('Revocation failed');
    } finally {
      setRevoking(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Instant Revocation
          </h2>
          <p className="text-sm text-gray-500">
            One tap removes all agent access in real-time
          </p>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
          isConnected
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-gray-50 border-gray-200 text-gray-500'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${
            isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
          }`} />
          {isConnected ? 'Stream connected' : 'Connecting...'}
        </div>
      </div>

      {/* Agent revocation buttons */}
      <div className="p-5">
        {agents.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No agents registered yet
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Revoke agent access
            </p>
            {agents.map(agent => (
              <div
                key={agent.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{agent.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {agent.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {agent.description || 'AI Agent'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => revokeAgent(agent)}
                  disabled={revoking === agent.id}
                  className="flex items-center gap-1.5 bg-red-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-red-600 font-medium disabled:opacity-50 transition-colors"
                >
                  {revoking === agent.id ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Revoking...
                    </>
                  ) : (
                    <>
                      🚫 Revoke all
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {revocationLog.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Revocation log
            </p>
            <div className="space-y-2">
              {revocationLog.map((event, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 bg-red-50 border border-red-100 rounded-lg"
                >
                  <div>
                    <p className="text-xs font-medium text-red-800">
                      🚨 {event.agentName} — all access revoked
                    </p>
                    <p className="text-xs text-red-600">
                      {event.tokensRevoked} token(s) invalidated
                      {event.timestamp && ` · ${new Date(event.timestamp).toLocaleTimeString()}`}
                    </p>
                  </div>
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                    Instant
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
          <p className="text-xs text-blue-700">
            <span className="font-medium">How it works:</span> Revocation 
            invalidates all active mission tokens and denies pending 
            step-up requests instantly via Server-Sent Events. The agent 
            loses access in under 1 second.
          </p>
        </div>
      </div>
    </div>
  );
}