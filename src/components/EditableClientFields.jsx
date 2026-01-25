import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Edit2,
  Save,
  X,
  Phone,
  Mail,
  MapPin,
  Building2,
  Instagram,
  Facebook,
  Globe,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

export default function EditableClientFields({ client, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setEditData({
      first_name: client.first_name || '',
      full_name: client.full_name || '',
      clinic_name: client.clinic_name || '',
      phone: client.phone || '',
      email: client.email || '',
      address: client.address || '',
      city: client.city || '',
      cep: client.cep || '',
      cnpj: client.cnpj || '',
      instagram_handle: client.instagram_handle || '',
      facebook_url: client.facebook_url || '',
      website: client.website || '',
      notes: client.notes || ''
    });
    setEditing(true);
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      await base44.entities.Client.update(client.id, editData);
      toast.success('Alterações salvas!');
      setEditing(false);
      if (onUpdate) onUpdate(editData);
    } catch (error) {
      toast.error('Erro ao salvar');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <Card className="p-4 bg-gradient-to-r from-slate-50 to-gray-50 border-2 border-slate-300">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-slate-800">📝 Dados do Cliente</h3>
          <Button
            onClick={startEdit}
            size="sm"
            variant="outline"
          >
            <Edit2 className="w-4 h-4 mr-1" />
            Editar
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-2 text-sm">
          <div className="p-2 bg-white rounded border border-slate-200">
            <p className="text-xs text-slate-500">Nome</p>
            <p className="font-semibold text-slate-800">{client.first_name}</p>
          </div>
          <div className="p-2 bg-white rounded border border-slate-200">
            <p className="text-xs text-slate-500">Nome Completo</p>
            <p className="font-semibold text-slate-800">{client.full_name || '-'}</p>
          </div>
          <div className="p-2 bg-white rounded border border-slate-200">
            <p className="text-xs text-slate-500">Clínica</p>
            <p className="font-semibold text-slate-800">{client.clinic_name || '-'}</p>
          </div>
          <div className="p-2 bg-white rounded border border-slate-200">
            <p className="text-xs text-slate-500">Telefone/WhatsApp</p>
            <p className="font-semibold text-slate-800">{client.phone || '-'}</p>
          </div>
          <div className="p-2 bg-white rounded border border-slate-200">
            <p className="text-xs text-slate-500">Email</p>
            <p className="font-semibold text-slate-800">{client.email || '-'}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-white border-2 border-indigo-300">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-800">✏️ Editando Cliente</h3>
        <Button
          onClick={() => setEditing(false)}
          size="sm"
          variant="ghost"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-slate-600 mb-1 block">Nome (para numerologia)</label>
          <Input
            value={editData.first_name}
            onChange={(e) => setEditData({...editData, first_name: e.target.value})}
            placeholder="Primeiro nome do proprietário/veterinário"
          />
        </div>

        <div>
          <label className="text-xs text-slate-600 mb-1 block">Nome Completo</label>
          <Input
            value={editData.full_name}
            onChange={(e) => setEditData({...editData, full_name: e.target.value})}
            placeholder="Nome completo"
          />
        </div>

        <div>
          <label className="text-xs text-slate-600 mb-1 block">Nome da Clínica</label>
          <Input
            value={editData.clinic_name}
            onChange={(e) => setEditData({...editData, clinic_name: e.target.value})}
            placeholder="Nome da clínica veterinária"
          />
        </div>

        <div>
          <label className="text-xs text-slate-600 mb-1 block">Telefone/WhatsApp</label>
          <Input
            value={editData.phone}
            onChange={(e) => setEditData({...editData, phone: e.target.value})}
            placeholder="5511999999999"
          />
        </div>

        <div>
          <label className="text-xs text-slate-600 mb-1 block">Email</label>
          <Input
            type="email"
            value={editData.email}
            onChange={(e) => setEditData({...editData, email: e.target.value})}
            placeholder="email@clinica.com"
          />
        </div>

        <div>
          <label className="text-xs text-slate-600 mb-1 block">Endereço</label>
          <Input
            value={editData.address}
            onChange={(e) => setEditData({...editData, address: e.target.value})}
            placeholder="Rua, número, bairro"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-slate-600 mb-1 block">Cidade</label>
            <Input
              value={editData.city}
              onChange={(e) => setEditData({...editData, city: e.target.value})}
              placeholder="Cidade"
            />
          </div>
          <div>
            <label className="text-xs text-slate-600 mb-1 block">CEP</label>
            <Input
              value={editData.cep}
              onChange={(e) => setEditData({...editData, cep: e.target.value})}
              placeholder="00000-000"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-600 mb-1 block">CNPJ</label>
          <Input
            value={editData.cnpj}
            onChange={(e) => setEditData({...editData, cnpj: e.target.value})}
            placeholder="00.000.000/0000-00"
          />
        </div>

        <div>
          <label className="text-xs text-slate-600 mb-1 block">Instagram</label>
          <Input
            value={editData.instagram_handle}
            onChange={(e) => setEditData({...editData, instagram_handle: e.target.value})}
            placeholder="usuario (sem @)"
          />
        </div>

        <div>
          <label className="text-xs text-slate-600 mb-1 block">Facebook URL</label>
          <Input
            value={editData.facebook_url}
            onChange={(e) => setEditData({...editData, facebook_url: e.target.value})}
            placeholder="https://facebook.com/..."
          />
        </div>

        <div>
          <label className="text-xs text-slate-600 mb-1 block">Website</label>
          <Input
            value={editData.website}
            onChange={(e) => setEditData({...editData, website: e.target.value})}
            placeholder="https://clinica.com.br"
          />
        </div>

        <div>
          <label className="text-xs text-slate-600 mb-1 block">Notas</label>
          <Textarea
            value={editData.notes}
            onChange={(e) => setEditData({...editData, notes: e.target.value})}
            placeholder="Observações gerais..."
            rows={3}
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={saveChanges}
            disabled={saving}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {saving ? (
              <>
                <Save className="w-4 h-4 mr-1 animate-pulse" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-1" />
                Salvar
              </>
            )}
          </Button>
          <Button
            onClick={() => setEditing(false)}
            variant="outline"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}