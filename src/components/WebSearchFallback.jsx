import { base44 } from '@/api/base44Client';

/**
 * Busca informações na web quando IA não está disponível
 */
export async function searchWebFallback(query, options = {}) {
  try {
    const response = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`
    );
    
    if (!response.ok) {
      throw new Error('Falha na busca web');
    }

    const data = await response.json();
    
    return {
      success: true,
      results: data.RelatedTopics?.slice(0, options.limit || 5).map(topic => ({
        title: topic.Text?.split(' - ')[0] || '',
        snippet: topic.Text || '',
        url: topic.FirstURL || ''
      })) || [],
      abstract: data.Abstract || '',
      source: 'web_search'
    };
  } catch (error) {
    console.error('Web search fallback error:', error);
    return {
      success: false,
      error: error.message,
      results: []
    };
  }
}

/**
 * Busca dados de empresas usando CNPJ (API pública)
 */
export async function searchCNPJ(cnpj) {
  try {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`);
    
    if (!response.ok) {
      return { success: false, error: 'CNPJ não encontrado' };
    }

    const data = await response.json();
    
    return {
      success: true,
      data: {
        razao_social: data.razao_social,
        nome_fantasia: data.nome_fantasia,
        cnpj: data.cnpj,
        capital_social: data.capital_social,
        porte: data.porte,
        natureza_juridica: data.natureza_juridica,
        situacao_cadastral: data.situacao_cadastral,
        endereco: `${data.logradouro}, ${data.numero} - ${data.bairro}, ${data.municipio}/${data.uf}`,
        cep: data.cep,
        telefone: data.ddd_telefone_1,
        email: data.email,
        atividade_principal: data.cnae_fiscal_descricao
      },
      source: 'brasil_api'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Busca CEP (API pública)
 */
export async function searchCEP(cep) {
  try {
    const cleanCEP = cep.replace(/\D/g, '');
    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
    
    if (!response.ok) {
      return { success: false, error: 'CEP não encontrado' };
    }

    const data = await response.json();
    
    if (data.erro) {
      return { success: false, error: 'CEP inválido' };
    }

    return {
      success: true,
      data: {
        cep: data.cep,
        logradouro: data.logradouro,
        bairro: data.bairro,
        cidade: data.localidade,
        uf: data.uf,
        complemento: data.complemento
      },
      source: 'via_cep'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Análise simples de mercado usando busca web (sem IA)
 */
export async function analyzeMarketWithoutAI(cidade, segmento = 'veterinária') {
  try {
    const query = `clínicas veterinárias em ${cidade} Brasil equipamentos laboratório`;
    const searchResults = await searchWebFallback(query, { limit: 10 });

    // Análise básica dos resultados
    const analysis = {
      cidade,
      segmento,
      resultados_encontrados: searchResults.results.length,
      fontes: searchResults.results.map(r => ({
        titulo: r.title,
        resumo: r.snippet,
        link: r.url
      })),
      resumo: searchResults.abstract || 'Informações de mercado encontradas via busca web',
      metodo: 'web_search_fallback',
      timestamp: new Date().toISOString()
    };

    return {
      success: true,
      data: analysis
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Wrapper para usar IA ou fallback dependendo do modo
 */
export async function smartSearch(query, options = {}) {
  const aiMode = localStorage.getItem('nr22_ai_mode') || 'economy';
  
  // Se modo off, usar apenas web
  if (aiMode === 'off') {
    return await searchWebFallback(query, options);
  }

  // Se modo economy, tentar IA com fallback para web
  if (aiMode === 'economy' && !options.forceAI) {
    return await searchWebFallback(query, options);
  }

  // Modo full ou forceAI: tentar IA
  try {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: query,
      add_context_from_internet: true,
      response_json_schema: options.schema
    });

    return {
      success: true,
      data: result,
      source: 'ai'
    };
  } catch (error) {
    // Se IA falhar, usar web como fallback
    if (error.message.includes('limit')) {
      return await searchWebFallback(query, options);
    }
    throw error;
  }
}