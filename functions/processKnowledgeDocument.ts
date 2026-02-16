import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { file_url, title, document_type } = await req.json();

    // Extrair dados do documento usando IA
    const extractionSchema = {
      type: "object",
      properties: {
        extracted_text: { type: "string" },
        summary: { type: "string" },
        key_data: {
          type: "object",
          properties: {
            products: { type: "array", items: { type: "object" } },
            prices: { type: "array", items: { type: "object" } },
            specifications: { type: "array", items: { type: "string" } },
            contacts: { type: "array", items: { type: "object" } }
          }
        },
        tags: { type: "array", items: { type: "string" } }
      }
    };

    const promptByType = {
      catalogo_produtos: `Analise este catálogo de produtos e extraia:
- Lista de produtos com nomes, preços, especificações
- Benefícios principais de cada produto
- Diferenciais competitivos
- Tags relevantes`,

      modelo_proposta: `Analise este modelo de proposta e extraia:
- Estrutura do documento
- Seções principais
- Termos e condições padrão
- Frases de fechamento efetivas`,

      modelo_contrato: `Analise este contrato e extraia:
- Cláusulas principais
- Termos de pagamento
- Garantias oferecidas
- Condições de entrega`,

      tabela_precos: `Analise esta tabela de preços e extraia:
- Lista completa de produtos e preços
- Condições de pagamento
- Descontos disponíveis
- Validade`,

      lista_clientes: `Analise esta lista de clientes e extraia:
- Dados de contato
- Empresas
- Localização
- Histórico se disponível`
    };

    const prompt = promptByType[document_type] || 'Analise este documento e extraia as informações principais.';

    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `${prompt}

Documente de forma estruturada para que a IA possa usar nas conversas com clientes.
Extraia TODO o texto relevante, especialmente preços, especificações técnicas e benefícios.`,
      file_urls: [file_url],
      response_json_schema: extractionSchema
    });

    return Response.json({
      title,
      document_type,
      file_url,
      extracted_text: analysis.extracted_text,
      summary: analysis.summary,
      key_data: analysis.key_data,
      tags: analysis.tags,
      is_active: true
    });

  } catch (error) {
    console.error('Document processing error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});