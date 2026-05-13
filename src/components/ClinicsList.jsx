import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin, Phone, Mail } from 'lucide-react';

export default function ClinicsList({
  clinics,
  selectedClinics,
  onSelectClinic,
  optimizedRoute
}) {
  if (!clinics || clinics.length === 0) {
    return (
      <Card>
        <CardContent className="pt-12 text-center text-slate-500">
          <p>Nenhuma clínica para exibir</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {clinics.map((clinic, idx) => {
        const isSelected = selectedClinics.find(c => c.id === clinic.id);
        const routeOrder = optimizedRoute?.optimizedPath?.findIndex(c => c.id === clinic.id);

        return (
          <Card
            key={clinic.id}
            className={`cursor-pointer transition-all ${
              isSelected ? 'border-indigo-500 bg-indigo-50' : 'hover:border-slate-300'
            }`}
            onClick={() => onSelectClinic(clinic)}
          >
            <CardContent className="pt-4">
              <div className="flex gap-4">
                <Checkbox checked={isSelected} className="mt-1" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900 truncate">{clinic.name}</h3>
                    {routeOrder !== undefined && (
                      <Badge className="bg-green-600 flex-shrink-0">{routeOrder + 1}º</Badge>
                    )}
                  </div>

                  <div className="space-y-1 text-sm text-slate-600 mb-3">
                    {clinic.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 flex-shrink-0 text-slate-400" />
                        <span className="truncate">{clinic.address}</span>
                      </div>
                    )}
                    {clinic.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 flex-shrink-0 text-slate-400" />
                        <span>{clinic.phone}</span>
                      </div>
                    )}
                    {clinic.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 flex-shrink-0 text-slate-400" />
                        <span className="truncate">{clinic.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {clinic.distance && (
                      <Badge variant="outline" className="text-xs">
                        {clinic.distance.toFixed(1)} km
                      </Badge>
                    )}
                    {clinic.segment && (
                      <Badge variant="outline" className="text-xs capitalize">
                        {clinic.segment}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}