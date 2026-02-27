import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Flame, RefreshCw } from 'lucide-react';

const FRASES_FALLBACK = [
  { frase: "O sucesso é a soma de pequenos esforços repetidos dia após dia.", autor: "Robert Collier" },
  { frase: "A derrota não é o fim, mas a preparação para vitórias maiores.", autor: "Napoleão Hill" },
  { frase: "Conhece-te a ti mesmo e conhecerás o universo e os deuses.", autor: "Sócrates" },
  { frase: "A excelência não é um ato, mas um hábito.", autor: "Platão" },
  { frase: "Tudo o que a mente pode conceber e acreditar, ela pode conquistar.", autor: "Napoleão Hill" },
  { frase: "Foco: uma coisa de cada vez. Dados: não invente, analise. Avance.", autor: "Método NR22" },
  { frase: "Perda faz parte. Foco vence dispersão. Dados vencem achismo.", autor: "Nathan Rosa" },
];

export default function NR22DailyMotivation() {
  const [frase, setFrase] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cached = sessionStorage.getItem('nr22_motivation_today');
    if (cached) { setFrase(JSON.parse(cached)); return; }
    gerarFrase();
  }, []);

  const gerarFrase = async () => {
    setLoading(true);
    try {
      const dia = new Date().getDay();
      const contextos = ['segunda motivação','terça foco','quarta resiliência','quinta energia','sexta fechamento','sábado reflexão','domingo preparação'];
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Gere uma frase motivacional poderosa para vendedores baseada em Napoleão Hill, Sócrates ou Platão. Tema: ${contextos[dia]}. Curta, impactante, em português. Retorne só a frase e o autor.`,
        response_json_schema: {
          type: "object",
          properties: {
            frase: { type: "string" },
            autor: { type: "string" }
          }
        }
      });
      const resultado = { frase: res.frase, autor: res.autor };
      setFrase(resultado);
      sessionStorage.setItem('nr22_motivation_today', JSON.stringify(resultado));
    } catch {
      const fallback = FRASES_FALLBACK[new Date().getDay() % FRASES_FALLBACK.length];
      setFrase(fallback);
    } finally {
      setLoading(false);
    }
  };

  if (!frase && !loading) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-700 to-purple-700 rounded-xl p-3 mb-3">
      <div className="flex items-start gap-2">
        <Flame className="w-4 h-4 text-yellow-300 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-[10px] text-indigo-200 font-semibold mb-0.5">💡 FORTALECIMENTO MENTAL DIÁRIO — NR22</p>
          {loading ? (
            <div className="h-4 bg-white/20 rounded animate-pulse w-3/4" />
          ) : (
            <>
              <p className="text-xs text-white font-medium italic">"{frase?.frase}"</p>
              <p className="text-[10px] text-indigo-200 mt-0.5">— {frase?.autor}</p>
            </>
          )}
        </div>
        <button onClick={() => { sessionStorage.removeItem('nr22_motivation_today'); gerarFrase(); }}
          className="p-1 hover:bg-white/10 rounded transition-colors">
          <RefreshCw className="w-3 h-3 text-indigo-200" />
        </button>
      </div>
    </div>
  );
}