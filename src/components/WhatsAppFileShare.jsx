import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, Image, FileSpreadsheet, FileText, Send, Phone, X, CheckCircle2, Link } from 'lucide-react';
import { toast } from 'sonner';

const FILE_ICONS = {
  image: { icon: Image, color: 'text-pink-500', bg: 'bg-pink-50', label: 'Imagem' },
  spreadsheet: { icon: FileSpreadsheet, color: 'text-green-600', bg: 'bg-green-50', label: 'Planilha' },
  document: { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Documento' },
};

function getFileType(file) {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.includes('sheet') || file.type.includes('excel') || file.name.endsWith('.xlsx') || file.name.endsWith('.csv') || file.name.endsWith('.xls')) return 'spreadsheet';
  return 'document';
}

export default function WhatsAppFileShare({ client }) {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [phone, setPhone] = useState(client?.phone || '');
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [sent, setSent] = useState(false);
  const fileRef = useRef(null);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 20 * 1024 * 1024) { toast.error('Arquivo muito grande (max 20MB)'); return; }
    setFile(f);
    setFileType(getFileType(f));
    setFileUrl(null);
    setSent(false);
  };

  const uploadAndShare = async () => {
    if (!file) { toast.error('Selecione um arquivo'); return; }
    if (!phone.replace(/\D/g, '')) { toast.error('Informe o telefone'); return; }
    setUploading(true);
    try {
      // Upload do arquivo para URL pública
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFileUrl(file_url);

      // Monta mensagem com link + caption
      const cleanPhone = phone.replace(/\D/g, '');
      const phoneWithCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
      
      const msg = caption
        ? `${caption}\n\n📎 ${file.name}:\n${file_url}`
        : `📎 ${file.name}:\n${file_url}`;

      const encoded = encodeURIComponent(msg);
      const waUrl = `https://wa.me/${phoneWithCountry}?text=${encoded}`;
      window.open(waUrl, '_blank');
      setSent(true);
      toast.success('WhatsApp aberto com o link do arquivo!');
    } catch (e) {
      toast.error('Erro ao enviar: ' + e.message);
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setFile(null); setFileUrl(null); setFileType(null); setSent(false);
    setCaption('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const IconComp = fileType ? FILE_ICONS[fileType]?.icon : Upload;
  const iconColor = fileType ? FILE_ICONS[fileType]?.color : 'text-slate-400';
  const iconBg = fileType ? FILE_ICONS[fileType]?.bg : 'bg-slate-50';

  return (
    <Card className="border-green-200">
      <CardContent className="p-3 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-green-500 rounded-lg flex items-center justify-center">
            <Send className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Enviar Arquivo/Imagem pelo WhatsApp</p>
            <p className="text-[10px] text-slate-500">Planilhas, imagens, PDFs — enviados como link direto</p>
          </div>
        </div>

        {/* Área de upload */}
        <div
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${file ? 'border-green-300 bg-green-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
        >
          <input ref={fileRef} type="file" className="hidden" accept="image/*,.xlsx,.xls,.csv,.pdf,.doc,.docx,.txt" onChange={handleFileChange} />
          {file ? (
            <div className="flex items-center gap-3 justify-center">
              <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center`}>
                <IconComp className={`w-5 h-5 ${iconColor}`} />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-slate-800 truncate max-w-[160px]">{file.name}</p>
                <p className="text-[10px] text-slate-500">{(file.size / 1024).toFixed(0)} KB · {FILE_ICONS[fileType]?.label}</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); reset(); }} className="ml-auto p-1 hover:bg-red-100 rounded">
                <X className="w-4 h-4 text-red-400" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="w-7 h-7 text-slate-300 mx-auto mb-1" />
              <p className="text-xs text-slate-500">Clique para selecionar</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Imagens, planilhas Excel, CSV, PDF (max 20MB)</p>
            </>
          )}
        </div>

        {/* Telefone */}
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-slate-400 shrink-0" />
          <Input
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="5514999998888 (com DDD e país)"
            className="h-8 text-sm"
          />
        </div>

        {/* Legenda */}
        <Input
          value={caption}
          onChange={e => setCaption(e.target.value)}
          placeholder="Legenda / mensagem (opcional)"
          className="h-8 text-sm"
        />

        {/* Dica */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-[10px] text-amber-700">
          💡 O arquivo será enviado como <strong>link público</strong>. Abra o WhatsApp → anexe o arquivo manualmente se preferir envio nativo.
        </div>

        <Button
          onClick={uploadAndShare}
          disabled={uploading || !file || sent}
          className={`w-full h-9 ${sent ? 'bg-green-500' : 'bg-green-600 hover:bg-green-700'}`}
        >
          {uploading ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Enviando...</>
          ) : sent ? (
            <><CheckCircle2 className="w-4 h-4 mr-2" /> WhatsApp Aberto!</>
          ) : (
            <><Send className="w-4 h-4 mr-2" /> Abrir WhatsApp com arquivo</>
          )}
        </Button>

        {fileUrl && (
          <div className="flex items-center gap-2 bg-slate-50 border rounded-lg p-2">
            <Link className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <a href={fileUrl} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-600 truncate hover:underline flex-1">{fileUrl}</a>
            <button onClick={() => { navigator.clipboard.writeText(fileUrl); toast.success('Link copiado!'); }} className="text-[10px] text-slate-400 hover:text-slate-600 shrink-0">Copiar</button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}