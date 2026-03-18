import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Gerar análise completa dos rotores Seamaty
    const rotors = [
      {
        name: '16 Health Check Parameters',
        code: 'AYD3382',
        parameters: ['ALB', 'ALT', 'AMY', 'AST', 'GLU', 'CK', 'Ca', 'CREA', 'BUN', 'TB', 'TG', 'TP', 'PHOS', 'A/G', 'B/C', 'GLOB']
      },
      {
        name: '13 Electrolyte Plus Parameters',
        code: 'AY0316',
        parameters: ['BUN', 'Ca', 'Ph', 'Cl', 'K', 'Na', 'Mg', 'tCO2', 'PHOS', 'GLU', 'CREA', 'B/C']
      },
      {
        name: '11 Liver Function Parameters',
        code: 'AY0316',
        parameters: ['ALB', 'ALT', 'AST', 'ALP/FA', 'GGT', 'TBA', 'TB', 'TC', 'TP', 'A/G', 'GLOB']
      },
      {
        name: '10 Pre-Operation Test Parameters',
        code: 'AY03182',
        parameters: ['ALP/FA', 'ALT', 'AST', 'CK', 'CREA', 'GLU', 'LDH', 'TP', 'BUN', 'B/C']
      },
      {
        name: '9 Kidney Function Parameters',
        code: 'AY0314',
        parameters: ['c-Cys C', 'ALB', 'CREA', 'Ca', 'GLU', 'PHOS', 'UA', 'BUN', 'Tce2', 'B/C']
      },
      {
        name: '12 Feline Inflammation',
        code: 'AY03182',
        parameters: ['F-SAA', 'BUN', 'CREA', 'ALB', 'LPS', 'TBA', 'ALP/FA', 'GGT', 'TP', 'A/G', 'B/C', 'GLOB']
      }
    ];

    // Gerar análise com IA
    let fullAnalysis = [];
    
    for (const rotor of rotors) {
      const prompt = `Análise científica para medicina veterinária - Rotor ${rotor.name}:
      
Parâmetros: ${rotor.parameters.join(', ')}

Forneça:
1. Resumo técnico do rotor
2. Função fisiológica de cada parâmetro
3. 5 casos clínicos reais com achados
4. Interpretação clínica
5. Recomendações de uso`;

      try {
        const analysis = await base44.integrations.Core.InvokeLLM({
          prompt: prompt,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              summary: { type: "string" },
              functions: { type: "string" },
              clinical_cases: { type: "string" },
              interpretation: { type: "string" },
              recommendations: { type: "string" }
            }
          }
        });

        fullAnalysis.push({
          rotor_name: rotor.name,
          code: rotor.code,
          analysis: analysis
        });
      } catch (e) {
        console.error(`Erro na análise de ${rotor.name}:`, e);
      }
    }

    // Gerar referências científicas
    const references = await base44.integrations.Core.InvokeLLM({
      prompt: `Liste 20 referências científicas recentes (2022-2026) sobre análise bioquímica veterinária, enzimas séricas e casos clínicos em medicina veterinária. Formato: Autor et al. (Ano). Título. Revista.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          references: { type: "array", items: { type: "string" } }
        }
      }
    });

    // Criar PDF
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    let yPosition = 15;

    // Capa
    doc.setFontSize(24);
    doc.setTextColor(25, 51, 102);
    doc.text('ANÁLISE CIENTÍFICA', 105, yPosition, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(100, 100, 100);
    yPosition += 15;
    doc.text('Rotores Seamaty para Medicina Veterinária', 105, yPosition, { align: 'center' });

    doc.setFontSize(10);
    yPosition += 20;
    doc.setTextColor(0, 0, 0);
    doc.text(`Preparado para: Planeta Bichos`, 20, yPosition);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, yPosition + 8);

    // Conteúdo
    fullAnalysis.forEach((item, idx) => {
      yPosition += 20;
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 15;
      }

      doc.setFontSize(14);
      doc.setTextColor(25, 51, 102);
      doc.text(`${idx + 1}. ${item.rotor_name}`, 20, yPosition);
      
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      yPosition += 10;

      const analysis = item.analysis;
      const lines = doc.splitTextToSize(
        `${analysis.summary || ''}
${analysis.functions || ''}
${analysis.clinical_cases || ''}
${analysis.interpretation || ''}`, 
        170
      );

      lines.slice(0, 15).forEach(line => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 15;
        }
        doc.text(line, 20, yPosition);
        yPosition += 5;
      });
    });

    // Referências
    yPosition += 15;
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 15;
    }

    doc.setFontSize(12);
    doc.setTextColor(25, 51, 102);
    doc.text('Referências Científicas', 20, yPosition);

    yPosition += 10;
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);

    (references.references || []).forEach(ref => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 15;
      }
      const lines = doc.splitTextToSize(`• ${ref}`, 170);
      lines.forEach(line => {
        doc.text(line, 20, yPosition);
        yPosition += 4;
      });
    });

    // Salvar PDF
    const pdfBytes = doc.output('arraybuffer');
    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    
    // Upload do PDF
    const fileResponse = await base44.integrations.Core.UploadFile({
      file: pdfBlob
    });

    const pdfUrl = fileResponse.file_url;

    // Enviar via WhatsApp usando integração (simulado)
    const whatsappMessage = `🔬 *Análise Científica - Rotores Seamaty*

Olá Natan!

Segue em anexo a análise completa dos rotores Seamaty para medicina veterinária, preparada pela equipe Planeta Bichos com:

✅ 6 rotores analisados
✅ Funções fisiológicas detalhadas
✅ Casos clínicos reais
✅ Referências científicas atualizadas (2022-2026)

📄 Download: ${pdfUrl}

Qualquer dúvida, estamos à disposição!`;

    console.log('WhatsApp Message:', whatsappMessage);
    console.log('Recipient:', '14 991 676 428');
    console.log('PDF URL:', pdfUrl);

    return Response.json({
      success: true,
      message: 'PDF gerado e preparado para envio',
      pdf_url: pdfUrl,
      whatsapp_number: '14 991 676 428',
      analysis_count: fullAnalysis.length,
      references_count: (references.references || []).length
    });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({
      error: error.message
    }, { status: 500 });
  }
});