import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { state, category } = await req.json();

    // Buscar lojas usando IA + Internet
    const searchResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Você é um especialista em prospecção B2B.

TAREFA: Encontre lojas de festas, mercados e distribuidoras no estado: ${state || 'São Paulo'}
Categoria: ${category || 'Lojas de festas que vendem brinquedos com balinha/doces dentro'}

Use busca na internet para encontrar:
1. Nome da empresa
2. CNPJ (se disponível publicamente)
3. Nome do proprietário/decisor (se disponível)
4. Telefone/WhatsApp
5. Endereço completo
6. Porte da empresa (pequena/média/grande)
7. Se já vendem brinquedos similares

IMPORTANTE:
- Busque em Google Maps, Reclame Aqui, redes sociais
- Priorize lojas ativas e com boa reputação
- Foque em estabelecimentos que já trabalham com brinquedos e doces
- Encontre pelo menos 20-30 prospects qualificados

Retorne JSON estruturado.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          prospects: {
            type: "array",
            items: {
              type: "object",
              properties: {
                nome_empresa: { type: "string" },
                cnpj: { type: "string" },
                proprietario: { type: "string" },
                telefone: { type: "string" },
                whatsapp: { type: "string" },
                endereco: { type: "string" },
                cidade: { type: "string" },
                porte: { type: "string" },
                vende_similares: { type: "boolean" },
                observacoes: { type: "string" }
              }
            }
          }
        }
      }
    });

    // Analisar gatilhos para cada prospect
    const prospectsWithTriggers = await Promise.all(
      searchResult.prospects.map(async (prospect) => {
        const triggerAnalysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Analise este prospect e sugira os 3 melhores gatilhos de persuasão:

PROSPECT:
- Empresa: ${prospect.nome_empresa}
- Porte: ${prospect.porte}
- Já vende similares: ${prospect.vende_similares ? 'Sim' : 'Não'}
- Observações: ${prospect.observacoes}

PRODUTO: Brinquedos com balinha/doces dentro (tipo ovo surpresa, cápsulas)

Retorne os 3 gatilhos mais efetivos baseados em:
- Cialdini (Escassez, Autoridade, Prova Social, etc)
- Perfil do negócio (pequeno/médio/grande)
- Se já vende ou não similares

Para cada gatilho, forneça:
1. Nome do gatilho
2. Mensagem pronta para WhatsApp (2-3 frases)
3. Por que funciona para este perfil`,
          response_json_schema: {
            type: "object",
            properties: {
              gatilhos: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    nome: { type: "string" },
                    mensagem_whatsapp: { type: "string" },
                    motivo: { type: "string" }
                  }
                }
              },
              abordagem_recomendada: { type: "string" },
              horario_ideal: { type: "string" }
            }
          }
        });

        return {
          ...prospect,
          gatilhos: triggerAnalysis.gatilhos,
          abordagem_recomendada: triggerAnalysis.abordagem_recomendada,
          horario_ideal: triggerAnalysis.horario_ideal
        };
      })
    );

    // Gerar PDF
    const doc = new jsPDF();
    let y = 20;

    // Título
    doc.setFontSize(20);
    doc.text('Prospecção - Lojas de Festas e Mercados', 20, y);
    y += 10;

    doc.setFontSize(12);
    doc.text(`Estado: ${state || 'São Paulo'} | Total: ${prospectsWithTriggers.length} prospects`, 20, y);
    y += 15;

    // Para cada prospect
    prospectsWithTriggers.forEach((prospect, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      // Cabeçalho do prospect
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text(`${index + 1}. ${prospect.nome_empresa}`, 20, y);
      y += 7;

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      
      // Dados básicos
      if (prospect.cnpj) doc.text(`CNPJ: ${prospect.cnpj}`, 25, y), y += 5;
      if (prospect.proprietario) doc.text(`Proprietário: ${prospect.proprietario}`, 25, y), y += 5;
      if (prospect.telefone) doc.text(`Telefone: ${prospect.telefone}`, 25, y), y += 5;
      if (prospect.whatsapp) doc.text(`WhatsApp: ${prospect.whatsapp}`, 25, y), y += 5;
      if (prospect.endereco) {
        const enderecoWrapped = doc.splitTextToSize(`Endereço: ${prospect.endereco}, ${prospect.cidade}`, 170);
        doc.text(enderecoWrapped, 25, y);
        y += 5 * enderecoWrapped.length;
      }
      
      y += 3;

      // Gatilhos
      doc.setFont(undefined, 'bold');
      doc.text('🎯 GATILHOS DE PERSUASÃO:', 25, y);
      y += 6;
      doc.setFont(undefined, 'normal');

      prospect.gatilhos.forEach((gatilho, idx) => {
        if (y > 265) {
          doc.addPage();
          y = 20;
        }

        doc.setFont(undefined, 'bold');
        doc.text(`${idx + 1}. ${gatilho.nome}`, 30, y);
        y += 5;
        doc.setFont(undefined, 'normal');

        const mensagemWrapped = doc.splitTextToSize(`"${gatilho.mensagem_whatsapp}"`, 160);
        doc.text(mensagemWrapped, 30, y);
        y += 5 * mensagemWrapped.length;

        const motivoWrapped = doc.splitTextToSize(`Por quê: ${gatilho.motivo}`, 160);
        doc.setFontSize(9);
        doc.text(motivoWrapped, 30, y);
        y += 4 * motivoWrapped.length + 3;
        doc.setFontSize(10);
      });

      // Abordagem recomendada
      y += 2;
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      doc.setFont(undefined, 'bold');
      doc.text('📋 Abordagem:', 25, y);
      y += 5;
      doc.setFont(undefined, 'normal');
      const abordagemWrapped = doc.splitTextToSize(prospect.abordagem_recomendada, 165);
      doc.text(abordagemWrapped, 25, y);
      y += 5 * abordagemWrapped.length;

      doc.text(`⏰ Melhor horário: ${prospect.horario_ideal}`, 25, y);
      y += 10;

      // Linha separadora
      doc.setDrawColor(200, 200, 200);
      doc.line(20, y, 190, y);
      y += 10;
    });

    // Converter para bytes
    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=prospeccao_${state?.replace(/\s/g, '_')}_${Date.now()}.pdf`
      }
    });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});