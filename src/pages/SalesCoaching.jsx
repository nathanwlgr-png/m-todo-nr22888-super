import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Award } from 'lucide-react';
import SalesCoachingAnalyzer from '@/components/SalesCoachingAnalyzer';
import CoachingDashboard from '@/components/CoachingDashboard';

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
            <p className="text-gray-600">Análise e feedback em tempo real</p>
          </div>
          <Award className="w-8 h-8 text-purple-600 ml-auto" />
        </div>

        <CoachingDashboard />
        <SalesCoachingAnalyzer />
      </div>
    </div>
  );
}