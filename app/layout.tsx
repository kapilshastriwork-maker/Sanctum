import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Auth0Provider } from '@/providers/auth0-provider';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sanctum — Permission Wallet for AI Agents',
  description: 'Scope, audit, and revoke what every AI agent is authorized to do.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Auth0Provider>
          {children}
          <Toaster position="bottom-right" richColors />
        </Auth0Provider>
      </body>
    </html>
  );
}
