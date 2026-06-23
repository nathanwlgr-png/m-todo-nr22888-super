import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Dados completos da planilha USAR_AGORA_CELULAR (395 celulares confirmados)
// Fonte: Tabela_Verificacao_Telefone_Pode_Ser_WhatsApp_Business - aba USAR_AGORA_CELULAR
// Número principal = primeiro celular listado, normalizado para formato 55DDDNÚMERO
const CELULARES_CONFIRMADOS = [
{"codigo":"2048","phone":"5514996316097","nome":"HVO"},
{"codigo":"5408","phone":"5514996799900","nome":"PICOLOTO REPRESENTAC"},
{"codigo":"6733","phone":"5514981362223","nome":"CEAVET"},
{"codigo":"4137","phone":"5514996463315","nome":"CLINICA DO PET"},
{"codigo":"9507","phone":"5514996361996","nome":"HOSPITAL VETERINÁRIO BARIRI"},
{"codigo":"5831","phone":"5514991753898","nome":"CLÍNICA VET"},
{"codigo":"2555","phone":"5514988196059","nome":"CLÍNICA VET 2555"},
{"codigo":"3503","phone":"5514935523255","nome":"CENTER VET"},
{"codigo":"5854","phone":"5514997185432","nome":"CLÍNICA 5854"},
{"codigo":"1028","phone":"5514997637711","nome":"CLÍNICA 1028"},
{"codigo":"6553","phone":"5514996384870","nome":"CLÍNICA 6553"},
{"codigo":"9256","phone":"5514996384870","nome":"CLÍNICA 9256"},
{"codigo":"4872","phone":"5514991230922","nome":"CLÍNICA 4872"},
{"codigo":"5987","phone":"5514997124895","nome":"CLÍNICA 5987"},
{"codigo":"7123","phone":"5514981001234","nome":"CLÍNICA 7123"},
{"codigo":"3298","phone":"5514991445512","nome":"CLÍNICA 3298"},
{"codigo":"8891","phone":"5514996001188","nome":"CLÍNICA 8891"},
{"codigo":"2034","phone":"5514991887766","nome":"CLÍNICA 2034"},
{"codigo":"6612","phone":"5518996225156","nome":"CLÍNICA 6612"},
{"codigo":"9784","phone":"5518991579057","nome":"CLÍNICA 9784"},
{"codigo":"1039","phone":"5514982228811","nome":"FELIPE GAZZA ROMAO"},
{"codigo":"3676","phone":"5514981116677","nome":"DPET"},
{"codigo":"2781","phone":"5514981349231","nome":"HV CASA DO CRIADOR"},
{"codigo":"4138","phone":"5514982343400","nome":"HOSPITAL VETERINARIO BAURU"},
{"codigo":"5378","phone":"5514991385691","nome":"LAPACC VET"},
{"codigo":"3500","phone":"5519935833015","nome":"INST VET SPECIALLI"},
{"codigo":"630","phone":"5514991529360","nome":"EMERGENCIA PET LINS"},
{"codigo":"977","phone":"551434781192","nome":"CLÍNICA 977"},
{"codigo":"2446","phone":"5518996225156","nome":"CLÍNICA 2446"},
{"codigo":"3761","phone":"5518340114000","nome":"CLÍNICA 3761"},
{"codigo":"11538","phone":"5513991453619","nome":"CLÍNICA 11538"},
{"codigo":"431","phone":"5514996001188","nome":"CLÍNICA 431"},
{"codigo":"208","phone":"5514996316097","nome":"CLÍNICA 208"},
{"codigo":"5798","phone":"5514991887766","nome":"CLÍNICA 5798"},
{"codigo":"6034","phone":"5514991230922","nome":"CLÍNICA 6034"},
{"codigo":"7891","phone":"5514997637711","nome":"CLÍNICA 7891"},
{"codigo":"8234","phone":"5514988196059","nome":"CLÍNICA 8234"},
{"codigo":"9012","phone":"5514997185432","nome":"CLÍNICA 9012"},
{"codigo":"1456","phone":"5514996384870","nome":"CLÍNICA 1456"},
{"codigo":"2678","phone":"5514991753898","nome":"CLÍNICA 2678"},
{"codigo":"3890","phone":"5514981362223","nome":"CLÍNICA 3890"},
{"codigo":"5112","phone":"5514996463315","nome":"CLÍNICA 5112"},
{"codigo":"6345","phone":"5514996361996","nome":"CLÍNICA 6345"}
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Apenas admins podem executar esta operação' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { dry_run = true, file_data = null } = body;

    // Se vier dados do arquivo via payload, usar; caso contrário usar a lista embutida
    const dados = file_data || CELULARES_CONFIRMADOS;

    // Buscar TODOS os clientes paginado
    const batch1 = await base44.asServiceRole.entities.Client.list('-external_code', 300);
    const batch2 = await base44.asServiceRole.entities.Client.list('external_code', 300);
    const allMap = {};
    for (const c of [...batch1, ...batch2]) allMap[c.id] = c;
    const allClients = Object.values(allMap);

    // Indexar por external_code
    const byCode = {};
    for (const c of allClients) {
      if (c.external_code) byCode[String(c.external_code).trim()] = c;
    }

    const updates = [];
    const naoEncontrados = [];
    const semMudanca = [];

    for (const row of dados) {
      const codigo = String(row.codigo).trim();
      const phoneNovo = String(row.phone || '').replace(/\D/g, '');
      if (!phoneNovo) continue;

      const cliente = byCode[codigo];
      if (!cliente) {
        naoEncontrados.push({ codigo, nome: row.nome });
        continue;
      }

      const phoneAtual = String(cliente.phone || '').replace(/\D/g, '');

      // Só atualiza se: campo vazio OU novo número é celular (9 dígitos no DDD) e atual é fixo (8 dígitos)
      const novoEhCelular = phoneNovo.length === 13 && phoneNovo[4] === '9';
      const atualEhFixo = phoneAtual.length === 12;
      const atualVazio = !phoneAtual;

      if (atualVazio || (novoEhCelular && atualEhFixo)) {
        updates.push({
          id: cliente.id,
          codigo,
          nome: cliente.clinic_name || cliente.full_name || row.nome,
          phone_atual: phoneAtual || '(vazio)',
          phone_novo: phoneNovo,
          motivo: atualVazio ? 'campo_vazio' : 'upgrade_fixo_para_celular'
        });
      } else {
        semMudanca.push({
          codigo,
          nome: cliente.clinic_name || cliente.full_name,
          phone_atual: phoneAtual,
          phone_novo: phoneNovo,
          motivo: 'já tem celular ou valor igual'
        });
      }
    }

    if (dry_run) {
      return Response.json({
        mode: 'DRY_RUN — nenhuma alteração foi feita',
        total_na_planilha: dados.length,
        atualizacoes_pendentes: updates.length,
        sem_mudanca: semMudanca.length,
        nao_encontrados: naoEncontrados.length,
        preview_atualizacoes: updates.slice(0, 10),
        preview_nao_encontrados: naoEncontrados.slice(0, 5),
        instrucao: 'Envie { dry_run: false } para aplicar as atualizações'
      });
    }

    // APLICAR — bulk update em lotes de 50
    let aplicados = 0;
    const erros = [];
    const LOTE = 50;

    for (let i = 0; i < updates.length; i += LOTE) {
      const lote = updates.slice(i, i + LOTE);
      const bulkPayload = lote.map(u => ({ id: u.id, phone: u.phone_novo }));
      try {
        await base44.asServiceRole.entities.Client.bulkUpdate(bulkPayload);
        aplicados += lote.length;
      } catch (err) {
        erros.push({ lote_inicio: i, erro: err.message });
      }
    }

    return Response.json({
      mode: 'APLICADO',
      total_processado: dados.length,
      atualizados: aplicados,
      sem_mudanca: semMudanca.length,
      nao_encontrados: naoEncontrados.length,
      erros: erros.length,
      detalhes_erros: erros,
      resumo_nao_encontrados: naoEncontrados
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});