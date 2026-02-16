import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  MapPin, Search, Loader2, Download, CheckCircle2, 
  Target, Users, FileText, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

export default function SmartClinicFinder() {
  const [searchMode, setSearchMode] = useState('gps'); // 'gps' or 'city'
  const [radius, setRadius] = useState(200);
  const [city, setCity] = useState('');
  const [results, setResults] = useState(null);
  const [gpsCoords, setGpsCoords] = useState(null);
  const queryClient = useQueryClient();

  const getGPS = () => {
    toast.loading('Obtendo localização GPS...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        toast.dismiss();
        toast.success(`GPS obtido: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
      },
      (error) => {
        toast.dismiss();
        toast.error('Erro ao obter GPS: ' + error.message);
      }
    );
  };

  const searchMutation = useMutation({
    mutationFn: async () => {
      const searchData = {
        mode: searchMode,
        radius_km: radius,
        city: searchMode === 'city' ? city : null,
        gps_coords: searchMode === 'gps' ? gpsCoords : null
      };

      const response = await base44.functions.invoke('advancedClinicSearch', searchData);
      return response.data;
    },
    onSuccess: (data) => {
      setResults(data);
      toast.success(`${data.clinics_found} clínicas encontradas!`);
    },
    onError: (error) => {
      toast.error('Erro na busca: ' + error.message);
    }
  });

  const downloadPDF = async () => {
    if (!results) return;
    
    try {
      toast.loading('Gerando PDF...');
      const response = await base44.functions.invoke('generateClinicsPDF', {
        search_results: results,
        search_params: {
          mode: searchMode,
          radius,
          city: city || 'GPS Atual'
        }
      });
      
      toast.dismiss();
      if (response.data.pdf_url) {
        window.open(response.data.pdf_url, '_blank');
        toast.success('PDF gerado com sucesso!');
      }
    } catch (error) {
      toast.dismiss();
      toast.error('Erro ao gerar PDF');
    }
  };

  const canSearch = searchMode === 'gps' ? gpsCoords !== null : city.trim().length > 0;

  return (
    <Card className="border-2 border-indigo-400 bg-gradient-to-br from-indigo-50 to-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-6 h-6 text-indigo-600" />
          🎯 Busca Inteligente de Clínicas
        </CardTitle>
        <p className="text-xs text-indigo-700">
          Encontre clínicas próximas com análise completa automática
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Modo de busca */}
        <div>
          <Label className="mb-2 block">Modo de Busca</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={searchMode === 'gps' ? 'default' : 'outline'}
              onClick={() => setSearchMode('gps')}
              className={searchMode === 'gps' ? 'bg-indigo-600' : ''}
            >
              <MapPin className="w-4 h-4 mr-2" />
              GPS Atual
            </Button>
            <Button
              variant={searchMode === 'city' ? 'default' : 'outline'}
              onClick={() => setSearchMode('city')}
              className={searchMode === 'city' ? 'bg-indigo-600' : ''}
            >
              <Search className="w-4 h-4 mr-2" />
              Por Cidade
            </Button>
          </div>
        </div>

        {/* Raio de busca */}
        <div>
          <Label>Raio de Busca (km)</Label>
          <Input
            type="number"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            min="10"
            max="500"
            step="10"
          />
          <p className="text-xs text-slate-500 mt-1">
            Mínimo: 10km | Máximo: 500km
          </p>
        </div>

        {/* Campo específico do modo */}
        {searchMode === 'gps' ? (
          <div>
            <Label>Localização GPS</Label>
            <Button
              onClick={getGPS}
              variant="outline"
              className="w-full"
              disabled={gpsCoords !== null}
            >
              <MapPin className="w-4 h-4 mr-2" />
              {gpsCoords ? `GPS: ${gpsCoords.lat.toFixed(4)}, ${gpsCoords.lng.toFixed(4)}` : 'Obter Localização'}
            </Button>
          </div>
        ) : (
          <div>
            <Label>Cidade de Origem</Label>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ex: Marília, São Paulo"
            />
          </div>
        )}

        {/* Botão de busca */}
        <Button
          onClick={() => searchMutation.mutate()}
          disabled={!canSearch || searchMutation.isPending}
          className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700"
          size="lg"
        >
          {searchMutation.isPending ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Buscando e Analisando...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Buscar e Analisar Clínicas
            </>
          )}
        </Button>

        {/* Resultados */}
        {results && (
          <div className="space-y-3 pt-4 border-t border-indigo-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-indigo-900">
                  ✅ Busca Concluída!
                </p>
                <p className="text-xs text-indigo-700">
                  {results.clinics_found} clínicas encontradas e analisadas
                </p>
              </div>
              <Badge className="bg-green-600 text-white">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Completo
              </Badge>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white p-2 rounded-lg text-center">
                <Users className="w-4 h-4 mx-auto text-indigo-600 mb-1" />
                <p className="text-xs font-semibold">{results.clinics_found}</p>
                <p className="text-xs text-slate-600">Clínicas</p>
              </div>
              <div className="bg-white p-2 rounded-lg text-center">
                <Sparkles className="w-4 h-4 mx-auto text-purple-600 mb-1" />
                <p className="text-xs font-semibold">{results.with_cnpj || 0}</p>
                <p className="text-xs text-slate-600">Com CNPJ</p>
              </div>
              <div className="bg-white p-2 rounded-lg text-center">
                <Target className="w-4 h-4 mx-auto text-green-600 mb-1" />
                <p className="text-xs font-semibold">{results.analyzed || 0}</p>
                <p className="text-xs text-slate-600">Analisadas</p>
              </div>
            </div>

            {/* Lista de clínicas */}
            {results.clinics?.length > 0 && (
              <div className="max-h-64 overflow-y-auto space-y-2">
                {results.clinics.slice(0, 10).map((clinic, i) => (
                  <div key={i} className="bg-white p-3 rounded-lg border border-indigo-200">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-indigo-900">{clinic.name}</p>
                        <p className="text-xs text-slate-600">{clinic.address}</p>
                      </div>
                      {clinic.distance_km && (
                        <Badge variant="outline" className="text-xs">
                          {clinic.distance_km}km
                        </Badge>
                      )}
                    </div>
                    {clinic.cnpj && (
                      <p className="text-xs text-slate-500">CNPJ: {clinic.cnpj}</p>
                    )}
                    {clinic.numerology_score && (
                      <Badge className="mt-1 bg-purple-600 text-white text-xs">
                        Score: {clinic.numerology_score}
                      </Badge>
                    )}
                  </div>
                ))}
                {results.clinics.length > 10 && (
                  <p className="text-xs text-center text-slate-500">
                    +{results.clinics.length - 10} clínicas no PDF completo
                  </p>
                )}
              </div>
            )}

            {/* Ações */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={downloadPDF}
                variant="outline"
                className="border-green-300 text-green-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Baixar PDF
              </Button>
              <Button
                onClick={() => {
                  setResults(null);
                  setGpsCoords(null);
                }}
                variant="outline"
              >
                <Search className="w-4 h-4 mr-2" />
                Nova Busca
              </Button>
            </div>

            <p className="text-xs text-center text-slate-500 pt-2">
              📄 Resultados salvos automaticamente para consulta futura
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}