import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Instagram, Sparkles, Calendar, BarChart3, BookOpen, Layers } from 'lucide-react';
import ContentSources from '@/components/instagram/ContentSources';
import CaseLibrary from '@/components/instagram/CaseLibrary';
import PostCalendar from '@/components/instagram/PostCalendar';
import MetricsPanel from '@/components/instagram/MetricsPanel';

export default function InstagramStudio() {
  const [scheduledPosts, setScheduledPosts] = useState([]);

  const { data: sales = [] } = useQuery({
    queryKey: ['sales-instagram'],
    queryFn: () => base44.entities.Sale.filter({ status: 'fechada' }, '-sale_date', 30),
    staleTime: 60000,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-instagram'],
    queryFn: () => base44.entities.Client.list('-updated_date', 50),
    staleTime: 60000,
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['cases-library'],
    queryFn: () => base44.entities.SalesKnowledgeBase?.list('-created_date', 50).catch(() => []),
    staleTime: 60000,
  });

  const handleSchedule = (post) => {
    setScheduledPosts(prev => [...prev, post]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-700 via-pink-600 to-orange-500 text-white p-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Instagram className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Instagram Studio</h1>
            <p className="text-purple-100 text-xs">Modo Nathan — Conteúdo consultivo veterinário de alta conversão</p>
          </div>
        </div>
        {/* Modo Nathan badge */}
        <div className="bg-white/15 backdrop-blur rounded-xl p-2.5 flex items-center gap-2 mt-1">
          <span className="text-lg">🎯</span>
          <div>
            <p className="text-xs font-bold text-white">Modo Nathan ATIVO</p>
            <p className="text-[10px] text-purple-200">Storytelling • Autoridade Técnica • Aumento de Faturamento • Linguagem Humana</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        <Tabs defaultValue="fontes">
          <TabsList className="w-full bg-white border mb-4 p-1 rounded-xl grid grid-cols-5">
            <TabsTrigger value="fontes" className="text-[10px] data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-lg px-1">
              <Layers className="w-3 h-3 mr-0.5" /> Fontes
            </TabsTrigger>
            <TabsTrigger value="casos" className="text-[10px] data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-lg px-1">
              <BookOpen className="w-3 h-3 mr-0.5" /> Casos
            </TabsTrigger>
            <TabsTrigger value="campanha" className="text-[10px] data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-lg px-1">
              <Sparkles className="w-3 h-3 mr-0.5" /> Campanha
            </TabsTrigger>
            <TabsTrigger value="calendario" className="text-[10px] data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-lg px-1">
              <Calendar className="w-3 h-3 mr-0.5" /> Agenda
            </TabsTrigger>
            <TabsTrigger value="metricas" className="text-[10px] data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-lg px-1">
              <BarChart3 className="w-3 h-3 mr-0.5" /> Métricas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fontes">
            <ContentSources sales={sales} clients={clients} cases={cases} onSchedule={handleSchedule} />
          </TabsContent>
          <TabsContent value="casos">
            <CaseLibrary cases={cases} />
          </TabsContent>
          <TabsContent value="campanha">
            <ContentSources sales={sales} clients={clients} cases={cases} onSchedule={handleSchedule} campaignMode />
          </TabsContent>
          <TabsContent value="calendario">
            <PostCalendar scheduledPosts={scheduledPosts} />
          </TabsContent>
          <TabsContent value="metricas">
            <MetricsPanel sales={sales} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}