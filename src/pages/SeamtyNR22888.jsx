import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SeamtyNR22888CoreControl from '@/components/SeamtyNR22888CoreControl';
import { AlertTriangle, BookOpen, Shield } from 'lucide-react';

/**
 * SEAMATY NR22888 — Página Principal
 * Central de investigação + vendas + marketing veterinário
 */

export default function SeamtyNR22888() {
  const [showGuide, setShowGuide] = useState(true);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* GUIA DE VERDADE ABSOLUTA */}
      {showGuide && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <Card className="bg-orange-950 border-orange-600 shadow-2xl">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-orange-100 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  ⚠️ Regra Ouro
                </CardTitle>
                <button 
                  onClick={() => setShowGuide(false)}
                  className="text-orange-300 hover:text-orange-100"
                >
                  ✕
                </button>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-orange-200 space-y-1">
              <p>🟢 <strong>Confirmado:</strong> Verificado no CRM</p>
              <p>🟡 <strong>Provável:</strong> Sinal forte</p>
              <p>🔴 <strong>Não confirmado:</strong> Hipótese</p>
              <p className="text-orange-300 font-bold mt-2">NUNCA inventar dados, telefones, cidades ou resultados.</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CONTEÚDO PRINCIPAL */}
      <SeamtyNR22888CoreControl />

      {/* DOCUMENTAÇÃO E GUIAS */}
      <div className="max-w-7xl mx-auto p-4 md:p-6 mt-8 mb-20 space-y-6">
        
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              📖 Guia Rápido — Seamaty NR22888
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-slate-300 text-sm">
            
            <div>
              <h4 className="font-bold text-white mb-2">🎯 Super Master Hunter</h4>
              <p>⚠️ Clicar em "Super Master Hunter" abre modal:</p>
              <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                <li>Selecionar cidade (Botucatu, Marília, Garça, Bauru...)</li>
                <li>Raio de busca (5, 10, 20, 30 km)</li>
                <li>Profundidade (rápida, completa, suprema)</li>
                <li>Segmento (clínica, hospital, laboratório, centro diagnóstico)</li>
                <li>Confirmar antes de executar</li>
                <li>Sistema mostra estimativa de créditos</li>
                <li>Máximo 25 leads · Timeout 2 min</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-2">🏆 Ranking do Dia</h4>
              <p>Mostra TOP 10 oportunidades:</p>
              <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                <li>Fechamento rápido (score 80+)</li>
                <li>Insumos (clientes com equipamento confirmado)</li>
                <li>Hospitais (potencial alto)</li>
                <li>Laboratórios (recorrência)</li>
                <li>Clientes parados (re-engajamento)</li>
                <li>Distância (próximos hoje)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-2">📞 Follow-up Inteligente</h4>
              <p>Nunca enviar sozinho. Sempre:</p>
              <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                <li>✅ Pedir aprovação antes de enviar</li>
                <li>✅ Mostrar mensagem pronta</li>
                <li>✅ Permitir editar antes publicar</li>
                <li>✅ Registrar no histórico</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-2">🎚️ Intensidade Comercial (1-5)</h4>
              <p>Controla tom em todas as plataformas:</p>
              <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                <li>1 = Técnico (fatos, dados)</li>
                <li>2 = Consultivo (dor + oportunidade)</li>
                <li>3 = Equilibrado (técnico + comercial)</li>
                <li>4 = Persuasivo (urgência, ação)</li>
                <li>5 = Fechamento (AGORA, limitado)</li>
                <li>⚠️ Regra: Persuasivo SIM · Mentira NUNCA</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-2">📸 Instagram Studio</h4>
              <p>Publicação segura:</p>
              <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                <li>✅ Gerar conteúdo (posts, reels, stories)</li>
                <li>✅ Agendar (não publicar agora)</li>
                <li>✅ Aprovar antes de ir ao ar</li>
                <li>✅ Se OAuth não aprovada: modo manual</li>
                <li>✅ Sempre copiar legenda para Instagram Web</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-2">💾 Mob Vendedor Import</h4>
              <p>Importar com segurança:</p>
              <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                <li>✅ Pré-visualizar antes de importar</li>
                <li>✅ Mapear colunas (CRM ↔ arquivo)</li>
                <li>✅ Evitar duplicados (comparar CNPJ)</li>
                <li>✅ Auditoria completa (log de importação)</li>
                <li>✅ Permitir desfazer se errado</li>
              </ul>
            </div>

            <div className="bg-slate-700 p-3 rounded-lg border-l-4 border-orange-500">
              <h4 className="font-bold text-orange-300 mb-1">🔐 Segurança</h4>
              <p className="text-xs">Senha admin obrigatória para: Modo Supremo, Instagram, Auditoria, Exclusões, APIs</p>
            </div>

          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5" />
              🎯 Princípios Absolutos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-slate-300 text-sm">
            <p>✅ Nunca inventar clientes, dados, telefones, equipamentos</p>
            <p>✅ Nunca afirmar algo sem confirmação (usar 🟢🟡🔴)</p>
            <p>✅ Toda IA é sob demanda (clique, não background)</p>
            <p>✅ Nenhum crédito gasto sem aprovação</p>
            <p>✅ Nenhuma mensagem enviada sozinha</p>
            <p>✅ Nenhuma publicação automática</p>
            <p>✅ Cache 30 dias (evitar reprocessar)</p>
            <p>✅ Usar apenas dados públicos + CRM + planilhas do usuário</p>
            <p>✅ Mobile-first · Tablet-first · Rápido</p>
            <p>✅ Modo offline para dados críticos</p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}