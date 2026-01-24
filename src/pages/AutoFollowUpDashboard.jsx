import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Zap } from 'lucide-react';
import AutoFollowUpManager from '@/components/AutoFollowUpManager';

export default function AutoFollowUpDashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(createPageUrl('Home'))}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Follow-Up Automatizado</h1>
            <p className="text-gray-600">Configure regras inteligentes com IA para engajamento contínuo</p>
          </div>
          <Zap className="w-8 h-8 text-purple-600 ml-auto" />
        </div>

        <AutoFollowUpManager />
      </div>
    </div>
  );
}