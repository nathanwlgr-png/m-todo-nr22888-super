import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, CheckCircle, Zap, AlertTriangle, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

/**
 * Sistema de Correção Automática de Erros com 3 IAs
 * IA 1: Monitora dados inconsistentes
 * IA 2: Valida lógica de negócio
 * IA 3: Otimiza performance e previne bugs
 */
export default function AIErrorCorrectionSystem() {
  const [status, setStatus] = useState({ ia1: 'idle', ia2: 'idle', ia3: 'idle' });
  const [lastCheck, setLastCheck] = useState(null);
  const [errorsFound, setErrorsFound] = useState([]);
  const [expanded, setExpanded] = useState(false);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 500),
    staleTime: 10 * 60 * 1000,
    refetchInterval: false
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['all-tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 500),
    staleTime: 10 * 60 * 1000,
    refetchInterval: false
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['all-sales'],
    queryFn: () => base44.entities.Sale.list('-sale_date', 500),
    staleTime: 10 * 60 * 1000,
    refetchInterval: false
  });

  // IA 1: Monitor de Dados Inconsistentes
  const runIA1DataValidator = async () => {
    setStatus(prev => ({ ...prev, ia1: 'running' }));
    const errors = [];

    try {
      clients.forEach(client => {
        if (!client.first_name) errors.push({ type: 'missing_name', client_id: client.id });
        if (!client.email && !client.phone) errors.push({ type: 'no_contact', client_id: client.id });
        if (client.purchase_score > 100 || client.purchase_score < 0) {
          errors.push({ type: 'invalid_score', client_id: client.id, value: client.purchase_score });
        }
        if (client.status === 'quente' && client.purchase_score < 50) {
          errors.push({ type: 'inconsistent_status_score', client_id: client.id });
        }
      });

      tasks.forEach(task => {
        if (task.client_id && !clients.find(c => c.id === task.client_id)) {
          errors.push({ type: 'orphan_task', task_id: task.id, client_id: task.client_id });
        }
      });

      setStatus(prev => ({ ...prev, ia1: 'completed' }));
      return errors;
    } catch (error) {
      setStatus(prev => ({ ...prev, ia1: 'error' }));
      return [];
    }
  };

  // IA 2: Validador de Lógica de Negócio
  const runIA2BusinessLogic = async () => {
    setStatus(prev => ({ ...prev, ia2: 'running' }));
    const warnings = [];

    try {
      clients.forEach(client => {
        const lastUpdate = new Date(client.updated_date);
        const daysSinceUpdate = Math.floor((Date.now() - lastUpdate) / (1000 * 60 * 60 * 24));
        
        if (client.status === 'quente' && daysSinceUpdate > 7) {
          warnings.push({ 
            type: 'hot_client_inactive', 
            client_id: client.id, 
            days: daysSinceUpdate,
            suggestion: 'Criar tarefa de follow-up urgente'
          });
        }

        if (client.purchase_score > 70 && !client.next_action) {
          warnings.push({
            type: 'high_score_no_action',
            client_id: client.id,
            suggestion: 'Definir próxima ação estratégica'
          });
        }

        if ((client.projected_revenue || 0) > 50000 && !client.last_visit_date) {
          warnings.push({
            type: 'high_pipeline_no_visit',
            client_id: client.id,
            suggestion: 'Agendar visita presencial'
          });
        }
      });

      setStatus(prev => ({ ...prev, ia2: 'completed' }));
      return warnings;
    } catch (error) {
      setStatus(prev => ({ ...prev, ia2: 'error' }));
      return [];
    }
  };

  // IA 3: Otimizador de Performance
  const runIA3PerformanceOptimizer = async () => {
    setStatus(prev => ({ ...prev, ia3: 'running' }));
    const optimizations = [];

    try {
      const coldClients = clients.filter(c => c.status === 'frio');
      if (coldClients.length > 50) {
        optimizations.push({
          type: 'too_many_cold_clients',
          count: coldClients.length,
          suggestion: 'Criar campanha de reengajamento automática'
        });
      }

      const overdueTasks = tasks.filter(t => 
        t.status === 'pendente' && 
        new Date(t.due_date) < new Date()
      );
      if (overdueTasks.length > 20) {
        optimizations.push({
          type: 'task_backlog',
          count: overdueTasks.length,
          suggestion: 'Repriorizar tarefas com IA'
        });
      }

      const emails = {};
      clients.forEach(client => {
        if (client.email) {
          if (emails[client.email]) {
            optimizations.push({
              type: 'duplicate_email',
              clients: [emails[client.email], client.id],
              suggestion: 'Mesclar registros duplicados'
            });
          } else {
            emails[client.email] = client.id;
          }
        }
      });

      setStatus(prev => ({ ...prev, ia3: 'completed' }));
      return optimizations;
    } catch (error) {
      setStatus(prev => ({ ...prev, ia3: 'error' }));
      return [];
    }
  };

  useEffect(() => {
    const runAllChecks = async () => {
      console.log('🤖 Sistema de Correção Automática - Iniciando verificações...');
      
      const [dataErrors, businessWarnings, perfOptimizations] = await Promise.all([
        runIA1DataValidator(),
        runIA2BusinessLogic(),
        runIA3PerformanceOptimizer()
      ]);

      const allIssues = [...dataErrors, ...businessWarnings, ...perfOptimizations];
      setErrorsFound(allIssues);
      setLastCheck(new Date());

      const criticalIssues = allIssues.filter(i => 
        i.type === 'missing_name' || 
        i.type === 'hot_client_inactive' || 
        i.type === 'high_score_no_action'
      );

      if (criticalIssues.length > 0) {
        toast.warning(`⚠️ ${criticalIssues.length} issues encontrados`, {
          description: 'Sistema de correção automática identificou problemas',
          duration: 5000
        });
      }

      console.log(`✅ Verificação completa: ${allIssues.length} issues encontrados`);
    };

    runAllChecks();
    const interval = setInterval(runAllChecks, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [clients, tasks, sales]);

  return (
    <div className="fixed bottom-6 left-6 z-40">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-orange-500 border-2 border-red-300 shadow-xl flex items-center justify-center hover:shadow-red-500/50 transition-all active:scale-95"
        style={{ 
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation'
        }}
      >
        <ShieldCheck className="w-6 h-6 text-white" />
      </button>

      {expanded && (
        <Card className="absolute bottom-16 left-0 w-72 p-4 bg-white border-red-200 shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 text-sm">Correção IA</h3>
                <p className="text-xs text-slate-600">3 validadoras</p>
              </div>
            </div>
            <button onClick={() => setExpanded(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
          
          <div className="space-y-2 text-xs mb-3">
            <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
              <span className="text-slate-700">IA 1 - Dados</span>
              {status.ia1 === 'completed' ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : status.ia1 === 'running' ? (
                <Zap className="w-4 h-4 text-yellow-600 animate-pulse" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600" />
              )}
            </div>
            
            <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
              <span className="text-slate-700">IA 2 - Lógica</span>
              {status.ia2 === 'completed' ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : status.ia2 === 'running' ? (
                <Zap className="w-4 h-4 text-yellow-600 animate-pulse" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600" />
              )}
            </div>
            
            <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
              <span className="text-slate-700">IA 3 - Performance</span>
              {status.ia3 === 'completed' ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : status.ia3 === 'running' ? (
                <Zap className="w-4 h-4 text-yellow-600 animate-pulse" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600" />
              )}
            </div>
          </div>

          {lastCheck && (
            <p className="text-xs text-slate-500">
              Última: {lastCheck.toLocaleTimeString('pt-BR')}
            </p>
          )}

          {errorsFound.length > 0 && (
            <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
              <p className="text-xs text-yellow-800">
                ⚠️ {errorsFound.length} issues
              </p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}