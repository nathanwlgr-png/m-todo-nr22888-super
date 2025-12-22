import React from 'react';
import { Check, Circle } from 'lucide-react';

export default function ChecklistItem({ 
  title, 
  description, 
  completed, 
  onClick,
  icon: Icon 
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-xl border-2 transition-all text-left active:scale-[0.98] ${
        completed 
          ? 'border-emerald-500 bg-emerald-50' 
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
          completed ? 'bg-emerald-500' : 'bg-slate-100'
        }`}>
          {completed ? (
            <Check className="w-4 h-4 text-white" />
          ) : (
            <Circle className="w-4 h-4 text-slate-300" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {Icon && <Icon className={`w-4 h-4 ${completed ? 'text-emerald-600' : 'text-slate-400'}`} />}
            <h4 className={`font-medium ${completed ? 'text-emerald-700' : 'text-slate-700'}`}>
              {title}
            </h4>
          </div>
          {description && (
            <p className="text-sm text-slate-500 mt-1">{description}</p>
          )}
        </div>
      </div>
    </button>
  );
}