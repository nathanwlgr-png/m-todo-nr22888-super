import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Lock, Eye, EyeOff, Shield, Activity } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Segurança Admin Seamaty
 * Controle de acesso com senha + auditoria
 */

const PROTECTED_FEATURES = [
  { id: 'modo_supremo', label: '👑 Modo Supremo', icon: '👑', level: 'critical' },
  { id: 'instagram', label: '📸 Instagram Studio', icon: '📷', level: 'high' },
  { id: 'auditoria', label: '📋 Auditoria', icon: '✓', level: 'high' },
  { id: 'mob_import', label: '📦 Mob Vendedor Import', icon: '📦', level: 'high' },
  { id: 'apis', label: '⚙️ APIs + Integrações', icon: '⚙️', level: 'critical' },
  { id: 'deletions', label: '🗑️ Exclusões de Dados', icon: '🗑️', level: 'critical' },
];

export default function SeamtyAdminSecurity() {
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [logs, setLogs] = useState([]);

  const handleLogin = () => {
    if (locked) {
      toast.error('❌ Sistema bloqueado. Tente novamente em 10 minutos.');
      return;
    }

    if (!adminPassword) {
      toast.error('Digite a senha');
      return;
    }

    // Simular validação (em produção, validar com hash no backend)
    if (adminPassword === 'admin123') {
      setIsAuthenticated(true);
      setFailedAttempts(0);
      setAdminPassword('');
      toast.success('✅ Autenticado como Admin');

      // Log auditoria
      addLog('LOGIN', 'Admin logado', 'success');
    } else {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);

      if (newAttempts >= 3) {
        setLocked(true);
        addLog('FAILED_LOGIN', '3 tentativas falhadas - Sistema bloqueado', 'critical');
        toast.error('❌ Sistema bloqueado após 3 tentativas erradas');
      } else {
        addLog('FAILED_LOGIN', `Tentativa falha (${newAttempts}/3)`, 'warning');
        toast.error(`❌ Senha incorreta (${newAttempts}/3)`);
      }

      setAdminPassword('');
    }
  };

  const addLog = (action, description, severity = 'info') => {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    setLogs(prev => [{
      id: Date.now(),
      timestamp,
      action,
      description,
      severity,
    }, ...prev].slice(0, 20)); // Manter últimas 20 ações
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    addLog('LOGOUT', 'Admin desconectado', 'info');
    toast.info('Desconectado');
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <Card className="w-full max-w-sm bg-slate-900 border-slate-700">
          <CardHeader className="bg-gradient-to-r from-red-900 to-red-800">
            <CardTitle className="text-white flex items-center gap-2">
              <Lock className="w-5 h-5" />
              🔐 Autenticação Admin
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">

            {locked ? (
              <div className="bg-red-950 border-2 border-red-600 rounded-lg p-4 text-center">
                <p className="font-bold text-red-200">❌ Sistema Bloqueado</p>
                <p className="text-red-300 text-sm mt-2">Tente novamente em 10 minutos</p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-bold text-white mb-2">
                    Senha Admin
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                      placeholder="Digite a senha"
                      className="bg-slate-800 border-slate-600 text-white pr-10"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {failedAttempts > 0 && (
                  <div className="bg-yellow-950 border border-yellow-700 rounded-lg p-3">
                    <p className="text-yellow-200 text-sm">
                      ⚠️ {failedAttempts}/3 tentativas. 1 mais tentativa e o sistema será bloqueado.
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleLogin}
                  className="w-full bg-red-600 hover:bg-red-700 font-bold"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Autenticar
                </Button>
              </>
            )}

          </CardContent>
        </Card>
      </div>
    );
  }

  // PAINEL ADMIN AUTENTICADO
  return (
    <div className="space-y-6 p-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-red-400" />
          🔐 Painel Admin
        </h1>
        <Button
          onClick={handleLogout}
          variant="outline"
          className="text-red-400 border-red-600 hover:bg-red-950"
        >
          Sair
        </Button>
      </div>

      {/* RECURSOS PROTEGIDOS */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">🔒 Recursos Protegidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {PROTECTED_FEATURES.map(feature => (
              <div key={feature.id} className={`p-4 rounded-lg border-2 ${
                feature.level === 'critical'
                  ? 'bg-red-950 border-red-600'
                  : 'bg-orange-950 border-orange-600'
              }`}>
                <p className="text-2xl mb-1">{feature.icon}</p>
                <p className={`font-bold text-sm ${
                  feature.level === 'critical' ? 'text-red-200' : 'text-orange-200'
                }`}>
                  {feature.label}
                </p>
                <Badge className={feature.level === 'critical' ? 'bg-red-700 mt-2' : 'bg-orange-700 mt-2'}>
                  {feature.level === 'critical' ? '🔴 CRÍTICO' : '🟠 ALTO'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AUDITORIA */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="w-5 h-5" />
            📋 Log de Auditoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-slate-400 text-center py-8">Nenhuma atividade registrada</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {logs.map(log => (
                <div
                  key={log.id}
                  className={`p-3 rounded-lg border-l-4 flex justify-between items-start text-sm ${
                    log.severity === 'critical'
                      ? 'bg-red-950 border-red-600 text-red-200'
                      : log.severity === 'warning'
                      ? 'bg-yellow-950 border-yellow-600 text-yellow-200'
                      : log.severity === 'success'
                      ? 'bg-green-950 border-green-600 text-green-200'
                      : 'bg-slate-700 border-slate-600 text-slate-200'
                  }`}
                >
                  <div>
                    <p className="font-bold">{log.action}</p>
                    <p className="text-xs opacity-75 mt-1">{log.description}</p>
                  </div>
                  <span className="text-xs opacity-60 flex-shrink-0">{log.timestamp}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* CONFIGURAÇÕES */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">⚙️ Configurações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold justify-start">
            🔑 Alterar Senha Admin
          </Button>
          <Button className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold justify-start">
            🗑️ Limpar Logs de Auditoria
          </Button>
          <Button className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold justify-start">
            🔓 Desbloquear Sistema
          </Button>
          <Button className="w-full bg-red-900 hover:bg-red-800 text-white font-bold justify-start">
            ⚠️ Reset Factory (CUIDADO!)
          </Button>
        </CardContent>
      </Card>

    </div>
  );
}