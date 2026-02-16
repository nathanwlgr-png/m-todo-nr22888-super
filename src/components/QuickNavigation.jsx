import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  UserPlus, Users, FileText, CheckCircle2, Calendar, 
  BarChart3, TrendingUp, MapPin, Sparkles, 
  Award, Play, Zap
} from 'lucide-react';

export default function QuickNavigation() {
  return (
    <Tabs defaultValue="main" className="w-full">
      <TabsList className="grid w-full grid-cols-4 mb-4">
        <TabsTrigger value="main" className="text-xs">
          📍 Fluxo
        </TabsTrigger>
        <TabsTrigger value="tools" className="text-xs">
          🛠️ Ferramentas
        </TabsTrigger>
        <TabsTrigger value="reports" className="text-xs">
          📊 Análises
        </TabsTrigger>
        <TabsTrigger value="advanced" className="text-xs">
          ⚙️ Avançado
        </TabsTrigger>
      </TabsList>

      {/* FLUXO PRINCIPAL */}
      <TabsContent value="main" className="space-y-2 mt-0">
        <div className="grid grid-cols-2 gap-2">
          <Link to={createPageUrl('CaptureLeads')}>
            <Button size="sm" className="w-full bg-blue-600 h-12 flex-col">
              <UserPlus className="w-4 h-4 mb-1" />
              <span className="text-xs">Capturar</span>
            </Button>
          </Link>
          <Link to={createPageUrl('ImportClientsTable')}>
            <Button size="sm" className="w-full bg-green-600 h-12 flex-col">
              <FileText className="w-4 h-4 mb-1" />
              <span className="text-xs">Importar</span>
            </Button>
          </Link>
          <Link to={createPageUrl('Clients')}>
            <Button size="sm" variant="outline" className="w-full h-12 flex-col">
              <Users className="w-4 h-4 mb-1" />
              <span className="text-xs">Clientes</span>
            </Button>
          </Link>
          <Link to={createPageUrl('PreVisitChecklist')}>
            <Button size="sm" variant="outline" className="w-full h-12 flex-col">
              <CheckCircle2 className="w-4 h-4 mb-1" />
              <span className="text-xs">Checklist</span>
            </Button>
          </Link>
          <Link to={createPageUrl('ScheduledAgenda')}>
            <Button size="sm" variant="outline" className="w-full h-12 flex-col">
              <Calendar className="w-4 h-4 mb-1" />
              <span className="text-xs">Agendar</span>
            </Button>
          </Link>
          <Link to={createPageUrl('PostVisitAnalysis')}>
            <Button size="sm" variant="outline" className="w-full h-12 flex-col">
              <CheckCircle2 className="w-4 h-4 mb-1" />
              <span className="text-xs">Pós-Visita</span>
            </Button>
          </Link>
        </div>
      </TabsContent>

      {/* FERRAMENTAS */}
      <TabsContent value="tools" className="space-y-2 mt-0">
        <div className="grid grid-cols-2 gap-2">
          <Link to={createPageUrl('AIAssistant')}>
            <Button size="sm" className="w-full bg-purple-600 h-12 flex-col">
              <Sparkles className="w-4 h-4 mb-1" />
              <span className="text-xs">IA</span>
            </Button>
          </Link>
          <Link to={createPageUrl('TasksUnified')}>
            <Button size="sm" variant="outline" className="w-full h-12 flex-col">
              <CheckCircle2 className="w-4 h-4 mb-1" />
              <span className="text-xs">Tarefas</span>
            </Button>
          </Link>
          <Link to={createPageUrl('DocumentCenter')}>
            <Button size="sm" variant="outline" className="w-full h-12 flex-col">
              <FileText className="w-4 h-4 mb-1" />
              <span className="text-xs">Documentos</span>
            </Button>
          </Link>
          <Link to={createPageUrl('ProposalGenerator')}>
            <Button size="sm" variant="outline" className="w-full h-12 flex-col">
              <FileText className="w-4 h-4 mb-1" />
              <span className="text-xs">Proposta</span>
            </Button>
          </Link>
          <Link to={createPageUrl('RouteOptimizer')}>
            <Button size="sm" variant="outline" className="w-full h-12 flex-col">
              <MapPin className="w-4 h-4 mb-1" />
              <span className="text-xs">Rotas</span>
            </Button>
          </Link>
          <Link to={createPageUrl('KnowledgeBaseManager')}>
            <Button size="sm" variant="outline" className="w-full h-12 flex-col">
              <Sparkles className="w-4 h-4 mb-1" />
              <span className="text-xs">Conhecimento</span>
            </Button>
          </Link>
        </div>
      </TabsContent>

      {/* ANÁLISES */}
      <TabsContent value="reports" className="space-y-2 mt-0">
        <div className="grid grid-cols-2 gap-2">
          <Link to={createPageUrl('SalesAnalytics')}>
            <Button size="sm" variant="outline" className="w-full h-12 flex-col">
              <BarChart3 className="w-4 h-4 mb-1" />
              <span className="text-xs">Análises</span>
            </Button>
          </Link>
          <Link to={createPageUrl('InteractiveDashboard')}>
            <Button size="sm" variant="outline" className="w-full h-12 flex-col">
              <TrendingUp className="w-4 h-4 mb-1" />
              <span className="text-xs">Dashboard</span>
            </Button>
          </Link>
          <Link to={createPageUrl('MonthlyReport')}>
            <Button size="sm" variant="outline" className="w-full h-12 flex-col">
              <FileText className="w-4 h-4 mb-1" />
              <span className="text-xs">Mensal</span>
            </Button>
          </Link>
          <Link to={createPageUrl('CustomDashboard')}>
            <Button size="sm" variant="outline" className="w-full h-12 flex-col">
              <BarChart3 className="w-4 h-4 mb-1" />
              <span className="text-xs">Custom</span>
            </Button>
          </Link>
          <Link to={createPageUrl('ClientsByCity')}>
            <Button size="sm" variant="outline" className="w-full h-12 flex-col">
              <MapPin className="w-4 h-4 mb-1" />
              <span className="text-xs">Regiões</span>
            </Button>
          </Link>
          <Link to={createPageUrl('ChurnAnalysis')}>
            <Button size="sm" variant="outline" className="w-full h-12 flex-col">
              <TrendingUp className="w-4 h-4 mb-1" />
              <span className="text-xs">Churn</span>
            </Button>
          </Link>
        </div>
      </TabsContent>

      {/* AVANÇADO */}
      <TabsContent value="advanced" className="space-y-2 mt-0">
        <div className="grid grid-cols-2 gap-2">
          <Link to={createPageUrl('FunnelOptimization')}>
            <Button size="sm" variant="outline" className="w-full h-12 flex-col">
              <TrendingUp className="w-4 h-4 mb-1" />
              <span className="text-xs">Funil IA</span>
            </Button>
          </Link>
          <Link to={createPageUrl('SalesCoaching')}>
            <Button size="sm" variant="outline" className="w-full h-12 flex-col">
              <Award className="w-4 h-4 mb-1" />
              <span className="text-xs">Coaching</span>
            </Button>
          </Link>
          <Link to={createPageUrl('RolePlayTraining')}>
            <Button size="sm" variant="outline" className="w-full h-12 flex-col">
              <Play className="w-4 h-4 mb-1" />
              <span className="text-xs">Role-Play</span>
            </Button>
          </Link>
          <Link to={createPageUrl('AutomationManager')}>
            <Button size="sm" variant="outline" className="w-full h-12 flex-col">
              <Zap className="w-4 h-4 mb-1" />
              <span className="text-xs">Automações</span>
            </Button>
          </Link>
          <Link to={createPageUrl('WorkflowAutomation')}>
            <Button size="sm" variant="outline" className="w-full h-12 flex-col">
              <Zap className="w-4 h-4 mb-1" />
              <span className="text-xs">Workflows</span>
            </Button>
          </Link>
          <Link to={createPageUrl('Integrations')}>
            <Button size="sm" variant="outline" className="w-full h-12 flex-col">
              <Sparkles className="w-4 h-4 mb-1" />
              <span className="text-xs">Integrações</span>
            </Button>
          </Link>
        </div>
      </TabsContent>
    </Tabs>
  );
}