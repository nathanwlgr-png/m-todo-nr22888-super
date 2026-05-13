import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, Save, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function RoutePlanner({ route, onSave, isSaving }) {
  if (!route?.optimizedPath) {
    return null;
  }

  // Calcular horários das visitas
  const clinicsWithTime = route.optimizedPath.map((clinic, idx) => {
    const time = new Date();
    time.setHours(9 + Math.floor(idx * 1.5), 0, 0);
    return { ...clinic, scheduledTime: time };
  });

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardHeader>
          <CardTitle className="text-lg">Agenda do Dia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-slate-600">Clínicas</p>
              <p className="text-2xl font-bold">{clinicsWithTime.length}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Distância</p>
              <p className="text-2xl font-bold">{route.totalDistance?.toFixed(1) || 0} km</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Tempo Total</p>
              <p className="text-2xl font-bold">{Math.round((route.estimatedTime || 0) / 60)}h</p>
            </div>
            <div className="flex items-end">
              <Button
                onClick={onSave}
                disabled={isSaving}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Visitas
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Roteiro */}
      <div className="space-y-3">
        {clinicsWithTime.map((clinic, idx) => {
          const nextClinic = clinicsWithTime[idx + 1];
          const travelTime = nextClinic
            ? Math.round(
              ((clinic.distanceTo?.[nextClinic.id] || 0) / 40) * 60
            )
            : null;

          return (
            <div key={clinic.id}>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <Badge className="bg-indigo-600 w-10 h-10 flex items-center justify-center text-white rounded-full">
                        {idx + 1}
                      </Badge>
                      {travelTime && (
                        <div className="text-xs text-slate-500 mt-2 text-center">
                          {travelTime}min
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="font-semibold">
                          {format(clinic.scheduledTime, 'HH:mm', { locale: ptBR })}
                        </span>
                        <span className="text-sm text-slate-600">
                          (1h de visita)
                        </span>
                      </div>

                      <h3 className="font-semibold text-slate-900 mb-2">{clinic.name}</h3>

                      <div className="space-y-1 text-sm text-slate-600">
                        {clinic.address && (
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 flex-shrink-0 text-slate-400 mt-0.5" />
                            <span>{clinic.address}</span>
                          </div>
                        )}
                        {clinic.phone && (
                          <p className="text-sm">📞 {clinic.phone}</p>
                        )}
                      </div>

                      {/* Próxima parada */}
                      {nextClinic && (
                        <div className="mt-3 p-3 bg-slate-50 rounded-lg text-xs">
                          <p className="text-slate-600">Próxima parada:</p>
                          <p className="font-semibold text-slate-900">{nextClinic.name}</p>
                          <p className="text-slate-600">
                            {format(nextClinic.scheduledTime, 'HH:mm', { locale: ptBR })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6 text-sm text-blue-900">
          <p>
            ✓ Rota otimizada para minimizar distância e tempo de deslocamento
          </p>
          <p className="mt-2">
            ✓ Ao salvar, as visitas aparecerão no seu calendário diário
          </p>
        </CardContent>
      </Card>
    </div>
  );
}