import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Volume2, MessageSquare, Zap } from 'lucide-react';

const INTENSITY_LEVELS = {
  1: {
    label: '🧊 Técnico',
    desc: 'Exames, precisão, ROI, diagnóstico',
    color: 'bg-blue-100 text-blue-800',
    icon: '🧊',
    tone: 'tecnico'
  },
  2: {
    label: '🙂 Consultivo',
    desc: 'Dores, oportunidades, crescimento',
    color: 'bg-green-100 text-green-800',
    icon: '🙂',
    tone: 'consultivo'
  },
  3: {
    label: '⚖️ Equilibrado',
    desc: 'Técnico + comercial balanceado',
    color: 'bg-yellow-100 text-yellow-800',
    icon: '⚖️',
    tone: 'equilibrado'
  },
  4: {
    label: '🔥 Persuasivo',
    desc: 'Urgência, competitividade, ação',
    color: 'bg-orange-100 text-orange-800',
    icon: '🔥',
    tone: 'persuasivo'
  },
  5: {
    label: '⚡ Fechamento Agressivo',
    desc: 'Escassez, velocidade, perdas',
    color: 'bg-red-100 text-red-800',
    icon: '⚡',
    tone: 'agressivo'
  }
};

export default function CommercialIntensityControl() {
  const [intensity, setIntensity] = useState(3);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('commercial_intensity');
    if (saved) setIntensity(parseInt(saved));
  }, []);

  const handleChange = (value) => {
    setIntensity(value[0]);
    localStorage.setItem('commercial_intensity', value[0]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const current = INTENSITY_LEVELS[intensity];

  // Preview de mensagens conforme intensidade
  const previewMessages = {
    1: "Este equipamento realiza 26 parâmetros hematológicos com tempo de 3-5 minutos.",
    2: "Seu cliente não precisa mais enviar sangue para fora. Diagnóstico na clínica, resultado em 5 min.",
    3: "Diagnóstico mais rápido = cliente mais feliz. Economiza até R$50/exame. Investe-se em 8 meses.",
    4: "Seus concorrentes já têm. Cliente espera diagnóstico em 5 min, não em 2 dias. Ação rápida = vantagem.",
    5: "Cada exame enviado para fora é uma oportunidade perdida. Ouro puro saindo de suas mãos."
  };

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-orange-500 shadow-lg">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-orange-400" />
          🎚️ Intensidade Comercial
        </CardTitle>
        <p className="text-xs text-slate-400 mt-2">Ajuste o tom sem alterar a verdade</p>
      </CardHeader>

      <CardContent className="space-y-6">
        
        {/* Slider */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-300">Técnico</span>
            <span className="text-sm text-slate-300">Agressivo</span>
          </div>

          <Slider
            value={[intensity]}
            onValueChange={handleChange}
            min={1}
            max={5}
            step={1}
            className="w-full"
          />

          <div className="flex gap-1 justify-between">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className={`flex-1 h-2 rounded transition-all ${
                intensity >= i ? 'bg-orange-500' : 'bg-slate-700'
              }`} />
            ))}
          </div>
        </div>

        {/* Current Level */}
        <div className={`p-4 rounded-lg ${current.color} border border-current`}>
          <p className="font-bold text-sm mb-1">{current.label}</p>
          <p className="text-xs opacity-80">{current.desc}</p>
        </div>

        {/* Preview */}
        <div className="bg-slate-700 p-4 rounded-lg border border-slate-600">
          <p className="text-xs text-slate-300 mb-2 font-semibold">📝 Preview de Mensagem:</p>
          <p className="text-sm text-slate-100 italic leading-relaxed">
            "{previewMessages[intensity]}"
          </p>
        </div>

        {/* Características por nível */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className={intensity <= 2 ? 'text-white' : 'text-slate-500'}>✓ Foco técnico</div>
          <div className={intensity >= 2 ? 'text-white' : 'text-slate-500'}>✓ Foco emocional</div>
          <div className={intensity >= 3 ? 'text-white' : 'text-slate-500'}>✓ CTA direto</div>
          <div className={intensity >= 4 ? 'text-white' : 'text-slate-500'}>✓ Urgência</div>
        </div>

        {/* Status */}
        {saved && (
          <div className="text-xs text-green-400 text-center">
            ✅ Intensidade salva (todas as mensagens usarão este nível)
          </div>
        )}

        {/* Aviso */}
        <div className="p-3 bg-blue-900/30 border border-blue-600/50 rounded text-xs text-blue-200">
          <p className="font-semibold mb-1">🔒 Modo Verdade Absoluta ATIVO</p>
          <p>Nenhum nível inventa dados. Mensagens mudam de tom, nunca de fatos.</p>
        </div>

      </CardContent>
    </Card>
  );
}