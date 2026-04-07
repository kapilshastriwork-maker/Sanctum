'use client';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Navbar } from '@/components/navbar';
import { SCOPE_REGISTRY } from '@/lib/scope-registry';

export default function ScopeRegistryPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.push('/api/auth/login?returnTo=/scope-registry');
  }, [user, isLoading, router]);

  if (isLoading || !user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <a href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">← Dashboard</a>
          <h1 className="text-2xl font-semibold text-gray-900 mt-2">Scope Registry</h1>
          <p className="text-gray-500 mt-1">
            Intent-based behavioral mandates — human-readable contracts that replace raw OAuth scope strings.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Why mandates instead of scopes?</span>{' '}
            Traditional OAuth scopes like <code className="bg-blue-100 px-1 rounded text-xs">gmail.readonly</code>{' '}
            tell you what API the agent can call — not what it is allowed to accomplish or what constraints 
            it must respect. Mandates encode behavioral contracts: what the agent can do, how many times, 
            and what triggers automatic revocation.
          </p>
        </div>

        <div className="space-y-4">
          {SCOPE_REGISTRY.map(scope => (
            <div key={scope.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center text-xl">
                    {scope.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{scope.name}</h3>
                    <p className="text-sm text-gray-500">{scope.description}</p>
                  </div>
                </div>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-mono">{scope.id}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Maps to OAuth scopes</p>
                  <div className="flex flex-wrap gap-1">
                    {scope.maps_to_scopes.map(s => (
                      <span key={s} className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{s}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Constraints</p>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600">Max {scope.constraints.max_actions_per_hour} actions/hour</p>
                    {scope.constraints.forbidden_keywords.length > 0 && (
                      <p className="text-xs text-red-600">Blocks: {scope.constraints.forbidden_keywords.join(', ')}</p>
                    )}
                    {scope.constraints.auto_revoke_on_violation && (
                      <p className="text-xs text-orange-600 font-medium">Auto-revokes on violation</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-500">Step-up: {scope.step_up_trigger}</p>
                <p className="text-xs text-gray-400 italic">e.g. "{scope.example_use}"</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}