import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const connectorId = '6a602143b5175a5251df09d9';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(connectorId);
    const search = String(body.search || '').trim().replace(/'/g, "\\'");
    const terms = ["trashed = false", search ? `name contains '${search}'` : ''].filter(Boolean).join(' and ');
    const params = new URLSearchParams({
      q: terms,
      pageSize: '100',
      orderBy: 'modifiedTime desc',
      fields: 'files(id,name,mimeType,modifiedTime,size,webViewLink,thumbnailLink,iconLink)'
    });
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Falha ao consultar o Google Drive.');
    const files = (data.files || []).filter((file) => /image|pdf|document|spreadsheet|presentation/.test(file.mimeType || ''));
    return Response.json({ connected: true, files });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});