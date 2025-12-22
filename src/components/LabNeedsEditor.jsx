import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Save, FlaskConical } from 'lucide-react';
import { toast } from 'sonner';

const availableNeeds = [
  { value: 'hemograma', label: 'Hemograma' },
  { value: 'bioquimico', label: 'Bioquímico' },
  { value: 'hemogasio', label: 'Hemogasometria' },
  { value: 'imunofluorescencia', label: 'Imunofluorescência' },
  { value: 'urinalise', label: 'Urinálise' },
  { value: 'pcr', label: 'PCR' }
];

export default function LabNeedsEditor({ clientId, currentNeeds = [] }) {
  const queryClient = useQueryClient();
  const [selectedNeeds, setSelectedNeeds] = useState(currentNeeds || []);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: equipments = [] } = useQuery({
    queryKey: ['equipments'],
    queryFn: () => base44.entities.Equipment.list()
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.update(clientId, data),
    onSuccess: async (updatedClient) => {
      queryClient.invalidateQueries(['client', clientId]);
      queryClient.invalidateQueries(['clients']);
      setHasChanges(false);
      
      // Gerar sugestão de equipamento quando necessidades mudam
      try {
        const selectedNeedsLabels = selectedNeeds.map(n => 
          availableNeeds.find(a => a.value === n)?.label || n
        ).join(', ');
        
        const prompt = `Cliente precisa de: ${selectedNeedsLabels}.

Equipamentos disponíveis:
${equipments.map(e => `${e.name} (${e.category}): R$ ${e.price?.toLocaleString('pt-BR')}`).join('\n')}

Sugira o equipamento IDEAL em 1-2 frases curtas.`;

        const suggestion = await base44.integrations.Core.InvokeLLM({ prompt });
        
        await base44.entities.Client.update(clientId, {
          equipment_suggestion: suggestion
        });
        
        queryClient.invalidateQueries(['client', clientId]);
      } catch (error) {
        console.log('Erro ao gerar sugestão');
      }
    }
  });

  const handleToggle = (value) => {
    const newNeeds = selectedNeeds.includes(value)
      ? selectedNeeds.filter(n => n !== value)
      : [...selectedNeeds, value];
    
    setSelectedNeeds(newNeeds);
    setHasChanges(true);
    
    // Salvamento automático
    updateMutation.mutate({ lab_needs: newNeeds });
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
          <FlaskConical className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800">Necessidades do Laboratório</h3>
          <p className="text-xs text-slate-600">Selecione os tipos de exames necessários</p>
        </div>
        {updateMutation.isPending && (
          <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
        )}
      </div>

      <div className="space-y-2">
        {availableNeeds.map((need) => (
          <div key={need.value} className="flex items-center gap-2 p-2 bg-white rounded-lg hover:bg-purple-50 transition-colors">
            <Checkbox
              id={`need-${need.value}`}
              checked={selectedNeeds.includes(need.value)}
              onCheckedChange={() => handleToggle(need.value)}
            />
            <Label
              htmlFor={`need-${need.value}`}
              className="flex-1 cursor-pointer text-sm"
            >
              {need.label}
            </Label>
          </div>
        ))}
      </div>

      {selectedNeeds.length > 0 && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-slate-500 mb-2">Selecionados:</p>
          <div className="flex flex-wrap gap-2">
            {selectedNeeds.map((need) => {
              const needObj = availableNeeds.find(n => n.value === need);
              return (
                <Badge key={need} className="bg-purple-100 text-purple-700">
                  {needObj?.label || need}
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {updateMutation.isSuccess && !hasChanges && (
        <div className="mt-3 p-2 bg-green-50 rounded-lg border border-green-200">
          <p className="text-xs text-green-700">✓ Salvo automaticamente</p>
        </div>
      )}
    </Card>
  );
}