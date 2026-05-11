import React, { useState } from 'react';
import { Lock, AlertCircle } from 'lucide-react';

// Senha validada por hash SHA-256 no lado do cliente.
// NOTA DE SEGURANÇA: Esta proteção é uma barreira de usabilidade (impede acesso casual),
// NÃO uma proteção criptográfica real — o app já requer login Base44 para funcionar.
// O hash abaixo corresponde a SHA-256 de "sofia" (sem o texto da senha em código).
// Hash gerado em: https://emn178.github.io/online-tools/sha256.html
const CORRECT_SHA256 = '6a69d0ce4d9baea84a92024ac2f70f0ec50dd7dbc2b89de1c90fca64f8e0ef30';

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function PasswordGate({ onUnlock }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [checking, setChecking] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password.trim()) {
      setError('Digite a senha');
      return;
    }

    if (attempts >= 5) {
      setError('Muitas tentativas. Recarregue a página.');
      return;
    }

    setChecking(true);
    try {
      const inputHash = await sha256(password.trim());

      if (inputHash !== CORRECT_SHA256) {
        const remaining = 4 - attempts;
        setError(`Senha incorreta. ${remaining} tentativa(s) restante(s).`);
        setAttempts(prev => prev + 1);
        setPassword('');
        return;
      }

      // Correto — usar sessionStorage (expira ao fechar o navegador)
      sessionStorage.setItem('seamaty_authenticated', 'true');
      onUnlock();
      setPassword('');
      setError('');
    } catch (err) {
      setError('Erro ao verificar senha');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4">
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-8 shadow-2xl border border-orange-500/20">

          {/* Header */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-orange-400" />
            </div>
          </div>

          <h1 className="text-2xl font-black text-center text-white mb-2">
            SEAMATY NR22888
          </h1>
          <p className="text-center text-orange-400 text-sm font-bold tracking-widest mb-8">
            ACESSO RESTRITO
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-orange-400 mb-2 uppercase tracking-wider">
                Senha de Acesso
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite aqui"
                autoFocus
                disabled={checking}
                className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-orange-500/30 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 text-center font-bold tracking-widest"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span className="text-sm text-red-400">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={checking}
              className="w-full py-3 rounded-lg font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all uppercase tracking-wider text-sm disabled:opacity-60"
            >
              {checking ? 'Verificando...' : 'Desbloquear'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-orange-500/10">
            <p className="text-xs text-slate-400 text-center">
              Sistema de Vendas Inteligente
            </p>
            <p className="text-xs text-slate-500 text-center mt-1">
              🔒 SHA-256 · sessionStorage · Base44 Auth
            </p>
            {attempts > 0 && (
              <p className="text-xs text-orange-500 text-center mt-2">
                Tentativas: {attempts}/5
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}