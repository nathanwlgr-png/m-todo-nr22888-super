import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Award, Users, Target } from 'lucide-react';
import SalesCoachingAnalyzer from '@/components/SalesCoachingAnalyzer';
import CoachingDashboard from '@/components/CoachingDashboard';
import RolePlaySimulator from '@/components/RolePlaySimulator';
import WeeklyChallengesSystem from '@/components/WeeklyChallengesSystem';
import AutomatedSalesPlaybook from '@/components/AutomatedSalesPlaybook';
import IndividualCoachingDashboard from '@/components/IndividualCoachingDashboard';
import ProgressTracker from '@/components/ProgressTracker';

export default function SalesCoaching() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(createPageUrl('Home'))}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Coaching de Vendas IA</h1>
            <p className="text-gray-600">Análise, treinamento e desafios personalizados</p>
          </div>
          <Award className="w-8 h-8 text-purple-600 ml-auto" />
        </div>

        <Tabs defaultValue="analysis" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="analysis">
              <Award className="w-4 h-4 mr-2" />
              Análise
            </TabsTrigger>
            <TabsTrigger value="progress">
              Progresso
            </TabsTrigger>
            <TabsTrigger value="playbook">
              Playbook
            </TabsTrigger>
            <TabsTrigger value="roleplay">
              <Users className="w-4 h-4 mr-2" />
              Role-Play
            </TabsTrigger>
            <TabsTrigger value="challenges">
              <Target className="w-4 h-4 mr-2" />
              Desafios
            </TabsTrigger>
            <TabsTrigger value="dashboard">
              Dashboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="space-y-4 mt-4">
            <SalesCoachingAnalyzer />
          </TabsContent>

          <TabsContent value="progress" className="space-y-4 mt-4">
            <ProgressTracker />
          </TabsContent>

          <TabsContent value="playbook" className="space-y-4 mt-4">
            <AutomatedSalesPlaybook />
          </TabsContent>

          <TabsContent value="roleplay" className="space-y-4 mt-4">
            <RolePlaySimulator />
          </TabsContent>

          <TabsContent value="challenges" className="space-y-4 mt-4">
            <WeeklyChallengesSystem />
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-4 mt-4">
            <CoachingDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}