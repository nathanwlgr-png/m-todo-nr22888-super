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
      <TabsList className="grid w-full grid-cols-4 mb-4 h-9">
        <TabsTrigger value="main" className="text-xs py-1">📍 Fluxo</TabsTrigger>
        <TabsTrigger value="tools" className="text-xs py-1">🛠️ Ferramentas</TabsTrigger>
        <TabsTrigger value="reports" className="text-xs py-1">📊 Análises</TabsTrigger>
        <TabsTrigger value="advanced" className="text-xs py-1">⚙️ Avançado</TabsTrigger>
      </TabsList>

      <TabsContent value="main" className="space-y-2 mt-0">
        <div className="grid grid-cols-2 gap-2">
          <Link to={createPageUrl('CaptureLeads')} className="w-full">
            <Button size="sm" className="w-full bg-blue-600 h-12 flex-col"><UserPlus className="w-4 h-4 mb-1" /><span className="text-xs">Capturar</span></Button>
          </Link>
          <Link to={createPageUrl('ImportClientsTable')} className="w-full">
            <Button size="sm" className="w-full bg-green-600 h-12 flex-col"><FileText className="w-4 h-4 mb-1" /><span className="text-xs">Importar</span></Button>
          </Link>
          <Link to={createPageUrl('Clients')} className="w-full">
            <Button size="sm" variant="outline" className="w-full h-12 flex-col"><Users className="w-4 h-4 mb-1" /><span className="text-xs">Clientes</span></Button>
          </Link>
          <Link to={createPageUrl('PreVisitChecklist')} className="w-full">
            <Button size="sm" variant="outline" className="w-full h-12 flex-col"><CheckCircle2 className="w-4 h-4 mb-1" /><span className="text-xs">Checklist</span></Button>
          </Link>
          <Link to={createPageUrl('ScheduledAgenda')} className="w-full">
            <Button size="sm" variant="outline" className="w-full h-12 flex-col"><Calendar className="w-4 h-4 mb-1" /><span className="text-xs">Agendar</span></Button>
          </Link>
          <Link to={createPageUrl('PostVisitAnalysis')} className="w-full">
            <Button size="sm" variant="outline" className="w-full h-12 flex-col"><CheckCircle2 className="w-4 h-4 mb-1" /><span className="text-xs">Pós-Visita</span></Button>
          </Link>
        </div>
      </TabsContent>

      <TabsContent value="tools" className="space-y-2 mt-0">
        <div className="grid grid-cols-2 gap-2">
          <Link to={createPageUrl('AIAssistant')} className="w-full">
            <Button size="sm" className="w-full bg-purple-600 h-12 flex-col"><Sparkles className="w-4 h-4 mb-1" /><span className="text-xs">IA</span></Button>
          </Link>
          <Link to={createPageUrl('TasksUnified')} className="w-full">
            <Button size="sm" variant="outline" className="w-full h-12 flex-col"><CheckCircle2 className="w-4 h-4 mb-1" /><span className="text-xs">Tarefas</span></Button>
          </Link>
          <Link to={createPageUrl('DocumentCenter')} className="w-full">
            <Button size="sm" variant="outline" className="w-full h-12 flex-col"><FileText className="w-4 h-4 mb-1" /><span className="text-xs">Documentos</span></Button>
          </Link>
          <Link to={createPageUrl('ProposalGenerator')} className="w-full">
            <Button size="sm" variant="outline" className="w-full h-12 flex-col"><FileText className="w-4 h-4 mb-1" /><span className="text-xs">Proposta</span></Button>
          </Link>
          <Link to={createPageUrl('RouteOptimizer')} className="w-full">
            <Button size="sm" variant="outline" className="w-full h-12 flex-col"><MapPin className="w-4 h-4 mb-1" /><span className="text-xs">Rotas</span></Button>
          </Link>
          <Link to={createPageUrl('KnowledgeBaseManager')} className="w-full">
            <Button size="sm" variant="outline" className="w-full h-12 flex-col"><Sparkles className="w-4 h-4 mb-1" /><span className="text-xs">Conhecimento</span></Button>
          </Link>
        </div>
      </TabsContent>

      <TabsContent value="reports" className="space-y-2 mt-0">
        <div className="grid grid-cols-2 gap-2">
          <Link to={createPageUrl('SalesAnalytics')} className="w-full">
            <Button size="sm" variant="outline" className="w-full h-12 flex-col"><BarChart3 className="w-4 h-4 mb-1" /><span className="text-xs">Análises</span></Button>
          </Link>
          <Link to={createPageUrl('InteractiveDashboard')} className="w-full">
            <Button size="sm" variant="outline" className="w-full h-12 flex-col"><TrendingUp className="w-4 h-4 mb-1" /><span className="text-xs">Dashboard</span></Button>
          </Link>
          <Link to={createPageUrl('MonthlyReport')} className="w-full">
            <Button size="sm" variant="outline" className="w-full h-12 flex-col"><FileText className="w-4 h-4 mb-1" /><span className="text-xs">Mensal</span></Button>
          </Link>
          <Link to={createPageUrl('CustomDashboard')} className="w-full">
            <Button size="sm" variant="outline" className="w-full h-12 flex-col"><BarChart3 className="w-4 h-4 mb-1" /><span className="text-xs">Custom</span></Button>
          </Link>
          <Link to={createPageUrl('ClientsByCity')} className="w-full">
            <Button size="sm" variant="outline" className="w-full h-12 flex-col"><MapPin className="w-4 h-4 mb-1" /><span className="text-xs">Regiões</span></Button>
          </Link>
          <Link to={createPageUrl('ChurnAnalysis')} className="w-full">
            <Button size="sm" variant="outline" className="w-full h-12 flex-col"><TrendingUp className="w-4 h-4 mb-1" /><span className="text-xs">Churn</span></Button>
          </Link>
        </div>
      </TabsContent>

      <TabsContent value="advanced" className="space-y-2 mt-0">
        <div className="grid grid-cols-2 gap-2">
          <Link to={createPageUrl('FunnelOptimization')} className="w-full">
            <Button size="sm" variant="outline" className="w-full h-12 flex-col"><TrendingUp className="w-4 h-4 mb-1" /><span className="text-xs">Funil IA</span></Button>
          </Link>
          <Link to={createPageUrl('SalesCoaching')} className="w-full">
            <Button size="sm" variant="outline" className="w-full h-12 flex-col"><Award className="w-4 h-4 mb-1" /><span className="text-xs">Coaching</span></Button>
          </Link>
          <Link to={createPageUrl('RolePlayTraining')} className="w-full">
            <Button size="sm" variant="outline" className="w-full h-12 flex-col"><Play className="w-4 h-4 mb-1" /><span className="text-xs">Role-Play</span></Button>
          </Link>
          <Link to={createPageUrl('AutomationManager')} className="w-full">
            <Button size="sm" variant="outline" className="w-full h-12 flex-col"><Zap className="w-4 h-4 mb-1" /><span className="text-xs">Automações</span></Button>
          </Link>
          <Link to={createPageUrl('WorkflowAutomation')} className="w-full">
            <Button size="sm" variant="outline" className="w-full h-12 flex-col"><Zap className="w-4 h-4 mb-1" /><span className="text-xs">Workflows</span></Button>
          </Link>
          <Link to={createPageUrl('Integrations')} className="w-full">
            <Button size="sm" variant="outline" className="w-full h-12 flex-col"><Sparkles className="w-4 h-4 mb-1" /><span className="text-xs">Integrações</span></Button>
          </Link>
        </div>
      </TabsContent>
    </Tabs>
  );
}