import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen } from 'lucide-react';

export default function CommandGuide() {
  const commands = [
    {
      category: 'Busca e Análise',
      items: [
        {
          cmd: '/BUSCA_COMPLETA [nome_cliente]',
          desc: 'Análise 360° do cliente com histórico, scores e próximas ações',
          usage: '/BUSCA_COMPLETA João Silva'
        },
        {
          cmd: '/ANALISE_PROFUNDA [id_cliente]',
          desc: 'Análise completa: sentimento, objeções, dores, motivadores',
          usage: '/ANALISE_PROFUNDA 12345'
        }
      ]
    },
    {
      category: 'Vendas e Comunicação',
      items: [
        {
          cmd: '/TURBO_VENDA [id_cliente]',
          desc: 'Mensagem de impacto com argumentação científica e gatilho ético',
          usage: '/TURBO_VENDA 12345'
        },
        {
          cmd: '/CONQUISTAR [cidade]',
          desc: 'Abertura de primeiro contato com proposta irrecusável',
          usage: '/CONQUISTAR "São Paulo"'
        },
        {
          cmd: '/CONTATO_QUENTE [id_cliente]',
          desc: 'Ligar ou WhatsApp com contexto completo do cliente',
          usage: '/CONTATO_QUENTE 12345'
        }
      ]
    },
    {
      category: 'Documentos e Propostas',
      items: [
        {
          cmd: '/PROPOSTA_PERSONALIZADA [id_cliente]',
          desc: 'Gerar proposta científica com ROI e diferencial competitivo',
          usage: '/PROPOSTA_PERSONALIZADA 12345'
        },
        {
          cmd: '/EMAIL_INTELIGENTE [id_cliente]',
          desc: 'Email de follow-up personalizado com timeline e gatilho',
          usage: '/EMAIL_INTELIGENTE 12345'
        }
      ]
    },
    {
      category: 'Rotas e Automação',
      items: [
        {
          cmd: '/ROTA_OTIMIZADA [cidade] [data]',
          desc: 'Calcular melhor rota para dia com 6 clínicas otimizadas',
          usage: '/ROTA_OTIMIZADA "São Paulo" 2026-02-20'
        },
        {
          cmd: '/SINCRONIZAR_LEADS',
          desc: 'Importar leads do WhatsApp, segmentar automaticamente',
          usage: '/SINCRONIZAR_LEADS'
        }
      ]
    },
    {
      category: 'Coaching',
      items: [
        {
          cmd: '/COACHING_INSTANTANEO',
          desc: 'Análise de conversa com feedback e melhores práticas',
          usage: '/COACHING_INSTANTANEO'
        }
      ]
    }
  ];

  return (
    <Card className="p-5 bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200">
      <div className="flex items-center gap-3 mb-4">
        <BookOpen className="w-6 h-6 text-slate-600" />
        <h3 className="font-bold text-slate-800">Guia de Comandos Master</h3>
      </div>

      <Tabs defaultValue="0" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          {commands.map((cat, idx) => (
            <TabsTrigger key={idx} value={idx.toString()} className="text-xs">
              {cat.category.split(' ')[0]}
            </TabsTrigger>
          ))}
        </TabsList>

        {commands.map((category, catIdx) => (
          <TabsContent key={catIdx} value={catIdx.toString()} className="space-y-3 mt-4">
            <h4 className="font-semibold text-slate-800 mb-3">{category.category}</h4>
            {category.items.map((item, idx) => (
              <div key={idx} className="bg-white rounded-lg p-3 border border-slate-200">
                <div className="flex items-start justify-between mb-1">
                  <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-700">
                    {item.cmd}
                  </code>
                </div>
                <p className="text-sm text-slate-700 mb-2">{item.desc}</p>
                <div className="bg-blue-50 rounded p-2">
                  <p className="text-xs text-blue-700">
                    <strong>Exemplo:</strong> <code>{item.usage}</code>
                  </p>
                </div>
              </div>
            ))}
          </TabsContent>
        ))}
      </Tabs>

      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-800">
          <strong>💡 Dica:</strong> Digite / no WhatsApp para ver todos os comandos disponíveis em tempo real.
        </p>
      </div>
    </Card>
  );
}