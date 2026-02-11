import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function MobVendedorSync() {
  const [showConfig, setShowConfig] = useState(false);
  const [credentials, setCredentials] = useState({
    username: localStorage.getItem('mob_username') || '',
    password: '',
    distributor_id: localStorage.getItem('mob_distributor_id') || ''
  });
  const [token, setToken] = useState(localStorage.getItem('mob_token') || null);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(null);

  const { data: syncData = [] } = useQuery({
    queryKey: ['mob_vendedor_sync'],
    queryFn: async () => {
      try {
        return await base44.entities.MobVendedorSync.list('-last_sync', 20);
      } catch (error) {
        console.error('Erro ao buscar dados sincronizados:', error);
        return [];
      }
    },
    enabled: !!token,
    refetchInterval: 5 * 60 * 1000 // A cada 5 minutos
  });

  const testConnection = async () => {
    setTesting(true);
    try {
      const response = await base44.functions.invoke('mobVendedorIntegration', {
        action: 'test_connection',
        credentials
      });

      if (response.data.success) {
        setToken(response.data.token);
        localStorage.setItem('mob_token', response.data.token);
        localStorage.setItem('mob_username', credentials.username);
        localStorage.setItem('mob_distributor_id', credentials.distributor_id);
        toast.success('✅ Conexão com Target Sistemas estabelecida!');
        setShowConfig(false);
      } else {
        toast.error('❌ ' + response.data.error);
      }
    } catch (error) {
      toast.error('Erro: ' + error.message);
    } finally {
      setTesting(false);
    }
  };

  const syncEquipment = async () => {
    setSyncing('equipment');
    try {
      const response = await base44.functions.invoke('mobVendedorIntegration', {
        action: 'sync_equipment',
        credentials: {
          token,
          distributor_id: credentials.distributor_id
        }
      });

      if (response.data.success) {
        toast.success(`✅ ${response.data.synced} equipamentos sincronizados`);
      } else {
        toast.error('❌ Erro ao sincronizar: ' + response.data.error);
      }
    } catch (error) {
      toast.error('Erro: ' + error.message);
    } finally {
      setSyncing(null);
    }
  };

  const syncClients = async () => {
    setSyncing('clients');
    try {
      const response = await base44.functions.invoke('mobVendedorIntegration', {
        action: 'sync_clients',
        credentials: {
          cnpj: '13693877000157',
          mobvendedor_id: '53'
        }
      });

      if (response.data.success) {
        toast.success(`✅ ${response.data.synced} clientes sincronizados do MobVendedor 53!`);
      } else {
        toast.error('❌ Erro: ' + response.data.error);
      }
    } catch (error) {
      toast.error('Erro: ' + error.message);
    } finally {
      setSyncing(null);
    }
  };

  const syncSales = async () => {
    setSyncing('sales');
    try {
      const response = await base44.functions.invoke('mobVendedorIntegration', {
        action: 'sync_sales',
        credentials: {
          token,
          distributor_id: credentials.distributor_id
        }
      });

      if (response.data.success) {
        toast.success(`✅ Dados de vendas sincronizados`);
      } else {
        toast.error('❌ Erro ao sincronizar: ' + response.data.error);
      }
    } catch (error) {
      toast.error('Erro: ' + error.message);
    } finally {
      setSyncing(null);
    }
  };

  const disconnect = () => {
    setToken(null);
    localStorage.removeItem('mob_token');
    localStorage.removeItem('mob_username');
    localStorage.removeItem('mob_distributor_id');
    toast.success('Desconectado do mobVendedor');
  };

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <Card className={`p-4 ${token ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {token ? (
              <>
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">Conectado ao mobVendedor</p>
                  <p className="text-xs text-green-700">Usuário: {credentials.username}</p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-6 h-6 text-amber-600" />
                <div>
                  <p className="font-semibold text-amber-900">Desconectado</p>
                  <p className="text-xs text-amber-700">Configure suas credenciais do Target Sistemas</p>
                </div>
              </>
            )}
          </div>
          <Button
            onClick={() => token ? disconnect() : setShowConfig(true)}
            variant={token ? "outline" : "default"}
            className={token ? "border-red-200 text-red-600" : ""}
          >
            {token ? 'Desconectar' : 'Conectar'}
          </Button>
        </div>
      </Card>

      {/* Configuração */}
      {showConfig && !token && (
        <Card className="p-4 bg-white border-indigo-200">
          <h3 className="font-semibold text-slate-800 mb-4">Configurar mobVendedor</h3>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-slate-600">Usuário Target Sistemas</Label>
              <Input
                type="email"
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                placeholder="seu@email.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-600">Senha</Label>
              <Input
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                placeholder="••••••••"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-600">ID Distribuidor (opcional)</Label>
              <Input
                value={credentials.distributor_id}
                onChange={(e) => setCredentials({ ...credentials, distributor_id: e.target.value })}
                placeholder="Ex: 123456"
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={testConnection}
                disabled={testing || !credentials.username || !credentials.password}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                {testing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Testando...
                  </>
                ) : (
                  'Testar Conexão'
                )}
              </Button>
              <Button
                onClick={() => setShowConfig(false)}
                variant="outline"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Sincronização */}
      <Card className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-indigo-600 font-semibold">Clientes MobVendedor</p>
            <p className="text-lg font-bold text-indigo-900">CNPJ: 13.693.877/0001-57</p>
            <p className="text-xs text-indigo-600">Distribuidor ID: 53</p>
          </div>
          <Button
            onClick={syncClients}
            disabled={syncing === 'clients'}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {syncing === 'clients' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Baixando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Baixar Clientes
              </>
            )}
          </Button>
        </div>
      </Card>

      {token && (
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-600 font-semibold">Estoque</p>
                <p className="text-lg font-bold text-blue-900">{syncData.length}</p>
                <p className="text-xs text-blue-600">equipamentos</p>
              </div>
              <Button
                size="sm"
                onClick={syncEquipment}
                disabled={syncing === 'equipment'}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {syncing === 'equipment' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-600 font-semibold">Vendas</p>
                <p className="text-lg font-bold text-purple-900">
                  R$ {syncData.reduce((sum, item) => sum + (item.monthly_sales * item.price || 0), 0).toLocaleString('pt-BR')}
                </p>
                <p className="text-xs text-purple-600">este mês</p>
              </div>
              <Button
                size="sm"
                onClick={syncSales}
                disabled={syncing === 'sales'}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {syncing === 'sales' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Dados Sincronizados */}
      {token && syncData.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold text-slate-800 mb-3">Equipamentos em Estoque</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {syncData.slice(0, 10).map((item) => (
              <div key={item.id} className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-sm">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-slate-800">{item.equipment_name}</p>
                  <Badge className={item.stock_quantity > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                    {item.stock_quantity} un.
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <p>R$ {(item.price || 0).toLocaleString('pt-BR')}</p>
                  <p>Vendas: {item.monthly_sales || 0}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}