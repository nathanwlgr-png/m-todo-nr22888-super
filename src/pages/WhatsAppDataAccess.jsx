import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
    MessageSquare, 
    Users, 
    TrendingUp, 
    FileText, 
    Copy, 
    Send,
    Search,
    Database,
    ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function WhatsAppDataAccess() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [copiedSection, setCopiedSection] = useState('');

    const { data: clients = [] } = useQuery({
        queryKey: ['clients'],
        queryFn: () => base44.entities.Client.list(),
    });

    const { data: sales = [] } = useQuery({
        queryKey: ['sales'],
        queryFn: () => base44.entities.Sale.list(),
    });

    const { data: tasks = [] } = useQuery({
        queryKey: ['all-tasks'],
        queryFn: () => base44.entities.Task.list(),
    });

    const { data: user } = useQuery({
        queryKey: ['current-user'],
        queryFn: () => base44.auth.me(),
    });

    const filteredClients = clients.filter(c =>
        c.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.clinic_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const copyToClipboard = async (text, section) => {
        await navigator.clipboard.writeText(text);
        setCopiedSection(section);
        toast.success('Copiado!');
        setTimeout(() => setCopiedSection(''), 2000);
    };

    const generateFullExport = () => {
        const clientsHot = clients.filter(c => c.status === 'quente');
        const salesClosed = sales.filter(s => s.status === 'fechada');
        const tasksPending = tasks.filter(t => t.status === 'pendente');

        return `🔥 *CRM COMPLETO - ACESSO TOTAL*
📅 ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}

📊 *RESUMO GERAL*
━━━━━━━━━━━━━━━━━━━━
👥 Total Clientes: ${clients.length}
🔥 Quentes: ${clientsHot.length}
🌡️ Mornos: ${clients.filter(c => c.status === 'morno').length}
❄️ Frios: ${clients.filter(c => c.status === 'frio').length}

💰 *VENDAS*
━━━━━━━━━━━━━━━━━━━━
✅ Fechadas: ${salesClosed.length}
💵 Receita Total: R$ ${salesClosed.reduce((sum, s) => sum + (s.sale_value || 0), 0).toLocaleString('pt-BR')}
📈 Ticket Médio: R$ ${(salesClosed.reduce((sum, s) => sum + (s.sale_value || 0), 0) / salesClosed.length || 0).toLocaleString('pt-BR')}

✅ *TAREFAS*
━━━━━━━━━━━━━━━━━━━━
⏳ Pendentes: ${tasksPending.length}
⚠️ Atrasadas: ${tasks.filter(t => t.status === 'pendente' && new Date(t.due_date) < new Date()).length}

🔥 *TOP 10 CLIENTES QUENTES*
━━━━━━━━━━━━━━━━━━━━
${clientsHot.slice(0, 10).map((c, i) => 
`${i + 1}. ${c.first_name}
   📍 ${c.city || 'N/A'}
   🎯 Score: ${c.purchase_score || 0}%
   💰 Budget: R$ ${(c.available_budget || 0).toLocaleString('pt-BR')}
   📦 Interesse: ${c.equipment_interest || 'N/A'}
   📱 ${c.phone || 'Sem WhatsApp'}`).join('\n\n')}

━━━━━━━━━━━━━━━━━━━━
Gerado via CRM NR22 🚀`;
    };

    const generateQuickStats = () => {
        return `📊 *STATUS RÁPIDO CRM*

👥 ${clients.length} clientes
🔥 ${clients.filter(c => c.status === 'quente').length} quentes
💰 R$ ${sales.filter(s => s.status === 'fechada').reduce((sum, s) => sum + (s.sale_value || 0), 0).toLocaleString('pt-BR')} em vendas
✅ ${tasks.filter(t => t.status === 'pendente').length} tarefas pendentes

${new Date().toLocaleString('pt-BR')}`;
    };

    const generateClientDetails = (client) => {
        const clientSales = sales.filter(s => s.client_id === client.id);
        const clientTasks = tasks.filter(t => t.client_id === client.id);

        return `👤 *${client.first_name}*
━━━━━━━━━━━━━━━━━━━━

🏥 *Dados*
Clínica: ${client.clinic_name || 'N/A'}
📍 ${client.city || 'N/A'}
📧 ${client.email || 'N/A'}
📱 ${client.phone || 'N/A'}
${client.cnpj ? `🏢 CNPJ: ${client.cnpj}` : ''}

📊 *Perfil*
Status: ${client.status === 'quente' ? '🔥' : client.status === 'morno' ? '🌡️' : '❄️'} ${client.status}
Score: ${client.purchase_score || 0}%
Segmento: ${client.ai_segment || 'N/A'}
LTV: R$ ${(client.ltv_estimate || 0).toLocaleString('pt-BR')}

${client.numerology_number ? `🔮 Numerologia: ${client.numerology_number} - ${client.behavioral_profile}` : ''}

🎯 *Interesse*
Equipamento: ${client.equipment_interest || 'N/A'}
Atual: ${client.current_equipment || 'Nenhum'}
Budget: R$ ${(client.available_budget || 0).toLocaleString('pt-BR')}

💰 *Vendas*
Total: ${clientSales.length}
Receita: R$ ${clientSales.reduce((sum, s) => sum + (s.sale_value || 0), 0).toLocaleString('pt-BR')}

✅ *Tarefas*
Pendentes: ${clientTasks.filter(t => t.status === 'pendente').length}

${client.next_action ? `📌 Próxima Ação: ${client.next_action}` : ''}

━━━━━━━━━━━━━━━━━━━━`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <MessageSquare className="h-8 w-8 text-green-600" />
                            Acesso Total WhatsApp
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Todos os dados do CRM via WhatsApp
                        </p>
                    </div>
                </div>

                <Tabs defaultValue="full" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="full">Completo</TabsTrigger>
                        <TabsTrigger value="quick">Resumo</TabsTrigger>
                        <TabsTrigger value="clients">Clientes</TabsTrigger>
                        <TabsTrigger value="reports">Relatórios</TabsTrigger>
                    </TabsList>

                    <TabsContent value="full" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Database className="h-5 w-5 text-green-600" />
                                    Exportação Completa
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                    <p className="text-sm text-green-800 mb-3">
                                        Gera um relatório completo com todos os dados do CRM
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button
                                            onClick={() => {
                                                const report = generateFullExport();
                                                copyToClipboard(report, 'full');
                                            }}
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            <Copy className="h-4 w-4 mr-2" />
                                            Copiar
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                const report = generateFullExport();
                                                const phone = user?.phone || '';
                                                window.open(
                                                    `https://wa.me/${phone}?text=${encodeURIComponent(report)}`,
                                                    '_blank'
                                                );
                                            }}
                                            variant="outline"
                                        >
                                            <Send className="h-4 w-4 mr-2" />
                                            Enviar
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="quick" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Status Rápido</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="p-4 bg-blue-50 rounded-lg mb-4">
                                    <pre className="text-xs whitespace-pre-wrap text-blue-900">
                                        {generateQuickStats()}
                                    </pre>
                                </div>
                                <Button
                                    onClick={() => copyToClipboard(generateQuickStats(), 'quick')}
                                    className="w-full"
                                >
                                    <Copy className="h-4 w-4 mr-2" />
                                    {copiedSection === 'quick' ? 'Copiado!' : 'Copiar Status'}
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="clients" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Dados de Clientes</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Buscar cliente..."
                                        className="pl-9"
                                    />
                                </div>

                                <div className="max-h-96 overflow-y-auto space-y-3">
                                    {filteredClients.slice(0, 20).map(client => (
                                        <div key={client.id} className="p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <div className="font-semibold text-gray-900">
                                                        {client.first_name}
                                                    </div>
                                                    <div className="text-xs text-gray-600">
                                                        {client.clinic_name} • {client.city}
                                                    </div>
                                                </div>
                                                <Badge className={
                                                    client.status === 'quente' ? 'bg-red-100 text-red-800' :
                                                    client.status === 'morno' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-blue-100 text-blue-800'
                                                }>
                                                    {client.status}
                                                </Badge>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    const details = generateClientDetails(client);
                                                    copyToClipboard(details, client.id);
                                                }}
                                                className="w-full"
                                            >
                                                <Copy className="h-3 w-3 mr-2" />
                                                {copiedSection === client.id ? 'Copiado!' : 'Copiar Dados'}
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="reports" className="mt-6">
                        <AutoReportScheduler />
                    </TabsContent>
                </Tabs>

                {/* Instruções */}
                <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                    <CardContent className="pt-6">
                        <h3 className="font-semibold text-green-900 mb-2">
                            📱 Como usar via WhatsApp
                        </h3>
                        <ol className="text-sm text-green-800 space-y-2">
                            <li>1. Clique em "Copiar" no dado desejado</li>
                            <li>2. Abra o WhatsApp Web ou App</li>
                            <li>3. Cole e envie para você mesmo ou equipe</li>
                            <li>4. Acesse de qualquer lugar!</li>
                        </ol>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function AutoReportScheduler() {
    return (
        <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Use a aba "Completo" ou "Clientes" para exportar dados</p>
        </div>
    );
}