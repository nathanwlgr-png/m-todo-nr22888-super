import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, Trash2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Importador Massivo de Clientes via Imagem
 * - Extrai dados da planilha via IA
 * - Preserva códigos de cliente
 * - Opção de limpar base antes de importar
 */
export default function ClientListImporter() {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const queryClient = useQueryClient();

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      // Deletar todos os clientes atuais
      const clients = await base44.entities.Client.list('-created_date', 1000);
      for (const client of clients) {
        await base44.entities.Client.delete(client.id);
      }
      return clients.length;
    }
  });

  const createClientMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.create(data),
  });

  const handleImport = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const confirm = window.confirm(
      '⚠️ ATENÇÃO: Isso irá APAGAR TODOS os clientes existentes e importar os novos. Confirma?'
    );
    if (!confirm) return;

    setImporting(true);
    
    try {
      // Upload todas as imagens
      const fileUrls = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        fileUrls.push(file_url);
      }

      toast.info('📸 Imagens carregadas. Extraindo dados...');

      // Extrair dados com IA
      const extractionPrompt = `Extraia TODOS os clientes desta planilha.

Para CADA cliente, extraia:
- COD (código do cliente - MUITO IMPORTANTE, não pode errar)
- CLIENTE (nome completo)
- NOME FANTASIA (nome da clínica/empresa)
- MUNICIPIO (cidade)
- ENDERECO (endereço completo)

CRÍTICO: NÃO pule nenhum cliente. Extraia TODOS.
CRÍTICO: O campo COD é essencial e não pode ter erro.

Retorne JSON:
{
  "clients": [
    {
      "cod": "4798",
      "cliente": "MARIANA PEREIRA CLARO SEMENSATO",
      "nome_fantasia": "MARIANA PC SEMENSATO",
      "municipio": "PIRAJUÍ",
      "endereco": "RUA SEBASTIÃO RIZZO, 400 - CLINICA PET"
    }
  ]
}`;

      const extracted = await base44.integrations.Core.InvokeLLM({
        prompt: extractionPrompt,
        file_urls: fileUrls,
        response_json_schema: {
          type: "object",
          properties: {
            clients: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  cod: { type: "string" },
                  cliente: { type: "string" },
                  nome_fantasia: { type: "string" },
                  municipio: { type: "string" },
                  endereco: { type: "string" }
                }
              }
            }
          }
        }
      });

      const clientsToImport = extracted.clients || [];
      
      if (clientsToImport.length === 0) {
        toast.error('Nenhum cliente encontrado nas imagens');
        return;
      }

      toast.info(`🗑️ Deletando ${clientsToImport.length} clientes antigos...`);
      
      // Deletar todos os clientes existentes
      await deleteAllMutation.mutateAsync();
      
      toast.info(`📝 Importando ${clientsToImport.length} novos clientes...`);
      
      // Importar novos clientes
      setProgress({ current: 0, total: clientsToImport.length });

      for (let i = 0; i < clientsToImport.length; i++) {
        const client = clientsToImport[i];
        
        try {
          await createClientMutation.mutateAsync({
            external_code: client.cod,
            first_name: client.cliente,
            clinic_name: client.nome_fantasia,
            city: client.municipio,
            address: client.endereco,
            status: 'frio',
            lead_source: 'importacao_planilha',
            notes: `Importado em ${new Date().toLocaleDateString('pt-BR')} - Código: ${client.cod}`
          });

          setProgress({ current: i + 1, total: clientsToImport.length });
        } catch (error) {
          console.error(`Erro ao importar cliente ${client.cod}:`, error);
        }
      }

      queryClient.invalidateQueries(['clients']);
      
      toast.success(`✅ ${clientsToImport.length} clientes importados!`);

    } catch (error) {
      toast.error('Erro na importação');
      console.error(error);
    } finally {
      setImporting(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 shadow-lg">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center">
          <Upload className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-800">Importação Massiva</h3>
          <p className="text-xs text-slate-600">Planilha → Clientes automático</p>
        </div>
      </div>

      {importing && progress.total > 0 && (
        <div className="mb-3 p-3 bg-white rounded-lg border border-red-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700">Importando...</span>
            <span className="text-sm text-slate-600">{progress.current}/{progress.total}</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className="bg-red-600 h-2 rounded-full transition-all"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 mb-3">
        <p className="text-xs text-yellow-800 font-semibold mb-1">⚠️ ATENÇÃO:</p>
        <p className="text-xs text-yellow-700">
          Esta ação irá DELETAR todos os clientes existentes e importar os novos da planilha.
        </p>
      </div>

      <label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleImport}
          disabled={importing}
          className="hidden"
        />
        <Button
          as="span"
          disabled={importing}
          className="w-full bg-red-600 hover:bg-red-700 cursor-pointer"
        >
          {importing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Importar Planilha (Imagens)
            </>
          )}
        </Button>
      </label>
    </Card>
  );
}