import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, TrendingUp, Mail, MessageSquare, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

export default function PredictiveCampaignSuggestions() {
  const [campaigns, setCampaigns] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState({});

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('predictiveCampaignSuggestions', {});
      setCampaigns(response.data.campaigns || []);
      setAnalysis(response.data.analysis);
      toast.success('3 campanhas sugeridas com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar sugestões');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copiado!`);
  };

  if (!campaigns.length && !loading) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 shadow-lg">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Campanhas Preditivas</h3>
          <p className="text-slate-600 mb-6">Gere 3 sugestões de campanhas com base em seu histórico de CRM e pipeline de vendas</p>
          <Button
            onClick={generateSuggestions}
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Gerar Campanhas
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Análise Rápida */}
      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <Card className="bg-white shadow-md border-0">
            <CardContent className="p-4">
              <p className="text-xs text-slate-600 mb-1">Clientes Quentes</p>
              <p className="text-2xl font-bold text-orange-600">{analysis.clientsByStatus.hot}</p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-md border-0">
            <CardContent className="p-4">
              <p className="text-xs text-slate-600 mb-1">Leads Qualificados</p>
              <p className="text-2xl font-bold text-blue-600">{analysis.leadsByStage.qualified}</p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-md border-0">
            <CardContent className="p-4">
              <p className="text-xs text-slate-600 mb-1">Taxa de Conversão</p>
              <p className="text-2xl font-bold text-green-600">{analysis.conversionRate}%</p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-md border-0">
            <CardContent className="p-4">
              <p className="text-xs text-slate-600 mb-1">Sentimento Positivo</p>
              <p className="text-2xl font-bold text-purple-600">{analysis.sentiment}%</p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-md border-0">
            <CardContent className="p-4">
              <p className="text-xs text-slate-600 mb-1">Ticket Médio</p>
              <p className="text-2xl font-bold text-slate-900">R$ {analysis.avgSaleValue.toFixed(0)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Campanhas */}
      <div className="space-y-4">
        {campaigns.map((campaign, idx) => (
          <Card key={idx} className="bg-white shadow-lg border-0 overflow-hidden">
            <div
              className="p-6 cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => toggleExpanded(idx)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-slate-900">{campaign.name}</h3>
                    <Badge className="bg-blue-100 text-blue-800 text-xs">{campaign.type}</Badge>
                    <Badge className="bg-green-100 text-green-800 text-xs">{campaign.success_probability}% sucesso</Badge>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">{campaign.description}</p>
                  
                  <div className="grid grid-cols-4 gap-3 text-xs mb-3">
                    <div>
                      <p className="text-slate-600 font-semibold">Público</p>
                      <p className="text-slate-900">{campaign.target_segment}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 font-semibold">ROI Esperado</p>
                      <p className="text-green-600 font-bold">{campaign.expected_roi}%</p>
                    </div>
                    <div>
                      <p className="text-slate-600 font-semibold">Duração</p>
                      <p className="text-slate-900">{campaign.duration_days} dias</p>
                    </div>
                    <div>
                      <p className="text-slate-600 font-semibold">Canal</p>
                      <p className="text-slate-900">{campaign.channel_primary}</p>
                    </div>
                  </div>

                  {/* Preview Ad Copy */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs mb-3">
                    <p className="font-semibold text-slate-700 mb-1">📢 Anúncio</p>
                    <p className="text-slate-900">{campaign.ad_copy}</p>
                  </div>
                </div>

                <button className="text-slate-400 hover:text-slate-600 ml-4">
                  {expanded[idx] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Expandido */}
            {expanded[idx] && (
              <div className="border-t bg-slate-50 p-6 space-y-6">
                {/* Email Preview */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                      <Mail className="w-4 h-4" /> Email
                    </h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyCopy(`Assunto: ${campaign.email_subject}\n\n${campaign.email_body}`, 'Email')}
                      className="text-xs"
                    >
                      <Copy className="w-3 h-3 mr-1" /> Copiar
                    </Button>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <p className="font-semibold text-slate-900 text-sm mb-2">Assunto: {campaign.email_subject}</p>
                    <p className="text-xs text-slate-700 whitespace-pre-line">{campaign.email_body}</p>
                  </div>
                </div>

                {/* WhatsApp Preview */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" /> WhatsApp / SMS
                    </h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyCopy(campaign.ad_copy, 'Mensagem')}
                      className="text-xs"
                    >
                      <Copy className="w-3 h-3 mr-1" /> Copiar
                    </Button>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-xs text-slate-800">{campaign.ad_copy}</p>
                  </div>
                </div>

                {/* Success Factors */}
                <div>
                  <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Fatores de Sucesso
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {campaign.success_factors?.map((factor, i) => (
                      <Badge key={i} className="bg-green-100 text-green-800 text-xs">
                        ✓ {factor}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Risks */}
                {campaign.risks?.length > 0 && (
                  <div>
                    <h4 className="font-bold text-slate-900 mb-2">⚠️ Riscos Potenciais</h4>
                    <div className="flex flex-wrap gap-2">
                      {campaign.risks.map((risk, i) => (
                        <Badge key={i} className="bg-orange-100 text-orange-800 text-xs">
                          {risk}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs" size="sm">
                    Criar Campanha
                  </Button>
                  <Button variant="outline" className="flex-1 text-xs" size="sm">
                    Editar Rascunho
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Regenerate */}
      <div className="text-center">
        <Button
          onClick={generateSuggestions}
          disabled={loading}
          variant="outline"
          className="text-xs"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Sparkles className="w-3 h-3 mr-2" />}
          Gerar Outras Campanhas
        </Button>
      </div>
    </div>
  );
}