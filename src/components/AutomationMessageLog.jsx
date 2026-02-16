import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { 
  MessageCircle, Search, Filter, CheckCircle2, 
  Clock, AlertCircle, TrendingUp, Download
} from 'lucide-react';

export default function AutomationMessageLog() {
  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todas');
  const [typeFilter, setTypeFilter] = useState('todos');

  useEffect(() => {
    loadMessages();
    // Auto-atualizar a cada 30 segundos
    const interval = setInterval(loadMessages, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterMessages();
  }, [messages, searchTerm, statusFilter, typeFilter]);

  const loadMessages = async () => {
    try {
      const allMessages = await base44.entities.AutomatedMessageLog.list();
      setMessages(allMessages.sort((a, b) => 
        new Date(b.sent_at || b.created_date) - new Date(a.sent_at || a.created_date)
      ));
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterMessages = () => {
    let filtered = messages;

    if (searchTerm) {
      filtered = filtered.filter(msg => 
        msg.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.client_phone?.includes(searchTerm)
      );
    }

    if (statusFilter !== 'todas') {
      filtered = filtered.filter(msg => msg.sent_status === statusFilter);
    }

    if (typeFilter !== 'todos') {
      filtered = filtered.filter(msg => msg.message_type === typeFilter);
    }

    setFilteredMessages(filtered);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'enviada': return 'bg-green-100 text-green-800';
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'falha': return 'bg-red-100 text-red-800';
      case 'bloqueado': return 'bg-gray-100 text-gray-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'enviada': return <CheckCircle2 className="w-4 h-4" />;
      case 'pendente': return <Clock className="w-4 h-4" />;
      case 'falha': return <AlertCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const stats = {
    total: messages.length,
    enviadas: messages.filter(m => m.sent_status === 'enviada').length,
    respostas: messages.filter(m => m.response_received).length,
    taxa_sucesso: messages.length > 0 
      ? ((messages.filter(m => m.response_received).length / messages.filter(m => m.sent_status === 'enviada').length) * 100).toFixed(1)
      : 0
  };

  if (loading) {
    return <p className="text-slate-500">Carregando histórico...</p>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-5 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <div className="flex items-center gap-3 mb-4">
          <MessageCircle className="w-6 h-6 text-purple-600" />
          <div>
            <h3 className="font-bold text-slate-800">Histórico de Mensagens Automáticas</h3>
            <p className="text-xs text-slate-600">Veja todas as mensagens que foram enviadas automaticamente</p>
          </div>
        </div>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="p-3 text-center bg-blue-50 border-blue-200">
          <p className="text-xs text-blue-600 font-semibold">Total</p>
          <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
        </Card>
        <Card className="p-3 text-center bg-green-50 border-green-200">
          <p className="text-xs text-green-600 font-semibold">Enviadas</p>
          <p className="text-2xl font-bold text-green-700">{stats.enviadas}</p>
        </Card>
        <Card className="p-3 text-center bg-purple-50 border-purple-200">
          <p className="text-xs text-purple-600 font-semibold">Respostas</p>
          <p className="text-2xl font-bold text-purple-700">{stats.respostas}</p>
        </Card>
        <Card className="p-3 text-center bg-orange-50 border-orange-200">
          <p className="text-xs text-orange-600 font-semibold">Taxa Sucesso</p>
          <p className="text-2xl font-bold text-orange-700">{stats.taxa_sucesso}%</p>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-4 space-y-3">
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-48">
            <Input
              placeholder="Buscar por nome ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todos Status</SelectItem>
              <SelectItem value="enviada">Enviadas</SelectItem>
              <SelectItem value="pendente">Pendentes</SelectItem>
              <SelectItem value="falha">Falhas</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Tipos</SelectItem>
              <SelectItem value="turbo_venda">Turbo Venda</SelectItem>
              <SelectItem value="follow_up">Follow-up</SelectItem>
              <SelectItem value="conquistar">Conquistar</SelectItem>
              <SelectItem value="reativacao">Reativação</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Lista de Mensagens */}
      {filteredMessages.length === 0 ? (
        <Card className="p-8 text-center">
          <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500">Nenhuma mensagem encontrada</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredMessages.map((msg, idx) => (
            <Card key={idx} className="p-4 border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="font-semibold text-slate-800">{msg.client_name}</h5>
                    <Badge className={getStatusColor(msg.sent_status)}>
                      {getStatusIcon(msg.sent_status)}
                      <span className="ml-1">{msg.sent_status}</span>
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {msg.message_type}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-slate-700 mb-2 line-clamp-2">
                    "{msg.message_content}"
                  </p>

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>📱 {msg.client_phone}</span>
                    <span>🕐 {msg.sent_at ? format(new Date(msg.sent_at), 'dd/MM HH:mm') : 'Pendente'}</span>
                    {msg.trigger_reason && (
                      <span>💡 {msg.trigger_reason}</span>
                    )}
                  </div>
                </div>

                {msg.response_received && (
                  <div className="ml-4 p-2 bg-green-50 rounded-lg flex-shrink-0">
                    <p className="text-xs font-semibold text-green-700 mb-1">✓ Resposta</p>
                    <p className="text-xs text-green-600 max-w-xs line-clamp-2">
                      {msg.response_content}
                    </p>
                    <p className="text-xs text-green-500 mt-1">
                      {msg.response_at && format(new Date(msg.response_at), 'HH:mm')}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Ações */}
      <div className="flex gap-2 justify-center pt-4">
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
        <Button variant="outline" size="sm">
          <TrendingUp className="w-4 h-4 mr-2" />
          Ver Relatório
        </Button>
      </div>
    </div>
  );
}