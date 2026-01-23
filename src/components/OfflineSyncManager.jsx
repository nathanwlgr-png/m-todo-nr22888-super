import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WifiOff, Wifi, RefreshCw, Database, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function OfflineSyncManager() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [pendingChanges, setPendingChanges] = useState([]);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSync, setLastSync] = useState(null);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            toast.success('Conexão restaurada! Sincronizando...');
            syncPendingChanges();
        };
        
        const handleOffline = () => {
            setIsOnline(false);
            toast.warning('Modo offline ativado');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        loadPendingChanges();

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const loadPendingChanges = () => {
        const pending = localStorage.getItem('offline_pending_changes');
        if (pending) {
            setPendingChanges(JSON.parse(pending));
        }
    };

    const syncPendingChanges = async () => {
        if (!isOnline || pendingChanges.length === 0) return;

        setIsSyncing(true);
        let successCount = 0;
        let failCount = 0;

        try {
            for (const change of pendingChanges) {
                try {
                    if (change.action === 'create') {
                        await base44.entities[change.entity].create(change.data);
                    } else if (change.action === 'update') {
                        await base44.entities[change.entity].update(change.id, change.data);
                    } else if (change.action === 'delete') {
                        await base44.entities[change.entity].delete(change.id);
                    }
                    successCount++;
                } catch (error) {
                    console.error('Sync error:', error);
                    failCount++;
                }
            }

            if (failCount === 0) {
                localStorage.removeItem('offline_pending_changes');
                setPendingChanges([]);
                toast.success(`${successCount} alterações sincronizadas!`);
            } else {
                toast.warning(`${successCount} sincronizadas, ${failCount} falharam`);
            }

            setLastSync(new Date().toISOString());
        } catch (error) {
            console.error('Sync failed:', error);
            toast.error('Erro ao sincronizar dados');
        } finally {
            setIsSyncing(false);
        }
    };

    const clearPendingChanges = () => {
        if (confirm('Tem certeza que deseja limpar todas as alterações pendentes?')) {
            localStorage.removeItem('offline_pending_changes');
            setPendingChanges([]);
            toast.success('Alterações pendentes removidas');
        }
    };

    return (
        <Card className={isOnline ? 'border-green-200' : 'border-orange-200'}>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {isOnline ? (
                            <Wifi className="h-5 w-5 text-green-600" />
                        ) : (
                            <WifiOff className="h-5 w-5 text-orange-600" />
                        )}
                        Status de Sincronização
                    </div>
                    <Badge className={isOnline ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                        {isOnline ? 'Online' : 'Offline'}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {pendingChanges.length > 0 && (
                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                        <div className="flex items-center gap-2">
                            <Database className="h-5 w-5 text-orange-600" />
                            <div>
                                <div className="font-semibold text-sm text-orange-900">
                                    {pendingChanges.length} alterações pendentes
                                </div>
                                <div className="text-xs text-orange-700">
                                    Serão sincronizadas quando online
                                </div>
                            </div>
                        </div>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={clearPendingChanges}
                            className="text-xs"
                        >
                            Limpar
                        </Button>
                    </div>
                )}

                {isOnline && pendingChanges.length > 0 && (
                    <Button
                        onClick={syncPendingChanges}
                        disabled={isSyncing}
                        className="w-full"
                    >
                        {isSyncing ? (
                            <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Sincronizando...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Sincronizar Agora
                            </>
                        )}
                    </Button>
                )}

                {lastSync && (
                    <div className="text-xs text-gray-500 text-center">
                        Última sincronização: {new Date(lastSync).toLocaleString('pt-BR')}
                    </div>
                )}

                {pendingChanges.length === 0 && isOnline && (
                    <div className="flex items-center justify-center gap-2 p-3 bg-green-50 rounded-lg text-green-700">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-sm">Todos os dados sincronizados</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}