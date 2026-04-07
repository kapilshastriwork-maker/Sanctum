'use client';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { Navbar } from '@/components/navbar';
import { ConnectedServices } from '@/components/connected-services';
import { AddAgentModal } from '@/components/add-agent-modal';
import { AgentCard } from '@/components/agent-card';
import { IssueMissionTokenModal } from '@/components/issue-mission-token-modal';
import { MissionTokenCard } from '@/components/mission-token-card';
import { SimulateAgentAction } from '@/components/simulate-agent-action';
import { StepUpApproval } from '@/components/step-up-approval';
import { AuditTimeline } from '@/components/audit-timeline';
import { RevocationControl } from '@/components/revocation-control';
import { PermissionGraph } from '@/components/permission-graph';
import { ScopeEngineTester } from '@/components/scope-engine-tester';
import { AccountabilityReport } from '@/components/accountability-report';

type Stats = {
  agents: number;
  connectedServices: number;
  missionTokens: number;
  auditEvents: number;
};

type Agent = {
  id: string;
  name: string;
  icon: string;
  description: string | null;
  created_at: string;
  identity_status?: string;
};

type Token = {
  id: string;
  agents: { name: string; icon: string } | null;
  service_name: string;
  scopes: string[];
  purpose: string;
  status: string;
  created_at: string;
  expires_at: string;
  mandate_name?: string;
  constraint_summary?: string;
  auto_revoke_on_violation?: boolean;
};

type StepUpRequest = {
  id: string;
  action: string;
  reason: string;
  status: 'pending' | 'approved' | 'denied';
  created_at: string;
  agents: { name: string; icon: string } | null;
};

function DashboardContent() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [stats, setStats] = useState<Stats>({
    agents: 0, connectedServices: 0,
    missionTokens: 0, auditEvents: 0,
  });
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [stepUpRequests, setStepUpRequests] = useState<StepUpRequest[]>([]);
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [showIssueToken, setShowIssueToken] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!user?.sub) return;
    const res = await fetch(`/api/dashboard/stats?userId=${encodeURIComponent(user.sub)}`);
    if (res.ok) setStats(await res.json());
  }, [user]);

  const fetchAgents = useCallback(async () => {
    if (!user?.sub) return;
    const res = await fetch(`/api/agents?userId=${encodeURIComponent(user.sub)}`);
    if (res.ok) {
      const data = await res.json();
      setAgents(data.agents);
    }
  }, [user]);

  const fetchTokens = useCallback(async () => {
    if (!user?.sub) return;
    const res = await fetch(`/api/mission-tokens?userId=${encodeURIComponent(user.sub)}`);
    if (res.ok) {
      const data = await res.json();
      setTokens(data.tokens);
    }
  }, [user]);

  const fetchStepUpRequests = useCallback(async () => {
    if (!user?.sub) return;
    const res = await fetch(`/api/step-up?userId=${encodeURIComponent(user.sub)}`);
    if (res.ok) {
      const data = await res.json();
      setStepUpRequests(data.requests);
    }
  }, [user]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/api/auth/login?returnTo=/dashboard');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user?.sub) return;
    const load = async () => {
      await Promise.all([fetchStats(), fetchAgents(), fetchTokens(), fetchStepUpRequests()]);
    };
    load();
  }, [user, fetchStats, fetchAgents, fetchTokens, fetchStepUpRequests]);

  useEffect(() => {
    const connected = searchParams?.get('connected');
    if (!connected || !user?.sub) return;

    const scopeMap: Record<string, string[]> = {
      'github': ['openid', 'read:user', 'public_repo'],
      'google-oauth2': ['openid', 'https://www.googleapis.com/auth/gmail.readonly'],
    };

    fetch('/api/connections/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceName: connected,
        scopes: scopeMap[connected] || ['openid'],
        userId: user.sub,
      }),
    }).then(() => {
      const url = new URL(window.location.href);
      url.searchParams.delete('connected');
      window.history.replaceState({}, '', url.toString());
      window.dispatchEvent(new Event('connections-updated'));
      fetchStats();
    });
  }, [searchParams, user, fetchStats]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-48" />
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded-xl" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  const statCards = [
    { label: 'Active agents', value: stats.agents },
    { label: 'Connected services', value: stats.connectedServices },
    { label: 'Mission tokens', value: stats.missionTokens },
    { label: 'Audit events', value: stats.auditEvents },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            Permission Wallet
          </h1>
          <p className="text-gray-500 mt-1">
            Welcome back{user.name ? `, ${user.name.split(' ')[0]}` : ''}. 
            Here is what your agents are authorized to do.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-gray-200 p-4"
            >
              <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Three column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Col 1: Connected Services */}
          <div>
            <ConnectedServices />
          </div>

          {/* Col 2: Registered Agents */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Registered Agents
                </h2>
                <p className="text-sm text-gray-500">
                  {agents.length} agent{agents.length !== 1 ? 's' : ''} registered
                </p>
              </div>
              <button
                onClick={() => setShowAddAgent(true)}
                className="bg-black text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                + Add agent
              </button>
            </div>

            {agents.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <div className="w-12 h-12 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🤖</span>
                </div>
                <h3 className="font-medium text-gray-900 mb-1 text-sm">
                  No agents registered
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  Register your AI tools to track their permissions
                </p>
                <button
                  onClick={() => setShowAddAgent(true)}
                  className="text-sm bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
                >
                  Register first agent
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {agents.map(agent => (
                  <AgentCard
                    key={agent.id}
                    id={agent.id}
                    name={agent.name}
                    icon={agent.icon}
                    description={agent.description}
                    createdAt={agent.created_at}
                    userId={user.sub!}
                    identity_status={agent.identity_status}
                    onDelete={(id) => {
                      setAgents(prev => prev.filter(a => a.id !== id));
                      fetchStats();
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Col 3: Step-up Guard + Scope Engine */}
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Guard Systems</h2>
              <p className="text-sm text-gray-500">
                Scope engine + step-up authentication
              </p>
            </div>
            <div className="space-y-4">
              <ScopeEngineTester />
              {user.sub && (
                <SimulateAgentAction
                  userId={user.sub}
                  onActionTriggered={() => {
                    fetchStepUpRequests();
                    fetchStats();
                  }}
                />
              )}
              <StepUpApproval
                requests={stepUpRequests}
                userId={user.sub!}
                onResolved={() => {
                  fetchStepUpRequests();
                  fetchStats();
                }}
              />
            </div>
          </div>
        </div>

        {/* Mission Tokens Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Mission Tokens</h2>
              <p className="text-sm text-gray-500">
                Scoped, time-limited access grants — not permanent permissions
              </p>
            </div>
            <button
              onClick={() => setShowIssueToken(true)}
              className="bg-black text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              + Issue token
            </button>
          </div>

          {tokens.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <div className="w-12 h-12 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-1 text-sm">No mission tokens yet</h3>
              <p className="text-xs text-gray-500 mb-4 max-w-sm mx-auto">
                Instead of giving agents permanent access, issue mission tokens — 
                scoped to exactly what they need, expiring when the task is done.
              </p>
              <button
                onClick={() => setShowIssueToken(true)}
                className="text-sm bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
              >
                Issue first mission token
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tokens.map(token => (
                <MissionTokenCard
                  key={token.id}
                  id={token.id}
                  agentName={token.agents?.name || 'Unknown agent'}
                  agentIcon={token.agents?.icon || '🤖'}
                  serviceName={token.service_name}
                  scopes={token.scopes}
                  purpose={token.purpose}
                  status={token.status as 'active' | 'expired' | 'revoked'}
                  createdAt={token.created_at}
                  expiresAt={token.expires_at}
                  userId={user.sub!}
                  mandateName={token.mandate_name}
                  constraintSummary={token.constraint_summary}
                  autoRevokeOnViolation={token.auto_revoke_on_violation}
                  onRevoke={(id) => {
                    setTokens(prev => prev.map(t => 
                      t.id === id ? { ...t, status: 'revoked' } : t
                    ));
                    fetchStats();
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Permission Graph */}
        <div className="mt-8">
          <PermissionGraph />
        </div>

        {/* Revocation Control */}
        <div className="mt-8">
          <RevocationControl />
        </div>
        
        {/* Accountability Report */}
        <div className="mt-8">
          {agents.length > 0 && (
            <AccountabilityReport agents={agents} />
          )}
        </div>

        {/* Audit Trail */}
        <div className="mt-8">
          <AuditTimeline />
        </div>

      </main>

      {showAddAgent && user.sub && (
        <AddAgentModal
          userId={user.sub}
          onClose={() => setShowAddAgent(false)}
          onSuccess={() => {
            fetchAgents();
            fetchStats();
          }}
        />
      )}

      {showIssueToken && user.sub && (
        <IssueMissionTokenModal
          userId={user.sub}
          onClose={() => setShowIssueToken(false)}
          onSuccess={() => {
            fetchTokens();
            fetchStats();
          }}
        />
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  );
}