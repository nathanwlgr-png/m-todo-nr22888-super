import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, MapPin, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const BRAZILIAN_CITIES = [
  'São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Belo Horizonte',
  'Manaus', 'Curitiba', 'Recife', 'Porto Alegre', 'Belém', 'Goiânia', 'Guarulhos',
  'Campinas', 'São Luís', 'São Gonçalo', 'Maceió', 'Duque de Caxias', 'Campo Grande',
  'Natal', 'Teresina', 'São Bernardo do Campo', 'João Pessoa', 'Santo André', 'Osasco',
  'Jaboatão dos Guararapes', 'Ribeirão Preto', 'Uberlândia', 'Contagem', 'Sorocaba',
  'Aracaju', 'Feira de Santana', 'Cuiabá', 'Joinville', 'Londrina', 'Aparecida de Goiânia',
  'Ananindeua', 'Porto Velho', 'Serra', 'Niterói', 'Marília', 'Bauru', 'Piracicaba'
];

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function EnhancedMarketIntelligence() {
  const [searchType, setSearchType] = useState('city'); // city or state
  const [searchTerm, setSearchTerm] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);

  const suggestions = useMemo(() => {
    if (!searchTerm) return [];
    const term = searchTerm.toLowerCase();
    
    if (searchType === 'city') {
      return BRAZILIAN_CITIES
        .filter(city => city.toLowerCase().startsWith(term))
        .sort()
        .slice(0, 10);
    } else {
      return BRAZILIAN_STATES
        .filter(state => state.toLowerCase().startsWith(term))
        .sort();
    }
  }, [searchTerm, searchType]);

  const analyzeMarket = async () => {
    if (!searchTerm) {
      toast.error('Digite uma cidade ou estado');
      return;
    }

    setAnalyzing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `ANÁLISE DE MERCADO VETERINÁRIO - DUPLA IA

Local: ${searchTerm}
Tipo: ${searchType === 'city' ? 'Cidade' : 'Estado'}

IA 1 - ANÁLISE DEMOGRÁFICA:
- População e PIB
- Número estimado de pets
- Poder aquisitivo médio
- Crescimento econômico

IA 2 - ANÁLISE COMPETITIVA:
- Clínicas veterinárias existentes
- Equipamentos predominantes
- Gaps de mercado
- Oportunidades de venda

Use Google, IBGE, dados de mercado pet.

Retorne JSON:`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            demografia: {
              type: "object",
              properties: {
                populacao: { type: "number" },
                pib_per_capita: { type: "number" },
                pets_estimados: { type: "number" },
                crescimento_economico: { type: "string" }
              }
            },
            mercado: {
              type: "object",
              properties: {
                clinicas_total: { type: "number" },
                clinicas_pequenas: { type: "number" },
                clinicas_medias: { type: "number" },
                hospitais: { type: "number" },
                equipamentos_comuns: { type: "array", items: { type: "string" } },
                gaps: { type: "array", items: { type: "string" } }
              }
            },
            oportunidades: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  tipo_cliente: { type: "string" },
                  equipamento_ideal: { type: "string" },
                  potencial_vendas: { type: "string" },
                  estrategia: { type: "string" }
                }
              }
            },
            score_mercado: { type: "number" },
            recomendacao_ia: { type: "string" }
          }
        }
      });

      setResults(result);
      
      // Copiar para área de transferência
      const summary = `📊 ANÁLISE DE MERCADO - ${searchTerm}

🏙️ DEMOGRAFIA:
População: ${result.demografia.populacao?.toLocaleString('pt-BR')}
PIB per capita: R$ ${result.demografia.pib_per_capita?.toLocaleString('pt-BR')}
Pets estimados: ${result.demografia.pets_estimados?.toLocaleString('pt-BR')}

🏥 MERCADO VETERINÁRIO:
Total clínicas: ${result.mercado.clinicas_total}
- Pequenas: ${result.mercado.clinicas_pequenas}
- Médias: ${result.mercado.clinicas_medias}
- Hospitais: ${result.mercado.hospitais}

💡 OPORTUNIDADES:
${result.oportunidades?.map(o => `• ${o.tipo_cliente}: ${o.equipamento_ideal}`).join('\n')}

⭐ Score: ${result.score_mercado}/100

📝 ${result.recomendacao_ia}`;
      
      await navigator.clipboard.writeText(summary);
      toast.success('Análise copiada!');
      
    } catch (error) {
      toast.error('Erro na análise');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Card className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-300">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-blue-600" />
        <h3 className="font-bold text-slate-800">Inteligência de Mercado IA</h3>
      </div>

      <div className="flex gap-2 mb-3">
        <Button
          size="sm"
          variant={searchType === 'city' ? 'default' : 'outline'}
          onClick={() => setSearchType('city')}
        >
          Cidade
        </Button>
        <Button
          size="sm"
          variant={searchType === 'state' ? 'default' : 'outline'}
          onClick={() => setSearchType('state')}
        >
          Estado
        </Button>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder={searchType === 'city' ? "Digite cidade..." : "Digite UF..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
        
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border-2 border-blue-200 z-50 max-h-48 overflow-y-auto">
            {suggestions.map((sug) => (
              <button
                key={sug}
                onClick={() => setSearchTerm(sug)}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm"
              >
                <MapPin className="w-3 h-3 inline mr-2 text-blue-600" />
                {sug}
              </button>
            ))}
          </div>
        )}
      </div>

      <Button
        onClick={analyzeMarket}
        disabled={analyzing || !searchTerm}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {analyzing ? (
          <><Loader2 className="w-4 h-4 animate-spin mr-2" />Analisando Dupla IA...</>
        ) : (
          <><Search className="w-4 h-4 mr-2" />Analisar Mercado</>
        )}
      </Button>

      {results && (
        <div className="mt-3 space-y-2">
          <div className="p-3 bg-white rounded-lg border-2 border-blue-300">
            <p className="text-xs font-semibold text-blue-700 mb-2">Score: {results.score_mercado}/100</p>
            <p className="text-sm text-slate-700">{results.recomendacao_ia}</p>
          </div>
        </div>
      )}
    </Card>
  );
}