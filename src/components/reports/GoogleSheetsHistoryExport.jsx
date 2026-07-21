import React from 'react';
import { ExternalLink, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import useGoogleSheetsExport from '@/hooks/useGoogleSheetsExport';

export default function GoogleSheetsHistoryExport() {
  const sheets = useGoogleSheetsExport();
  return (
    <Card className="p-4 border-emerald-200 bg-emerald-50">
      <div className="flex items-start gap-3">
        <FileSpreadsheet className="w-6 h-6 text-emerald-700 mt-0.5" />
        <div className="flex-1 space-y-3">
          <div>
            <h3 className="font-semibold text-slate-800">Histórico completo no Google Sheets</h3>
            <p className="text-xs text-slate-600">Clientes, negociações, propostas, interações e visitas organizados em abas.</p>
          </div>
          {sheets.loading ? <Loader2 className="w-5 h-5 animate-spin text-emerald-700" /> : !sheets.user ? (
            <Button className="w-full" onClick={sheets.login}>Entrar para exportar</Button>
          ) : !sheets.connected ? (
            <Button className="w-full bg-emerald-700 hover:bg-emerald-800" onClick={sheets.connect}>Conectar meu Google Sheets</Button>
          ) : (
            <Button className="w-full bg-emerald-700 hover:bg-emerald-800" onClick={sheets.exportHistory} disabled={sheets.exporting}>
              {sheets.exporting ? <Loader2 className="animate-spin" /> : <FileSpreadsheet />} Exportar histórico completo
            </Button>
          )}
          {sheets.spreadsheetUrl && <a href={sheets.spreadsheetUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 text-sm font-semibold text-emerald-800"><ExternalLink className="w-4 h-4" />Abrir planilha criada</a>}
        </div>
      </div>
    </Card>
  );
}