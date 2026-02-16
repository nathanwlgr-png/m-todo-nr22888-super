import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { base44 } from '@/api/base44Client';
import { 
  BookOpen, Lightbulb, Target, Shield, TrendingUp, 
  Search, Filter, Heart, Brain, Zap, Users
} from 'lucide-react';

export default function OfflineNumerologyGuide({ numerologyNumber, clientName }) {
  const [knowledge, setKnowledge] = useState(null);
  const [salesBible, setSalesBible] = useState([]);
  const [filteredBible, setFilteredBible] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOfflineData();
  }, [numerologyNumber]);

  const loadOfflineData = async () => {
    try {
      // Buscar conhecimento específico do número
      const numKnowledge = await base44.entities.NumerologyKnowledge.filter({ 
        numerology_number: numerologyNumber 
      });
      
      if (numKnowledge.length > 0) {
        setKnowledge(numKnowledge[0]);
      }

      // Buscar bíblia de vendas relacionada
      const allBible = await base44.entities.OfflineSalesBible.list();
      const filtered = allBible.filter(item => 
        !item.related_numbers || 
        item.related_numbers.includes(numerologyNumber)
      );
      
      setSalesBible(filtered);
      setFilteredBible(filtered);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = salesBible;

    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    setFilteredBible(filtered);
  }, [searchTerm, selectedCategory, salesBible]);

  if (loading) {
    return (
      <Card className="p-6 text-center">
        <p className="text-slate-500">Carregando guia offline...</p>
      </Card>
    );
  }

  if (!knowledge) {
    return (
      <Card className="p-6 text-center">
        <p className="text-slate-500">Dados não encontrados para número {numerologyNumber}</p>
      </Card>
    );
  }

  const categoryIcons = {
    tecnica_venda: Brain,
    gatilho_mental: Zap,
    framework: Target,
    script_pronto: BookOpen,
    caso_sucesso: TrendingUp,
    objecao_comum: Shield,
    frase_efeito: Lightbulb,
    estatistica: Filter,
    estudo_cientifico: Search
  };

  return (
    <div className="space-y-4">
      {/* Header com Número */}
      <Card className="p-5 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
            <span className="text-3xl font-bold text-white">{numerologyNumber}</span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-800">
              Guia Offline - {clientName || 'Cliente'}
            </h3>
            <p className="text-sm text-purple-700">{knowledge.personality_profile}</p>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="pains" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pains">
            <Heart className="w-4 h-4 mr-1" />
            Dores
          </TabsTrigger>
          <TabsTrigger value="triggers">
            <Zap className="w-4 h-4 mr-1" />
            Gatilhos
          </TabsTrigger>
          <TabsTrigger value="closing">
            <Target className="w-4 h-4 mr-1" />
            Fechamento
          </TabsTrigger>
          <TabsTrigger value="bible">
            <BookOpen className="w-4 h-4 mr-1" />
            Bíblia
          </TabsTrigger>
        </TabsList>

        {/* Tab: Dores */}
        <TabsContent value="pains" className="space-y-3 mt-4">
          <Card className="p-4 bg-red-50 border-red-200">
            <h4 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Dores Comuns deste Número
            </h4>
            <ul className="space-y-2">
              {knowledge.common_pains.map((pain, idx) => (
                <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                  <span className="text-red-600 font-bold">•</span>
                  {pain}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-4 bg-green-50 border-green-200">
            <h4 className="text-sm font-semibold text-green-700 mb-3">Motivadores de Compra</h4>
            <ul className="space-y-2">
              {knowledge.buying_motivators.map((motivator, idx) => (
                <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  {motivator}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-4 bg-blue-50 border-blue-200">
            <h4 className="text-sm font-semibold text-blue-700 mb-2">Estilo de Decisão</h4>
            <p className="text-sm text-slate-700">{knowledge.decision_style}</p>
          </Card>

          <Card className="p-4 bg-amber-50 border-amber-200">
            <h4 className="text-sm font-semibold text-amber-700 mb-2">Melhor Abordagem</h4>
            <p className="text-sm text-slate-700">{knowledge.best_approach}</p>
          </Card>

          <Card className="p-4 bg-slate-50 border-slate-200">
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Sinais de Alerta (Evitar)</h4>
            <ul className="space-y-1">
              {knowledge.red_flags.map((flag, idx) => (
                <li key={idx} className="text-sm text-red-600 flex items-start gap-2">
                  <span>⚠️</span>
                  {flag}
                </li>
              ))}
            </ul>
          </Card>
        </TabsContent>

        {/* Tab: Gatilhos Éticos */}
        <TabsContent value="triggers" className="space-y-3 mt-4">
          {knowledge.ethical_triggers.map((trigger, idx) => (
            <Card key={idx} className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <div className="flex items-start gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-800 mb-1">{trigger.trigger}</h4>
                  <Badge className="bg-purple-100 text-purple-700 text-xs mb-2">
                    {trigger.when_to_use}
                  </Badge>
                </div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-purple-200">
                <p className="text-xs text-purple-600 font-semibold mb-1">Script Pronto:</p>
                <p className="text-sm text-slate-700 italic">"{trigger.script}"</p>
              </div>
            </Card>
          ))}

          <Card className="p-4 bg-blue-50 border-blue-200">
            <h4 className="text-sm font-semibold text-blue-700 mb-2">Estilo de Comunicação</h4>
            <p className="text-sm text-slate-700">{knowledge.communication_style}</p>
          </Card>

          <Card className="p-4 bg-green-50 border-green-200">
            <h4 className="text-sm font-semibold text-green-700 mb-2">Melhor Timing</h4>
            <p className="text-sm text-slate-700">{knowledge.ideal_timing}</p>
          </Card>
        </TabsContent>

        {/* Tab: Estratégias de Fechamento */}
        <TabsContent value="closing" className="space-y-3 mt-4">
          {knowledge.closing_strategies.map((strategy, idx) => (
            <Card key={idx} className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-green-300">
              <div className="flex items-start gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center flex-shrink-0">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-800 mb-1">{strategy.strategy_name}</h4>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-green-100 text-green-700 text-xs">
                      Taxa de Sucesso: {strategy.success_rate}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">{strategy.description}</p>
                </div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-green-200">
                <p className="text-xs text-green-600 font-semibold mb-1">Script Exemplo:</p>
                <p className="text-sm text-slate-700 italic">"{strategy.script_example}"</p>
              </div>
            </Card>
          ))}

          <Card className="p-4 bg-amber-50 border-amber-200">
            <h4 className="text-sm font-semibold text-amber-700 mb-3">Controle de Objeções</h4>
            {knowledge.objection_handling.map((obj, idx) => (
              <div key={idx} className="mb-3 last:mb-0">
                <div className="bg-red-50 rounded-lg p-2 mb-1">
                  <p className="text-xs text-red-700 font-medium">Objeção:</p>
                  <p className="text-sm text-slate-700">"{obj.objection}"</p>
                </div>
                <div className="bg-green-50 rounded-lg p-2">
                  <p className="text-xs text-green-700 font-medium">Resposta:</p>
                  <p className="text-sm text-slate-700">"{obj.response}"</p>
                </div>
              </div>
            ))}
          </Card>
        </TabsContent>

        {/* Tab: Bíblia de Vendas */}
        <TabsContent value="bible" className="space-y-3 mt-4">
          {/* Filtros */}
          <div className="space-y-2">
            <Input
              placeholder="Buscar na bíblia de vendas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
            
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button
                size="sm"
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('all')}
              >
                Todos
              </Button>
              {Object.entries({
                tecnica_venda: 'Técnicas',
                gatilho_mental: 'Gatilhos',
                script_pronto: 'Scripts',
                caso_sucesso: 'Casos',
                frase_efeito: 'Frases'
              }).map(([key, label]) => (
                <Button
                  key={key}
                  size="sm"
                  variant={selectedCategory === key ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(key)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Lista de Conteúdos */}
          {filteredBible.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-slate-500">Nenhum conteúdo encontrado</p>
            </Card>
          ) : (
            filteredBible.map((item, idx) => {
              const Icon = categoryIcons[item.category] || BookOpen;
              return (
                <Card key={idx} className="p-4 bg-white border-slate-200 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-slate-800">{item.title}</h4>
                        {item.effectiveness_score && (
                          <Badge className="bg-green-100 text-green-700 text-xs">
                            {item.effectiveness_score}%
                          </Badge>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs mb-2">
                        {item.category.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-700 mb-3">{item.content}</p>
                  
                  {item.when_to_use && (
                    <div className="bg-blue-50 rounded-lg p-2 mb-2">
                      <p className="text-xs text-blue-600 font-medium">Quando usar:</p>
                      <p className="text-sm text-slate-700">{item.when_to_use}</p>
                    </div>
                  )}
                  
                  {item.example_script && (
                    <div className="bg-purple-50 rounded-lg p-2 mb-2">
                      <p className="text-xs text-purple-600 font-medium">Script:</p>
                      <p className="text-sm text-slate-700 italic">"{item.example_script}"</p>
                    </div>
                  )}
                  
                  {item.source && (
                    <p className="text-xs text-slate-500 mt-2">
                      Fonte: {item.source}
                    </p>
                  )}
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}