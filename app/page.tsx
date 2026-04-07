import Link from 'next/link';
import { Navbar } from '@/components/navbar';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        {/* Hero Section */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-1.5 text-sm text-gray-600 mb-8">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Built for the AI agent era
          </div>

          <h1 className="text-5xl sm:text-6xl font-semibold text-gray-900 leading-tight mb-6">
            Your AI agents shouldn&apos;t
            <br />
            <span className="text-gray-400">have blank checks.</span>
          </h1>

          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Sanctum gives them mission orders — scoped, time-limited, audited,
            and fully revocable. One permission wallet to control every AI agent
            you&apos;ve authorized to act on your behalf.
          </p>

          <div className="flex items-center justify-center gap-4">
            <a
              href="/api/auth/login?returnTo=/dashboard"
              className="bg-black text-white px-8 py-3 rounded-xl text-base font-medium hover:bg-gray-800 transition-colors"
            >
              Open your wallet →
            </a>
            <Link
              href="#how-it-works"
              className="text-gray-500 px-8 py-3 rounded-xl text-base hover:text-gray-900 transition-colors"
            >
              How it works
            </Link>
          </div>
        </section>

        {/* Feature Strip */}
        <section id="how-it-works" className="bg-gray-50 border-y border-gray-100 py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-lg">🎯</span>
                </div>
                <h3 className="font-medium text-gray-900 mb-2">Mission Tokens</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Agents get scoped, time-limited tokens for each task — not permanent access to everything.
                </p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-lg">🛡️</span>
                </div>
                <h3 className="font-medium text-gray-900 mb-2">Step-up Guard</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  High-risk actions require your explicit approval before the agent can proceed.
                </p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-lg">📋</span>
                </div>
                <h3 className="font-medium text-gray-900 mb-2">Full Audit Trail</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Every action is logged with token provenance. Revoke any agent in one tap.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 text-center text-sm text-gray-400">
          Built with Auth0 Token Vault · Sanctum © 2026
        </footer>
      </main>
    </div>
  );
}
