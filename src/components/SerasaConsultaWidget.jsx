import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Shield, Search, CheckCircle, AlertCircle, Loader2, TrendingUp, Building2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function SerasaConsultaWidget({ client, onCnpjSaved }) {
  const [cnpj, setCnpj] = useState(client?.cnpj || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [open, setOpen] = useState(false);

  const formatCnpj = (value) => {
    const nums = value.replace(/\D/g, '').slice(0, 14);
    return nums
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  };

  const handleCnpjChange = (e) => {
    setCnpj(formatCnpj(e.target.value));
  };

  const cleanCnpj = (v) => v.replace(/\D/g, '');

  const consultar = async () => {
    const cnpjLimpo = cleanCnpj(cnpj);
    if (cnpjLimpo.length !== 14) {
      toast.error('CNPJ inválido — informe 14 dígitos');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Save CNPJ to client if changed
      if (client && cnpjLimpo !== cleanCnpj(client.cnpj || '')) {
        await base44.entities.Client.update(client.id, { cnpj: cnpjLimpo });
        onCnpjSaved && onCnpjSaved(cnpjLimpo);
      }

      // Buscar dados na BrasilAPI (gratuito)
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
      const data = await response.json();

      if (!response.ok || data.message) {
        toast.error('CNPJ não encontrado na Receita Federal');
        setResult({ error: data.message || 'Não encontrado' });
        return;
      }

      // Usar IA para estimar score com base nos dados disponíveis
      const aiAnalysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um analista de crédito empresarial. Com base nos dados da Receita Federal abaixo, estime:
1. Score de crédito estimado (0-1000, onde 700+ = bom pagador)
2. Se provavelmente passa de 700 (sim/não/provável)
3. Nível de risco: BAIXO / MÉDIO / ALTO
4. Justificativa em 2 linhas

DADOS DA EMPRESA:
- Razão Social: ${data.razao_social}
- Situação Cadastral: ${data.descricao_situacao_cadastral}
- Porte: ${data.porte}
- Capital Social: R$ ${data.capital_social?.toLocaleString('pt-BR')}
- Data Início: ${data.data_inicio_atividade}
- Regime: ${data.opcao_pelo_simples ? 'Simples Nacional' : 'Outros'}
- Atividade: ${data.cnae_fiscal_descricao}
- Sócios: ${data.qsa?.length || 0}

Retorne JSON com: { score_estimado: number, passa_700: string, nivel_risco: string, justificativa: string }`,
        response_json_schema: {
          type: "object",
          properties: {
            score_estimado: { type: "number" },
            passa_700: { type: "string" },
            nivel_risco: { type: "string" },
            justificativa: { type: "string" }
          }
        }
      });

      setResult({ ...data, ai: aiAnalysis });
      toast.success('Consulta realizada com sucesso!');
    } catch (err) {
      toast.error('Erro ao consultar CNPJ');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (score) => {
    if (score >= 700) return 'text-green-600';
    if (score >= 500) return 'text-yellow-600';
    return 'text-red-600';
  };

  const riskBadge = (nivel) => {
    if (nivel === 'BAIXO') return 'bg-green-100 text-green-700';
    if (nivel === 'MÉDIO') return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <Card className="border-2 border-emerald-300 bg-gradient-to-r from-emerald-50 to-green-50 overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between p-4"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <p className="font-bold text-slate-900 text-sm">🔍 Consulta CNPJ / Score Serasa</p>
            <p className="text-xs text-emerald-700">
              {client?.cnpj ? `CNPJ: ${formatCnpj(client.cnpj)}` : 'Clique para consultar'}
            </p>
          </div>
        </div>
        {result?.ai && (
          <div className="text-right">
            <p className={`text-2xl font-bold ${scoreColor(result.ai.score_estimado)}`}>
              {result.ai.score_estimado}
            </p>
            <p className="text-xs text-slate-500">score est.</p>
          </div>
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          {/* Input CNPJ */}
          <div className="flex gap-2">
            <Input
              placeholder="00.000.000/0000-00"
              value={cnpj}
              onChange={handleCnpjChange}
              className="flex-1 h-11 text-base font-mono bg-white border-emerald-300"
            />
            <Button
              onClick={consultar}
              disabled={loading}
              className="h-11 bg-emerald-600 hover:bg-emerald-700 px-4"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>

          {/* Result */}
          {result && !result.error && result.ai && (
            <div className="space-y-3">
              {/* Score IA */}
              <div className="bg-white rounded-xl p-4 border border-emerald-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Score Estimado por IA</span>
                  <Badge className={riskBadge(result.ai.nivel_risco)}>
                    {result.ai.nivel_risco}
                  </Badge>
                </div>
                <div className="flex items-end gap-3 mb-2">
                  <span className={`text-5xl font-black ${scoreColor(result.ai.score_estimado)}`}>
                    {result.ai.score_estimado}
                  </span>
                  <div className="pb-1">
                    <span className="text-sm text-slate-500">/ 1000</span>
                    <div className={`text-sm font-bold ${result.ai.passa_700?.toLowerCase().includes('sim') ? 'text-green-600' : result.ai.passa_700?.toLowerCase().includes('provável') ? 'text-yellow-600' : 'text-red-600'}`}>
                      {result.ai.passa_700?.toLowerCase().includes('sim') ? '✅ Passa de 700' :
                       result.ai.passa_700?.toLowerCase().includes('provável') ? '⚠️ Provável' : '❌ Abaixo de 700'}
                    </div>
                  </div>
                </div>
                {/* Barra de score */}
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${result.ai.score_estimado >= 700 ? 'bg-green-500' : result.ai.score_estimado >= 500 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${(result.ai.score_estimado / 1000) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-slate-600 mt-2 italic">{result.ai.justificativa}</p>
              </div>

              {/* Dados da Receita Federal */}
              <div className="bg-white rounded-xl p-3 border border-slate-200">
                <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> Receita Federal
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-slate-400">Razão Social</p>
                    <p className="font-medium text-slate-700">{result.razao_social}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Situação</p>
                    <Badge className={result.descricao_situacao_cadastral === 'ATIVA' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                      {result.descricao_situacao_cadastral}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-slate-400">Porte</p>
                    <p className="font-medium text-slate-700">{result.porte}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Capital Social</p>
                    <p className="font-medium text-slate-700">R$ {result.capital_social?.toLocaleString('pt-BR')}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Fundação</p>
                    <p className="font-medium text-slate-700">{result.data_inicio_atividade}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Regime</p>
                    <p className="font-medium text-slate-700">{result.opcao_pelo_simples ? 'Simples Nacional' : 'Regime Geral'}</p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-400 text-center">
                ⚠️ Score estimado por IA com dados da Receita Federal. Para score oficial acesse serasaempreendedor.com.br
              </p>
            </div>
          )}

          {result?.error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <p className="text-sm text-red-600">{result.error}</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}