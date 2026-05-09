import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMutation } from '@tanstack/react-query';
import { Sparkles, Copy, Download, Share2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import InstagramContentGenerator from '@/components/InstagramContentGenerator';
import SeamatyMarketingCampaigns from '@/components/SeamatyMarketingCampaigns';
import VetMarketingTemplates from '@/components/VetMarketingTemplates';
import MarketingCalendar from '@/components/MarketingCalendar';

export default function MarketingAIStudio() {
  const [generatedContent, setGeneratedContent] = useState(null);
  const [selectedMode, setSelectedMode] = useState('instagram');
  const [intensity, setIntensity] = useState(3);

  const generateContentMutation = useMutation({
    mutationFn: async (params) => {
      toast.info('🧠 Gerando conteúdo com IA...');
      const result = await base44.functions.invoke('generateMarketingContent', {
        ...params,
        intensity
      });
      return result.data;
    },
    onSuccess: (data) => {
      setGeneratedContent(data);
      toast.success('✅ Conteúdo pronto para copiar!');
    },
    onError: (err) => toast.error('Erro: ' + err.message),
  });

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('✅ Copiado!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 pb-20">
      <div className="max-w-7xl mx-auto p-4 md:p-6">

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-purple-900 mb-2 flex items-center gap-3">
            <Sparkles className="w-10 h-10 text-pink-500" />
            ✨ Marketing AI Studio — Seamaty
          </h1>
          <p className="text-slate-600 max-w-2xl">
            Especialista em conteúdo veterinário. Gera posts, campanhas, anúncios com neuromarketing e gatilhos mentais. Nunca inventa dados. Sempre copiar e postar.
          </p>
        </div>

        {/* MODO INTENSIDADE */}
        <Card className="mb-6 bg-white border-purple-200 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-purple-900">🎚️ Tom de Comunicação</p>
                <p className="text-xs text-slate-600">Ajusta agressividade sem inventar dados</p>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <button
                    key={i}
                    onClick={() => setIntensity(i)}
                    className={`w-12 h-12 rounded-lg font-bold transition-all ${
                      intensity === i
                        ? 'bg-purple-600 text-white shadow-lg'
                        : 'bg-slate-100 text-slate-600 hover:bg-purple-100'
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3 text-sm text-slate-600">
              {intensity === 1 && '🧊 Técnico: Fatos, dados, precisão'}
              {intensity === 2 && '🙂 Consultivo: Dor do cliente, oportunidade'}
              {intensity === 3 && '⚖️ Equilibrado: Técnico + comercial'}
              {intensity === 4 && '🔥 Persuasivo: Urgência, ação'}
              {intensity === 5 && '⚡ Agressivo: AGORA, ouro, perdendo'}
            </div>
          </CardContent>
        </Card>

        {/* TABS MÓDULOS */}
        <Tabs defaultValue="instagram" className="w-full">
          <TabsList className="grid grid-cols-3 md:grid-cols-5 w-full mb-6">
            <TabsTrigger value="instagram">📸 Instagram</TabsTrigger>
            <TabsTrigger value="seamaty">🏥 Seamaty</TabsTrigger>
            <TabsTrigger value="veterinario">🐾 Veterinário</TabsTrigger>
            <TabsTrigger value="calendario">📅 Calendário</TabsTrigger>
            <TabsTrigger value="sugestoes">💡 Sugestões</TabsTrigger>
          </TabsList>

          {/* Instagram */}
          <TabsContent value="instagram">
            <InstagramContentGenerator
              intensity={intensity}
              onGenerate={(params) => generateContentMutation.mutate(params)}
              loading={generateContentMutation.isPending}
            />
          </TabsContent>

          {/* Seamaty */}
          <TabsContent value="seamaty">
            <SeamatyMarketingCampaigns
              intensity={intensity}
              onGenerate={(params) => generateContentMutation.mutate(params)}
              loading={generateContentMutation.isPending}
            />
          </TabsContent>

          {/* Veterinário */}
          <TabsContent value="veterinario">
            <VetMarketingTemplates
              intensity={intensity}
              onGenerate={(params) => generateContentMutation.mutate(params)}
              loading={generateContentMutation.isPending}
            />
          </TabsContent>

          {/* Calendário */}
          <TabsContent value="calendario">
            <MarketingCalendar
              intensity={intensity}
              onGenerate={(params) => generateContentMutation.mutate(params)}
              loading={generateContentMutation.isPending}
            />
          </TabsContent>

          {/* Sugestões */}
          <TabsContent value="sugestoes">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  💡 Campanha Sugerida da Semana
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg border border-purple-200">
                  <p className="font-bold text-purple-900">🔥 "Diagnóstico em 5 Minutos"</p>
                  <p className="text-sm text-slate-700 mt-2">
                    Campanha para aumentar recorrência. Foque em velocidade do diagnóstico.
                  </p>
                  <Button
                    onClick={() => generateContentMutation.mutate({
                      type: 'campaign',
                      subtype: 'diagnostico_rapido',
                      platform: 'instagram'
                    })}
                    disabled={generateContentMutation.isPending}
                    className="mt-3 gap-2"
                  >
                    {generateContentMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    Gerar Conteúdo
                  </Button>
                </div>

                <div className="p-4 bg-gradient-to-r from-orange-100 to-red-100 rounded-lg border border-orange-200">
                  <p className="font-bold text-orange-900">⚠️ "Emergência VG2"</p>
                  <p className="text-sm text-slate-700 mt-2">
                    Anúncio com urgência. Paciente crítico, diagnóstico imediato.
                  </p>
                  <Button
                    onClick={() => generateContentMutation.mutate({
                      type: 'campaign',
                      subtype: 'emergencia',
                      platform: 'instagram'
                    })}
                    disabled={generateContentMutation.isPending}
                    className="mt-3 gap-2"
                  >
                    {generateContentMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    Gerar Conteúdo
                  </Button>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <p className="text-sm text-blue-900">
                    <strong>Modo Verdade Absoluta:</strong> Nunca prometemos resultado falso. Se não conhecer a clínica, oferecemos demo, não afirmação.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* CONTEÚDO GERADO */}
        {generatedContent && (
          <Card className="mt-8 bg-white border-purple-200 shadow-xl">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  ✨ Pronto para Copiar
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setGeneratedContent(null)}
                >
                  Novo
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              
              {/* Conteúdo Principal */}
              {generatedContent.content && (
                <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                  <div className="flex justify-between items-start mb-4">
                    <p className="font-bold text-slate-900">{generatedContent.title || 'Conteúdo'}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(generatedContent.content)}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copiar
                    </Button>
                  </div>
                  <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {generatedContent.content}
                  </p>
                </div>
              )}

              {/* Hashtags */}
              {generatedContent.hashtags && (
                <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                  <div className="flex justify-between items-center mb-4">
                    <p className="font-bold text-purple-900">🏷️ Hashtags</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(generatedContent.hashtags)}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copiar
                    </Button>
                  </div>
                  <p className="text-purple-900 break-words">
                    {generatedContent.hashtags}
                  </p>
                </div>
              )}

              {/* CTA */}
              {generatedContent.cta && (
                <div className="bg-pink-50 rounded-lg p-6 border border-pink-200">
                  <div className="flex justify-between items-center mb-4">
                    <p className="font-bold text-pink-900">🎯 Call-to-Action</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(generatedContent.cta)}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copiar
                    </Button>
                  </div>
                  <p className="text-pink-900 italic">"{generatedContent.cta}"</p>
                </div>
              )}

              {/* Design Prompt */}
              {generatedContent.design_prompt && (
                <div className="bg-amber-50 rounded-lg p-6 border border-amber-200">
                  <div className="flex justify-between items-center mb-4">
                    <p className="font-bold text-amber-900">🎨 Prompt para Design (Canva/IA)</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(generatedContent.design_prompt)}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copiar
                    </Button>
                  </div>
                  <p className="text-amber-900 text-sm">
                    {generatedContent.design_prompt}
                  </p>
                </div>
              )}

              {/* Alertas */}
              {generatedContent.alerts && (
                <div className="space-y-2">
                  {generatedContent.alerts.map((alert, i) => (
                    <div key={i} className="flex gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                      <p className="text-sm text-yellow-900">{alert}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Botões Download */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="gap-2 flex-1"
                  onClick={() => {
                    const text = [
                      generatedContent.title,
                      generatedContent.content,
                      generatedContent.hashtags,
                      generatedContent.cta
                    ].filter(Boolean).join('\n\n');
                    const el = document.createElement('a');
                    el.href = `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`;
                    el.download = 'conteudo.txt';
                    el.click();
                  }}
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 flex-1"
                  onClick={() => {
                    const text = `${generatedContent.content}\n\n${generatedContent.hashtags}`;
                    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
                    window.open(url, '_blank');
                  }}
                >
                  <Share2 className="w-4 h-4" />
                  Compartilhar
                </Button>
              </div>

            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}