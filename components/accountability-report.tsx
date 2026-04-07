'use client';
import { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { toast } from 'sonner';

type Agent = {
  id: string;
  name: string;
  icon: string;
  identity_status?: string;
};

type Report = {
  generated_at: string;
  agent: {
    name: string;
    icon: string;
    identity_status: string;
  };
  summary: {
    total_mandates_issued: number;
    allowed_actions: number;
    blocked_violations: number;
    auto_revocations: number;
    step_up_intercepts: number;
  };
  verdict: string[];
  mandate_history: {
    mandate: string;
    service: string;
    issued_at: string;
    status: string;
    constraint_summary: string;
  }[];
  violation_log: {
    timestamp: string;
    action_attempted: string;
    status: string;
  }[];
};

export function AccountabilityReport({ agents }: { agents: Agent[] }) {
  const { user } = useUser();
  const [selectedAgent, setSelectedAgent] = useState(agents[0]?.id || '');
  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateReport = async () => {
    if (!user?.sub || !selectedAgent) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/accountability-report?userId=${encodeURIComponent(user.sub)}&agentId=${selectedAgent}`
      );
      const data = await res.json();
      setReport(data);
      toast.success('Accountability report generated');
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadReport = () => {
    if (!report) return;
    const blob = new Blob(
      [JSON.stringify(report, null, 2)], 
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sanctum-accountability-${report.agent.name}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isClean = report &&
    report.summary.blocked_violations === 0 &&
    report.summary.auto_revocations === 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-5 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">
          Accountability Report
        </h2>
        <p className="text-sm text-gray-500">
          Plain-language verdict: what was the agent authorized to do vs. what it attempted
        </p>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Select agent
          </label>
          <div className="flex gap-2 flex-wrap">
            {agents.map(agent => (
              <button
                key={agent.id}
                onClick={() => { setSelectedAgent(agent.id); setReport(null); }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                  selectedAgent === agent.id
                    ? 'border-black bg-black text-white'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{agent.icon}</span>
                {agent.name}
                {agent.identity_status === 'suspended' && (
                  <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                    SUSPENDED
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={generateReport}
          disabled={isLoading || !selectedAgent}
          className="w-full bg-black text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating...
            </span>
          ) : 'Generate accountability report'}
        </button>

        {report && (
          <div className="space-y-4">
            <div className={`rounded-xl border-2 p-4 ${
              isClean ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <p className={`text-sm font-semibold ${
                  isClean ? 'text-green-800' : 'text-red-800'
                }`}>
                  {isClean ? '✅ Verdict: Within Mandate' : '⚠️ Verdict: Outside Mandate'}
                </p>
                <span className="text-xs text-gray-500">
                  {new Date(report.generated_at).toLocaleString()}
                </span>
              </div>
              {report.verdict.map((line, i) => (
                <p key={i} className={`text-xs mt-1 ${
                  isClean ? 'text-green-700' : 'text-red-700'
                }`}>
                  {line}
                </p>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Allowed', value: report.summary.allowed_actions, color: 'text-green-600' },
                { label: 'Blocked', value: report.summary.blocked_violations, color: 'text-red-600' },
                { label: 'Intercepted', value: report.summary.step_up_intercepts, color: 'text-orange-600' },
              ].map(stat => (
                <div key={stat.label} className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
                  <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>

            {report.mandate_history.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Mandate history
                </p>
                <div className="space-y-1.5">
                  {report.mandate_history.map((m, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <p className="text-xs font-medium text-gray-900">{m.mandate}</p>
                        {m.constraint_summary && (
                          <p className="text-xs text-gray-400">{m.constraint_summary}</p>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        m.status === 'active' ? 'bg-green-100 text-green-700' 
                        : m.status === 'revoked' ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-600'
                      }`}>
                        {m.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {report.violation_log.length > 0 && (
              <div>
                <p className="text-xs font-medium text-red-500 uppercase tracking-wide mb-2">
                  Violation log
                </p>
                <div className="space-y-1.5">
                  {report.violation_log.map((v, i) => (
                    <div key={i} className="p-2.5 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs font-medium text-red-800 line-clamp-2">
                        {v.action_attempted}
                      </p>
                      <p className="text-xs text-red-500 mt-0.5">
                        {new Date(v.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={downloadReport}
              className="w-full border border-gray-200 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50"
            >
              📄 Download full report JSON
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
