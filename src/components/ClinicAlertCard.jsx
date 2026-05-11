import React from 'react';
import { MapPin, Phone, Zap, ChevronRight, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const DETECTION_LABELS = {
  nova_clinica: { label: 'Nova Clínica', color: '#00ff88', bg: 'rgba(0,255,136,0.1)' },
  expansao: { label: 'Expansão', color: '#ff9500', bg: 'rgba(255,149,0,0.1)' },
  mudanca_servico: { label: 'Mudança Serviço', color: '#00bfff', bg: 'rgba(0,191,255,0.1)' },
  oportunidade: { label: 'Oportunidade', color: '#ff6b00', bg: 'rgba(255,107,0,0.1)' },
  concorrente_novo: { label: 'Concorrente', color: '#ff4444', bg: 'rgba(255,68,68,0.1)' },
};

export default function ClinicAlertCard({ alert, onStatusChange }) {
  const det = DETECTION_LABELS[alert.detection_type] || DETECTION_LABELS.oportunidade;
  const scoreColor = alert.seamaty_fit_score >= 80 ? '#00ff88'
    : alert.seamaty_fit_score >= 60 ? '#ff9500' : '#ff4444';

  const handleContact = () => {
    if (alert.phone) {
      const msg = encodeURIComponent(
        `Olá! Vi que a ${alert.clinic_name} está em expansão. Sou da Seamaty e gostaria de apresentar nossas soluções de diagnóstico in-house. Podemos conversar?`
      );
      window.open(`https://wa.me/${alert.phone.replace(/\D/g, '')}?text=${msg}`, '_blank');
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    await base44.entities.ClinicAlert.update(alert.id, { status: newStatus });
    onStatusChange && onStatusChange(alert.id, newStatus);
  };

  return (
    <div className="rounded-2xl p-4" style={{ background: '#141414', border: `1px solid ${scoreColor}33` }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide"
              style={{ color: det.color, background: det.bg }}>
              {det.label}
            </span>
            {alert.whatsapp_alert_sent && (
              <span className="text-[10px] text-green-400 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> WA enviado
              </span>
            )}
          </div>
          <p className="font-black text-white text-sm leading-tight truncate">{alert.clinic_name}</p>
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3" /> {alert.city}{alert.state ? `/${alert.state}` : ''}
          </p>
        </div>
        {/* Score */}
        <div className="text-center shrink-0">
          <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-lg"
            style={{ background: `${scoreColor}22`, border: `2px solid ${scoreColor}`, color: scoreColor }}>
            {alert.seamaty_fit_score || '?'}
          </div>
          <p className="text-[9px] text-slate-500 mt-0.5">fit</p>
        </div>
      </div>

      {/* Info */}
      {alert.ai_summary && (
        <p className="text-xs text-slate-400 mb-3 line-clamp-2">{alert.ai_summary}</p>
      )}

      {/* Fit Reasons */}
      {alert.fit_reasons?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {alert.fit_reasons.slice(0, 3).map((r, i) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(255,107,0,0.1)', color: '#ff9500' }}>
              ✓ {r}
            </span>
          ))}
        </div>
      )}

      {/* Product & Exams */}
      <div className="flex items-center justify-between mb-3 text-xs">
        <div className="flex items-center gap-1 text-orange-400">
          <Zap className="w-3 h-3" />
          <span className="font-bold">{alert.recommended_product || 'SMT-120VP'}</span>
        </div>
        {alert.estimated_monthly_exams && (
          <span className="text-slate-500">~{alert.estimated_monthly_exams} exames/mês</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {alert.phone && (
          <button onClick={handleContact}
            className="flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1"
            style={{ background: 'rgba(0,255,136,0.15)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.3)' }}>
            <Phone className="w-3 h-3" /> Contatar WA
          </button>
        )}
        {alert.google_maps_url && (
          <a href={alert.google_maps_url} target="_blank" rel="noopener noreferrer"
            className="px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1"
            style={{ background: 'rgba(255,107,0,0.1)', color: '#ff9500', border: '1px solid rgba(255,107,0,0.2)' }}>
            <MapPin className="w-3 h-3" /> Maps
          </a>
        )}
        {alert.status === 'novo' && (
          <button onClick={() => handleStatusUpdate('em_analise')}
            className="px-3 py-2 rounded-xl text-xs font-black"
            style={{ background: 'rgba(0,191,255,0.1)', color: '#00bfff', border: '1px solid rgba(0,191,255,0.2)' }}>
            Analisar
          </button>
        )}
      </div>
    </div>
  );
}