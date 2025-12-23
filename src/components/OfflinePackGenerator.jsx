import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Wifi, WifiOff, Download, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Gerador de Pacote Offline
 * Prepara materiais de estudo e tarefas para trabalhar sem internet
 */
export default function OfflinePackGenerator() {
  const [preparing, setPreparing] = useState(false);
  const [ready, setReady] = useState(false);

  const { data: tasks = [] } = useQuery({
    queryKey: ['all-tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 100),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 100),
  });

  const prepareOfflinePack = async () => {
    setPreparing(true);
    try {
      // 1. Tarefas Prioritárias
      const urgentTasks = tasks.filter(t => 
        t.status === 'pendente' && 
        (t.priority === 'alta' || new Date(t.due_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
      ).slice(0, 10);

      // 2. Clientes Quentes
      const hotClients = clients.filter(c => c.status === 'quente').slice(0, 5);

      // 3. Guia de Hemogasometria (texto compacto)
      const hemoguideText = `
🐴 HEMOGASOMETRIA EQUINA - GUIA RÁPIDO

📊 O QUE AVALIA:
• PaO₂ (85-100 mmHg): Oxigenação pulmonar
• PaCO₂ (38-46 mmHg): Eficiência ventilação
• pH (7.35-7.45): Equilíbrio ácido-base
• Lactato (<2 repouso, 4-20 exercício): Fadiga muscular
• Eletrólitos (Na⁺, K⁺, Ca²⁺): Cãibras/arritmias
• Hematócrito (32-48%): Transporte O₂

🚨 QUANDO USAR:
1. Queda de performance repentina
2. Fadiga precoce (enduro/CCE)
3. EIPH - sangramento nasal pós-exercício
4. Cólica pós-exercício
5. Rabdomiólise (azotúria)
6. Monitoramento de treinamento
7. Pré-competição
8. Desidratação severa

✅ VANTAGENS:
• Diagnóstico em 2-5 min
• Previne mortalidade (exaustão, insuficiência respiratória)
• Otimiza performance atlética
• Diferencial competitivo (medicina esportiva)
• ROI: 1 diagnóstico salva cavalo R$ 500k+

📚 EVIDÊNCIAS:
• Lactato prediz performance (92% precisão)
• PaO₂ detecta EIPH (87% casos)
• Monitoramento reduz mortalidade enduro (45%)
• pH <7.30 = 78% queda performance
      `;

      // 4. Preparar pacote de texto offline
      const offlinePack = `
═══════════════════════════════════════
📦 PACOTE OFFLINE - ${new Date().toLocaleDateString('pt-BR')}
═══════════════════════════════════════

${hemoguideText}

═══════════════════════════════════════
📋 TAREFAS PRIORITÁRIAS (${urgentTasks.length})
═══════════════════════════════════════

${urgentTasks.map((t, i) => `
${i + 1}. ${t.title}
   Cliente: ${t.client_name || 'N/A'}
   Prioridade: ${t.priority?.toUpperCase()}
   Vencimento: ${t.due_date || 'N/A'}
   Descrição: ${t.description || 'Sem descrição'}
`).join('\n')}

═══════════════════════════════════════
🔥 CLIENTES QUENTES (${hotClients.length})
═══════════════════════════════════════

${hotClients.map((c, i) => `
${i + 1}. ${c.first_name} - ${c.clinic_name || 'N/A'}
   Score: ${c.purchase_score}% | Tipo: ${c.client_type}
   Dores: ${c.main_pains?.slice(0, 2).join(', ') || 'N/A'}
   Próxima ação: ${c.next_action || 'Definir estratégia'}
   Telefone: ${c.phone || 'N/A'}
`).join('\n')}

═══════════════════════════════════════
💡 TAREFAS SUGERIDAS PARA 1-2H OFFLINE:
═══════════════════════════════════════

1. Revisar guia de hemogasometria (15 min)
2. Planejar abordagem dos ${hotClients.length} clientes quentes (30 min)
3. Preparar scripts de contato personalizados (20 min)
4. Revisar objeções e respostas (15 min)
5. Definir próximos passos para cada tarefa prioritária (20 min)

✅ Total estimado: 1h40min
      `;

      // Copiar para clipboard
      await navigator.clipboard.writeText(offlinePack);
      
      // Salvar no localStorage também
      localStorage.setItem('offline_pack', offlinePack);
      localStorage.setItem('offline_pack_date', new Date().toISOString());

      setReady(true);
      toast.success('📦 Pacote Offline Pronto!', {
        description: 'Copiado! Cole no WhatsApp ou bloco de notas',
        duration: 5000
      });

    } catch (error) {
      console.error(error);
      toast.error('Erro ao preparar pacote');
    } finally {
      setPreparing(false);
    }
  };

  const downloadPack = () => {
    const pack = localStorage.getItem('offline_pack');
    if (!pack) {
      toast.error('Prepare o pacote primeiro');
      return;
    }

    const blob = new Blob([pack], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `offline-pack-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    toast.success('📥 Download iniciado!');
  };

  const sendToWhatsApp = async () => {
    const hemoguide = `🐴 *HEMOGASOMETRIA EQUINA - GUIA COMPLETO*

📊 *O QUE AVALIA:*
• *PaO₂ (85-100 mmHg)*: Oxigenação pulmonar - valores baixos = EIPH
• *PaCO₂ (38-46 mmHg)*: Eficiência ventilação - aumento = fadiga respiratória
• *pH (7.35-7.45)*: Equilíbrio ácido-base - <7.30 = 78% queda performance
• *Lactato*: <2 repouso, 4-20 exercício - indica metabolismo anaeróbico
• *Eletrólitos (Na⁺, K⁺, Ca²⁺)*: Previne cãibras, arritmias, cólica
• *Hematócrito (32-48%)*: Transporte O₂, monitora desidratação

🚨 *8 SITUAÇÕES CLÍNICAS:*
1. Queda de performance repentina
2. Fadiga precoce (enduro/CCE)
3. EIPH - sangramento nasal pós-exercício
4. Cólica pós-exercício (desequilíbrio eletrolítico)
5. Rabdomiólise/Azotúria (dor muscular intensa)
6. Monitoramento de treinamento
7. Pré-competição (avaliar condição)
8. Desidratação severa

✅ *VANTAGENS:*
• Diagnóstico em 4 minutos
• Previne mortalidade (exaustão, IR)
• Otimiza performance atlética
• Diferencial competitivo
• ROI: 1 diagnóstico salva cavalo R$ 500k+

📚 *7 EVIDÊNCIAS CIENTÍFICAS:*
1. Lactato prediz performance (92% precisão)
2. PaO₂ detecta EIPH (87% casos)
3. Monitoramento reduz mortalidade enduro (45%)
4. pH <7.30 = 78% queda performance
5. K⁺ alterado precede rabdomiólise 24-48h
6. Reduz tempo diagnóstico 70% vs lab externo
7. Eletrólitos previnem cólica em provas longas

🎯 *CONCLUSÃO:*
Indispensável para medicina esportiva equina. Um diagnóstico precoce justifica todo investimento.`;

    await navigator.clipboard.writeText(hemoguide);
    toast.success('📋 Guia copiado!', {
      description: 'Cole no WhatsApp para enviar',
      duration: 4000
    });
  };

  return (
    <Card className="p-5 bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center">
          {ready ? <CheckCircle2 className="w-6 h-6 text-white" /> : <WifiOff className="w-6 h-6 text-white" />}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800">Modo Offline N</h3>
          <p className="text-xs text-slate-600">
            {ready ? '✅ Pacote pronto (1-2h trabalho)' : 'Preparar materiais sem internet'}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <Button
          onClick={prepareOfflinePack}
          disabled={preparing}
          className="w-full bg-orange-600 hover:bg-orange-700"
        >
          {preparing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Preparando...
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 mr-2" />
              Ativar Modo Offline
            </>
          )}
        </Button>

        {ready && (
          <>
            <div className="p-3 bg-white rounded-lg border border-orange-200">
              <p className="text-sm font-semibold text-orange-800 mb-2">📦 Conteúdo preparado:</p>
              <ul className="text-xs text-slate-700 space-y-1">
                <li>✓ Guia Hemogasometria Completo</li>
                <li>✓ {tasks.filter(t => t.status === 'pendente' && t.priority === 'alta').length} Tarefas Urgentes</li>
                <li>✓ {clients.filter(c => c.status === 'quente').length} Clientes Quentes</li>
                <li>✓ Roteiro 1-2h de trabalho offline</li>
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={downloadPack}
                size="sm"
                variant="outline"
                className="border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                <Download className="w-3 h-3 mr-2" />
                Baixar
              </Button>
              <Button
                onClick={sendToWhatsApp}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Wifi className="w-3 h-3 mr-2" />
                WhatsApp
              </Button>
            </div>

            <p className="text-xs text-slate-600 text-center">
              💡 Pacote completo na área de transferência
            </p>
          </>
        )}
      </div>
    </Card>
  );
}