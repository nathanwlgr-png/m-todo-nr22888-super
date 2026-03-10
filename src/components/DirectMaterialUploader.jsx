import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Loader2, CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

export default function DirectMaterialUploader() {
  const [file, setFile] = useState(null);
  const [selectedClient, setSelectedClient] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-for-upload'],
    queryFn: () => base44.entities.Client.list('-updated_date', 50),
  });

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadAndProcess = async () => {
    if (!file) {
      toast.error('Por favor, selecione um arquivo');
      return;
    }

    if (!selectedClient) {
      toast.error('Por favor, selecione um cliente');
      return;
    }

    setProcessing(true);
    setResult(null);

    try {
      const response = await base44.functions.invoke('processarMaterialAI', {
        file: file,
        client_id: selectedClient
      });

      if (response.data.success) {
        setResult(response.data);
        toast.success('Material processado e mensagem enviada com sucesso!');
        setFile(null);
        setSelectedClient('');
      } else {
        toast.error(response.data.error || 'Erro ao processar material');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao processar o material');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="w-5 h-5 text-indigo-600" />
          Envio Direto de Material
        </CardTitle>
        <CardDescription>
          Envie imagens ou catálogos para análise automática e envio via WhatsApp
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Área de Upload */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {file ? (
            <div className="space-y-2">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
              <p className="font-semibold">{file.name}</p>
              <p className="text-sm text-slate-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFile(null)}
              >
                Remover
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Upload className="w-12 h-12 text-slate-400 mx-auto" />
              <p className="text-slate-600">
                Arraste e solte seu arquivo aqui
              </p>
              <p className="text-sm text-slate-500">
                ou
              </p>
              <label htmlFor="file-upload">
                <Button variant="outline" asChild>
                  <span>Selecionar Arquivo</span>
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf,.xlsx,.xls,.pptx,.ppt,.docx,.doc"
                  onChange={handleFileChange}
                />
              </label>
              <p className="text-xs text-slate-400 mt-2">
                Suporta: Imagens, PDF, Excel, PowerPoint, Word
              </p>
            </div>
          )}
        </div>

        {/* Seleção de Cliente */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Cliente Destinatário</label>
          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o cliente" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.full_name || client.first_name} - {client.clinic_name || 'Sem clínica'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Botão de Processar */}
        <Button
          onClick={handleUploadAndProcess}
          disabled={!file || !selectedClient || processing}
          className="w-full"
          size="lg"
        >
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processando e Enviando...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Processar e Enviar via WhatsApp
            </>
          )}
        </Button>

        {/* Resultado */}
        {result && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <p className="font-semibold text-green-800">
                    Material Processado com Sucesso!
                  </p>
                </div>
                {result.analysis && (
                  <div className="text-sm text-slate-700">
                    <p className="font-medium">Análise da IA:</p>
                    <p className="mt-1">{result.analysis}</p>
                  </div>
                )}
                {result.message_sent && (
                  <p className="text-sm text-green-700">
                    ✓ Mensagem enviada via WhatsApp para {result.client_name}
                  </p>
                )}
                {result.file_url && (
                  <p className="text-xs text-slate-500">
                    Arquivo salvo: {result.file_url.substring(0, 50)}...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}