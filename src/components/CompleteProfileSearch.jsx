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
    const [clientName, setClientName] = useState('');
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

    const runCompleteSearch = async () => {
        if (!clientName.trim()) {
            toast.error('Digite o nome do cliente ou clínica');
            return;
        }

        setAnalyzing(true);
        setProgress(0);
        setCurrentStep('Iniciando análise completa...');

        try {
            // ETAPA 1: Busca de dados básicos (20%)
            setCurrentStep('🔍 Buscando informações básicas...');
            setProgress(10);

            const basicSearch = await base44.integrations.Core.InvokeLLM({
                prompt: `Busque informações completas sobre: ${clientName}
                
Procure em:
- Google Search
- Instagram
- Facebook
- LinkedIn
- Google Maps
- Sites de CNPJ (Receita Federal)

Retorne TODOS os dados que encontrar.`,
                add_context_from_internet: true,
                response_json_schema: {
                    type: "object",
                    properties: {
                        nome_completo: { type: "string" },
                        primeiro_nome: { type: "string" },
                        clinica: { type: "string" },
                        cnpj: { type: "string" },
                        razao_social: { type: "string" },
                        endereco: { type: "string" },
                        cidade: { type: "string" },
                        cep: { type: "string" },
                        telefone: { type: "string" },
                        email: { type: "string" },
                        website: { type: "string" },
                        instagram: { type: "string" },
                        facebook: { type: "string" },
                        data_nascimento: { type: "string" },
                        tamanho_empresa: { type: "string" }
                    }
                }
            });

            setProgress(20);

            // ETAPA 2: Análise de Redes Sociais (35%)
            setCurrentStep('📱 Analisando redes sociais...');
            
            const socialAnalysis = await base44.integrations.Core.InvokeLLM({
                prompt: `Analise as redes sociais de ${clientName}:

Instagram: ${basicSearch.instagram || 'buscar'}
Facebook: ${basicSearch.facebook || 'buscar'}
Website: ${basicSearch.website || 'buscar'}

Analise:
1. Estilo de comunicação (formal/informal/técnico)
2. Serviços oferecidos
3. Equipamentos atuais que possui
4. Especialização (clínica geral, cirurgia, laboratório)
5. Tamanho da clínica (pequena/média/grande)
6. Público-alvo
7. Presença digital (forte/média/fraca)`,
                add_context_from_internet: true,
                response_json_schema: {
                    type: "object",
                    properties: {
                        tom_comunicacao: { type: "string" },
                        servicos: { type: "array", items: { type: "string" } },
                        equipamentos_atuais: { type: "array", items: { type: "string" } },
                        especializacao: { type: "string" },
                        tipo_clinica: { type: "string" },
                        presenca_digital: { type: "string" }
                    }
                }
            });

            setProgress(35);

            // ETAPA 3: Análise Numerológica (50%)
            setCurrentStep('🔮 Calculando numerologia...');

            const numerologyAnalysis = await base44.integrations.Core.InvokeLLM({
                prompt: `Análise numerológica completa de: ${basicSearch.nome_completo || clientName}
Data de nascimento: ${basicSearch.data_nascimento || 'não disponível'}

Calcule:
1. Número numerológico do nome
2. Número do caminho de vida (se tiver data)
3. Perfil comportamental
4. Estilo de decisão
5. Melhores dias para fechar venda (próximos 30 dias)
6. Tom de comunicação recomendado
7. Gatilhos mentais mais efetivos`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        numero_nome: { type: "number" },
                        numero_caminho_vida: { type: "number" },
                        perfil_comportamental: { type: "string" },
                        estilo_decisao: { type: "string" },
                        melhores_dias: { type: "array", items: { type: "string" } },
                        tom_recomendado: { type: "string" },
                        gatilhos_efetivos: { type: "array", items: { type: "string" } }
                    }
                }
            });

            setProgress(50);

            // ETAPA 4: Análise de CNPJ e Capital (65%)
            if (basicSearch.cnpj) {
                setCurrentStep('💰 Analisando poder de compra (CNPJ)...');

                const cnpjAnalysis = await base44.integrations.Core.InvokeLLM({
                    prompt: `Analise o CNPJ: ${basicSearch.cnpj}

Busque:
1. Capital social
2. Faturamento estimado
3. Número de funcionários
4. Tempo de mercado
5. Sócios e estrutura
6. Poder real de compra para equipamentos (0-150k)`,
                    add_context_from_internet: true,
                    response_json_schema: {
                        type: "object",
                        properties: {
                            capital_social: { type: "number" },
                            faturamento_estimado: { type: "number" },
                            tempo_mercado: { type: "string" },
                            poder_compra: { type: "number" },
                            score_financeiro: { type: "number" }
                        }
                    }
                });

                basicSearch.valor_real_poder_compra = cnpjAnalysis.poder_compra;
            }

            setProgress(65);

            // ETAPA 5: Recomendação de Equipamento (80%)
            setCurrentStep('🎯 Identificando melhor equipamento...');

            const equipmentRecommendation = await base44.integrations.Core.InvokeLLM({
                prompt: `Cliente: ${clientName}
Tipo: ${socialAnalysis.tipo_clinica}
Serviços: ${socialAnalysis.servicos?.join(', ')}
Equipamentos atuais: ${socialAnalysis.equipamentos_atuais?.join(', ') || 'Nenhum'}
Budget estimado: R$ ${basicSearch.valor_real_poder_compra || 'a definir'}

CATÁLOGO SEAMATY:
1. VG2 (Hematologia) - R$ 45.000 - Para clínicas que fazem 40+ hemogramas/mês
2. BC-2800 (Bioquímica) - R$ 65.000 - Para análises bioquímicas completas
3. Kit Laboratório Completo - R$ 95.000 - VG2 + BC-2800 + reagentes

Recomende:
1. Equipamento principal ideal
2. Razão da recomendação
3. Alternativa (plano B)
4. Principais benefícios para ESTE cliente
5. ROI estimado em meses`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        equipamento_principal: { type: "string" },
                        razao: { type: "string" },
                        alternativa: { type: "string" },
                        beneficios: { type: "array", items: { type: "string" } },
                        roi_meses: { type: "number" }
                    }
                }
            });

            setProgress(80);

            // ETAPA 6: Script de Vendas Personalizado (95%)
            setCurrentStep('💬 Gerando script de vendas...');

            const salesScript = await base44.integrations.Core.InvokeLLM({
                prompt: `Crie um script de vendas personalizado para:

CLIENTE: ${clientName}
Perfil: ${numerologyAnalysis.perfil_comportamental}
Tom: ${numerologyAnalysis.tom_recomendado}
Gatilhos: ${numerologyAnalysis.gatilhos_efetivos?.join(', ')}
Equipamento: ${equipmentRecommendation.equipamento_principal}

CRIE:
1. Abertura personalizada (primeira frase)
2. 3 principais gatilhos mentais a usar
3. Objeções prováveis e respostas
4. Frase de fechamento sugerida
5. Melhor canal de comunicação`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        abertura: { type: "string" },
                        gatilhos_principais: { type: "array", items: { type: "string" } },
                        objecoes_previstas: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    objecao: { type: "string" },
                                    resposta: { type: "string" }
                                }
                            }
                        },
                        frase_fechamento: { type: "string" },
                        canal_recomendado: { type: "string" }
                    }
                }
            });

            setProgress(95);

            // ETAPA 7: Criar Cliente Completo (100%)
            setCurrentStep('💾 Salvando perfil completo...');

            const newClient = await createClientMutation.mutateAsync({
                first_name: basicSearch.primeiro_nome || basicSearch.nome_completo || clientName,
                full_name: basicSearch.nome_completo,
                clinic_name: basicSearch.clinica,
                cnpj: basicSearch.cnpj,
                razao_social: basicSearch.razao_social,
                address: basicSearch.endereco,
                city: basicSearch.cidade,
                cep: basicSearch.cep,
                phone: basicSearch.telefone,
                email: basicSearch.email,
                website: basicSearch.website,
                instagram_handle: basicSearch.instagram?.replace('@', ''),
                facebook_url: basicSearch.facebook,
                birthdate: basicSearch.data_nascimento,
                
                // Numerologia
                numerology_number: numerologyAnalysis.numero_nome,
                life_path_number: numerologyAnalysis.numero_caminho_vida,
                behavioral_profile: numerologyAnalysis.perfil_comportamental,
                decision_style: numerologyAnalysis.estilo_decisao,
                client_tone: numerologyAnalysis.tom_recomendado,
                melhores_dias_venda: numerologyAnalysis.melhores_dias,
                
                // Análise social
                social_media_analysis: JSON.stringify(socialAnalysis),
                
                // Financeiro
                valor_real_poder_compra: basicSearch.valor_real_poder_compra,
                available_budget: basicSearch.valor_real_poder_compra,
                company_size: basicSearch.tamanho_empresa,
                
                // Equipamento
                current_equipment: socialAnalysis.equipamentos_atuais?.join(', ') || 'A definir',
                equipment_suggestion: equipmentRecommendation.equipamento_principal,
                equipment_suggestion_reason: equipmentRecommendation.razao,
                equipment_suggestion_alternative: equipmentRecommendamento.alternativa,
                
                // Vendas
                triggers_used: numerologyAnalysis.gatilhos_efetivos,
                purchase_motivators: equipmentRecommendation.beneficios,
                recommended_communication: salesScript.canal_recomendado,
                approach_tips: salesScript.abertura,
                
                // Status
                status: 'morno',
                purchase_score: 60,
                lead_source: 'analise_mercado_ia',
                client_type: socialAnalysis.tipo_clinica,
                
                // IA Intelligence
                ai_sales_intelligence: {
                    best_approach: salesScript.abertura,
                    key_triggers: salesScript.gatilhos_principais,
                    predicted_objections: salesScript.objecoes_previstas?.map(o => o.objecao) || [],
                    recommended_content: equipmentRecommendation.beneficios,
                    last_ai_analysis: new Date().toISOString()
                }
            });

            setProgress(100);
            setCurrentStep('✅ Perfil completo criado!');

            setResult({
                client: newClient,
                equipamento: equipmentRecommendation.equipamento_principal,
                script: salesScript,
                gatilhos: numerologyAnalysis.gatilhos_efetivos
            });

            // Gerar resumo WhatsApp
            const whatsappSummary = `🎯 *PERFIL COMPLETO GERADO*

👤 *${basicSearch.nome_completo || clientName}*
🏥 ${basicSearch.clinica || 'N/A'}
📍 ${basicSearch.cidade || 'N/A'}
📞 ${basicSearch.telefone || 'N/A'}

💰 *Financeiro*
Poder de Compra: R$ ${(basicSearch.valor_real_poder_compra || 0).toLocaleString('pt-BR')}
${basicSearch.cnpj ? `CNPJ: ${basicSearch.cnpj}` : ''}

🎯 *Equipamento Recomendado*
${equipmentRecommendation.equipamento_principal}
Razão: ${equipmentRecommendation.razao}

🔮 *Perfil Numerológico*
Número: ${numerologyAnalysis.numero_nome}
Perfil: ${numerologyAnalysis.perfil_comportamental}
Tom: ${numerologyAnalysis.tom_recomendado}

💬 *Script de Vendas*
Abertura: "${salesScript.abertura}"

🎯 *Gatilhos Principais*
${salesScript.gatilhos_principais?.map((g, i) => `${i + 1}. ${g}`).join('\n')}

📅 *Melhores Dias para Fechar*
${numerologyAnalysis.melhores_dias?.slice(0, 3).join(', ')}

⚠️ *Objeções Prováveis*
${salesScript.objecoes_previstas?.map((o, i) => `${i + 1}. ${o.objecao}\n   ✓ ${o.resposta}`).join('\n\n')}

🚀 *ROI Estimado*
${equipmentRecommendation.roi_meses} meses

━━━━━━━━━━━━━━━━━━
✅ Cliente cadastrado no CRM
ID: ${newClient.id}`;

            await navigator.clipboard.writeText(whatsappSummary);
            
            toast.success('Perfil completo criado!', {
                description: 'Resumo copiado - cole no WhatsApp',
                duration: 5000
            });

            setTimeout(() => {
                navigate(createPageUrl(`ClientProfile?id=${newClient.id}`));
            }, 2000);

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
                        <p className="text-lg font-bold">🚀 Busca Completa IA</p>
                        <p className="text-xs text-slate-600 font-normal">Análise 360° automatizada</p>
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

                <Input
                    placeholder="Digite o nome do cliente ou clínica..."
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && runCompleteSearch()}
                    className="h-12 text-base"
                    disabled={analyzing}
                />

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
                            ✅ Perfil Criado com Sucesso!
                        </p>
                        <div className="space-y-1 text-sm text-green-800">
                            <p>🎯 Equipamento: {result.equipamento}</p>
                            <p>💬 Abertura: "{result.script.abertura}"</p>
                            <p>🔥 Gatilhos: {result.gatilhos?.join(', ')}</p>
                        </div>
                        <p className="text-xs text-green-700 mt-2">
                            📋 Resumo copiado para área de transferência
                        </p>
                    </div>
                )}

                <Button
                    onClick={runCompleteSearch}
                    disabled={analyzing || !clientName.trim()}
                    className="w-full h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-base font-bold"
                >
                    {analyzing ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Analisando {Math.round(progress)}%
                        </>
                    ) : (
                        <>
                            <Zap className="w-5 h-5 mr-2" />
                            Busca Completa + Salvar
                        </>
                    )}
                </Button>

                <p className="text-xs text-center text-slate-600">
                    Busca TUDO na internet, analisa com IA e cria o perfil completo automaticamente
                </p>
            </CardContent>
        </Card>
    );
}