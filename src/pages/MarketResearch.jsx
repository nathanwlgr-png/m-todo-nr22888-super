import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NearbyClinicsFinder from '../components/NearbyClinicsFinder';
import ClinicProfileAnalyzer from '../components/ClinicProfileAnalyzer';

export default function MarketResearch() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Pesquisa de Mercado Inteligente
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Encontre e analise clínicas veterinárias com IA
                        </p>
                    </div>
                </div>

                <Tabs defaultValue="nearby" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="nearby" className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Clínicas Próximas (GPS)
                        </TabsTrigger>
                        <TabsTrigger value="analyze" className="flex items-center gap-2">
                            <Search className="h-4 w-4" />
                            Analisar Clínica
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="nearby" className="mt-6">
                        <NearbyClinicsFinder />
                    </TabsContent>

                    <TabsContent value="analyze" className="mt-6">
                        <ClinicProfileAnalyzer />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}