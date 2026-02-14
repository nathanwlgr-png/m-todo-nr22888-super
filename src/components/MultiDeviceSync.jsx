import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Smartphone, RefreshCw, Trash2, Plus, CheckCircle2 } from 'lucide-react';

export default function MultiDeviceSync() {
  const [devices, setDevices] = useState([
    { id: 1, name: 'Tablet 53 - Principal', cnpj: '13693877000157', mobvendedor_id: '53', active: true }
  ]);
  const [newDevice, setNewDevice] = useState({ name: '', cnpj: '', mobvendedor_id: '' });
  const [syncing, setSyncing] = useState(false);

  const addDevice = () => {
    if (!newDevice.name || !newDevice.cnpj || !newDevice.mobvendedor_id) {
      toast.error('Preencha todos os campos');
      return;
    }

    const cleanCnpj = newDevice.cnpj.replace(/\D/g, '');
    if (cleanCnpj.length !== 14) {
      toast.error('CNPJ deve ter 14 dígitos');
      return;
    }

    setDevices([...devices, {
      id: Date.now(),
      ...newDevice,
      cnpj: cleanCnpj,
      active: true
    }]);
    setNewDevice({ name: '', cnpj: '', mobvendedor_id: '' });
    toast.success('Dispositivo adicionado');
  };

  const removeDevice = (id) => {
    setDevices(devices.filter(d => d.id !== id));
    toast.success('Dispositivo removido');
  };

  const syncDevice = async (device) => {
    const loading = toast.loading(`Sincronizando ${device.name}...`);
    try {
      const response = await base44.functions.invoke('mobVendedorIntegration', {
        action: 'sync_clients',
        credentials: {
          cnpj: device.cnpj,
          mobvendedor_id: device.mobvendedor_id
        }
      });

      toast.dismiss(loading);
      if (response.data.success) {
        toast.success(`✅ ${device.name}: ${response.data.synced} clientes importados!`);
      } else {
        toast.error(`❌ ${device.name}: ${response.data.error}`);
      }
    } catch (error) {
      toast.dismiss(loading);
      toast.error(`Erro em ${device.name}: ${error.message}`);
    }
  };

  const syncAllDevices = async () => {
    setSyncing(true);
    const activeDevices = devices.filter(d => d.active);
    
    toast.info(`Sincronizando ${activeDevices.length} dispositivos...`);

    for (const device of activeDevices) {
      await syncDevice(device);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setSyncing(false);
    toast.success('🎉 Sincronização completa de todos os dispositivos!');
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-400">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
          <Smartphone className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-indigo-900">📱 Sincronização Multi-Dispositivos</h3>
          <p className="text-xs text-indigo-700">Gerencie múltiplos tablets mobVendedor</p>
        </div>
      </div>

      {/* Dispositivos Cadastrados */}
      <div className="space-y-2 mb-4">
        {devices.map((device) => (
          <div key={device.id} className="flex items-center gap-2 p-3 bg-white rounded-lg border border-indigo-200">
            <input
              type="checkbox"
              checked={device.active}
              onChange={(e) => {
                setDevices(devices.map(d => 
                  d.id === device.id ? { ...d, active: e.target.checked } : d
                ));
              }}
              className="w-4 h-4"
            />
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-800">{device.name}</p>
              <p className="text-xs text-slate-600">
                CNPJ: {device.cnpj} • ID: {device.mobvendedor_id}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => syncDevice(device)}
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={syncing}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            {device.id !== 1 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeDevice(device.id)}
                className="text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Adicionar Novo Dispositivo */}
      <div className="p-3 bg-white rounded-lg border-2 border-dashed border-indigo-300 space-y-2">
        <p className="text-xs font-bold text-indigo-900 mb-2">➕ Adicionar Dispositivo</p>
        <Input
          placeholder="Nome (ex: Tablet 72 - Vendedor João)"
          value={newDevice.name}
          onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
          className="text-sm"
        />
        <Input
          placeholder="CNPJ (14 dígitos)"
          value={newDevice.cnpj}
          onChange={(e) => setNewDevice({ ...newDevice, cnpj: e.target.value })}
          className="text-sm"
        />
        <Input
          placeholder="ID do Distribuidor"
          value={newDevice.mobvendedor_id}
          onChange={(e) => setNewDevice({ ...newDevice, mobvendedor_id: e.target.value })}
          className="text-sm"
        />
        <Button
          onClick={addDevice}
          className="w-full bg-indigo-600 hover:bg-indigo-700"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Dispositivo
        </Button>
      </div>

      {/* Sincronizar Todos */}
      <Button
        onClick={syncAllDevices}
        disabled={syncing || devices.filter(d => d.active).length === 0}
        className="w-full mt-4 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold"
      >
        {syncing ? (
          <>
            <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
            Sincronizando...
          </>
        ) : (
          <>
            <CheckCircle2 className="w-5 h-5 mr-2" />
            🚀 SINCRONIZAR TODOS ({devices.filter(d => d.active).length} ATIVOS)
          </>
        )}
      </Button>
    </Card>
  );
}