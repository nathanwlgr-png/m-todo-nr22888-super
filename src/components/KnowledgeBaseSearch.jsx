import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, FileText } from 'lucide-react';

export default function KnowledgeBaseSearch({ onArticleSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const performSemanticSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setSearched(true);
    
    try {
      // Busca semântica com IA
      const prompt = `Você é um mecanismo de busca semântica para uma base de conhecimento.

CONSULTA DO USUÁRIO: "${query}"

ENCONTRE ARTIGOS RELEVANTES COM ESSAS PALAVRAS-CHAVE:
Equipamentos: VG2, VG1, VQ1, QT3, 3DX, SMT-120VP
Tópicos: hemogasometria, hemograma, bioquímica, imunofluorescência, PCR, técnicas, diagnóstico, vendas

RETORNE JSON:
{
  "search_terms": ["termo1", "termo2"],
  "relevant_categories": ["categoria1", "categoria2"],
  "best_practices": ["dica1", "dica2"]
}`;

      const semanticTerms = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            search_terms: { type: "array", items: { type: "string" } },
            relevant_categories: { type: "array", items: { type: "string" } },
            best_practices: { type: "array", items: { type: "string" } }
          }
        }
      });

      // Busca por keywords
      const allArticles = await base44.entities.KnowledgeBase.list();
      
      const scored = allArticles
        .map(article => {
          let score = 0;
          
          // Verificar keywords
          (article.keywords || []).forEach(kw => {
            if (semanticTerms.search_terms.includes(kw)) score += 10;
          });
          
          // Verificar tags
          (article.tags || []).forEach(tag => {
            if (query.toLowerCase().includes(tag.toLowerCase())) score += 5;
          });
          
          // Verificar categoria
          if (semanticTerms.relevant_categories.includes(article.category)) score += 8;
          
          // Busca simples no título/conteúdo
          if (article.title.toLowerCase().includes(query.toLowerCase())) score += 15;
          if (article.summary?.toLowerCase().includes(query.toLowerCase())) score += 5;
          
          return { ...article, relevance: score };
        })
        .filter(a => a.relevance > 0)
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, 5);

      setResults(scored);
    } catch (error) {
      console.error('Erro na busca:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-white border-indigo-200">
        <div className="flex gap-2">
          <Input
            placeholder="O que você precisa saber? (ex: hemogasometria, vendas VG2)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && performSemanticSearch()}
            className="flex-1"
          />
          <Button
            onClick={performSemanticSearch}
            disabled={loading || !query.trim()}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>
      </Card>

      {searched && results.length === 0 && !loading && (
        <Card className="p-6 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500">Nenhum artigo encontrado</p>
        </Card>
      )}

      {results.map(article => (
        <Card
          key={article.id}
          className="p-4 cursor-pointer hover:shadow-lg transition-all"
          onClick={() => onArticleSelect?.(article)}
        >
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-slate-800">{article.title}</h3>
            <Badge className="bg-indigo-100 text-indigo-700">
              {Math.round((article.relevance / 30) * 100)}% relevante
            </Badge>
          </div>
          
          {article.summary && (
            <p className="text-sm text-slate-600 mb-2">{article.summary}</p>
          )}
          
          <div className="flex flex-wrap gap-1">
            {article.tags?.slice(0, 3).map((tag, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}