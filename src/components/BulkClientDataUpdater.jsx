import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Database, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

/**
 * ATUALIZAÇÃO EM MASSA DE DADOS DOS CLIENTES
 * Busca CNPJ, cidade, redes sociais e atualiza cadastro
 */
export default function BulkClientDataUpdater() {
  const [updating, setUpdating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, updated: 0, errors: 0 });
  const queryClient = useQueryClient();

  const updateAllClients = async () => {
    if (!confirm('⚠️ ATUALIZAR TODOS OS CLIENTES?\n\nIsso buscará:\n✓ CNPJ\n✓ Cidade\n✓ Instagram\n✓ Outros dados\n\nPode levar vários minutos.\n\nContinuar?')) {
      return;
    }

    setUpdating(true);
    try {
      const clients = await base44.entities.Client.list('-created_date', 500);
      const validClients = clients.filter(c => c && c.id && !c.is_deleted && c.first_name);
      
      setProgress({ current: 0, total: validClients.length, updated: 0, errors: 0 });

      const { data: user } = await base44.auth.me();
      let updatedCount = 0;
      let errorCount = 0;

      // Processar em lotes de 5
      for (let i = 0; i < validClients.length; i += 5) {
        const batch = validClients.slice(i, i + 5);
        
        await Promise.all(batch.map(async (client) => {
          try {
            setProgress(prev => ({ ...prev, current: prev.current + 1 }));

            // Buscar dados na internet
            const enrichedData = await base44.integrations.Core.InvokeLLM({
              prompt: `Busque dados REAIS na internet sobre esta clínica veterinária:

Nome: ${client.first_name}
Clínica: ${client.clinic_name || 'Não informado'}
Cidade atual: ${client.city || 'Não informado'}
Telefone: ${client.phone || 'Não informado'}

TAREFA:
1. Encontre o CNPJ (se for empresa brasileira)
2. Confirme/corrija a cidade
3. Encontre Instagram da clínica
4. Encontre endereço completo
5. Encontre email (se disponível)

Retorne JSON:`,
              add_context_from_internet: true,
              response_json_schema: {
                type: "object",
                properties: {
                  cnpj: { type: "string" },
                  cidade: { type: "string" },
                  instagram: { type: "string" },
                  endereco: { type: "string" },
                  email: { type: "string" },
                  website: { type: "string" },
                  encontrado: { type: "boolean" },
                  confiabilidade: { type: "number" }
                }
              }
            });

            // Atualizar apenas campos encontrados com alta confiabilidade
            const updates = {};
            
            if (enrichedData.encontrado && enrichedData.confiabilidade >= 70) {
              if (enrichedData.cnpj && !client.cnpj) {
                updates.cnpj = enrichedData.cnpj;
              }
              if (enrichedData.cidade && enrichedData.cidade !== client.city) {
                updates.city = enrichedData.cidade;
              }
              if (enrichedData.instagram && !client.instagram_handle) {
                updates.instagram_handle = enrichedData.instagram.replace('@', '');
              }
              if (enrichedData.endereco && !client.address) {
                updates.address = enrichedData.endereco;
              }
              if (enrichedData.email && !client.email) {
                updates.email = enrichedData.email;
              }
              if (enrichedData.website && !client.website) {
                updates.website = enrichedData.website;
              }

              if (Object.keys(updates).length > 0) {
                await base44.entities.Client.update(client.id, updates);
                updatedCount++;
                setProgress(prev => ({ ...prev, updated: prev.updated + 1 }));
              }
            }

          } catch (error) {
            console.error(`Erro ao atualizar ${client.first_name}:`, error);
            errorCount++;
            setProgress(prev => ({ ...prev, errors: prev.errors + 1 }));
          }
        }));

        // Delay entre lotes para evitar rate limit
        if (i + 5 < validClients.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      queryClient.invalidateQueries(['clients']);
      
      // Relatório via WhatsApp
      const summary = `📊 *ATUALIZAÇÃO EM MASSA CONCLUÍDA*
_${new Date().toLocaleString('pt-BR')}_

═══════════════════════
✅ RESULTADOS
═══════════════════════
Total processados: ${validClients.length}
✓ Atualizados: ${updatedCount}
❌ Erros: ${errorCount}

Dados atualizados:
• CNPJ
• Cidade
• Instagram
• Endereço
• Email
• Website

_Sistema CRM Seamaty - Método NR22_`;

      if (user?.phone) {
        navigator.clipboard.writeText(summary);
        window.open(`https://wa.me/${user.phone}?text=${encodeURIComponent(summary)}`, '_blank');
      }

      toast.success(`${updatedCount} clientes atualizados!`, {
        description: `${errorCount} erros encontrados`
      });

    } catch (error) {
      console.error(error);
      toast.error('Erro na atualização em massa');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Card className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-300">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
          <Database className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-800">Atualização em Massa</h3>
          <p className="text-xs text-slate-600">
            Busca CNPJ, cidade e redes sociais de todos
          </p>
        </div>
      </div>

      {updating && (
        <div className="mb-4 p-3 bg-white rounded-lg border-2 border-blue-300">
          <div className="flex items-center gap-2 mb-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <p className="text-sm font-semibold text-blue-700">Processando...</p>
          </div>
          <div className="space-y-1 text-xs">
            <p className="text-slate-700">
              Progresso: {progress.current} / {progress.total}
            </p>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="w-3 h-3" />
                <span>Atualizados: {progress.updated}</span>
              </div>
              <div className="flex items-center gap-1 text-red-600">
                <AlertCircle className="w-3 h-3" />
                <span>Erros: {progress.errors}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <Button
        onClick={updateAllClients}
        disabled={updating}
        className="w-full bg-blue-600 hover:bg-blue-700 h-12"
      >
        {updating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Atualizando {progress.current}/{progress.total}...
          </>
        ) : (
          <>
            <Database className="w-4 h-4 mr-2" />
            Atualizar Todos os Clientes
          </>
        )}
      </Button>

      <p className="text-xs text-center text-slate-500 mt-2">
        ⚡ Busca automática via Google + IA
      </p>
    </Card>
  );
}