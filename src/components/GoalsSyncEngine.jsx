import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function GoalsSyncEngine() {
  const queryClient = useQueryClient();

  const { data: goals = [] } = useQuery({
    queryKey: ['goals'],
    queryFn: () => base44.entities.SalesGoal.filter({ status: 'active' })
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['all-sales'],
    queryFn: () => base44.entities.Sale.list()
  });

  const { data: consumableOrders = [] } = useQuery({
    queryKey: ['all-consumable-orders'],
    queryFn: () => base44.entities.ConsumableOrder.list()
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['all-visits'],
    queryFn: () => base44.entities.Visit.list()
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['all-tasks'],
    queryFn: () => base44.entities.Task.list()
  });

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, current_value, status }) => 
      base44.entities.SalesGoal.update(id, { current_value, status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['goals']);
    }
  });

  useEffect(() => {
    if (!goals.length || !currentUser) return;

    goals.forEach(goal => {
      let currentValue = 0;
      const isMyGoal = goal.goal_type === 'team' || goal.assigned_to === currentUser.email;
      
      if (!isMyGoal) return;

      // Filtrar dados do período da meta
      const startDate = goal.start_date ? new Date(goal.start_date) : new Date(0);
      const endDate = new Date(goal.end_date);

      const periodSales = sales.filter(s => {
        const saleDate = new Date(s.sale_date);
        return saleDate >= startDate && saleDate <= endDate;
      });

      const periodConsumables = consumableOrders.filter(o => {
        const orderDate = new Date(o.order_date);
        return orderDate >= startDate && orderDate <= endDate;
      });

      const periodVisits = visits.filter(v => {
        const visitDate = new Date(v.scheduled_date);
        return visitDate >= startDate && visitDate <= endDate && v.status === 'realizada';
      });

      const periodTasks = tasks.filter(t => {
        const taskDate = new Date(t.updated_date || t.created_date);
        return taskDate >= startDate && taskDate <= endDate && t.status === 'concluida';
      });

      // Calcular valor atual baseado na métrica
      switch (goal.metric_type) {
        case 'sales_value':
          // EQUIPAMENTOS + INSUMOS
          const equipmentValue = periodSales
            .filter(s => s.status === 'fechada' || s.status === 'entregue')
            .reduce((sum, s) => sum + (s.sale_value || 0), 0);
          
          const consumableValue = periodConsumables
            .filter(o => o.status === 'entregue')
            .reduce((sum, o) => sum + (o.total_value || 0), 0);
          
          currentValue = equipmentValue + consumableValue;
          break;

        case 'sales_count':
          // EQUIPAMENTOS + INSUMOS
          const equipmentCount = periodSales.filter(s => s.status === 'fechada' || s.status === 'entregue').length;
          const consumableCount = periodConsumables.filter(o => o.status === 'entregue').length;
          currentValue = equipmentCount + consumableCount;
          break;

        case 'visits_count':
          currentValue = periodVisits.length;
          break;

        case 'tasks_count':
          currentValue = periodTasks.length;
          break;

        case 'conversion_rate':
          const totalClients = periodVisits.length;
          const closedSales = periodSales.filter(s => s.status === 'fechada').length;
          currentValue = totalClients > 0 ? Math.round((closedSales / totalClients) * 100) : 0;
          break;

        default:
          currentValue = goal.current_value || 0;
      }

      // Atualizar se mudou
      if (currentValue !== goal.current_value) {
        const newStatus = currentValue >= goal.target_value ? 'completed' : 'active';
        updateGoalMutation.mutate({
          id: goal.id,
          current_value: currentValue,
          status: newStatus
        });
      }
    });
  }, [goals, sales, consumableOrders, visits, tasks, currentUser]);

  return null; // Componente invisível
}