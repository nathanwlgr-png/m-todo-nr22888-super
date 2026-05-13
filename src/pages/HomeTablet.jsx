import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, TrendingUp, Clock, CheckCircle2, AlertCircle, 
  MapPin, Phone, ArrowRight, Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistance } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function HomeTablet() {
  // Dados gerais
  const { data: clients = [] } = useQuery({
    queryKey: ['clients-tablet'],
    queryFn: () => base44.entities.Client.list('-updated_date', 100).catch(() => []),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks-tablet'],
    queryFn: () => base44.entities.Task.list('-due_date', 50).catch(() => []),
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['visits-tablet'],
    queryFn: () => base44.entities.Visit.list('-scheduled_date', 50).catch(() => []),
  });

  // Cálculos rápidos
  const hotClients = clients.filter(c => c.status === 'quente').slice(0, 5);
  const pendingTasks = tasks.filter(t => t.status === 'pendente').slice(0, 5);
  const todayVisits = visits.filter(v => 
    v.scheduled_date?.split('T')[0] === new Date().toISOString().split('T')[0]
  ).slice(0, 5);

  const stats = {
    totalClients: clients.length,
    hotClients: hotClients.length,
    pendingTasks: pendingTasks.length,
    todayVisits: todayVisits.length,
    completedToday: tasks.filter(t => 
      t.status === 'concluida' && 
      t.updated_date?.split('T')[0] === new Date().toISOString().split('T')[0]
    ).length,
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Top Stats - 4 colunas em landscape */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 lg:gap-4">
              <div className="p-2 lg:p-3 bg-blue-600 rounded-xl">
                <Users className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-blue-600">Clientes</p>
                <p className="text-xl lg:text-3xl font-bold text-blue-900">{stats.totalClients}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 lg:gap-4">
              <div className="p-2 lg:p-3 bg-red-600 rounded-xl">
                <Zap className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-red-600">Quentes</p>
                <p className="text-xl lg:text-3xl font-bold text-red-900">{stats.hotClients}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 lg:gap-4">
              <div className="p-2 lg:p-3 bg-orange-600 rounded-xl">
                <Clock className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-orange-600">Hoje</p>
                <p className="text-xl lg:text-3xl font-bold text-orange-900">{stats.todayVisits}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 lg:gap-4">
              <div className="p-2 lg:p-3 bg-green-600 rounded-xl">
                <CheckCircle2 className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-green-600">Feitas</p>
                <p className="text-xl lg:text-3xl font-bold text-green-900">{stats.completedToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid - 3 colunas em landscape */}
      <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Clientes Quentes */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg lg:text-xl flex items-center gap-2">
              <Zap className="w-5 h-5 lg:w-6 lg:h-6 text-red-600" />
              Clientes Quentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 lg:space-y-3">
            {hotClients.length > 0 ? (
              hotClients.map(client => (
                <Link
                  key={client.id}
                  to={`/Clients?id=${client.id}`}
                  className="block"
                >
                  <div className="p-3 lg:p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                    <p className="font-semibold text-sm lg:text-base text-slate-900 truncate">
                      {client.first_name}
                    </p>
                    <p className="text-xs lg:text-sm text-slate-600 truncate">
                      {client.clinic_name}
                    </p>
                    {client.purchase_score && (
                      <Badge className="mt-2 bg-red-600 text-xs lg:text-sm">
                        Score: {client.purchase_score}
                      </Badge>
                    )}
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">Nenhum cliente quente</p>
            )}
            <Link to="/Clients" className="block mt-2">
              <Button variant="outline" className="w-full h-10 lg:h-12 text-sm lg:text-base">
                Ver todos <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Tarefas Pendentes */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg lg:text-xl flex items-center gap-2">
              <Clock className="w-5 h-5 lg:w-6 lg:h-6 text-orange-600" />
              Tarefas ({pendingTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 lg:space-y-3">
            {pendingTasks.length > 0 ? (
              pendingTasks.map(task => (
                <div
                  key={task.id}
                  className="p-3 lg:p-4 bg-slate-50 rounded-lg"
                >
                  <p className="font-semibold text-sm lg:text-base text-slate-900 truncate">
                    {task.title}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs lg:text-sm text-slate-600">
                      {task.client_name}
                    </p>
                    {task.priority && (
                      <Badge
                        className={`text-xs lg:text-sm ${
                          task.priority === 'alta'
                            ? 'bg-red-600'
                            : task.priority === 'media'
                            ? 'bg-yellow-600'
                            : 'bg-green-600'
                        }`}
                      >
                        {task.priority}
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">Sem tarefas</p>
            )}
            <Link to="/TasksUnified" className="block mt-2">
              <Button variant="outline" className="w-full h-10 lg:h-12 text-sm lg:text-base">
                Ver todas <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Visitas de Hoje */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg lg:text-xl flex items-center gap-2">
              <MapPin className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
              Visitas Hoje
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 lg:space-y-3">
            {todayVisits.length > 0 ? (
              todayVisits.map(visit => (
                <div
                  key={visit.id}
                  className="p-3 lg:p-4 bg-slate-50 rounded-lg"
                >
                  <p className="font-semibold text-sm lg:text-base text-slate-900 truncate">
                    {visit.client_name}
                  </p>
                  <p className="text-xs lg:text-sm text-slate-600 mt-1">
                    {visit.scheduled_date
                      ? new Date(visit.scheduled_date).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Sem horário'}
                  </p>
                  <Badge className="mt-2 bg-blue-600 text-xs lg:text-sm">
                    {visit.status}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">Sem visitas hoje</p>
            )}
            <Link to="/VisitManager" className="block mt-2">
              <Button variant="outline" className="w-full h-10 lg:h-12 text-sm lg:text-base">
                Agendar <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - Bottom */}
      <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0">
        <CardContent className="pt-6">
          <div className="grid lg:grid-cols-4 gap-3 lg:gap-4">
            <Link to="/Clients">
              <Button variant="secondary" className="w-full h-12 lg:h-14 text-base lg:text-lg font-semibold">
                👤 Cliente
              </Button>
            </Link>
            <Link to="/VisitManager">
              <Button variant="secondary" className="w-full h-12 lg:h-14 text-base lg:text-lg font-semibold">
                ✓ Visita
              </Button>
            </Link>
            <Link to="/WhatsAppHub">
              <Button variant="secondary" className="w-full h-12 lg:h-14 text-base lg:text-lg font-semibold">
                💬 Chat
              </Button>
            </Link>
            <Link to="/RouteOptimization">
              <Button variant="secondary" className="w-full h-12 lg:h-14 text-base lg:text-lg font-semibold">
                🗺️ Rota
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}