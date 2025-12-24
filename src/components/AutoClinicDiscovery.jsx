import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';
import { Loader2, Search, CheckCircle2, Building2, MapPin } from 'lucide-react';
import { toast } from 'sonner';

export default function AutoClinicDiscovery() {
  const [discovering, setDiscovering] = useState(false);
  const [results, setResults] = useState([]);
  const [progress, setProgress] = useState('');

  const cities = [
    'Marília', 'Assis', 'Ourinhos', 'Tupã', 'Pompeia', 'Vera Cruz',
    'Garça', 'Adamantina', 'Lucélia', 'Osvaldo Cruz', 'Parapuã',
    'Bastos', 'Ocauçu', 'Echaporã', 'Júlio Mesquita', 'Oriente'
  ];

  const startDiscovery = async () => {
    setDiscovering(true);
    setResults([]);
    const allDiscovered = [];

    try {
      for (const city of cities) {
        setProgress(`🔍 Buscando em ${city}...`);

        // Busca 1: Google - Clínicas Veterinárias
        try {
          const googleResult = await base44.integrations.Core.InvokeLLM({
            prompt: `Busque TODAS as clínicas veterinárias, hospitais veterinários e veterinários autônomos em ${city}, SP.
            
Para cada estabelecimento encontrado, retorne:
- Nome completo da clínica/hospital/veterinário
- Endereço completo
- Telefone (se disponível)
- Email (se disponível)
- CNPJ (se disponível)
- Nome do proprietário/veterinário responsável
- Tipo (clínica pequena/média, hospital, autônomo)

Busque em:
- Google Maps
- Listas telefônicas
- Guias comerciais
- Redes sociais

Retorne TODOS os encontrados, sem limite.`,
            add_context_from_internet: true,
            response_json_schema: {
              type: "object",
              properties: {
                clinics: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      address: { type: "string" },
                      phone: { type: "string" },
                      email: { type: "string" },
                      cnpj: { type: "string" },
                      owner_name: { type: "string" },
                      clinic_type: { type: "string" }
                    }
                  }
                }
              }
            }
          });

          if (googleResult.clinics?.length > 0) {
            allDiscovered.push(...googleResult.clinics.map(c => ({ ...c, city, source: 'Google' })));
          }
        } catch (error) {
          console.error(`Erro Google ${city}:`, error);
        }

        // Busca 2: CRMV-SP
        try {
          const crmvResult = await base44.integrations.Core.InvokeLLM({
            prompt: `Acesse o site do CRMV-SP (Conselho Regional de Medicina Veterinária de São Paulo) e busque TODOS os veterinários registrados em ${city}, SP.

Para cada veterinário encontrado:
- Nome completo
- CRMV número
- Endereço de atuação
- Telefone
- Email
- Tipo de atuação (clínica própria, hospital, autônomo, etc)

URL do CRMV-SP: https://www.crmvsp.gov.br/

Retorne TODOS os veterinários encontrados nesta cidade.`,
            add_context_from_internet: true,
            response_json_schema: {
              type: "object",
              properties: {
                veterinarians: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      crmv: { type: "string" },
                      address: { type: "string" },
                      phone: { type: "string" },
                      email: { type: "string" },
                      clinic_name: { type: "string" }
                    }
                  }
                }
              }
            }
          });

          if (crmvResult.veterinarians?.length > 0) {
            allDiscovered.push(...crmvResult.veterinarians.map(v => ({ 
              name: v.name,
              clinic_name: v.clinic_name || `${v.name} - Veterinário`,
              address: v.address,
              phone: v.phone,
              email: v.email,
              city,
              source: 'CRMV-SP'
            })));
          }
        } catch (error) {
          console.error(`Erro CRMV ${city}:`, error);
        }

        setResults([...allDiscovered]);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Cadastrar todos automaticamente
      setProgress('💾 Cadastrando clientes...');
      
      const existingClients = await base44.entities.Client.list();
      const existingEmails = new Set(existingClients.map(c => c.email?.toLowerCase()));
      const existingPhones = new Set(existingClients.map(c => c.phone));

      let created = 0;
      let skipped = 0;

      for (const clinic of allDiscovered) {
        const isDuplicate = 
          (clinic.email && existingEmails.has(clinic.email.toLowerCase())) ||
          (clinic.phone && existingPhones.has(clinic.phone));

        if (!isDuplicate && clinic.name) {
          try {
            await base44.entities.Client.create({
              first_name: clinic.owner_name || clinic.name,
              clinic_name: clinic.clinic_name || clinic.name,
              address: clinic.address,
              city: clinic.city,
              phone: clinic.phone,
              email: clinic.email,
              cnpj: clinic.cnpj,
              client_type: clinic.clinic_type === 'hospital' ? 'hospital_veterinario' : 
                           clinic.clinic_type === 'autônomo' ? 'clinica_pequena' : 'clinica_media',
              status: 'frio',
              lead_source: `descoberta_automatica_${clinic.source}`,
              notes: `Cliente descoberto automaticamente via ${clinic.source} em ${new Date().toLocaleDateString('pt-BR')}`
            });
            created++;
          } catch (error) {
            console.error('Erro ao criar:', error);
          }
        } else {
          skipped++;
        }
      }

      toast.success(`✅ Descoberta concluída! ${created} novos clientes, ${skipped} duplicados ignorados`);
      setProgress(`✅ Concluído: ${created} novos, ${skipped} já existentes`);

    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro na descoberta automática');
    } finally {
      setDiscovering(false);
    }
  };

  return (
    <Card className="p-5 bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center">
          <Search className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">Descoberta Automática de Clínicas</h3>
          <p className="text-xs text-slate-600">Busca completa em toda a região + CRMV-SP</p>
        </div>
      </div>

      <div className="mb-4 p-3 bg-white rounded-lg">
        <p className="text-xs text-slate-600 mb-2">🎯 <strong>Cidades cobertas:</strong></p>
        <div className="flex flex-wrap gap-1">
          {cities.map(city => (
            <span key={city} className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
              {city}
            </span>
          ))}
        </div>
      </div>

      <Button
        onClick={startDiscovery}
        disabled={discovering}
        className="w-full bg-orange-600 hover:bg-orange-700 mb-3"
      >
        {discovering ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Descobrindo...
          </>
        ) : (
          <>
            <Search className="w-4 h-4 mr-2" />
            Iniciar Descoberta Completa
          </>
        )}
      </Button>

      {progress && (
        <div className="p-3 bg-white rounded-lg border border-orange-200 mb-3">
          <p className="text-sm text-slate-700">{progress}</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-700">📋 Descobertos: {results.length}</p>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {results.map((clinic, idx) => (
              <div key={idx} className="p-2 bg-white rounded border border-slate-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">{clinic.name}</p>
                    <p className="text-xs text-slate-600">{clinic.clinic_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500">{clinic.city}</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">
                        {clinic.source}
                      </span>
                    </div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}