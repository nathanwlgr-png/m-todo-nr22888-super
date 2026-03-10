import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Target, Loader2, Sparkles, TrendingUp, Building2, 
  Phone, Globe, MapPin, Award, Star 
} from 'lucide-react';
import { toast } from 'sonner';

export default function CityClinicAnalyzer() {
  const [cityInput, setCityInput] = useState('');

  const { mutate: analyzeCity, data, isLoading } = useMutation({
    mutationFn: (city) => base44.functions.invoke('prioritizeClinicsByCity', { city }),
    onSuccess: (res) => {
      toast.success(`✅ ${res.data.total_found} clínicas analisadas!`);
    },
    onError: (error) => {
      toast.error('Erro: ' + error.message);
    }
  });

  const getSizeColor = (size) => {
    if (size?.includes('grande')) return 'bg-purple-100 text-purple-700';
    if (size?.includes('médio')) return 'bg-blue-100 text-blue-700';
    return 'bg-slate-100 text-slate-700';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-4">
      <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" />
            Análise Inteligente por Cidade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Nome da cidade (ex: Marília, Bauru...)"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && cityInput && analyzeCity(cityInput)}
              className="flex-1"
            />
            <Button
              onClick={() => cityInput && analyzeCity(cityInput)}
              disabled={isLoading || !cityInput}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-1" />
                  Analisar
                </>
              )}
            </Button>
          </div>

          <div className="p-2 bg-white rounded-lg border border-indigo-200 text-xs text-indigo-700">
            💡 A IA analisa perfil, porte, especialidades e potencial de compra de cada clínica
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {data?.data?.clinics && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" />
              Top {data.data.total_found} Clínicas - {data.data.city}
            </h3>
            <Badge className="bg-indigo-100 text-indigo-700">
              {data.data.total_found} encontradas
            </Badge>
          </div>

          {data.data.clinics.map((clinic, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Ranking */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-slate-400' : 
                      index === 2 ? 'bg-orange-600' : 
                      'bg-slate-300'
                    }`}>
                      {index < 3 ? <Star className="w-5 h-5" /> : index + 1}
                    </div>
                    <Badge className={`mt-1 text-xs ${getScoreColor(clinic.sales_potential_score)} text-white`}>
                      {clinic.sales_potential_score}
                    </Badge>
                  </div>

                  {/* Informações */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-bold text-slate-800">{clinic.name}</h4>
                      <Badge className={`${getSizeColor(clinic.size)} text-xs shrink-0`}>
                        {clinic.size}
                      </Badge>
                    </div>

                    {clinic.address && (
                      <p className="text-xs text-slate-500 flex items-center gap-1 mb-1">
                        <MapPin className="w-3 h-3" />
                        {clinic.address}
                      </p>
                    )}

                    {clinic.phone && (
                      <p className="text-xs text-slate-500 flex items-center gap-1 mb-1">
                        <Phone className="w-3 h-3" />
                        {clinic.phone}
                      </p>
                    )}

                    {clinic.website && (
                      <p className="text-xs text-slate-500 flex items-center gap-1 mb-2">
                        <Globe className="w-3 h-3" />
                        {clinic.website}
                      </p>
                    )}

                    {/* Especialidades */}
                    {clinic.specialties && (
                      <div className="mb-2">
                        <p className="text-xs font-semibold text-slate-700 mb-1">Especialidades:</p>
                        <p className="text-xs text-slate-600">{clinic.specialties}</p>
                      </div>
                    )}

                    {/* Equipamentos */}
                    {clinic.equipment_info && (
                      <div className="mb-2">
                        <p className="text-xs font-semibold text-slate-700 mb-1">🔬 Equipamentos:</p>
                        <p className="text-xs text-slate-600">{clinic.equipment_info}</p>
                      </div>
                    )}

                    {/* Razão da prioridade */}
                    <div className="p-2 bg-indigo-50 rounded-lg border border-indigo-200 mt-2">
                      <div className="flex items-start gap-2">
                        <TrendingUp className="w-3 h-3 text-indigo-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-indigo-800">
                          <span className="font-semibold">Por que priorizar:</span> {clinic.priority_reason}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}