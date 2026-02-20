import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Wifi } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OfflineDashboard from '../components/OfflineDashboard';
import OfflineSyncManager from '../components/OfflineSyncManager';
import ProductCatalog from '../components/ProductCatalog';

export default function OfflineMode() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Wifi className="h-8 w-8 text-blue-600" />
                            Dashboard Offline & Sync
                        </h1>
                        <p className="text-gray-600 mt-1">Acesse todos os dados sem internet · Busca avançada · Histórico de vendas</p>
                    </div>
                </div>

                <Tabs defaultValue="dashboard" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="dashboard">📊 Dashboard Offline</TabsTrigger>
                        <TabsTrigger value="sync">🔄 Sincronização</TabsTrigger>
                        <TabsTrigger value="catalog">📦 Catálogo</TabsTrigger>
                    </TabsList>

                    <TabsContent value="dashboard" className="mt-6">
                        <OfflineDashboard />
                    </TabsContent>

                    <TabsContent value="sync" className="mt-6">
                        <OfflineSyncManager />
                    </TabsContent>

                    <TabsContent value="catalog" className="mt-6">
                        <ProductCatalog />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}