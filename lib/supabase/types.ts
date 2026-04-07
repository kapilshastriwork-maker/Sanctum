export type Agent = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ConnectedService = {
  id: string;
  user_id: string;
  agent_id: string | null;
  service_name: string;
  service_icon: string | null;
  scopes: string[];
  is_active: boolean;
  connected_at: string;
  expires_at: string | null;
};

export type MissionToken = {
  id: string;
  user_id: string;
  agent_id: string;
  service_name: string;
  scopes: string[];
  purpose: string;
  status: 'active' | 'expired' | 'revoked';
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
};

export type AuditEvent = {
  id: string;
  user_id: string;
  agent_id: string | null;
  mission_token_id: string | null;
  event_type: string;
  service_name: string | null;
  action: string;
  scope_used: string | null;
  payload: Record<string, unknown> | null;
  status: 'success' | 'blocked' | 'pending_approval' | 'denied';
  ip_address: string | null;
  created_at: string;
};

export type StepUpRequest = {
  id: string;
  user_id: string;
  agent_id: string;
  mission_token_id: string | null;
  action: string;
  reason: string;
  status: 'pending' | 'approved' | 'denied';
  created_at: string;
  resolved_at: string | null;
};
