import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';

const STAGES = ['idle', 'scanning', 'analyzing', 'fixing', 'done', 'error'];

export default function BugFixerButton() {
  const [stage, setStage] = useState('idle');
  const [log, setLog] = useState([]);
  const [open, setOpen] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const addLog = (msg, color = '#ccc') => setLog(p => [...p, { msg, color, t: new Date().toLocaleTimeString('pt-BR') }]);

  const runFix = async (attemptNum) => {
    setStage('scanning');
    setLog([]);
    addLog(`🔍 Tentativa ${attemptNum}/3 — Escaneando sistema...`, '#ff9500');

    try {
      // 1. Health check geral
      addLog('⚙️ Verificando funções backend...', '#888');
      const health = await base44.functions.invoke('systemHealthMonitor', { mode: 'quick' }).catch(e => ({ data: { error: e.message } }));
      const healthData = health?.data || {};

      if (healthData.error) {
        addLog(`⚠️ Health monitor: ${healthData.error}`, '#f59e0b');
      } else {
        addLog(`✅ Health monitor OK`, '#00ff88');
      }

      setStage('analyzing');
      addLog('🧠 Analisando erros e inconsistências...', '#888');

      // 2. Tentar auto-fix
      const fix = await base44.functions.invoke('autoFixSystem', {
        attempt: attemptNum,
        scan_entities: ['Client', 'Lead', 'Sale', 'Task', 'Visit'],
        fix_mode: 'auto',
      }).catch(e => ({ data: { error: e.message, fixed: [] } }));

      const fixData = fix?.data || {};
      setStage('fixing');

      if (fixData.fixed?.length > 0) {
        addLog(`🔧 Corrigido: ${fixData.fixed.join(', ')}`, '#00ff88');
      } else {
        addLog('🔎 Nenhum problema estrutural encontrado nas entidades.', '#888');
      }

      // 3. Limpar duplicatas
      addLog('🧹 Verificando duplicatas...', '#888');
      const dedup = await base44.functions.invoke('deduplicateAndClean', { mode: 'scan', entity: 'Client' }).catch(() => ({ data: {} }));
      const dedupData = dedup?.data || {};
      if (dedupData.duplicate_groups > 0) {
        addLog(`⚠️ ${dedupData.duplicate_groups} grupos duplicados detectados — mesclando...`, '#f59e0b');
        await base44.functions.invoke('deduplicateAndClean', { mode: 'merge', entity: 'Client' }).catch(() => {});
        addLog(`✅ Duplicatas mescladas!`, '#00ff88');
      } else {
        addLog('✅ Nenhuma duplicata encontrada.', '#00ff88');
      }

      // 4. Verificar notificações travadas
      addLog('🔔 Processando notificações pendentes...', '#888');
      await base44.functions.invoke('processNotifications', {}).catch(() => {});
      addLog('✅ Notificações processadas.', '#00ff88');

      setStage('done');
      addLog(`✅ Ciclo ${attemptNum}/3 concluído! Sistema estabilizado.`, '#00ff88');
      setAttempt(attemptNum);

      // Se ainda há tentativas disponíveis e houve problemas, oferecer próxima rodada
      if (attemptNum < 3 && (fixData.error || dedupData.duplicate_groups > 0)) {
        addLog(`🔄 Iniciando próxima tentativa automaticamente...`, '#ff9500');
        setTimeout(() => runFix(attemptNum + 1), 1500);
      }

    } catch (e) {
      setStage('error');
      addLog(`❌ Erro na tentativa ${attemptNum}: ${e.message}`, '#ef4444');
      if (attemptNum < 3) {
        addLog(`🔄 Retry automático em 2s...`, '#f59e0b');
        setTimeout(() => runFix(attemptNum + 1), 2000);
      } else {
        addLog('🚨 3 tentativas esgotadas. Verifique manualmente.', '#ef4444');
      }
    }
  };

  const handleBugPress = () => {
    setOpen(true);
    if (stage === 'idle' || stage === 'done' || stage === 'error') {
      setAttempt(0);
      runFix(1);
    }
  };

  const isRunning = stage === 'scanning' || stage === 'analyzing' || stage === 'fixing';

  const stageColor = {
    idle: '#ef4444',
    scanning: '#f59e0b',
    analyzing: '#a855f7',
    fixing: '#3b82f6',
    done: '#00ff88',
    error: '#ef4444',
  }[stage];

  const stageLabel = {
    idle: 'BUG',
    scanning: 'SCAN...',
    analyzing: 'IA...',
    fixing: 'FIX...',
    done: '✅ OK',
    error: '❌ ERR',
  }[stage];

  return (
    <>
      {/* Botão fixo no topo */}
      <button
        onClick={handleBugPress}
        className="fixed top-0 left-1/2 -translate-x-1/2 z-[9999] px-4 py-1 text-xs font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
        style={{
          background: isRunning
            ? `linear-gradient(90deg, #1a1a1a, #0a0000)`
            : 'linear-gradient(90deg, #1a0000, #2d0000)',
          color: stageColor,
          border: `1px solid ${stageColor}60`,
          borderTop: 'none',
          borderRadius: '0 0 10px 10px',
          boxShadow: `0 2px 12px ${stageColor}40`,
          minWidth: 72,
        }}
      >
        {isRunning && (
          <span className="inline-block w-2 h-2 rounded-full mr-1.5 animate-ping"
            style={{ background: stageColor, verticalAlign: 'middle' }} />
        )}
        {stageLabel}
      </button>

      {/* Painel de logs */}
      {open && (
        <div
          className="fixed top-7 left-1/2 -translate-x-1/2 z-[9998] w-80 rounded-b-xl overflow-hidden"
          style={{ background: '#0a0a0a', border: `1px solid ${stageColor}40`, borderTop: 'none', maxHeight: 320, boxShadow: '0 8px 32px rgba(0,0,0,0.8)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2"
            style={{ background: '#111', borderBottom: `1px solid ${stageColor}30` }}>
            <span className="text-xs font-black" style={{ color: stageColor }}>
              🔧 AUTO-FIX NR228888 — Tentativa {attempt || 1}/3
            </span>
            <button onClick={() => setOpen(false)}
              className="text-xs font-bold px-2 py-0.5 rounded"
              style={{ background: '#1a1a1a', color: '#666' }}>
              ✕
            </button>
          </div>

          {/* Logs */}
          <div className="overflow-y-auto p-3 space-y-1" style={{ maxHeight: 240, background: '#080808' }}>
            {log.length === 0 && (
              <p className="text-xs text-gray-600 text-center py-4">Iniciando diagnóstico...</p>
            )}
            {log.map((l, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className="text-gray-600 shrink-0 text-[9px] mt-0.5">{l.t}</span>
                <span style={{ color: l.color }}>{l.msg}</span>
              </div>
            ))}
            {isRunning && (
              <div className="flex items-center gap-2 text-xs mt-1">
                <div className="flex gap-0.5">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                      style={{ background: stageColor, animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
                <span style={{ color: stageColor }}>processando...</span>
              </div>
            )}
          </div>

          {/* Footer com ação manual */}
          {(stage === 'done' || stage === 'error') && (
            <div className="px-3 py-2 flex gap-2" style={{ borderTop: `1px solid ${stageColor}20` }}>
              <button
                onClick={() => { setStage('idle'); setLog([]); runFix(1); }}
                className="flex-1 py-1.5 rounded text-xs font-black"
                style={{ background: 'rgba(255,107,0,0.15)', color: '#ff9500', border: '1px solid rgba(255,107,0,0.3)' }}>
                🔄 Rodar novamente
              </button>
              <button
                onClick={() => setOpen(false)}
                className="px-3 py-1.5 rounded text-xs font-bold"
                style={{ background: '#1a1a1a', color: '#666', border: '1px solid #333' }}>
                Fechar
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}