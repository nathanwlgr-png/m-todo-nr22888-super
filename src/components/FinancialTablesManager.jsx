import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, Table, Download, Eye, Trash2, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function FinancialTablesManager() {
  const [uploading, setUploading] = useState(false);
  const [tableType, setTableType] = useState('retorno_financeiro');
  const [tableName, setTableName] = useState('');
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: tables = [] } = useQuery({
    queryKey: ['financial-tables'],
    queryFn: () => base44.entities.FinancialTable.list(),
  });

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      setUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      await base44.entities.FinancialTable.create({
        table_type: tableType,
        table_name: tableName || file.name,
        file_url,
        locked: true,
        description: tableType === 'simulacao_santander' 
          ? 'Tabela de simulação Santander - Financiamento até 36x' 
          : 'Tabela de retorno financeiro para apresentação ao cliente'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['financial-tables']);
      setTableName('');
      toast.success('Tabela carregada!');
    },
    onSettled: () => {
      setUploading(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FinancialTable.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['financial-tables']);
      toast.success('Tabela removida');
    }
  });

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  return (
    <Card className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
      <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <Table className="w-5 h-5 text-green-600" />
        Tabelas Financeiras
      </h3>

      {/* Upload Section */}
      <div className="space-y-3 mb-5">
        <div>
          <Label>Tipo de Tabela</Label>
          <select
            value={tableType}
            onChange={(e) => setTableType(e.target.value)}
            className="w-full p-2 border rounded-lg"
          >
            <option value="simulacao_santander">Simulação Santander (Financiamento)</option>
            <option value="retorno_financeiro">Retorno Financeiro (ROI)</option>
            <option value="custom">Personalizada</option>
          </select>
        </div>

        <div>
          <Label>Nome da Tabela</Label>
          <Input
            placeholder="Ex: Simulação Santander 2025"
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
          />
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileSelect}
        />

        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || !tableName}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload Planilha (.xlsx, .xls)
            </>
          )}
        </Button>
      </div>

      {/* Tables List */}
      {tables.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-700">Tabelas Salvas:</p>
          {tables.map(table => (
            <div key={table.id} className="p-3 bg-white rounded-lg border flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm text-slate-900">{table.table_name}</p>
                  {table.locked && <Lock className="w-3 h-3 text-orange-500" />}
                </div>
                <Badge variant="outline" className="text-xs mt-1">
                  {table.table_type === 'simulacao_santander' ? '💳 Santander' : '📊 ROI'}
                </Badge>
              </div>
              <div className="flex gap-2">
                <a href={table.file_url} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="ghost">
                    <Download className="w-4 h-4" />
                  </Button>
                </a>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate(table.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      <div className="mt-4 p-3 bg-white rounded-lg border border-green-300">
        <p className="text-xs font-semibold text-green-800 mb-1">🔒 Arquivos Protegidos</p>
        <p className="text-xs text-slate-600">
          As planilhas mantêm formato original. Sistema apenas insere dados do cliente sem alterar fórmulas.
        </p>
      </div>
    </Card>
  );
}