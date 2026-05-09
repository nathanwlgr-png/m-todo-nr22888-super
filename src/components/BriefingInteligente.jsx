import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Copy, MessageSquare, Download } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

/**
 * Briefing Inteligente — Ao abrir cliente
 * Resumo + dores + SPIN + objeções + ROI + produto ideal
 */

export default function BriefingInteligente({ client, onClose }) {
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);

  const generateBriefing = async () => {
    setLoading(true);
    try {
      toast.info('🧠 Gerando briefing inteligente...');

      const result = await base44.functions.invoke('generatePersonalizedProposal', {
        client_id: client.id,
        client_data: client,
        mode: 'briefing_inteligente',
      });

      setBriefing(result.data);
      toast.success('✅ Briefing pronto!');
    } catch (error) {
      toast.error(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, section) => {
    navigator.clipboard.writeText(text);
    setCopied(section);
    setTimeout(() => setCopied(null), 2000);
    toast.success('✅ Copiado!');
  };

  if (!briefing) {
    return (
      <div className="space-y-4 p-6 bg-slate-900 rounded-lg">
        <h3 className="text-lg font-bold text-white">📋 Briefing Inteligente</h3>
        <Button
          onClick={generateBriefing}
          disabled={loading}
          className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>🎯 Gerar Briefing</span>
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 bg-slate-900 rounded-lg overflow-y-auto max-h-[80vh]">
      
      {/* RESUMO EXECUTIVO */}
      <Card className="bg-slate-800 border-slate-700 m-6 mt-6">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            📝 Resumo Executivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-200 text-sm leading-relaxed">{briefing.summary}</p>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => copyToClipboard(briefing.summary, 'summary')}
            className="text-slate-400 mt-2"
          >
            <Copy className="w-3 h-3 mr-1" />
            {copied === 'summary' ? 'Copiado!' : 'Copiar'}
          </Button>
        </CardContent>
      </Card>

      {/* DORES PROVÁVEIS */}
      <Card className="bg-red-950 border-red-800 m-6">
        <CardHeader>
          <CardTitle className="text-red-200 text-base">😣 Dores Prováveis</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {briefing.pains?.map((pain, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-red-100">
                <span className="text-red-400 mt-1">•</span>
                <span>{pain}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* PERGUNTAS SPIN */}
      <Card className="bg-purple-950 border-purple-800 m-6">
        <CardHeader>
          <CardTitle className="text-purple-200 text-base">❓ Perguntas SPIN</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {briefing.spin_questions?.map((q, idx) => (
            <div key={idx} className="space-y-1">
              <p className="text-purple-300 text-sm font-bold">{q.type}:</p>
              <p className="text-purple-100 text-sm italic">"{q.question}"</p>
              <p className="text-purple-200 text-xs">💡 {q.goal}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* OBJEÇÕES PROVÁVEIS */}
      <Card className="bg-orange-950 border-orange-800 m-6">
        <CardHeader>
          <CardTitle className="text-orange-200 text-base">⚡ Objeções Prováveis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {briefing.probable_objections?.map((obj, idx) => (
            <div key={idx} className="space-y-1 pb-2 border-b border-orange-800 last:border-0">
              <p className="text-orange-300 text-sm font-bold">Objeção: {obj.objection}</p>
              <p className="text-orange-100 text-sm">✅ Resposta: {obj.response}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ROI RÁPIDO */}
      <Card className="bg-green-950 border-green-800 m-6">
        <CardHeader>
          <CardTitle className="text-green-200 text-base">💰 ROI + Financeiro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-green-100">
          <p><strong>Investimento:</strong> {briefing.roi?.investment}</p>
          <p><strong>Payback:</strong> {briefing.roi?.payback}</p>
          <p><strong>Economia Mensal:</strong> {briefing.roi?.monthly_savings}</p>
          <p className="text-green-300 font-bold mt-3">Argumento: {briefing.roi?.main_argument}</p>
        </CardContent>
      </Card>

      {/* PRODUTO IDEAL */}
      <Card className="bg-blue-950 border-blue-800 m-6">
        <CardHeader>
          <CardTitle className="text-blue-200 text-base">🎯 Produto Ideal + Insumos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="text-blue-300 font-bold">{briefing.ideal_product?.name}</p>
            <p className="text-blue-100 mt-1">{briefing.ideal_product?.description}</p>
          </div>
          {briefing.ideal_product?.consumables && (
            <div className="pt-3 border-t border-blue-800">
              <p className="text-blue-200 font-bold mb-2">Insumos Associados:</p>
              <ul className="space-y-1">
                {briefing.ideal_product.consumables.map((c, idx) => (
                  <li key={idx} className="text-blue-100 text-xs">• {c}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MENSAGEM PRONTA */}
      <Card className="bg-slate-800 border-slate-700 m-6">
        <CardHeader>
          <CardTitle className="text-white text-base">💬 Mensagem Pronta</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-200 text-sm bg-slate-700 p-3 rounded-lg leading-relaxed">
            {briefing.ready_message}
          </p>
          <Button
            size="sm"
            onClick={() => copyToClipboard(briefing.ready_message, 'message')}
            className="mt-3 gap-2 bg-green-600 hover:bg-green-700"
          >
            <MessageSquare className="w-4 h-4" />
            {copied === 'message' ? 'Copiado!' : 'Copiar para WhatsApp'}
          </Button>
        </CardContent>
      </Card>

      {/* PRÓXIMO PASSO */}
      <Card className="bg-indigo-950 border-indigo-800 m-6">
        <CardHeader>
          <CardTitle className="text-indigo-200 text-base">🚀 Próximo Passo</CardTitle>
        </CardHeader>
        <CardContent className="text-indigo-100 text-sm font-bold">
          {briefing.next_step}
        </CardContent>
      </Card>

      {/* BOTÕES AÇÃO */}
      <div className="p-6 bg-slate-800 border-t border-slate-700 flex gap-2 sticky bottom-0">
        <Button
          onClick={onClose}
          variant="outline"
          className="flex-1"
        >
          Fechar
        </Button>
        <Button
          className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Download className="w-4 h-4" />
          Baixar PDF
        </Button>
      </div>

    </div>
  );
}