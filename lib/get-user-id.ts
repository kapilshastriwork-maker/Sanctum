import { cookies } from 'next/headers';

export async function getUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    
    // Auth0 v3 stores session in 'appSession' cookie
    // It's an encrypted JWT - we can't decode it without the secret
    // Instead, use the /api/auth/me endpoint data approach
    // or use a hash of the cookie as a stable user identifier
    
    const sessionCookie = cookieStore.get('appSession');
    if (!sessionCookie?.value) return null;
    
    // Create a stable hash from the session cookie
    // This gives us a consistent user ID without needing to decrypt
    const encoder = new TextEncoder();
    const data = encoder.encode(sessionCookie.value);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex.slice(0, 32);
  } catch {
    return null;
  }
}
