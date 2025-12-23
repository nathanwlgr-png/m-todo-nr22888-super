import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Download, Share2, Sparkles, Video, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Material de Vendas 3DX Premium
 * Propaganda completa com imagens, vídeos e copy personalizado por numerologia
 */
export default function ThreeDXSalesMaterial() {
  const [generating, setGenerating] = useState(false);
  const [material, setMaterial] = useState(null);

  const generateMaterial = async () => {
    setGenerating(true);
    try {
      const salesMaterial = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um especialista em marketing veterinário e vendas consultivas. Crie uma PROPAGANDA COMPLETA E PROFISSIONAL do equipamento 3DX (raio-x digital veterinário de última geração).

🎯 PÚBLICO-ALVO: Veterinários e clínicas de medicina equina
🔢 NUMEROLOGIA DO VENDEDOR: 22 (Mestre Construtor) - Visão estratégica, construção de impérios, grandiosidade, realização de grandes projetos

📋 CRIE O MATERIAL COMPLETO:

1. **HEADLINE PRINCIPAL** (impactante, direto ao ponto)
2. **SUBHEADLINE** (benefício emocional)
3. **COPY LONGO DE VENDAS** (5-7 parágrafos persuasivos com gatilhos mentais)
4. **BULLETS DE BENEFÍCIOS** (7-10 bullets poderosos)
5. **DIFERENCIAL COMPETITIVO** (por que 3DX vs concorrentes)
6. **PROVA SOCIAL** (casos de sucesso, depoimentos fictícios realistas)
7. **CALL TO ACTION** (3 CTAs diferentes para diferentes momentos da jornada)
8. **MENSAGEM WHATSAPP PRONTA** (copy otimizado para conversão)
9. **EMAIL MARKETING** (subject + body completo)
10. **SCRIPT DE VÍDEO** (roteiro de 60-90 segundos)
11. **LEGENDAS PARA POSTS** (LinkedIn, Instagram, Facebook)
12. **OBJEÇÕES E RESPOSTAS** (top 5 objeções com respostas)

📸 SUGESTÕES DE IMAGENS:
- Imagem principal do 3DX em ação
- Veterinário usando o equipamento
- Resultados de exames antes/depois
- Clínica moderna com o equipamento
- Depoimento em vídeo de cliente satisfeito

🎬 ROTEIRO DE VÍDEO DETALHADO:
- Cena por cena (15 cenas de 4-6 segundos cada)
- Texto em tela para cada cena
- Música sugerida
- Transições
- CTA final

💡 PERSONALIZE PARA NUMEROLOGIA 22:
- Foque em visão de longo prazo
- Construção de legado
- Transformação da clínica em referência
- Grandes realizações
- Impacto duradouro no mercado

🔥 USE GATILHOS:
- Escassez (últimas unidades)
- Autoridade (aprovação FDA/MAPA)
- Prova social (500+ clínicas)
- Urgência (promoção limitada)
- Reciprocidade (bônus exclusivos)`,
        response_json_schema: {
          type: "object",
          properties: {
            headline: { type: "string" },
            subheadline: { type: "string" },
            long_copy: { type: "string" },
            benefits_bullets: { type: "array", items: { type: "string" } },
            competitive_advantage: { type: "string" },
            social_proof: { type: "array", items: { 
              type: "object",
              properties: {
                client_name: { type: "string" },
                clinic: { type: "string" },
                testimonial: { type: "string" },
                result: { type: "string" }
              }
            }},
            cta_primary: { type: "string" },
            cta_secondary: { type: "string" },
            cta_soft: { type: "string" },
            whatsapp_message: { type: "string" },
            email_subject: { type: "string" },
            email_body: { type: "string" },
            video_script: {
              type: "object",
              properties: {
                duration: { type: "string" },
                scenes: { type: "array", items: {
                  type: "object",
                  properties: {
                    scene_number: { type: "number" },
                    duration_seconds: { type: "number" },
                    description: { type: "string" },
                    on_screen_text: { type: "string" },
                    voice_over: { type: "string" }
                  }
                }},
                music_suggestion: { type: "string" },
                final_cta: { type: "string" }
              }
            },
            social_media_captions: {
              type: "object",
              properties: {
                linkedin: { type: "string" },
                instagram: { type: "string" },
                facebook: { type: "string" }
              }
            },
            objections_handling: { type: "array", items: {
              type: "object",
              properties: {
                objection: { type: "string" },
                response: { type: "string" },
                proof_point: { type: "string" }
              }
            }},
            image_suggestions: { type: "array", items: { type: "string" } },
            numerology_22_insights: { type: "string" }
          }
        }
      });

      setMaterial(salesMaterial);
      toast.success('🎯 Material de vendas 3DX gerado!');
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao gerar material');
    } finally {
      setGenerating(false);
    }
  };

  const downloadPDF = async () => {
    if (!material) return;
    
    // Criar PDF com jsPDF (simplificado)
    const content = `
3DX - MATERIAL DE VENDAS COMPLETO
===================================

${material.headline}
${material.subheadline}

COPY DE VENDAS:
${material.long_copy}

BENEFÍCIOS:
${material.benefits_bullets.map((b, i) => `${i+1}. ${b}`).join('\n')}

DIFERENCIAL COMPETITIVO:
${material.competitive_advantage}

PROVA SOCIAL:
${material.social_proof.map(p => `"${p.testimonial}" - ${p.client_name}, ${p.clinic}`).join('\n\n')}

MENSAGEM WHATSAPP:
${material.whatsapp_message}

EMAIL:
Assunto: ${material.email_subject}
${material.email_body}

ROTEIRO DE VÍDEO (${material.video_script.duration}):
${material.video_script.scenes.map(s => `
Cena ${s.scene_number} (${s.duration_seconds}s):
${s.description}
Texto: ${s.on_screen_text}
Narração: ${s.voice_over}
`).join('\n')}

REDES SOCIAIS:
LinkedIn: ${material.social_media_captions.linkedin}
Instagram: ${material.social_media_captions.instagram}
Facebook: ${material.social_media_captions.facebook}

INSIGHTS NUMEROLOGIA 22:
${material.numerology_22_insights}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '3DX-Material-Vendas-Completo.txt';
    a.click();
    
    toast.success('📄 Material baixado!');
  };

  const copyWhatsApp = async () => {
    if (!material) return;
    await navigator.clipboard.writeText(material.whatsapp_message);
    toast.success('📱 Mensagem WhatsApp copiada!');
  };

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">3DX - Material de Vendas Premium</h2>
            <p className="text-sm text-slate-600">Propaganda completa + imagens + vídeo + copy personalizado (Numerologia 22)</p>
          </div>
        </div>

        <Button
          onClick={generateMaterial}
          disabled={generating}
          className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 h-14 text-base"
        >
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Gerando material completo com IA...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Gerar Propaganda 3DX Completa
            </>
          )}
        </Button>
      </Card>

      {material && (
        <div className="space-y-4">
          {/* Headline */}
          <Card className="p-5 bg-white border-orange-200">
            <h3 className="text-2xl font-bold text-orange-600 mb-2">{material.headline}</h3>
            <p className="text-lg text-slate-700">{material.subheadline}</p>
          </Card>

          {/* Copy Principal */}
          <Card className="p-5 bg-white">
            <h4 className="font-semibold text-slate-800 mb-3">📝 Copy de Vendas</h4>
            <p className="text-slate-700 whitespace-pre-line leading-relaxed">{material.long_copy}</p>
          </Card>

          {/* Benefícios */}
          <Card className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <h4 className="font-semibold text-green-800 mb-3">✅ Benefícios Principais</h4>
            <ul className="space-y-2">
              {material.benefits_bullets.map((benefit, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-700">
                  <span className="text-green-600 font-bold">•</span>
                  {benefit}
                </li>
              ))}
            </ul>
          </Card>

          {/* Prova Social */}
          <Card className="p-5 bg-blue-50 border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-3">⭐ Casos de Sucesso</h4>
            <div className="space-y-3">
              {material.social_proof.map((proof, i) => (
                <div key={i} className="p-3 bg-white rounded-lg border border-blue-200">
                  <p className="text-sm italic text-slate-700 mb-2">"{proof.testimonial}"</p>
                  <p className="text-xs font-semibold text-blue-700">{proof.client_name} - {proof.clinic}</p>
                  <p className="text-xs text-green-600 mt-1">✓ {proof.result}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Roteiro de Vídeo */}
          <Card className="p-5 bg-purple-50 border-purple-200">
            <div className="flex items-center gap-2 mb-3">
              <Video className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-purple-800">🎬 Roteiro de Vídeo ({material.video_script.duration})</h4>
            </div>
            <div className="space-y-3">
              {material.video_script.scenes.map((scene) => (
                <div key={scene.scene_number} className="p-3 bg-white rounded-lg border border-purple-200">
                  <p className="text-xs font-bold text-purple-700 mb-1">
                    Cena {scene.scene_number} • {scene.duration_seconds}s
                  </p>
                  <p className="text-sm text-slate-700 mb-1">{scene.description}</p>
                  <p className="text-xs text-blue-600 mb-1">📺 Texto: {scene.on_screen_text}</p>
                  <p className="text-xs text-slate-600">🎤 Narração: {scene.voice_over}</p>
                </div>
              ))}
              <p className="text-xs text-purple-600 mt-2">
                🎵 Música: {material.video_script.music_suggestion}
              </p>
            </div>
          </Card>

          {/* Sugestões de Imagens */}
          <Card className="p-5 bg-amber-50 border-amber-200">
            <div className="flex items-center gap-2 mb-3">
              <ImageIcon className="w-5 h-5 text-amber-600" />
              <h4 className="font-semibold text-amber-800">📸 Sugestões de Imagens</h4>
            </div>
            <ul className="space-y-2">
              {material.image_suggestions.map((suggestion, i) => (
                <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                  <span className="text-amber-600">📷</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </Card>

          {/* Redes Sociais */}
          <Card className="p-5 bg-pink-50 border-pink-200">
            <h4 className="font-semibold text-pink-800 mb-3">📱 Legendas para Redes Sociais</h4>
            <div className="space-y-3">
              <div className="p-3 bg-white rounded-lg">
                <p className="text-xs font-bold text-blue-600 mb-1">LinkedIn:</p>
                <p className="text-sm text-slate-700">{material.social_media_captions.linkedin}</p>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <p className="text-xs font-bold text-pink-600 mb-1">Instagram:</p>
                <p className="text-sm text-slate-700">{material.social_media_captions.instagram}</p>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <p className="text-xs font-bold text-blue-500 mb-1">Facebook:</p>
                <p className="text-sm text-slate-700">{material.social_media_captions.facebook}</p>
              </div>
            </div>
          </Card>

          {/* Objeções */}
          <Card className="p-5 bg-red-50 border-red-200">
            <h4 className="font-semibold text-red-800 mb-3">❌ Tratamento de Objeções</h4>
            <div className="space-y-3">
              {material.objections_handling.map((obj, i) => (
                <div key={i} className="p-3 bg-white rounded-lg border border-red-200">
                  <p className="text-sm font-semibold text-red-700 mb-1">❌ {obj.objection}</p>
                  <p className="text-sm text-slate-700 mb-1">✅ {obj.response}</p>
                  <p className="text-xs text-green-600">📊 {obj.proof_point}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Insights Numerologia 22 */}
          <Card className="p-5 bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300">
            <h4 className="font-semibold text-yellow-800 mb-3">🔢 Insights Numerologia 22 (Mestre Construtor)</h4>
            <p className="text-slate-700 leading-relaxed">{material.numerology_22_insights}</p>
          </Card>

          {/* CTAs */}
          <Card className="p-5 bg-gradient-to-br from-green-600 to-emerald-600 text-white">
            <h4 className="font-semibold mb-3">🎯 Chamadas para Ação</h4>
            <div className="space-y-2">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur">
                <p className="text-xs font-bold mb-1">CTA Principal (Quente):</p>
                <p className="text-sm">{material.cta_primary}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur">
                <p className="text-xs font-bold mb-1">CTA Secundário (Morno):</p>
                <p className="text-sm">{material.cta_secondary}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur">
                <p className="text-xs font-bold mb-1">CTA Soft (Frio):</p>
                <p className="text-sm">{material.cta_soft}</p>
              </div>
            </div>
          </Card>

          {/* Ações */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={downloadPDF}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar Tudo
            </Button>
            <Button
              onClick={copyWhatsApp}
              className="bg-green-600 hover:bg-green-700"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Copiar WhatsApp
            </Button>
          </div>
        </div>
      )}

      {/* Guia de Hemogasometria */}
      <Card className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 mt-4">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">📚 Quer estudar Hemogasometria Equina?</h3>
        <p className="text-sm text-slate-700 mb-3">
          Guia completo com 7 artigos científicos traduzidos, valores de referência e situações clínicas práticas.
        </p>
        <Button
          onClick={() => window.location.href = '/HemogasEquineGuide'}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          📖 Abrir Guia de Estudo
        </Button>
      </Card>
    </div>
  );
}