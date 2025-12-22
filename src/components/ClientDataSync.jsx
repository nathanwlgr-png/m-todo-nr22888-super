import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Building2, User } from 'lucide-react';

export default function ClientDataSync({ clientId, currentData = {} }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    cnpj: currentData.cnpj || '',
    razao_social: currentData.razao_social || '',
    full_name: currentData.full_name || '',
    birthdate: currentData.birthdate || '',
    clinic_name: currentData.clinic_name || '',
    phone: currentData.phone || '',
    email: currentData.email || '',
    address: currentData.address || '',
    city: currentData.city || ''
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.update(clientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['client', clientId]);
      queryClient.invalidateQueries(['clients']);
    }
  });

  const handleChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    
    // Salvamento automático com debounce
    clearTimeout(window.clientSyncTimeout);
    window.clientSyncTimeout = setTimeout(() => {
      updateMutation.mutate(newData);
    }, 1000);
  };

  return (
    <Card className="p-4 bg-white border-slate-200">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800">Dados Cadastrais</h3>
          <p className="text-xs text-slate-600">Sincronizado automaticamente</p>
        </div>
        {updateMutation.isPending && (
          <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
        )}
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-xs text-slate-600">CNPJ</Label>
          <Input
            value={formData.cnpj}
            onChange={(e) => handleChange('cnpj', e.target.value)}
            placeholder="00.000.000/0000-00"
            className="bg-white"
          />
        </div>

        <div>
          <Label className="text-xs text-slate-600">Razão Social</Label>
          <Input
            value={formData.razao_social}
            onChange={(e) => handleChange('razao_social', e.target.value)}
            placeholder="Clínica Veterinária LTDA"
            className="bg-white"
          />
        </div>

        <div>
          <Label className="text-xs text-slate-600">Nome Completo</Label>
          <Input
            value={formData.full_name}
            onChange={(e) => handleChange('full_name', e.target.value)}
            placeholder="João Silva Santos"
            className="bg-white"
          />
        </div>

        <div>
          <Label className="text-xs text-slate-600">Data de Nascimento</Label>
          <Input
            type="text"
            value={formData.birthdate}
            onChange={(e) => handleChange('birthdate', e.target.value)}
            placeholder="DD/MM/AAAA ou AAAA-MM-DD"
            className="bg-white"
          />
        </div>

        <div>
          <Label className="text-xs text-slate-600">Nome da Clínica</Label>
          <Input
            value={formData.clinic_name}
            onChange={(e) => handleChange('clinic_name', e.target.value)}
            placeholder="Clínica Vida Animal"
            className="bg-white"
          />
        </div>

        <div>
          <Label className="text-xs text-slate-600">WhatsApp</Label>
          <Input
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, ''))}
            placeholder="5511999999999"
            className="bg-white"
          />
        </div>

        <div>
          <Label className="text-xs text-slate-600">Email</Label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="contato@clinica.com"
            className="bg-white"
          />
        </div>

        <div>
          <Label className="text-xs text-slate-600">Endereço</Label>
          <Input
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="Rua das Flores, 123"
            className="bg-white"
          />
        </div>

        <div>
          <Label className="text-xs text-slate-600">Cidade</Label>
          <Input
            value={formData.city}
            onChange={(e) => handleChange('city', e.target.value)}
            placeholder="São Paulo"
            className="bg-white"
          />
        </div>
      </div>

      {updateMutation.isSuccess && (
        <div className="mt-3 p-2 bg-green-50 rounded-lg border border-green-200">
          <p className="text-xs text-green-700">✓ Dados salvos e sincronizados</p>
        </div>
      )}
    </Card>
  );
}