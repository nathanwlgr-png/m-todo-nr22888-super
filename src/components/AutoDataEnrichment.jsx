import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, RefreshCw, CheckCircle2, Globe, Instagram, Facebook, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function AutoDataEnrichment({ client }) {
    const [isEnriching, setIsEnriching] = useState(false);
    const [enrichmentResults, setEnrichmentResults] = useState(null);
    const queryClient = useQueryClient();

    const updateClientMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.Client.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['client', client.id]);
            queryClient.invalidateQueries(['clients']);
        }
    });

    const enrichClientData = async () => {
        setIsEnriching(true);
        try {
            // 1. Buscar redes sociais
            const socialMediaPrompt = `Encontre perfis de redes sociais desta clínica veterinária:

Clínica: ${client.clinic_name || client.first_name}
Cidade: ${client.city || 'N/A'}
Website: ${client.website || 'N/A'}
Email: ${client.email || 'N/A'}

Usando busca na internet, encontre:
1. Instagram handle (sem @)
2. Facebook page URL
3. Outros canais relevantes

Retorne apenas dados que você encontrou com alta confiança.`;

            const socialMedia = await base44.integrations.Core.InvokeLLM({
                prompt: socialMediaPrompt,
                add_context_from_internet: true,
                response_json_schema: {
                    type: "object",
                    properties: {
                        instagram_handle: { type: "string" },
                        facebook_url: { type: "string" },
                        other_social: { type: "array", items: { type: "string" } },
                        confidence: { type: "number" }
                    }
                }
            });

            // 2. Verificar/Buscar CNPJ
            let cnpjData = null;
            if (!client.cnpj && client.clinic_name) {
                const cnpjPrompt = `Busque dados de CNPJ desta empresa veterinária:

Nome: ${client.clinic_name}
Cidade: ${client.city || 'N/A'}
Estado: ${client.city ? 'São Paulo' : 'N/A'}

Encontre:
1. CNPJ (apenas números)
2. Razão social oficial
3. Data de abertura
4. Porte da empresa`;

                cnpjData = await base44.integrations.Core.InvokeLLM({
                    prompt: cnpjPrompt,
                    add_context_from_internet: true,
                    response_json_schema: {
                        type: "object",
                        properties: {
                            cnpj: { type: "string" },
                            razao_social: { type: "string" },
                            data_abertura: { type: "string" },
                            porte: { type: "string" },
                            confidence: { type: "number" }
                        }
                    }
                });
            }

            // 3. Escanear website para serviços e equipamentos
            let websiteData = null;
            if (client.website) {
                const websitePrompt = `Analise o website desta clínica veterinária:

URL: ${client.website}

Extraia:
1. Serviços oferecidos (lista)
2. Especializações (pequenos animais, grandes animais, exóticos, etc)
3. Equipamentos mencionados no site
4. Necessidades de laboratório inferidas (hemograma, bioquímico, etc)
5. Volume estimado de atendimentos (alto/médio/baixo)

Use busca na internet para acessar o site.`;

                websiteData = await base44.integrations.Core.InvokeLLM({
                    prompt: websitePrompt,
                    add_context_from_internet: true,
                    response_json_schema: {
                        type: "object",
                        properties: {
                            services: { type: "array", items: { type: "string" } },
                            specializations: { type: "array", items: { type: "string" } },
                            equipment_mentioned: { type: "array", items: { type: "string" } },
                            lab_needs_inferred: { type: "array", items: { type: "string" } },
                            estimated_volume: { type: "string" },
                            summary: { type: "string" }
                        }
                    }
                });
            }

            // Consolidar resultados
            const results = {
                socialMedia,
                cnpjData,
                websiteData,
                timestamp: new Date().toISOString()
            };

            setEnrichmentResults(results);

            // Atualizar dados automaticamente
            const updates = {};
            
            if (socialMedia?.instagram_handle && socialMedia.confidence > 70) {
                updates.instagram_handle = socialMedia.instagram_handle;
            }
            
            if (cnpjData?.cnpj && cnpjData.confidence > 70) {
                updates.cnpj = cnpjData.cnpj;
                updates.razao_social = cnpjData.razao_social;
            }

            if (websiteData) {
                updates.ai_website_analysis = JSON.stringify(websiteData);
                if (websiteData.lab_needs_inferred?.length > 0) {
                    updates.lab_needs = websiteData.lab_needs_inferred;
                }
            }

            if (Object.keys(updates).length > 0) {
                await updateClientMutation.mutateAsync({
                    id: client.id,
                    data: updates
                });
                toast.success('Dados enriquecidos com sucesso!');
            } else {
                toast.info('Nenhum dado novo encontrado');
            }

        } catch (error) {
            console.error('Enrichment error:', error);
            toast.error('Erro ao enriquecer dados');
        } finally {
            setIsEnriching(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-blue-600" />
                        Enriquecimento Automático
                    </div>
                    <Button
                        onClick={enrichClientData}
                        disabled={isEnriching}
                        size="sm"
                    >
                        {isEnriching ? (
                            <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Enriquecendo...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Enriquecer Dados
                            </>
                        )}
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {!enrichmentResults ? (
                    <div className="text-center py-6 text-gray-500">
                        <Globe className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Busque dados automaticamente na internet</p>
                        <p className="text-xs mt-1">Redes sociais, CNPJ, serviços e equipamentos</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Redes Sociais */}
                        {enrichmentResults.socialMedia && (
                            <div className="p-3 bg-pink-50 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <Instagram className="h-4 w-4 text-pink-600" />
                                    <span className="text-sm font-semibold text-pink-900">Redes Sociais</span>
                                    <Badge className="ml-auto bg-pink-200 text-pink-800 text-xs">
                                        {enrichmentResults.socialMedia.confidence}% confiança
                                    </Badge>
                                </div>
                                {enrichmentResults.socialMedia.instagram_handle && (
                                    <div className="text-sm text-pink-700">
                                        Instagram: @{enrichmentResults.socialMedia.instagram_handle}
                                    </div>
                                )}
                                {enrichmentResults.socialMedia.facebook_url && (
                                    <div className="text-sm text-pink-700 mt-1">
                                        Facebook: {enrichmentResults.socialMedia.facebook_url}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* CNPJ */}
                        {enrichmentResults.cnpjData && (
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <Building2 className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm font-semibold text-blue-900">Dados Empresariais</span>
                                    <Badge className="ml-auto bg-blue-200 text-blue-800 text-xs">
                                        {enrichmentResults.cnpjData.confidence}% confiança
                                    </Badge>
                                </div>
                                {enrichmentResults.cnpjData.cnpj && (
                                    <div className="text-sm text-blue-700">
                                        CNPJ: {enrichmentResults.cnpjData.cnpj}
                                    </div>
                                )}
                                {enrichmentResults.cnpjData.razao_social && (
                                    <div className="text-sm text-blue-700 mt-1">
                                        Razão Social: {enrichmentResults.cnpjData.razao_social}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Website Analysis */}
                        {enrichmentResults.websiteData && (
                            <div className="p-3 bg-green-50 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <Globe className="h-4 w-4 text-green-600" />
                                    <span className="text-sm font-semibold text-green-900">Análise do Site</span>
                                </div>
                                {enrichmentResults.websiteData.summary && (
                                    <p className="text-sm text-green-700 mb-2">
                                        {enrichmentResults.websiteData.summary}
                                    </p>
                                )}
                                {enrichmentResults.websiteData.services?.length > 0 && (
                                    <div className="mt-2">
                                        <span className="text-xs font-semibold text-green-800">Serviços:</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {enrichmentResults.websiteData.services.map((s, i) => (
                                                <Badge key={i} variant="outline" className="text-xs">
                                                    {s}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {enrichmentResults.websiteData.lab_needs_inferred?.length > 0 && (
                                    <div className="mt-2">
                                        <span className="text-xs font-semibold text-green-800">Necessidades Lab:</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {enrichmentResults.websiteData.lab_needs_inferred.map((n, i) => (
                                                <Badge key={i} className="bg-green-200 text-green-800 text-xs">
                                                    {n}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <CheckCircle2 className="h-3 w-3" />
                            Enriquecido em: {new Date(enrichmentResults.timestamp).toLocaleString('pt-BR')}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}