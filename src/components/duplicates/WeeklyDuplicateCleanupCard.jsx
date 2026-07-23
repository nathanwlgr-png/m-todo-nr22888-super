import React, { useState } from 'react';
import { Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function WeeklyDuplicateCleanupCard() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const runCleanup = async () => {
    if (!window.confirm('Executar a limpeza segura agora? Telefones e campos padrão serão organizados; duplicatas irão para revisão.')) return;
    setLoading(true);
    setError('');
    try {
      const response = await base44.functions.invoke('limpezaCompletaCRM', { dry_run: false });
      setResult(response.data);
    } catch (requestError) {
      setError(requestError.message || 'Não foi possível executar a limpeza.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Limpeza semanal sem IA</CardTitle>
        <p className="text-sm text-muted-foreground">Segunda-feira às 03h · valida código externo + nome da empresa.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={runCleanup} disabled={loading} className="min-h-11 gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {loading ? 'Organizando...' : 'Limpar e organizar agora'}
        </Button>
        {result && <p aria-live="polite" className="rounded-lg bg-muted p-3 text-sm">{result.summary}</p>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}