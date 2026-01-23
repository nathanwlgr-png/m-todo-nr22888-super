import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, AlertTriangle, CheckCircle2, Users, Package, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

export default function MobiMigrationTool() {
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState(null);

  const handleMigrate = async () => {
    setMigrating(true);
    try {
      const response = await base44.functions.invoke('migrateFromMobi', {
        deleteOldClients: true
      });

      if (response?.data?.success) {
        setResult(response.data);
        toast.success('✅ Migração MOBI concluída com sucesso!');
      } else {
        toast.error('Erro na migração');
      }
    } catch (error) {
      toast.error('Erro: ' + error.message);
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Aviso */}
      <Card className="p-4 bg-red-50 border-red-200">
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">⚠️ Ação Irreversível</p>
            <p className="text-sm text-red-700 mt-1">
              Esta operação irá:
            </p>
            <ul className="text-sm text-red-700 ml-4 mt-1 space-y-1">
              <li>❌ Apagar todos os clientes pré-NR22</li>
              <li>✅ Importar clientes do MOBI</li>
              <li>📦 Sincronizar todo estoque</li>
              <li>💰 Replicar histórico de vendas</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Botão Migração */}
      {!result && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button className="w-full bg-red-600 hover:bg-red-700 h-12">
              <Users className="w-4 h-4 mr-2" />
              Iniciar Migração MOBI
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Migração?</AlertDialogTitle>
              <AlertDialogDescription>
                Isto vai apagar clientes antigos e importar tudo do MOBI. Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3">
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleMigrate}
                disabled={migrating}
                className="bg-red-600 hover:bg-red-700"
              >
                {migrating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Migrando...
                  </>
                ) : (
                  'Confirmar Migração'
                )}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Resultado */}
      {result && (
        <Card className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-start gap-3 mb-4">
            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-green-900 text-lg">Migração Concluída! ✅</p>
              <p className="text-sm text-green-700 mt-1">{result.message}</p>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-3 border-2 border-green-200">
              <p className="text-xs text-slate-600">Clientes Apagados</p>
              <p className="text-2xl font-bold text-red-600">{result.summary.deleted_old_clients}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border-2 border-green-200">
              <p className="text-xs text-slate-600">Clientes Importados</p>
              <p className="text-2xl font-bold text-green-600">{result.summary.imported_clients}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border-2 border-green-200">
              <p className="text-xs text-slate-600">Produtos Sincronizados</p>
              <p className="text-2xl font-bold text-purple-600">{result.summary.imported_equipment}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border-2 border-green-200">
              <p className="text-xs text-slate-600">Vendas Importadas</p>
              <p className="text-2xl font-bold text-blue-600">{result.summary.imported_sales}</p>
            </div>
          </div>

          {/* Reset */}
          <Button
            onClick={() => setResult(null)}
            variant="outline"
            className="w-full mt-4"
          >
            Fazer Nova Migração
          </Button>
        </Card>
      )}
    </div>
  );
}