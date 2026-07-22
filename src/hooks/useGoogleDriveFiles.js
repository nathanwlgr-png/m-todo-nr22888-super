import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

const connectorId = '6a602143b5175a5251df09d9';

export default function useGoogleDriveFiles() {
  const [state, setState] = useState({ loading: true, connected: false, files: [] });
  const load = async (search = '') => {
    setState((current) => ({ ...current, loading: true }));
    try {
      const response = await base44.functions.invoke('googleDriveCatalogBrowser', { search });
      setState({ loading: false, connected: true, files: response.data.files || [] });
    } catch {
      setState({ loading: false, connected: false, files: [] });
    }
  };
  useEffect(() => { base44.auth.isAuthenticated().then((ok) => ok ? load() : setState({ loading: false, connected: false, files: [] })); }, []);
  const connect = async () => {
    const url = await base44.connectors.connectAppUser(connectorId);
    const popup = window.open(url, '_blank');
    const timer = setInterval(() => { if (!popup || popup.closed) { clearInterval(timer); load(); } }, 500);
  };
  return { ...state, load, connect };
}