import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileSpreadsheet, Mail, CheckCircle, XCircle, RefreshCw, ExternalLink } from 'lucide-react';

const CONNECTOR_ID = '6a2d5589e6f59c31e605d3d3';

export default function WeeklyReportSettings() {
  const [user, setUser] = useState(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const checkConnection = async () => {
    try {
      const res = await base44.functions.invoke('syncWeeklyReportToSheets', { check_only: true });
      setConnected(true);
      return true;
    } catch {
      setConnected(false);
      return false;
    }
  };

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (authed) => {
      if (authed) {
        const me = await base44.auth.me();
        setUser(me);
        await checkConnection();
      }
      setLoading(false);
    });
  }, []);

  const handleConnect = async () => {
    const url = await base44.connectors.connectAppUser(CONNECTOR_ID);
    const popup = window.open(url, '_blank');
    const timer = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        checkConnection();
      }
    }, 500);
  };

  const handleDisconnect = async () => {
    await base44.connectors.disconnectAppUser(CONNECTOR_ID);
    setConnected(false);
  };

  const handleSendNow = async () => {
    setSending(true);
    setLastResult(null);
    try {
      const res = await base44.functions.invoke('syncWeeklyReportToSheets', {});
      setLastResult({ success: true, data: res.data });
    } catch (e) {
      setLastResult({ success: false, error: e.message });
    } finally {
      setSending(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
    </div>
  );

  if (!user) return (
    <div className="p-6 text-center">
      <Button onClick={() => base44.auth.redirectToLogin()}>Fazer Login</Button>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">📊 Relatório Semanal</h1>
        <p className="text-slate-500 text-sm mt-1">
          Todo domingo às 8h o CRM gera um resumo de vendas e envia para <strong>{user.email}</strong>
          {connected && ' + salva no seu Google Sheets'}.
        </p>
      </div>

      {/* Status do Google Sheets */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            Google Sheets
            <Badge className={connected ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}>
              {connected ? 'Conectado' : 'Não conectado'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-600">
            {connected
              ? 'Cada relatório cria automaticamente uma nova planilha na sua conta Google com abas de KPIs, Funil e Vendas.'
              : 'Conecte sua conta Google para que o relatório seja salvo automaticamente em uma planilha.'}
          </p>
          <div className="flex gap-2">
            {!connected ? (
              <Button onClick={handleConnect} className="bg-green-600 hover:bg-green-700 text-white">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Conectar Google Sheets
              </Button>
            ) : (
              <Button variant="outline" onClick={handleDisconnect} className="text-red-600 border-red-200">
                <XCircle className="w-4 h-4 mr-2" />
                Desconectar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Envio de e-mail */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-600" />
            E-mail Semanal
            <Badge className="bg-indigo-100 text-indigo-700">Ativo — Todo Domingo 8h</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-600">
            Destinatário: <strong>{user.email}</strong>
          </p>
          <p className="text-sm text-slate-500">
            Conteúdo: Novos leads, novos clientes, vendas fechadas, receita total, funil completo
            {connected && ', link para a planilha Google Sheets'}.
          </p>
          <Button onClick={handleSendNow} disabled={sending} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            {sending
              ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Gerando...</>
              : <><Mail className="w-4 h-4 mr-2" />Enviar Agora (Teste)</>}
          </Button>
        </CardContent>
      </Card>

      {/* Resultado do último envio */}
      {lastResult && (
        <Card className={lastResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <CardContent className="pt-4 space-y-2">
            <div className="flex items-center gap-2">
              {lastResult.success
                ? <CheckCircle className="w-5 h-5 text-green-600" />
                : <XCircle className="w-5 h-5 text-red-600" />}
              <span className="font-medium text-sm">
                {lastResult.success ? 'Relatório enviado com sucesso!' : 'Erro ao enviar'}
              </span>
            </div>
            {lastResult.success && lastResult.data && (
              <div className="text-sm text-slate-600 space-y-1">
                <p>📧 E-mail enviado para: <strong>{lastResult.data.email_sent_to}</strong></p>
                <p>📅 Período: {lastResult.data.period}</p>
                <p>🎯 {lastResult.data.summary?.new_leads} leads · {lastResult.data.summary?.new_clients} clientes · {lastResult.data.summary?.closed_deals} vendas</p>
                <p>💰 Receita: R$ {(lastResult.data.summary?.total_revenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                {lastResult.data.sheets_url && (
                  <a href={lastResult.data.sheets_url} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1 text-green-700 font-medium hover:underline">
                    <ExternalLink className="w-3 h-3" />
                    Abrir planilha gerada
                  </a>
                )}
              </div>
            )}
            {!lastResult.success && (
              <p className="text-sm text-red-700">{lastResult.error}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}