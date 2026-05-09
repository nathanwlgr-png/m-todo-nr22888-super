import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Loader2 } from 'lucide-react';

const CONTENT_TYPES = {
  post: { label: '📱 Post', desc: 'Conteúdo feed (carousel ou simples)' },
  story: { label: '📸 Story', desc: '24h auto-delete' },
  reel: { label: '🎬 Reel', desc: 'Vídeo curto (15-30s)' },
  anuncio: { label: '📢 Anúncio', desc: 'Ad traffic (cliques)' },
  carrossel: { label: '🔄 Carrossel', desc: '3-5 cards edu/antes-depois' },
};

const THEMES = {
  diagnostico_rapido: { label: '⚡ Diagnóstico Rápido', desc: 'Velocidade, resultado em 5min' },
  check_up: { label: '💚 Check-up', desc: 'Prevenção, saúde preventiva' },
  emergencia: { label: '⚠️ Emergência', desc: 'Urgência, paciente crítico' },
  recorrencia: { label: '🔄 Recorrência', desc: 'Cliente + fiel, retorno' },
  autoridade: { label: '🏆 Autoridade', desc: 'Credibilidade, especialista' },
  usuario: { label: '🙋 Caso Real', desc: 'Depoimento cliente (sem inventar)' },
};

export default function InstagramContentGenerator({ intensity = 3, onGenerate, loading = false }) {
  const [contentType, setContentType] = useState('post');
  const [theme, setTheme] = useState('diagnostico_rapido');

  const handleGenerate = () => {
    if (!contentType || !theme) return;
    onGenerate({
      type: 'instagram',
      contentType,
      theme,
      platform: 'instagram'
    });
  };

  return (
    <Card className="bg-white border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📸 Gerador Instagram — Veterinário
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        
        {/* Tipo de Conteúdo */}
        <div>
          <label className="font-bold text-slate-900 block mb-3">Tipo de Conteúdo</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(CONTENT_TYPES).map(([key, val]) => (
              <button
                key={key}
                onClick={() => setContentType(key)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  contentType === key
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-slate-200 hover:border-purple-300'
                }`}
              >
                <p className="font-semibold text-sm text-slate-900">{val.label}</p>
                <p className="text-xs text-slate-600 mt-1">{val.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Tema */}
        <div>
          <label className="font-bold text-slate-900 block mb-3">Tema</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(THEMES).map(([key, val]) => (
              <button
                key={key}
                onClick={() => setTheme(key)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  theme === key
                    ? 'border-pink-500 bg-pink-50'
                    : 'border-slate-200 hover:border-pink-300'
                }`}
              >
                <p className="font-semibold text-sm text-slate-900">{val.label}</p>
                <p className="text-xs text-slate-600 mt-1">{val.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600 mb-2">Preview da configuração:</p>
          <p className="font-mono text-sm text-slate-900">
            {contentType && theme ? (
              <>
                📱 {CONTENT_TYPES[contentType].label} • {THEMES[theme].label} • Intensidade: {intensity}/5
              </>
            ) : (
              'Selecione tipo e tema'
            )}
          </p>
        </div>

        {/* Botão Gerar */}
        <Button
          onClick={handleGenerate}
          disabled={!contentType || !theme || loading}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 gap-2"
          size="lg"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Sparkles className="w-5 h-5" />
          )}
          {loading ? 'Gerando...' : 'Gerar Conteúdo'}
        </Button>

      </CardContent>
    </Card>
  );
}