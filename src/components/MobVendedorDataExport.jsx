import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from '@tanstack/react-query';
import { Download, Loader2, CheckCircle2, Database, Users, ShoppingCart, Package, Megaphone } from 'lucide-react';
import { toast } from 'sonner';

export default function MobVendedorDataExport() {
  const [exporting, setExporting] = useState(false);
  const [lastExport, setLastExport] = useState(null);

  const { data: stats } = useQuery({
    queryKey: ['mob-export-stats'],
    queryFn: async () => {
      try {
        const [clients, sales, equipment, consumables, campaigns, mobSync] = await Promise.all([
          base44.entities.Client.list('-updated_date', 1).catch(() => []),
          base44.entities.Sale.list('-updated_date', 1).catch(() => []),
          base44.entities.Equipment.list('-updated_date', 1).catch(() => []),
          base44.entities.Consumable.list('-updated_date', 1).catch(() => []),
          base44.entities.Campaign.list('-updated_date', 1).catch(() => []),
          base44.entities.MobVendedorSync.list('-updated_date', 1).catch(() => [])
        ]);

        return {
          clients: clients.length,
          sales: sales.length,
          equipment: equipment.length,
          consumables: consumables.length,
          campaigns: campaigns.length,
          mobSync: mobSync.length
        };
      } catch (error) {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await base44.functions.invoke('exportMobVendedorData', {});
      
      if (response?.data?.success) {
        setLastExport(response.data);
        toast.success('✅ Dados exportados com sucesso!');
        
        // Download do arquivo
        if (response.data.file_url) {
          const link = document.createElement('a');
          link.href = response.data.file_url;
          link.download = `mobVendedor_backup_${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else {
        toast.error('Erro ao exportar dados');
      }
    } catch (error) {
      toast.error('Erro: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-blue-900 flex items-center gap-2">
              <Database className="w-5 h-5" />
              Backup mobVendedor
            </h2>
            <p className="text-sm text-blue-700 mt-1">Exporte todos os dados organizados em pasta estruturada</p>
          </div>
          <Button
            onClick={handleExport}
            disabled={exporting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Exportar Agora
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          <Card className="p-3 bg-white shadow-sm">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600 opacity-60" />
              <div>
                <p className="text-xs text-slate-600">Clientes</p>
                <p className="text-2xl font-bold text-slate-900">{stats.clients}</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 bg-white shadow-sm">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-green-600 opacity-60" />
              <div>
                <p className="text-xs text-slate-600">Vendas</p>
                <p className="text-2xl font-bold text-slate-900">{stats.sales}</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 bg-white shadow-sm">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-600 opacity-60" />
              <div>
                <p className="text-xs text-slate-600">Equipamentos</p>
                <p className="text-2xl font-bold text-slate-900">{stats.equipment}</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 bg-white shadow-sm">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-600 opacity-60" />
              <div>
                <p className="text-xs text-slate-600">Consumíveis</p>
                <p className="text-2xl font-bold text-slate-900">{stats.consumables}</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 bg-white shadow-sm">
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-pink-600 opacity-60" />
              <div>
                <p className="text-xs text-slate-600">Campanhas</p>
                <p className="text-2xl font-bold text-slate-900">{stats.campaigns}</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 bg-white shadow-sm">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600 opacity-60" />
              <div>
                <p className="text-xs text-slate-600">Inv. mobVendedor</p>
                <p className="text-2xl font-bold text-slate-900">{stats.mobSync}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Último Export */}
      {lastExport && (
        <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-green-900">Exportação Concluída!</p>
              <p className="text-sm text-green-700 mt-1">
                📦 Total de registros: {lastExport.export_summary.total_records.clients + lastExport.export_summary.total_records.sales + lastExport.export_summary.total_records.equipment + lastExport.export_summary.total_records.consumables + lastExport.export_summary.total_records.campaigns + lastExport.export_summary.total_records.mob_inventory}
              </p>
              <p className="text-xs text-green-600 mt-2">
                ⏰ {new Date(lastExport.timestamp).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Estrutura de Pasta */}
      <Card className="p-4 bg-slate-50 border-slate-200">
        <p className="font-semibold text-slate-900 mb-3">📁 Estrutura do Backup:</p>
        <div className="space-y-1 text-sm text-slate-700 font-mono">
          <p>mobVendedor_backup_YYYY-MM-DD.json</p>
          <p className="ml-4 text-slate-600">├── metadata (data, sistema, totais)</p>
          <p className="ml-4 text-slate-600">├── clientes (nome, email, status, scores)</p>
          <p className="ml-4 text-slate-600">├── vendas (cliente, equipamento, valor)</p>
          <p className="ml-4 text-slate-600">├── equipamentos (nome, preço, especificações)</p>
          <p className="ml-4 text-slate-600">├── consumíveis (nome, preço, estoque)</p>
          <p className="ml-4 text-slate-600">├── campanhas (nome, status, datas)</p>
          <p className="ml-4 text-slate-600">└── inventario_mobvendedor (sincronização completa)</p>
        </div>
      </Card>
    </div>
  );
}