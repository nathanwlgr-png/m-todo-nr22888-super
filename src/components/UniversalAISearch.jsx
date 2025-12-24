import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Search, FileText, Loader2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

/**
 * BUSCA UNIVERSAL COM IA
 * Pesquisa qualquer coisa, gera PDF e copia
 */
export default function UniversalAISearch() {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState(null);

  const search = async () => {
    if (!query.trim()) {
      toast.error('Digite algo para pesquisar');
      return;
    }

    setSearching(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `PESQUISA UNIVERSAL COM IA

Pergunta/Tema: ${query}

TAREFA:
Use Google, artigos científicos, bases de dados, relatórios de mercado, dados públicos e todas as fontes disponíveis para responder de forma COMPLETA e DETALHADA.

Estruture em:
1. RESUMO EXECUTIVO
2. DADOS E ESTATÍSTICAS
3. ANÁLISE DETALHADA
4. CONCLUSÕES
5. REFERÊNCIAS

Seja técnico, preciso e completo.`,
        add_context_from_internet: true
      });

      setResult(response);

      // Gerar PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const margin = 15;
      const maxWidth = pageWidth - 2 * margin;
      
      doc.setFontSize(16);
      doc.text('PESQUISA IA UNIVERSAL', margin, 20);
      
      doc.setFontSize(10);
      doc.text(`Data: ${new Date().toLocaleString('pt-BR')}`, margin, 30);
      doc.text(`Consulta: ${query}`, margin, 37);
      
      doc.setFontSize(11);
      const lines = doc.splitTextToSize(response, maxWidth);
      let y = 50;
      
      lines.forEach(line => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, margin, y);
        y += 7;
      });

      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Download PDF
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `pesquisa-${Date.now()}.pdf`;
      link.click();

      // Copiar texto
      await navigator.clipboard.writeText(response);
      toast.success('PDF baixado e texto copiado!');

    } catch (error) {
      console.error(error);
      toast.error('Erro na pesquisa');
    } finally {
      setSearching(false);
    }
  };

  return (
    <Card className="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-300">
      <div className="flex items-center gap-2 mb-4">
        <Search className="w-5 h-5 text-indigo-600" />
        <h3 className="font-bold text-slate-800">Pesquisa Universal IA</h3>
      </div>

      <Textarea
        placeholder="Pesquise qualquer coisa: artigos científicos, dados de mercado, estatísticas, estudos..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        rows={4}
        className="mb-3"
      />

      <Button
        onClick={search}
        disabled={searching}
        className="w-full bg-indigo-600 hover:bg-indigo-700"
      >
        {searching ? (
          <><Loader2 className="w-4 h-4 animate-spin mr-2" />Pesquisando...</>
        ) : (
          <><Search className="w-4 h-4 mr-2" />Pesquisar e Gerar PDF</>
        )}
      </Button>

      {result && (
        <div className="mt-3 p-3 bg-white rounded-lg border-2 border-indigo-300 max-h-64 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-indigo-700">Resultado:</p>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                navigator.clipboard.writeText(result);
                toast.success('Copiado!');
              }}
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
          <p className="text-xs text-slate-700 whitespace-pre-wrap">{result}</p>
        </div>
      )}
    </Card>
  );
}