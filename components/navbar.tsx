'use client';
import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';
import Image from 'next/image';

export function Navbar() {
  const { user, isLoading } = useUser();

  return (
    <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">S</span>
            </div>
            <span className="font-semibold text-gray-900 text-lg">Sanctum</span>
          </Link>
          <div className="flex items-center gap-4">
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/audit"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Audit log
                </Link>
                <Link
                  href="/scope-registry"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Scope registry
                </Link>
                <div className="flex items-center gap-2">
                  {user.picture && (
                    <Image
                      src={user.picture}
                      alt={user.name || 'User'}
                      width={32}
                      height={32}
                      className="rounded-full border border-gray-200"
                    />
                  )}
                  <a
                    href="/api/auth/logout"
                    className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    Sign out
                  </a>
                </div>
              </div>
            ) : (
              <a
                href="/api/auth/login"
                className="bg-black text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Sign in
              </a>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
