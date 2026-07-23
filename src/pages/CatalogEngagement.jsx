import React from 'react';
import CatalogEngagementPanel from '@/components/catalog/CatalogEngagementPanel';
import { BarChart3 } from 'lucide-react';

export default function CatalogEngagement() {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Engajamento de Catálogos</h1>
          <p className="text-sm text-slate-500">Quem abriu, por quanto tempo e com que interesse — por cliente.</p>
        </div>
      </div>
      <CatalogEngagementPanel />
    </div>
  );
}