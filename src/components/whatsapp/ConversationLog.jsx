import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  MessageSquare, Clock, User, Bot, Search, Filter,
  Check, Copy, ChevronDown, ChevronUp, ArrowUp, ArrowDown
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function getRelativeTime(dateStr) {
  try {
    const date = new Date(dateStr);
    if (isNaN(date)) return '—';
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  } catch {
    return '—';
  }
}

function getFullTime(dateStr) {
  try {
    return format(new Date(dateStr), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR });
  } catch {
    return '—';
  }
}

const STATUS_CONFIG = {
  sent:      { label: 'Enviada',   className: 'bg-blue-100 text-blue-700' },
  delivered: { label: 'Entregue',  className: 'bg-green-100 text-green-700' },
  read:      { label: 'Lida',      className: 'bg-emerald-100 text-emerald-700' },
  failed:    { label: 'Falhou',    className: 'bg-red-100 text-red-700' },
};

export default function ConversationLog({ messages = [], loading = false, onRefresh }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | sent | received | automated
  const [copied, setCopied] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast.success('Copiado!');
  };

  const filtered = messages.filter(msg => {
    const matchSearch = !search ||
      msg.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
      msg.message?.toLowerCase().includes(search.toLowerCase()) ||
      msg.sent_by_name?.toLowerCase().includes(search.toLowerCase());

    const matchFilter =
      filter === 'all' ? true :
      filter === 'sent' ? msg.direction === 'sent' :
      filter === 'received' ? msg.direction === 'received' :
      filter === 'automated' ? msg.automated === true :
      filter === 'manual' ? msg.automated === false :
      true;

    return matchSearch && matchFilter;
  });

  // Group messages by date
  const grouped = filtered.reduce((acc, msg) => {
    const dateKey = msg.created_date
      ? format(new Date(msg.created_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
      : 'Data desconhecida';
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(msg);
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar mensagens..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={showFilters ? 'border-indigo-500 text-indigo-600' : ''}
        >
          <Filter className="w-3.5 h-3.5 mr-1" />
          Filtros
          {filter !== 'all' && <Badge className="ml-1 bg-indigo-600 text-[10px] px-1">1</Badge>}
        </Button>

        <Button size="sm" variant="outline" onClick={onRefresh}>
          Atualizar
        </Button>
      </div>

      {showFilters && (
        <div className="flex gap-2 flex-wrap bg-slate-50 p-3 rounded-lg">
          {[
            { value: 'all', label: 'Todas' },
            { value: 'sent', label: '↑ Enviadas' },
            { value: 'received', label: '↓ Recebidas' },
            { value: 'automated', label: '🤖 Automáticas' },
            { value: 'manual', label: '👤 Manuais' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === opt.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border text-slate-600 hover:bg-slate-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Stats row */}
      <div className="flex gap-3 text-xs text-slate-500">
        <span>{filtered.length} mensagens</span>
        <span>•</span>
        <span>{messages.filter(m => m.direction === 'sent').length} enviadas</span>
        <span>•</span>
        <span>{messages.filter(m => m.automated).length} automáticas</span>
      </div>

      {/* Messages grouped by date */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm">Carregando...</p>
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nenhuma mensagem encontrada</p>
        </div>
      ) : (
        Object.entries(grouped).map(([dateLabel, dayMessages]) => (
          <div key={dateLabel}>
            {/* Date separator */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{dateLabel}</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <div className="space-y-2">
              {dayMessages.map(msg => {
                const isSent = msg.direction === 'sent';
                const statusCfg = STATUS_CONFIG[msg.status] || { label: msg.status, className: 'bg-slate-100 text-slate-600' };
                const isExpanded = expanded === msg.id;

                return (
                  <Card
                    key={msg.id}
                    className={`transition-all border-l-4 ${
                      isSent ? 'border-l-green-500' : 'border-l-blue-500'
                    } ${isExpanded ? 'shadow-md' : ''}`}
                  >
                    <CardContent className="p-3">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Direction icon */}
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            isSent ? 'bg-green-100' : 'bg-blue-100'
                          }`}>
                            {isSent
                              ? <ArrowUp className="w-3 h-3 text-green-600" />
                              : <ArrowDown className="w-3 h-3 text-blue-600" />
                            }
                          </div>

                          <span className="font-semibold text-sm text-slate-800">
                            {msg.contact_name || 'Desconhecido'}
                          </span>

                          <Badge className={statusCfg.className + ' text-[10px] px-1.5'}>
                            {statusCfg.label}
                          </Badge>

                          {msg.automated && (
                            <Badge className="bg-purple-100 text-purple-700 text-[10px] px-1.5 flex items-center gap-1">
                              <Bot className="w-2.5 h-2.5" /> Auto
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => handleCopy(msg.message, msg.id)}
                          >
                            {copied === msg.id
                              ? <Check className="w-3 h-3 text-green-600" />
                              : <Copy className="w-3 h-3 text-slate-400" />
                            }
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => setExpanded(isExpanded ? null : msg.id)}
                          >
                            {isExpanded
                              ? <ChevronUp className="w-3 h-3 text-slate-400" />
                              : <ChevronDown className="w-3 h-3 text-slate-400" />
                            }
                          </Button>
                        </div>
                      </div>

                      {/* Message preview / full */}
                      <p className={`text-sm text-slate-600 ${isExpanded ? '' : 'line-clamp-2'}`}>
                        {msg.message}
                      </p>

                      {/* Timestamp + user - always visible */}
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span title={getFullTime(msg.created_date)}>
                            {getRelativeTime(msg.created_date)}
                          </span>
                        </span>

                        <span className="text-slate-300">•</span>

                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 opacity-0" />
                          {getFullTime(msg.created_date)}
                        </span>

                        {(msg.sent_by_name || msg.sent_by) && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {msg.sent_by_name || msg.sent_by}
                            </span>
                          </>
                        )}

                        {msg.contact_phone && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span>{msg.contact_phone}</span>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}