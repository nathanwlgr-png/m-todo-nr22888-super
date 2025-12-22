import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Download, FileText, Loader2, Search, CheckCircle2, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function SignedContracts() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['signed-contracts'],
    queryFn: async () => {
      const allDocs = await base44.entities.ClientDocument.list('-signed_date', 200);
      return allDocs.filter(doc => doc.is_signed === true);
    }
  });

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => 
      !search || 
      doc.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      doc.title?.toLowerCase().includes(search.toLowerCase())
    );
  }, [documents, search]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-slate-800">Contratos Assinados</h1>
            <p className="text-xs text-slate-500">{documents.length} contratos</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Buscar por cliente ou título..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-12 rounded-xl border-2"
          />
        </div>
      </div>

      <div className="p-4 space-y-3">
        {filteredDocuments.length === 0 ? (
          <Card className="p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 mb-2">
              {search ? 'Nenhum contrato encontrado' : 'Nenhum contrato assinado ainda'}
            </p>
            <p className="text-xs text-slate-500">
              Contratos assinados eletronicamente aparecerão aqui
            </p>
          </Card>
        ) : (
          filteredDocuments.map((doc) => (
            <Card key={doc.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800">{doc.title}</h3>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={() => navigate(createPageUrl(`ClientProfile?id=${doc.client_id}`))}
                      className="text-sm text-indigo-600 hover:underline"
                    >
                      {doc.client_name}
                    </button>
                  </div>

                  {doc.signed_date && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-slate-600">
                      <Calendar className="w-3 h-3" />
                      <span>Assinado em {format(new Date(doc.signed_date), 'dd/MM/yyyy HH:mm')}</span>
                    </div>
                  )}

                  {doc.signers && doc.signers.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-slate-500 mb-1">Signatários:</p>
                      {doc.signers.map((signer, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          {signer.signed ? (
                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                          ) : (
                            <div className="w-3 h-3 rounded-full border-2 border-slate-300" />
                          )}
                          <span className={signer.signed ? 'text-green-700' : 'text-slate-600'}>
                            {signer.name} ({signer.email})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 mt-3">
                    <Badge className="bg-green-100 text-green-700">
                      {doc.type}
                    </Badge>
                    {doc.related_sale_id && (
                      <Badge variant="outline" className="text-xs">
                        Venda vinculada
                      </Badge>
                    )}
                  </div>

                  {doc.notes && (
                    <p className="text-xs text-slate-600 mt-2">{doc.notes}</p>
                  )}
                </div>

                {doc.file_url && (
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-slate-100 rounded-lg flex-shrink-0"
                  >
                    <Download className="w-4 h-4 text-indigo-600" />
                  </a>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}