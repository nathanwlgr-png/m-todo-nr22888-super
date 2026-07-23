import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// Sincroniza tarefas PENDENTES do CRM com Issues do GitHub.
// - Cada tarefa pendente vira/atualiza uma Issue (marcada no corpo com [nr22888-task:<id>]).
// - Tarefas concluídas/canceladas fecham a Issue correspondente.
// Nunca deleta nada. Idempotente: pode rodar quantas vezes quiser.

const MARKER = (id: string) => `[nr22888-task:${id}]`;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const priorityLabel = (p?: string) =>
  p === 'alta' ? 'prioridade:alta' : p === 'baixa' ? 'prioridade:baixa' : 'prioridade:media';

function issueBody(task: any) {
  const lines = [
    task.description || 'Sem descrição.',
    '',
    task.client_name ? `**Cliente:** ${task.client_name}` : null,
    task.due_date ? `**Vence:** ${task.due_date}` : null,
    task.type ? `**Tipo:** ${task.type}` : null,
    task.assigned_to_name || task.assigned_to ? `**Responsável:** ${task.assigned_to_name || task.assigned_to}` : null,
    '',
    '---',
    `_Sincronizado do CRM NR22888. Não remova a marca abaixo._`,
    MARKER(task.id),
  ].filter((l) => l !== null);
  return lines.join('\n');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const repo = String(body.repo || '').trim(); // ex: "nathanwlgr-png/nr22888-sistema"
    if (!repo || !repo.includes('/')) {
      return Response.json({ error: 'Informe o repositório no formato "dono/repo".' }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('github');
    const gh = async (path: string, init: RequestInit = {}): Promise<any> => {
      const res = await fetch(`https://api.github.com${path}`, {
        ...init,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'User-Agent': 'NR22888-CRM', // OBRIGATÓRIO: sem isto o GitHub retorna 403
          ...(init.headers || {}),
        },
      });
      const text = await res.text();
      let data: any = {};
      try { data = text ? JSON.parse(text) : {}; } catch (_) { data = { message: text }; }
      if (!res.ok) {
        console.error(`GH FAIL ${init.method || 'GET'} ${path} → ${res.status}: ${data?.message || text}`);
        throw new Error(data?.message || `GitHub ${res.status}`);
      }
      return data;
    };

    // 0. Garantir que as labels existam (GitHub retorna 403 ao aplicar label inexistente)
    const wantedLabels = [
      { name: 'nr22888', color: '5319e7' },
      { name: 'prioridade:alta', color: 'd73a4a' },
      { name: 'prioridade:media', color: 'fbca04' },
      { name: 'prioridade:baixa', color: '0e8a16' },
    ];
    for (const label of wantedLabels) {
      try {
        await gh(`/repos/${repo}/labels`, { method: 'POST', body: JSON.stringify(label) });
      } catch (_e) {
        // já existe — segue
      }
    }

    // 1. Carregar tarefas do CRM
    const allTasks = await base44.asServiceRole.entities.Task.list('-created_date', 500).catch(() => []);
    let pending = allTasks.filter((t: any) => t.status === 'pendente');
    if (body.limit) pending = pending.slice(0, Number(body.limit));
    const closed = allTasks.filter((t: any) => t.status === 'concluida' || t.status === 'cancelada');

    // 2. Carregar Issues existentes do CRM (todas, para casar pela marca)
    const existing: any[] = [];
    for (let page = 1; page <= 10; page++) {
      const batch = await gh(`/repos/${repo}/issues?state=all&per_page=100&page=${page}`);
      if (!Array.isArray(batch) || batch.length === 0) break;
      existing.push(...batch.filter((i: any) => !i.pull_request));
      if (batch.length < 100) break;
    }
    const byTaskId = new Map<string, any>();
    for (const issue of existing) {
      const m = String(issue.body || '').match(/\[nr22888-task:([^\]]+)\]/);
      if (m) byTaskId.set(m[1], issue);
    }

    let created = 0, updated = 0, closedCount = 0, skipped = 0;

    // 3. Criar/atualizar Issues para tarefas pendentes
    for (const task of pending) {
      const title = task.title || `Tarefa ${task.id}`;
      const found = byTaskId.get(task.id);
      const labels = ['nr22888', priorityLabel(task.priority)];
      if (found) {
        const needsUpdate =
          found.title !== title ||
          found.state !== 'open' ||
          String(found.body || '') !== issueBody(task);
        if (needsUpdate) {
          await gh(`/repos/${repo}/issues/${found.number}`, {
            method: 'PATCH',
            body: JSON.stringify({ title, body: issueBody(task), state: 'open', labels }),
          });
          updated++;
        } else {
          skipped++;
        }
      } else {
        await gh(`/repos/${repo}/issues`, {
          method: 'POST',
          body: JSON.stringify({ title, body: issueBody(task), labels }),
        });
        created++;
      }
    }

    // 4. Fechar Issues de tarefas concluídas/canceladas
    for (const task of closed) {
      const found = byTaskId.get(task.id);
      if (found && found.state === 'open') {
        await gh(`/repos/${repo}/issues/${found.number}`, {
          method: 'PATCH',
          body: JSON.stringify({ state: 'closed' }),
        });
        closedCount++;
      }
    }

    return Response.json({
      success: true,
      repo,
      pending_tasks: pending.length,
      created,
      updated,
      closed: closedCount,
      unchanged: skipped,
    });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});