import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { docName, products = [] } = await req.json();

    if (!docName) {
      return Response.json({ error: 'Doc name required' }, { status: 400 });
    }

    // Obter token de acesso do Google
    const googleToken = await base44.asServiceRole.connectors.getAccessToken('googleslides');

    // Criar documento no Google Docs usando Google API
    const docResponse = await fetch('https://docs.googleapis.com/v1/documents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${googleToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: docName
      })
    });

    if (!docResponse.ok) {
      const error = await docResponse.json();
      return Response.json({ 
        success: false, 
        error: error.error?.message || 'Erro ao criar documento' 
      }, { status: docResponse.status });
    }

    const docData = await docResponse.json();
    
    // Preparar conteúdo do documento
    const requests = [
      {
        insertText: {
          text: `PROPOSTA COMERCIAL\n\nData: ${new Date().toLocaleDateString('pt-BR')}\nVendedor: ${user.full_name}\n\n`
        }
      },
      {
        insertText: {
          text: `PRODUTOS:\n\n`
        }
      }
    ];

    // Adicionar produtos se houver
    if (products && products.length > 0) {
      for (const product of products) {
        requests.push({
          insertText: {
            text: `• ${product.name || 'Produto'}: R$ ${(product.price || 0).toFixed(2)}\n`
          }
        });
      }
    }

    requests.push({
      insertText: {
        text: `\n\nNota: Este documento foi gerado automaticamente pelo CRM NR22.`
      }
    });

    // Atualizar documento com conteúdo
    await fetch(`https://docs.googleapis.com/v1/documents/${docData.documentId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${googleToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requests })
    });

    return Response.json({
      success: true,
      doc_id: docData.documentId,
      doc_name: docData.title,
      doc_url: `https://docs.google.com/document/d/${docData.documentId}/edit`
    });

  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});