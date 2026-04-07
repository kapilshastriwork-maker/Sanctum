import { supabaseServer } from './supabase/server';

export type ValidationResult = {
  allowed: boolean;
  reason: string;
  violationType?: 'forbidden_keyword' | 'rate_limit' | 'expired' | 'revoked';
  autoRevoked?: boolean;
};

export async function validateAction(
  tokenId: string,
  action: string,
  userId: string
): Promise<ValidationResult> {
  try {
    const { data: token, error } = await supabaseServer
      .from('mission_tokens')
      .select('*')
      .eq('id', tokenId)
      .eq('user_id', userId)
      .single();

    if (error || !token) {
      return { allowed: false, reason: 'Mandate token not found' };
    }

    if (token.status === 'revoked') {
      return { 
        allowed: false, 
        reason: 'Mandate token has been revoked',
        violationType: 'revoked'
      };
    }

    if (new Date(token.expires_at) < new Date()) {
      await supabaseServer
        .from('mission_tokens')
        .update({ status: 'expired' })
        .eq('id', tokenId);
      return { 
        allowed: false, 
        reason: 'Mandate token has expired',
        violationType: 'expired'
      };
    }

    if (token.forbidden_keywords && token.forbidden_keywords.length > 0) {
      const actionLower = action.toLowerCase();
      const violatedKeyword = token.forbidden_keywords.find(
        (keyword: string) => actionLower.includes(keyword.toLowerCase())
      );

      if (violatedKeyword) {
        await supabaseServer.from('audit_events').insert({
          user_id: userId,
          agent_id: token.agent_id,
          mission_token_id: tokenId,
          event_type: 'mandate_violation',
          action: `VIOLATION: "${action}" contains forbidden keyword "${violatedKeyword}"`,
          service_name: token.service_name,
          scope_used: token.mandate_name || 'unknown',
          status: 'blocked',
        });

        if (token.auto_revoke_on_violation) {
          await supabaseServer
            .from('mission_tokens')
            .update({ 
              status: 'revoked',
              revoked_at: new Date().toISOString(),
            })
            .eq('id', tokenId);

          await supabaseServer.from('audit_events').insert({
            user_id: userId,
            agent_id: token.agent_id,
            mission_token_id: tokenId,
            event_type: 'mandate_auto_revoked',
            action: `AUTO-REVOKED: Mandate "${token.mandate_name}" violated — token invalidated`,
            service_name: token.service_name,
            status: 'blocked',
          });

          return {
            allowed: false,
            reason: `Action contains forbidden keyword "${violatedKeyword}". Mandate auto-revoked.`,
            violationType: 'forbidden_keyword',
            autoRevoked: true,
          };
        }

        await supabaseServer
          .from('mission_tokens')
          .update({ violation_count: (token.violation_count || 0) + 1 })
          .eq('id', tokenId);

        return {
          allowed: false,
          reason: `Action contains forbidden keyword "${violatedKeyword}"`,
          violationType: 'forbidden_keyword',
          autoRevoked: false,
        };
      }
    }

    if (token.max_actions_per_hour && token.max_actions_per_hour > 0) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count } = await supabaseServer
        .from('audit_events')
        .select('id', { count: 'exact', head: true })
        .eq('mission_token_id', tokenId)
        .eq('status', 'success')
        .gte('created_at', oneHourAgo);

      if ((count || 0) >= token.max_actions_per_hour) {
        return {
          allowed: false,
          reason: `Rate limit exceeded: max ${token.max_actions_per_hour} actions/hour for this mandate`,
          violationType: 'rate_limit',
        };
      }
    }

    await supabaseServer.from('audit_events').insert({
      user_id: userId,
      agent_id: token.agent_id,
      mission_token_id: tokenId,
      event_type: 'mandate_action_allowed',
      action: `ALLOWED: "${action}" — within mandate "${token.mandate_name}"`,
      service_name: token.service_name,
      scope_used: token.mandate_name || 'unknown',
      status: 'success',
    });

    return {
      allowed: true,
      reason: `Action permitted under mandate: ${token.mandate_name}`,
    };
  } catch (error) {
    return { 
      allowed: false, 
      reason: `Scope engine error: ${String(error)}` 
    };
  }
}
