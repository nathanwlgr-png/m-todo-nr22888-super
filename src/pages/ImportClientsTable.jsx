import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Table, 
  Loader2, 
  CheckCircle2, 
  Sparkles,
  FileSpreadsheet,
  MessageSquare,
  Database,
  Upload
} from 'lucide-react';

export default function ImportClientsTable() {
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
      const aiMode = localStorage.getItem('nr22_ai_mode') || 'economy';
      
      if (aiMode === 'off') {
        toast.error('IA desligada - Ative para processar tabelas');
        setProcessing(false);
        return;
      }

      toast.info('🤖 IA analisando dados colados...');

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `EXTRAÇÃO INTELIGENTE DE CLIENTES - QUALQUER FORMATO

═══════════════════════════════════════════════════════════════
📋 DADOS FORNECIDOS PELO USUÁRIO
═══════════════════════════════════════════════════════════════

${pastedData}

═══════════════════════════════════════════════════════════════
🎯 SUA MISSÃO
═══════════════════════════════════════════════════════════════

Extraia TODOS os clientes destes dados, independente do formato:

✅ FORMATOS ACEITOS:
• Tabela Excel (com colunas separadas por tab)
• Lista de WhatsApp (nome, telefone, cidade)
• Planilha Google Sheets
• Dados mobVendedor
• CSV (separado por vírgula ou ponto-vírgula)
• Lista simples de clínicas
• Texto livre com informações
• JSON ou qualquer outro formato estruturado

═══════════════════════════════════════════════════════════════
📊 CAMPOS A EXTRAIR
═══════════════════════════════════════════════════════════════

OBRIGATÓRIOS (sempre extrair):
• first_name: Primeiro nome do PROPRIETÁRIO ou VETERINÁRIO responsável
  - Se não tiver, use primeira palavra da clinic_name
• clinic_name: Nome da clínica/hospital veterinário

OPCIONAIS (extrair quando disponível):
• full_name: Nome completo do proprietário/veterinário
• phone: Telefone (formato 5511999999999 com DDI)
• email: Email
• address: Endereço completo
• city: Cidade
• cep: CEP
• cnpj: CNPJ (apenas números)
• razao_social: Razão social
• equipment_interest: Equipamento de interesse (VG2, Hematologia, etc)
• current_equipment: Equipamento atual que possui
• client_type: Tipo (clinica_pequena, clinica_media, hospital_veterinario)

═══════════════════════════════════════════════════════════════
⚠️ REGRAS CRÍTICAS
═══════════════════════════════════════════════════════════════

1. SEMPRE criar first_name, mesmo que use parte da clinic_name
2. Telefone SEMPRE com DDI 55: 5511999999999
3. Remover caracteres especiais de CNPJ/CEP
4. Detectar equipamento nos dados (VG2, Hematologia, etc) → equipment_interest
5. Status padrão: "morno"
6. lead_source: "importacao_planilha"
7. Extrair TODOS os clientes, mesmo 100+

RETORNE TODOS OS CLIENTES ENCONTRADOS.`,
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
                  client_type: { type: "string" }
                },
                required: ["first_name"]
              }
            },
            total_found: { type: "number" },
            format_detected: { type: "string" }
          }
        }
      });

      const extractedClients = result.clients || [];
      
      if (extractedClients.length === 0) {
        toast.error('Nenhum cliente encontrado nos dados');
        setProcessing(false);
        return;
      }

      toast.success(`✅ ${extractedClients.length} clientes extraídos! Salvando...`);

      let saved = 0;
      let skipped = 0;
      const errors = [];
      const savedClients = [];

      for (const client of extractedClients) {
        try {
          // Verificar duplicata
          const isDuplicate = clients.some(c => 
            (c.clinic_name && client.clinic_name && 
             c.clinic_name.toLowerCase().trim() === client.clinic_name.toLowerCase().trim()) ||
            (c.phone && client.phone && c.phone === client.phone) ||
            (c.cnpj && client.cnpj && c.cnpj === client.cnpj)
          );

          if (isDuplicate) {
            skipped++;
            continue;
          }

          const newClient = await createClientMutation.mutateAsync({
            ...client,
            status: 'morno',
            purchase_score: 50,
            lead_source: 'importacao_planilha'
          });

          saved++;
          savedClients.push(newClient);
          
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error('Erro ao salvar:', error);
          errors.push({ 
            client: client.first_name || client.clinic_name, 
            error: error.message 
          });
          skipped++;
        }
      }

      setResults({
        total: extractedClients.length,
        saved,
        skipped,
        errors,
        format: result.format_detected,
        clients: savedClients
      });

      toast.success(`🎉 ${saved} clientes salvos, ${skipped} duplicatas/erros`);

    } catch (error) {
      console.error('Erro:', error);
      if (error.message?.includes('limit')) {
        toast.error('Limite de IA atingido - Aguarde ou use modo econômico');
      } else {
        toast.error('Erro: ' + error.message);
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
              <Table className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Cadastrar Clientes por Tabela</h1>
              <p className="text-sm text-slate-600">Cole qualquer formato - IA extrai e cadastra automaticamente</p>
            </div>
          </div>
        </div>

        {/* Exemplos */}
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 mb-6">
          <h3 className="font-bold text-blue-900 mb-3">📋 Formatos Aceitos:</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 text-blue-800">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel (Ctrl+C → Ctrl+V)</span>
            </div>
            <div className="flex items-center gap-2 text-blue-800">
              <MessageSquare className="w-4 h-4" />
              <span>Lista WhatsApp</span>
            </div>
            <div className="flex items-center gap-2 text-blue-800">
              <Table className="w-4 h-4" />
              <span>Google Sheets</span>
            </div>
            <div className="flex items-center gap-2 text-blue-800">
              <Database className="w-4 h-4" />
              <span>CSV / mobVendedor</span>
            </div>
          </div>
        </Card>

        {/* Área de Cole */}
        <Card className="p-6 bg-white border-2 border-slate-200 mb-6">
          <Textarea
            placeholder="📋 COLE AQUI OS DADOS DA TABELA...

Exemplos:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXCEL/SHEETS:
Nome          Clínica              Cidade      Telefone
Dr. João      Pet Center          Marília     14999999999
Dra. Maria    Vet Care            Bauru       14988888888

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHATSAPP:
Dr. João - Pet Center - Marília - (14) 99999-9999
Dra. Maria - Vet Care - Bauru - (14) 98888-8888

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CSV:
João,Pet Center,Marília,14999999999
Maria,Vet Care,Bauru,14988888888

A IA reconhece QUALQUER formato automaticamente! 🤖"
            value={pastedData}
            onChange={(e) => setPastedData(e.target.value)}
            className="min-h-[400px] font-mono text-sm"
          />
        </Card>

        {/* Botão Processar */}
        <Button
          onClick={processTable}
          disabled={processing || !pastedData.trim()}
          className="w-full h-14 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-lg mb-6"
        >
          {processing ? (
            <>
              <Loader2 className="w-6 h-6 mr-3 animate-spin" />
              IA Processando...
            </>
          ) : (
            <>
              <Sparkles className="w-6 h-6 mr-3" />
              🚀 EXTRAIR E CADASTRAR TUDO
            </>
          )}
        </Button>

        {/* Resultados */}
        {results && (
          <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-400">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
              <div>
                <h3 className="text-lg font-bold text-green-900">Importação Concluída!</h3>
                <p className="text-sm text-green-700">Formato detectado: {results.format}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="p-4 bg-white rounded-lg text-center">
                <p className="text-3xl font-bold text-slate-900">{results.total}</p>
                <p className="text-xs text-slate-600">Encontrados</p>
              </div>
              <div className="p-4 bg-green-100 rounded-lg text-center">
                <p className="text-3xl font-bold text-green-900">{results.saved}</p>
                <p className="text-xs text-green-700">✅ Salvos</p>
              </div>
              <div className="p-4 bg-orange-100 rounded-lg text-center">
                <p className="text-3xl font-bold text-orange-900">{results.skipped}</p>
                <p className="text-xs text-orange-700">⚠️ Ignorados</p>
              </div>
            </div>

            {results.errors.length > 0 && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-200 mb-4">
                <p className="text-sm font-bold text-red-900 mb-2">Erros encontrados:</p>
                {results.errors.slice(0, 5).map((err, idx) => (
                  <p key={idx} className="text-xs text-red-700">
                    • {err.client}: {err.error}
                  </p>
                ))}
                {results.errors.length > 5 && (
                  <p className="text-xs text-red-700 mt-1">
                    ... e mais {results.errors.length - 5} erros
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setPastedData('');
                  setResults(null);
                }}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                Nova Importação
              </Button>
              <Link to={createPageUrl('Clients')} className="flex-1">
                <Button variant="outline" className="w-full">
                  Ver Todos Clientes
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}