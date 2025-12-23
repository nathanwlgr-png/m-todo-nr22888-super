import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Database, RefreshCw, Loader2, Upload, Download, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Integrador de CRM Externo com IA
 * Sincronização bidirecional, mapeamento inteligente e análise de dados
 */
export default function CRMExternalSync() {
  const [syncing, setSyncing] = useState(false);
  const [crmData, setCrmData] = useState('');
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 500),
  });

  const createClientMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['clients']);
    }
  });

  const updateClientMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Client.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['clients']);
    }
  });

  const importFromCRM = async () => {
    if (!crmData.trim()) {
      toast.error('Cole dados do CRM externo');
      return;
    }

    setSyncing(true);
    try {
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um especialista em integração de CRMs. Analise estes dados de CRM externo e mapeie para nosso formato.

DADOS DO CRM EXTERNO:
${crmData}

ESTRUTURA ESPERADA (nosso CRM):
- first_name (obrigatório)
- full_name
- email
- phone (formato: 5511999999999)
- clinic_name
- city
- client_type (clinica_pequena, clinica_media, hospital_veterinario, etc)
- decision_role (proprietario, veterinario_responsavel, etc)
- status (quente, morno, frio)
- purchase_score (0-100)
- notes

Retorne JSON:
{
  "clients": [
    {
      "first_name": "...",
      "full_name": "...",
      "email": "...",
      "phone": "...",
      "clinic_name": "...",
      "city": "...",
      "client_type": "...",
      "decision_role": "...",
      "status": "...",
      "purchase_score": 50,
      "notes": "Importado de CRM externo"
    }
  ],
  "mapping_report": {
    "total_records": 0,
    "successfully_mapped": 0,
    "issues": ["..."],
    "recommendations": ["..."]
  }
}

Faça o melhor mapeamento possível. Se algo não for claro, use valores padrão sensatos.`,
        response_json_schema: {
          type: "object",
          properties: {
            clients: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  first_name: { type: "string" },
                  full_name: { type: "string" },
                  email: { type: "string" },
                  phone: { type: "string" },
                  clinic_name: { type: "string" },
                  city: { type: "string" },
                  client_type: { type: "string" },
                  decision_role: { type: "string" },
                  status: { type: "string" },
                  purchase_score: { type: "number" },
                  notes: { type: "string" }
                }
              }
            },
            mapping_report: {
              type: "object",
              properties: {
                total_records: { type: "number" },
                successfully_mapped: { type: "number" },
                issues: { type: "array", items: { type: "string" } },
                recommendations: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      });

      // Importar clientes
      let imported = 0;
      let updated = 0;

      for (const clientData of analysis.clients) {
        // Verificar se cliente já existe (por email)
        const existing = clients.find(c => c.email && c.email === clientData.email);
        
        if (existing) {
          await updateClientMutation.mutateAsync({
            id: existing.id,
            data: { ...clientData, notes: `${existing.notes || ''}\n\n[Atualizado via CRM externo]` }
          });
          updated++;
        } else {
          await createClientMutation.mutateAsync(clientData);
          imported++;
        }
      }

      toast.success(`✅ Sincronização completa!`, {
        description: `${imported} importados, ${updated} atualizados`
      });

      if (analysis.mapping_report.issues.length > 0) {
        toast.info('⚠️ Avisos de mapeamento', {
          description: analysis.mapping_report.issues.join(', ')
        });
      }

      setCrmData('');

    } catch (error) {
      console.error('Erro ao importar:', error);
      toast.error('Erro ao importar dados do CRM');
    } finally {
      setSyncing(false);
    }
  };

  const exportToCRM = async () => {
    setSyncing(true);
    try {
      const exportData = clients.map(c => ({
        name: c.full_name || c.first_name,
        email: c.email,
        phone: c.phone,
        company: c.clinic_name,
        city: c.city,
        status: c.status,
        score: c.purchase_score,
        engagement: c.engagement_score,
        last_contact: c.last_contact_date,
        notes: c.notes
      }));

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um especialista em CRM. Gere um relatório de exportação profissional destes ${clients.length} clientes.

DADOS:
${JSON.stringify(exportData.slice(0, 50), null, 2)}

Retorne um relatório estruturado em formato texto para copiar/colar em CRM externo, incluindo:
1. Cabeçalho com total de registros
2. Dados tabulados
3. Estatísticas gerais
4. Notas de importação`,
        response_json_schema: {
          type: "object",
          properties: {
            export_text: { type: "string" },
            summary: { type: "string" }
          }
        }
      });

      await navigator.clipboard.writeText(analysis.export_text);
      toast.success('📋 Dados exportados e copiados!', {
        description: analysis.summary
      });

    } catch (error) {
      toast.error('Erro ao exportar');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
          <Database className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800">Integrador CRM Externo IA</h3>
          <p className="text-xs text-slate-600">Sincronização bidirecional inteligente</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-xs text-slate-600 mb-1">Importar do CRM Externo</Label>
          <textarea
            placeholder="Cole dados do seu CRM (CSV, JSON, ou texto formatado)..."
            value={crmData}
            onChange={(e) => setCrmData(e.target.value)}
            rows={4}
            className="w-full p-2 border rounded-lg text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={importFromCRM}
            disabled={syncing || !crmData.trim()}
            size="sm"
            className="bg-green-600 hover:bg-green-700"
          >
            {syncing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Upload className="w-4 h-4 mr-1" />
                Importar
              </>
            )}
          </Button>

          <Button
            onClick={exportToCRM}
            disabled={syncing}
            size="sm"
            variant="outline"
          >
            <Download className="w-4 h-4 mr-1" />
            Exportar
          </Button>
        </div>

        <div className="p-3 bg-white rounded-lg border border-green-200">
          <p className="text-xs font-semibold text-green-800 mb-1">✨ Funcionalidades IA:</p>
          <ul className="text-xs text-slate-700 space-y-0.5">
            <li>• Mapeamento automático de campos</li>
            <li>• Detecção de duplicatas</li>
            <li>• Enriquecimento de dados</li>
            <li>• Validação inteligente</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}