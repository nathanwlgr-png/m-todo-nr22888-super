import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ClientDataValidator() {
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState(null);

  const { data: clients = [], refetch } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      try {
        const data = await base44.entities.Client.list();
        return data.filter(c => c && c.id && !c.is_deleted);
      } catch {
        return [];
      }
    }
  });

  const validateClients = async () => {
    setValidating(true);
    try {
      const issues = [];
      const complete = [];

      clients.forEach(client => {
        const problems = [];
        
        if (!client.first_name || client.first_name.trim() === '') {
          problems.push('Sem nome');
        }
        if (!client.full_name || client.full_name.trim() === '') {
          problems.push('Sem nome completo');
        }
        if (!client.city || client.city.trim() === '') {
          problems.push('Sem cidade');
        }
        if (!client.address || client.address.trim() === '') {
          problems.push('Sem endereço');
        }
        if (!client.email && !client.phone) {
          problems.push('Sem contato');
        }
        if (!client.clinic_name && !client.razao_social) {
          problems.push('Sem nome da clínica');
        }

        if (problems.length > 0) {
          issues.push({
            id: client.id,
            name: client.first_name || 'SEM NOME',
            problems
          });
        } else {
          complete.push({
            id: client.id,
            name: client.full_name || client.first_name,
            city: client.city
          });
        }
      });

      setValidation({
        total: clients.length,
        complete: complete.length,
        incomplete: issues.length,
        issues,
        completeClients: complete
      });

      if (issues.length > 0) {
        toast.warning(`⚠️ ${issues.length} clientes com dados incompletos`);
      } else {
        toast.success('✅ Todos os clientes com dados completos!');
      }
    } catch (error) {
      toast.error('Erro ao validar clientes');
    } finally {
      setValidating(false);
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">Validação de Dados</h3>
          <p className="text-xs text-slate-600">Verificar completude dos clientes</p>
        </div>
      </div>

      <Button
        onClick={validateClients}
        disabled={validating}
        className="w-full bg-amber-600 hover:bg-amber-700 mb-3"
      >
        {validating ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Validando {clients.length} clientes...
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4 mr-2" />
            Validar Todos os Clientes
          </>
        )}
      </Button>

      {validation && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 bg-white rounded-lg text-center">
              <p className="text-lg font-bold text-slate-800">{validation.total}</p>
              <p className="text-xs text-slate-600">Total</p>
            </div>
            <div className="p-2 bg-green-50 rounded-lg text-center border border-green-300">
              <p className="text-lg font-bold text-green-700">{validation.complete}</p>
              <p className="text-xs text-green-600">Completos</p>
            </div>
            <div className="p-2 bg-red-50 rounded-lg text-center border border-red-300">
              <p className="text-lg font-bold text-red-700">{validation.incomplete}</p>
              <p className="text-xs text-red-600">Incompletos</p>
            </div>
          </div>

          {validation.issues.length > 0 && (
            <div className="p-3 bg-red-50 rounded-lg border border-red-200 max-h-60 overflow-y-auto">
              <p className="text-xs font-semibold text-red-800 mb-2">⚠️ Clientes com Problemas:</p>
              <div className="space-y-2">
                {validation.issues.map((issue, idx) => (
                  <div key={idx} className="p-2 bg-white rounded border border-red-200">
                    <p className="text-xs font-semibold text-slate-800">{issue.name}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {issue.problems.map((prob, i) => (
                        <Badge key={i} className="bg-red-100 text-red-700 text-[10px]">
                          {prob}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {validation.complete > 0 && (
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <p className="text-xs font-semibold text-green-800">
                  {validation.complete} clientes com dados completos
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}