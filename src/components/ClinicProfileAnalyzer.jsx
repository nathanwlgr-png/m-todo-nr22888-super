import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Search, 
    Loader2, 
    Building2, 
    Users, 
    Globe, 
    Instagram, 
    Facebook,
    FileText,
    Lightbulb,
    Package,
    Target,
    Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

export default function ClinicProfileAnalyzer() {
    const [clinicName, setClinicName] = useState('');
    const [city, setCity] = useState('');
    const [cnpj, setCnpj] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [profileData, setProfileData] = useState(null);

    const handleAnalyze = async () => {
        if (!clinicName && !cnpj) {
            toast.error('Informe o nome da clínica ou CNPJ');
            return;
        }

        setIsAnalyzing(true);
        try {
            const { data } = await base44.functions.invoke('getDetailedClinicProfile', {
                clinic_name: clinicName,
                city: city,
                cnpj: cnpj
            });

            if (data.success) {
                setProfileData(data.data);
                toast.success('Análise completa! Confira os dados abaixo.');
            } else {
                toast.error('Erro ao analisar perfil da clínica');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Erro ao processar análise');
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                        <Search className="h-6 w-6" />
                        Analisador de Perfil de Clínicas
                    </CardTitle>
                    <CardDescription className="text-indigo-100">
                        Obtenha dados completos: CNPJ, sócios, redes sociais, equipamentos e análise de necessidades
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-indigo-100 mb-2 block">
                                Nome da Clínica *
                            </label>
                            <Input
                                value={clinicName}
                                onChange={(e) => setClinicName(e.target.value)}
                                placeholder="Ex: Clínica Veterinária São Paulo"
                                className="bg-white/20 border-white/30 text-white placeholder:text-indigo-200"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-indigo-100 mb-2 block">
                                Cidade
                            </label>
                            <Input
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder="Ex: São Paulo, SP"
                                className="bg-white/20 border-white/30 text-white placeholder:text-indigo-200"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm text-indigo-100 mb-2 block">
                            CNPJ (opcional)
                        </label>
                        <Input
                            value={cnpj}
                            onChange={(e) => setCnpj(e.target.value)}
                            placeholder="00.000.000/0000-00"
                            className="bg-white/20 border-white/30 text-white placeholder:text-indigo-200"
                        />
                    </div>

                    <Button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing || (!clinicName && !cnpj)}
                        className="w-full bg-white text-indigo-600 hover:bg-indigo-50"
                        size="lg"
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                Analisando com IA...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-5 w-5 mr-2" />
                                Analisar Clínica
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {profileData && (
                <Card className="border-2 border-purple-200">
                    <CardHeader>
                        <CardTitle className="text-2xl">Perfil Completo da Clínica</CardTitle>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {profileData.data_sources.map((source, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                    {source}
                                </Badge>
                            ))}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="basic" className="w-full">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="basic">Dados Básicos</TabsTrigger>
                                <TabsTrigger value="social">Redes Sociais</TabsTrigger>
                                <TabsTrigger value="equipment">Equipamentos</TabsTrigger>
                                <TabsTrigger value="analysis">Análise</TabsTrigger>
                            </TabsList>

                            <TabsContent value="basic" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Building2 className="h-5 w-5 text-blue-600" />
                                            Informações da Empresa
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {profileData.cnpj && (
                                            <div>
                                                <div className="text-sm font-semibold text-gray-700">CNPJ:</div>
                                                <div className="text-sm mt-1 font-mono">{profileData.cnpj}</div>
                                            </div>
                                        )}
                                        {profileData.razao_social && (
                                            <div>
                                                <div className="text-sm font-semibold text-gray-700">Razão Social:</div>
                                                <div className="text-sm mt-1">{profileData.razao_social}</div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {profileData.socios?.length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Users className="h-5 w-5 text-purple-600" />
                                                Sócios e Administradores
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                {profileData.socios.map((socio, idx) => (
                                                    <div key={idx} className="p-3 bg-purple-50 rounded-lg">
                                                        <div className="font-semibold text-purple-900">{socio.nome}</div>
                                                        <div className="text-sm text-purple-700 mt-1">{socio.qualificacao}</div>
                                                        {socio.data_entrada && (
                                                            <div className="text-xs text-purple-600 mt-1">
                                                                Entrada: {socio.data_entrada}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </TabsContent>

                            <TabsContent value="social" className="space-y-4">
                                <Card>
                                    <CardContent className="pt-6 space-y-4">
                                        {profileData.website && (
                                            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                                                <Globe className="h-5 w-5 text-blue-600" />
                                                <div className="flex-1">
                                                    <div className="text-sm font-semibold text-gray-700">Website</div>
                                                    <a 
                                                        href={profileData.website}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-blue-600 hover:underline"
                                                    >
                                                        {profileData.website}
                                                    </a>
                                                </div>
                                            </div>
                                        )}

                                        {profileData.instagram && (
                                            <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg">
                                                <Instagram className="h-5 w-5 text-pink-600" />
                                                <div className="flex-1">
                                                    <div className="text-sm font-semibold text-gray-700">Instagram</div>
                                                    <a 
                                                        href={profileData.instagram.startsWith('http') ? profileData.instagram : `https://instagram.com/${profileData.instagram.replace('@', '')}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-pink-600 hover:underline"
                                                    >
                                                        {profileData.instagram}
                                                    </a>
                                                </div>
                                            </div>
                                        )}

                                        {profileData.facebook && (
                                            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                                                <Facebook className="h-5 w-5 text-blue-700" />
                                                <div className="flex-1">
                                                    <div className="text-sm font-semibold text-gray-700">Facebook</div>
                                                    <a 
                                                        href={profileData.facebook}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-blue-700 hover:underline"
                                                    >
                                                        {profileData.facebook}
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="equipment" className="space-y-4">
                                {profileData.equipment_inferred?.length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Package className="h-5 w-5 text-green-600" />
                                                Equipamentos Identificados
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex flex-wrap gap-2">
                                                {profileData.equipment_inferred.map((equipment, idx) => (
                                                    <Badge key={idx} className="bg-green-100 text-green-800">
                                                        {equipment}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {profileData.specialties_inferred?.length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <FileText className="h-5 w-5 text-blue-600" />
                                                Especialidades Oferecidas
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex flex-wrap gap-2">
                                                {profileData.specialties_inferred.map((specialty, idx) => (
                                                    <Badge key={idx} className="bg-blue-100 text-blue-800">
                                                        {specialty}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </TabsContent>

                            <TabsContent value="analysis" className="space-y-4">
                                {profileData.profile_analysis && (
                                    <>
                                        <Card className="bg-gradient-to-r from-purple-50 to-blue-50">
                                            <CardHeader>
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    <Lightbulb className="h-5 w-5 text-yellow-600" />
                                                    Tipo de Clínica
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-sm leading-relaxed">
                                                    {profileData.profile_analysis.clinic_type}
                                                </p>
                                            </CardContent>
                                        </Card>

                                        {profileData.profile_analysis.recommended_equipment?.length > 0 && (
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className="text-lg flex items-center gap-2">
                                                        <Target className="h-5 w-5 text-orange-600" />
                                                        Equipamentos Recomendados
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <ul className="space-y-2">
                                                        {profileData.profile_analysis.recommended_equipment.map((equip, idx) => (
                                                            <li key={idx} className="flex items-start gap-2">
                                                                <div className="h-1.5 w-1.5 rounded-full bg-orange-600 mt-1.5 flex-shrink-0" />
                                                                <span className="text-sm">{equip}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </CardContent>
                                            </Card>
                                        )}

                                        {profileData.profile_analysis.potential_needs?.length > 0 && (
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className="text-lg flex items-center gap-2">
                                                        <Target className="h-5 w-5 text-red-600" />
                                                        Necessidades e Dores Potenciais
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <ul className="space-y-2">
                                                        {profileData.profile_analysis.potential_needs.map((need, idx) => (
                                                            <li key={idx} className="flex items-start gap-2">
                                                                <div className="h-1.5 w-1.5 rounded-full bg-red-600 mt-1.5 flex-shrink-0" />
                                                                <span className="text-sm">{need}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </CardContent>
                                            </Card>
                                        )}

                                        {profileData.profile_analysis.sales_approach && (
                                            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                                                <CardHeader>
                                                    <CardTitle className="text-lg">Abordagem de Vendas Recomendada</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <p className="text-sm leading-relaxed">
                                                        {profileData.profile_analysis.sales_approach}
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        )}
                                    </>
                                )}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}