import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, MessageSquare } from 'lucide-react';

export default function CommunicationPreferencesEditor({ clientId, currentPreferences = {} }) {
  const queryClient = useQueryClient();
  const [prefs, setPrefs] = useState({
    preferred_channel: currentPreferences.preferred_channel || 'whatsapp',
    preferred_time: currentPreferences.preferred_time || 'manha',
    frequency: currentPreferences.frequency || 'semanal'
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.update(clientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['client', clientId]);
    }
  });

  const handleChange = (field, value) => {
    const newPrefs = { ...prefs, [field]: value };
    setPrefs(newPrefs);
    
    // Salvamento automático
    updateMutation.mutate({ 
      communication_preferences: newPrefs
    });
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800">Preferências de Comunicação</h3>
          <p className="text-xs text-slate-600">Configure como prefere ser contatado</p>
        </div>
        {updateMutation.isPending && (
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
        )}
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-xs text-slate-600">Canal Preferido</Label>
          <Select
            value={prefs.preferred_channel}
            onValueChange={(v) => handleChange('preferred_channel', v)}
          >
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
              <SelectItem value="email">📧 Email</SelectItem>
              <SelectItem value="telefone">📞 Telefone</SelectItem>
              <SelectItem value="presencial">🤝 Presencial</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-slate-600">Horário Preferido</Label>
          <Select
            value={prefs.preferred_time}
            onValueChange={(v) => handleChange('preferred_time', v)}
          >
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manha">☀️ Manhã</SelectItem>
              <SelectItem value="tarde">🌤️ Tarde</SelectItem>
              <SelectItem value="noite">🌙 Noite</SelectItem>
              <SelectItem value="qualquer">🕐 Qualquer horário</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-slate-600">Frequência de Contato</Label>
          <Select
            value={prefs.frequency}
            onValueChange={(v) => handleChange('frequency', v)}
          >
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="diaria">📅 Diária</SelectItem>
              <SelectItem value="semanal">📆 Semanal</SelectItem>
              <SelectItem value="quinzenal">🗓️ Quinzenal</SelectItem>
              <SelectItem value="mensal">📋 Mensal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {updateMutation.isSuccess && (
        <div className="mt-3 p-2 bg-green-50 rounded-lg border border-green-200">
          <p className="text-xs text-green-700">✓ Salvo automaticamente</p>
        </div>
      )}
    </Card>
  );
}