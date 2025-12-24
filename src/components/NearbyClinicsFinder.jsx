import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from '@/api/base44Client';
import { Loader2, MapPin, Search, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function NearbyClinicsFinder({ client }) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const findNearbyClinics = async () => {
    setLoading(true);
    try {
      const prompt = `Você é um especialista em análise de mercado veterinário. Encontre clínicas próximas ao cliente.

**CLIENTE:** ${client.first_name}
**CIDADE:** ${client.city}
**ENDEREÇO:** ${client.address || 'Não informado'}

**TAREFA:**
Use seu conhecimento para identificar:

1. **CLÍNICAS PRÓXIMAS:**
   - Nome da clínica
   - Endereço aproximado
   - Distância estimada (km)
   - Porte estimado (pequena/média/grande)
   - Especialidades conhecidas

2. **REDES SOCIAIS:**
   - Instagram (se conhecido)
   - Facebook (se conhecido)
   - Website (se conhecido)

3. **EVENTOS PRÓXIMOS:**
   - Eventos veterinários na região
   - Congressos, feiras, workshops
   - Datas e locais

4. **ANÁLISE COMPETITIVA:**
   - Principais concorrentes diretos
   - Diferenciais de mercado
   - Oportunidades identificadas

Retorne dados estruturados e práticos.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            nearby_clinics: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  address: { type: "string" },
                  distance_km: { type: "number" },
                  size: { type: "string" },
                  specialties: { type: "array", items: { type: "string" } },
                  instagram: { type: "string" },
                  facebook: { type: "string" },
                  website: { type: "string" }
                }
              }
            },
            nearby_events: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  date: { type: "string" },
                  location: { type: "string" },
                  type: { type: "string" }
                }
              }
            },
            competitive_analysis: {
              type: "object",
              properties: {
                main_competitors: { type: "array", items: { type: "string" } },
                market_opportunities: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      });

      setResults(result);
      toast.success('Análise concluída!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao buscar clínicas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-5 bg-gradient-to-r from-teal-50 to-cyan-50 border-2 border-teal-300">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center">
          <MapPin className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">Clínicas Próximas</h3>
          <p className="text-xs text-slate-600">Google Maps + Redes Sociais + Eventos</p>
        </div>
      </div>

      {!results && (
        <Button
          onClick={findNearbyClinics}
          disabled={loading}
          className="w-full bg-teal-600 hover:bg-teal-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Pesquisando...
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Buscar Clínicas e Eventos Próximos
            </>
          )}
        </Button>
      )}

      {results && (
        <div className="space-y-4">
          {/* Clínicas Próximas */}
          {results.nearby_clinics?.length > 0 && (
            <div>
              <h4 className="font-semibold text-slate-800 mb-2">🏥 Clínicas Próximas</h4>
              <div className="space-y-2">
                {results.nearby_clinics.map((clinic, idx) => (
                  <div key={idx} className="p-3 bg-white rounded-lg border border-teal-200">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-slate-800">{clinic.name}</p>
                        <p className="text-xs text-slate-600">{clinic.address}</p>
                      </div>
                      <Badge className="bg-teal-100 text-teal-700">
                        {clinic.distance_km} km
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">{clinic.size}</Badge>
                      {clinic.specialties?.map((spec, i) => (
                        <Badge key={i} className="bg-blue-100 text-blue-700 text-xs">
                          {spec}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      {clinic.instagram && (
                        <a 
                          href={`https://instagram.com/${clinic.instagram}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-pink-600 hover:underline"
                        >
                          📷 Instagram
                        </a>
                      )}
                      {clinic.website && (
                        <a 
                          href={clinic.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Site
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Eventos Próximos */}
          {results.nearby_events?.length > 0 && (
            <div>
              <h4 className="font-semibold text-slate-800 mb-2">📅 Eventos Próximos</h4>
              <div className="space-y-2">
                {results.nearby_events.map((event, idx) => (
                  <div key={idx} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="font-semibold text-slate-800">{event.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-600">{event.date}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-600">{event.location}</span>
                    </div>
                    <Badge className="bg-purple-100 text-purple-700 text-xs mt-2">
                      {event.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Análise Competitiva */}
          {results.competitive_analysis && (
            <div>
              <h4 className="font-semibold text-slate-800 mb-2">🎯 Análise Competitiva</h4>
              
              {results.competitive_analysis.main_competitors?.length > 0 && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200 mb-2">
                  <p className="text-xs font-semibold text-red-700 mb-1">Concorrentes Principais</p>
                  <ul className="space-y-1">
                    {results.competitive_analysis.main_competitors.map((comp, idx) => (
                      <li key={idx} className="text-sm text-slate-700">• {comp}</li>
                    ))}
                  </ul>
                </div>
              )}

              {results.competitive_analysis.market_opportunities?.length > 0 && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs font-semibold text-green-700 mb-1">Oportunidades de Mercado</p>
                  <ul className="space-y-1">
                    {results.competitive_analysis.market_opportunities.map((opp, idx) => (
                      <li key={idx} className="text-sm text-slate-700">• {opp}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <Button
            onClick={findNearbyClinics}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            Atualizar Análise
          </Button>
        </div>
      )}
    </Card>
  );
}