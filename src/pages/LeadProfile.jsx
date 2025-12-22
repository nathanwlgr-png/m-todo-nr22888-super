import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  UserPlus,
  CheckCircle,
  XCircle,
  Loader2,
  Users as UsersIcon,
  Target
} from 'lucide-react';
import { getLeadQuality } from '@/components/LeadScoringEngine';
import { format } from 'date-fns';
import { toast } from 'sonner';
import QuickWhatsAppSend from '@/components/QuickWhatsAppSend';

export default function LeadProfile() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const leadId = urlParams.get('id');
  const queryClient = useQueryClient();

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');

  const { data: lead, isLoading } = useQuery({
    queryKey: ['lead', leadId],
    queryFn: async () => {
      const leads = await base44.entities.Lead.filter({ id: leadId });
      return leads[0];
    },
    enabled: !!leadId
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Lead.update(leadId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['lead', leadId]);
      queryClient.invalidateQueries(['leads']);
      toast.success('Lead atualizado!');
    }
  });

  const convertMutation = useMutation({
    mutationFn: async () => {
      const clientData = {
        first_name: lead.full_name,
        email: lead.email,
        phone: lead.phone,
        clinic_name: lead.company,
        city: lead.city,
        client_type: 'clinica_pequena',
        decision_role: 'proprietario',
        notes: lead.notes
      };
      
      const client = await base44.entities.Client.create(clientData);
      
      await base44.entities.Lead.update(leadId, {
        status: 'convertido',
        converted_to_client_id: client.id
      });

      return client;
    },
    onSuccess: (client) => {
      queryClient.invalidateQueries(['lead', leadId]);
      queryClient.invalidateQueries(['leads']);
      queryClient.invalidateQueries(['clients']);
      toast.success('Lead convertido em cliente!');
      navigate(createPageUrl(`ClientProfile?id=${client.id}`));
    }
  });

  const handleAssign = () => {
    if (!selectedUser) return;
    const user = users.find(u => u.email === selectedUser);
    updateMutation.mutate({
      assigned_to: user.email,
      assigned_to_name: user.full_name
    });
    setAssignDialogOpen(false);
  };

  const handleStatusChange = (status) => {
    updateMutation.mutate({ status });
  };

  const handleConvert = () => {
    convertMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Lead não encontrado</p>
      </div>
    );
  }

  const quality = getLeadQuality(lead.lead_score || 0);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-900 px-4 pt-4 pb-24 rounded-b-[2rem] overflow-hidden">
        <div className="relative flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full glass hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-lg font-semibold text-white">Perfil do Lead</h1>
        </div>

        <div className="relative flex items-center gap-4">
          <div className={`w-20 h-20 rounded-2xl ${quality.color} flex items-center justify-center shadow-lg`}>
            <span className="text-3xl font-bold text-white">{lead.lead_score || 0}</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{lead.full_name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={`${quality.color} text-white text-xs`}>{quality.label}</Badge>
              <Badge className="bg-white/20 text-white text-xs">{lead.status}</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 -mt-16 space-y-4">
        {/* Quick Actions */}
        {lead.status !== 'convertido' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => setAssignDialogOpen(true)}
                variant="outline"
                className="h-12 border-2"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Atribuir
              </Button>
              <Button
                onClick={() => setConvertDialogOpen(true)}
                className="h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <Target className="w-4 h-4 mr-2" />
                Converter
              </Button>
            </div>

            {/* WhatsApp */}
            {lead.phone && (
              <QuickWhatsAppSend
                contactId={lead.id}
                contactName={lead.full_name}
                contactPhone={lead.phone}
              />
            )}
          </>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-4">
          {lead.company && (
            <Card className="p-4 bg-white shadow-lg border-none">
              <p className="text-xs text-slate-500 mb-1">Empresa</p>
              <p className="font-semibold text-slate-800 text-sm">{lead.company}</p>
            </Card>
          )}
          {lead.city && (
            <Card className="p-4 bg-white shadow-lg border-none">
              <p className="text-xs text-slate-500 mb-1">Cidade</p>
              <p className="font-semibold text-slate-800 text-sm">{lead.city}</p>
            </Card>
          )}
          {lead.email && (
            <Card className="p-4 bg-white shadow-lg border-none">
              <p className="text-xs text-slate-500 mb-1">Email</p>
              <p className="font-semibold text-slate-800 text-xs truncate">{lead.email}</p>
            </Card>
          )}
          {lead.phone && (
            <Card className="p-4 bg-white shadow-lg border-none">
              <p className="text-xs text-slate-500 mb-1">Telefone</p>
              <p className="font-semibold text-slate-800 text-sm">{lead.phone}</p>
            </Card>
          )}
        </div>

        {/* Status Actions */}
        {lead.status !== 'convertido' && (
          <Card className="p-4">
            <h3 className="font-semibold text-slate-800 mb-3">Alterar Status</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => handleStatusChange('contatado')}
                variant="outline"
                size="sm"
                disabled={lead.status === 'contatado'}
              >
                Contatado
              </Button>
              <Button
                onClick={() => handleStatusChange('qualificado')}
                variant="outline"
                size="sm"
                disabled={lead.status === 'qualificado'}
                className="border-green-200 text-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Qualificado
              </Button>
              <Button
                onClick={() => handleStatusChange('desqualificado')}
                variant="outline"
                size="sm"
                disabled={lead.status === 'desqualificado'}
                className="border-red-200 text-red-700"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Desqualificado
              </Button>
            </div>
          </Card>
        )}

        {/* Details */}
        {lead.interest && (
          <Card className="p-4">
            <p className="text-xs text-slate-500 mb-1">Interesse</p>
            <p className="text-slate-700">{lead.interest}</p>
          </Card>
        )}

        {lead.assigned_to_name && (
          <Card className="p-4 bg-purple-50 border-purple-200">
            <p className="text-xs text-purple-600 mb-1">Responsável</p>
            <p className="font-semibold text-purple-800">{lead.assigned_to_name}</p>
          </Card>
        )}

        {lead.notes && (
          <Card className="p-4">
            <p className="text-xs text-slate-500 mb-1">Observações</p>
            <p className="text-slate-700">{lead.notes}</p>
          </Card>
        )}
      </div>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atribuir Lead</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Vendedor</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.email}>
                      {user.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAssign} className="w-full bg-purple-600 hover:bg-purple-700">
              Atribuir
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Convert Dialog */}
      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Converter em Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-600">
              Este lead será convertido em cliente e transferido para o sistema de gestão de clientes.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={handleConvert}
                disabled={convertMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {convertMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Converter'
                )}
              </Button>
              <Button variant="outline" onClick={() => setConvertDialogOpen(false)} className="flex-1">
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}