'use client';
import { useState } from 'react';
import { toast } from 'sonner';

type AgentCardProps = {
  id: string;
  name: string;
  icon: string;
  description: string | null;
  createdAt: string;
  userId: string;
  identity_status?: string;
  onDelete: (id: string) => void;
};

export function AgentCard({
  id, name, icon, description, createdAt, userId, 
  identity_status = 'active', onDelete
}: AgentCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Remove ${name}?`)) return;
    setIsDeleting(true);
    try {
      await fetch('/api/agents', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: id, userId }),
      });
      toast.success(`${name} removed`);
      onDelete(id);
    } catch {
      toast.error('Failed to remove agent');
    } finally {
      setIsDeleting(false);
    }
  };

  const isSuspended = identity_status === 'suspended';

  return (
    <div className={`bg-white rounded-xl border p-4 flex items-center justify-between group ${
      isSuspended ? 'border-red-200 bg-red-50/30' : 'border-gray-200'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg border flex items-center justify-center text-xl ${
          isSuspended ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'
        }`}>
          {icon}
        </div>
        <div>
          <p className="font-medium text-gray-900 text-sm">{name}</p>
          {isSuspended && (
            <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-medium mt-0.5">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
              SUSPENDED
            </span>
          )}
          <p className="text-xs text-gray-500 mt-0.5">
            {description || 'AI Agent'} · Added {new Date(createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isSuspended ? (
          <div className="flex items-center gap-1 bg-red-50 rounded-full px-2 py-0.5 border border-red-200">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
            <span className="text-xs text-red-700">Suspended</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 bg-green-50 rounded-full px-2 py-0.5">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            <span className="text-xs text-green-700">Active</span>
          </div>
        )}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all text-lg leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
}
