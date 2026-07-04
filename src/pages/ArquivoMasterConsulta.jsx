import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Archive, Info } from 'lucide-react';

const STALE = 5 * 60 * 1000;

function LegacyCard({ children }) {
  return (
    <div className="rounded-xl p-3" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)' }}>
      {children}
    </div>
  );
}

function LegacyList({ items, emptyLabel, renderItem }) {
  if (!items.length) {
    return <p className="text-xs text-slate-500 text-center py-10">{emptyLabel}</p>;
  }
  return <div className="space-y-2">{items.map(renderItem)}</div>;
}

export default function ArquivoMasterConsulta() {
  const { data: clients = [] } = useQuery({
    queryKey: ['arquivo-clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 100).catch(() => []),
    staleTime: STALE,
  });
  const { data: tasks = [] } = useQuery({
    queryKey: ['arquivo-tasks'],
    queryFn: () => base44.entities.Task.list('-updated_date', 100).catch(() => []),
    staleTime: STALE,
  });
  const { data: messages = [] } = useQuery({
    queryKey: ['arquivo-messages'],
    queryFn: () => base44.entities.WhatsAppMessage?.list('-created_date', 100).catch(() => []),
    staleTime: STALE,
  });
  const { data: visits = [] } = useQuery({
    queryKey: ['arquivo-visits'],
    queryFn: () => base44.entities.Visit.list('-scheduled_date', 100).catch(() => []),
    staleTime: STALE,
  });
  const { data: sales = [] } = useQuery({
    queryKey: ['arquivo-sales'],
    queryFn: () => base44.entities.Sale?.list('-created_date', 100).catch(() => []),
    staleTime: STALE,
  });

  const safeClients = Array.isArray(clients) ? clients : [];
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safeMessages = Array.isArray(messages) ? messages : [];
  const safeVisits = Array.isArray(visits) ? visits : [];
  const safeSales = Array.isArray(sales) ? sales : [];

  return (
    <div className="min-h-screen p-4 pb-24" style={{ background: '#0a0a0a' }}>
      <div className="flex items-center gap-2 mb-4">
        <Archive className="w-5 h-5 text-yellow-500" />
        <div>
          <h1 className="text-base font-black text-white">Arquivo Master / Consulta</h1>
          <p className="text-[10px] text-slate-500">Somente leitura — nenhum dado é alterado aqui</p>
        </div>
      </div>

      <Tabs defaultValue="clientes">
        <TabsList className="grid grid-cols-3 gap-1 h-auto p-1 mb-2" style={{ background: '#111' }}>
          <TabsTrigger value="clientes" className="text-[10px] py-2">Clientes</TabsTrigger>
          <TabsTrigger value="tarefas" className="text-[10px] py-2">Tarefas</TabsTrigger>
          <TabsTrigger value="mensagens" className="text-[10px] py-2">Mensagens</TabsTrigger>
        </TabsList>
        <TabsList className="grid grid-cols-3 gap-1 h-auto p-1 mb-4" style={{ background: '#111' }}>
          <TabsTrigger value="visitas" className="text-[10px] py-2">Visitas</TabsTrigger>
          <TabsTrigger value="vendas" className="text-[10px] py-2">Vendas</TabsTrigger>
          <TabsTrigger value="observacoes" className="text-[10px] py-2">Observações</TabsTrigger>
        </TabsList>

        <TabsContent value="clientes">
          <LegacyList
            items={safeClients}
            emptyLabel="Nenhum cliente legado encontrado."
            renderItem={(c) => (
              <LegacyCard key={c.id}>
                <p className="text-xs font-bold text-white">{c.first_name || c.full_name || 'Sem nome'}{c.clinic_name ? ` • ${c.clinic_name}` : ''}</p>
                <p className="text-[10px] text-slate-500">{c.phone || 'sem telefone'} • {c.city || 'sem cidade'}</p>
              </LegacyCard>
            )}
          />
        </TabsContent>

        <TabsContent value="tarefas">
          <LegacyList
            items={safeTasks}
            emptyLabel="Nenhuma tarefa legada encontrada."
            renderItem={(t) => (
              <LegacyCard key={t.id}>
                <p className="text-xs font-bold text-white">{t.title}</p>
                <p className="text-[10px] text-slate-500">{t.client_name || ''} • {t.status || 'pendente'}</p>
              </LegacyCard>
            )}
          />
        </TabsContent>

        <TabsContent value="mensagens">
          <LegacyList
            items={safeMessages}
            emptyLabel="Nenhuma mensagem legada encontrada."
            renderItem={(m) => (
              <LegacyCard key={m.id}>
                <p className="text-xs font-bold text-white">{m.client_name || 'Cliente'}</p>
                <p className="text-[10px] text-slate-400">{(m.message || m.content || '').slice(0, 120)}</p>
              </LegacyCard>
            )}
          />
        </TabsContent>

        <TabsContent value="visitas">
          <LegacyList
            items={safeVisits}
            emptyLabel="Nenhuma visita legada encontrada."
            renderItem={(v) => (
              <LegacyCard key={v.id}>
                <p className="text-xs font-bold text-white">{v.client_name}</p>
                <p className="text-[10px] text-slate-500">{v.scheduled_date ? new Date(v.scheduled_date).toLocaleDateString('pt-BR') : ''} • {v.status || ''}</p>
              </LegacyCard>
            )}
          />
        </TabsContent>

        <TabsContent value="vendas">
          <LegacyList
            items={safeSales}
            emptyLabel="Nenhuma venda legada encontrada."
            renderItem={(s) => (
              <LegacyCard key={s.id}>
                <p className="text-xs font-bold text-white">{s.client_name || s.cliente_nome || 'Cliente'}</p>
                <p className="text-[10px] text-slate-500">{s.equipment_name || s.equipamento || ''} {s.value ? `• R$ ${Number(s.value).toLocaleString('pt-BR')}` : ''}</p>
              </LegacyCard>
            )}
          />
        </TabsContent>

        <TabsContent value="observacoes">
          <LegacyCard>
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-300 leading-relaxed">
                Esta área reúne o histórico legado do CRM NR22888 para fins de consulta e arquivo.
                Todos os registros originais foram preservados — nenhum dado, entidade ou preço foi removido ou alterado.
                Para operação comercial ativa, utilize o CRM oficial SEAMATY: NR22888 SuperAgent.
              </p>
            </div>
          </LegacyCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}