import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search,
  Loader2,
  Sparkles,
  Building2,
  Instagram,
  MapPin,
  Phone,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function EnhancedClinicAnalyzer({ onClientCreated }) {
  const [clinicName, setClinicName] = useState('');
  const [searching, setSearching] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const analyzeClinic = async () => {
    if (!clinicName.trim()) {
      toast.error('Digite o nome da clínica');
      return;
    }

    setSearching(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `ANÁLISE COMPLETA DE CLÍNICA VETERINÁRIA - PRIMORI

═══════════════════════════════════════
🏥 CLÍNICA A PESQUISAR
═══════════════════════════════════════
Nome: ${clinicName}

═══════════════════════════════════════
🔍 PESQUISA SOLICITADA
═══════════════════════════════════════

Use Google, Instagram, Facebook, LinkedIn para encontrar:

**1. IDENTIFICAÇÃO DO PROPRIETÁRIO/VETERINÁRIO**
- Nome COMPLETO do proprietário ou veterinário responsável
- Se encontrar só primeiro nome, use ele
- IMPORTANTE: Não retorne o nome da clínica como nome do cliente
- Cargo/função (proprietário, médico vet, gestor)

**2. PERFIL NUMEROLÓGICO (mesmo só primeiro nome)**
- Calcular número numerológico do nome
- Caminho de vida (se tiver data de nascimento)
- Perfil comportamental baseado no número
- Estilo de decisão provável
- Dicas de abordagem de vendas

**3. DADOS DA CLÍNICA**
- Endereço completo
- Cidade e CEP
- Telefone/WhatsApp
- Instagram (@usuario)
- Facebook (URL)
- Website
- CNPJ (se encontrar)

**4. ANÁLISE DE EQUIPAMENTOS (CRÍTICO)**
Procure nas fotos do Instagram/Facebook por:
- Máquinas de BIOQUÍMICA (Seamaty, Idexx, etc)
- HEMOGASÔMETRO (Blood Gas, i-STAT)
- HEMOGRAMA (contador de células)
- IMUNOFLUORESCÊNCIA
- PCR (equipamento molecular)
- EXAMES HORMONAIS

Para cada equipamento encontrado:
- Marca e modelo (se identificável)
- Estado aparente (novo/usado)
- Frequência de uso nas fotos

**5. VOLUME DE EXAMES**
- Estimativa de exames/mês baseado em:
  - Tamanho da clínica (pequena/média/grande)
  - Fotos de atendimentos
  - Equipamentos que possui
  - Posts sobre casos clínicos

**6. ESPECIALIZAÇÃO**
- Especialidades (dermatologia, cardiologia, etc)
- Animais atendidos (cães/gatos/exóticos/equinos)
- Serviços laboratoriais oferecidos

**7. NÍVEL DE SOFISTICAÇÃO**
- Básico/Intermediário/Avançado
- Baseado em equipamentos e casos

**8. SCORE DE COMPRA INICIAL (0-100)**
- Baseado em: equipamentos, volume, especialização
- Justificativa do score

Seja ULTRA-DETALHADO na análise de equipamentos via fotos!`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            nome_proprietario: { type: "string" },
            primeiro_nome: { type: "string" },
            cargo: { type: "string" },
            numerologia: {
              type: "object",
              properties: {
                numero: { type: "number" },
                caminho_vida: { type: "number" },
                perfil_comportamental: { type: "string" },
                estilo_decisao: { type: "string" },
                dicas_abordagem: { type: "string" }
              }
            },
            dados_clinica: {
              type: "object",
              properties: {
                nome: { type: "string" },
                endereco: { type: "string" },
                cidade: { type: "string" },
                cep: { type: "string" },
                telefone: { type: "string" },
                instagram: { type: "string" },
                facebook: { type: "string" },
                website: { type: "string" },
                cnpj: { type: "string" }
              }
            },
            equipamentos_identificados: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  tipo: { type: "string" },
                  marca_modelo: { type: "string" },
                  estado: { type: "string" },
                  confianca: { type: "string" }
                }
              }
            },
            exames_realizados: {
              type: "array",
              items: { type: "string" }
            },
            volume_estimado: {
              type: "object",
              properties: {
                exames_mes: { type: "string" },
                justificativa: { type: "string" }
              }
            },
            especializacao: {
              type: "object",
              properties: {
                especialidades: { type: "array", items: { type: "string" } },
                animais: { type: "array", items: { type: "string" } },
                nivel_sofisticacao: { type: "string" }
              }
            },
            score_inicial: { type: "number" },
            justificativa_score: { type: "string" },
            recomendacao_equipamento: { type: "string" },
            abordagem_sugerida: { type: "string" }
          }
        }
      });

      setAnalysisResult(result);
      toast.success('Análise completa!');
    } catch (error) {
      toast.error('Erro na análise');
      console.error(error);
    } finally {
      setSearching(false);
    }
  };

  const createClient = async () => {
    if (!analysisResult) return;

    try {
      const newClient = await base44.entities.Client.create({
        first_name: analysisResult.primeiro_nome || analysisResult.nome_proprietario,
        full_name: analysisResult.nome_proprietario,
        clinic_name: analysisResult.dados_clinica?.nome || clinicName,
        address: analysisResult.dados_clinica?.endereco,
        city: analysisResult.dados_clinica?.cidade,
        cep: analysisResult.dados_clinica?.cep,
        phone: analysisResult.dados_clinica?.telefone,
        email: analysisResult.dados_clinica?.email,
        instagram_handle: analysisResult.dados_clinica?.instagram,
        facebook_url: analysisResult.dados_clinica?.facebook,
        website: analysisResult.dados_clinica?.website,
        cnpj: analysisResult.dados_clinica?.cnpj,
        numerology_number: analysisResult.numerologia?.numero,
        life_path_number: analysisResult.numerologia?.caminho_vida,
        behavioral_profile: analysisResult.numerologia?.perfil_comportamental,
        decision_style: analysisResult.numerologia?.estilo_decisao,
        approach_tips: analysisResult.numerologia?.dicas_abordagem,
        purchase_score: analysisResult.score_inicial || 50,
        current_equipment: analysisResult.equipamentos_identificados?.map(e => `${e.tipo} - ${e.marca_modelo}`).join(', '),
        client_type: analysisResult.especializacao?.nivel_sofisticacao === 'Avançado' ? 'hospital_veterinario' :
                     analysisResult.especializacao?.nivel_sofisticacao === 'Intermediário' ? 'clinica_media' : 'clinica_pequena',
        decision_role: analysisResult.cargo?.toLowerCase().includes('proprietário') ? 'proprietario' : 'veterinario_responsavel',
        status: 'morno',
        pipeline_stage: 'lead',
        lead_source: 'analise_mercado_ia',
        notes: `Equipamentos: ${analysisResult.equipamentos_identificados?.map(e => e.tipo).join(', ') || 'Não identificados'}
Volume estimado: ${analysisResult.volume_estimado?.exames_mes || 'N/A'}
Especialização: ${analysisResult.especializacao?.especialidades?.join(', ') || 'Geral'}
Exames: ${analysisResult.exames_realizados?.join(', ') || 'N/A'}
Recomendação: ${analysisResult.recomendacao_equipamento || 'A definir'}`
      });

      toast.success('Cliente criado com sucesso!');
      if (onClientCreated) onClientCreated(newClient);
      
      // Resetar
      setClinicName('');
      setAnalysisResult(null);
    } catch (error) {
      toast.error('Erro ao criar cliente');
      console.error(error);
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
          <Search className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-800">Análise Completa de Clínica</h3>
          <p className="text-xs text-purple-700">Busca IA + Numerologia + Equipamentos</p>
        </div>
      </div>

      <div className="space-y-2 mb-3">
        <Input
          placeholder="Digite o nome da clínica..."
          value={clinicName}
          onChange={(e) => setClinicName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && analyzeClinic()}
        />
        <Button
          onClick={analyzeClinic}
          disabled={searching}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {searching ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Analisando clínica...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Analisar com IA
            </>
          )}
        </Button>
      </div>

      {analysisResult && (
        <div className="space-y-3">
          {/* Proprietário */}
          <Card className="p-3 bg-white">
            <p className="text-xs font-semibold text-purple-800 mb-2">👤 Proprietário/Responsável:</p>
            <p className="font-bold text-slate-800">{analysisResult.nome_proprietario}</p>
            <p className="text-xs text-slate-600">{analysisResult.cargo}</p>
          </Card>

          {/* Numerologia */}
          {analysisResult.numerologia && (
            <Card className="p-3 bg-purple-50 border border-purple-200">
              <p className="text-xs font-semibold text-purple-800 mb-2">🔢 Perfil Numerológico:</p>
              <div className="space-y-1 text-xs">
                <p><span className="font-semibold">Número:</span> {analysisResult.numerologia.numero}</p>
                <p><span className="font-semibold">Perfil:</span> {analysisResult.numerologia.perfil_comportamental}</p>
                <p><span className="font-semibold">Decisão:</span> {analysisResult.numerologia.estilo_decisao}</p>
                <div className="p-2 bg-white rounded mt-2">
                  <p className="font-semibold text-purple-700">💡 Abordagem:</p>
                  <p className="text-slate-700">{analysisResult.numerologia.dicas_abordagem}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Dados Clínica */}
          <Card className="p-3 bg-blue-50 border border-blue-200">
            <p className="text-xs font-semibold text-blue-800 mb-2">🏥 Dados da Clínica:</p>
            <div className="space-y-1 text-xs">
              {analysisResult.dados_clinica?.endereco && (
                <p className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {analysisResult.dados_clinica.endereco}
                </p>
              )}
              {analysisResult.dados_clinica?.telefone && (
                <p className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {analysisResult.dados_clinica.telefone}
                </p>
              )}
              {analysisResult.dados_clinica?.instagram && (
                <p className="flex items-center gap-1">
                  <Instagram className="w-3 h-3" />
                  @{analysisResult.dados_clinica.instagram}
                </p>
              )}
            </div>
          </Card>

          {/* Equipamentos Identificados */}
          {analysisResult.equipamentos_identificados?.length > 0 && (
            <Card className="p-3 bg-green-50 border-2 border-green-400">
              <p className="text-xs font-semibold text-green-800 mb-2">🔬 Equipamentos Detectados (via fotos IA):</p>
              {analysisResult.equipamentos_identificados.map((eq, i) => (
                <div key={i} className="mb-2 p-2 bg-white rounded">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{eq.tipo}</p>
                      <p className="text-xs text-slate-600">{eq.marca_modelo}</p>
                    </div>
                    <Badge className={
                      eq.confianca === 'Alta' ? 'bg-green-600' :
                      eq.confianca === 'Média' ? 'bg-yellow-600' : 'bg-blue-600'
                    }>
                      {eq.confianca}
                    </Badge>
                  </div>
                </div>
              ))}
            </Card>
          )}

          {/* Exames Realizados */}
          {analysisResult.exames_realizados?.length > 0 && (
            <Card className="p-3 bg-cyan-50 border border-cyan-200">
              <p className="text-xs font-semibold text-cyan-800 mb-2">🧪 Exames Realizados:</p>
              <div className="flex flex-wrap gap-1">
                {analysisResult.exames_realizados.map((exame, i) => (
                  <Badge key={i} className="bg-cyan-100 text-cyan-700 text-xs">
                    {exame}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Volume */}
          <Card className="p-3 bg-yellow-50 border border-yellow-200">
            <p className="text-xs font-semibold text-yellow-800 mb-1">📊 Volume Estimado:</p>
            <p className="text-sm font-bold text-slate-800">{analysisResult.volume_estimado?.exames_mes}</p>
            <p className="text-xs text-slate-600 mt-1">{analysisResult.volume_estimado?.justificativa}</p>
          </Card>

          {/* Score e Recomendação */}
          <Card className="p-3 bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-300">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-orange-800">Score Inicial IA:</p>
              <div className="text-2xl font-bold text-orange-600">
                {analysisResult.score_inicial}
              </div>
            </div>
            <p className="text-xs text-slate-700 mb-2">{analysisResult.justificativa_score}</p>
            <div className="p-2 bg-white rounded border border-orange-200">
              <p className="text-xs font-semibold text-orange-800 mb-1">Recomendação:</p>
              <p className="text-xs text-slate-700">{analysisResult.recomendacao_equipamento}</p>
            </div>
          </Card>

          {/* Abordagem Sugerida */}
          <Card className="p-3 bg-indigo-50 border border-indigo-200">
            <p className="text-xs font-semibold text-indigo-800 mb-1">🎯 Abordagem Sugerida:</p>
            <p className="text-xs text-slate-700">{analysisResult.abordagem_sugerida}</p>
          </Card>

          {/* Botão Criar Cliente */}
          <Button
            onClick={createClient}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Criar Cliente com Esses Dados
          </Button>
        </div>
      )}
    </Card>
  );
}