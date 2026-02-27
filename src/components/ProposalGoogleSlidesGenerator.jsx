import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Presentation, ExternalLink, Copy, MessageSquare, Loader2, Sparkles, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

const EQUIPAMENTOS = ['VBC-50A', 'SMT-120VP', 'VG1', 'VG2', 'Vi1', 'VQ1', 'QT3'];

const PROD_INFO = {
  'VBC-50A': 'Hematológico 5 partes | ROI ~8 meses',
  'SMT-120VP': 'Bioquímico Auto | ROI ~10 meses',
  'VG1': 'Gasometria | ROI ~9 meses',
  'VG2': 'Gasometria + Imunofluorescência | ROI ~12 meses',
  'Vi1': 'Imunofluorescência | ROI ~10 meses',
  'VQ1': 'PCR Quantitativo | ROI ~14 meses',
  'QT3': 'Bioquímico Individual | ROI ~6 meses',
};

export default function ProposalGoogleSlidesGenerator({ client }) {
  const [equipment, setEquipment] = useState(client?.equipment_interest || 'VBC-50A');
  const [customNotes, setCustomNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    const resp = await base44.functions.invoke('generateProposalGoogleSlides', {
      client_id: client?.id,
      client_name: client?.first_name || client?.full_name,
      equipment_name: equipment,
      custom_notes: customNotes,
    });
    setResult(resp.data);
    setLoading(false);
  };

  const copyWhatsApp = () => {
    navigator.clipboard.writeText(result.whatsapp_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-indigo-100 shadow-lg">
      <CardHeader className="pb-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-xl">
        <CardTitle className="flex items-center gap-2 text-white text-base">
          <Presentation className="w-5 h-5" />
          Proposta Google Slides IA
          <Badge className="bg-white/20 text-white text-xs">v6 NR22</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        {/* Equipamento */}
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Equipamento</label>
          <Select value={equipment} onValueChange={setEquipment}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EQUIPAMENTOS.map(eq => (
                <SelectItem key={eq} value={eq}>
                  <div>
                    <span className="font-semibold">{eq}</span>
                    <span className="text-xs text-slate-500 ml-2">{PROD_INFO[eq]}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Notas adicionais */}
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Contexto adicional (opcional)</label>
          <Textarea
            placeholder="Ex: cliente pediu foco em ROI, tem IDEXX atualmente..."
            value={customNotes}
            onChange={e => setCustomNotes(e.target.value)}
            className="text-sm h-16 resize-none"
          />
        </div>

        {/* Botão gerar */}
        <Button
          onClick={handleGenerate}
          disabled={loading || !client}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Gerando 6 slides com IA...</>
          ) : (
            <><Sparkles className="w-4 h-4 mr-2" /> Gerar Proposta Google Slides</>
          )}
        </Button>

        {!client && (
          <p className="text-xs text-slate-400 text-center">Selecione um cliente para gerar a proposta</p>
        )}

        {/* Resultado */}
        {result && (
          <div className="mt-2 space-y-2 animate-in fade-in">
            {result.success ? (
              <>
                <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg p-3">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-medium">{result.message}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <a href={result.slide_url} target="_blank" rel="noreferrer">
                    <Button variant="outline" size="sm" className="w-full gap-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                      <ExternalLink className="w-3.5 h-3.5" />
                      Abrir Slides
                    </Button>
                  </a>
                  <a href={result.export_url} target="_blank" rel="noreferrer">
                    <Button variant="outline" size="sm" className="w-full gap-1">
                      <Presentation className="w-3.5 h-3.5" />
                      Baixar PPTX
                    </Button>
                  </a>
                </div>

                {result.whatsapp_text && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyWhatsApp}
                    className="w-full gap-1 border-green-200 text-green-700 hover:bg-green-50"
                  >
                    {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copiado!' : 'Copiar texto WhatsApp'}
                  </Button>
                )}

                {result.whatsapp_text && (
                  <a
                    href={`https://wa.me/${client?.phone}?text=${encodeURIComponent(result.whatsapp_text)}`}
                    target="_blank" rel="noreferrer"
                    className={!client?.phone ? 'pointer-events-none opacity-50' : ''}
                  >
                    <Button size="sm" className="w-full gap-1 bg-green-600 hover:bg-green-700">
                      <MessageSquare className="w-3.5 h-3.5" />
                      Enviar via WhatsApp
                    </Button>
                  </a>
                )}
              </>
            ) : (
              <div className="bg-red-50 text-red-700 rounded-lg p-3 text-sm">
                ❌ {result.error || 'Erro ao gerar apresentação'}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}