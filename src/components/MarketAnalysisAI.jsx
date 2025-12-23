import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2, Building2, TrendingUp, Database } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Análise de Mercado Inteligente com GPS + IBGE + Google + Redes Sociais
 * - Usa geolocalização precisa
 * - Consulta IBGE para dados populacionais
 * - Busca clínicas no Google e redes sociais
 * - Estimativa: 1 clínica a cada 5.000 habitantes
 * - Auto-cadastra leads via CNPJ
 */
export default function MarketAnalysisAI() {
  const [analyzing, setAnalyzing] = useState(false);
  const [city, setCity] = useState('');
  const [location, setLocation] = useState(null);
  const [results, setResults] = useState(null);
  const queryClient = useQueryClient();

  const { data: existingClients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 500)
  });

  const createClientMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.create(data),
    onSuccess: () => queryClient.invalidateQueries(['clients'])
  });

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          toast.success('📍 Localização obtida!');
        },
        () => toast.error('Erro ao obter localização')
      );
    }
  };

  const analyzeMarket = async () => {
    if (!city.trim()) {
      toast.error('Digite o nome da cidade');
      return;
    }

    setAnalyzing(true);
    try {
      // Etapa 1: Buscar dados populacionais (IBGE)
      const ibgePrompt = `Busque dados OFICIAIS do IBGE sobre ${city}:
1. População total atualizada
2. Número de habitantes
3. Código IBGE da cidade
4. Estado

Use SOMENTE dados reais e oficiais do IBGE. Não invente números.`;

      const ibgeData = await base44.integrations.Core.InvokeLLM({
        prompt: ibgePrompt,
        add_context_from_internet: true
      });

      // Etapa 2: Buscar clínicas no Google
      const googlePrompt = `Busque no Google TODAS as clínicas veterinárias em ${city}.
      
Para CADA clínica encontrada, tente obter:
- Nome completo
- Endereço
- Telefone
- CNPJ (se disponível)
- Site/Redes sociais

Liste TODAS as clínicas encontradas, não apenas algumas.
Formato: 
CLÍNICA 1:
Nome: [nome]
Endereço: [endereço]
Telefone: [telefone]
CNPJ: [cnpj ou "não encontrado"]

CLÍNICA 2:
...`;

      const googleClinics = await base44.integrations.Core.InvokeLLM({
        prompt: googlePrompt,
        add_context_from_internet: true
      });

      // Etapa 3: Buscar em redes sociais
      const socialPrompt = `Busque nas redes sociais (Instagram, Facebook) clínicas veterinárias em ${city}.
      
Liste TODAS as clínicas encontradas com:
- Nome
- Instagram/Facebook
- Informações de contato

Busque por hashtags: #veterinaria${city.toLowerCase().replace(/\s/g, '')} #clinicaveterinaria${city.toLowerCase().replace(/\s/g, '')}`;

      const socialClinics = await base44.integrations.Core.InvokeLLM({
        prompt: socialPrompt,
        add_context_from_internet: true
      });

      // Etapa 4: Análise consolidada
      const analysisPrompt = `Analise o mercado de ${city} com os dados coletados:

DADOS IBGE:
${ibgeData}

CLÍNICAS GOOGLE:
${googleClinics}

CLÍNICAS REDES SOCIAIS:
${socialClinics}

REGRA: Estimativa de 1 clínica a cada 5.000 habitantes.

Forneça análise estruturada:
1. População total (IBGE)
2. Clínicas encontradas (número REAL de clínicas listadas)
3. Clínicas estimadas pela fórmula (população / 5000)
4. Taxa de cobertura atual (encontradas / estimadas)
5. Potencial de mercado inexplorado
6. Principais concorrentes identificados
7. Recomendações estratégicas

Seja PRECISO nos números. Se encontrou 42 clínicas, diga 42, não "algumas".`;

      const consolidatedAnalysis = await base44.integrations.Core.InvokeLLM({
        prompt: analysisPrompt
      });

      // Etapa 5: Extrair leads com CNPJ para auto-cadastro
      const leadsPrompt = `Do texto abaixo, extraia TODAS as clínicas que têm CNPJ identificado:

${googleClinics}
${socialClinics}

Retorne em formato JSON:
{
  "clinics": [
    {
      "name": "Nome da Clínica",
      "cnpj": "CNPJ",
      "phone": "telefone",
      "address": "endereço",
      "city": "${city}"
    }
  ]
}`;

      let leadsToImport = [];
      try {
        const leadsResponse = await base44.integrations.Core.InvokeLLM({
          prompt: leadsPrompt,
          response_json_schema: {
            type: "object",
            properties: {
              clinics: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    cnpj: { type: "string" },
                    phone: { type: "string" },
                    address: { type: "string" },
                    city: { type: "string" }
                  }
                }
              }
            }
          }
        });
        
        leadsToImport = leadsResponse.clinics || [];
      } catch (error) {
        console.error('Erro ao extrair leads:', error);
      }

      // Auto-cadastrar leads
      let importedCount = 0;
      for (const lead of leadsToImport) {
        // Verificar se já existe
        const exists = existingClients.some(c => 
          c.cnpj === lead.cnpj || 
          c.clinic_name?.toLowerCase() === lead.name?.toLowerCase()
        );

        if (!exists && lead.cnpj) {
          try {
            await createClientMutation.mutateAsync({
              first_name: lead.name,
              clinic_name: lead.name,
              cnpj: lead.cnpj,
              phone: lead.phone,
              address: lead.address,
              city: lead.city,
              status: 'frio',
              lead_source: 'analise_mercado_ia',
              notes: `Lead importado automaticamente via análise de mercado AI em ${new Date().toLocaleDateString('pt-BR')}`
            });
            importedCount++;
          } catch (error) {
            console.error('Erro ao importar lead:', error);
          }
        }
      }

      setResults({
        city,
        analysis: consolidatedAnalysis,
        leadsFound: leadsToImport.length,
        leadsImported: importedCount,
        ibgeData,
        googleClinics,
        socialClinics
      });

      toast.success(`✅ Análise concluída! ${importedCount} leads cadastrados`);

    } catch (error) {
      toast.error('Erro na análise de mercado');
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-800">Análise de Mercado IA</h3>
          <p className="text-xs text-slate-600">GPS + IBGE + Google + Redes Sociais</p>
        </div>
      </div>

      <div className="space-y-3 mb-3">
        <div className="flex gap-2">
          <Input
            placeholder="Ex: Marília, SP"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="flex-1"
          />
          <Button size="sm" variant="outline" onClick={getLocation}>
            <MapPin className="w-4 h-4" />
          </Button>
        </div>

        {location && (
          <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
            📍 GPS: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
          </div>
        )}

        <div className="bg-white rounded-lg p-3 space-y-1 text-xs">
          <p className="font-semibold text-slate-700">Fontes de Dados:</p>
          <div className="flex items-center gap-2">
            <Database className="w-3 h-3 text-blue-600" />
            <span>IBGE (dados populacionais oficiais)</span>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="w-3 h-3 text-orange-600" />
            <span>Google Business (clínicas registradas)</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3 h-3 text-purple-600" />
            <span>Redes Sociais (Instagram, Facebook)</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-3 h-3 text-green-600" />
            <span>Estimativa: 1 clínica / 5.000 habitantes</span>
          </div>
        </div>
      </div>

      <Button
        onClick={analyzeMarket}
        disabled={analyzing}
        className="w-full bg-green-600 hover:bg-green-700"
      >
        {analyzing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Analisando mercado...
          </>
        ) : (
          <>
            <TrendingUp className="w-4 h-4 mr-2" />
            Analisar Mercado Completo
          </>
        )}
      </Button>

      {results && (
        <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
          <p className="font-semibold text-sm text-green-700 mb-2">
            📊 Análise de {results.city}
          </p>
          <div className="text-xs text-slate-700 space-y-1 mb-3">
            <p>✅ {results.leadsFound} clínicas identificadas</p>
            <p>🎯 {results.leadsImported} leads cadastrados automaticamente</p>
          </div>
          <pre className="text-xs bg-slate-50 p-2 rounded max-h-64 overflow-auto whitespace-pre-wrap">
            {results.analysis}
          </pre>
        </div>
      )}
    </Card>
  );
}