import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Table, Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export default function UniversalTableImporter() {
  const [pastedData, setPastedData] = useState('');
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
    initialData: []
  });

  const createClientMutation = useMutation({
    mutationFn: (clientData) => base44.entities.Client.create(clientData),
    onSuccess: () => {
      queryClient.invalidateQueries(['clients']);
    }
  });

  const processTable = async () => {
    if (!pastedData.trim()) {
      toast.error('Cole os dados da tabela primeiro');
      return;
    }

    setProcessing(true);
    setResults(null);

    try {
      // Usar IA para processar qualquer formato de tabela
      const aiMode = localStorage.getItem('nr22_ai_mode') || 'economy';
      
      if (aiMode === 'off') {
        toast.error('IA desligada - Ative para processar tabelas');
        setProcessing(false);
        return;
      }

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `PROCESSAMENTO INTELIGENTE DE TABELA - EXTRAÇÃO DE CLIENTES

═════════════════════════════════════════════════════
📋 DADOS COLADOS PELO USUÁRIO
═════════════════════════════════════════════════════

${pastedData}

═════════════════════════════════════════════════════
🎯 SUA MISSÃO
═════════════════════════════════════════════════════

Analise estes dados e extraia TODAS as informações de clientes.

PODE SER:
✅ Tabela do Excel (com colunas)
✅ Lista de WhatsApp (nome, cidade, telefone)
✅ Planilha Google Sheets
✅ Dados do mobVendedor
✅ Lista de clínicas veterinárias
✅ Qualquer outro formato

═════════════════════════════════════════════════════
📊 CAMPOS A EXTRAIR (quando disponível)
═════════════════════════════════════════════════════

OBRIGATÓRIO:
- first_name (primeiro nome do PROPRIETÁRIO/VETERINÁRIO)
- clinic_name (nome da clínica/hospital)

OPCIONAL (extrair quando disponível):
- full_name (nome completo)
- phone (formato 5511999999999)
- email
- address (endereço completo)
- city (cidade)
- cep
- cnpj
- razao_social
- equipment_interest (equipamento de interesse)
- current_equipment (equipamento atual)
- client_type (tipo: clinica_pequena, clinica_media, hospital_veterinario, etc)

═════════════════════════════════════════════════════
⚠️ REGRAS IMPORTANTES
═════════════════════════════════════════════════════

1. SEMPRE extrair first_name mesmo que só tenha clinic_name
2. Se não tiver first_name, usar primeira palavra da clinic_name
3. Telefone SEMPRE no formato 5511999999999 (com DDI 55)
4. Remover caracteres especiais do CNPJ
5. Se tiver "VG2", "Hematologia", etc → equipment_interest
6. Definir status: "morno" por padrão
7. lead_source: "importacao_planilha"

Retorne TODOS os clientes encontrados, mesmo que sejam 50, 100 ou mais.`,
        add_context_from_internet: false,
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
                  clinic_name: { type: "string" },
                  phone: { type: "string" },
                  email: { type: "string" },
                  address: { type: "string" },
                  city: { type: "string" },
                  cep: { type: "string" },
                  cnpj: { type: "string" },
                  razao_social: { type: "string" },
                  equipment_interest: { type: "string" },
                  current_equipment: { type: "string" },
                  client_type: { type: "string" },
                  status: { type: "string" }
                },
                required: ["first_name"]
              }
            },
            summary: { type: "string" }
          }
        }
      });

      const extractedClients = result.clients || [];
      
      if (extractedClients.length === 0) {
        toast.error('Nenhum cliente encontrado nos dados colados');
        setProcessing(false);
        return;
      }

      toast.success(`✅ ${extractedClients.length} clientes extraídos! Verificando duplicatas...`);

      // Verificar duplicatas e salvar
      let saved = 0;
      let skipped = 0;
      const errors = [];

      for (const client of extractedClients) {
        try {
          // Verificar duplicata
          const isDuplicate = clients.some(c => 
            (c.clinic_name && client.clinic_name && 
             c.clinic_name.toLowerCase() === client.clinic_name.toLowerCase()) ||
            (c.phone && client.phone && c.phone === client.phone) ||
            (c.cnpj && client.cnpj && c.cnpj === client.cnpj)
          );

          if (isDuplicate) {
            skipped++;
            continue;
          }

          // Criar cliente com dados padrão
          await createClientMutation.mutateAsync({
            ...client,
            status: client.status || 'morno',
            purchase_score: 50,
            lead_source: 'importacao_planilha'
          });

          saved++;
          
          // Pequeno delay para não sobrecarregar
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (error) {
          console.error('Erro ao criar cliente:', error);
          errors.push({ client: client.first_name, error: error.message });
          skipped++;
        }
      }

      setResults({
        total: extractedClients.length,
        saved,
        skipped,
        errors,
        summary: result.summary
      });

      toast.success(`🎉 Importação concluída! ${saved} novos clientes, ${skipped} duplicatas/erros`);

    } catch (error) {
      console.error('Erro no processamento:', error);
      if (error.message?.includes('limit')) {
        toast.error('Limite de IA atingido - Tente modo econômico ou aguarde');
      } else {
        toast.error('Erro ao processar tabela: ' + error.message);
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-400">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
          <Table className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-green-900">📊 Importador Universal de Tabelas</h3>
          <p className="text-xs text-green-700">Cole qualquer tabela (Excel, WhatsApp, Sheets) e cadastre tudo de uma vez</p>
        </div>
      </div>

      <div className="space-y-3">
        <Textarea
          placeholder="📋 Cole aqui os dados da tabela...

Exemplos aceitos:
• Tabela Excel (Ctrl+C → Ctrl+V)
• Lista WhatsApp
• Planilha Google Sheets
• Dados mobVendedor
• Qualquer formato com informações de clientes

A IA vai identificar e extrair automaticamente!"
          value={pastedData}
          onChange={(e) => setPastedData(e.target.value)}
          className="min-h-[200px] font-mono text-xs"
        />

        <Button
          onClick={processTable}
          disabled={processing || !pastedData.trim()}
          className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold"
        >
          {processing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Processando com IA...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              🚀 PROCESSAR E CADASTRAR TUDO
            </>
          )}
        </Button>

        {/* Resultados */}
        {results && (
          <div className="p-4 bg-white rounded-lg border-2 border-green-300 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <p className="font-bold text-green-900">Importação Concluída!</p>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-green-50 rounded">
                <p className="text-2xl font-bold text-green-900">{results.total}</p>
                <p className="text-xs text-green-700">Encontrados</p>
              </div>
              <div className="p-2 bg-emerald-50 rounded">
                <p className="text-2xl font-bold text-emerald-900">{results.saved}</p>
                <p className="text-xs text-emerald-700">✅ Salvos</p>
              </div>
              <div className="p-2 bg-orange-50 rounded">
                <p className="text-2xl font-bold text-orange-900">{results.skipped}</p>
                <p className="text-xs text-orange-700">⚠️ Ignorados</p>
              </div>
            </div>

            {results.summary && (
              <p className="text-xs text-slate-600 italic border-t pt-2 mt-2">
                {results.summary}
              </p>
            )}

            {results.errors.length > 0 && (
              <div className="border-t pt-2 mt-2">
                <p className="text-xs font-bold text-red-600 mb-1">Erros:</p>
                {results.errors.slice(0, 3).map((err, idx) => (
                  <p key={idx} className="text-xs text-red-600">
                    • {err.client}: {err.error}
                  </p>
                ))}
                {results.errors.length > 3 && (
                  <p className="text-xs text-red-600">... e mais {results.errors.length - 3}</p>
                )}
              </div>
            )}

            <Button
              onClick={() => {
                setPastedData('');
                setResults(null);
              }}
              variant="outline"
              size="sm"
              className="w-full mt-2"
            >
              Nova Importação
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}