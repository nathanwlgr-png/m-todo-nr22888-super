import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    console.error('[NR22888 ErrorBoundary]', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: '#0a0a0a' }}>
        <div className="w-full max-w-sm rounded-2xl p-5" style={{ background: '#1a0500', border: '1px solid rgba(255,68,68,0.4)' }}>
          <p className="text-base font-black text-red-400 mb-2">⚠️ Erro na Página</p>
          <p className="text-xs text-slate-400 mb-3">{this.state.error?.message || 'Erro desconhecido'}</p>
          {this.state.info && (
            <details className="mb-3">
              <summary className="text-[10px] text-slate-600 cursor-pointer mb-1">Stack trace</summary>
              <pre className="text-[9px] text-slate-600 whitespace-pre-wrap max-h-40 overflow-y-auto">
                {this.state.info.componentStack}
              </pre>
            </details>
          )}
          <button
            onClick={() => { this.setState({ hasError: false, error: null, info: null }); window.location.href = '/'; }}
            className="w-full py-2.5 rounded-xl text-sm font-black"
            style={{ background: 'rgba(255,107,0,0.2)', color: '#ff9500', border: '1px solid rgba(255,107,0,0.4)' }}
          >
            🏠 Voltar ao Início
          </button>
        </div>
      </div>
    );
  }
}