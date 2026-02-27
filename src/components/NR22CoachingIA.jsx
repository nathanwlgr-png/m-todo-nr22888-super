import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Award, Sparkles, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function NR22CoachingIA({ client, coachingData, loadingCoaching, onGenerate }) {
  if (!client) return (
    <div className="text-center py-12 text-slate-400">
      <Award className="w-10 h-10 mx-auto mb-2" />
      <p className="text-sm">Selecione um cliente para coaching personalizado</p>
    </div>
  );

  const copy = (text) => { navigator.clipboard.writeText(text); toast.success('Copiado!'); };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-800 text-sm">🏆 Coaching NR22 — {client.first_name}</h2>
        <Button size="sm" onClick={onGenerate} disabled={loadingCoaching} className="bg-indigo-600 h-8 text-xs">
          {loadingCoaching ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
          Gerar Coaching
        </Button>
      </div>

      {!coachingData && !loadingCoaching && (
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="p-4 text-center">
            <Award className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-amber-800">Coaching Personalizado com IA</p>
            <p className="text-xs text-amber-600 mt-1">Diagnóstico + Forças + Armadilhas + Script pronto</p>
            <Button onClick={onGenerate} className="mt-3 bg-amber-500 hover:bg-amber-600 text-sm h-8">
              🚀 Gerar Coaching Agora
            </Button>
          </CardContent>
        </Card>
      )}

      {loadingCoaching && (
        <Card>
          <CardContent className="p-6 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-2" />
            <p className="text-sm text-slate-500">Método NR22 analisando {client.first_name}...</p>
            <p className="text-xs text-slate-400 mt-1">47 variáveis × perfil numerológico × histórico</p>
          </CardContent>
        </Card>
      )}

      {coachingData && (
        <div className="space-y-3">
          {coachingData.diagnostico && (
            <Card className="border-indigo-200">
              <CardContent className="p-3">
                <p className="text-xs font-bold text-indigo-700 mb-1.5">🎯 DIAGNÓSTICO DO MOMENTO</p>
                <p className="text-xs text-slate-700 leading-relaxed">{coachingData.diagnostico}</p>
              </CardContent>
            </Card>
          )}

          {coachingData.forcas?.length > 0 && (
            <Card className="border-green-200">
              <CardContent className="p-3">
                <p className="text-xs font-bold text-green-700 mb-1.5">💪 SUAS FORÇAS AGORA</p>
                <ul className="space-y-1">
                  {coachingData.forcas.map((f, i) => (
                    <li key={i} className="text-xs text-slate-700 flex gap-1.5">
                      <span className="text-green-500 shrink-0">✓</span>{f}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {coachingData.armadilhas?.length > 0 && (
            <Card className="border-red-200">
              <CardContent className="p-3">
                <p className="text-xs font-bold text-red-700 mb-1.5">⚠️ ARMADILHAS A EVITAR</p>
                <ul className="space-y-1">
                  {coachingData.armadilhas.map((a, i) => (
                    <li key={i} className="text-xs text-slate-700 flex gap-1.5">
                      <span className="text-red-500 shrink-0">✕</span>{a}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {coachingData.script_contato && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-bold text-blue-700">📱 SCRIPT PRÓXIMO CONTATO</p>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => copy(coachingData.script_contato)}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-xs text-blue-800 leading-relaxed whitespace-pre-wrap bg-white/70 rounded p-2">{coachingData.script_contato}</p>
                {client.phone && (
                  <a href={`https://wa.me/${client.phone.replace(/\D/g,'')}?text=${encodeURIComponent(coachingData.script_contato)}`} target="_blank" rel="noreferrer">
                    <Button size="sm" className="w-full mt-2 bg-green-600 hover:bg-green-700 text-xs h-7">
                      📱 Enviar agora no WhatsApp
                    </Button>
                  </a>
                )}
              </CardContent>
            </Card>
          )}

          {coachingData.tecnica_psicologica && (
            <Card className="border-purple-200">
              <CardContent className="p-3">
                <p className="text-xs font-bold text-purple-700 mb-1.5">🧠 TÉCNICA PSICOLÓGICA</p>
                <p className="text-xs text-slate-700">{coachingData.tecnica_psicologica}</p>
              </CardContent>
            </Card>
          )}

          {coachingData.insight && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-3">
                <p className="text-xs font-bold text-amber-700 mb-1">💡 INSIGHT NR22</p>
                <p className="text-xs text-amber-800">{coachingData.insight}</p>
              </CardContent>
            </Card>
          )}

          {coachingData.frase_motivacional && (
            <Card className="bg-gradient-to-br from-indigo-600 to-purple-700 border-0">
              <CardContent className="p-3">
                <p className="text-[10px] text-indigo-200 mb-1">🔥 FORTALECIMENTO MENTAL NR22</p>
                <p className="text-xs text-white font-medium italic">"{coachingData.frase_motivacional}"</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}