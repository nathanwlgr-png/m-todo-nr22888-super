import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Wifi } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OfflineSyncManager from '../components/OfflineSyncManager';
import OfflineDataManager from '../components/OfflineDataManager';
import ProductCatalog from '../components/ProductCatalog';

export default function OfflineMode() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
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
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Wifi className="h-8 w-8 text-blue-600" />
                            Modo Offline & Catálogo
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Acesse dados sem internet e navegue pelo catálogo
                        </p>
                    </div>
                </div>

                <Tabs defaultValue="sync" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="sync">Sincronização</TabsTrigger>
                        <TabsTrigger value="data">Dados Offline</TabsTrigger>
                        <TabsTrigger value="catalog">Catálogo</TabsTrigger>
                    </TabsList>

                    <TabsContent value="sync" className="mt-6">
                        <OfflineSyncManager />
                    </TabsContent>

                    <TabsContent value="data" className="mt-6">
                        <OfflineDataManager />
                    </TabsContent>

                    <TabsContent value="catalog" className="mt-6">
                        <ProductCatalog />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}