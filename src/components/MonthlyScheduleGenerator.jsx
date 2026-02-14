import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Calendar, MapPin, Download, Sparkles, Users } from 'lucide-react';

export default function MonthlyScheduleGenerator() {
  const [city, setCity] = useState('');
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!city.trim()) {
      toast.error('Digite uma cidade');
      return;
    }

    setGenerating(true);
    const loading = toast.loading(`🗓️ Gerando agenda mensal para ${city}...`);

    try {
      const response = await base44.functions.invoke('generateMonthlySchedule', {
        city: city.trim(),
        month_year: new Date().toISOString().substring(0, 7)
      });

      toast.dismiss(loading);

      if (response.data) {
        // Criar blob e fazer download
        const blob = new Blob([response.data], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `agenda_${city}_mensal.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();

        toast.success(
          `✅ Agenda mensal de ${city} gerada!\n\n` +
          `📊 5-6 clientes/dia + Plano B\n` +
          `🎯 Ordenado por prioridade\n` +
          `📍 Rotas otimizadas\n` +
          `📥 Excel baixado com sucesso!`,
          { duration: 6000 }
        );
      } else {
        toast.error('Erro ao gerar agenda');
      }
    } catch (error) {
      toast.dismiss(loading);
      console.error('Erro:', error);
      
      if (error.message?.includes('não encontrado')) {
        toast.error(`Nenhum cliente encontrado em ${city}`);
      } else {
        toast.error('Erro ao gerar agenda: ' + error.message);
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-300">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
          <Calendar className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-indigo-900">📅 Gerador de Agenda Mensal</h3>
          <p className="text-xs text-indigo-600">Digite cidade → Excel com 30 dias de visitas</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-white rounded-lg p-3 border border-indigo-200">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <p className="text-sm font-semibold text-indigo-900">Como funciona:</p>
          </div>
          <ul className="text-xs text-slate-600 space-y-1 ml-5">
            <li>✅ 5-6 clientes principais por dia</li>
            <li>🎯 2 clientes Plano B por dia</li>
            <li>📊 Ordenado por prioridade (score + status + última visita)</li>
            <li>🗺️ Rota otimizada por região</li>
            <li>📈 VIPs e Champions primeiro</li>
            <li>⏰ 30 dias úteis programados</li>
          </ul>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Digite a cidade (ex: Marília)"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
              className="border-indigo-300"
            />
          </div>
          <Button
            onClick={handleGenerate}
            disabled={!city.trim() || generating}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            {generating ? (
              <>
                <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Gerar Excel
              </>
            )}
          </Button>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-300">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-green-600" />
            <p className="text-sm font-semibold text-green-900">Cidades com clientes:</p>
          </div>
          <div className="flex flex-wrap gap-1">
            {['Marília', 'Bauru', 'Assis', 'Tupã', 'Ourinhos', 'Presidente Prudente'].map(c => (
              <Badge 
                key={c}
                variant="outline" 
                className="cursor-pointer hover:bg-green-100"
                onClick={() => setCity(c)}
              >
                {c}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}