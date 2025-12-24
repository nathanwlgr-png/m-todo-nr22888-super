import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, MapPin, Instagram, Globe, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

/**
 * BUSCA REGIONAL DE CLÍNICAS - FIXO NO MENU
 * NUNCA REMOVER ESTE COMPONENTE
 */
export default function RegionalClinicSearch() {
  const [city, setCity] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);
  const queryClient = useQueryClient();

  const searchClinics = async () => {
    if (!city.trim()) {
      toast.error('Digite uma cidade');
      return;
    }

    setSearching(true);
    try {
      const { data: existingClients } = await base44.entities.Client.list();
      const { data: user } = await base44.auth.me();

      // Busca multi-plataforma usando IA
      const searchResult = await base44.integrations.Core.InvokeLLM({
        prompt: `BUSCA REGIONAL DE CLÍNICAS VETERINÁRIAS - ${city.toUpperCase()}

Você é um assistente de prospecção. Encontre clínicas veterinárias em ${city} usando:

1. **GOOGLE SEARCH**: Pesquise "clínica veterinária ${city}", "hospital veterinário ${city}", "pet shop ${city}"
2. **INSTAGRAM**: Busque hashtags #veterinaria${city.toLowerCase()}, #clinicaveterinaria${city.toLowerCase()}
3. **DADOS LOCAIS**: Já temos ${existingClients.filter(c => c.city?.toLowerCase().includes(city.toLowerCase())).length} clientes em ${city}
4. **MAPAS**: Use Google Maps para localizar clínicas

RETORNE JSON com até 20 clínicas encontradas:

{
  "clinicas": [
    {
      "nome": "Nome da Clínica",
      "endereco": "Rua, Número - Bairro",
      "telefone": "5511999999999",
      "instagram": "@clinica",
      "responsavel_estimado": "Dr. Nome (estimativa)",
      "tipo": "clinica_pequena|clinica_media|hospital_veterinario",
      "fonte": "google|instagram|maps|ia",
      "confiabilidade": 0-100
    }
  ],
  "total_encontradas": 0,
  "cidade": "${city}",
  "timestamp": "${new Date().toISOString()}"
}

IMPORTANTE:
- Use dados REAIS de internet
- Priorize clínicas com presença online
- Inclua telefone com DDD (55)
- Estime tipo de clínica pelo nome/fotos
- Confiabilidade alta = dados verificados`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            clinicas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  nome: { type: "string" },
                  endereco: { type: "string" },
                  telefone: { type: "string" },
                  instagram: { type: "string" },
                  responsavel_estimado: { type: "string" },
                  tipo: { type: "string" },
                  fonte: { type: "string" },
                  confiabilidade: { type: "number" }
                }
              }
            },
            total_encontradas: { type: "number" },
            cidade: { type: "string" },
            timestamp: { type: "string" }
          }
        }
      });

      // Cadastrar automaticamente como possíveis vendas
      let cadastradas = 0;
      for (const clinica of searchResult.clinicas) {
        try {
          // Verificar se já existe
          const exists = existingClients.some(c => 
            c.clinic_name?.toLowerCase() === clinica.nome.toLowerCase() ||
            c.phone === clinica.telefone
          );

          if (!exists && clinica.confiabilidade >= 60) {
            await base44.entities.Lead.create({
              full_name: clinica.responsavel_estimado || 'A definir',
              company: clinica.nome,
              city: city,
              phone: clinica.telefone,
              instagram_handle: clinica.instagram?.replace('@', ''),
              source: 'analise_mercado_ia',
              interest: 'Equipamentos Seamaty',
              company_size: clinica.tipo === 'hospital_veterinario' ? '51-200' : '1-10',
              lead_score: clinica.confiabilidade,
              status: 'novo',
              notes: `Encontrado via busca regional (${clinica.fonte})\nEndereço: ${clinica.endereco}\nConfiabilidade: ${clinica.confiabilidade}%`
            });
            cadastradas++;
          }
        } catch (err) {
          console.error('Erro ao cadastrar:', err);
        }
      }

      setResults({
        ...searchResult,
        cadastradas
      });

      queryClient.invalidateQueries(['leads']);
      
      // Notificação WhatsApp
      if (user?.phone) {
        const message = `🎯 *BUSCA REGIONAL CONCLUÍDA*

📍 Cidade: ${city}
✓ Encontradas: ${searchResult.total_encontradas}
✅ Cadastradas: ${cadastradas}

Clínicas encontradas:
${searchResult.clinicas.slice(0, 5).map((c, i) => 
  `${i+1}. ${c.nome}\n   ${c.endereco}\n   ${c.telefone}`
).join('\n\n')}

_Via: ${searchResult.clinicas.map(c => c.fonte).join(', ')}_`;

        navigator.clipboard.writeText(message);
        setTimeout(() => {
          window.open(`https://wa.me/${user.phone}?text=${encodeURIComponent(message)}`, '_blank');
        }, 500);
      }

      toast.success(`${cadastradas} clínicas cadastradas!`, {
        description: `${searchResult.total_encontradas} encontradas em ${city}`
      });

    } catch (error) {
      console.error(error);
      toast.error('Erro na busca regional');
    } finally {
      setSearching(false);
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 shadow-lg sticky top-0 z-30">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center">
          <Search className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            🔍 Busca Regional de Clínicas
          </h3>
          <p className="text-xs text-slate-600">Cadastro automático de leads</p>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <Input
          placeholder="Digite a cidade..."
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && searchClinics()}
          className="flex-1"
        />
        <Button
          onClick={searchClinics}
          disabled={searching}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {searching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <Badge className="bg-blue-100 text-blue-700">
          <Globe className="w-3 h-3 mr-1" />
          Google
        </Badge>
        <Badge className="bg-pink-100 text-pink-700">
          <Instagram className="w-3 h-3 mr-1" />
          Instagram
        </Badge>
        <Badge className="bg-purple-100 text-purple-700">
          <MapPin className="w-3 h-3 mr-1" />
          Maps
        </Badge>
        <Badge className="bg-orange-100 text-orange-700">
          <Sparkles className="w-3 h-3 mr-1" />
          IA
        </Badge>
      </div>

      {results && (
        <div className="mt-3 p-3 bg-white rounded-lg border-2 border-green-300">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div>
              <p className="text-2xl font-bold text-emerald-700">{results.total_encontradas}</p>
              <p className="text-xs text-slate-600">Encontradas</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{results.cadastradas}</p>
              <p className="text-xs text-slate-600">Cadastradas</p>
            </div>
          </div>
          <p className="text-xs text-center text-slate-500 mt-2">
            ✓ Leads criados em "Possíveis Vendas"
          </p>
        </div>
      )}
    </Card>
  );
}