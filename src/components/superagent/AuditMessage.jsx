import React from 'react';
import ReactMarkdown from 'react-markdown';

export default function AuditMessage({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm ${isUser ? 'bg-violet-600 text-white' : 'border border-slate-700 bg-slate-900 text-slate-100'}`}>
        {message.content && (isUser ? <p className="whitespace-pre-wrap">{message.content}</p> : <ReactMarkdown>{message.content}</ReactMarkdown>)}
        {message.tool_calls?.map((call, index) => {
          const running = ['pending', 'running', 'in_progress'].includes(call.status);
          const failed = ['failed', 'error'].includes(call.status);
          return (
            <div key={index} className="mt-2 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300">
              {running ? 'Verificando evidência…' : failed ? 'Verificação falhou' : 'Evidência verificada'}
            </div>
          );
        })}
      </div>
    </div>
  );
}