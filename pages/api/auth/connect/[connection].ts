import { handleLogin } from '@auth0/nextjs-auth0';
import type { NextApiRequest, NextApiResponse } from 'next';

const connectionConfig: Record<string, {
  connection: string;
  scope: string;
  returnTo: string;
  extraParams?: Record<string, string>;
}> = {
  'github': {
    connection: 'github',
    scope: 'openid profile email',
    returnTo: '/dashboard?connected=github',
  },
  'google-oauth2': {
    connection: 'google-oauth2',
    scope: 'openid profile email offline_access',
    returnTo: '/dashboard?connected=google-oauth2',
    extraParams: {
      access_type: 'offline',
      prompt: 'consent',
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { connection } = req.query;
  const connectionName = Array.isArray(connection) ? connection[0] : connection;
  const config = connectionConfig[connectionName || ''];

  if (!config) {
    return res.status(404).json({ error: 'Connection not found' });
  }

  return handleLogin({
    authorizationParams: {
      connection: config.connection,
      scope: config.scope,
      ...config.extraParams,
    },
    returnTo: config.returnTo,
  })(req, res);
}
