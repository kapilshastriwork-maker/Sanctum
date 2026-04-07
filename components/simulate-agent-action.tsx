'use client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

type Agent = {
  id: string;
  name: string;
  icon: string;
};

type SimulateAgentActionProps = {
  userId: string;
  onActionTriggered: () => void;
};

const HIGH_RISK_ACTIONS = [
  {
    id: 'delete_emails',
    label: 'Delete all emails in inbox',
    icon: '🗑️',
    service: 'Gmail',
    risk: 'CRITICAL',
    reason: 'Permanent deletion of email data cannot be undone',
  },
  {
    id: 'send_bulk_email',
    label: 'Send email to 500 contacts',
    icon: '📨',
    service: 'Gmail',
    risk: 'HIGH',
    reason: 'Mass email send could spam contacts on your behalf',
  },
  {
    id: 'push_to_main',
    label: 'Force push to main branch',
    icon: '⚠️',
    service: 'GitHub',
    risk: 'CRITICAL',
    reason: 'Force push to main can overwrite production code',
  },
  {
    id: 'delete_repo',
    label: 'Delete repository',
    icon: '💣',
    service: 'GitHub',
    risk: 'CRITICAL',
    reason: 'Repository deletion is permanent and cannot be undone',
  },
];

export function SimulateAgentAction({ userId, onActionTriggered }: SimulateAgentActionProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [selectedAction, setSelectedAction] = useState(HIGH_RISK_ACTIONS[0]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    fetch(`/api/agents?userId=${encodeURIComponent(userId)}`)
      .then(r => r.json())
      .then(d => {
        setAgents(d.agents || []);
        if (d.agents?.length > 0) setSelectedAgent(d.agents[0].id);
      });
  }, [userId]);

  const simulate = async () => {
    if (!selectedAgent) {
      toast.error('Select an agent first');
      return;
    }

    setIsSimulating(true);
    setBlocked(false);

    // Dramatic pause — agent is "running"
    await new Promise(r => setTimeout(r, 1500));

    try {
      const res = await fetch('/api/step-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgent,
          agentName: agents.find(a => a.id === selectedAgent)?.name,
          action: selectedAction.label,
          reason: selectedAction.reason,
          userId,
        }),
      });

      if (res.ok) {
        setBlocked(true);
        toast.error('🚨 HIGH-RISK ACTION INTERCEPTED', {
          description: `${selectedAction.label} — awaiting your approval`,
          duration: 5000,
        });
        onActionTriggered();
      }
    } catch {
      toast.error('Simulation failed');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
          <span className="text-base">⚡</span>
        </div>
        <div>
          <h3 className="font-medium text-gray-900 text-sm">Simulate Agent Action</h3>
          <p className="text-xs text-gray-500">Test the step-up guard with a high-risk action</p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Agent picker */}
        {agents.length > 0 && (
          <div className="flex gap-2">
            {agents.map(agent => (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  selectedAgent === agent.id
                    ? 'border-black bg-black text-white'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <span>{agent.icon}</span>
                {agent.name}
              </button>
            ))}
          </div>
        )}

        {/* Action picker */}
        <div className="grid grid-cols-1 gap-2">
          {HIGH_RISK_ACTIONS.map(action => (
            <button
              key={action.id}
              onClick={() => setSelectedAction(action)}
              className={`flex items-center justify-between p-3 rounded-lg border text-left transition-colors ${
                selectedAction.id === action.id
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{action.icon}</span>
                <div>
                  <p className="text-xs font-medium text-gray-900">{action.label}</p>
                  <p className="text-xs text-gray-500">{action.service}</p>
                </div>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                action.risk === 'CRITICAL' 
                  ? 'bg-red-100 text-red-700' 
                  : 'bg-orange-100 text-orange-700'
              }`}>
                {action.risk}
              </span>
            </button>
          ))}
        </div>

        {/* Simulate button */}
        <button
          onClick={simulate}
          disabled={isSimulating || !selectedAgent}
          className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all ${
            blocked
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-red-500 text-white hover:bg-red-600'
          } disabled:opacity-50`}
        >
          {isSimulating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Agent executing...
            </span>
          ) : blocked ? (
            '🚫 Action blocked — check approvals below'
          ) : (
            '▶ Simulate high-risk action'
          )}
        </button>
      </div>
    </div>
  );
}