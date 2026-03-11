import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sparkles, 
  Users, 
  UserPlus, 
  Loader2, 
  CheckCircle2,
  AlertTriangle,
  Database,
  Trash2,
  RefreshCw
} from 'lucide-react';

export default function AutoDataManager() {
  const [activeTab, setActiveTab] = useState('Client');
  const [processing, setProcessing] = useState(false);
  const [autoDelete, setAutoDelete] = useState(true);
  const [enrichData, setEnrichData] = useState(true);
  const [result, setResult] = useState(null);

  const processData = async (entityType) => {
    setProcessing(true);
    setResult(null);

    try {
      const response = await base44.functions.invoke('autoCleanAndEnrichData', {
        entity_type: entityType,
        auto_delete_duplicates: autoDelete,
        enrich_data: enrichData
      });

      setResult(response.data);
    } catch (error) {
      console.error('Erro ao processar dados:', error);
      alert('Erro ao processar dados: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-purple-600" />
          Gerenciador Automático de Dados
        </h1>
        <p className="text-slate-600 mt-2">
          Limpeza de duplicatas e enriquecimento automático com dados de CNPJ, CEP e APIs públicas
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="Client" className="gap-2">
            <Users className="w-4 h-4" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="Lead" className="gap-2">
            <UserPlus className="w-4 h-4" />
            Leads
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6 mt-6">
          {/* Configurações */}
          <Card className="border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Configurações do Processamento
              </CardTitle>
              <CardDescription>
                Configure como o sistema deve limpar e enriquecer os dados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                <div className="space-y-1">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-red-600" />
                    Excluir Duplicatas Automaticamente
                  </Label>
                  <p className="text-sm text-slate-600">
                    Remove registros duplicados, mantendo o mais completo e mesclando dados únicos
                  </p>
                </div>
                <Switch
                  checked={autoDelete}
                  onCheckedChange={setAutoDelete}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                <div className="space-y-1">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    Enriquecer Dados Automaticamente
                  </Label>
                  <p className="text-sm text-slate-600">
                    Busca dados de CNPJ, CEP, Razão Social e complementa informações faltantes
                  </p>
                </div>
                <Switch
                  checked={enrichData}
                  onCheckedChange={setEnrichData}
                />
              </div>

              <Alert className="border-blue-300 bg-blue-50">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Atenção:</strong> Este processo pode levar alguns minutos dependendo da quantidade de registros.
                  Recomendado executar fora do horário de pico.
                </AlertDescription>
              </Alert>

              <Button
                onClick={() => processData(activeTab)}
                disabled={processing}
                size="lg"
                className="w-full bg-purple-600 hover:bg-purple-700 gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    Processar {activeTab === 'Client' ? 'Clientes' : 'Leads'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Resultados */}
          {result && (
            <div className="space-y-4">
              <Alert className="border-green-300 bg-green-50">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <AlertDescription>
                  <strong className="text-green-800 text-lg">
                    Processamento Concluído com Sucesso!
                  </strong>
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-3xl font-bold text-orange-600">
                      {result.summary.duplicates_found}
                    </div>
                    <div className="text-sm text-slate-600">Duplicatas Encontradas</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-3xl font-bold text-red-600">
                      {result.summary.duplicates_deleted}
                    </div>
                    <div className="text-sm text-slate-600">Registros Deletados</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-3xl font-bold text-green-600">
                      {result.summary.records_enriched}
                    </div>
                    <div className="text-sm text-slate-600">Registros Enriquecidos</div>
                  </CardContent>
                </Card>
              </div>

              {result.summary.errors.length > 0 && (
                <Card className="border-yellow-300 bg-yellow-50">
                  <CardHeader>
                    <CardTitle className="text-lg text-yellow-800 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Avisos ({result.summary.errors.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {result.summary.errors.map((error, idx) => (
                        <div key={idx} className="text-sm text-yellow-800 bg-yellow-100 p-2 rounded">
                          {error}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="border-purple-300 bg-purple-50">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-purple-800 mb-3">O que foi feito:</h3>
                  <ul className="space-y-2 text-sm text-purple-700">
                    {autoDelete && (
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>
                          Duplicatas removidas automaticamente, mantendo o registro mais completo e 
                          mesclando dados únicos de cada duplicata
                        </span>
                      </li>
                    )}
                    {enrichData && (
                      <>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>
                            Dados de CNPJ consultados via BrasilAPI (Razão Social, Nome Fantasia, 
                            Endereço, Telefone, Email, Data de Abertura)
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>
                            Endereços completados via ViaCEP quando disponível CEP
                          </span>
                        </li>
                      </>
                    )}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}