import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles,
  Loader2,
  Send,
  FileText,
  Download,
  Copy,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

const EQUIPAMENTOS = [
  { id: 'VG2', name: 'VG2 - Hemogasometria + Imunofluorescência', icon: '🔬' },
  { id: 'VG1', name: 'VG1 - Hemogasometria Básica', icon: '💉' },
  { id: 'VQ1', name: 'VQ1 - PCR Veterinário', icon: '🧬' },
  { id: 'QT3', name: 'QT3 - Bioquímico + Coagulação + Gases', icon: '⚗️' },
  { id: '3DX', name: 'Lab 3DX - Bioquímico + Imuno + Gases', icon: '🏥' },
  { id: 'SMT120', name: 'SMT-120VP - Bioquímico Veterinário', icon: '🔬' },
  { id: 'VI1', name: 'VI1 - Imunofluorescência', icon: '✨' },
  { id: 'HEMATOLOGIA', name: 'Hematologia Veterinária', icon: '🩸' }
];

export default function EquipmentReviewsGenerator({ client, onMaterialGenerated }) {
  const [generating, setGenerating] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [generatedReview, setGeneratedReview] = useState(null);

  const generateReview = async (equipmentId) => {
    setSelectedEquipment(equipmentId);
    setGenerating(true);
    try {
      const equipment = EQUIPAMENTOS.find(e => e.id === equipmentId);
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `MATERIAL DE VENDA COMPLETO - ${equipment.name}

═══════════════════════════════════════
🎯 CRIAR MATERIAL PERSUASIVO
═══════════════════════════════════════

Para o equipamento: ${equipment.name}

CLIENTE: ${client?.first_name || 'Cliente'}
Perfil: ${client?.behavioral_profile || 'N/A'}
Numerologia: ${client?.numerology_number || 'N/A'}
Clínica: ${client?.clinic_name || 'N/A'}

═══════════════════════════════════════
📋 ESTRUTURA DO MATERIAL
═══════════════════════════════════════

**1. TÍTULO IMPACTANTE**
Crie um título chamativo e profissional

**2. RESUMO EXECUTIVO (3-4 linhas)**
Por que este equipamento é essencial

**3. PRINCIPAIS DIFERENCIAIS (5-7 pontos)**
Cada diferencial deve ser:
- Específico e mensurável
- Benefício claro para a clínica
- Vantagem competitiva

**4. ESPECIFICAÇÕES TÉCNICAS**
- Parâmetros de análise
- Tempo de resultado
- Tipo de amostra
- Capacidade/volume

**5. BENEFÍCIOS FINANCEIROS**
- ROI esperado
- Economia de tempo/custos
- Aumento de receita potencial
- Comparação com terceirização

**6. CASOS DE SUCESSO**
- 2-3 casos reais de clínicas
- Resultados mensuráveis
- Depoimentos (se disponível)

**7. COMPARAÇÃO COM CONCORRENTES**
- Por que escolher Seamaty/este modelo
- Diferenciais únicos
- Vantagens técnicas

**8. PROCESSO DE COMPRA**
- Investimento inicial
- Condições de pagamento típicas
- Bonificações incluídas
- Suporte e treinamento

**9. PRÓXIMOS PASSOS**
- Call-to-action claro
- Contato direto
- Demonstração disponível

**10. PERGUNTAS FREQUENTES**
- 5-7 perguntas comuns
- Respostas diretas

Use dados REAIS do Google sobre o equipamento.
Seja EXTREMAMENTE PERSUASIVO mas profissional.
Adapte ao perfil numerológico do cliente: ${client?.behavioral_profile || 'profissional objetivo'}.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            titulo: { type: "string" },
            resumo_executivo: { type: "string" },
            diferenciais: { type: "array", items: { type: "string" } },
            especificacoes: {
              type: "object",
              properties: {
                parametros: { type: "array", items: { type: "string" } },
                tempo_resultado: { type: "string" },
                tipo_amostra: { type: "string" },
                capacidade: { type: "string" }
              }
            },
            beneficios_financeiros: {
              type: "object",
              properties: {
                roi: { type: "string" },
                economia: { type: "string" },
                aumento_receita: { type: "string" },
                vs_terceirizacao: { type: "string" }
              }
            },
            casos_sucesso: { type: "array", items: { type: "string" } },
            comparacao_concorrentes: { type: "string" },
            investimento: { type: "string" },
            condicoes_pagamento: { type: "string" },
            bonificacoes: { type: "string" },
            call_to_action: { type: "string" },
            perguntas_frequentes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  pergunta: { type: "string" },
                  resposta: { type: "string" }
                }
              }
            }
          }
        }
      });

      setGeneratedReview(result);
      toast.success('Material gerado!');
    } catch (error) {
      toast.error('Erro ao gerar material');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const generatePDF = async () => {
    if (!generatedReview) return;

    const equipment = EQUIPAMENTOS.find(e => e.id === selectedEquipment);
    const doc = new jsPDF();
    let y = 20;

    // Título
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text(equipment.icon + ' ' + equipment.name, 20, y);
    y += 10;

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(generatedReview.titulo, 20, y);
    y += 10;

    // Resumo
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const resumoLines = doc.splitTextToSize(generatedReview.resumo_executivo, 170);
    resumoLines.forEach(line => {
      if (y > 280) { doc.addPage(); y = 20; }
      doc.text(line, 20, y);
      y += 5;
    });
    y += 8;

    // Diferenciais
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('PRINCIPAIS DIFERENCIAIS', 20, y);
    y += 7;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    generatedReview.diferenciais?.forEach((dif, i) => {
      if (y > 280) { doc.addPage(); y = 20; }
      const lines = doc.splitTextToSize(`${i + 1}. ${dif}`, 165);
      lines.forEach(line => {
        doc.text(line, 25, y);
        y += 5;
      });
      y += 2;
    });
    y += 8;

    // Benefícios Financeiros
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('BENEFÍCIOS FINANCEIROS', 20, y);
    y += 7;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const beneficios = [
      `ROI: ${generatedReview.beneficios_financeiros?.roi}`,
      `Economia: ${generatedReview.beneficios_financeiros?.economia}`,
      `Aumento Receita: ${generatedReview.beneficios_financeiros?.aumento_receita}`,
      `vs Terceirização: ${generatedReview.beneficios_financeiros?.vs_terceirizacao}`
    ];
    beneficios.forEach(ben => {
      if (y > 280) { doc.addPage(); y = 20; }
      const lines = doc.splitTextToSize(`• ${ben}`, 165);
      lines.forEach(line => {
        doc.text(line, 25, y);
        y += 5;
      });
    });
    y += 8;

    // Casos de Sucesso
    if (generatedReview.casos_sucesso?.length > 0) {
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('CASOS DE SUCESSO', 20, y);
      y += 7;

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      generatedReview.casos_sucesso.forEach((caso, i) => {
        if (y > 280) { doc.addPage(); y = 20; }
        const lines = doc.splitTextToSize(`${i + 1}. ${caso}`, 165);
        lines.forEach(line => {
          doc.text(line, 25, y);
          y += 5;
        });
        y += 2;
      });
      y += 8;
    }

    // Investimento
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('INVESTIMENTO', 20, y);
    y += 7;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const invLines = doc.splitTextToSize(generatedReview.investimento, 170);
    invLines.forEach(line => {
      if (y > 280) { doc.addPage(); y = 20; }
      doc.text(line, 20, y);
      y += 5;
    });

    // Salvar
    const pdfBlob = doc.output('blob');
    const file = new File([pdfBlob], `${equipment.id}_Review.pdf`, { type: 'application/pdf' });
    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    doc.save(`${equipment.id}_Review_${client?.first_name || 'Cliente'}.pdf`);
    
    if (onMaterialGenerated) {
      onMaterialGenerated({ equipment_id: equipment.id, file_url, title: equipment.name });
    }

    return file_url;
  };

  const sendToClient = async (via = 'whatsapp') => {
    if (!generatedReview || !client) return;

    const equipment = EQUIPAMENTOS.find(e => e.id === selectedEquipment);
    const pdfUrl = await generatePDF();

    const message = `${equipment.icon} *${equipment.name}*

${generatedReview.resumo_executivo}

*PRINCIPAIS DIFERENCIAIS:*
${generatedReview.diferenciais?.slice(0, 3).map((d, i) => `${i + 1}. ${d}`).join('\n')}

${generatedReview.call_to_action}

📄 Material completo em PDF: ${pdfUrl}`;

    if (via === 'whatsapp' && client.phone) {
      window.open(`https://wa.me/${client.phone}?text=${encodeURIComponent(message)}`, '_blank');
      toast.success('WhatsApp aberto com material!');
    } else if (via === 'email' && client.email) {
      await base44.integrations.Core.SendEmail({
        to: client.email,
        subject: `Material: ${equipment.name}`,
        body: message.replace(/\*/g, '')
      });
      toast.success('Email enviado!');
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-300">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-600 to-amber-600 flex items-center justify-center">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-800">📋 Material de Equipamentos</h3>
          <p className="text-xs text-orange-700">Reviews + PDFs prontos para enviar</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        {EQUIPAMENTOS.map((eq) => (
          <Button
            key={eq.id}
            onClick={() => generateReview(eq.id)}
            disabled={generating}
            variant="outline"
            className="h-auto py-3 flex-col gap-1 text-left"
          >
            <span className="text-lg">{eq.icon}</span>
            <span className="text-xs font-semibold">{eq.id}</span>
          </Button>
        ))}
      </div>

      {generating && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-orange-600 mr-2" />
          <span className="text-sm text-orange-600">Gerando material completo...</span>
        </div>
      )}

      {generatedReview && (
        <div className="space-y-3">
          <Card className="p-3 bg-white">
            <h4 className="font-bold text-slate-800 mb-2">{generatedReview.titulo}</h4>
            <p className="text-sm text-slate-700 mb-3">{generatedReview.resumo_executivo}</p>
            
            <div className="space-y-2">
              <div className="p-2 bg-orange-50 rounded">
                <p className="text-xs font-semibold text-orange-800 mb-1">✨ Diferenciais:</p>
                {generatedReview.diferenciais?.slice(0, 5).map((dif, i) => (
                  <p key={i} className="text-xs text-slate-700">• {dif}</p>
                ))}
              </div>

              <div className="p-2 bg-green-50 rounded">
                <p className="text-xs font-semibold text-green-800 mb-1">💰 ROI:</p>
                <p className="text-xs text-slate-700">{generatedReview.beneficios_financeiros?.roi}</p>
              </div>

              <div className="p-2 bg-blue-50 rounded">
                <p className="text-xs font-semibold text-blue-800 mb-1">🎯 Call-to-Action:</p>
                <p className="text-xs text-slate-700">{generatedReview.call_to_action}</p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => generatePDF()}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Download className="w-4 h-4 mr-1" />
              Baixar PDF
            </Button>
            {client?.phone && (
              <Button
                onClick={() => sendToClient('whatsapp')}
                className="bg-green-600 hover:bg-green-700"
              >
                <Send className="w-4 h-4 mr-1" />
                WhatsApp
              </Button>
            )}
          </div>

          <Button
            onClick={() => {
              const fullText = `${generatedReview.titulo}\n\n${generatedReview.resumo_executivo}\n\nDIFERENCIAIS:\n${generatedReview.diferenciais?.join('\n')}`;
              navigator.clipboard.writeText(fullText);
              toast.success('Copiado!');
            }}
            variant="outline"
            className="w-full"
          >
            <Copy className="w-4 h-4 mr-1" />
            Copiar Texto
          </Button>
        </div>
      )}
    </Card>
  );
}