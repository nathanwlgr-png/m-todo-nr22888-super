import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.2';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Buscar artigos científicos reais e criar conteúdo
    const scientificContent = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é um especialista em medicina veterinária e bioquímica clínica.

TAREFA: Criar conteúdo científico completo sobre o analisador VG2 da Seamaty.

ESTRUTURA OBRIGATÓRIA:

1. ENZIMAS E PARÂMETROS DO VG2 (Lista completa com explicação de cada uma):
- ALT (Alanina Aminotransferase)
- AST (Aspartato Aminotransferase)
- ALP (Fosfatase Alcalina)
- GGT (Gama-Glutamiltransferase)
- CK (Creatina Quinase)
- LDH (Lactato Desidrogenase)
- AMY (Amilase)
- LIPA (Lipase)
- GLU (Glicose)
- CREA (Creatinina)
- BUN (Ureia)
- T-BIL (Bilirrubina Total)
- TP (Proteína Total)
- ALB (Albumina)
- GLOB (Globulina)
- Ca (Cálcio)
- P (Fósforo)
- Mg (Magnésio)
- CHOL (Colesterol)
- TRIG (Triglicerídeos)

Para cada parâmetro, explique: função, valores de referência, alterações patológicas.

2. IMPORTÂNCIA DA HEMOGASOMETRIA VETERINÁRIA:
- Avaliação do equilíbrio ácido-base
- Oxigenação e ventilação
- Eletrólitos (Na, K, Cl)
- Lactato e metabolismo
- Aplicações em emergências
- Monitoramento anestésico

3. 12 CASOS CLÍNICOS DETALHADOS:
Para cada caso, forneça:
- Espécie e raça
- Sinais clínicos
- Resultados dos parâmetros do VG2
- Interpretação diagnóstica
- Conduta terapêutica

Casos sugeridos:
1. Insuficiência renal aguda - cão
2. Pancreatite aguda - cão
3. Doença hepática crônica - gato
4. Diabetes mellitus descompensado - cão
5. Hipoadrenocorticismo (Addison) - cão
6. Hipercalcemia de malignidade - cão
7. Cetoacidose diabética - gato
8. Intoxicação hepática - cão
9. Síndrome nefrótica - gato
10. Rabdomiólise - cavalo
11. Lipidose hepática - gato
12. Insuficiência cardíaca congestiva - cão

4. 13 REFERÊNCIAS CIENTÍFICAS REAIS (2020-2025):
Liste artigos científicos REAIS publicados em revistas veterinárias de alto impacto sobre:
- Bioquímica clínica veterinária
- Hemogasometria em pequenos animais
- Marcadores hepáticos e renais
- Diagnóstico laboratorial em emergências
- Interpretação de painéis bioquímicos

IMPORTANTE: Use referências reais de journals como:
- Journal of Veterinary Internal Medicine (JVIM)
- Veterinary Clinical Pathology
- Journal of Small Animal Practice
- American Journal of Veterinary Research
- Veterinary Emergency and Critical Care

Formato das referências: Autor(es). (Ano). Título. Revista, Volume(Issue), páginas. DOI

Retorne o conteúdo científico completo e bem estruturado.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          enzymes_parameters: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                abbreviation: { type: "string" },
                function: { type: "string" },
                reference_values: { type: "string" },
                clinical_significance: { type: "string" }
              }
            }
          },
          hemogasometry_importance: {
            type: "object",
            properties: {
              introduction: { type: "string" },
              applications: { type: "array", items: { type: "string" } },
              clinical_relevance: { type: "string" }
            }
          },
          clinical_cases: {
            type: "array",
            items: {
              type: "object",
              properties: {
                case_number: { type: "number" },
                title: { type: "string" },
                species: { type: "string" },
                clinical_signs: { type: "string" },
                vg2_results: { type: "string" },
                interpretation: { type: "string" },
                treatment: { type: "string" }
              }
            }
          },
          references: {
            type: "array",
            items: {
              type: "object",
              properties: {
                citation: { type: "string" },
                doi: { type: "string" }
              }
            }
          }
        }
      }
    });

    // Criar PDF
    const doc = new jsPDF();
    let yPos = 20;

    // Função auxiliar para adicionar texto com quebra de linha
    const addText = (text, fontSize = 10, isBold = false) => {
      doc.setFontSize(fontSize);
      if (isBold) doc.setFont(undefined, 'bold');
      else doc.setFont(undefined, 'normal');
      
      const lines = doc.splitTextToSize(text, 180);
      lines.forEach(line => {
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(line, 15, yPos);
        yPos += fontSize * 0.4;
      });
      yPos += 3;
    };

    // CABEÇALHO PERSONALIZADO
    doc.setFillColor(0, 51, 153); // Azul Seamaty
    doc.rect(0, 0, 210, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('VG2 - Analisador Bioquímico Seamaty', 105, 15, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'normal');
    doc.text('Guia Científico Completo', 105, 25, { align: 'center' });
    
    doc.setTextColor(0, 0, 0);
    yPos = 45;

    // ÍNDICE
    addText('ÍNDICE', 16, true);
    addText('1. Parâmetros e Enzimas do VG2 ........................... 2');
    addText('2. Importância da Hemogasometria ...................... 8');
    addText('3. Casos Clínicos (12 casos) .............................. 10');
    addText('4. Referências Científicas (13 artigos) ................. 25');
    yPos += 10;

    doc.addPage();
    yPos = 20;

    // 1. ENZIMAS E PARÂMETROS
    addText('1. PARÂMETROS E ENZIMAS DO VG2', 16, true);
    addText('O VG2 da Seamaty é um analisador bioquímico de última geração que oferece 20 parâmetros essenciais para o diagnóstico veterinário.', 11);
    yPos += 5;

    for (const param of scientificContent.enzymes_parameters) {
      addText(`${param.name} (${param.abbreviation})`, 12, true);
      addText(`Função: ${param.function}`);
      addText(`Valores de Referência: ${param.reference_values}`);
      addText(`Significado Clínico: ${param.clinical_significance}`);
      yPos += 5;
    }

    // 2. HEMOGASOMETRIA
    doc.addPage();
    yPos = 20;
    addText('2. IMPORTÂNCIA DA HEMOGASOMETRIA VETERINÁRIA', 16, true);
    addText(scientificContent.hemogasometry_importance.introduction, 11);
    yPos += 5;

    addText('Aplicações Clínicas:', 12, true);
    for (const app of scientificContent.hemogasometry_importance.applications) {
      addText(`• ${app}`);
    }
    yPos += 5;
    addText(scientificContent.hemogasometry_importance.clinical_relevance, 11);

    // 3. CASOS CLÍNICOS
    doc.addPage();
    yPos = 20;
    addText('3. CASOS CLÍNICOS', 16, true);
    yPos += 5;

    for (const clinicalCase of scientificContent.clinical_cases) {
      addText(`CASO ${clinicalCase.case_number}: ${clinicalCase.title}`, 14, true);
      addText(`Espécie: ${clinicalCase.species}`, 11, true);
      addText('Sinais Clínicos:', 11, true);
      addText(clinicalCase.clinical_signs);
      addText('Resultados VG2:', 11, true);
      addText(clinicalCase.vg2_results);
      addText('Interpretação:', 11, true);
      addText(clinicalCase.interpretation);
      addText('Conduta Terapêutica:', 11, true);
      addText(clinicalCase.treatment);
      yPos += 8;
    }

    // 4. REFERÊNCIAS
    doc.addPage();
    yPos = 20;
    addText('4. REFERÊNCIAS CIENTÍFICAS', 16, true);
    yPos += 5;

    let refNumber = 1;
    for (const ref of scientificContent.references) {
      addText(`${refNumber}. ${ref.citation}`);
      if (ref.doi) {
        addText(`   DOI: ${ref.doi}`, 9);
      }
      yPos += 3;
      refNumber++;
    }

    // RODAPÉ
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`VG2 Seamaty - Guia Científico | Página ${i} de ${totalPages}`, 105, 290, { align: 'center' });
      doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, 15, 290);
    }

    // Converter para base64
    const pdfBase64 = doc.output('datauristring').split(',')[1];
    const pdfBuffer = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0));
    const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });

    // Upload do PDF
    const formData = new FormData();
    formData.append('file', pdfBlob, 'VG2_Guia_Cientifico_Completo.pdf');

    const uploadResponse = await fetch('https://api.base44.com/integrations/Core/UploadFile', {
      method: 'POST',
      headers: {
        'Authorization': req.headers.get('Authorization') || '',
      },
      body: formData
    });

    if (!uploadResponse.ok) {
      throw new Error('Falha no upload do PDF');
    }

    const uploadData = await uploadResponse.json();

    // Salvar no ExportedDocument
    await base44.asServiceRole.entities.ExportedDocument.create({
      title: 'VG2 - Guia Científico Completo (13 Artigos + 12 Casos Clínicos)',
      document_type: 'pdf',
      file_url: uploadData.file_url,
      category: 'outro',
      description: '20 parâmetros/enzimas do VG2, importância da hemogasometria, 12 casos clínicos detalhados, 13 referências científicas atuais (2020-2025)',
      whatsapp_ready: true,
      metadata: {
        type: 'scientific_guide',
        equipment: 'VG2',
        parameters_count: 20,
        clinical_cases_count: 12,
        references_count: 13
      }
    });

    return Response.json({
      success: true,
      file_url: uploadData.file_url,
      message: 'PDF científico VG2 criado com sucesso!'
    });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});