import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
  MessageSquare, Mail, CheckCircle, XCircle, Clock, 
  MessageCircle, Search, Download, Eye
} from 'lucide-react';

export default function MessageHistory() {
  const [filter, setFilter] = useState('todas');
  const [search, setSearch] = useState('');

  const { data: sentMessages = [], isLoading } = useQuery({
    queryKey: ['message-history'],
    queryFn: () => base44.entities.AutomatedMessageLog?.list('-sent_at', 100).catch(() => []),
    refetchInterval: 10000
  });

  const filteredMessages = sentMessages.filter(msg => {
    const matchesFilter = filter === 'todas' || msg.sent_status === filter;
    const matchesSearch = msg.client_name?.toLowerCase().includes(search.toLowerCase()) ||
                         msg.client_phone?.includes(search) ||
                         msg.message_content?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: sentMessages.length,
    sent: sentMessages.filter(m => m.sent_status === 'enviada').length,
    pending: sentMessages.filter(m => m.sent_status === 'pendente').length,
    failed: sentMessages.filter(m => m.sent_status === 'falha').length,
    blocked: sentMessages.filter(m => m.sent_status === 'bloqueado').length
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'enviada': return 'bg-green-500';
      case 'pendente': return 'bg-orange-500';
      case 'falha': return 'bg-red-500';
      case 'bloqueado': return 'bg-gray-500';
      default: return 'bg-slate-500';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'enviada': return <CheckCircle className="w-4 h-4" />;
      case 'pendente': return <Clock className="w-4 h-4" />;
      case 'falha': return <XCircle className="w-4 h-4" />;
      case 'bloqueado': return <XCircle className="w-4 h-4" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <Card className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
        <CardHeader>
          <CardTitle className="text-2xl">Histórico de Mensagens</CardTitle>
          <p className="text-blue-100">
            Acompanhe todas as mensagens automáticas enviadas
          </p>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            <p className="text-xs text-slate-600">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
            <p className="text-xs text-slate-600">Enviadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
            <p className="text-xs text-slate-600">Pendentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
            <p className="text-xs text-slate-600">Falhadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-gray-600">{stats.blocked}</p>
            <p className="text-xs text-slate-600">Bloqueadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-col md:flex-row">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar por cliente, telefone ou conteúdo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="todas" onValueChange={setFilter}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="todas">Todas ({stats.total})</TabsTrigger>
          <TabsTrigger value="enviada" className="text-green-600">Enviadas ({stats.sent})</TabsTrigger>
          <TabsTrigger value="pendente" className="text-orange-600">Pendentes ({stats.pending})</TabsTrigger>
          <TabsTrigger value="falha" className="text-red-600">Falhadas ({stats.failed})</TabsTrigger>
          <TabsTrigger value="bloqueado" className="text-gray-600">Bloqueadas ({stats.blocked})</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="space-y-3">
          {filteredMessages.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-slate-600">Nenhuma mensagem encontrada</p>
              </CardContent>
            </Card>
          ) : (
            filteredMessages.map((msg) => (
              <Card key={msg.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      {msg.message_type?.includes('whatsapp') ? (
                        <MessageSquare className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                      ) : (
                        <Mail className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{msg.client_name}</h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {msg.message_type} • {msg.trigger_reason}
                        </p>
                        <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded line-clamp-2">
                          {msg.message_content}
                        </p>
                      </div>
                    </div>
                    <div className="text-right ml-3">
                      <Badge className={`${getStatusColor(msg.sent_status)} text-white mb-2 flex items-center gap-1 justify-end`}>
                        {getStatusIcon(msg.sent_status)}
                        {msg.sent_status === 'enviada' ? 'Enviada' : 
                         msg.sent_status === 'pendente' ? 'Pendente' :
                         msg.sent_status === 'falha' ? 'Falhada' : 'Bloqueada'}
                      </Badge>
                      <p className="text-xs text-gray-600">
                        {msg.sent_at ? new Date(msg.sent_at).toLocaleString('pt-BR') : 'Não enviada'}
                      </p>
                    </div>
                  </div>

                  {msg.response_received && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-2 mt-3">
                      <p className="text-xs font-semibold text-blue-900 mb-1">Resposta recebida:</p>
                      <p className="text-sm text-blue-800">{msg.response_content}</p>
                      <p className="text-xs text-blue-600 mt-1">
                        {msg.response_at && new Date(msg.response_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}