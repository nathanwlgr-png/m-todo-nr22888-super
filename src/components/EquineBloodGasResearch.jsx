import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Download, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function EquineBloodGasResearch() {
  const [researching, setResearching] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [report, setReport] = useState(null);
  const [articles, setArticles] = useState(null);

  const generateBloodGasReport = async () => {
    setResearching(true);
    try {
      toast.info('Pesquisando hemogasometria equina...', { duration: 3000 });

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um veterinário especialista em medicina interna equina. Crie um guia técnico completo sobre:

HEMOGASOMETRIA EM EQUINOS - GUIA COMPLETO

1. PARÂMETROS DA HEMOGASOMETRIA E INTERPRETAÇÃO:
   - pH sanguíneo (valores normais e alterações)
   - pCO2 (pressão parcial de CO2)
   - pO2 (pressão parcial de O2)
   - HCO3- (bicarbonato)
   - BE (base excess)
   - Lactato
   - Saturação de O2
   - Para CADA parâmetro: valor normal, significado clínico, alterações em doenças

2. FORMAÇÃO E INTER-RELAÇÃO DOS VALORES:
   - Como o pH é determinado (equação de Henderson-Hasselbalch)
   - Relação entre pCO2, HCO3 e pH
   - Compensação respiratória vs metabólica
   - Diagramas de interpretação

3. CORRELAÇÕES CLÍNICAS EM POTROS:
   - Valores normais específicos para potros
   - Diferenças entre potros neonatos e adultos
   - Acidose neonatal
   - Hiperlactemia em potros sépticos

4. LÍQUIDO SINOVIAL E HEMOGASOMETRIA:
   - pH sinovial normal vs sangue
   - Como infecções articulares alteram pH local
   - Correlação entre lactato sanguíneo e sinovial
   - Acidose metabólica sistêmica em sepse articular
   - Marcadores de inflamação sistêmica

5. INFECÇÕES E ALTERAÇÕES HEMOGASOMÉTRICAS:
   - Padrão de sepse (acidose metabólica + hiperlactemia)
   - Compensação respiratória em cavalos doentes
   - Desequilíbrio ácido-base em artrite séptica
   - Monitoramento de resposta ao tratamento

6. PROTOCOLO DIAGNÓSTICO INTEGRADO:
   - Quando solicitar hemogasometria
   - Interpretação conjunta: hemogasometria + líquido sinovial + hemograma
   - Árvore de decisão diagnóstica

Formate em seções claras com valores de referência em tabelas quando possível.`,
        add_context_from_internet: true
      });

      const fullReport = `
╔═══════════════════════════════════════════════════════════════════════╗
║                  HEMOGASOMETRIA EM EQUINOS                            ║
║        Guia Técnico Completo - Correlações Clínicas                  ║
╚═══════════════════════════════════════════════════════════════════════╝

Data: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}
Elaborado por: Sistema IA Veterinário - Método NR22


${response}


═══════════════════════════════════════════════════════════════════════
                    VALORES DE REFERÊNCIA - RESUMO
═══════════════════════════════════════════════════════════════════════

HEMOGASOMETRIA ARTERIAL - EQUINOS ADULTOS:
• pH: 7.35 - 7.45
• pCO2: 35 - 45 mmHg
• pO2: 90 - 100 mmHg
• HCO3-: 24 - 30 mEq/L
• BE: -4 a +4 mEq/L
• Lactato: < 2.0 mmol/L
• SatO2: > 95%

HEMOGASOMETRIA - POTROS NEONATOS (< 7 dias):
• pH: 7.32 - 7.42
• Lactato: 2.0 - 4.0 mmol/L (primeiras 24h)
• HCO3-: 22 - 28 mEq/L

LÍQUIDO SINOVIAL - EQUINOS SAUDÁVEIS:
• pH: 7.0 - 7.4
• Proteína: < 2.5 g/dL
• Leucócitos: < 500/μL
• Neutrófilos: < 10%

LÍQUIDO SINOVIAL - INFECÇÃO:
• pH: < 6.8 (acidose local)
• Proteína: > 4.0 g/dL
• Leucócitos: > 30,000/μL
• Neutrófilos: > 90%


═══════════════════════════════════════════════════════════════════════
                    CORRELAÇÕES CLÍNICAS IMPORTANTES
═══════════════════════════════════════════════════════════════════════

🔬 SEPSE ARTICULAR + HEMOGASOMETRIA:
   - Acidose metabólica (pH ↓, HCO3 ↓)
   - Hiperlactemia (lactato > 4 mmol/L)
   - Gap aniônico aumentado
   - Compensação respiratória (pCO2 ↓)

🩸 INFECÇÃO SISTÊMICA (potros):
   - Acidose metabólica severa
   - Lactato > 6 mmol/L = mau prognóstico
   - BE negativo (< -8)
   - pH sinovial < 6.5 em artrite séptica

⚕️ MONITORAMENTO DE TRATAMENTO:
   - Normalização do lactato = boa resposta
   - pH sinovial aumentando = controle infecção local
   - Correção de BE = restauração equilíbrio metabólico


═══════════════════════════════════════════════════════════════════════
                        FIM DO RELATÓRIO
═══════════════════════════════════════════════════════════════════════
`;

      setReport(fullReport);
      toast.success('Relatório de hemogasometria gerado!');
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao gerar relatório');
    } finally {
      setResearching(false);
    }
  };

  const translateArticles = async () => {
    setTranslating(true);
    try {
      toast.info('Pesquisando e traduzindo 5 artigos científicos...', { duration: 5000 });

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Pesquise 5 artigos científicos em INGLÊS sobre:
"Synovial fluid contamination and pH alteration in horses"
"Bacterial infection impact on synovial pH in equine"

Para cada artigo, forneça:
1. Título original em inglês
2. Autores
3. Ano e revista
4. DOI/Link
5. ABSTRACT COMPLETO traduzido para PORTUGUÊS
6. PRINCIPAIS ACHADOS traduzidos para PORTUGUÊS
7. METODOLOGIA (resumida em português)
8. CONCLUSÕES (traduzidas para português)

Após listar os 5 artigos, forneça uma SÍNTESE COMPARATIVA em português destacando:
- Consensos entre os estudos
- Valores de pH reportados
- Tipos de contaminação bacteriana estudados
- Implicações clínicas práticas

Use busca na internet para encontrar artigos reais e relevantes.`,
        add_context_from_internet: true
      });

      const articlesReport = `
╔═══════════════════════════════════════════════════════════════════════╗
║    ARTIGOS CIENTÍFICOS: CONTAMINAÇÃO E pH DO LÍQUIDO SINOVIAL        ║
║                    Traduzidos para Português                          ║
╚═══════════════════════════════════════════════════════════════════════╝

Data: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}
Total de Artigos: 5 estudos científicos
Idioma Original: Inglês → Traduzido para Português


${response}


═══════════════════════════════════════════════════════════════════════
                    APLICAÇÃO CLÍNICA PRÁTICA
═══════════════════════════════════════════════════════════════════════

📋 PROTOCOLO DIAGNÓSTICO BASEADO EM EVIDÊNCIAS:

1. SUSPEITA DE ARTRITE SÉPTICA:
   ✓ Coleta estéril de líquido sinovial
   ✓ Análise imediata de pH (< 6.8 = suspeita)
   ✓ Contagem celular (> 30,000/μL)
   ✓ Cultura bacteriana
   ✓ Hemogasometria sistêmica

2. INTERPRETAÇÃO DO pH SINOVIAL:
   • pH 7.0-7.4: Normal
   • pH 6.8-7.0: Inflamação não séptica
   • pH 6.5-6.8: Provável infecção bacteriana
   • pH < 6.5: Infecção severa/sepse articular

3. CORRELAÇÃO COM EXAMES SISTÊMICOS:
   • Leucocitose sanguínea + pH sinovial baixo = sepse confirmada
   • Hiperlactemia (> 4 mmol/L) = sepse sistêmica
   • Neutrofilia > 80% no líquido = infecção ativa

4. MONITORAMENTO DE RESPOSTA:
   • pH sinovial normalizando (> 7.0) = boa resposta
   • Contagem celular reduzindo = controle infecção
   • Lactato normalizando = resolução sistêmica


═══════════════════════════════════════════════════════════════════════
                        FIM DOS ARTIGOS
═══════════════════════════════════════════════════════════════════════
`;

      setArticles(articlesReport);
      toast.success('Artigos traduzidos com sucesso!');
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao pesquisar artigos');
    } finally {
      setTranslating(false);
    }
  };

  const downloadFile = (content, filename) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Arquivo baixado!');
  };

  const copyContent = async (content) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Copiado para área de transferência!');
    } catch (error) {
      toast.error('Erro ao copiar');
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-300 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">Pesquisa Hemogasometria Equina</h3>
          <p className="text-xs text-slate-600">Artigos científicos + correlações clínicas</p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Botão 1: Guia de Hemogasometria */}
        <div className="p-3 bg-white rounded-lg border border-blue-200">
          <p className="text-sm font-semibold text-blue-800 mb-2">📊 Parte 1: Guia Técnico</p>
          <p className="text-xs text-slate-700 mb-3">
            Hemogasometria completa, interpretação de valores, correlação com potros, líquido sinovial e infecções
          </p>
          <Button
            onClick={generateBloodGasReport}
            disabled={researching}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {researching ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando guia...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Gerar Guia de Hemogasometria
              </>
            )}
          </Button>
        </div>

        {report && (
          <div className="p-3 bg-green-50 rounded-lg border-2 border-green-300">
            <p className="text-xs font-semibold text-green-800 mb-2">✅ Guia gerado com sucesso!</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyContent(report)}
                className="border-green-300"
              >
                <Copy className="w-3 h-3 mr-1" />
                Copiar
              </Button>
              <Button
                size="sm"
                onClick={() => downloadFile(report, 'Hemogasometria_Equina')}
                className="bg-green-600 hover:bg-green-700"
              >
                <Download className="w-3 h-3 mr-1" />
                Baixar PDF
              </Button>
            </div>
          </div>
        )}

        {/* Botão 2: Artigos Científicos */}
        <div className="p-3 bg-white rounded-lg border border-blue-200">
          <p className="text-sm font-semibold text-blue-800 mb-2">🔬 Parte 2: Artigos Científicos</p>
          <p className="text-xs text-slate-700 mb-3">
            5 artigos sobre contaminação do líquido sinovial e alteração de pH - traduzidos para português
          </p>
          <Button
            onClick={translateArticles}
            disabled={translating}
            className="w-full bg-cyan-600 hover:bg-cyan-700"
          >
            {translating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Pesquisando e traduzindo...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Pesquisar 5 Artigos (EN → PT)
              </>
            )}
          </Button>
        </div>

        {articles && (
          <div className="p-3 bg-green-50 rounded-lg border-2 border-green-300">
            <p className="text-xs font-semibold text-green-800 mb-2">✅ 5 artigos traduzidos!</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyContent(articles)}
                className="border-green-300"
              >
                <Copy className="w-3 h-3 mr-1" />
                Copiar
              </Button>
              <Button
                size="sm"
                onClick={() => downloadFile(articles, 'Artigos_Liquido_Sinovial')}
                className="bg-green-600 hover:bg-green-700"
              >
                <Download className="w-3 h-3 mr-1" />
                Baixar PDF
              </Button>
            </div>
          </div>
        )}

        {(report || articles) && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800">
              ℹ️ <strong>Arquivos prontos!</strong> Use os botões "Baixar PDF" ou "Copiar" para cada documento gerado.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}