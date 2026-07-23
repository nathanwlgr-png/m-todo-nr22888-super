import { createClient } from '@base44/sdk';

const startedAt = Date.now();
const appId = process.env.BASE44_APP_ID;
const apiKey = process.env.BASE44_API_KEY;

if (!appId || !apiKey) {
  console.error(JSON.stringify({
    connected: false,
    error: 'Configuração ausente',
    required: ['BASE44_APP_ID', 'BASE44_API_KEY'],
  }, null, 2));
  process.exitCode = 1;
} else {
  const base44 = createClient({
    appId,
    headers: { api_key: apiKey },
  });

  try {
    const records = await base44.entities.Client.list('-created_date', 1);
    console.log(JSON.stringify({
      connected: true,
      app_id: appId,
      entity_checked: 'Client',
      read_succeeded: Array.isArray(records),
      sample_count: Array.isArray(records) ? records.length : 0,
      writes_performed: 0,
      elapsed_ms: Date.now() - startedAt,
      checked_at: new Date().toISOString(),
    }, null, 2));
  } catch (error) {
    console.error(JSON.stringify({
      connected: false,
      app_id: appId,
      status: error?.status || error?.response?.status || null,
      error: error?.message || 'Falha desconhecida',
      writes_performed: 0,
      elapsed_ms: Date.now() - startedAt,
      checked_at: new Date().toISOString(),
    }, null, 2));
    process.exitCode = 1;
  }
}