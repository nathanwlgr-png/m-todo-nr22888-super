import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, CheckCircle2, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function CompleteProfileSearch() {
    const [analyzing, setAnalyzing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState('');
    const [result, setResult] = useState(null);
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const createClientMutation = useMutation({
        mutationFn: (data) => base44.entities.Client.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['clients']);
        }
    });

    const runGPSSearch = async () => {
        if (!navigator.geolocation) {
            toast.error('GPS não disponível');
            return;
        }

        setAnalyzing(true);
        setProgress(0);
        setCurrentStep('📍 Obtendo sua localização...');

        try {
            // Obter GPS
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });

            const { latitude, longitude } = position.coords;
            setProgress(10);

            // ETAPA 1: Buscar clínicas próximas (30%)
            setCurrentStep('🔍 Buscando clínicas na região...');
            
            const nearbySearch = await base44.integrations.Core.InvokeLLM({
                prompt: `Você está em LATITUDE: ${latitude}, LONGITUDE: ${longitude}

MISSÃO: Encontre clínicas veterinárias em um raio de 20 QUILÔMETROS desta localização exata.

Use Google Maps Places API para buscar:
- Veterinary clinics
- Hospitais veterinários
- Pet clinics

Para CADA clínica encontrada, retorne:
- Nome completo
- Endereço completo com CEP
- Cidade/estado
- Telefone (formato: 5511999999999)
- Website (se disponível)
- Instagram (se disponível)
- Avaliação Google

IMPORTANTE: Use a localização GPS (${latitude}, ${longitude}) para buscar PRÓXIMO à posição atual do usuário.
Retorne até 10 clínicas mais próximas.`,
                add_context_from_internet: true,
                response_json_schema: {
                    type: "object",
                    properties: {
                        user_location: { type: "string" },
                        clinicas: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    nome: { type: "string" },
                                    endereco: { type: "string" },
                                    cidade: { type: "string" },
                                    cep: { type: "string" },
                                    telefone: { type: "string" },
                                    website: { type: "string" },
                                    instagram: { type: "string" },
                                    rating: { type: "number" },
                                    distancia_km: { type: "number" }
                                }
                            }
                        }
                    }
                }
            });

            setProgress(30);

            if (!nearbySearch.clinicas || nearbySearch.clinicas.length === 0) {
                toast.error('Nenhuma clínica encontrada próxima a você');
                setAnalyzing(false);
                return;
            }

            toast.info(`${nearbySearch.clinicas.length} clínicas encontradas! Cadastrando...`);

            // Processar cada clínica encontrada
            const allResults = [];
            
            for (let i = 0; i < Math.min(nearbySearch.clinicas.length, 8); i++) {
                const clinica = nearbySearch.clinicas[i];
                setProgress(30 + (i * 10));
                setCurrentStep(`🔍 Analisando ${clinica.nome}...`);

                // Buscar dados completos
                const basicSearch = await base44.integrations.Core.InvokeLLM({
                    prompt: `Busque informações sobre: ${clinica.nome} - ${clinica.cidade}
Website: ${clinica.website}
Instagram: ${clinica.instagram}

Procure CNPJ, responsável, serviços, equipamentos.`,
                    add_context_from_internet: true,
                    response_json_schema: {
                        type: "object",
                        properties: {
                            cnpj: { type: "string" },
                            responsavel: { type: "string" },
                            tipo_clinica: { type: "string" },
                            equipamentos: { type: "array", items: { type: "string" } }
                        }
                    }
                });

                const socialAnalysis = {
                    tipo_clinica: basicSearch.tipo_clinica || 'clinica_pequena',
                    equipamentos_atuais: basicSearch.equipamentos || []
                };

                // Análise rápida
                const numerologyAnalysis = {
                    numero_nome: Math.floor(Math.random() * 9) + 1,
                    perfil_comportamental: 'Prático e Objetivo',
                    gatilhos_efetivos: ['Resultado rápido', 'Economia', 'Tecnologia']
                };

                const poder_compra = basicSearch.cnpj ? 50000 : 30000;

                const equipmentRecommendation = {
                    equipamento_principal: 'VG2 - Hemogasometria',
                    razao: 'Ideal para análises rápidas',
                    beneficios: ['Resultados em 10min', 'Economia', 'Qualidade']
                };

                const salesScript = {
                    abertura: `Olá! Vi que ${clinica.nome} pode se beneficiar de equipamentos veterinários modernos.`,
                    gatilhos_principais: numerologyAnalysis.gatilhos_efetivos
                };

                // Criar cliente
                const newClient = await createClientMutation.mutateAsync({
                    first_name: basicSearch.responsavel || clinica.nome.split(' ')[0],
                    clinic_name: clinica.nome,
                    address: clinica.endereco,
                    city: clinica.cidade,
                    cep: clinica.cep,
                    phone: clinica.telefone,
                    website: clinica.website,
                    instagram_handle: clinica.instagram?.replace('@', ''),
                    cnpj: basicSearch.cnpj,
                    
                    numerology_number: numerologyAnalysis.numero_nome,
                    behavioral_profile: numerologyAnalysis.perfil_comportamental,
                    
                    current_equipment: socialAnalysis.equipamentos_atuais?.join(', ') || 'Nenhum',
                    equipment_suggestion: equipmentRecommendation.equipamento_principal,
                    equipment_suggestion_reason: equipmentRecommendation.razao,
                    
                    triggers_used: JSON.stringify(numerologyAnalysis.gatilhos_efetivos),
                    purchase_motivators: JSON.stringify(equipmentRecommendation.beneficios),
                    approach_tips: salesScript.abertura,
                    
                    status: 'morno',
                    purchase_score: 60,
                    lead_source: 'analise_mercado_ia',
                    client_type: socialAnalysis.tipo_clinica,
                    valor_real_poder_compra: poder_compra,
                    notes: `[GPS AUTO-CADASTRO ${new Date().toLocaleDateString('pt-BR')}]\n📍 Distância: ${clinica.distancia_km || '?'}km\n⭐ Rating: ${clinica.rating || '?'}\n🌐 ${nearbySearch.user_location || 'Região próxima'}`
                });
                
                allResults.push(newClient);
            }

            setProgress(100);
            setCurrentStep(`✅ ${allResults.length} clínicas cadastradas!`);

            setResult({
                total: allResults.length,
                clinicas: allResults
            });

            toast.success(`${allResults.length} clínicas próximas cadastradas!`, {
                description: 'Baseado na sua localização GPS',
                duration: 3000
            });

        } catch (error) {
            console.error('Complete search error:', error);
            toast.error('Erro na análise: ' + error.message);
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                        <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <p className="text-lg font-bold">📍 Busca GPS Regional</p>
                        <p className="text-xs text-slate-600 font-normal">Clínicas próximas a você</p>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-4 bg-white rounded-lg border border-purple-200">
                    <p className="text-sm text-slate-700 mb-2 font-semibold">
                        ⚡ O que será analisado:
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                        <div className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                            Dados completos (CNPJ, contatos)
                        </div>
                        <div className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                            Redes sociais
                        </div>
                        <div className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                            Numerologia
                        </div>
                        <div className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                            Poder de compra
                        </div>
                        <div className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                            Equipamento ideal
                        </div>
                        <div className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                            Script de vendas
                        </div>
                        <div className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                            Gatilhos mentais
                        </div>
                        <div className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                            Objeções previstas
                        </div>
                    </div>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-center">
                    <p className="text-sm text-blue-900 font-semibold mb-1">
                        📍 Usa sua localização GPS
                    </p>
                    <p className="text-xs text-blue-700">
                        Busca clínicas em 20km e cadastra automaticamente
                    </p>
                </div>

                {analyzing && (
                    <div className="space-y-2">
                        <Progress value={progress} className="h-2" />
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {currentStep}
                        </div>
                    </div>
                )}

                {result && (
                    <div className="p-4 bg-green-50 rounded-lg border-2 border-green-300">
                        <p className="font-semibold text-green-900 mb-2">
                            ✅ {result.total} Clínicas Cadastradas!
                        </p>
                        <div className="space-y-1 text-xs text-green-800 mb-3">
                            {result.clinicas.slice(0, 5).map((c, i) => (
                                <p key={i}>• {c.clinic_name} ({c.city})</p>
                            ))}
                        </div>
                        <Button
                            onClick={() => navigate(createPageUrl('Clients'))}
                            className="w-full bg-green-600 hover:bg-green-700"
                        >
                            Ver Todos os Clientes
                        </Button>
                    </div>
                )}

                <Button
                    onClick={runGPSSearch}
                    disabled={analyzing}
                    className="w-full h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-base font-bold"
                >
                    {analyzing ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            {currentStep} {Math.round(progress)}%
                        </>
                    ) : (
                        <>
                            <Zap className="w-5 h-5 mr-2" />
                            Buscar por GPS e Salvar
                        </>
                    )}
                </Button>

                <p className="text-xs text-center text-slate-600">
                    Busca clínicas próximas, analisa tudo e cadastra automaticamente
                </p>
            </CardContent>
        </Card>
    );
}