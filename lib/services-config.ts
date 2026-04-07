export const SUPPORTED_SERVICES = [
  {
    id: 'google-oauth2',
    name: 'Gmail',
    icon: '📧',
    description: 'Read emails and calendar events on your behalf',
    connection: 'google-oauth2',
    scopes: ['openid', 'https://www.googleapis.com/auth/gmail.readonly'],
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: '🐙',
    description: 'Read repositories and profile information',
    connection: 'github',
    scopes: ['openid', 'read:user', 'public_repo'],
  },
];
