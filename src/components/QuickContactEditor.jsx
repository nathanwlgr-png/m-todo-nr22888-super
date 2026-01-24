import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Phone, Mail, MessageCircle, Loader2 } from 'lucide-react';

export default function QuickContactEditor({ clientId, phone, email, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ phone, email });

  const handleSave = async () => {
    setLoading(true);
    try {
      await base44.entities.Client.update(clientId, {
        phone: formData.phone,
        email: formData.email
      });
      onUpdate?.({ phone: formData.phone, email: formData.email });
      setOpen(false);
    } catch (error) {
      console.error('Erro ao atualizar contato:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <MessageCircle className="w-4 h-4" />
          Editar Contato
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Editar Informações de Contato</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-2">
              <Phone className="w-4 h-4" />
              WhatsApp
            </label>
            <Input
              type="tel"
              placeholder="55 11 99999-9999"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4" />
              Email
            </label>
            <Input
              type="email"
              placeholder="email@example.com"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading} className="flex-1 gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}