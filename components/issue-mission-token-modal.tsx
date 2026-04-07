'use client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getScopesByService, buildConstraintSummary } from '@/lib/scope-registry';
import type { IntentScope } from '@/lib/scope-registry';

type Agent = { id: string; name: string; icon: string; };

type IssueMissionTokenModalProps = {
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
};

const EXPIRY_OPTIONS = [
  { label: '15 min', value: 15 },
  { label: '1 hour', value: 60 },
  { label: '4 hours', value: 240 },
  { label: '24 hours', value: 1440 },
];

export function IssueMissionTokenModal({ userId, onClose, onSuccess }: IssueMissionTokenModalProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [selectedService, setSelectedService] = useState('google-oauth2');
  const [selectedScope, setSelectedScope] = useState<IntentScope | null>(null);
  const [purpose, setPurpose] = useState('');
  const [expiresIn, setExpiresIn] = useState(60);
  const [isLoading, setIsLoading] = useState(false);

  const availableScopes = getScopesByService(selectedService);

  useEffect(() => {
    fetch(`/api/agents?userId=${encodeURIComponent(userId)}`)
      .then(r => r.json())
      .then(d => {
        setAgents(d.agents || []);
        if (d.agents?.length > 0) setSelectedAgent(d.agents[0].id);
      });
  }, [userId]);

  useEffect(() => { setSelectedScope(null); }, [selectedService]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent || !purpose || !selectedScope) {
      toast.error('Please select an agent, a mandate scope, and fill in the purpose');
      return;
    }
    setIsLoading(true);
    const agent = agents.find(a => a.id === selectedAgent);
    try {
      const res = await fetch('/api/mission-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgent,
          agentName: agent?.name,
          serviceName: selectedService,
          scopes: selectedScope.maps_to_scopes,
          purpose,
          userId,
          expiresInMinutes: expiresIn,
          mandateName: selectedScope.name,
          maxActionsPerHour: selectedScope.constraints.max_actions_per_hour,
          forbiddenKeywords: selectedScope.constraints.forbidden_keywords,
          domainWhitelist: selectedScope.constraints.domain_whitelist,
          autoRevokeOnViolation: selectedScope.constraints.auto_revoke_on_violation,
          constraintSummary: buildConstraintSummary(selectedScope),
        }),
      });
      if (res.ok) {
        toast.success(`Mandate token issued: ${selectedScope.name}`);
        onSuccess();
        onClose();
      } else {
        toast.error('Failed to issue mandate token');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Issue Mandate Token</h2>
            <p className="text-sm text-gray-500">Behavioral contract — not just an OAuth scope</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agent</label>
            {agents.length === 0 ? (
              <p className="text-sm text-red-500">No agents registered.</p>
            ) : (
              <div className="flex gap-2 flex-wrap">
                {agents.map(agent => (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => setSelectedAgent(agent.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                      selectedAgent === agent.id
                        ? 'border-black bg-black text-white'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span>{agent.icon}</span>
                    {agent.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'google-oauth2', label: 'Gmail', icon: '📧' },
                { id: 'github', label: 'GitHub', icon: '🐙' },
              ].map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedService(s.id)}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-colors ${
                    selectedService === s.id
                      ? 'border-black bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-lg">{s.icon}</span>
                  <span className="text-sm font-medium text-gray-900">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Mandate scope</label>
              <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">Scope Registry</span>
            </div>
            <div className="space-y-2">
              {availableScopes.map(scope => (
                <button
                  key={scope.id}
                  type="button"
                  onClick={() => { setSelectedScope(scope); setPurpose(scope.example_use); }}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedScope?.id === scope.id
                      ? 'border-purple-400 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{scope.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{scope.name}</p>
                        <p className="text-xs text-gray-500">{scope.description}</p>
                      </div>
                    </div>
                    {scope.constraints.auto_revoke_on_violation && (
                      <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded flex-shrink-0">Auto-revoke</span>
                    )}
                  </div>
                  {selectedScope?.id === scope.id && (
                    <div className="mt-2 pt-2 border-t border-purple-200">
                      <div className="flex flex-wrap gap-1">
                        <span className="text-xs bg-white border border-purple-200 text-purple-700 px-2 py-0.5 rounded-full">
                          Max {scope.constraints.max_actions_per_hour} actions/hr
                        </span>
                        {scope.constraints.forbidden_keywords.slice(0, 2).map(k => (
                          <span key={k} className="text-xs bg-red-50 border border-red-200 text-red-600 px-2 py-0.5 rounded-full">No "{k}"</span>
                        ))}
                      </div>
                      <p className="text-xs text-purple-600 mt-1.5">Step-up: {scope.step_up_trigger}</p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Task / Purpose</label>
            <input
              type="text"
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              placeholder="e.g. Summarize today's client emails"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expires in</label>
            <div className="grid grid-cols-4 gap-2">
              {EXPIRY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setExpiresIn(opt.value)}
                  className={`py-2 rounded-lg border text-xs font-medium transition-colors ${
                    expiresIn === opt.value
                      ? 'border-black bg-black text-white'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {selectedScope && purpose && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="text-xs font-medium text-purple-800 mb-1">Mandate contract preview</p>
              <p className="text-xs text-purple-700 leading-relaxed">
                <span className="font-medium">{agents.find(a => a.id === selectedAgent)?.name || 'Agent'}</span> is granted the{' '}
                <span className="font-medium">"{selectedScope.name}"</span> mandate on{' '}
                {selectedService === 'google-oauth2' ? 'Gmail' : 'GitHub'} for{' '}
                <span className="font-medium">{EXPIRY_OPTIONS.find(o => o.value === expiresIn)?.label}</span> to:{' '}
                <span className="font-medium italic">"{purpose}"</span>.
                Violations auto-revoke this mandate.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !selectedAgent || !purpose || !selectedScope}
              className="flex-1 bg-black text-white py-2.5 rounded-lg text-sm hover:bg-gray-800 disabled:opacity-50"
            >
              {isLoading ? 'Issuing...' : 'Issue mandate token'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
