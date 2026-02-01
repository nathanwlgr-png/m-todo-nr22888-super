import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pencil, Check, X } from 'lucide-react';
import { toast } from 'sonner';

export default function EditableClientName({ client, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(client?.first_name || '');
  const [saving, setSaving] = useState(false);

  if (!client) return null;

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Nome não pode estar vazio');
      return;
    }

    setSaving(true);
    try {
      await base44.entities.Client.update(client.id, { first_name: name.trim() });
      toast.success('Nome atualizado!');
      setEditing(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('Erro ao atualizar');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(client.first_name || '');
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-semibold text-slate-800">
          {client.first_name || '(Nome não definido)'}
        </span>
        <button
          onClick={() => setEditing(true)}
          className="p-1 hover:bg-slate-100 rounded"
        >
          <Pencil className="w-3 h-3 text-slate-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSave()}
        placeholder="Nome do decisor..."
        className="h-8 text-sm"
        autoFocus
      />
      <Button
        size="sm"
        onClick={handleSave}
        disabled={saving}
        className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700"
      >
        <Check className="w-4 h-4" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={handleCancel}
        className="h-8 w-8 p-0"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}