import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import VisitFlowManager from '@/components/VisitFlowManager';

export default function VisitManager() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 pb-28">
      <div className="max-w-4xl mx-auto">
        <Link to={createPageUrl('Home')}>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>

        <h1 className="text-3xl font-bold text-slate-800 mb-6">
          Gestão de Visitas
        </h1>

        <VisitFlowManager />
      </div>
    </div>
  );
}