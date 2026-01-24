import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink, TrendingUp, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SalesforceOpportunitySync({ client }) {
  const [syncing, setSyncing] = useState(false);
  const [opportunityUrl, setOpportunityUrl] = useState(null);

  const syncToSalesforce = async () => {
    setSyncing(true);
    try {
      const result = await base44.functions.invoke('createSalesforceOpportunity', {
        client_id: client.id
      });

      setOpportunityUrl(result.salesforce_url);
      toast.success('Oportunidade criada no Salesforce!');
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao sincronizar: ' + error.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card className="border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-red-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-900">
          <TrendingUp className="w-5 h-5" />
          Salesforce Opportunity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!opportunityUrl ? (
          <>
            <p className="text-sm text-gray-700">
              Criar oportunidade automática no Salesforce
            </p>
            <Button
              onClick={syncToSalesforce}
              disabled={syncing}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {syncing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <TrendingUp className="w-4 h-4 mr-2" />
              )}
              Criar no Salesforce
            </Button>
          </>
        ) : (
          <div className="space-y-3">
            <div className="p-3 bg-green-50 rounded-lg border-2 border-green-300">
              <p className="text-sm font-semibold text-green-800 flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4" />
                Oportunidade criada!
              </p>
              <Button
                onClick={() => window.open(opportunityUrl, '_blank')}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir no Salesforce
              </Button>
            </div>
            <Button
              onClick={() => setOpportunityUrl(null)}
              variant="outline"
              className="w-full"
            >
              Nova Sincronização
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}