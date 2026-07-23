import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, FileCheck, Calendar, ArrowRight } from 'lucide-react';

export default function VisitFlowManager() {
  return (
    <Card className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-6 h-6 text-purple-600" />
        <h3 className="font-bold text-lg text-slate-800">Gestão de Visitas</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Pré-Visita */}
        <Link to={createPageUrl('PreVisitChecklist')}>
          <div className="p-4 bg-white rounded-xl border-2 border-purple-300 hover:shadow-lg transition-all cursor-pointer group">
            <div className="flex items-center justify-between mb-2">
              <ClipboardCheck className="w-8 h-8 text-purple-600" />
              <Badge className="bg-purple-600 text-white">PRÉ</Badge>
            </div>
            <h4 className="font-bold text-slate-800 mb-1">Pré-Visita</h4>
            <p className="text-xs text-slate-600 mb-3">
              Checklist, preparação, análise do cliente
            </p>
            <div className="flex items-center text-purple-600 text-sm font-semibold group-hover:translate-x-1 transition-transform">
              Preparar visita <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </div>
        </Link>

        {/* Pós-Visita */}
        <Link to={createPageUrl('PostVisitAnalysis')}>
          <div className="p-4 bg-white rounded-xl border-2 border-pink-300 hover:shadow-lg transition-all cursor-pointer group">
            <div className="flex items-center justify-between mb-2">
              <FileCheck className="w-8 h-8 text-pink-600" />
              <Badge className="bg-pink-600 text-white">PÓS</Badge>
            </div>
            <h4 className="font-bold text-slate-800 mb-1">Pós-Visita</h4>
            <p className="text-xs text-slate-600 mb-3">
              Análise, registro, próximos passos
            </p>
            <div className="flex items-center text-pink-600 text-sm font-semibold group-hover:translate-x-1 transition-transform">
              Registrar visita <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </div>
        </Link>
      </div>

      <Link to={createPageUrl('ScheduledAgenda')}>
        <Button className="w-full mt-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
          <Calendar className="w-4 h-4 mr-2" />
          Ver Agenda Completa
        </Button>
      </Link>
    </Card>
  );
}