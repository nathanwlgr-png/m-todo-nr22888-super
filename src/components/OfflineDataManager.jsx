import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Download, HardDrive, Search, User, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function OfflineDataManager() {
    const navigate = useNavigate();
    const [offlineClients, setOfflineClients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        loadOfflineData();
    }, []);

    const loadOfflineData = () => {
        const stored = localStorage.getItem('offline_clients');
        if (stored) {
            setOfflineClients(JSON.parse(stored));
        }
    };

    const downloadDataForOffline = async () => {
        setIsDownloading(true);
        try {
            const clients = await base44.entities.Client.list();
            localStorage.setItem('offline_clients', JSON.stringify(clients));
            setOfflineClients(clients);
            toast.success(`${clients.length} clientes baixados para acesso offline`);
        } catch (error) {
            toast.error('Erro ao baixar dados');
        } finally {
            setIsDownloading(false);
        }
    };

    const filteredClients = offlineClients.filter(client =>
        client.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.clinic_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const saveOfflineChange = (entity, action, id, data) => {
        const pending = JSON.parse(localStorage.getItem('offline_pending_changes') || '[]');
        pending.push({
            entity,
            action,
            id,
            data,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('offline_pending_changes', JSON.stringify(pending));
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <HardDrive className="h-5 w-5 text-blue-600" />
                        Dados Offline
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-semibold">{offlineClients.length} clientes disponíveis</div>
                            <div className="text-sm text-gray-600">Acessíveis sem internet</div>
                        </div>
                        <Button
                            onClick={downloadDataForOffline}
                            disabled={isDownloading}
                        >
                            {isDownloading ? (
                                <>
                                    <Download className="h-4 w-4 mr-2 animate-bounce" />
                                    Baixando...
                                </>
                            ) : (
                                <>
                                    <Download className="h-4 w-4 mr-2" />
                                    Atualizar
                                </>
                            )}
                        </Button>
                    </div>

                    {offlineClients.length > 0 && (
                        <>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Buscar cliente offline..."
                                    className="pl-9"
                                />
                            </div>

                            <div className="max-h-96 overflow-y-auto space-y-2">
                                {filteredClients.map(client => (
                                    <div
                                        key={client.id}
                                        onClick={() => navigate(`/ClientProfile?id=${client.id}`)}
                                        className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-900 flex items-center gap-2">
                                                    <User className="h-4 w-4 text-gray-500" />
                                                    {client.first_name}
                                                </div>
                                                {client.clinic_name && (
                                                    <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                                        <Building2 className="h-3 w-3" />
                                                        {client.clinic_name}
                                                    </div>
                                                )}
                                            </div>
                                            <Badge className={
                                                client.status === 'quente' ? 'bg-red-100 text-red-800' :
                                                client.status === 'morno' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-blue-100 text-blue-800'
                                            }>
                                                {client.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}