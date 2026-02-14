import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { MapPin, Search, Mic, Loader2, Users, Brain, Globe } from 'lucide-react';

// Cálculo numerológico offline (sem IA)
const calculateNumerology = (name) => {
  const values = {
    A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,I:9,
    J:1,K:2,L:3,M:4,N:5,O:6,P:7,Q:8,R:9,
    S:1,T:2,U:3,V:4,W:5,X:6,Y:7,Z:8
  };
  
  const cleanName = name.toUpperCase().replace(/[^A-Z]/g, '');
  let sum = 0;
  for (let char of cleanName) {
    sum += values[char] || 0;
  }
  
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = String(sum).split('').reduce((a, b) => a + parseInt(b), 0);
  }
  
  return sum;
};

const getNumerologyProfile = (number) => {
  const profiles = {
    1: { profile: "Líder Natural", decision: "Rápido e direto", approach: "Seja assertivo, mostre resultados imediatos. Use frases como 'Você quer ser o primeiro da região?' e 'Liderança tecnológica'." },
    2: { profile: "Diplomata", decision: "Analítico e cuidadoso", approach: "Construa confiança, mostre dados científicos. Use 'Validado por estudos' e 'Garantia de qualidade'." },
    3: { profile: "Comunicador", decision: "Criativo e social", approach: "Use storytelling, cases de sucesso. Diga 'Imagine seus clientes falando bem de você' e 'Você vai se destacar'." },
    4: { profile: "Organizador", decision: "Metódico e prático", approach: "Processo claro, passo a passo. Use 'Sistema comprovado' e 'Sem complicações'." },
    5: { profile: "Aventureiro", decision: "Inovador e ousado", approach: "Destaque inovação. Diga 'Tecnologia de ponta' e 'À frente da concorrência'." },
    6: { profile: "Conselheiro", decision: "Empático e responsável", approach: "Foco em benefício dos pacientes. Use 'Salvar vidas' e 'Cuidado com excelência'." },
    7: { profile: "Analítico", decision: "Investigativo e técnico", approach: "Dados científicos, especificações técnicas. Use 'Precisão comprovada' e 'Referências científicas'." },
    8: { profile: "Executivo", decision: "Focado em ROI", approach: "Números, retorno financeiro. Diga 'Retorno em X meses' e 'Economia de Y%'." },
    9: { profile: "Humanista", decision: "Idealista e generoso", approach: "Impacto social. Use 'Transformar vidas' e 'Fazer a diferença'." },
    11: { profile: "Visionário", decision: "Intuitivo e inspirador", approach: "Visão de futuro. Diga 'Revolucione sua clínica' e 'Seja referência'." },
    22: { profile: "Construtor", decision: "Ambicioso e prático", approach: "Grande escala. Use 'Expanda seu negócio' e 'Construa um império'." }
  };
  
  return profiles[number] || profiles[1];
};

export default function CityLeadCapture() {
  const [city, setCity] = useState('');
  const [useAI, setUseAI] = useState(true);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [listening, setListening] = useState(false);

  // Reconhecimento de voz
  const startVoiceRecognition = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast.error('Reconhecimento de voz não suportado neste navegador');
      return;
    }

    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;

    recognition.onstart = () => {
      setListening(true);
      toast.info('🎤 Fale o nome da cidade...');
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setCity(transcript);
      toast.success(`Cidade detectada: ${transcript}`);
    };

    recognition.onerror = () => {
      toast.error('Erro ao reconhecer voz');
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
  };

  const searchWithAI = async () => {
    setLoading(true);
    const loadingToast = toast.loading('🤖 Buscando com IA...');

    try {
      // Buscar clientes existentes
      const existingClients = await base44.entities.Client.list();
      const clientsInCity = existingClients.filter(c => 
        c.city?.toLowerCase().includes(city.toLowerCase())
      );

      // Buscar novas clínicas com IA
      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `Busque clínicas veterinárias em ${city}, Brasil.

Para CADA clínica encontrada, retorne:
- name: Nome da clínica
- owner_name: Nome do proprietário/veterinário responsável (PRIMEIRO NOME obrigatório)
- phone: Telefone
- address: Endereço completo
- rating: Avaliação Google (se disponível)

IMPORTANTE: Se não encontrar o nome do proprietário, use o primeiro nome que aparecer ou deixe como "Proprietário".

Retorne no mínimo 5 clínicas.`,
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
                  owner_name: { type: "string" },
                  phone: { type: "string" },
                  address: { type: "string" },
                  rating: { type: "number" }
                }
              }
            }
          }
        }
      });

      // Processar cada clínica com numerologia
      const processedClinics = aiResponse.clinics.map(clinic => {
        const firstName = clinic.owner_name?.split(' ')[0] || 'Proprietário';
        const numerologyNumber = calculateNumerology(firstName);
        const profile = getNumerologyProfile(numerologyNumber);

        return {
          ...clinic,
          first_name: firstName,
          numerology_number: numerologyNumber,
          profile: profile.profile,
          decision_style: profile.decision,
          approach: profile.approach
        };
      });

      toast.dismiss(loadingToast);
      setResults({
        existing: clientsInCity,
        new: processedClinics,
        total: clientsInCity.length + processedClinics.length
      });

      toast.success(`✅ ${processedClinics.length} novas clínicas + ${clientsInCity.length} existentes`);

    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Erro ao buscar com IA: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const searchWithoutAI = async () => {
    setLoading(true);
    const loadingToast = toast.loading('🔍 Buscando no Google (sem IA)...');

    try {
      // Buscar clientes existentes
      const existingClients = await base44.entities.Client.list();
      const clientsInCity = existingClients.filter(c => 
        c.city?.toLowerCase().includes(city.toLowerCase())
      );

      // Busca web básica (sem IA)
      const searchQuery = `clínicas veterinárias ${city}`;
      window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, '_blank');

      toast.dismiss(loadingToast);
      toast.success(`✅ ${clientsInCity.length} clientes existentes encontrados. Busca Google aberta!`);

      setResults({
        existing: clientsInCity,
        new: [],
        total: clientsInCity.length
      });

    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Erro: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const createLead = async (clinic) => {
    try {
      await base44.entities.Lead.create({
        full_name: clinic.first_name,
        company: clinic.name,
        city: city,
        phone: clinic.phone,
        source: 'analise_mercado_ia',
        status: 'novo',
        lead_score: 50,
        notes: `Numerologia: ${clinic.numerology_number} - ${clinic.profile}\n\nAbordagem: ${clinic.approach}`
      });

      toast.success(`Lead ${clinic.first_name} criado!`);
    } catch (error) {
      toast.error('Erro ao criar lead');
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-400">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
          <MapPin className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-blue-900">📍 Captura de Leads por Cidade</h3>
          <p className="text-xs text-blue-700">Busca + Numerologia Automática</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="Digite a cidade..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="flex-1"
            disabled={loading}
          />
          <Button
            size="icon"
            onClick={startVoiceRecognition}
            disabled={listening || loading}
            className={`${listening ? 'bg-red-600 animate-pulse' : 'bg-blue-600'}`}
          >
            <Mic className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={searchWithAI}
            disabled={!city || loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Com IA
              </>
            )}
          </Button>
          <Button
            onClick={searchWithoutAI}
            disabled={!city || loading}
            variant="outline"
            className="flex-1"
          >
            <Globe className="w-4 h-4 mr-2" />
            Sem IA
          </Button>
        </div>

        {results && (
          <div className="space-y-3 mt-4">
            <div className="grid grid-cols-2 gap-2">
              <Card className="p-3 bg-green-100">
                <p className="text-2xl font-bold text-green-900">{results.existing.length}</p>
                <p className="text-xs text-green-700">Clientes Existentes</p>
              </Card>
              <Card className="p-3 bg-blue-100">
                <p className="text-2xl font-bold text-blue-900">{results.new.length}</p>
                <p className="text-xs text-blue-700">Novas Clínicas</p>
              </Card>
            </div>

            {results.existing.length > 0 && (
              <div className="bg-white rounded-lg p-3 border border-green-300">
                <p className="font-semibold text-green-900 mb-2">✅ Clientes Existentes:</p>
                {results.existing.slice(0, 5).map((client, idx) => (
                  <div key={idx} className="text-xs py-1 border-b last:border-b-0">
                    <p className="font-medium">{client.first_name} - {client.clinic_name}</p>
                    <p className="text-slate-600">{client.status} • Score: {client.purchase_score}%</p>
                  </div>
                ))}
                {results.existing.length > 5 && (
                  <p className="text-xs text-slate-500 mt-2">+ {results.existing.length - 5} mais...</p>
                )}
              </div>
            )}

            {results.new.length > 0 && (
              <div className="space-y-2">
                <p className="font-semibold text-blue-900">🆕 Novas Clínicas Encontradas:</p>
                {results.new.map((clinic, idx) => (
                  <Card key={idx} className="p-3 bg-white border border-blue-200">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{clinic.name}</p>
                        <p className="text-xs text-slate-600">{clinic.first_name}</p>
                        <p className="text-xs text-slate-500">{clinic.phone}</p>
                      </div>
                      <Badge className="bg-purple-100 text-purple-900">
                        {clinic.numerology_number}
                      </Badge>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-2 mb-2">
                      <p className="text-xs font-semibold text-purple-900">🔮 {clinic.profile}</p>
                      <p className="text-xs text-purple-700 mt-1">{clinic.decision_style}</p>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-2 mb-2">
                      <p className="text-xs font-semibold text-blue-900">💡 Abordagem:</p>
                      <p className="text-xs text-blue-700">{clinic.approach}</p>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => createLead(clinic)}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <Users className="w-3 h-3 mr-1" />
                      Criar Lead
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}