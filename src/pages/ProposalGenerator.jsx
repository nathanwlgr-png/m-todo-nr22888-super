import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronLeft } from 'lucide-react';
import SeamatyProposalGenerator from '@/components/SeamatyProposalGenerator';

export default function ProposalGenerator() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to={createPageUrl('Home')}>
            <button className="w-10 h-10 rounded-lg bg-white shadow-md flex items-center justify-center hover:bg-slate-50">
              <ChevronLeft className="w-5 h-5 text-slate-700" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Gerador de Propostas</h1>
            <p className="text-sm text-slate-600">Modelo Seamaty/Compet profissional</p>
          </div>
        </div>

        <SeamatyProposalGenerator />

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm font-semibold text-blue-900 mb-2">📁 Pasta Google Drive Salva</p>
          <a
            href="https://drive.google.com/drive/folders/12qd_dpY5HN-m4AyZTFSwLil_KywlTB2_"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-700 underline"
          >
            Vídeos, logos e materiais técnicos
          </a>
        </div>
      </div>
    </div>
  );
}