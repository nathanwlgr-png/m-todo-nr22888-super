import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, Zap, MessageSquare, Calendar, CheckCircle, 
  AlertCircle, FileSpreadsheet, FileText, Send, Upload 
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function SystemManual() {
  const [activeTab, setActiveTab] = useState('overview');

  // Buscar configurações ativas
  const { data: automationRules = [] } = useQuery({
    queryKey: ['automation-rules'],
    queryFn: () => base44.entities.AutomationRule?.list().catch(() => [])
  });

  const { data: followUpRules = [] } = useQuery({
    queryKey: ['followup-sequences'],
    queryFn: () => base44.entities.FollowUpSequence?.list().catch(() => [])
  });

  const { data: taskRules = [] } = useQuery({
    queryKey: ['task-automation'],
    queryFn: () => base44.entities.TaskAutomationRule?.list().catch(() => [])
  });

  const activeAutomations = automationRules.filter(r => r.active);
  const activeFollowUps = followUpRules.filter(r => r.active);
  const activeTaskRules = taskRules.filter(r => r.active);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
          <BookOpen className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Manual do Sistema CRM NR22</h1>
          <p className="text-slate-600">Guia completo de funcionalidades e automações ativas</p>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Automações Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600">{activeAutomations.length}</div>
            <p className="text-xs text-slate-500 mt-1">Regras em execução</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Follow-ups Configurados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{activeFollowUps.length}</div>
            <p className="text-xs text-slate-500 mt-1">Sequências ativas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Tarefas Automáticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{activeTaskRules.length}</div>
            <p className="text-xs text-slate-500 mt-1">Regras de tarefas</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="automations">Automações</TabsTrigger>
          <TabsTrigger value="followups">Follow-ups</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="files">Arquivos Excel/PDF</TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>🎯 Principais Funcionalidades do CRM</CardTitle>
              <CardDescription>Sistema completo de gestão de vendas e relacionamento com clientes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-indigo-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-slate-900">Gestão Inteligente de Clientes</h4>
                    <p className="text-sm text-slate-600">Acompanhe todo histórico, score, perfil comportamental e numerologia de cada cliente</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-slate-900">Automações de Follow-up</h4>
                    <p className="text-sm text-slate-600">Mensagens automáticas baseadas em gatilhos (dias sem contato, status, propostas enviadas)</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-slate-900">WhatsApp Integrado</h4>
                    <p className="text-sm text-slate-600">Envio e recebimento de mensagens, arquivos Excel e PDF diretamente pelo WhatsApp</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-slate-900">Análise Preditiva com IA</h4>
                    <p className="text-sm text-slate-600">Score de conversão, melhor momento de contato, sugestões personalizadas</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-slate-900">Relatórios e Excel Automáticos</h4>
                    <p className="text-sm text-slate-600">Gere planilhas de prospecção e planejamento mensal automaticamente</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automações Ativas */}
        <TabsContent value="automations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>⚡ Automações Ativas no Sistema</CardTitle>
              <CardDescription>Regras configuradas e exemplos de execução</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeAutomations.length === 0 ? (
                <Alert>
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>Nenhuma automação ativa no momento.</AlertDescription>
                </Alert>
              ) : (
                activeAutomations.map((rule, idx) => (
                  <div key={idx} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-slate-900">{rule.name}</h4>
                      <Badge className="bg-green-100 text-green-700">Ativa</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-slate-500">Gatilho:</span>
                        <span className="ml-2 font-medium">{rule.trigger_type}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Ação:</span>
                        <span className="ml-2 font-medium">{rule.action_type}</span>
                      </div>
                    </div>
                    {rule.action_config?.message_template && (
                      <div className="bg-slate-50 p-3 rounded-lg">
                        <p className="text-xs text-slate-500 mb-1">Exemplo de mensagem:</p>
                        <p className="text-sm text-slate-700 italic">"{rule.action_config.message_template}"</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Follow-ups */}
        <TabsContent value="followups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>📧 Sequências de Follow-up Ativas</CardTitle>
              <CardDescription>Mensagens automáticas programadas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeFollowUps.length === 0 ? (
                <Alert>
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>Nenhuma sequência de follow-up ativa.</AlertDescription>
                </Alert>
              ) : (
                activeFollowUps.map((sequence, idx) => (
                  <div key={idx} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-slate-900">{sequence.name}</h4>
                      <Badge className="bg-blue-100 text-blue-700">
                        {sequence.steps?.length || 0} passos
                      </Badge>
                    </div>
                    <div className="text-sm">
                      <span className="text-slate-500">Gatilho:</span>
                      <span className="ml-2 font-medium">{sequence.trigger_type}</span>
                      {sequence.trigger_days && (
                        <span className="ml-2 text-slate-600">({sequence.trigger_days} dias)</span>
                      )}
                    </div>
                    <div className="text-sm">
                      <span className="text-slate-500">Para clientes:</span>
                      {sequence.target_status?.map((status, i) => (
                        <Badge key={i} variant="outline" className="ml-2">{status}</Badge>
                      ))}
                    </div>
                    {sequence.steps && sequence.steps.length > 0 && (
                      <div className="space-y-2 mt-3">
                        <p className="text-xs font-semibold text-slate-600">Exemplos de mensagens:</p>
                        {sequence.steps.slice(0, 2).map((step, i) => (
                          <div key={i} className="bg-blue-50 p-3 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Calendar className="w-3 h-3 text-blue-600" />
                              <span className="text-xs text-blue-600">Dia {step.day_offset} - {step.channel}</span>
                            </div>
                            <p className="text-sm text-slate-700 italic">"{step.message_template}"</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* WhatsApp */}
        <TabsContent value="whatsapp" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>💬 Integração WhatsApp</CardTitle>
              <CardDescription>Como usar o sistema via WhatsApp</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-900 mb-2">✅ Funcionalidades Disponíveis</h4>
                <ul className="space-y-2 text-sm text-green-800">
                  <li className="flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 mt-0.5" />
                    <span>Enviar mensagens personalizadas para clientes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FileSpreadsheet className="w-4 h-4 mt-0.5" />
                    <span>Receber e processar planilhas Excel (prospecção/planejamento)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FileText className="w-4 h-4 mt-0.5" />
                    <span>Receber e processar documentos PDF</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Send className="w-4 h-4 mt-0.5" />
                    <span>Receber relatórios e planilhas gerados pelo sistema</span>
                  </li>
                </ul>
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-slate-900">📤 Como Enviar Arquivos para o Sistema</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-slate-700">
                  <li>Envie o arquivo Excel ou PDF via WhatsApp para o número configurado</li>
                  <li>O sistema detectará automaticamente o tipo de arquivo</li>
                  <li>Para Excel de <strong>prospecção</strong>: o sistema processará e identificará novos leads</li>
                  <li>Para Excel de <strong>planejamento mensal</strong>: o sistema organizará suas visitas e metas</li>
                  <li>Você receberá confirmação e o arquivo processado de volta</li>
                </ol>
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-slate-900">📥 Como Receber Arquivos do Sistema</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-slate-700">
                  <li>Solicite via WhatsApp: "Gerar planilha de prospecção" ou "Gerar planejamento mensal"</li>
                  <li>O sistema gerará o arquivo no formato correto</li>
                  <li>Você receberá o Excel ou PDF diretamente no WhatsApp</li>
                  <li>O arquivo será enviado para o mesmo número que fez a solicitação</li>
                </ol>
              </div>

              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <strong>Importante:</strong> Certifique-se de que a integração WhatsApp Business API está configurada nas Integrações do sistema.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Excel/PDF */}
        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>📊 Gestão de Arquivos Excel e PDF</CardTitle>
              <CardDescription>Modelos e processamento automatizado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-slate-900">Planilha de Prospecção</h4>
                  </div>
                  <p className="text-sm text-slate-600">Modelo para identificar e qualificar novos leads</p>
                  <div className="bg-slate-50 p-3 rounded text-xs space-y-1">
                    <p className="font-semibold">Colunas esperadas:</p>
                    <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                      <li>Nome do Cliente</li>
                      <li>Clínica/Empresa</li>
                      <li>Telefone/WhatsApp</li>
                      <li>Email</li>
                      <li>Cidade</li>
                      <li>Interesse (equipamento)</li>
                      <li>Origem</li>
                    </ul>
                  </div>
                  <Button className="w-full" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Enviar Planilha de Prospecção
                  </Button>
                </div>

                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-slate-900">Planejamento Mensal</h4>
                  </div>
                  <p className="text-sm text-slate-600">Modelo para organizar visitas e metas do mês</p>
                  <div className="bg-slate-50 p-3 rounded text-xs space-y-1">
                    <p className="font-semibold">Colunas esperadas:</p>
                    <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                      <li>Data da Visita</li>
                      <li>Cliente</li>
                      <li>Cidade</li>
                      <li>Objetivo da Visita</li>
                      <li>Status Atual</li>
                      <li>Valor Projetado</li>
                      <li>Observações</li>
                    </ul>
                  </div>
                  <Button className="w-full" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Enviar Planejamento Mensal
                  </Button>
                </div>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Dica:</strong> Após enviar o Excel via WhatsApp, o sistema processará automaticamente e retornará o arquivo enriquecido com análises de IA.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}