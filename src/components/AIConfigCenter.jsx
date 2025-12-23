import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings, Zap, Save } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Central de Configuração de IA
 * Controle unificado de todas as IAs do sistema
 */
export default function AIConfigCenter() {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState({
    auto_reports_enabled: true,
    task_ai_enabled: true,
    voice_commands_enabled: true,
    crm_sync_enabled: true,
    followup_ai_enabled: true,
    auto_task_generation: true,
    ai_aggressiveness: 'medium', // low, medium, high
    auto_whatsapp: false,
    llm_creativity: 0.7
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
    onSuccess: (data) => {
      if (data.ai_config) {
        setConfig({ ...config, ...data.ai_config });
      }
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['current-user']);
      toast.success('✅ Configurações de IA salvas!');
    }
  });

  const handleSave = () => {
    updateMutation.mutate({ ai_config: config });
  };

  return (
    <Card className="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
          <Settings className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800">Central de IA</h3>
          <p className="text-xs text-slate-600">Controle todas as inteligências artificiais</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
          <div>
            <p className="text-sm font-medium text-slate-800">Relatórios Automáticos</p>
            <p className="text-xs text-slate-500">Geração diária/semanal/mensal</p>
          </div>
          <Switch
            checked={config.auto_reports_enabled}
            onCheckedChange={(v) => setConfig({ ...config, auto_reports_enabled: v })}
          />
        </div>

        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
          <div>
            <p className="text-sm font-medium text-slate-800">Gestor de Tarefas IA</p>
            <p className="text-xs text-slate-500">Priorização inteligente</p>
          </div>
          <Switch
            checked={config.task_ai_enabled}
            onCheckedChange={(v) => setConfig({ ...config, task_ai_enabled: v })}
          />
        </div>

        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
          <div>
            <p className="text-sm font-medium text-slate-800">Comandos de Voz</p>
            <p className="text-xs text-slate-500">Ativação por "NR"</p>
          </div>
          <Switch
            checked={config.voice_commands_enabled}
            onCheckedChange={(v) => setConfig({ ...config, voice_commands_enabled: v })}
          />
        </div>

        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
          <div>
            <p className="text-sm font-medium text-slate-800">Sync CRM Externo</p>
            <p className="text-xs text-slate-500">Integração automática</p>
          </div>
          <Switch
            checked={config.crm_sync_enabled}
            onCheckedChange={(v) => setConfig({ ...config, crm_sync_enabled: v })}
          />
        </div>

        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
          <div>
            <p className="text-sm font-medium text-slate-800">Follow-up Automático IA</p>
            <p className="text-xs text-slate-500">Mensagens inteligentes</p>
          </div>
          <Switch
            checked={config.followup_ai_enabled}
            onCheckedChange={(v) => setConfig({ ...config, followup_ai_enabled: v })}
          />
        </div>

        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
          <div>
            <p className="text-sm font-medium text-slate-800">Criação Auto de Tarefas</p>
            <p className="text-xs text-slate-500">Baseado em comportamento</p>
          </div>
          <Switch
            checked={config.auto_task_generation}
            onCheckedChange={(v) => setConfig({ ...config, auto_task_generation: v })}
          />
        </div>

        <div className="p-3 bg-white rounded-lg">
          <Label className="text-sm font-medium text-slate-800 mb-2">Agressividade da IA</Label>
          <select
            value={config.ai_aggressiveness}
            onChange={(e) => setConfig({ ...config, ai_aggressiveness: e.target.value })}
            className="w-full p-2 border rounded-lg text-sm"
          >
            <option value="low">Baixa - Sugestões conservadoras</option>
            <option value="medium">Média - Balanceada</option>
            <option value="high">Alta - Agressiva e proativa</option>
          </select>
        </div>

        <div className="p-3 bg-white rounded-lg">
          <Label className="text-sm font-medium text-slate-800 mb-2">Criatividade LLM: {config.llm_creativity}</Label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={config.llm_creativity}
            onChange={(e) => setConfig({ ...config, llm_creativity: parseFloat(e.target.value) })}
            className="w-full"
          />
          <p className="text-xs text-slate-500 mt-1">
            {config.llm_creativity < 0.4 ? 'Conservadora' : config.llm_creativity > 0.7 ? 'Criativa' : 'Balanceada'}
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="w-full bg-indigo-600 hover:bg-indigo-700"
        >
          <Save className="w-4 h-4 mr-2" />
          Salvar Configurações
        </Button>
      </div>
    </Card>
  );
}