import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const connectorId = '6a2d5589e6f59c31e605d3d3';

export default function useGoogleSheetsExport() {
  const [user, setUser] = useState(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');

  const fetchStatus = async () => {
    try {
      await base44.functions.invoke('exportCRMHistoryToSheets', { action: 'status' });
      setConnected(true);
    } catch {
      setConnected(false);
    }
  };

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (authenticated) => {
      if (authenticated) {
        setUser(await base44.auth.me());
        await fetchStatus();
      }
      setLoading(false);
    });
  }, []);

  const connect = async () => {
    const url = await base44.connectors.connectAppUser(connectorId);
    const popup = window.open(url, '_blank');
    const timer = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        fetchStatus();
      }
    }, 500);
  };

  const exportHistory = async () => {
    setExporting(true);
    try {
      const response = await base44.functions.invoke('exportCRMHistoryToSheets', { action: 'export' });
      setSpreadsheetUrl(response.data.spreadsheetUrl);
      toast.success('Histórico exportado para o Google Sheets.');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setExporting(false);
    }
  };

  return { user, connected, loading, exporting, spreadsheetUrl, connect, exportHistory, login: () => base44.auth.redirectToLogin() };
}