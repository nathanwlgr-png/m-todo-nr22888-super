import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AISalesCoach from '../components/AISalesCoach';
import { GraduationCap, Users, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SalesCoaching() {
    const navigate = useNavigate();
    const [selectedClient, setSelectedClient] = useState(null);

    const { data: clients = [] } = useQuery({
        queryKey: ['clients'],
        queryFn: () => base44.entities.Client.list(),
    });

    const clientContext = selectedClient ? {
        name: selectedClient.first_name,
        company: selectedClient.clinic_name,
        status: selectedClient.status,
        equipment_interest: selectedClient.equipment_interest,
        current_equipment: selectedClient.current_equipment,
        numerology_number: selectedClient.numerology_number,
        decision_role: selectedClient.decision_role,
        approach_tips: selectedClient.approach_tips
    } : null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(-1)}
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold flex items-center gap-3">
                                <GraduationCap className="h-8 w-8 text-purple-600" />
                                AI Sales Coaching
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Receba feedback personalizado sobre suas interações de vendas
                            </p>
                        </div>
                    </div>
                </div>

                <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                    <CardHeader>
                        <CardTitle className="text-2xl">Como Funciona</CardTitle>
                        <CardDescription className="text-purple-100">
                            Maximize seu desempenho com coaching de IA especializado em vendas veterinárias
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="bg-white/20 rounded-full p-2 mt-0.5">
                                <span className="text-sm font-bold">1</span>
                            </div>
                            <div>
                                <div className="font-semibold">Cole a Transcrição</div>
                                <div className="text-sm text-purple-100">
                                    Adicione a transcrição da chamada, reunião ou notas da interação
                                </div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="bg-white/20 rounded-full p-2 mt-0.5">
                                <span className="text-sm font-bold">2</span>
                            </div>
                            <div>
                                <div className="font-semibold">Selecione o Cliente (Opcional)</div>
                                <div className="text-sm text-purple-100">
                                    Para análise mais precisa, selecione o cliente relacionado
                                </div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="bg-white/20 rounded-full p-2 mt-0.5">
                                <span className="text-sm font-bold">3</span>
                            </div>
                            <div>
                                <div className="font-semibold">Receba Feedback Detalhado</div>
                                <div className="text-sm text-purple-100">
                                    A IA analisa técnicas, objeções e sugere melhorias específicas
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-600" />
                            Selecionar Cliente (Opcional)
                        </CardTitle>
                        <CardDescription>
                            Escolha um cliente para análise contextualizada com dados do CRM
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Select onValueChange={(id) => setSelectedClient(clients.find(c => c.id === id))}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione um cliente..." />
                            </SelectTrigger>
                            <SelectContent>
                                {clients.map(client => (
                                    <SelectItem key={client.id} value={client.id}>
                                        {client.first_name} - {client.clinic_name || 'Sem clínica'}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {selectedClient && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm">
                                <div className="font-semibold text-blue-900">Cliente Selecionado:</div>
                                <div className="text-blue-700 mt-1">
                                    {selectedClient.first_name} - {selectedClient.clinic_name}
                                </div>
                                {selectedClient.equipment_interest && (
                                    <div className="text-blue-600 text-xs mt-1">
                                        Interesse: {selectedClient.equipment_interest}
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <AISalesCoach 
                    clientContext={clientContext}
                    interactionType="call"
                />
            </div>
        </div>
    );
}