import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function ClientDataImporter() {
  const [processing, setProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const queryClient = useQueryClient();

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const clients = await base44.entities.Client.list('-created_date', 1000);
      for (const client of clients) {
        await base44.entities.Client.delete(client.id);
      }
    },
    onSuccess: () => queryClient.invalidateQueries(['clients'])
  });

  const createClientsMutation = useMutation({
    mutationFn: (clients) => base44.entities.Client.bulkCreate(clients),
    onSuccess: () => queryClient.invalidateQueries(['clients'])
  });

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setProcessing(true);
    try {
      // Upload todas as imagens
      const fileUrls = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        fileUrls.push(file_url);
      }

      // Extrair dados com IA
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Extraia TODOS os clientes dessas planilhas Excel com MÁXIMO CUIDADO E DETALHE.

Para CADA linha visível, extraia TODOS OS CAMPOS:
- COD: código do cliente (ex: 4798, 1054) - MANTENHA EXATO
- CLIENTE: nome COMPLETO do cliente/razão social
- NOME FANTASIA: nome fantasia/empresa
- CNPJ: CNPJ se disponível
- EMAIL: email do cliente
- TELEFONE: telefone/WhatsApp
- MUNICÍPIO: cidade completa
- ENDEREÇO: endereço completo com número
- CEP: CEP se disponível
- RESPONSÁVEL: nome do responsável/contato
- CARGO: cargo do responsável

INSTRUÇÕES CRÍTICAS:
✓ Extraia o NOME COMPLETO real, NUNCA use "teste" ou placeholders
✓ Se o nome tem múltiplas palavras, inclua TODAS
✓ Mantenha acentuação e capitalização corretas
✓ Se faltar algum campo, deixe string vazia "", não invente
✓ NÃO pule nenhuma linha
✓ Processe TODAS as linhas visíveis

Retorne JSON com array 'clients'. Cada objeto:
{
  "cod": "string",
  "cliente": "string (NOME COMPLETO REAL)",
  "nome_fantasia": "string",
  "cnpj": "string",
  "email": "string",
  "telefone": "string",
  "municipio": "string",
  "endereco": "string",
  "cep": "string",
  "responsavel": "string",
  "cargo": "string"
}

EXEMPLO CORRETO:
{
  "cod": "4798",
  "cliente": "João Carlos da Silva Veterinária LTDA",
  "nome_fantasia": "Clínica São Francisco",
  "cnpj": "12.345.678/0001-90",
  "email": "contato@clinicasf.com.br",
  "telefone": "14999887766",
  "municipio": "Marília",
  "endereco": "Rua das Flores, 123",
  "cep": "17500-000",
  "responsavel": "Dr. João Carlos da Silva",
  "cargo": "Veterinário Responsável"
}`,
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
                  cnpj: { type: "string" },
                  email: { type: "string" },
                  telefone: { type: "string" },
                  municipio: { type: "string" },
                  endereco: { type: "string" },
                  cep: { type: "string" },
                  responsavel: { type: "string" },
                  cargo: { type: "string" }
                }
              }
            }
          }
        }
      });

      setExtractedData(result.clients || []);
      toast.success(`✅ ${result.clients?.length || 0} clientes extraídos!`);

    } catch (error) {
      toast.error('Erro ao processar imagens');
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const importClients = async () => {
    if (!extractedData || extractedData.length === 0) {
      toast.error('Nenhum dado para importar');
      return;
    }

    setProcessing(true);
    try {
      // Preparar dados para cadastro com TODOS os campos
      const clientsToCreate = extractedData.map(c => ({
        external_code: c.cod || '',
        first_name: c.cliente || c.nome_fantasia || 'Cliente Sem Nome',
        full_name: c.cliente || '',
        clinic_name: c.nome_fantasia || '',
        cnpj: c.cnpj || '',
        razao_social: c.cliente || '',
        email: c.email || '',
        phone: c.telefone ? c.telefone.replace(/\D/g, '') : '',
        city: c.municipio || '',
        address: c.endereco || '',
        cep: c.cep || '',
        status: 'morno',
        lead_source: 'importacao_planilha',
        notes: `Código: ${c.cod || 'N/A'}\nResponsável: ${c.responsavel || 'N/A'}\nCargo: ${c.cargo || 'N/A'}\nImportado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`
      }));

      // Criar em lotes de 50
      for (let i = 0; i < clientsToCreate.length; i += 50) {
        const batch = clientsToCreate.slice(i, i + 50);
        await createClientsMutation.mutateAsync(batch);
      }

      toast.success(`✅ ${clientsToCreate.length} clientes cadastrados!`);
      setExtractedData(null);

    } catch (error) {
      toast.error('Erro ao importar clientes');
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const deleteAll = async () => {
    if (!confirm('⚠️ ATENÇÃO: Isso vai apagar TODOS os clientes. Confirma?')) return;
    
    setProcessing(true);
    try {
      await deleteAllMutation.mutateAsync();
      toast.success('✅ Todos os clientes foram apagados');
    } catch (error) {
      toast.error('Erro ao apagar clientes');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center">
          <Upload className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-800">Importar Planilha de Clientes</h3>
          <p className="text-xs text-slate-600">Extraia dados e cadastre automaticamente</p>
        </div>
      </div>

      <div className="space-y-3">
        <label className="block">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
            disabled={processing}
          />
          <Button 
            as="span" 
            className="w-full cursor-pointer bg-orange-600 hover:bg-orange-700"
            disabled={processing}
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Selecionar Imagens da Planilha
              </>
            )}
          </Button>
        </label>

        {extractedData && (
          <div className="p-3 bg-white rounded-lg border border-orange-200">
            <p className="text-sm font-semibold text-orange-700 mb-2">
              ✅ {extractedData.length} clientes extraídos
            </p>
            <div className="max-h-32 overflow-y-auto text-xs space-y-1 mb-3">
              {extractedData.slice(0, 10).map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-green-600" />
                  <span className="text-slate-700">{c.cod} - {c.cliente}</span>
                </div>
              ))}
              {extractedData.length > 10 && (
                <p className="text-slate-500">... e mais {extractedData.length - 10}</p>
              )}
            </div>
            
            <Button
              onClick={importClients}
              className="w-full bg-green-600 hover:bg-green-700 mb-2"
              disabled={processing}
            >
              {processing ? 'Cadastrando...' : `Cadastrar ${extractedData.length} Clientes`}
            </Button>
          </div>
        )}

        <Button
          onClick={deleteAll}
          variant="destructive"
          className="w-full"
          disabled={processing}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Apagar Todos os Clientes Atuais
        </Button>
      </div>
    </Card>
  );
}