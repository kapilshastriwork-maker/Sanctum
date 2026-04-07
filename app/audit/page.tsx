'use client';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Navbar } from '@/components/navbar';
import { AuditTimeline } from '@/components/audit-timeline';

export default function AuditPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/api/auth/login?returnTo=/audit');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <a 
              href="/dashboard" 
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← Dashboard
            </a>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Audit Trail
          </h1>
          <p className="text-gray-500 mt-1">
            Every action your agents have taken, cryptographically signed 
            and tamper-evident.
          </p>
        </div>

        <AuditTimeline />
      </main>
    </div>
  );
}