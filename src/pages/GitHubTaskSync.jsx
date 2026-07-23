import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Github, RefreshCw, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';

const DEFAULT_REPO = 'nathanwlgr-png/nr22888-sistema';

export default function GitHubTaskSync() {
  const [repo, setRepo] = useState(DEFAULT_REPO);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSync = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await base44.functions.invoke('syncTasksToGitHubIssues', { repo: repo.trim() });
      const data = res?.data || res;
      if (data?.error) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      setError(e?.message || 'Falha ao sincronizar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center">
          <Github className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Sincronizar Tarefas → GitHub Issues</h1>
          <p className="text-sm text-muted-foreground">
            Cada tarefa pendente vira uma Issue. Concluídas fecham a Issue. Nada é apagado.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Repositório de destino</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="repo">Formato: dono/repositório</Label>
            <Input
              id="repo"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="nathanwlgr-png/nr22888-sistema"
            />
          </div>
          <Button onClick={handleSync} disabled={loading || !repo.includes('/')} className="w-full h-12 text-base">
            {loading ? (
              <><RefreshCw className="w-5 h-5 mr-2 animate-spin" /> Sincronizando…</>
            ) : (
              <><RefreshCw className="w-5 h-5 mr-2" /> Sincronizar agora</>
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-start gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2 text-green-700 font-semibold">
              <CheckCircle2 className="w-5 h-5" /> Sincronização concluída
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Stat label="Tarefas pendentes" value={result.pending_tasks} />
              <Stat label="Issues criadas" value={result.created} />
              <Stat label="Issues atualizadas" value={result.updated} />
              <Stat label="Issues fechadas" value={result.closed} />
            </div>
            <a
              href={`https://github.com/${result.repo}/issues`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
            >
              Abrir Issues no GitHub <ExternalLink className="w-4 h-4" />
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-white rounded-lg border p-3">
      <div className="text-2xl font-bold text-slate-900">{value ?? 0}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}