import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function GoogleDocIntegration() {
  const [docName, setDocName] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isExporting, setIsExporting] = useState(false);

  const exportToGoogleDocs = async () => {
    if (!docName.trim()) {
      toast.error('Digite um nome para o documento');
      return;
    }

    setIsExporting(true);
    try {
      const response = await base44.functions.invoke('exportProposalToGoogleDocs', {
        docName,
        products: selectedProducts
      });

      if (response.data.success) {
        toast.success(`Documento criado: ${response.data.doc_name}`);
        setDocName('');
        setSelectedProducts([]);
      } else {
        toast.error('Erro ao criar documento: ' + response.data.error);
      }
    } catch (error) {
      toast.error('Erro na exportação: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className="p-4 border-2 border-blue-300 bg-blue-50">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-5 h-5 text-blue-600" />
        <h3 className="font-bold text-blue-800">Integração Google Workspace</h3>
      </div>
      
      <div className="space-y-3">
        <Input
          placeholder="Nome do documento (ex: Proposta_Cliente_Jan2026)"
          value={docName}
          onChange={(e) => setDocName(e.target.value)}
          className="max-w-md"
        />
        
        <div className="flex gap-2">
          <Button 
            onClick={exportToGoogleDocs} 
            disabled={isExporting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <FileText className="w-4 h-4 mr-2" />
            {isExporting ? 'Exportando...' : 'Exportar Proposta para Google Docs'}
          </Button>
          
          <Button 
            onClick={() => {
              toast.info('Abrindo Google Sheets...');
              // Integração com Google Sheets para cotações
            }} 
            variant="outline"
          >
            Importar de Google Sheets
          </Button>
        </div>
      </div>
    </Card>
  );
}