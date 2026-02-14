import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Download, 
  Send, 
  FileText, 
  X,
  Check,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function FloatingExportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [documentUrl, setDocumentUrl] = useState(null);
  const [documentName, setDocumentName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [sending, setSending] = useState(false);

  // Listener para receber documentos gerados
  useEffect(() => {
    const handleDocumentReady = (event) => {
      if (event.detail?.url && event.detail?.name) {
        setDocumentUrl(event.detail.url);
        setDocumentName(event.detail.name);
        setIsOpen(true);
        toast.success('Documento pronto para exportação!');
      }
    };

    window.addEventListener('documentReady', handleDocumentReady);
    return () => window.removeEventListener('documentReady', handleDocumentReady);
  }, []);

  const handleDownload = () => {
    if (!documentUrl) {
      toast.error('Nenhum documento disponível');
      return;
    }

    const link = document.createElement('a');
    link.href = documentUrl;
    link.download = documentName || 'documento.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Download iniciado!');
  };

  const handleSendWhatsApp = async () => {
    if (!documentUrl) {
      toast.error('Nenhum documento disponível');
      return;
    }

    if (!whatsappNumber || whatsappNumber.length < 10) {
      toast.error('Número de WhatsApp inválido');
      return;
    }

    setSending(true);
    try {
      const response = await base44.functions.invoke('sendDocumentToWhatsapp', {
        documentUrl,
        documentName,
        phoneNumber: whatsappNumber.replace(/\D/g, '')
      });

      if (response.data.success) {
        toast.success('Documento enviado via WhatsApp!');
        setWhatsappNumber('');
      } else {
        toast.error(response.data.error || 'Erro ao enviar');
      }
    } catch (error) {
      toast.error('Erro ao enviar: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  const handleCopyLink = () => {
    if (!documentUrl) {
      toast.error('Nenhum documento disponível');
      return;
    }

    navigator.clipboard.writeText(documentUrl);
    toast.success('Link copiado!');
  };

  if (!isOpen && !documentUrl) return null;

  return (
    <div className="fixed top-20 right-4 z-50">
      {isOpen ? (
        <Card className="w-80 p-4 shadow-2xl bg-white border-2 border-indigo-400">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900">Exportar Documento</h3>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {documentUrl && (
            <div className="space-y-3">
              <div className="p-2 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-600 font-medium mb-1">Documento:</p>
                <p className="text-sm text-slate-900 truncate">{documentName}</p>
              </div>

              {/* Download Direto */}
              <Button
                onClick={handleDownload}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Baixar Arquivo
              </Button>

              {/* Copiar Link */}
              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="w-full"
              >
                <Check className="w-4 h-4 mr-2" />
                Copiar Link
              </Button>

              {/* Enviar WhatsApp */}
              <div className="pt-3 border-t">
                <Label className="text-xs text-slate-600 mb-2 block">
                  Enviar via WhatsApp
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="5514999999999"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendWhatsApp}
                    disabled={sending || !whatsappNumber}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Formato: código país + DDD + número
                </p>
              </div>

              {/* Formatos Disponíveis */}
              <div className="pt-3 border-t">
                <p className="text-xs text-slate-600 mb-2">Formatos suportados:</p>
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">PDF</span>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Excel</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Word</span>
                </div>
              </div>
            </div>
          )}
        </Card>
      ) : (
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 shadow-lg"
          size="icon"
        >
          <FileText className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
}