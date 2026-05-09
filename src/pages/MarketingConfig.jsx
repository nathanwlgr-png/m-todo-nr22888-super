import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SeamatyGallery from '@/components/SeamatyGallery';
import MobVendedorImporter from '@/components/MobVendedorImporter';
import { Settings, Image, Package } from 'lucide-react';

export default function MarketingConfig() {
  const [activeTab, setActiveTab] = useState('gallery');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-20">
      <div className="max-w-7xl mx-auto p-4 md:p-6">

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-slate-900 mb-2 flex items-center gap-3">
            <Settings className="w-10 h-10 text-orange-600" />
            Configurações Marketing
          </h1>
          <p className="text-slate-600 max-w-2xl">
            Gerencie imagens, regras de uso e inventário Seamaty para o Marketing AI Studio
          </p>
        </div>

        {/* TABS */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-2 mb-8">
            <TabsTrigger value="gallery" className="gap-2">
              <Image className="w-4 h-4" />
              Galeria Seamaty
            </TabsTrigger>
            <TabsTrigger value="importer" className="gap-2">
              <Package className="w-4 h-4" />
              Importar Mob Vendedor
            </TabsTrigger>
          </TabsList>

          {/* GALERIA */}
          <TabsContent value="gallery" className="mt-0">
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <SeamatyGallery />
            </div>
          </TabsContent>

          {/* IMPORTADOR */}
          <TabsContent value="importer" className="mt-0">
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <MobVendedorImporter />
            </div>
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
}