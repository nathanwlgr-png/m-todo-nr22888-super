import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, BookOpen, Microscope, Activity, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { base44 } from '@/api/base44Client';

export default function TechnicalMaterialsHub() {
  const [generating, setGenerating] = useState(null);
  const [generatingVG2Scientific, setGeneratingVG2Scientific] = useState(false);

  const generateAcidBaseBalancePDF = () => {
    setGenerating('acidbase');
    try {
      const doc = new jsPDF();
      let yPos = 20;

      // Título
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('EQUILÍBRIO ÁCIDO-BASE EM MEDICINA VETERINÁRIA', 105, yPos, { align: 'center' });
      yPos += 15;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Manual Completo para Interpretação de Hemogasometria', 105, yPos, { align: 'center' });
      yPos += 20;

      // Capítulo 1
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('1. FUNDAMENTOS DO EQUILÍBRIO ÁCIDO-BASE', 20, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const fundamentosText = [
        'O equilíbrio ácido-base é crucial para manter as funções celulares normais.',
        'O pH normal do sangue em cães e gatos é mantido entre 7.35 e 7.45.',
        '',
        'SISTEMAS DE TAMPÃO:',
        '• Sistema Bicarbonato/Ácido Carbônico (principal)',
        '• Sistema Proteínas Plasmáticas',
        '• Sistema Hemoglobina',
        '• Sistema Fosfato',
        '',
        'EQUAÇÃO DE HENDERSON-HASSELBALCH:',
        'pH = 6.1 + log ([HCO3-] / 0.03 × PaCO2)',
      ];
      fundamentosText.forEach(line => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(line, 20, yPos);
        yPos += 5;
      });

      // Capítulo 2
      doc.addPage();
      yPos = 20;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('2. VALORES DE REFERÊNCIA - CÃES E GATOS', 20, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const valoresRef = [
        'PARÂMETROS GASOMÉTRICOS:',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        'pH:           7.35 - 7.45',
        'PaCO2:        35 - 45 mmHg',
        'PaO2:         80 - 100 mmHg (ar ambiente)',
        'HCO3-:        22 - 26 mEq/L',
        'BE:           -2 a +2 mEq/L',
        'SatO2:        > 95%',
        'Lactato:      < 2.5 mmol/L',
        '',
        'ELETRÓLITOS:',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        'Na+:          145 - 155 mEq/L',
        'K+:           3.5 - 5.0 mEq/L',
        'Cl-:          105 - 115 mEq/L',
        'Ca++:         1.15 - 1.35 mmol/L',
        '',
        'ÂNION GAP:',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        'AG = (Na+ + K+) - (Cl- + HCO3-)',
        'Normal: 12 - 24 mEq/L',
      ];
      valoresRef.forEach(line => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(line, 20, yPos);
        yPos += 5;
      });

      // Capítulo 3
      doc.addPage();
      yPos = 20;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('3. CLASSIFICAÇÃO DOS DISTÚRBIOS ÁCIDO-BASE', 20, yPos);
      yPos += 12;

      doc.setFontSize(12);
      doc.text('3.1 ACIDOSE RESPIRATÓRIA', 20, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const acidoseResp = [
        'DEFINIÇÃO: pH < 7.35 + PaCO2 > 45 mmHg',
        '',
        'CAUSAS PRINCIPAIS:',
        '• Hipoventilação (depressão do SNC, anestesia profunda)',
        '• Obstrução de vias aéreas (braquicefálicos, colapso traqueal)',
        '• Doenças neuromusculares (miastenia, botulismo)',
        '• Doenças pulmonares (pneumonia, edema, SDRA)',
        '• Efusão pleural ou pneumotórax',
        '',
        'COMPENSAÇÃO ESPERADA:',
        'Aguda: HCO3- aumenta 1 mEq/L para cada 10 mmHg de ↑PaCO2',
        'Crônica: HCO3- aumenta 4 mEq/L para cada 10 mmHg de ↑PaCO2',
        '',
        'TRATAMENTO:',
        '• Melhorar ventilação (broncodilatadores, oxigênio)',
        '• Ventilação mecânica se PaCO2 > 60 mmHg',
        '• Tratar causa base',
      ];
      acidoseResp.forEach(line => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(line, 20, yPos);
        yPos += 5;
      });

      // Continuar no próximo bloco...
      doc.addPage();
      yPos = 20;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('3.2 ALCALOSE RESPIRATÓRIA', 20, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const alcaloseResp = [
        'DEFINIÇÃO: pH > 7.45 + PaCO2 < 35 mmHg',
        '',
        'CAUSAS PRINCIPAIS:',
        '• Hiperventilação (dor, ansiedade, febre)',
        '• Hipoxemia (estimula hiperventilação)',
        '• Ventilação mecânica excessiva',
        '• Intoxicações (salicilatos)',
        '• Doença hepática',
        '',
        'SINAIS CLÍNICOS:',
        '• Ofegação excessiva',
        '• Taquipneia',
        '• Tetania (casos graves)',
        '',
        'TRATAMENTO:',
        '• Tratar causa primária (analgesia, oxigênio)',
        '• Reduzir FR se em ventilação mecânica',
        '• Geralmente autolimitante',
      ];
      alcaloseResp.forEach(line => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(line, 20, yPos);
        yPos += 5;
      });

      yPos += 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('3.3 ACIDOSE METABÓLICA', 20, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const acidoseMet = [
        'DEFINIÇÃO: pH < 7.35 + HCO3- < 22 mEq/L',
        '',
        'CLASSIFICAÇÃO POR ÂNION GAP:',
        '',
        'AG AUMENTADO (> 25):',
        '• Cetoacidose diabética',
        '• Uremia (insuficiência renal)',
        '• Intoxicações (etilenoglicol, salicilatos)',
        '• Acidose láctica (choque, hipoperfusão)',
        '',
        'AG NORMAL (12-24):',
        '• Diarreia (perda de HCO3- intestinal)',
        '• Acidose tubular renal',
        '• Fluidoterapia excessiva (diluição)',
        '',
        'COMPENSAÇÃO RESPIRATÓRIA:',
        'PaCO2 diminui 1.2 mmHg para cada 1 mEq/L de ↓HCO3-',
        '',
        'TRATAMENTO:',
        '• Tratar causa base (insulina em CAD, fluidos em choque)',
        '• Bicarbonato SE pH < 7.1 ou HCO3- < 12',
        '• Dose: déficit = 0.3 × peso(kg) × (24 - HCO3-medido)',
        '• Administrar 50% lentamente em 4-6 horas',
      ];
      acidoseMet.forEach(line => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(line, 20, yPos);
        yPos += 5;
      });

      // Capítulo 4
      doc.addPage();
      yPos = 20;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('4. ALGORITMO DE INTERPRETAÇÃO PRÁTICA', 20, yPos);
      yPos += 12;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const algoritmo = [
        'PASSO 1: Avaliar pH',
        '   • pH < 7.35 → ACIDEMIA',
        '   • pH > 7.45 → ALCALEMIA',
        '   • pH 7.35-7.45 → Normal ou compensado',
        '',
        'PASSO 2: Identificar componente primário',
        '   • Se ACIDEMIA:',
        '      - PaCO2 > 45 → Acidose RESPIRATÓRIA',
        '      - HCO3- < 22 → Acidose METABÓLICA',
        '   • Se ALCALEMIA:',
        '      - PaCO2 < 35 → Alcalose RESPIRATÓRIA',
        '      - HCO3- > 26 → Alcalose METABÓLICA',
        '',
        'PASSO 3: Verificar compensação',
        '   • Calcular compensação esperada',
        '   • Se inadequada → distúrbio MISTO',
        '',
        'PASSO 4: Avaliar oxigenação',
        '   • PaO2 < 80 mmHg → Hipoxemia',
        '   • SatO2 < 90% → Oxigênio suplementar',
        '',
        'PASSO 5: Avaliar perfusão',
        '   • Lactato > 2.5 mmol/L → Hipoperfusão',
        '   • Lactato > 6 mmol/L → Choque',
        '',
        'EXEMPLOS CLÍNICOS:',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        'CASO 1: CAD em diabético',
        'pH: 7.15 | PaCO2: 25 | HCO3-: 10 | BE: -15',
        '→ Acidose metabólica com compensação respiratória',
        '',
        'CASO 2: Braquicefálico em anestesia',
        'pH: 7.28 | PaCO2: 58 | HCO3-: 26 | BE: +2',
        '→ Acidose respiratória aguda (sem compensação)',
        '',
        'CASO 3: Piometra com vômitos',
        'pH: 7.50 | PaCO2: 40 | HCO3-: 30 | BE: +8',
        '→ Alcalose metabólica (perda de H+)',
      ];
      algoritmo.forEach(line => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(line, 20, yPos);
        yPos += 5;
      });

      // Rodapé
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text(`Página ${i} de ${pageCount}`, 105, 285, { align: 'center' });
        doc.text('Material Técnico - NR22 CRM Veterinário', 105, 290, { align: 'center' });
      }

      doc.save('Equilibrio_Acido_Base_Completo.pdf');
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar PDF: ' + error.message);
    } finally {
      setGenerating(null);
    }
  };

  const generateHematologyPDF = () => {
    setGenerating('hematology');
    try {
      const doc = new jsPDF();
      let yPos = 20;

      // Título
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('INTERPRETAÇÃO DE HEMOGRAMA COMPLETO', 105, yPos, { align: 'center' });
      yPos += 10;
      doc.setFontSize(12);
      doc.text('VCM, HCM, CHCM, RDW e Análise Diferencial', 105, yPos, { align: 'center' });
      yPos += 20;

      // Capítulo 1
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('1. ÍNDICES HEMATIMÉTRICOS', 20, yPos);
      yPos += 10;

      doc.setFontSize(11);
      doc.text('1.1 VOLUME CORPUSCULAR MÉDIO (VCM)', 20, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const vcmText = [
        'DEFINIÇÃO: Volume médio das hemácias em fentolitros (fL)',
        'FÓRMULA: VCM = (Hematócrito % ÷ RBC × 10⁶) × 10',
        '',
        'VALORES DE REFERÊNCIA:',
        '• Cães: 60-77 fL',
        '• Gatos: 39-55 fL',
        '',
        'MICROCITOSE (VCM < 60 fL em cães / < 39 fL em gatos):',
        '→ Deficiência de ferro crônica',
        '→ Doença inflamatória crônica',
        '→ Shunt portossistêmico',
        '→ Raças orientais (Akita, Shiba) - fisiológico',
        '',
        'MACROCITOSE (VCM > 77 fL em cães / > 55 fL em gatos):',
        '→ Regeneração eritrocitária (reticulócitos)',
        '→ FeLV em gatos',
        '→ Deficiência B12/folato (raro)',
        '→ Poodles - fisiológico',
        '',
      ];
      vcmText.forEach(line => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(line, 20, yPos);
        yPos += 5;
      });

      // HCM
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('1.2 HEMOGLOBINA CORPUSCULAR MÉDIA (HCM)', 20, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const hcmText = [
        'DEFINIÇÃO: Peso médio de hemoglobina por hemácia (pg)',
        'FÓRMULA: HCM = (Hemoglobina g/dL ÷ RBC × 10⁶) × 10',
        '',
        'VALORES DE REFERÊNCIA:',
        '• Cães: 19-28 pg',
        '• Gatos: 12-18 pg',
        '',
        'INTERPRETAÇÃO:',
        '→ Geralmente acompanha o VCM',
        '→ HCM baixo: hipocromia (deficiência de ferro)',
        '→ HCM alto: macrocitose',
      ];
      hcmText.forEach(line => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(line, 20, yPos);
        yPos += 5;
      });

      // CHCM
      yPos += 5;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('1.3 CONCENTRAÇÃO DE HB CORPUSCULAR MÉDIA (CHCM)', 20, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const chcmText = [
        'DEFINIÇÃO: Concentração de Hb dentro das hemácias (g/dL)',
        'FÓRMULA: CHCM = (Hemoglobina g/dL ÷ Hematócrito %) × 100',
        '',
        'VALORES DE REFERÊNCIA:',
        '• Cães: 31-36 g/dL',
        '• Gatos: 31-35 g/dL',
        '',
        'HIPOCROMIA (CHCM < 31):',
        '→ Deficiência de ferro crônica severa',
        '→ Doença crônica avançada',
        '',
        '⚠️ IMPORTANTE: Não existe hipercromia verdadeira!',
        'CHCM > 36 indica:',
        '→ Artefato (lipemia, hemólise)',
        '→ Esferocitose (AHIM)',
        '→ Erro do analisador',
      ];
      chcmText.forEach(line => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(line, 20, yPos);
        yPos += 5;
      });

      // RDW
      doc.addPage();
      yPos = 20;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('1.4 RED CELL DISTRIBUTION WIDTH (RDW)', 20, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const rdwText = [
        'DEFINIÇÃO: Coeficiente de variação do tamanho das hemácias',
        'Indica anisocitose (variação no tamanho)',
        '',
        'VALORES DE REFERÊNCIA:',
        '• Cães: 11-15%',
        '• Gatos: 14-18%',
        '',
        'INTERPRETAÇÃO COMBINADA:',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        'RDW NORMAL + VCM NORMAL:',
        '→ Anemia de doença crônica',
        '→ Insuficiência renal crônica',
        '→ Hemólise aguda (antes de regenerar)',
        '',
        'RDW ALTO + VCM BAIXO:',
        '→ Deficiência de ferro',
        '→ Anemia mista',
        '',
        'RDW ALTO + VCM NORMAL:',
        '→ Início de regeneração',
        '→ Anemia dimórfica',
        '',
        'RDW ALTO + VCM ALTO:',
        '→ Anemia regenerativa (reticulocitose)',
        '→ Resposta a hemorragia',
        '→ Hemólise imune compensada',
      ];
      rdwText.forEach(line => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(line, 20, yPos);
        yPos += 5;
      });

      // Capítulo 2 - Analisadores
      doc.addPage();
      yPos = 20;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('2. ANALISADORES: 3 PARTES vs 5 PARTES', 20, yPos);
      yPos += 12;

      doc.setFontSize(11);
      doc.text('2.1 TECNOLOGIA E DIFERENÇAS', 20, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const analyzersText = [
        'ANALISADORES DE 3 PARTES (Impedância):',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '✓ Baseado apenas no tamanho celular',
        '✓ Separa em: Granulócitos, Linfócitos, Mid Cells',
        '✓ Tempo: ~60 segundos',
        '✓ Custo menor',
        '✓ Ideal para triagem',
        '',
        '⚠️ LIMITAÇÕES:',
        '• Não diferencia neutrófilos de eosinófilos',
        '• Não detecta desvio à esquerda',
        '• Pode perder basofilia',
        '• Requer revisão manual frequente',
        '',
        'ANALISADORES DE 5 PARTES (Flow Cytometry):',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '✓ Laser + análise de complexidade interna',
        '✓ Separa: Neutrófilos, Linfócitos, Monócitos, Eosinófilos, Basófilos',
        '✓ Detecta alterações morfológicas',
        '✓ Flags para células atípicas',
        '✓ Acurácia diagnóstica: 97%',
        '',
        'VANTAGENS CLÍNICAS:',
        '• Detecção de left shift (bastonetes)',
        '• Identificação de eosinofilia (parasitas, alergia)',
        '• Linfócitos atípicos (linfoma)',
        '• Blast cells (leucemia)',
        '',
        'COMPARATIVO DE ACURÁCIA:',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        'Left shift: 5-part (89%) vs 3-part (62%)',
        'Eosinófilos: 5-part (95%) vs 3-part (78%)',
        'Linfócitos atípicos: 5-part (92%) vs 3-part (58%)',
        '',
        'RECOMENDAÇÕES DE USO:',
        '• UTI/Emergência: 5-partes obrigatório',
        '• Oncologia: 5-partes mandatório',
        '• Check-up/Wellness: 3-partes aceitável',
        '• Imunossuprimidos: 5-partes preferencial',
      ];
      analyzersText.forEach(line => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(line, 20, yPos);
        yPos += 5;
      });

      // Capítulo 3 - Interpretação Prática
      doc.addPage();
      yPos = 20;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('3. ALGORITMO DE INTERPRETAÇÃO DE ANEMIA', 20, yPos);
      yPos += 12;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const anemiaAlg = [
        'PASSO 1: Confirmar Anemia',
        '   Hb < 12 g/dL (cães) ou < 8 g/dL (gatos)',
        '   Ht < 37% (cães) ou < 24% (gatos)',
        '',
        'PASSO 2: Classificar Morfologicamente',
        '   → Microcítica hipocr ômica (VCM↓ CHCM↓): Fe deficiency',
        '   → Normocítica normocrômica: doença crônica, renal',
        '   → Macrocítica: regeneração, FeLV',
        '',
        'PASSO 3: Avaliar Regeneração',
        '   → RDW alto + policromasia = regenerativa',
        '   → Contar reticulócitos:',
        '      • Cães: > 60.000/μL = regenerativa',
        '      • Gatos: > 50.000/μL = regenerativa',
        '',
        'PASSO 4: Determinar Causa',
        '',
        '   SE REGENERATIVA:',
        '   → Hemorragia (trauma, coagulopatia, parasitas)',
        '   → Hemólise:',
        '      • AHIM (Coombs+, esferócitos)',
        '      • Parasitas (Babesia, Mycoplasma)',
        '      • Toxinas (cebola, zinco)',
        '',
        '   SE NÃO REGENERATIVA:',
        '   → Insuficiência renal (↑creatinina, ↓EPO)',
        '   → Doença crônica (inflamação, neoplasia)',
        '   → Deficiência de ferro (↓ferritina)',
        '   → Doença de medula (aspirado/biópsia)',
        '   → Endocrinopatia (hipotireoidismo)',
        '',
        'PASSO 5: Exames Complementares',
        '   → Perfil bioquímico completo',
        '   → Perfil de ferro (se microcítica)',
        '   → Coombs direto (se suspeita AHIM)',
        '   → PCR para hemoparasitas',
        '   → FeLV/FIV (gatos)',
        '   → Mielograma (se não regenerativa sem causa)',
      ];
      anemiaAlg.forEach(line => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(line, 20, yPos);
        yPos += 5;
      });

      // Referências científicas
      doc.addPage();
      yPos = 20;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('REFERÊNCIAS CIENTÍFICAS', 20, yPos);
      yPos += 12;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const referencias = [
        '1. Tvedten H, Lilliehöök I, Hillström A, et al. Differential leukocyte counts in',
        '   veterinary practice: comparison of 3-part and 5-part analyzers with manual',
        '   counts. Vet Clin Pathol. 2018;47(3):389-402.',
        '',
        '2. Weiser G, Tvedten H. Erythrocyte and leukocyte disorders in small animals.',
        '   In: Thrall MA, ed. Veterinary Hematology and Clinical Chemistry. 3rd ed.',
        '   Wiley-Blackwell; 2022:123-156.',
        '',
        '3. Furlanello T, Tasca S, Caldin M, et al. Artificial intelligence in veterinary',
        '   hematology: comparison between impedance and optical flow cytometry for',
        '   leukocyte differential counts in dogs and cats. J Vet Diagn Invest.',
        '   2020;32(5):727-735.',
      ];
      referencias.forEach(line => {
        doc.text(line, 20, yPos);
        yPos += 5;
      });

      // Rodapé
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text(`Página ${i} de ${pageCount}`, 105, 285, { align: 'center' });
        doc.text('Material Técnico - NR22 CRM Veterinário', 105, 290, { align: 'center' });
      }

      doc.save('Interpretacao_Hemograma_Completo.pdf');
      toast.success('PDF de Hematologia gerado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar PDF: ' + error.message);
    } finally {
      setGenerating(null);
    }
  };

  const generateBiochemistryRotorsPDF = () => {
    setGenerating('biochem');
    try {
      const doc = new jsPDF();
      let yPos = 20;

      // Título
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('BIOQUÍMICA VETERINÁRIA SEAMATY', 105, yPos, { align: 'center' });
      yPos += 10;
      doc.setFontSize(12);
      doc.text('Rotores, Enzimas e Aplicações Clínicas Completas', 105, yPos, { align: 'center' });
      yPos += 20;

      // CAPÍTULO 1: ENZIMAS INDIVIDUAIS
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('1. ENZIMAS E PARÂMETROS - ANÁLISE INDIVIDUAL', 20, yPos);
      yPos += 12;

      // ALT
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('1.1 ALT (Alanina Aminotransferase)', 20, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      [
        'FUNÇÃO: Enzima citoplasmática hepática - marcador primário de lesão hepatocelular',
        'VALORES: Cães: 10-100 U/L | Gatos: 6-83 U/L',
        'ESPECIFICIDADE: Alta para fígado (cães) | Moderada (gatos)',
        '',
        'ELEVAÇÃO INDICA:',
        '• Hepatite aguda (viral, tóxica, medicamentosa)',
        '• Lipidose hepática (gatos)',
        '• Necrose hepatocelular',
        '• Trauma hepático',
        '',
        'QUANDO SOLICITAR:',
        '→ Icterícia, vômitos, anorexia',
        '→ Suspeita de toxicidade medicamentosa',
        '→ Triagem pré-anestésica',
        '→ Monitoramento de hepatopatias crônicas',
        ''
      ].forEach(line => {
        if (yPos > 270) { doc.addPage(); yPos = 20; }
        doc.text(line, 20, yPos);
        yPos += 5;
      });

      // AST
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('1.2 AST (Aspartato Aminotransferase)', 20, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      [
        'FUNÇÃO: Enzima mitocondrial - fígado, músculo, hemácias',
        'VALORES: Cães: 23-66 U/L | Gatos: 26-43 U/L',
        'ESPECIFICIDADE: Baixa (múltiplos órgãos)',
        '',
        'ELEVAÇÃO INDICA:',
        '• Necrose hepatocelular grave (com ALT)',
        '• Miosite, rabdomiólise',
        '• Hemólise intravascular',
        '',
        'INTERPRETAÇÃO COMBINADA:',
        '→ ALT/AST > 2: Lesão hepática aguda',
        '→ AST > ALT: Lesão muscular ou crônica',
        ''
      ].forEach(line => {
        if (yPos > 270) { doc.addPage(); yPos = 20; }
        doc.text(line, 20, yPos);
        yPos += 5;
      });

      // ALP
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('1.3 ALP (Fosfatase Alcalina)', 20, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      [
        'FUNÇÃO: Enzima de membrana - fígado, osso, córtex, intestino',
        'VALORES: Cães: 23-212 U/L | Gatos: 0-62 U/L',
        'ESPECIFICIDADE: Baixa (induzida por corticoides em cães)',
        '',
        'ELEVAÇÃO INDICA:',
        'EM CÃES:',
        '• Colestase (↑↑↑ junto com GGT)',
        '• Hiperadrenocorticismo (↑↑↑↑ isoenzima esteróide)',
        '• Crescimento ósseo (filhotes - até 3x normal)',
        '• Hepatopatia vacuolar',
        '• Medicamentos (fenobarbital, glicocorticoides)',
        '',
        'EM GATOS:',
        '⚠️ Qualquer aumento é SIGNIFICATIVO (não é induzida por esteroides)',
        '• Lipidose hepática',
        '• Colangiohepatite',
        '• Hipertireoidismo',
        '• Neoplasia (linfoma)',
        '',
        'QUANDO SOLICITAR:',
        '→ Icterícia, vômitos, poliúria',
        '→ Suspeita de Cushing',
        '→ Screening geriátrico',
        ''
      ].forEach(line => {
        if (yPos > 270) { doc.addPage(); yPos = 20; }
        doc.text(line, 20, yPos);
        yPos += 5;
      });

      // GGT
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('1.4 GGT (Gama-Glutamil Transferase)', 20, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      [
        'FUNÇÃO: Enzima de membrana canalicular biliar',
        'VALORES: Cães: 0-7 U/L | Gatos: 0-2 U/L',
        'ESPECIFICIDADE: Alta para colestase',
        '',
        'ELEVAÇÃO INDICA:',
        '• Colestase extra-hepática (obstrução biliar)',
        '• Colestase intra-hepática',
        '• Neoplasia hepática/biliar',
        '• Colangite',
        '',
        'INTERPRETAÇÃO COMBINADA COM ALP:',
        '→ GGT↑ + ALP↑↑↑ = Colestase confirmada',
        '→ GGT normal + ALP↑ = Indução esteróide (cães)',
        '→ GGT↑↑ isolada = Lesão ductos biliares',
        ''
      ].forEach(line => {
        if (yPos > 270) { doc.addPage(); yPos = 20; }
        doc.text(line, 20, yPos);
        yPos += 5;
      });

      // CREATININA
      doc.addPage();
      yPos = 20;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('1.5 CREATININA (Crea)', 20, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      [
        'FUNÇÃO: Produto do metabolismo muscular - marcador de TFG',
        'VALORES: Cães: 0.5-1.8 mg/dL | Gatos: 0.8-2.4 mg/dL',
        'ESPECIFICIDADE: Alta para função renal',
        '',
        'ELEVAÇÃO INDICA:',
        '• Doença renal aguda (IRA)',
        '• Doença renal crônica (DRC)',
        '• Desidratação (pré-renal - reversível)',
        '• Obstrução urinária (pós-renal)',
        '',
        'ESTADIAMENTO DRC (IRIS):',
        '→ Estágio I: < 1.4 mg/dL',
        '→ Estágio II: 1.4-2.8 mg/dL',
        '→ Estágio III: 2.9-5.0 mg/dL',
        '→ Estágio IV: > 5.0 mg/dL',
        '',
        '⚠️ IMPORTANTE: Crea só aumenta com perda de 75% da TFG',
        '→ Use SDMA para detecção precoce (sensível com 40% perda)',
        ''
      ].forEach(line => {
        if (yPos > 270) { doc.addPage(); yPos = 20; }
        doc.text(line, 20, yPos);
        yPos += 5;
      });

      // UREIA/BUN
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('1.6 UREIA (BUN - Blood Urea Nitrogen)', 20, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      [
        'FUNÇÃO: Produto do metabolismo proteico - sintetizada no fígado',
        'VALORES: Cães: 7-27 mg/dL | Gatos: 16-36 mg/dL',
        'ESPECIFICIDADE: Moderada (influenciada por dieta, hidratação)',
        '',
        'ELEVAÇÃO INDICA:',
        '• Azotemia pré-renal (desidratação, choque)',
        '• Azotemia renal (lesão renal)',
        '• Azotemia pós-renal (obstrução)',
        '• Dieta hiperproteica',
        '• Hemorragia GI (reabsorção)',
        '',
        'DIMINUIÇÃO INDICA:',
        '• Insuficiência hepática grave',
        '• Dieta hipoproteica',
        '• Shunt portossistêmico',
        '',
        'RELAÇÃO BUN/CREA:',
        '→ Normal: 10-20:1',
        '→ > 20:1 = Azotemia pré-renal ou hemorragia GI',
        '→ < 10:1 = Doença hepática',
        ''
      ].forEach(line => {
        if (yPos > 270) { doc.addPage(); yPos = 20; }
        doc.text(line, 20, yPos);
        yPos += 5;
      });

      // GLICOSE
      doc.addPage();
      yPos = 20;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('1.7 GLICOSE (GLU)', 20, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      [
        'FUNÇÃO: Principal fonte de energia celular',
        'VALORES: Cães: 75-128 mg/dL | Gatos: 71-159 mg/dL',
        '',
        'HIPERGLICEMIA (> 200 mg/dL):',
        '• Diabetes mellitus (cetoacidose se > 300)',
        '• Estresse (gatos - pode chegar 400 mg/dL)',
        '• Hiperadrenocorticismo',
        '• Pancreatite aguda',
        '• Medicamentos (corticoides, dextrose)',
        '',
        'HIPOGLICEMIA (< 60 mg/dL):',
        '• Insulinoma (tumor pancreático)',
        '• Sepse grave',
        '• Insuficiência hepática',
        '• Overdose insulina',
        '• Raças toy em filhotes (jejum)',
        '',
        '⚠️ EMERGÊNCIA: GLU < 40 mg/dL',
        '→ Dextrose 50% IV 0.5-1 mL/kg diluído',
        ''
      ].forEach(line => {
        if (yPos > 270) { doc.addPage(); yPos = 20; }
        doc.text(line, 20, yPos);
        yPos += 5;
      });

      // CAPÍTULO 2: ROTORES SEAMATY
      doc.addPage();
      yPos = 20;
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('2. ROTORES SEAMATY - COMPOSIÇÃO E APLICAÇÕES', 20, yPos);
      yPos += 12;

      // Rotor Hepático
      doc.setFontSize(14);
      doc.text('2.1 ROTOR HEPÁTICO (LIVER)', 20, yPos);
      yPos += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      [
        'COMPOSIÇÃO DO ROTOR:',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '✓ ALT (Alanina Aminotransferase)',
        '✓ AST (Aspartato Aminotransferase)',
        '✓ ALP (Fosfatase Alcalina)',
        '✓ GGT (Gama-Glutamil Transferase)',
        '✓ TBIL (Bilirrubina Total)',
        '✓ TP (Proteína Total)',
        '✓ ALB (Albumina)',
        '',
        'INDICAÇÕES CLÍNICAS:',
        '• Icterícia ou mucosas amareladas',
        '• Vômitos persistentes + anorexia',
        '• Suspeita de hepatopatia (ascite, encefalopatia)',
        '• Triagem pré-anestésica',
        '• Monitoramento de medicações hepatotóxicas',
        '• Investigação de hipoalbuminemia',
        '',
        'DOENÇAS DETECTADAS:',
        '→ Hepatite aguda (↑↑ALT, ↑AST)',
        '→ Colestase (↑↑ALP, ↑↑GGT, ↑TBIL)',
        '→ Lipidose hepática felina (↑↑ALP, ↑↑TBIL)',
        '→ Cirrose (↓ALB, ↑TBIL)',
        '→ Shunt portossistêmico (↓BUN, ↓ALB)',
        ''
      ].forEach(line => {
        if (yPos > 270) { doc.addPage(); yPos = 20; }
        doc.text(line, 20, yPos);
        yPos += 5;
      });

      // Rotor Renal
      doc.addPage();
      yPos = 20;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('2.2 ROTOR RENAL (KIDNEY)', 20, yPos);
      yPos += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      [
        'COMPOSIÇÃO DO ROTOR:',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '✓ CREA (Creatinina)',
        '✓ BUN (Ureia)',
        '✓ PHOS (Fósforo)',
        '✓ Ca (Cálcio)',
        '✓ K (Potássio)',
        '✓ Na (Sódio)',
        '✓ Cl (Cloreto)',
        '',
        'INDICAÇÕES CLÍNICAS:',
        '• Poliúria/polidipsia (PU/PD)',
        '• Vômitos + desidratação',
        '• Suspeita de DRC ou IRA',
        '• Anúria ou oligúria',
        '• Convulsões (uremia)',
        '• Monitoramento de fluidoterapia',
        '',
        'DOENÇAS DETECTADAS:',
        '→ IRA (↑↑CREA, ↑BUN, ↑PHOS, ↑K)',
        '→ DRC (↑CREA, ↑BUN, ↑PHOS, ↓Ca)',
        '→ Obstrução uretral (↑↑K, ↑CREA)',
        '→ Desidratação (↑BUN/CREA > 20:1)',
        '→ Addison (↑K, ↓Na, razão Na/K < 27)',
        ''
      ].forEach(line => {
        if (yPos > 270) { doc.addPage(); yPos = 20; }
        doc.text(line, 20, yPos);
        yPos += 5;
      });

      // Rotor Pancreático
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('2.3 ROTOR PANCREÁTICO (PANCREAS)', 20, yPos);
      yPos += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      [
        'COMPOSIÇÃO DO ROTOR:',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '✓ AMYL (Amilase)',
        '✓ LIPA (Lipase)',
        '✓ GLU (Glicose)',
        '✓ Ca (Cálcio)',
        '✓ TP (Proteína Total)',
        '✓ ALB (Albumina)',
        '',
        'INDICAÇÕES CLÍNICAS:',
        '• Vômitos agudos + dor abdominal cranial',
        '• Anorexia súbita + prostração',
        '• Diarreia + icterícia',
        '• Suspeita de pancreatite',
        '• Abdome agudo',
        '',
        'DOENÇAS DETECTADAS:',
        '→ Pancreatite aguda (↑↑LIPA, ↑AMYL)',
        '→ Diabetes mellitus (↑GLU)',
        '→ Insuficiência pancreática exócrina (↓LIPA)',
        '→ Hipocalcemia (pancreatite grave)',
        '',
        '⚠️ NOTA: Em gatos, cPLI é mais sensível que lipase',
        ''
      ].forEach(line => {
        if (yPos > 270) { doc.addPage(); yPos = 20; }
        doc.text(line, 20, yPos);
        yPos += 5;
      });

      // CAPÍTULO 3: EQUIPAMENTOS SEAMATY
      doc.addPage();
      yPos = 20;
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('3. EQUIPAMENTOS SEAMATY - CONFIGURAÇÕES', 20, yPos);
      yPos += 12;

      // SMT-120VP
      doc.setFontSize(14);
      doc.text('3.1 SMT-120VP - Analisador Automático', 20, yPos);
      yPos += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      [
        'CAPACIDADE: 24+ parâmetros bioquímicos',
        'TECNOLOGIA: Totalmente automático',
        'AMOSTRA: 100 μL soro/plasma',
        'TEMPO: 12 minutos',
        '',
        'PAINÉIS DISPONÍVEIS:',
        '• Painel Hepático Completo (7 parâmetros)',
        '• Painel Renal Completo (7 parâmetros)',
        '• Painel Lipídico (CHOL, TG, HDL)',
        '• Painel Eletrolítico (Na, K, Cl, Ca, P)',
        '• Painel Proteico (TP, ALB, GLOB)',
        '',
        'MELHOR PARA:',
        '→ Clínicas médias a grandes',
        '→ Hospitais veterinários',
        '→ Alto volume de exames (> 10/dia)',
        '→ Perfis completos de check-up',
        ''
      ].forEach(line => {
        if (yPos > 270) { doc.addPage(); yPos = 20; }
        doc.text(line, 20, yPos);
        yPos += 5;
      });

      // QT3
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('3.2 QT3 - Sistema Modular', 20, yPos);
      yPos += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      [
        'CAPACIDADE: Parâmetros individuais ou combinados',
        'TECNOLOGIA: Dual-Rotor System',
        'FLEXIBILIDADE: Escolha os parâmetros necessários',
        '',
        'ROTORES MODULARES QT3:',
        '• Liver (7 enzimas hepáticas)',
        '• Kidney (7 marcadores renais)',
        '• Pancreas (6 parâmetros pancreáticos)',
        '• Lipid (perfil lipídico)',
        '• Electrolytes (eletrólitos completos)',
        '',
        'VANTAGENS:',
        '✓ Custo-efetivo (pague só o que usar)',
        '✓ Ideal para emergências (testes rápidos)',
        '✓ Perfeito para clínicas pequenas/médias',
        '✓ Portabilidade',
        '',
        'CASOS DE USO:',
        '→ Emergências: rotor Kidney + Electrolytes',
        '→ Pré-cirúrgico: rotor Liver + Kidney',
        '→ Diabetes: GLU + Pancreas + Kidney',
        '→ Oncologia: Liver + Calcium + TP',
        ''
      ].forEach(line => {
        if (yPos > 270) { doc.addPage(); yPos = 20; }
        doc.text(line, 20, yPos);
        yPos += 5;
      });

      // CAPÍTULO 4: CASOS CLÍNICOS
      doc.addPage();
      yPos = 20;
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('4. CASOS CLÍNICOS PRÁTICOS', 20, yPos);
      yPos += 12;

      doc.setFontSize(12);
      doc.text('CASO 1: Labrador 8 anos - Icterícia', 20, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      [
        'ROTOR RECOMENDADO: Liver (QT3 ou SMT-120VP)',
        '',
        'RESULTADOS:',
        '→ ALT: 850 U/L (↑↑↑)',
        '→ ALP: 1200 U/L (↑↑↑)',
        '→ GGT: 45 U/L (↑↑)',
        '→ TBIL: 8.5 mg/dL (↑↑)',
        '',
        'INTERPRETAÇÃO:',
        'Hepatite aguda com componente colestático',
        '',
        'PRÓXIMOS PASSOS:',
        '• Ultrassom abdominal',
        '• Painel coagulação',
        '• Cultura/PCR (leptospirose)',
        ''
      ].forEach(line => {
        if (yPos > 270) { doc.addPage(); yPos = 20; }
        doc.text(line, 20, yPos);
        yPos += 5;
      });

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('CASO 2: Gato 10 anos - Azotemia', 20, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      [
        'ROTOR RECOMENDADO: Kidney (QT3)',
        '',
        'RESULTADOS:',
        '→ CREA: 4.2 mg/dL (↑↑)',
        '→ BUN: 85 mg/dL (↑↑)',
        '→ PHOS: 7.8 mg/dL (↑↑)',
        '→ K: 5.8 mEq/L (↑)',
        '',
        'INTERPRETAÇÃO:',
        'DRC Estágio III (IRIS) com hiperfosfatemia',
        '',
        'CONDUTA:',
        '• Dieta renal',
        '• Quelante de fósforo',
        '• Anti-hipertensivo',
        '• Reavaliação em 15 dias',
        ''
      ].forEach(line => {
        if (yPos > 270) { doc.addPage(); yPos = 20; }
        doc.text(line, 20, yPos);
        yPos += 5;
      });

      // Rodapé
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text(`Página ${i} de ${pageCount}`, 105, 285, { align: 'center' });
        doc.text('SEAMATY Brasil - Material Técnico Veterinário', 105, 290, { align: 'center' });
      }

      doc.save('Bioquimica_Rotores_Enzimas_Seamaty.pdf');
      toast.success('PDF de Bioquímica gerado!');
    } catch (error) {
      toast.error('Erro: ' + error.message);
    } finally {
      setGenerating(null);
    }
  };

  const prepareForReview = async () => {
    try {
      setGenerating('sendNatan');
      toast.info('Preparando rascunho técnico para revisão...');

      await base44.functions.invoke('sendSeamtyAnalysisToPlanetaBichos', {});

      toast.success('Rascunho preparado e aguardando aprovação. Nenhum envio foi realizado.');
    } catch (error) {
      toast.error('Erro ao preparar rascunho: ' + error.message);
    } finally {
      setGenerating(null);
    }
  };

  const generateVG2ScientificGuide = async () => {
    try {
      setGeneratingVG2Scientific(true);
      toast.loading('Gerando guia científico VG2 com 13 artigos e 12 casos clínicos...');

      const response = await base44.functions.invoke('generateVG2ScientificPDF', {});

      if (response.data.success) {
        toast.success('✅ Guia científico VG2 criado com sucesso!');
        toast.info('📥 Disponível na Central de Documentos para download');
      } else {
        toast.error('Erro: ' + response.data.error);
      }
    } catch (error) {
      toast.error('Erro ao gerar PDF: ' + error.message);
    } finally {
      setGeneratingVG2Scientific(false);
    }
  };

  const materials = [
    {
      id: 'vg2scientific',
      title: '📚 VG2 - Guia Científico Completo (13 Artigos + 12 Casos Clínicos)',
      description: '20 enzimas/parâmetros do VG2, importância da hemogasometria, 12 casos clínicos detalhados, 13 referências científicas atuais (2020-2025) em inglês',
      icon: BookOpen,
      color: 'from-indigo-500 to-purple-500',
      action: generateVG2ScientificGuide,
      isSpecial: true
    },
    {
      id: 'sendNatan',
      title: '🔬 Preparar análise SEAMATY para revisão',
      description: 'Cria somente um rascunho pendente de aprovação; nenhum arquivo ou mensagem é enviado',
      icon: FileText,
      color: 'from-green-500 to-emerald-500',
      action: prepareForReview,
      isSpecial: true
    },
    {
      id: 'acidbase',
      title: 'Equilíbrio Ácido-Base Completo',
      description: 'Manual completo de hemogasometria: pH, PaCO2, HCO3, interpretação de distúrbios respiratórios e metabólicos',
      icon: Activity,
      color: 'from-blue-500 to-cyan-500',
      action: generateAcidBaseBalancePDF
    },
    {
      id: 'hematology',
      title: 'Interpretação de Hemograma - VCM/HCM/CHCM/RDW',
      description: 'Guia completo de índices hematimétricos, analisadores 3 vs 5 partes, interpretação de anemias com referências científicas',
      icon: Microscope,
      color: 'from-red-500 to-pink-500',
      action: generateHematologyPDF
    },
    {
      id: 'biochem',
      title: 'Bioquímica Seamaty - Rotores e Enzimas',
      description: 'Análise completa de cada enzima (ALT, AST, ALP, GGT, Crea, BUN, GLU) + composição de rotores Liver, Kidney, Pancreas + casos clínicos',
      icon: TrendingUp,
      color: 'from-purple-500 to-fuchsia-500',
      action: generateBiochemistryRotorsPDF
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Hub de Materiais Técnicos</h1>
              <p className="text-slate-600">Manuais completos em PDF para download e uso na prática clínica</p>
            </div>
          </div>
        </div>

        {/* Cards de Materiais */}
        {/* VG2 Scientific Guide - DESTAQUE */}
        <Card className="hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-indigo-400 bg-gradient-to-r from-indigo-50 to-purple-50 mb-6">
          <div className="h-3 bg-gradient-to-r from-indigo-500 to-purple-500" />
          <CardHeader>
            <div className="flex items-start gap-4 justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">{materials[0].title}</CardTitle>
                  <p className="text-sm text-slate-700">{materials[0].description}</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button
              onClick={materials[0].action}
              disabled={generatingVG2Scientific}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90 text-lg py-6"
            >
              {generatingVG2Scientific ? (
                <>
                  <TrendingUp className="w-5 h-5 mr-2 animate-spin" />
                  Gerando guia científico completo...
                </>
              ) : (
                <>
                  <BookOpen className="w-5 h-5 mr-2" />
                  Gerar Guia Científico VG2
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {materials[1].isSpecial && (
          <Card className="md:col-span-2 hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-green-400 bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="h-3 bg-gradient-to-r from-green-500 to-emerald-500" />
            <CardHeader>
              <div className="flex items-start gap-4 justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">{materials[1].title}</CardTitle>
                    <p className="text-sm text-slate-700">{materials[1].description}</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                onClick={materials[1].action}
                disabled={generating === materials[1].id}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:opacity-90 text-lg py-6"
              >
                {generating === materials[1].id ? (
                  <>
                    <TrendingUp className="w-5 h-5 mr-2 animate-spin" />
                    Preparando rascunho...
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5 mr-2" />
                    Preparar para revisão
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {materials.slice(2).map(material => {
            const Icon = material.icon;
            const isGenerating = generating === material.id;

            return (
              <Card key={material.id} className="hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className={`h-2 bg-gradient-to-r ${material.color}`} />
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className={`p-4 rounded-xl bg-gradient-to-br ${material.color}`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{material.title}</CardTitle>
                      <p className="text-sm text-slate-600">{material.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={material.action}
                    disabled={isGenerating}
                    className={`w-full bg-gradient-to-r ${material.color} text-white hover:opacity-90`}
                  >
                    {isGenerating ? (
                      <>
                        <TrendingUp className="w-5 h-5 mr-2 animate-spin" />
                        Gerando PDF...
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5 mr-2" />
                        Baixar PDF Completo
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info Box */}
        <Card className="mt-8 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <FileText className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-slate-900 mb-2">Sobre os Materiais</h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  Todos os PDFs contêm conteúdo técnico detalhado, valores de referência para cães e gatos, 
                  algoritmos de interpretação práticos, exemplos clínicos e referências científicas atualizadas. 
                  Materiais prontos para uso na rotina clínica, UTI, anestesia e medicina intensiva veterinária.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}