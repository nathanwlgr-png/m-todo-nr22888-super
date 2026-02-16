import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, Upload, FileText, CheckCircle, AlertCircle, 
  Zap, Settings, Copy, ExternalLink 
} from 'lucide-react';
import { toast } from 'sonner';

export default function WhatsAppMasterAssistant() {
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [capabilities, setCapabilities] = useState([]);
  const [recentActions, setRecentActions] = useState([]);

  useEffect(() => {
    initializeAssistant();
    loadRecentActions();
  }, []);

  const initializeAssistant = async () => {
    try {
      const url = base44.agents.getWhatsAppConnectURL('whatsapp_master_sales');
      setWhatsappUrl(url);
      
      setCapabilities([
        {
          title: '📊 Importar Tabelas',
          description: 'Excel, PDF, Word, CSV, imagens - qualquer formato',
          status: 'active'
        },
        {
          title: '📄 Propostas Personalizadas',
          description: 'Word → PDF com dados do cliente automaticamente',
          status: 'active'
        },
        {
          title: '💼 Buscar Clientes & Produtos',
          description: 'Acesso total ao CRM para consultas',
          status: 'active'
        },
        {
          title: '📈 Gerar Relatórios',
          description: 'Exportar dados em múltiplos formatos',
          status: 'active'
        }
      ]);
    } catch (error) {
      toast.error('Erro ao carregar assistente');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecentActions = async () => {
    try {
      const docs = await base44.entities.AIKnowledgeDocument?.filter({}, '-created_date', 5).catch(() => []);
      setRecentActions(docs || []);
    } catch (error) {
      console.error('Erro ao carregar ações recentes');
    }
  };

  const copyWhatsAppLink = () => {
    if (whatsappUrl) {
      navigator.clipboard.writeText(whatsappUrl);
      toast.success('Link copiado!');
    }
  };

  const openWhatsApp = () => {
    if (whatsappUrl) {
      window.open(whatsappUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">WhatsApp Master Assistant</h1>
              <p className="text-gray-600">Seu assistente IA com acesso total ao CRM</p>
            </div>
          </div>
        </div>

        {/* Main Connect Card */}
        {whatsappUrl && (
          <Card className="border-2 border-green-300 bg-white mb-8 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Conectar ao WhatsApp
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-gray-700 mb-4">
                Clique para abrir o WhatsApp e começar a usar o assistente Master:
              </p>
              <div className="flex gap-3">
                <Button 
                  onClick={openWhatsApp}
                  className="bg-green-600 hover:bg-green-700 text-white text-lg px-6 py-6 flex items-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Abrir no WhatsApp
                </Button>
                <Button 
                  onClick={copyWhatsAppLink}
                  variant="outline"
                  className="px-4"
                >
                  <Copy className="w-4 h-4" />
                  Copiar Link
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Capabilities */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Capacidades</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {capabilities.map((cap, idx) => (
              <Card key={idx} className="border-l-4 border-l-green-600">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-1">{cap.title}</h3>
                      <p className="text-sm text-gray-600">{cap.description}</p>
                    </div>
                    <Badge className="bg-green-600">Ativo</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Como Usar */}
        <Card className="mb-8 border-blue-300 bg-blue-50">
          <CardHeader className="bg-blue-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Como Usar
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div>
              <h4 className="font-bold text-gray-900 mb-2">📊 Importar Tabelas</h4>
              <p className="text-gray-700">
                Envie qualquer tabela (Excel, PDF, Word, CSV) ou imagem com dados. O assistente lê automaticamente e cadastra no CRM. Ele identifica os campos sozinho!
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-gray-900 mb-2">📄 Gerar Propostas em PDF</h4>
              <p className="text-gray-700">
                1. Envie a proposta em Word com placeholders como <code className="bg-gray-200 px-1">{{'{cliente}'}}</code>, <code className="bg-gray-200 px-1">{{'{email}'}}</code>, etc<br/>
                2. Diga: <em>"Proposta do João Silva"</em><br/>
                3. Ele busca os dados no CRM, personaliza e envia PDF pronto
              </p>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-2">💼 Consultar Dados</h4>
              <p className="text-gray-700">
                Pergunte por clientes, produtos, preços, o assistente busca tudo no CRM em tempo real.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-2">📈 Exportar Tudo</h4>
              <p className="text-gray-700">
                PDF, tabelas, relatórios - peça no formato que quiser e ele gera instantaneamente.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Actions */}
        {recentActions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Ações Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActions.map((action) => (
                  <div key={action.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{action.title}</p>
                      <p className="text-sm text-gray-600">{action.summary}</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(action.created_date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}