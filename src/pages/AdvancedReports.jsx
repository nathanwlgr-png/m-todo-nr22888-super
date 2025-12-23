import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronLeft } from 'lucide-react';
import AdvancedReportGenerator from '@/components/AdvancedReportGenerator';

export default function AdvancedReports() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to={createPageUrl('Home')}>
            <button className="w-10 h-10 rounded-lg bg-white shadow-md flex items-center justify-center hover:bg-slate-50">
              <ChevronLeft className="w-5 h-5 text-slate-700" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Relatórios Avançados</h1>
            <p className="text-sm text-slate-600">Análises customizadas com IA</p>
          </div>
        </div>

        {/* Report Generator */}
        <AdvancedReportGenerator />
      </div>
    </div>
  );
}