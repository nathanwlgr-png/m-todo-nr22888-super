import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Users, CheckCircle2, AlertCircle, Zap, RefreshCw } from 'lucide-react';
import Papa from 'papaparse';

// DEPRECATED: Use MasterUnified instead (pages/MasterUnified)

export default function ClientImportManager() {
  const [csvData, setCsvData] = useState([]);
  const [fileLoaded, setFileLoaded] = useState(false);
  const [convertLeads, setConvertLeads] = useState(true);

  // Fetch current data
  const { data: currentClients = [] } = useQuery({
    queryKey: ['clients-for-import'],
    queryFn: async () => {
      try {
        return await base44.entities.Client?.list?.() || [];
      } catch {
        return [];
      }
    }
  });

  const { data: currentLeads = [] } = useQuery({
    queryKey: ['leads-for-import'],
    queryFn: async () => {
      try {
        return await base44.entities.Lead?.list?.() || [];
      } catch {
        return [];
      }
    }
  });

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async () => {
      return await base44.functions.invoke('bulkClientImportAI', {
        clients_data: csvData,
        convert_leads: convertLeads
      });
    }
  });

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCsvData(results.data);
        setFileLoaded(true);
      },
      error: (error) => {
        alert(`Erro ao ler arquivo: ${error.message}`);
      }
    });
  };

  const handleManualAdd = () => {
    setCsvData([...csvData, {
      full_name: '',
      email: '',
      phone: '',
      clinic_name: '',
      city: '',
      cnpj: '',
      equipment_interest: ''
    }]);
  };

  const handleDataChange = (index, field, value) => {
    const newData = [...csvData];
    newData[index][field] = value;
    setCsvData(newData);
  };

  if (importMutation.isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Importando clientes...</p>
        </div>
      </div>
    );
  }

  const importResult = importMutation.data?.data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-slate-900">📊 Gerenciador de Importação de Clientes</h1>
          <p className="text-slate-600 mt-2">Importe, visualize e cadastre clientes em massa</p>
        </div>

        {!importResult ? (
          <Tabs defaultValue="upload" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload">Upload CSV</TabsTrigger>
              <TabsTrigger value="manual">Cadastro Manual</TabsTrigger>
              <TabsTrigger value="preview">Pré-visualização</TabsTrigger>
            </TabsList>

            {/* Upload Tab */}
            <TabsContent value="upload">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Importar de Arquivo CSV
                  </CardTitle>
                  <CardDescription>
                    Selecione um arquivo CSV com colunas: full_name, email, phone, clinic_name, city, cnpj, equipment_interest
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="csv-upload"
                    />
                    <label
                      htmlFor="csv-upload"
                      className="cursor-pointer inline-flex flex-col items-center gap-2"
                    >
                      <Upload className="w-10 h-10 text-slate-400" />
                      <span className="text-sm font-semibold text-slate-900">Clique para selecionar ou arraste</span>
                      <span className="text-xs text-slate-500">.csv até 10MB</span>
                    </label>
                  </div>

                  {fileLoaded && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-semibold text-green-900">
                        ✅ {csvData.length} registros carregados
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Manual Tab */}
            <TabsContent value="manual">
              <Card>
                <CardHeader>
                  <CardTitle>Cadastro Manual de Clientes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={handleManualAdd} className="w-full">
                    + Adicionar Cliente
                  </Button>

                  {csvData.length > 0 && (
                    <div className="space-y-4">
                      {csvData.map((client, idx) => (
                        <div key={idx} className="p-4 border border-slate-200 rounded-lg space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                              type="text"
                              placeholder="Nome completo"
                              value={client.full_name || ''}
                              onChange={(e) => handleDataChange(idx, 'full_name', e.target.value)}
                              className="p-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <input
                              type="email"
                              placeholder="Email"
                              value={client.email || ''}
                              onChange={(e) => handleDataChange(idx, 'email', e.target.value)}
                              className="p-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <input
                              type="tel"
                              placeholder="Telefone"
                              value={client.phone || ''}
                              onChange={(e) => handleDataChange(idx, 'phone', e.target.value)}
                              className="p-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <input
                              type="text"
                              placeholder="Clínica / Empresa"
                              value={client.clinic_name || ''}
                              onChange={(e) => handleDataChange(idx, 'clinic_name', e.target.value)}
                              className="p-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <input
                              type="text"
                              placeholder="Cidade"
                              value={client.city || ''}
                              onChange={(e) => handleDataChange(idx, 'city', e.target.value)}
                              className="p-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <input
                              type="text"
                              placeholder="CNPJ"
                              value={client.cnpj || ''}
                              onChange={(e) => handleDataChange(idx, 'cnpj', e.target.value)}
                              className="p-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                          <input
                            type="text"
                            placeholder="Equipamento de interesse"
                            value={client.equipment_interest || ''}
                            onChange={(e) => handleDataChange(idx, 'equipment_interest', e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview">
              <Card>
                <CardHeader>
                  <CardTitle>Pré-visualização de Dados</CardTitle>
                  <CardDescription>
                    {csvData.length} clientes prontos para importar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {csvData.map((client, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">{client.full_name || '(sem nome)'}</p>
                            <p className="text-sm text-slate-600">{client.clinic_name || '(sem clínica)'}</p>
                            <div className="flex gap-2 mt-1 text-xs text-slate-500">
                              {client.email && <span>📧 {client.email}</span>}
                              {client.phone && <span>📞 {client.phone}</span>}
                              {client.city && <span>📍 {client.city}</span>}
                            </div>
                          </div>
                          {client.equipment_interest && (
                            <Badge className="bg-blue-100 text-blue-800 text-xs">
                              {client.equipment_interest}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Options & Button */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Opções de Importação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={convertLeads}
                    onChange={(e) => setConvertLeads(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-slate-900">
                    Converter Leads qualificados em Clientes
                  </span>
                </label>

                <Button
                  onClick={() => importMutation.mutate()}
                  disabled={csvData.length === 0}
                  className="w-full gap-2"
                  size="lg"
                >
                  <Zap className="w-5 h-5" />
                  Importar {csvData.length} Clientes
                </Button>
              </CardContent>
            </Card>
          </Tabs>
        ) : (
          <div className="space-y-6">
            {/* Results */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-l-4 border-green-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Clientes Criados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-green-600">
                    {importResult.total_created}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-amber-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Duplicatas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-amber-600">
                    {importResult.total_duplicates}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-blue-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Leads Convertidos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-blue-600">
                    {importResult.leads_converted}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Created Clients List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Clientes Importados com Sucesso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {importResult.created_clients
                    .filter(c => c.status === 'criado')
                    .map((client, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <span className="text-sm text-slate-900 font-medium">{client.name}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Errors */}
            {importResult.errors && importResult.errors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="w-5 h-5" />
                    Erros Encontrados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {importResult.errors.map((error, idx) => (
                      <li key={idx} className="text-sm text-slate-700 bg-red-50 p-3 rounded-lg border border-red-200">
                        ⚠️ {error}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Restart Button */}
            <Button
              onClick={() => {
                setCsvData([]);
                setFileLoaded(false);
                importMutation.reset();
              }}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Fazer Nova Importação
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}