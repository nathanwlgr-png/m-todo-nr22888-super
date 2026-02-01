import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Target, Plus, Trash2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';

export default function CompetitorAnalysisModule({ client }) {
  const [competitors, setCompetitors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    main_products: '',
    pricing: '',
    market_presence: '',
    strengths: '',
    weaknesses: '',
    threat_level: 'media'
  });

  const analyzeCompetitors = async () => {
    if (!client?.city && !client?.clinic_name) {
      toast.error('Cliente precisa ter cidade ou nome da clínica');
      return;
    }
    
    setLoading(true);
    try {
      const prompt = `Você é um analista de inteligência competitiva para equipamentos veterinários.

CONTEXTO DO CLIENTE:
- Clínica: ${client.clinic_name || client.first_name}
- Cidade: ${client.city}
- Tipo: ${client.client_type}
- Equipamento Atual: ${client.current_equipment || 'Não informado'}
- Interesse: ${client.equipment_interest || 'Não definido'}

TAREFA: Identifique os PRINCIPAIS COMPETIDORES (máximo 5) que vendem equipamentos similares nesta região.

Para CADA competidor, retorne:

{
  "competitors": [
    {
      "name": "Nome da Empresa",
      "headquarters": "Localização",
      "main_products": "Produtos principais (lista separada por vírgula)",
      "market_presence": "Presença: Nacional/Regional/Local",
      "estimated_market_share": "% estimado",
      "pricing_strategy": "Premium/Mid-range/Budget",
      "strengths": [
        "Força 1",
        "Força 2",
        "Força 3"
      ],
      "weaknesses": [
        "Fraqueza 1",
        "Fraqueza 2"
      ],
      "key_clients": "Tipos de cliente que servem",
      "threat_level": "Alta/Média/Baixa",
      "differentiation": "Como se diferencia",
      "vulnerability": "Como vencer este competidor",
      "recent_moves": "Movimentos recentes (se houver)"
    }
  ],
  "competitive_landscape": {
    "market_concentration": "Mercado concentrado/Disperso",
    "main_battleground": "Principal campo de disputa",
    "customer_preferences": "Preferências dos clientes",
    "emerging_competitors": "Novos concorrentes emergindo?"
  },
  "positioning_strategy": [
    "Estratégia 1 para se diferenciar",
    "Estratégia 2 para competir",
    "Estratégia 3 para vencer"
  ]
}

Use dados públicos: Google Maps, redes sociais, websites, eventos do setor, avaliações.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            competitors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  headquarters: { type: "string" },
                  main_products: { type: "string" },
                  market_presence: { type: "string" },
                  estimated_market_share: { type: "string" },
                  pricing_strategy: { type: "string" },
                  strengths: { type: "array", items: { type: "string" } },
                  weaknesses: { type: "array", items: { type: "string" } },
                  key_clients: { type: "string" },
                  threat_level: { type: "string" },
                  differentiation: { type: "string" },
                  vulnerability: { type: "string" },
                  recent_moves: { type: "string" }
                }
              }
            },
            competitive_landscape: {
              type: "object",
              properties: {
                market_concentration: { type: "string" },
                main_battleground: { type: "string" },
                customer_preferences: { type: "string" },
                emerging_competitors: { type: "string" }
              }
            },
            positioning_strategy: { type: "array", items: { type: "string" } }
          }
        }
      });

      if (result?.competitors && Array.isArray(result.competitors)) {
        setCompetitors(result.competitors);
        toast.success(`${result.competitors.length} competidores identificados!`);
      } else {
        toast.error('Nenhum competidor encontrado');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error(error.message || 'Erro ao analisar competidores');
    } finally {
      setLoading(false);
    }
  };

  const addManualCompetitor = () => {
    if (!formData.name.trim()) {
      toast.error('Digite o nome do competidor');
      return;
    }

    setCompetitors([...competitors, { ...formData, id: Date.now() }]);
    setFormData({
      name: '',
      main_products: '',
      pricing: '',
      market_presence: '',
      strengths: '',
      weaknesses: '',
      threat_level: 'media'
    });
    setShowForm(false);
    toast.success('Competidor adicionado!');
  };

  const deleteCompetitor = (id) => {
    setCompetitors(competitors.filter(c => c.id !== id));
    toast.success('Competidor removido!');
  };

  const downloadAnalysisPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPosition = 15;

      // Header
      doc.setFontSize(16);
      doc.text('🎯 ANÁLISE COMPETITIVA', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 8;
      doc.setFontSize(10);
      doc.text(`Cliente: ${client.clinic_name || client.first_name}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 12;

      // Competidores
      doc.setFontSize(14);
      doc.text('Competidores Identificados', 10, yPosition);
      yPosition += 8;

      competitors.forEach((comp, idx) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 15;
        }

        doc.setFontSize(11);
        doc.text(`${idx + 1}. ${comp.name}`, 10, yPosition);
        yPosition += 6;

        doc.setFontSize(9);
        const details = [
          `Sede: ${comp.headquarters || comp.market_presence || 'N/A'}`,
          `Produtos: ${comp.main_products || 'N/A'}`,
          `Presença: ${comp.market_presence || 'N/A'}`,
          `Estratégia de Preço: ${comp.pricing_strategy || comp.pricing || 'N/A'}`,
          `Ameaça: ${comp.threat_level || 'Média'}`
        ];

        details.forEach(detail => {
          doc.text(`• ${detail}`, 15, yPosition);
          yPosition += 4;
        });

        // Strengths
        if ((comp.strengths || '').split(',').filter(s => s.trim()).length > 0) {
          yPosition += 2;
          doc.setTextColor(0, 153, 0);
          doc.setFontSize(8);
          doc.text('✓ Forças:', 15, yPosition);
          yPosition += 3;
          doc.setTextColor(0, 0, 0);
          
          const strengthsList = comp.strengths?.split(',') || [];
          strengthsList.forEach(s => {
            if (s.trim()) {
              doc.text(`- ${s.trim()}`, 18, yPosition);
              yPosition += 3;
            }
          });
        }

        // Weaknesses
        if ((comp.weaknesses || '').split(',').filter(s => s.trim()).length > 0) {
          yPosition += 2;
          doc.setTextColor(204, 0, 0);
          doc.setFontSize(8);
          doc.text('✗ Fraquezas:', 15, yPosition);
          yPosition += 3;
          doc.setTextColor(0, 0, 0);
          
          const weaknessList = comp.weaknesses?.split(',') || [];
          weaknessList.forEach(w => {
            if (w.trim()) {
              doc.text(`- ${w.trim()}`, 18, yPosition);
              yPosition += 3;
            }
          });
        }

        // Vulnerability
        if (comp.vulnerability) {
          yPosition += 2;
          doc.setTextColor(0, 102, 204);
          doc.setFontSize(8);
          doc.text('💡 Como Vencer:', 15, yPosition);
          yPosition += 3;
          doc.setTextColor(0, 0, 0);
          
          const splitVuln = doc.splitTextToSize(comp.vulnerability, 170);
          doc.text(splitVuln, 18, yPosition);
          yPosition += (splitVuln.length * 3) + 4;
        }

        yPosition += 5;
      });

      const timestamp = new Date().toISOString().slice(0, 10);
      doc.save(`analise-competidores-${client.clinic_name || client.first_name}-${timestamp}.pdf`);
      toast.success('PDF baixado!');
    } catch (error) {
      toast.error('Erro ao gerar PDF');
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-purple-50 to-fuchsia-50 border-2 border-purple-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-purple-900">🎯 Análise de Concorrentes</p>
            <p className="text-xs text-purple-600">{competitors.length} competidor(es) identificado(s)</p>
          </div>
        </div>
        {competitors.length > 0 && (
          <Button size="sm" onClick={downloadAnalysisPDF} className="bg-purple-600 hover:bg-purple-700">
            <Download className="w-3 h-3 mr-1" />
            PDF
          </Button>
        )}
      </div>

      {competitors.length === 0 ? (
        <div className="space-y-3">
          <Button
            onClick={analyzeCompetitors}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Analisando...
              </>
            ) : (
              <>
                <Target className="w-4 h-4 mr-2" />
                Analisar Concorrentes (IA)
              </>
            )}
          </Button>
          <Button
            onClick={() => setShowForm(!showForm)}
            variant="outline"
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Manual
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {competitors.map((comp, idx) => (
            <div key={comp.id || idx} className="p-3 bg-white rounded-lg border-2 border-purple-200">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-bold text-slate-800">{comp.name}</h4>
                <div className="flex gap-2">
                  <Badge className={
                    comp.threat_level === 'Alta' ? 'bg-red-600' :
                    comp.threat_level === 'Média' ? 'bg-yellow-600' :
                    'bg-green-600'
                  }>
                    {comp.threat_level || 'Média'}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteCompetitor(comp.id)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                {comp.headquarters && (
                  <div>
                    <p className="text-slate-600">Sede</p>
                    <p className="font-semibold text-slate-800">{comp.headquarters}</p>
                  </div>
                )}
                {comp.main_products && (
                  <div>
                    <p className="text-slate-600">Produtos</p>
                    <p className="font-semibold text-slate-800">{comp.main_products}</p>
                  </div>
                )}
              </div>

              {comp.strengths && (
                <div className="p-2 bg-green-50 rounded mb-2 text-xs">
                  <p className="text-green-700 font-semibold mb-1">✓ Forças:</p>
                  <p className="text-green-600">{comp.strengths}</p>
                </div>
              )}

              {comp.weaknesses && (
                <div className="p-2 bg-red-50 rounded mb-2 text-xs">
                  <p className="text-red-700 font-semibold mb-1">✗ Fraquezas:</p>
                  <p className="text-red-600">{comp.weaknesses}</p>
                </div>
              )}

              {comp.vulnerability && (
                <div className="p-2 bg-blue-50 rounded text-xs">
                  <p className="text-blue-700 font-semibold mb-1">💡 Como Vencer:</p>
                  <p className="text-blue-600">{comp.vulnerability}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="mt-4 p-3 bg-white rounded-lg border-2 border-purple-200 space-y-2">
          <Input
            placeholder="Nome do competidor"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            placeholder="Produtos principais"
            value={formData.main_products}
            onChange={(e) => setFormData({ ...formData, main_products: e.target.value })}
          />
          <Textarea
            placeholder="Forças"
            value={formData.strengths}
            onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
            rows={2}
          />
          <Textarea
            placeholder="Fraquezas"
            value={formData.weaknesses}
            onChange={(e) => setFormData({ ...formData, weaknesses: e.target.value })}
            rows={2}
          />
          <Textarea
            placeholder="Como vencer este competidor"
            value={formData.vulnerability}
            onChange={(e) => setFormData({ ...formData, vulnerability: e.target.value })}
            rows={2}
          />
          <div className="flex gap-2">
            <Button
              onClick={addManualCompetitor}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              Adicionar
            </Button>
            <Button
              onClick={() => setShowForm(false)}
              variant="outline"
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}