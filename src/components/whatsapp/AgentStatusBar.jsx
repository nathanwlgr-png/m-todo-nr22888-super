import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bot, Wifi, WifiOff, RefreshCw, ExternalLink } from 'lucide-react';

const AGENTS = [
  { id: 'whatsapp_nr22888_turbo', name: 'NR22888 Turbo', color: 'indigo' },
  { id: 'whatsapp_master_assistant', name: 'Nathan Master', color: 'green' },
];

export default function AgentStatusBar() {
  const [agents, setAgents] = useState(
    AGENTS.map(a => ({ ...a, status: 'checking', url: null, lastCheck: null }))
  );

  const checkAgentStatus = async (agentId) => {
    try {
      const url = base44.agents.getWhatsAppConnectURL(agentId);
      return { status: 'online', url };
    } catch {
      return { status: 'offline', url: null };
    }
  };

  const refreshAll = async () => {
    setAgents(prev => prev.map(a => ({ ...a, status: 'checking' })));
    const results = await Promise.all(AGENTS.map(a => checkAgentStatus(a.id)));
    setAgents(prev => prev.map((a, i) => ({
      ...a,
      status: results[i].status,
      url: results[i].url,
      lastCheck: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    })));
  };

  useEffect(() => {
    refreshAll();
    const interval = setInterval(refreshAll, 60000); // check every 60s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-slate-900 text-white rounded-xl p-3 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 text-xs text-slate-400 mr-2">
        <Bot className="w-4 h-4" />
        <span className="font-semibold text-slate-200">Agentes</span>
      </div>

      {agents.map(agent => (
        <div key={agent.id} className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-1.5">
          <div className="relative">
            {agent.status === 'checking' ? (
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            ) : agent.status === 'online' ? (
              <div className="w-2 h-2 rounded-full bg-green-400">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-ping absolute inset-0" />
              </div>
            ) : (
              <div className="w-2 h-2 rounded-full bg-red-500" />
            )}
          </div>

          <span className="text-xs font-medium">{agent.name}</span>

          <Badge className={
            agent.status === 'online' ? 'bg-green-500/20 text-green-400 text-[10px] border-0' :
            agent.status === 'offline' ? 'bg-red-500/20 text-red-400 text-[10px] border-0' :
            'bg-yellow-500/20 text-yellow-400 text-[10px] border-0'
          }>
            {agent.status === 'checking' ? '...' : agent.status === 'online' ? 'Online' : 'Offline'}
          </Badge>

          {agent.url && agent.status === 'online' && (
            <a href={agent.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3 h-3 text-slate-400 hover:text-white transition-colors" />
            </a>
          )}
        </div>
      ))}

      <button onClick={refreshAll} className="ml-auto text-slate-400 hover:text-white transition-colors">
        <RefreshCw className="w-3.5 h-3.5" />
      </button>

      {agents[0]?.lastCheck && (
        <span className="text-[10px] text-slate-500">Atualizado: {agents[0].lastCheck}</span>
      )}
    </div>
  );
}