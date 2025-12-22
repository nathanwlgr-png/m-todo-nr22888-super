import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Mail, Phone, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ContactSettings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const u = await base44.auth.me();
      setEmail(u.email || '');
      setWhatsapp(u.whatsapp_number || '');
      return u;
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['current-user']);
      toast.success('Contatos atualizados com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar contatos');
    }
  });

  const handleSave = () => {
    // Validação básica
    if (!email || !email.includes('@')) {
      toast.error('Email inválido');
      return;
    }

    // Remove caracteres não numéricos do WhatsApp
    const cleanWhatsapp = whatsapp.replace(/\D/g, '');
    
    if (cleanWhatsapp && cleanWhatsapp.length < 10) {
      toast.error('WhatsApp inválido. Use formato: 5511999999999');
      return;
    }

    updateMutation.mutate({
      email: email,
      whatsapp_number: cleanWhatsapp,
      contract_signature_email: email
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4 pt-4 pb-16 rounded-b-[2rem]">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-white">Configurar Contatos</h1>
            <p className="text-sm text-slate-300">Email e WhatsApp para notificações</p>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-8 space-y-4">
        {/* Email */}
        <Card className="p-5 bg-white shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">Email Principal</p>
              <p className="text-xs text-slate-600">Para notificações e contratos</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-slate-700">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="h-12"
            />
          </div>
        </Card>

        {/* WhatsApp */}
        <Card className="p-5 bg-white shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <Phone className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">WhatsApp</p>
              <p className="text-xs text-slate-600">Para receber alertas e comunicação</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-slate-700">Número com DDD</Label>
            <Input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="5511999999999"
              className="h-12"
            />
            <p className="text-xs text-slate-500">Formato: 5511999999999 (código país + DDD + número)</p>
          </div>
        </Card>

        {/* Info */}
        <Card className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800 mb-1">Por que configurar?</p>
              <ul className="text-xs text-slate-700 space-y-1">
                <li>• Receber alertas de clientes quentes</li>
                <li>• Notificações de tarefas urgentes</li>
                <li>• Follow-ups automáticos</li>
                <li>• Análises de IA do sistema</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg font-semibold"
        >
          {updateMutation.isPending ? (
            'Salvando...'
          ) : (
            <>
              <Check className="w-5 h-5 mr-2" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>
    </div>
  );
}