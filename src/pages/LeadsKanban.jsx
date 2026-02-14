import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Target } from 'lucide-react';
import LeadKanbanBoard from '@/components/LeadKanbanBoard';

export default function LeadsKanban() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Pipeline de Leads</h1>
              <p className="text-sm text-slate-600">Gerencie leads visualmente com IA</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Link to={createPageUrl('CaptureLeads')}>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                Novo Lead
              </Button>
            </Link>
            <Link to={createPageUrl('Leads')}>
              <Button variant="outline">
                <Target className="w-4 h-4 mr-2" />
                Lista de Leads
              </Button>
            </Link>
          </div>
        </div>

        {/* Kanban Board */}
        <LeadKanbanBoard />
      </div>
    </div>
  );
}