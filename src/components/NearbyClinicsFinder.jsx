import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
    MapPin, 
    Loader2, 
    Phone, 
    Globe, 
    Star, 
    Navigation,
    Clock,
    ExternalLink,
    Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function NearbyClinicsFinder() {
    const navigate = useNavigate();
    const [isSearching, setIsSearching] = useState(false);
    const [clinics, setClinics] = useState([]);
    const [searchRadius, setSearchRadius] = useState(5);
    const [userLocation, setUserLocation] = useState(null);

    const handleFindClinics = async () => {
        if (!navigator.geolocation) {
            toast.error('Geolocalização não suportada pelo navegador');
            return;
        }

        setIsSearching(true);
        
        try {
            // Obter localização do usuário
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                });
            });

            const { latitude, longitude } = position.coords;
            setUserLocation({ latitude, longitude });

            toast.info('Buscando clínicas próximas...');

            // Buscar clínicas próximas
            const { data } = await base44.functions.invoke('getNearbyVeterinaryClinics', {
                latitude,
                longitude,
                radius_km: searchRadius
            });

            if (data.success) {
                setClinics(data.clinics);
                toast.success(`${data.total_found} clínicas encontradas!`);
            } else {
                toast.error('Erro ao buscar clínicas');
            }
        } catch (error) {
            console.error('Error:', error);
            if (error.code === 1) {
                toast.error('Permissão de localização negada');
            } else {
                toast.error('Erro ao obter localização');
            }
        } finally {
            setIsSearching(false);
        }
    };

    const handleCreateClient = (clinic) => {
        // Navegar para criar cliente com dados pré-preenchidos
        const params = new URLSearchParams({
            clinic_name: clinic.name,
            address: clinic.address,
            phone: clinic.phone || '',
            website: clinic.website || ''
        });
        navigate(`/NewClient?${params.toString()}`);
    };

    return (
        <div className="space-y-6">
            <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                        <MapPin className="h-6 w-6" />
                        Buscar Clínicas Próximas
                    </CardTitle>
                    <CardDescription className="text-blue-100">
                        Use sua localização para encontrar clínicas veterinárias na região
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <label className="text-sm text-blue-100 mb-2 block">
                                Raio de busca (km)
                            </label>
                            <Input
                                type="number"
                                value={searchRadius}
                                onChange={(e) => setSearchRadius(Number(e.target.value))}
                                min={1}
                                max={50}
                                className="bg-white/20 border-white/30 text-white placeholder:text-blue-200"
                            />
                        </div>
                        <Button
                            onClick={handleFindClinics}
                            disabled={isSearching}
                            className="bg-white text-blue-600 hover:bg-blue-50 mt-6"
                            size="lg"
                        >
                            {isSearching ? (
                                <>
                                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                    Buscando...
                                </>
                            ) : (
                                <>
                                    <Navigation className="h-5 w-5 mr-2" />
                                    Buscar Agora
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {userLocation && (
                <Card className="bg-green-50 border-green-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-green-800">
                            <MapPin className="h-4 w-4" />
                            <span className="text-sm font-medium">
                                Sua localização: {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {clinics.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-900">
                        {clinics.length} clínicas encontradas
                    </h3>

                    {clinics.map((clinic, index) => (
                        <Card key={index} className="hover:shadow-lg transition-shadow">
                            <CardContent className="pt-6">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1 space-y-3">
                                        <div>
                                            <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                                {clinic.name}
                                                {clinic.rating && (
                                                    <Badge className="bg-yellow-100 text-yellow-800">
                                                        <Star className="h-3 w-3 mr-1 fill-yellow-500 text-yellow-500" />
                                                        {clinic.rating.toFixed(1)} ({clinic.total_ratings})
                                                    </Badge>
                                                )}
                                            </h4>
                                            <p className="text-sm text-gray-600 mt-1 flex items-start gap-1">
                                                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                {clinic.address}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-3">
                                            {clinic.phone && (
                                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                                    <Phone className="h-4 w-4" />
                                                    <a href={`tel:${clinic.phone}`} className="hover:underline">
                                                        {clinic.phone}
                                                    </a>
                                                </div>
                                            )}
                                            {clinic.website && (
                                                <div className="flex items-center gap-1 text-sm text-blue-600">
                                                    <Globe className="h-4 w-4" />
                                                    <a 
                                                        href={clinic.website} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="hover:underline"
                                                    >
                                                        Website
                                                    </a>
                                                </div>
                                            )}
                                            {clinic.is_open !== null && (
                                                <Badge className={clinic.is_open ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                                    <Clock className="h-3 w-3 mr-1" />
                                                    {clinic.is_open ? 'Aberto agora' : 'Fechado'}
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => window.open(clinic.google_maps_url, '_blank')}
                                            >
                                                <ExternalLink className="h-4 w-4 mr-1" />
                                                Ver no Maps
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => handleCreateClient(clinic)}
                                                className="bg-green-600 hover:bg-green-700"
                                            >
                                                <Plus className="h-4 w-4 mr-1" />
                                                Criar Cliente
                                            </Button>
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