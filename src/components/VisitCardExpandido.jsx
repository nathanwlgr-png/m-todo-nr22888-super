import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Copy, Eye, CheckCircle, Flame, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function VisitCardExpandido({ visit, colors, statusColors, onConfirm }) {
  const copiarEndereco = (location) => {
    navigator.clipboard.writeText(location || '');
    toast.success('Endereço copiado!');
  };

  return (
    <div className={`p-3 sm:p-4 rounded-lg border-2 transition-all hover:shadow-md ${colors.bg} ${colors.border}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-800">{visit.client_name}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge className={colors.badge}>
              {colors.icon} {visit.visit_type || 'Visita'}
            </Badge>
            <Badge className={statusColors[visit.status] || 'bg-slate-100 text-slate-600'} variant="secondary">
              {visit.status}
            </Badge>
            {visit.priority_level && <Badge variant="outline" className="text-xs">{visit.priority_level}</Badge>}
            {visit.location_status && <Badge variant="outline" className="text-xs">{visit.location_status}</Badge>}
          </div>
        </div>
      </div>

      {visit.location && (
        <p className="text-xs text-slate-600 flex items-center gap-1 mb-2">
          <MapPin className="w-3 h-3" /><strong>{visit.location}</strong>
        </p>
      )}

      {visit.visit_objective && <p className="text-xs text-slate-500 mb-1"><strong>Objetivo:</strong> {visit.visit_objective}</p>}
      {visit.projected_revenue && <p className="text-xs text-green-600 mb-1"><strong>Valor potencial:</strong> R$ {visit.projected_revenue.toLocaleString('pt-BR')}</p>}
      {visit.next_action && <p className="text-xs text-slate-500 mb-2"><strong>Próxima ação:</strong> {visit.next_action}</p>}
      {visit.notes && <p className="text-xs text-slate-500 mb-2 line-clamp-2">{visit.notes}</p>}

      {/* Botões Rápidos */}
      <div className="flex flex-wrap gap-1 mt-3 pt-2 border-t border-slate-300">
        <Link to={`/ClientProfile?id=${visit.client_id}`}>
          <Button size="sm" variant="outline" className="text-xs">
            <Eye className="w-3 h-3 mr-1" /> Ver
          </Button>
        </Link>
        {visit.location && (
          <>
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => copiarEndereco(visit.location)}
            >
              <Copy className="w-3 h-3 mr-1" /> Copiar
            </Button>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(visit.location)}`}
              target="_blank" rel="noreferrer"
              className="inline-flex"
            >
              <Button size="sm" variant="outline" className="text-xs">
                <MapPin className="w-3 h-3 mr-1" /> Maps
              </Button>
            </a>
          </>
        )}
        <Button
          size="sm"
          variant="outline"
          className="text-xs"
          onClick={() => onConfirm({ acao: 'Marcar como realizada', visitId: visit.id, dados: { status: 'realizada' } })}
        >
          <CheckCircle className="w-3 h-3 mr-1" /> Realizada
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-xs"
          onClick={() => onConfirm({ acao: 'Marcar como pós-venda', visitId: visit.id, dados: { visit_type: 'pós-venda' } })}
        >
          <CheckCircle className="w-3 h-3 mr-1" /> Pós-venda
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-xs"
          onClick={() => onConfirm({ acao: 'Marcar como cliente quente', visitId: visit.id, dados: { visit_type: 'cliente quente' } })}
        >
          <Flame className="w-3 h-3 mr-1" /> Quente
        </Button>
      </div>
    </div>
  );
}