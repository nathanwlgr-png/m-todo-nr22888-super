import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

const CONNECTOR_ID = '6a2d5589e6f59c31e605d3d3';

export default function useLeadSheetsSync() {
  const [state, setState] = useState({ loading: true, user: null, connected: false, url: '', syncing: false });
  const sync = async () => {
    setState((s) => ({ ...s, syncing: true }));
    const res = await base44.functions.invoke('syncLeadToByeSheet', { action: 'sync_pending' });
    setState((s) => ({ ...s, connected: true, url: res.data.spreadsheet_url || s.url, syncing: false }));
    return res.data.synced || 0;
  };
  const refresh = async (user) => {
    try {
      const res = await base44.functions.invoke('syncLeadToByeSheet', { action: 'status' });
      setState({ loading: false, user, connected: true, url: res.data.spreadsheet_url || '', syncing: false });
      await sync();
    } catch { setState({ loading: false, user, connected: false, url: '', syncing: false }); }
  };
  useEffect(() => { base44.auth.isAuthenticated().then(async (ok) => refresh(ok ? await base44.auth.me() : null)); }, []);
  const connect = async () => {
    const popup = window.open(await base44.connectors.connectAppUser(CONNECTOR_ID), '_blank');
    const timer = setInterval(() => { if (!popup || popup.closed) { clearInterval(timer); refresh(state.user); } }, 500);
  };
  return { ...state, connect, sync, login: () => base44.auth.redirectToLogin() };
}