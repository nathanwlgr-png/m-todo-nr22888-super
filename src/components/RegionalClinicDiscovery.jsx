import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Search, MapPin, Phone, Mail, Building } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from "@/components/ui/badge";

export default function RegionalClinicDiscovery() {
  const [searching, setSearching] = useState(false);
  const [discoveredClinics, setDiscoveredClinics] = useState([]);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      try {
        const data = await base44.entities.Client.list();
        return data.filter(c => c && c.id && !c.is_deleted);
      } catch (error) {
        return [];
      }
    }
  });

  // Extrair cidades únicas dos clientes
  const clientCities = [...new Set(clients.map(c => c.city).filter(Boolean))];
  
  // Extrair nomes de clínicas já cadastradas
  const existingClinics = clients.map(c => 
    c.clinic_name?.toLowerCase() || c.full_name?.toLowerCase() || ''
  );

  const searchNewClinics = async () => {
    setSearching(true);
    try {
      const citiesList = clientCities.length > 0 ? clientCities.join(', ') : 'Ourinhos, Marília, SP';
      
      toast.info(`🔍 Pesquisando clínicas veterinárias em: ${citiesList}`, { duration: 5000 });

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um analista de mercado veterinário. Pesquise clínicas veterinárias nas seguintes cidades:

REGIÕES: ${citiesList}

CLÍNICAS JÁ CADASTRADAS (ignorar estas):
${existingClinics.slice(0, 20).join('\n')}

INSTRUÇÕES:
1. Pesquise clínicas veterinárias, hospitais veterinários e pet shops com atendimento clínico nessas regiões
2. IGNORE as clínicas já listadas acima
3. Busque informações REAIS e ATUALIZADAS na internet
4. Para cada clínica nova encontrada, forneça:
   - Nome completo da clínica
   - Endereço completo
   - Cidade
   - Telefone (se disponível)
   - Email (se disponível)
   - Especialidades/serviços
   - Porte estimado (pequeno/médio/grande)
   - Link do Google Maps ou site

FOCO: Clínicas que atendem animais de companhia E equinos (se possível identificar)

Retorne no mínimo 10 clínicas novas por região.`,
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
                  cidade: { type: "string" },
                  telefone: { type: "string" },
                  email: { type: "string" },
                  especialidades: { type: "array", items: { type: "string" } },
                  porte: { type: "string" },
                  site_ou_maps: { type: "string" },
                  atende_equinos: { type: "boolean" }
                }
              }
            },
            total_encontradas: { type: "number" },
            regioes_pesquisadas: { type: "array", items: { type: "string" } }
          }
        }
      });

      setDiscoveredClinics(response.clinicas || []);
      
      toast.success(`✅ ${response.total_encontradas || response.clinicas?.length || 0} clínicas novas encontradas!`);

      // Salvar relatório
      const report = `
╔═══════════════════════════════════════════════════════════════════════╗
║           CLÍNICAS VETERINÁRIAS DESCOBERTAS - NOVAS OPORTUNIDADES    ║
╚═══════════════════════════════════════════════════════════════════════╝

Data: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}
Regiões Pesquisadas: ${response.regioes_pesquisadas?.join(', ') || citiesList}
Total Encontradas: ${response.total_encontradas || response.clinicas?.length || 0}

═══════════════════════════════════════════════════════════════════════

${response.clinicas?.map((clinic, idx) => `
${idx + 1}. ${clinic.nome.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Endereço: ${clinic.endereco}
🏙️ Cidade: ${clinic.cidade}
📞 Telefone: ${clinic.telefone || 'Não informado'}
📧 Email: ${clinic.email || 'Não informado'}
🏥 Porte: ${clinic.porte}
${clinic.atende_equinos ? '🐴 ATENDE EQUINOS ✅' : '🐕 Animais de companhia'}

Especialidades:
${clinic.especialidades?.map(esp => `   • ${esp}`).join('\n')}

🔗 Site/Maps: ${clinic.site_ou_maps}

AÇÃO SUGERIDA: Contato direto para apresentação dos equipamentos
STATUS: Lead Novo - Não cadastrado no CRM

`).join('\n\n')}

═══════════════════════════════════════════════════════════════════════
                          PRÓXIMOS PASSOS
═══════════════════════════════════════════════════════════════════════

1. Validar dados de contato (telefone/email)
2. Pesquisar histórico de compras de equipamentos
3. Identificar decisor (proprietário/responsável técnico)
4. Realizar primeira abordagem (telefone ou presencial)
5. Cadastrar no CRM após primeiro contato

Total de oportunidades: ${response.total_encontradas || response.clinicas?.length || 0} clínicas

═══════════════════════════════════════════════════════════════════════
`;

      await base44.entities.GeneratedDocument.create({
        title: `Clínicas Descobertas - ${citiesList} - ${new Date().toLocaleDateString('pt-BR')}`,
        type: 'relatorio',
        content: report,
        summary: `${response.total_encontradas || response.clinicas?.length || 0} novas clínicas veterinárias encontradas nas regiões de atuação`,
        tags: ['prospecção', 'clínicas novas', 'leads', ...response.regioes_pesquisadas || []]
      });

    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao pesquisar clínicas');
    } finally {
      setSearching(false);
    }
  };

  const addToLeads = async (clinic) => {
    try {
      await base44.entities.Lead.create({
        full_name: clinic.nome,
        company: clinic.nome,
        city: clinic.cidade,
        phone: clinic.telefone || '',
        email: clinic.email || '',
        source: 'analise_mercado_ia',
        lead_score: clinic.atende_equinos ? 80 : 60,
        notes: `Clínica descoberta por IA\nEspecialidades: ${clinic.especialidades?.join(', ')}\nPorte: ${clinic.porte}\nSite: ${clinic.site_ou_maps}`,
        status: 'novo'
      });
      toast.success(`${clinic.nome} adicionado aos Leads!`);
    } catch (error) {
      toast.error('Erro ao adicionar lead');
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg">
          <Search className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">Descobrir Clínicas Novas</h3>
          <p className="text-xs text-slate-600">Prospecção inteligente nas suas regiões</p>
        </div>
      </div>

      {/* Regiões de atuação */}
      <div className="mb-3 p-3 bg-white rounded-lg border border-emerald-200">
        <p className="text-xs font-semibold text-emerald-800 mb-2">📍 Suas Regiões de Atuação:</p>
        <div className="flex flex-wrap gap-2">
          {clientCities.length > 0 ? (
            clientCities.map((city, idx) => (
              <Badge key={idx} variant="outline" className="bg-emerald-50">
                {city}
              </Badge>
            ))
          ) : (
            <Badge variant="outline">Ourinhos, Marília, SP</Badge>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-2">
          {clients.length} clientes cadastrados • {existingClinics.length} clínicas conhecidas
        </p>
      </div>

      {/* Botão de busca */}
      <Button
        onClick={searchNewClinics}
        disabled={searching}
        className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 mb-3"
      >
        {searching ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Pesquisando novas clínicas...
          </>
        ) : (
          <>
            <Search className="w-5 h-5 mr-2" />
            🔍 Buscar Clínicas Não Cadastradas
          </>
        )}
      </Button>

      {/* Resultados */}
      {discoveredClinics.length > 0 && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          <p className="text-sm font-semibold text-emerald-800">
            ✅ {discoveredClinics.length} Clínicas Novas Encontradas:
          </p>
          
          {discoveredClinics.map((clinic, idx) => (
            <Card key={idx} className="p-3 bg-white border border-emerald-200">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-800 text-sm">{clinic.nome}</h4>
                  <div className="flex items-center gap-1 text-xs text-slate-600 mt-1">
                    <MapPin className="w-3 h-3" />
                    <span>{clinic.cidade} - {clinic.endereco}</span>
                  </div>
                </div>
                {clinic.atende_equinos && (
                  <Badge className="bg-orange-500 text-white text-xs">🐴 Equinos</Badge>
                )}
              </div>

              <div className="space-y-1 text-xs text-slate-600 mb-2">
                {clinic.telefone && (
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span>{clinic.telefone}</span>
                  </div>
                )}
                {clinic.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    <span>{clinic.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Building className="w-3 h-3" />
                  <span>Porte: {clinic.porte}</span>
                </div>
              </div>

              {clinic.especialidades && clinic.especialidades.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {clinic.especialidades.slice(0, 3).map((esp, i) => (
                    <Badge key={i} variant="outline" className="text-xs bg-slate-50">
                      {esp}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => addToLeads(clinic)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-xs"
                >
                  Adicionar aos Leads
                </Button>
                {clinic.site_ou_maps && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(clinic.site_ou_maps, '_blank')}
                    className="text-xs"
                  >
                    Ver Maps
                  </Button>
                )}
              </div>
            </Card>
          ))}

          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <p className="text-xs text-emerald-800">
              💾 Relatório completo salvo em "Documentos Gerados"
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}