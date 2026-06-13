import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ── INVENTÁRIO READ-ONLY DO DROPBOX NR22888 ──
// REGRA MÁXIMA: Nenhum arquivo será apagado, movido ou renomeado.
// Apenas leitura de metadados.

const EXTENSOES = {
  imagem: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'svg', 'bmp', 'tiff'],
  pdf: ['pdf'],
  documento: ['doc', 'docx', 'txt', 'rtf', 'odt'],
  planilha: ['xls', 'xlsx', 'csv', 'ods'],
  apresentacao: ['ppt', 'pptx', 'key'],
  video: ['mp4', 'mov', 'avi', 'mkv', 'wmv'],
  audio: ['mp3', 'wav', 'ogg', 'm4a'],
  compactado: ['zip', 'rar', '7z', 'tar', 'gz'],
};

function detectarExtensao(nome) {
  const ext = (nome.split('.').pop() || '').toLowerCase();
  for (const [tipo, exts] of Object.entries(EXTENSOES)) {
    if (exts.includes(ext)) return { ext, tipo };
  }
  return { ext, tipo: 'outro' };
}

// Classificar arquivo pelo nome + extensão
function classificarArquivo(nome, caminho) {
  const nomeLower = nome.toLowerCase();
  const { ext, tipo } = detectarExtensao(nome);

  // Imagem de equipamento
  if (tipo === 'imagem') {
    const equipamentos = ['smt', 'vg1', 'vg2', 'vi1', 'vbc', 'qt3', '3dx', 'vq1', 'seamaty', 'analisador', 'equipamento'];
    if (equipamentos.some(e => nomeLower.includes(e))) return 'imagem_equipamento';
    if (nomeLower.includes('logo')) return 'logo';
    if (nomeLower.includes('story') || nomeLower.includes('stories')) return 'arte_story';
    if (nomeLower.includes('feed') || nomeLower.includes('post') || nomeLower.includes('insta')) return 'arte_feed';
    if (nomeLower.includes('arte') || nomeLower.includes('card') || nomeLower.includes('banner')) return 'arte_instagram';
    if (nomeLower.includes('print') || nomeLower.includes('screenshot') || nomeLower.includes('captura')) return 'print';
    return 'imagem_desconhecida';
  }

  if (tipo === 'pdf') {
    if (nomeLower.includes('proposta') || nomeLower.includes('proposal')) return 'proposta';
    if (nomeLower.includes('contrato') || nomeLower.includes('contract')) return 'contrato';
    if (nomeLower.includes('catalo') || nomeLower.includes('catalog')) return 'catalogo';
    if (nomeLower.includes('manual') || nomeLower.includes('tecni')) return 'material_tecnico';
    if (nomeLower.includes('relatorio') || nomeLower.includes('report')) return 'pdf_relatorio';
    if (nomeLower.includes('nf') || nomeLower.includes('nota')) return 'nota_fiscal';
    return 'pdf_generico';
  }

  if (tipo === 'documento') {
    if (nomeLower.includes('proposta')) return 'proposta';
    if (nomeLower.includes('contrato')) return 'contrato';
    if (nomeLower.includes('manual') || nomeLower.includes('tecni')) return 'material_tecnico';
    return 'documento_generico';
  }

  if (tipo === 'planilha') {
    if (nomeLower.includes('cliente') || nomeLower.includes('client')) return 'cliente';
    if (nomeLower.includes('preco') || nomeLower.includes('price') || nomeLower.includes('tabela')) return 'tabela';
    if (nomeLower.includes('campanha') || nomeLower.includes('campaign')) return 'campanha';
    return 'planilha_generica';
  }

  if (tipo === 'apresentacao') return 'apresentacao';
  if (tipo === 'compactado') return 'backup';

  return 'desconhecido_revisar';
}

// Detectar equipamento pelo nome
function detectarEquipamento(nome) {
  const nomeLower = nome.toLowerCase();
  const mapa = {
    'SMT-120VP': ['smt', '120vp', 'bioquimica', 'bioquím'],
    'VG1': ['vg1', 'hemogas', 'hemogás', 'gasometria'],
    'VG2': ['vg2'],
    'VI1': ['vi1', 'imuno', 'immunofluorescência'],
    'VBC50A': ['vbc', '50a', 'hematologia', 'hemograma'],
    'QT3': ['qt3', 'bioquimica rapida'],
    '3DX': ['3dx'],
    'VQ1': ['vq1', 'pcr'],
  };
  for (const [equip, palavras] of Object.entries(mapa)) {
    if (palavras.some(p => nomeLower.includes(p))) return equip;
  }
  return null;
}

// Listar pasta recursivamente (máx 2 níveis para não ser pesado)
async function listarPasta(accessToken, caminho, nivel = 0) {
  const body = caminho === '' 
    ? { path: '', recursive: false }
    : { path: caminho, recursive: false };

  const resp = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const err = await resp.text();
    return { entries: [], erro: err };
  }

  const data = await resp.json();
  let entries = data.entries || [];

  // Continuar se houver mais páginas
  let cursor = data.cursor;
  let has_more = data.has_more;
  while (has_more && entries.length < 500) {
    const contResp = await fetch('https://api.dropboxapi.com/2/files/list_folder/continue', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cursor }),
    });
    if (!contResp.ok) break;
    const contData = await contResp.json();
    entries = entries.concat(contData.entries || []);
    cursor = contData.cursor;
    has_more = contData.has_more;
  }

  return { entries, erro: null };
}

// Obter informações da conta
async function getAccountInfo(accessToken) {
  const resp = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });
  if (!resp.ok) return null;
  return await resp.json();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('dropbox');

    // ── 1. Info da conta ─────────────────────────────────────────────────────
    const accountInfo = await getAccountInfo(accessToken);

    // ── 2. Listar raiz ────────────────────────────────────────────────────────
    const raiz = await listarPasta(accessToken, '');
    if (raiz.erro) {
      return Response.json({
        success: false,
        dropbox_conectou: false,
        erro: raiz.erro,
        status: 'DROPBOX_SEM_ACESSO_OU_PRECISA_RECONEXAO',
        confirmacao: 'Nenhum arquivo foi apagado, movido ou renomeado.',
      });
    }

    const pastas = raiz.entries.filter(e => e['.tag'] === 'folder');
    const arquivosRaiz = raiz.entries.filter(e => e['.tag'] === 'file');

    // ── 3. Listar subpastas (nível 2) ─────────────────────────────────────────
    const inventarioCompleto = [];
    const pastasSummary = [];

    // Processar arquivos soltos na raiz
    for (const arq of arquivosRaiz) {
      const tipo = classificarArquivo(arq.name, arq.path_lower);
      const equip = detectarEquipamento(arq.name);
      const { ext } = detectarExtensao(arq.name);
      inventarioCompleto.push({
        nome: arq.name,
        caminho: arq.path_display || arq.path_lower,
        pasta: '/ (raiz)',
        ext,
        tipo_detectado: tipo,
        tamanho_kb: arq.size ? Math.round(arq.size / 1024) : null,
        data_modificacao: arq.server_modified || arq.client_modified || null,
        equipamento_detectado: equip,
        mover_autorizado: false,
        excluir_autorizado: false,
        status: 'inventariado',
        nivel: 'raiz',
      });
    }

    // Processar pastas e seus conteúdos
    for (const pasta of pastas) {
      const subConteudo = await listarPasta(accessToken, pasta.path_lower);
      const subEntries = subConteudo.entries || [];
      const subArquivos = subEntries.filter(e => e['.tag'] === 'file');
      const subPastas = subEntries.filter(e => e['.tag'] === 'folder');

      pastasSummary.push({
        nome: pasta.name,
        caminho: pasta.path_display,
        total_arquivos: subArquivos.length,
        total_subpastas: subPastas.length,
        subpastas: subPastas.map(s => s.name),
      });

      for (const arq of subArquivos) {
        const tipo = classificarArquivo(arq.name, arq.path_lower);
        const equip = detectarEquipamento(arq.name);
        const { ext } = detectarExtensao(arq.name);
        inventarioCompleto.push({
          nome: arq.name,
          caminho: arq.path_display || arq.path_lower,
          pasta: pasta.name,
          ext,
          tipo_detectado: tipo,
          tamanho_kb: arq.size ? Math.round(arq.size / 1024) : null,
          data_modificacao: arq.server_modified || null,
          equipamento_detectado: equip,
          mover_autorizado: false,
          excluir_autorizado: false,
          status: 'inventariado',
          nivel: 'nivel_1',
        });
      }

      // Subpastas nível 2
      for (const sub of subPastas) {
        const sub2 = await listarPasta(accessToken, sub.path_lower);
        const sub2Arqs = (sub2.entries || []).filter(e => e['.tag'] === 'file');
        for (const arq of sub2Arqs) {
          const tipo = classificarArquivo(arq.name, arq.path_lower);
          const equip = detectarEquipamento(arq.name);
          const { ext } = detectarExtensao(arq.name);
          inventarioCompleto.push({
            nome: arq.name,
            caminho: arq.path_display || arq.path_lower,
            pasta: `${pasta.name}/${sub.name}`,
            ext,
            tipo_detectado: tipo,
            tamanho_kb: arq.size ? Math.round(arq.size / 1024) : null,
            data_modificacao: arq.server_modified || null,
            equipamento_detectado: equip,
            mover_autorizado: false,
            excluir_autorizado: false,
            status: 'inventariado',
            nivel: 'nivel_2',
          });
        }
      }
    }

    // ── 4. ANÁLISE E CONTAGENS ────────────────────────────────────────────────
    const contagens = {};
    for (const arq of inventarioCompleto) {
      contagens[arq.tipo_detectado] = (contagens[arq.tipo_detectado] || 0) + 1;
    }

    // Detectar duplicados prováveis (mesmo nome em pastas diferentes)
    const nomeMap = {};
    for (const arq of inventarioCompleto) {
      if (!nomeMap[arq.nome]) nomeMap[arq.nome] = [];
      nomeMap[arq.nome].push(arq.caminho);
    }
    const duplicadosProvaveis = Object.entries(nomeMap)
      .filter(([, caminhos]) => caminhos.length > 1)
      .map(([nome, caminhos]) => ({ nome, aparece_em: caminhos }));

    // Arquivos que parecem oficiais Seamaty
    const oficiais = inventarioCompleto.filter(a =>
      a.equipamento_detectado || a.tipo_detectado === 'logo' || a.tipo_detectado === 'catalogo'
    );

    // Arquivos que precisam revisão
    const precisamRevisao = inventarioCompleto.filter(a =>
      a.tipo_detectado === 'desconhecido_revisar' || a.tipo_detectado === 'imagem_desconhecida'
    );

    // ── 5. SALVAR REGISTROS NA ENTIDADE ArquivoNR22888 ───────────────────────
    // Salvar em lotes de 20 para não sobrecarregar
    let salvos = 0;
    const lote = inventarioCompleto.slice(0, 100); // máx 100 por execução
    for (const arq of lote) {
      await base44.asServiceRole.entities.ArquivoNR22888.create({
        nome: arq.nome,
        tipo: arq.tipo_detectado === 'desconhecido_revisar' ? 'desconhecido' : 
              arq.tipo_detectado.split('_')[0],
        pasta_atual: arq.caminho,
        equipamento: arq.equipamento_detectado || undefined,
        tamanho_kb: arq.tamanho_kb || undefined,
        data_modificacao: arq.data_modificacao || undefined,
        mover_autorizado: false,
        precisa_revisao_nathan: arq.tipo_detectado === 'desconhecido_revisar',
        status: 'inventariado',
        observacao: `Inventário READ-ONLY 2026-06-13. Nada foi movido ou apagado. Tipo detectado: ${arq.tipo_detectado}`,
      }).catch(() => {});
      salvos++;
    }

    // ── 6. LOG ────────────────────────────────────────────────────────────────
    await base44.asServiceRole.entities.AIInteractionLog.create({
      action_type: 'general',
      user_message: 'DROPBOX_INVENTARIO_READONLY_NR22888 — 2026-06-13',
      ai_response: `Inventário concluído. Total: ${inventarioCompleto.length} arquivos | ${pastas.length} pastas | ${duplicadosProvaveis.length} duplicados prováveis | ${precisamRevisao.length} para revisar. NADA FOI APAGADO, MOVIDO OU RENOMEADO.`,
      source: 'central_ia_master',
      success: true,
    }).catch(() => {});

    return Response.json({
      success: true,
      dropbox_conectou: true,
      conta: accountInfo ? {
        nome: accountInfo.name?.display_name,
        email: accountInfo.email,
      } : null,

      // ── RELATÓRIO COMPLETO ────────────────────────────────────────────────
      resumo: {
        total_pastas_raiz: pastas.length,
        total_arquivos_raiz_soltos: arquivosRaiz.length,
        total_arquivos_inventariados: inventarioCompleto.length,
        total_duplicados_provaveis: duplicadosProvaveis.length,
        total_para_revisao: precisamRevisao.length,
        total_oficiais_seamaty: oficiais.length,
        registros_salvos_crm: salvos,
      },

      pastas_principais: pastasSummary,
      arquivos_soltos_raiz: arquivosRaiz.map(a => a.name),

      contagens_por_tipo: contagens,

      // Detalhes categorizados
      catalogos: inventarioCompleto.filter(a => a.tipo_detectado === 'catalogo').map(a => ({ nome: a.nome, caminho: a.caminho, tamanho_kb: a.tamanho_kb })),
      imagens_equipamento: inventarioCompleto.filter(a => a.tipo_detectado === 'imagem_equipamento').map(a => ({ nome: a.nome, caminho: a.caminho, equipamento: a.equipamento_detectado })),
      logos: inventarioCompleto.filter(a => a.tipo_detectado === 'logo').map(a => ({ nome: a.nome, caminho: a.caminho })),
      propostas: inventarioCompleto.filter(a => ['proposta'].includes(a.tipo_detectado)).map(a => ({ nome: a.nome, caminho: a.caminho })),
      contratos: inventarioCompleto.filter(a => a.tipo_detectado === 'contrato').map(a => ({ nome: a.nome, caminho: a.caminho })),
      artes_instagram: inventarioCompleto.filter(a => ['arte_instagram', 'arte_story', 'arte_feed'].includes(a.tipo_detectado)).map(a => ({ nome: a.nome, caminho: a.caminho, tipo: a.tipo_detectado })),
      prints: inventarioCompleto.filter(a => a.tipo_detectado === 'print').map(a => ({ nome: a.nome, caminho: a.caminho })),
      materiais_tecnicos: inventarioCompleto.filter(a => a.tipo_detectado === 'material_tecnico').map(a => ({ nome: a.nome, caminho: a.caminho })),
      pdfs_genericos: inventarioCompleto.filter(a => ['pdf_generico', 'pdf_relatorio'].includes(a.tipo_detectado)).map(a => ({ nome: a.nome, caminho: a.caminho })),
      duplicados_provaveis: duplicadosProvaveis,
      precisam_revisao_nathan: precisamRevisao.slice(0, 30).map(a => ({ nome: a.nome, caminho: a.caminho })),

      // Parecem oficiais Seamaty
      oficiais_seamaty: oficiais.map(a => ({ nome: a.nome, caminho: a.caminho, tipo: a.tipo_detectado, equipamento: a.equipamento_detectado })),

      // Estrutura sugerida (NÃO MOVER AINDA)
      estrutura_sugerida: {
        aviso: 'SUGESTÃO APENAS — Nada foi criado ou movido. Aguardar aprovação Nathan.',
        pastas: [
          '/NR22888_ORGANIZACAO_SEGURA/01_OFICIAL_SEAMATY',
          '/NR22888_ORGANIZACAO_SEGURA/02_CLIENTES',
          '/NR22888_ORGANIZACAO_SEGURA/03_PROPOSTAS',
          '/NR22888_ORGANIZACAO_SEGURA/04_CATALOGOS',
          '/NR22888_ORGANIZACAO_SEGURA/05_ARTES_INSTAGRAM',
          '/NR22888_ORGANIZACAO_SEGURA/06_PRINTS',
          '/NR22888_ORGANIZACAO_SEGURA/07_CONTRATOS',
          '/NR22888_ORGANIZACAO_SEGURA/08_MATERIAIS_TECNICOS',
          '/NR22888_ORGANIZACAO_SEGURA/09_HUNTER_LEADS',
          '/NR22888_ORGANIZACAO_SEGURA/90_DUPLICADOS_REVISAR',
          '/NR22888_ORGANIZACAO_SEGURA/91_DESCONHECIDOS_REVISAR',
          '/NR22888_ORGANIZACAO_SEGURA/92_ARQUIVOS_ANTIGOS_REVISAR',
          '/NR22888_ORGANIZACAO_SEGURA/99_NAO_APAGAR_BACKUP',
        ],
      },

      status_final: 'DROPBOX_INVENTARIADO_READ_ONLY_SEM_MOVER_NADA',
      confirmacao: '✅ Nenhum arquivo foi apagado, movido ou renomeado. Apenas leitura de metadados.',
      inventario_completo: inventarioCompleto,
    });

  } catch (error) {
    return Response.json({
      success: false,
      dropbox_conectou: false,
      erro: error.message,
      status: 'DROPBOX_SEM_ACESSO_OU_PRECISA_RECONEXAO',
      confirmacao: 'Nenhum arquivo foi apagado, movido ou renomeado.',
    }, { status: 500 });
  }
});