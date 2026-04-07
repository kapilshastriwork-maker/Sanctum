'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { toast } from 'sonner';

type MandateToken = {
  id: string;
  mandate_name: string;
  service_name: string;
  status: string;
  forbidden_keywords: string[];
  max_actions_per_hour: number;
  auto_revoke_on_violation: boolean;
};

type ValidationResult = {
  allowed: boolean;
  reason: string;
  violationType?: string;
  autoRevoked?: boolean;
};

const SAFE_ACTIONS = [
  'Read latest 10 emails',
  'Summarize inbox from today',
  'List open pull requests',
  'Check commit history',
];

const RISKY_ACTIONS = [
  'Delete all emails in inbox',
  'Send bulk email to contacts',
  'Forward emails to external domain',
  'Force push to main branch',
  'Merge pull request without review',
  'Issue refund to customer',
];

export function ScopeEngineTester() {
  const { user } = useUser();
  const [tokens, setTokens] = useState<MandateToken[]>([]);
  const [selectedToken, setSelectedToken] = useState('');
  const [action, setAction] = useState('');
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [history, setHistory] = useState<{ action: string; result: ValidationResult; tokenName: string }[]>([]);

  useEffect(() => {
    if (!user?.sub) return;
    fetch(`/api/mission-tokens?userId=${encodeURIComponent(user.sub)}`)
      .then(r => r.json())
      .then(d => {
        const active = (d.tokens || []).filter(
          (t: MandateToken) => t.status === 'active' && t.mandate_name
        );
        setTokens(active);
        if (active.length > 0) setSelectedToken(active[0].id);
      });
  }, [user?.sub]);

  const validate = async () => {
    if (!selectedToken || !action.trim() || !user?.sub) return;
    setIsValidating(true);
    setResult(null);

    try {
      const res = await fetch('/api/scope-engine/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId: selectedToken,
          action: action.trim(),
          userId: user.sub,
        }),
      });

      const data: ValidationResult = await res.json();
      setResult(data);

      const token = tokens.find(t => t.id === selectedToken);
      setHistory(prev => [
        { action: action.trim(), result: data, tokenName: token?.mandate_name || 'Unknown' },
        ...prev.slice(0, 4),
      ]);

      if (data.allowed) {
        toast.success('Action permitted by scope engine');
      } else if (data.autoRevoked) {
        toast.error('Mandate auto-revoked!', {
          description: data.reason,
          duration: 6000,
        });
        fetch(`/api/mission-tokens?userId=${encodeURIComponent(user.sub)}`)
          .then(r => r.json())
          .then(d => {
            const active = (d.tokens || []).filter(
              (t: MandateToken) => t.status === 'active' && t.mandate_name
            );
            setTokens(active);
          });
      } else {
        toast.error('Action blocked by scope engine');
      }
    } catch {
      toast.error('Scope engine error');
    } finally {
      setIsValidating(false);
    }
  };

  const selectedTokenData = tokens.find(t => t.id === selectedToken);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-3 p-5 border-b border-gray-100">
        <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
          <span className="text-base">⚙️</span>
        </div>
        <div>
          <h3 className="font-medium text-gray-900 text-sm">Scope Engine</h3>
          <p className="text-xs text-gray-500">
            Test mandate enforcement — before execution, not after
          </p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {tokens.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">
              No active mandate tokens. Issue a mandate token first.
            </p>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Active mandate
              </label>
              <div className="space-y-1.5">
                {tokens.map(token => (
                  <button
                    key={token.id}
                    onClick={() => setSelectedToken(token.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors ${
                      selectedToken === token.id
                        ? 'border-purple-400 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">
                        {token.mandate_name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {token.service_name === 'google-oauth2' ? '📧' : '🐙'}
                        {token.max_actions_per_hour > 0 && ` · ${token.max_actions_per_hour}/hr`}
                      </span>
                    </div>
                    {token.forbidden_keywords?.length > 0 && (
                      <p className="text-xs text-red-500 mt-0.5">
                        Blocks: {token.forbidden_keywords.slice(0, 3).join(', ')}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Quick test
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <p className="text-xs green-600 font-medium mb-1">
                    Safe actions
                  </p>
                  {SAFE_ACTIONS.slice(0, 2).map(a => (
                    <button
                      key={a}
                      onClick={() => setAction(a)}
                      className="w-full text-left text-xs bg-green-50 border border-green-200 text-green-700 px-2 py-1.5 rounded mb-1 hover:bg-green-100 transition-colors"
                    >
                      {a}
                    </button>
                  ))}
                </div>
                <div>
                  <p className="text-xs red-600 font-medium mb-1">
                    Risky actions
                  </p>
                  {RISKY_ACTIONS.slice(0, 2).map(a => (
                    <button
                      key={a}
                      onClick={() => setAction(a)}
                      className="w-full text-left text-xs bg-red-50 border border-red-200 text-red-700 px-2 py-1.5 rounded mb-1 hover:bg-red-100 transition-colors"
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                Action to validate
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={action}
                  onChange={e => setAction(e.target.value)}
                  placeholder="e.g. Send email to all contacts"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  onKeyDown={e => e.key === 'Enter' && validate()}
                />
                <button
                  onClick={validate}
                  disabled={isValidating || !action.trim() || !selectedToken}
                  className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 whitespace-nowrap"
                >
                  {isValidating ? 'Checking...' : 'Validate'}
                </button>
              </div>
            </div>

            {result && (
              <div className={`rounded-lg border p-3 ${
                result.allowed
                  ? 'bg-green-50 border-green-200'
                  : result.autoRevoked
                    ? 'bg-red-50 border-red-300'
                    : 'bg-orange-50 border-orange-200'
              }`}>
                <div className="flex items-start gap-2">
                  <span className="text-lg">
                    {result.allowed ? '✅' : result.autoRevoked ? '🚨' : '🚫'}
                  </span>
                  <div>
                    <p className={`text-sm font-medium ${
                      result.allowed ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {result.allowed
                        ? 'Action permitted'
                        : result.autoRevoked
                          ? 'BLOCKED + Mandate auto-revoked!'
                          : 'Action blocked'}
                    </p>
                    <p className={`text-xs mt-0.5 ${
                      result.allowed ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {result.reason}
                    </p>
                    {result.violationType && (
                      <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded mt-1 inline-block">
                        {result.violationType}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {history.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Validation history
                </p>
                <div className="space-y-1.5">
                  {history.map((item, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${
                        item.result.allowed
                          ? 'bg-green-50 border border-green-100'
                          : 'bg-red-50 border border-red-100'
                      }`}
                    >
                      <span className={`flex-1 truncate ${
                        item.result.allowed ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {item.result.allowed ? '✅' : '🚫'} {item.action}
                      </span>
                      {item.result.autoRevoked && (
                        <span className="text-xs bg-red-200 text-red-800 px-1.5 py-0.5 rounded ml-2 flex-shrink-0">
                          Revoked
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
