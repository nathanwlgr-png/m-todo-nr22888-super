import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles } from 'lucide-react';
import AICampaignBuilder from '@/components/AICampaignBuilder';

export default function CampaignCenter() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(createPageUrl('Home'))}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Central de Campanhas IA</h1>
            <p className="text-gray-600">Crie campanhas automatizadas com inteligência artificial</p>
          </div>
          <Sparkles className="w-8 h-8 text-orange-600 ml-auto" />
        </div>

        <AICampaignBuilder />
      </div>
    </div>
  );
}