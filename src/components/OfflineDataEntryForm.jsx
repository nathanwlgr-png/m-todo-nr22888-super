import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { Plus, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function OfflineDataEntryForm() {
  const [entryType, setEntryType] = useState('visita');
  const [formData, setFormData] = useState({
    entry_date: new Date().toISOString().split('T')[0],
    clinic_name: '',
    city: '',
    client_name: '',
    contact_phone: '',
    visit_result: 'realizada',
    equipment_sold: '',
    sale_value: ''
  });
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const user = await base44.auth.me();

      const entryData = {
        user_email: user.email,
        entry_type: entryType,
        entry_date: formData.entry_date,
        clinic_name: formData.clinic_name,
        city: formData.city,
        client_name: formData.client_name,
        contact_phone: formData.contact_phone,
        synced: false,
        created_at: new Date().toISOString()
      };

      if (entryType === 'visita') {
        entryData.visit_result = formData.visit_result;
      } else {
        entryData.equipment_sold = formData.equipment_sold;
        entryData.sale_value = parseFloat(formData.sale_value);
      }

      await base44.entities.OfflineDataEntry.create(entryData);

      setSuccessMessage(`${entryType === 'visita' ? 'Visita' : 'Venda'} registrada offline com sucesso! ✓`);
      
      // Limpar formulário
      setFormData({
        entry_date: new Date().toISOString().split('T')[0],
        clinic_name: '',
        city: '',
        client_name: '',
        contact_phone: '',
        visit_result: 'realizada',
        equipment_sold: '',
        sale_value: ''
      });

      setTimeout(() => setSuccessMessage(''), 3000);
      toast.success('Dados registrados!');
    } catch (error) {
      toast.error('Erro ao salvar dados offline');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-5 bg-gradient-to-r from-cyan-50 to-blue-50 border-2 border-cyan-300">
      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
        <Plus className="w-5 h-5 text-cyan-600" />
        Registrar Dados Offline
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tipo de Entrada */}
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-2 block">Tipo de Registro</label>
          <Select value={entryType} onValueChange={setEntryType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="visita">📍 Visita</SelectItem>
              <SelectItem value="venda">💰 Venda</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Data */}
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-2 block">Data</label>
          <Input
            type="date"
            value={formData.entry_date}
            onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
          />
        </div>

        {/* Clínica */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-2 block">Clínica/Empresa</label>
            <Input
              placeholder="Nome da clínica"
              value={formData.clinic_name}
              onChange={(e) => setFormData({ ...formData, clinic_name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-2 block">Cidade</label>
            <Input
              placeholder="Cidade"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          </div>
        </div>

        {/* Cliente */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-2 block">Responsável</label>
            <Input
              placeholder="Nome"
              value={formData.client_name}
              onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-2 block">Telefone</label>
            <Input
              placeholder="WhatsApp"
              value={formData.contact_phone}
              onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
            />
          </div>
        </div>

        {/* Campos específicos por tipo */}
        {entryType === 'visita' ? (
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-2 block">Resultado da Visita</label>
            <Select value={formData.visit_result} onValueChange={(val) => setFormData({ ...formData, visit_result: val })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="realizada">✓ Realizada</SelectItem>
                <SelectItem value="agendada">📅 Agendada</SelectItem>
                <SelectItem value="cancelada">✗ Cancelada</SelectItem>
                <SelectItem value="sem_resposta">❓ Sem Resposta</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-2 block">Equipamento</label>
              <Input
                placeholder="Ex: VG2"
                value={formData.equipment_sold}
                onChange={(e) => setFormData({ ...formData, equipment_sold: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-2 block">Valor (R$)</label>
              <Input
                type="number"
                placeholder="0.00"
                value={formData.sale_value}
                onChange={(e) => setFormData({ ...formData, sale_value: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Botão */}
        <Button
          type="submit"
          disabled={saving || !formData.clinic_name}
          className="w-full bg-cyan-600 hover:bg-cyan-700"
        >
          {saving ? 'Salvando...' : 'Salvar Offline'}
        </Button>

        {successMessage && (
          <div className="p-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-sm text-green-700">
            <Check className="w-4 h-4" />
            {successMessage}
          </div>
        )}
      </form>
    </Card>
  );
}