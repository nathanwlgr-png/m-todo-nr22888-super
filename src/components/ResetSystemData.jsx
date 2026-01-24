import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Trash2, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ResetSystemData() {
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [progress, setProgress] = useState({ total: 0, deleted: 0 });
  const [showConfirm, setShowConfirm] = useState(false);
  const queryClient = useQueryClient();

  const deleteAllTestData = async () => {
    if (confirmText !== 'LIMPAR TUDO') {
      toast.error('Digite "LIMPAR TUDO" para confirmar');
      return;
    }

    setDeleting(true);
    setProgress({ total: 0, deleted: 0 });

    try {
      // Buscar todos os clientes
      const clients = await base44.entities.Client.list('-created_date', 10000);
      setProgress({ total: clients.length, deleted: 0 });

      toast.info(`Deletando ${clients.length} clientes...`);

      // Deletar todos os clientes
      let deleted = 0;
      for (const client of clients) {
        try {
          await base44.entities.Client.delete(client.id);
          deleted++;
          setProgress({ total: clients.length, deleted });
          
          if (deleted % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (error) {
          console.error('Erro ao deletar cliente:', client.id, error);
        }
      }

      // Limpar cache
      queryClient.invalidateQueries();

      toast.success(`✅ ${deleted} clientes deletados! Sistema limpo.`);
      setConfirmText('');
      setShowConfirm(false);
    } catch (error) {
      toast.error('Erro ao limpar dados: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="p-4 border-2 border-red-300 bg-gradient-to-br from-red-50 to-orange-50">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center">
          <AlertCircle className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-red-900">⚠️ Limpar Dados de Teste</p>
          <p className="text-xs text-red-700">ATENÇÃO: Ação irreversível!</p>
        </div>
      </div>

      {!showConfirm ? (
        <Button
          onClick={() => setShowConfirm(true)}
          variant="outline"
          className="w-full border-red-300 text-red-700 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Preparar para Produção
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="p-3 bg-red-100 rounded-lg">
            <p className="text-sm font-semibold text-red-900 mb-2">
              ⚠️ ISSO VAI DELETAR TODOS OS CLIENTES DO SISTEMA
            </p>
            <p className="text-xs text-red-800 mb-2">
              Digite "LIMPAR TUDO" para confirmar:
            </p>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="LIMPAR TUDO"
              className="mb-2"
              disabled={deleting}
            />
          </div>

          {deleting && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">Deletando...</span>
                <span className="text-sm">
                  {progress.deleted}/{progress.total}
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${(progress.deleted / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={() => {
                setShowConfirm(false);
                setConfirmText('');
              }}
              variant="outline"
              className="flex-1"
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              onClick={deleteAllTestData}
              disabled={confirmText !== 'LIMPAR TUDO' || deleting}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Confirmar
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}