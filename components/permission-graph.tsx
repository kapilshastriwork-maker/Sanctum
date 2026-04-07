'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

type Node = {
  id: string;
  label: string;
  icon: string;
  type: 'user' | 'agent' | 'service' | 'vault';
  x: number;
  y: number;
  color: string;
};

type Edge = {
  id: string;
  from: string;
  to: string;
  label: string;
  status: 'active' | 'revoked' | 'pending';
  animated: boolean;
};

type GraphData = {
  agents: { id: string; name: string; icon: string }[];
  services: { id: string; name: string; icon: string; isConnected: boolean }[];
  tokens: { 
    id: string; 
    agent_id: string; 
    service_name: string; 
    status: string;
    purpose: string;
  }[];
};

export function PermissionGraph() {
  const { user } = useUser();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const [graphData, setGraphData] = useState<GraphData>({
    agents: [], services: [], tokens: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  const tickRef = useRef(0);

  const fetchGraphData = useCallback(async () => {
    if (!user?.sub) return;
    try {
      const [agentsRes, servicesRes, tokensRes] = await Promise.all([
        fetch(`/api/agents?userId=${encodeURIComponent(user.sub)}`),
        fetch(`/api/connections?userId=${encodeURIComponent(user.sub)}`),
        fetch(`/api/mission-tokens?userId=${encodeURIComponent(user.sub)}`),
      ]);
      const agentsData = await agentsRes.json();
      const servicesData = await servicesRes.json();
      const tokensData = await tokensRes.json();

      setGraphData({
        agents: agentsData.agents || [],
        services: (servicesData.services as Array<{id: string; name: string; isConnected: boolean}> || []).filter((s) => s.isConnected),
        tokens: tokensData.tokens || [],
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.sub]);

  useEffect(() => {
    fetchGraphData();
    const interval = setInterval(fetchGraphData, 10000);
    return () => clearInterval(interval);
  }, [fetchGraphData]);

  useEffect(() => {
    if (!graphData.agents.length && !graphData.services.length) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width = W;
    canvas.height = H;

    const cx = W / 2;
    const cy = H / 2;

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    nodes.push({
      id: 'user',
      label: user?.name?.split(' ')[0] || 'You',
      icon: '👤',
      type: 'user',
      x: cx,
      y: cy,
      color: '#111827',
    });

    nodes.push({
      id: 'vault',
      label: 'Token Vault',
      icon: '🔐',
      type: 'vault',
      x: cx,
      y: cy - 120,
      color: '#7C3AED',
    });

    edges.push({
      id: 'user-vault',
      from: 'user',
      to: 'vault',
      label: 'Auth0',
      status: 'active',
      animated: true,
    });

    graphData.agents.forEach((agent, i) => {
      const angle = (Math.PI * 0.8) + (i * (Math.PI * 0.4) / Math.max(graphData.agents.length - 1, 1));
      const radius = 140;
      nodes.push({
        id: `agent-${agent.id}`,
        label: agent.name,
        icon: agent.icon,
        type: 'agent',
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        color: '#1D4ED8',
      });

      edges.push({
        id: `user-agent-${agent.id}`,
        from: 'user',
        to: `agent-${agent.id}`,
        label: 'registered',
        status: 'active',
        animated: false,
      });
    });

    graphData.services.forEach((service, i) => {
      const angle = -(Math.PI * 0.3) + (i * (Math.PI * 0.6) / Math.max(graphData.services.length - 1, 1));
      const radius = 150;
      nodes.push({
        id: `service-${service.id}`,
        label: service.name === 'google-oauth2' ? 'Gmail' : 'GitHub',
        icon: service.name === 'google-oauth2' ? '📧' : '🐙',
        type: 'service',
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        color: '#059669',
      });

      edges.push({
        id: `vault-service-${service.id}`,
        from: 'vault',
        to: `service-${service.id}`,
        label: 'OAuth token',
        status: 'active',
        animated: true,
      });
    });

    graphData.tokens.forEach(token => {
      const agentNodeId = `agent-${token.agent_id}`;
      const serviceNodeId = `service-${token.service_name}`;
      const agentExists = nodes.find(n => n.id === agentNodeId);
      const serviceExists = nodes.find(n => n.id === serviceNodeId);

      if (agentExists && serviceExists) {
        edges.push({
          id: `token-${token.id}`,
          from: agentNodeId,
          to: serviceNodeId,
          label: token.status === 'active' ? 'mission token' : token.status,
          status: token.status === 'active' ? 'active' : 'revoked',
          animated: token.status === 'active',
        });
      }
    });

    nodesRef.current = nodes;
    edgesRef.current = edges;

    const draw = () => {
      tickRef.current += 1;
      ctx.clearRect(0, 0, W, H);

      ctx.strokeStyle = '#f3f4f6';
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y < H; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      edges.forEach(edge => {
        const fromNode = nodes.find(n => n.id === edge.from);
        const toNode = nodes.find(n => n.id === edge.to);
        if (!fromNode || !toNode) return;

        const dx = toNode.x - fromNode.x;
        const dy = toNode.y - fromNode.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const ux = dx / dist;
        const uy = dy / dist;

        const startX = fromNode.x + ux * 28;
        const startY = fromNode.y + uy * 28;
        const endX = toNode.x - ux * 28;
        const endY = toNode.y - uy * 28;

        ctx.save();
        
        if (edge.status === 'revoked') {
          ctx.strokeStyle = '#EF4444';
          ctx.setLineDash([4, 4]);
          ctx.lineWidth = 1.5;
        } else if (edge.animated) {
          ctx.strokeStyle = '#8B5CF6';
          ctx.setLineDash([6, 4]);
          ctx.lineDashOffset = -(tickRef.current * 0.5);
          ctx.lineWidth = 2;
        } else {
          ctx.strokeStyle = '#D1D5DB';
          ctx.setLineDash([]);
          ctx.lineWidth = 1.5;
        }

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        if (edge.status !== 'revoked') {
          const angle = Math.atan2(dy, dx);
          ctx.fillStyle = edge.animated ? '#8B5CF6' : '#D1D5DB';
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(endX, endY);
          ctx.lineTo(
            endX - 10 * Math.cos(angle - 0.4),
            endY - 10 * Math.sin(angle - 0.4)
          );
          ctx.lineTo(
            endX - 10 * Math.cos(angle + 0.4),
            endY - 10 * Math.sin(angle + 0.4)
          );
          ctx.closePath();
          ctx.fill();
        }

        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        ctx.fillStyle = edge.status === 'revoked' ? '#EF4444' : '#9CA3AF';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(edge.label, midX, midY - 6);

        ctx.restore();
      });

      nodes.forEach(node => {
        ctx.save();

        if (node.type === 'vault') {
          const pulse = Math.sin(tickRef.current * 0.05) * 0.3 + 0.7;
          ctx.shadowColor = '#7C3AED';
          ctx.shadowBlur = 20 * pulse;
        }

        const radius = node.type === 'user' ? 32 : node.type === 'vault' ? 28 : 26;
        
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        
        const colorMap: Record<string, string> = {
          user: '#111827',
          vault: '#7C3AED',
          agent: '#1D4ED8',
          service: '#059669',
        };
        ctx.fillStyle = colorMap[node.type] || '#111827';
        ctx.fill();

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([]);
        ctx.stroke();

        ctx.shadowBlur = 0;

        ctx.font = `${node.type === 'user' ? 18 : 16}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'white';
        ctx.fillText(node.icon, node.x, node.y);

        ctx.font = '11px sans-serif';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#374151';
        ctx.shadowColor = 'white';
        ctx.shadowBlur = 4;
        ctx.fillText(node.label, node.x, node.y + radius + 6);
        ctx.shadowBlur = 0;

        ctx.restore();
      });

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [graphData, user?.name]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Permission Graph
          </h2>
          <p className="text-sm text-gray-500">
            Live visualization of agent authorization flows
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-purple-500" style={{backgroundImage: 'repeating-linear-gradient(90deg, #8B5CF6 0, #8B5CF6 6px, transparent 6px, transparent 10px)'}} />
            <span>Token Vault</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-gray-300" />
            <span>Registered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-red-400" style={{backgroundImage: 'repeating-linear-gradient(90deg, #EF4444 0, #EF4444 4px, transparent 4px, transparent 8px)'}} />
            <span>Revoked</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="h-80 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading graph...</p>
          </div>
        </div>
      ) : graphData.agents.length === 0 && graphData.services.length === 0 ? (
        <div className="h-80 flex items-center justify-center">
          <div className="text-center">
            <p className="text-4xl mb-3">🕸️</p>
            <p className="text-sm font-medium text-gray-900">No connections yet</p>
            <p className="text-xs text-gray-500 mt-1">
              Register agents and connect services to see the graph
            </p>
          </div>
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          className="w-full"
          style={{ height: '360px' }}
        />
      )}

      <div className="flex items-center justify-center gap-6 px-5 py-3 border-t border-gray-100 bg-gray-50">
        {[
          { color: '#111827', label: 'You' },
          { color: '#7C3AED', label: 'Token Vault' },
          { color: '#1D4ED8', label: 'Agent' },
          { color: '#059669', label: 'Service' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-gray-600">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}