import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Sparkles, Upload, Loader2, MapPin, Route } from 'lucide-react';
import { toast } from 'sonner';

// Região Nathan (Laranja) - APENAS ESTAS CIDADES
const ORANGE_REGION_CITIES = [
  'Marília', 'Presidente Prudente', 'Assis', 'Tupã', 'Adamantina', 
  'Bauru', 'Araçatuba', 'Ourinhos', 'Dracena', 'Lins'
];

export default function ImportClientsTable() {
  const navigate = useNavigate();
  const [tableData, setTableData] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);

  const handleImport = async () => {
    if (!tableData.trim()) {
      toast.error('Cole os dados da tabela primeiro');
      return;
    }

    setProcessing(true);
    try {
      // Usa IA para extrair e estruturar os dados da tabela
      const prompt = `Analise esta tabela/lista de clientes e extraia as informações estruturadas.

DADOS DA TABELA:
${tableData}

Extraia e retorne um array de clientes com os seguintes campos (se disponíveis):
- first_name (nome do responsável)
- clinic_name (nome da clínica)
- city (cidade)
- phone (telefone/WhatsApp)
- email
- address (endereço)
- cnpj
- current_equipment (equipamento/máquina atual que possui)
- decision_role (se mencionado: proprietario, veterinario_responsavel, etc)

Se o cliente já possui equipamento mencionado, capture em "current_equipment".
Se não houver informação sobre um campo, deixe vazio ou null.

Retorne JSON válido.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            clients: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  first_name: { type: "string" },
                  clinic_name: { type: "string" },
                  city: { type: "string" },
                  phone: { type: "string" },
                  email: { type: "string" },
                  address: { type: "string" },
                  cnpj: { type: "string" },
                  current_equipment: { type: "string" },
                  decision_role: { type: "string" }
                }
              }
            }
          }
        }
      });

      // Cadastra apenas clientes da região laranja (Nathan)
      const createdClients = [];
      const rejected = [];
      
      for (const clientData of response.clients) {
        if (clientData.first_name) {
          // Valida se a cidade está na região laranja
          const cityMatch = ORANGE_REGION_CITIES.some(validCity => 
            clientData.city?.toLowerCase().includes(validCity.toLowerCase())
          );
          
          if (!cityMatch) {
            rejected.push({ 
              name: clientData.first_name, 
              city: clientData.city, 
              reason: 'Cidade fora da região laranja (Nathan)' 
            });
            continue;
          }
          
          try {
            const client = await base44.entities.Client.create({
              ...clientData,
              decision_role: clientData.decision_role || 'proprietario',
              status: 'morno',
              purchase_score: 50
            });
            createdClients.push(client);
          } catch (error) {
            console.error('Erro ao criar cliente:', clientData.first_name, error);
            rejected.push({ 
              name: clientData.first_name, 
              city: clientData.city, 
              reason: 'Erro ao cadastrar' 
            });
          }
        }
      }

      setResult({
        total: response.clients.length,
        created: createdClients.length,
        rejected: rejected.length,
        rejectedDetails: rejected
      });

      if (createdClients.length > 0) {
        toast.success(`${createdClients.length} clientes da região laranja cadastrados!`);
        
        // Gerar planejamento de visitas usando IA
        try {
          const planPrompt = `Analise estes clientes cadastrados e crie um planejamento estratégico de visitas.

CLIENTES CADASTRADOS:
${createdClients.map(c => `- ${c.first_name} (${c.clinic_name || 'N/A'}) em ${c.city} - Equipamento: ${c.current_equipment || 'Nenhum'}`).join('\n')}

REGIÃO: Laranja (Nathan) - Marília, Presidente Prudente, Assis, Tupã, Adamantina, Bauru, Araçatuba, Ourinhos, Dracena, Lins

Crie um planejamento considerando:
1. Rota logística otimizada (proximidade geográfica)
2. Prioridade por tipo de cliente (sem equipamento = maior prioridade)
3. Agrupamento por cidade para eficiência
4. Sugestão de abordagem por cliente

Retorne uma estratégia de visitas estruturada.`;

          const plan = await base44.integrations.Core.InvokeLLM({
            prompt: planPrompt,
            response_json_schema: {
              type: "object",
              properties: {
                suggested_route: { type: "string" },
                priority_clients: { type: "array", items: { type: "string" } },
                visit_strategy: { type: "string" },
                estimated_days: { type: "number" }
              }
            }
          });

          setResult({
            total: response.clients.length,
            created: createdClients.length,
            rejected: rejected.length,
            rejectedDetails: rejected,
            clients: createdClients,
            visitPlan: plan
          });
        } catch (error) {
          console.log('Erro ao gerar planejamento:', error);
          setResult({
            total: response.clients.length,
            created: createdClients.length,
            rejected: rejected.length,
            rejectedDetails: rejected,
            clients: createdClients
          });
        }
      } else {
        setResult({
          total: response.clients.length,
          created: 0,
          rejected: rejected.length,
          rejectedDetails: rejected
        });
      }
      
      if (rejected.length > 0) {
        toast.warning(`${rejected.length} clientes rejeitados (fora da região laranja)`);
      }
      
    } catch (error) {
      console.error('Erro ao importar:', error);
      toast.error('Erro ao processar a tabela');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-lg font-semibold text-slate-800">Importar Tabela de Clientes</h1>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Região Nathan - Laranja */}
        <Card className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0">
              <div className="w-6 h-6 bg-orange-600 rounded-full" />
            </div>
            <div>
              <p className="font-bold text-orange-900 mb-2">🟠 Região Nathan (Laranja)</p>
              <p className="text-sm text-orange-800 mb-2">
                Apenas clientes destas cidades serão cadastrados:
              </p>
              <div className="flex flex-wrap gap-1">
                {ORANGE_REGION_CITIES.map(city => (
                  <span key={city} className="px-2 py-0.5 bg-orange-200 text-orange-900 rounded-full text-xs font-medium">
                    {city}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Instruções */}
        <Card className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-none">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Upload className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="font-medium text-slate-800 mb-1">Como usar:</p>
              <ol className="text-sm text-slate-600 space-y-1 list-decimal list-inside">
                <li>Cole sua tabela do Excel, Google Sheets ou lista de clientes abaixo</li>
                <li>A IA vai extrair automaticamente: nome, clínica, cidade, contatos, CNPJ, etc.</li>
                <li>Se houver informação sobre máquina atual, será capturada também</li>
                <li>⚠️ Apenas cidades da região LARANJA serão cadastradas</li>
                <li>Clique em "Processar e Cadastrar"</li>
              </ol>
            </div>
          </div>
        </Card>

        {/* Área de Texto */}
        <Card className="p-4 bg-white">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Cole a tabela ou lista de clientes:
          </label>
          <Textarea
            value={tableData}
            onChange={(e) => setTableData(e.target.value)}
            placeholder="Ex:
Nome        | Clínica              | Cidade        | Telefone      | Máquina Atual
João Silva  | Clínica Vida Animal  | Marília       | 14999999999   | BC-2800
Maria Costa | Pet Care Center      | Tupã          | 14988888888   | Sem equipamento
..."
            className="min-h-[400px] font-mono text-sm"
          />
        </Card>

        {/* Resultado */}
        {result && (
          <div className="space-y-3">
            <Card className="p-4 bg-green-50 border-green-200">
              <h3 className="font-semibold text-green-800 mb-2">✅ Importação Concluída</h3>
              <div className="text-sm text-green-700 space-y-1">
                <p>• Total processados: {result.total}</p>
                <p>• Cadastrados na região laranja: {result.created}</p>
                {result.rejected > 0 && (
                  <p className="text-orange-700">• Rejeitados (fora da região): {result.rejected}</p>
                )}
              </div>
            </Card>

            {/* Clientes Cadastrados */}
            {result.clients && result.clients.length > 0 && (
              <Card className="p-4 bg-blue-50 border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-3">📋 Clientes Cadastrados</h3>
                <div className="text-sm text-blue-700 space-y-2 max-h-60 overflow-y-auto">
                  {result.clients.map((client, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2 bg-white rounded-lg">
                      <span className="font-bold text-blue-600">{idx + 1}.</span>
                      <div className="flex-1">
                        <p className="font-semibold">{client.first_name}</p>
                        {client.clinic_name && <p className="text-xs text-slate-600">{client.clinic_name}</p>}
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {client.city}
                        </p>
                        {client.current_equipment && (
                          <p className="text-xs text-green-600 mt-1">✅ Tem: {client.current_equipment}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 space-y-2">
                  <Link to={createPageUrl('Home')}>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      <MapPin className="w-4 h-4 mr-2" />
                      Ver no Mapa de Vendas
                    </Button>
                  </Link>
                  <Link to={createPageUrl('Clients')}>
                    <Button variant="outline" className="w-full">
                      Ver Lista de Clientes
                    </Button>
                  </Link>
                </div>
              </Card>
            )}

            {/* Planejamento de Visitas */}
            {result.visitPlan && (
              <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                <h3 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                  <Route className="w-5 h-5" />
                  🎯 Planejamento Estratégico de Visitas
                </h3>
                <div className="text-sm space-y-3">
                  <div>
                    <p className="font-medium text-purple-800">Rota Sugerida:</p>
                    <p className="text-purple-700">{result.visitPlan.suggested_route}</p>
                  </div>
                  
                  {result.visitPlan.priority_clients && result.visitPlan.priority_clients.length > 0 && (
                    <div>
                      <p className="font-medium text-purple-800">Prioridade Alta:</p>
                      <ul className="text-purple-700 space-y-1">
                        {result.visitPlan.priority_clients.map((client, idx) => (
                          <li key={idx}>• {client}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div>
                    <p className="font-medium text-purple-800">Estratégia:</p>
                    <p className="text-purple-700">{result.visitPlan.visit_strategy}</p>
                  </div>
                  
                  {result.visitPlan.estimated_days && (
                    <div className="pt-2 border-t border-purple-200">
                      <p className="text-purple-800">
                        ⏱️ Tempo estimado: <span className="font-bold">{result.visitPlan.estimated_days} dias</span>
                      </p>
                    </div>
                  )}
                </div>
                
                <Link to={createPageUrl('VisitPlanner')}>
                  <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700">
                    <Route className="w-4 h-4 mr-2" />
                    Abrir Planejador de Rotas
                  </Button>
                </Link>
              </Card>
            )}

            {result.rejectedDetails && result.rejectedDetails.length > 0 && (
              <Card className="p-4 bg-orange-50 border-orange-200">
                <h3 className="font-semibold text-orange-800 mb-2">⚠️ Clientes Rejeitados</h3>
                <div className="text-sm text-orange-700 space-y-1 max-h-40 overflow-y-auto">
                  {result.rejectedDetails.map((rejected, idx) => (
                    <p key={idx}>
                      • {rejected.name} ({rejected.city || 'Sem cidade'}) - {rejected.reason}
                    </p>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Botão */}
        <Button
          onClick={handleImport}
          disabled={!tableData.trim() || processing}
          className="w-full h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl text-lg font-semibold shadow-lg"
        >
          {processing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Processar e Cadastrar
            </>
          )}
        </Button>
      </div>
    </div>
  );
}