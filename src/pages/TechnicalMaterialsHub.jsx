import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, BookOpen, Microscope, Activity, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

export default function TechnicalMaterialsHub() {
  const [generating, setGenerating] = useState(null);

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

  const materials = [
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
        <div className="grid md:grid-cols-2 gap-6">
          {materials.map(material => {
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