import React from 'react';
import CustomizableDashboard from '@/components/dashboard/CustomizableDashboard';
import GoalsManager from '@/components/dashboard/GoalsManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Target } from 'lucide-react';

export default function InteractiveDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 pb-20">
      <div className="max-w-7xl mx-auto">
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="goals" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Metas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <CustomizableDashboard />
          </TabsContent>

          <TabsContent value="goals">
            <GoalsManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}