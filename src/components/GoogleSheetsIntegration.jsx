import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileSpreadsheet, Upload, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import DraggableButton from './DraggableButton';

export default function GoogleSheetsIntegration() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState(null); // 'import' or 'export'
  const [sheetUrl, setSheetUrl] = useState('');

  const handleImport = async () => {
    if (!sheetUrl) {
      toast.error('Insira a URL da planilha');
      return;
    }

    setLoading(true);
    try {
      // Usa IA para ler e processar a planilha
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um especialista em importação de dados de planilhas.

URL DA PLANILHA: ${sheetUrl}

TAREFA:
1. Acesse a planilha do Google Sheets (se pública)
2. Extraia os dados de clientes/leads
3. Mapeie os campos para o formato do sistema
4. Retorne JSON com os dados estruturados

CAMPOS ESPERADOS:
- nome_completo / first_name
- email
- telefone / phone (formato: 5511999999999)
- cnpj
- razao_social
- endereco / address
- cidade / city
- clinica / clinic_name
- tipo_cliente / client_type

Retorne:
{
  "success": true/false,
  "message": "mensagem de status",
  "clients": [
    {
      "first_name": "Nome",
      "full_name": "Nome Completo",
      "email": "email@exemplo.com",
      "phone": "5511999999999",
      "cnpj": "00.000.000/0001-00",
      "razao_social": "Razão Social",
      "address": "Endereço",
      "city": "Cidade",
      "clinic_name": "Nome da Clínica",
      "client_type": "clinica_pequena",
      "decision_role": "proprietario"
    }
  ],
  "total": 0
}`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" },
            clients: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  first_name: { type: "string" },
                  full_name: { type: "string" },
                  email: { type: "string" },
                  phone: { type: "string" },
                  cnpj: { type: "string" },
                  razao_social: { type: "string" },
                  address: { type: "string" },
                  city: { type: "string" },
                  clinic_name: { type: "string" },
                  client_type: { type: "string" },
                  decision_role: { type: "string" }
                }
              }
            },
            total: { type: "number" }
          }
        }
      });

      if (result.success && result.clients?.length > 0) {
        // Importa clientes em lote
        let imported = 0;
        for (const clientData of result.clients) {
          try {
            await base44.entities.Client.create(clientData);
            imported++;
          } catch (error) {
            console.error('Erro ao criar cliente:', error);
          }
        }
        
        toast.success(`✅ ${imported} clientes importados com sucesso!`);
        setOpen(false);
        setSheetUrl('');
      } else {
        toast.error(result.message || 'Não foi possível importar os dados');
      }

    } catch (error) {
      console.error('Erro na importação:', error);
      toast.error('Erro ao importar planilha');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      // Busca todos os clientes
      const clients = await base44.entities.Client.list('-updated_date', 1000);

      // Converte para CSV
      const headers = ['Nome', 'Email', 'Telefone', 'CNPJ', 'Razão Social', 'Cidade', 'Clínica', 'Status', 'Score'];
      const rows = clients.map(c => [
        c.full_name || c.first_name,
        c.email || '',
        c.phone || '',
        c.cnpj || '',
        c.razao_social || '',
        c.city || '',
        c.clinic_name || '',
        c.status || '',
        c.purchase_score || 0
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `clientes_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      toast.success('✅ Planilha exportada! Você pode importá-la no Google Sheets');
      setOpen(false);

    } catch (error) {
      console.error('Erro na exportação:', error);
      toast.error('Erro ao exportar dados');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DraggableButton 
        defaultPosition={{ id: 'sheets', x: window.innerWidth - 100, y: window.innerHeight - 180 }}
        zIndexBase={40}
      >
        <button
          onClick={() => setOpen(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-2xl flex items-center justify-center hover:scale-110 transition-all"
        >
          <FileSpreadsheet className="w-6 h-6 text-white" />
        </button>
      </DraggableButton>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Google Planilhas</DialogTitle>
          </DialogHeader>

          {!mode ? (
            <div className="space-y-3">
              <Button
                onClick={() => setMode('import')}
                className="w-full h-16 bg-gradient-to-r from-blue-600 to-indigo-600"
              >
                <Upload className="w-5 h-5 mr-2" />
                Importar de Planilha
              </Button>
              <Button
                onClick={() => setMode('export')}
                className="w-full h-16 bg-gradient-to-r from-green-600 to-emerald-600"
              >
                <Download className="w-5 h-5 mr-2" />
                Exportar para Planilha
              </Button>
            </div>
          ) : mode === 'import' ? (
            <div className="space-y-4">
              <div>
                <Label>URL da Planilha do Google Sheets</Label>
                <Input
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="mt-2"
                />
                <p className="text-xs text-slate-500 mt-2">
                  ⚠️ A planilha precisa estar pública para leitura
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setMode(null);
                    setSheetUrl('');
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Voltar
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={loading}
                  className="flex-1 bg-blue-600"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    'Importar'
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Exportar todos os clientes para um arquivo CSV que pode ser importado no Google Sheets
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => setMode(null)}
                  variant="outline"
                  className="flex-1"
                >
                  Voltar
                </Button>
                <Button
                  onClick={handleExport}
                  disabled={loading}
                  className="flex-1 bg-green-600"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Exportando...
                    </>
                  ) : (
                    'Exportar CSV'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}