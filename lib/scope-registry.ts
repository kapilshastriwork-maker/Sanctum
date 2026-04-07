export type IntentScope = {
  id: string;
  name: string;
  description: string;
  icon: string;
  service: string;
  maps_to_scopes: string[];
  constraints: {
    max_actions_per_hour: number;
    forbidden_keywords: string[];
    domain_whitelist: string[];
    auto_revoke_on_violation: boolean;
  };
  step_up_trigger: string;
  example_use: string;
};

export const SCOPE_REGISTRY: IntentScope[] = [
  {
    id: 'read_inbox_summary',
    name: 'Read inbox summary',
    description: 'Read and summarize emails — no sending, no deletion',
    icon: '📨',
    service: 'google-oauth2',
    maps_to_scopes: ['gmail.readonly'],
    constraints: {
      max_actions_per_hour: 20,
      forbidden_keywords: ['delete', 'send', 'forward', 'reply'],
      domain_whitelist: [],
      auto_revoke_on_violation: true,
    },
    step_up_trigger: 'Reading more than 50 emails',
    example_use: 'Summarize my inbox from today',
  },
  {
    id: 'handle_client_escalation',
    name: 'Handle client escalation',
    description: 'Read and respond to escalation tickets — no refunds, no account changes',
    icon: '🎯',
    service: 'google-oauth2',
    maps_to_scopes: ['gmail.readonly', 'gmail.send'],
    constraints: {
      max_actions_per_hour: 10,
      forbidden_keywords: ['refund', 'delete account', 'cancel subscription'],
      domain_whitelist: [],
      auto_revoke_on_violation: true,
    },
    step_up_trigger: 'Responding to more than 5 tickets',
    example_use: 'Handle urgent customer complaints in my inbox',
  },
  {
    id: 'review_pr_status',
    name: 'Review PR status',
    description: 'Read PRs and issues — no pushing, no merging, no deletion',
    icon: '🔍',
    service: 'github',
    maps_to_scopes: ['read:user', 'public_repo'],
    constraints: {
      max_actions_per_hour: 30,
      forbidden_keywords: ['delete', 'force push', 'merge', 'close'],
      domain_whitelist: [],
      auto_revoke_on_violation: true,
    },
    step_up_trigger: 'Accessing more than 10 repositories',
    example_use: 'Check status of all open pull requests',
  },
  {
    id: 'monitor_repo_activity',
    name: 'Monitor repo activity',
    description: 'Watch commits and issues — read-only, no write operations',
    icon: '👁️',
    service: 'github',
    maps_to_scopes: ['read:user', 'public_repo'],
    constraints: {
      max_actions_per_hour: 50,
      forbidden_keywords: ['push', 'commit', 'delete', 'create branch'],
      domain_whitelist: [],
      auto_revoke_on_violation: false,
    },
    step_up_trigger: 'Never — read-only mandate',
    example_use: 'Alert me to any new issues or commits',
  },
];

export function getScopeById(id: string): IntentScope | undefined {
  return SCOPE_REGISTRY.find(s => s.id === id);
}

export function getScopesByService(service: string): IntentScope[] {
  return SCOPE_REGISTRY.filter(s => s.service === service);
}

export function buildConstraintSummary(scope: IntentScope): string {
  const parts = [];
  if (scope.constraints.max_actions_per_hour > 0) {
    parts.push(`Max ${scope.constraints.max_actions_per_hour} actions/hr`);
  }
  if (scope.constraints.forbidden_keywords.length > 0) {
    parts.push(`Blocks: ${scope.constraints.forbidden_keywords.slice(0, 2).join(', ')}`);
  }
  if (scope.constraints.auto_revoke_on_violation) {
    parts.push('Auto-revokes on violation');
  }
  return parts.join(' · ');
}
