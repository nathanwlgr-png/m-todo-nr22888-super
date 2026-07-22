import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function CatalogPhotoUpload() {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!title.trim() || !file) return toast.error('Informe o título e selecione a foto.');
    setSaving(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.SeamatyImage.create({ image_url: file_url, title: title.trim(), category: 'produto', rights_owner: 'Seamaty Brasil', usage_restrictions: ['comercial'], approved_for_marketing_ai: true, can_modify: false, is_active: true, upload_date: new Date().toISOString() });
      setTitle(''); setFile(null); toast.success('Foto adicionada à galeria oficial.');
    } catch (error) { toast.error(error.message || 'Erro ao enviar a foto.'); }
    finally { setSaving(false); }
  };
  return <section className="rounded-2xl border bg-card p-4">
    <h2 className="mb-1 font-bold">Adicionar foto oficial</h2><p className="mb-3 text-xs text-muted-foreground">Use somente foto autorizada da Seamaty Brasil.</p>
    <div className="space-y-2"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Produto ou equipamento" /><Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} /><Button onClick={save} disabled={saving || !file || !title.trim()} className="w-full gap-2"><Upload className="h-4 w-4" />{saving ? 'Enviando...' : 'Adicionar foto'}</Button></div>
  </section>;
}