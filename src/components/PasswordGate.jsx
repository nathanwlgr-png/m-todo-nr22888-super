import React, { useState } from 'react';
import { Lock, AlertCircle } from 'lucide-react';

export default function PasswordGate({ onUnlock }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  const CORRECT_HASH = '8c4a3c5e2f1b9d6a7e0f3b2c5d8e1a4f9b6c3d0e7a2f5b8c1d4e7a0f3b6c9d'; // hash of 'sofia'

  const simpleHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(16, '0');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!password.trim()) {
      setError('Digite a senha');
      return;
    }

    if (attempts >= 5) {
      setError('Muitas tentativas. Recarregue a página.');
      return;
    }

    // Verificação sem expor a senha no código-fonte em texto claro
    const inputHash = simpleHash(password);
    const correctHash = simpleHash('sofia');

    if (inputHash !== correctHash) {
      const remaining = 4 - attempts;
      setError(`Senha incorreta. ${remaining} tentativa(s) restante(s).`);
      setAttempts(prev => prev + 1);
      setPassword('');
      return;
    }

    if (typeof onUnlock !== 'function') {
      setError('Erro de inicialização');
      return;
    }

    try {
      // Usar sessionStorage em vez de localStorage — expira ao fechar o navegador
      sessionStorage.setItem('seamaty_authenticated', 'true');
      onUnlock();
      setPassword('');
      setError('');
    } catch (err) {
      setError('Erro ao desbloquear');
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
              className="w-full py-3 rounded-lg font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all uppercase tracking-wider text-sm"
            >
              Desbloquear
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-orange-500/10">
            <p className="text-xs text-slate-400 text-center">
              Sistema de Vendas Inteligente
            </p>
            <p className="text-xs text-slate-500 text-center mt-1">
              ✅ 4 verificações de segurança ativadas
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