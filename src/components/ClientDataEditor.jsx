import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, User, Building2, Save } from 'lucide-react';

// Numerologia Pitagórica com números mestres
const calculateNumerology = (name) => {
  const values = {
    a: 1, j: 1, s: 1,
    b: 2, k: 2, t: 2,
    c: 3, l: 3, u: 3,
    d: 4, m: 4, v: 4,
    e: 5, n: 5, w: 5,
    f: 6, o: 6, x: 6,
    g: 7, p: 7, y: 7,
    h: 8, q: 8, z: 8,
    i: 9, r: 9
  };
  
  let sum = 0;
  const cleanName = name.toLowerCase().replace(/[^a-z]/g, '');
  
  for (const char of cleanName) {
    sum += values[char] || 0;
  }
  
  // Preservar números mestres 11 e 22
  while (sum > 22 || (sum > 9 && sum !== 11 && sum !== 22)) {
    sum = sum.toString().split('').reduce((a, b) => parseInt(a) + parseInt(b), 0);
  }
  
  return sum || 1;
};

const calculateLifePath = (birthdate) => {
  if (!birthdate) return null;
  
  const numbers = birthdate.replace(/\D/g, '');
  let sum = 0;
  
  for (const digit of numbers) {
    sum += parseInt(digit);
  }
  
  // Preservar números mestres 11 e 22
  while (sum > 22 || (sum > 9 && sum !== 11 && sum !== 22)) {
    sum = sum.toString().split('').reduce((a, b) => parseInt(a) + parseInt(b), 0);
  }
  
  return sum;
};

const getBehavioralProfile = (number) => {
  const profiles = {
    1: 'Líder decidido, valoriza inovação e autonomia',
    2: 'Diplomático, busca harmonia e parceria',
    3: 'Comunicador criativo, valoriza reconhecimento',
    4: 'Prático e metódico, valoriza estabilidade',
    5: 'Versátil e curioso, valoriza liberdade',
    6: 'Responsável e protetor, valoriza qualidade',
    7: 'Analítico e investigativo, valoriza conhecimento',
    8: 'Empreendedor ambicioso, foca em resultados',
    9: 'Visionário idealista, valoriza propósito',
    11: 'Visionário iluminado, inspirador nato, intuitivo e sensível',
    22: 'Construtor mestre, transforma visões em realidade concreta'
  };
  return profiles[number] || profiles[1];
};

const getDecisionStyle = (number) => {
  const styles = {
    1: 'Decide rápido quando vê benefício claro',
    2: 'Precisa de tempo e confiança',
    3: 'Decide por entusiasmo e histórias',
    4: 'Decide com dados e garantias',
    5: 'Decide por impulso em oportunidades',
    6: 'Decide pensando na equipe',
    7: 'Decide após análise completa',
    8: 'Decide por retorno financeiro',
    9: 'Decide por propósito maior',
    11: 'Decide por inspiração e visão de impacto',
    22: 'Decide com visão de longo prazo e legado'
  };
  return styles[number] || styles[1];
};

export default function ClientDataEditor({ clientId, client }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    full_name: client.full_name || '',
    first_name: client.first_name || '',
    birthdate: client.birthdate || '',
    cnpj: client.cnpj || '',
    razao_social: client.razao_social || '',
    email: client.email || '',
    phone: client.phone || '',
    address: client.address || '',
    city: client.city || '',
    clinic_name: client.clinic_name || '',
    current_equipment: client.current_equipment || '',
    client_type: client.client_type || '',
    decision_role: client.decision_role || '',
    client_tone: client.client_tone || '',
    available_budget: client.available_budget || '',
    decision_deadline: client.decision_deadline || '',
    notes: client.notes || ''
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.update(clientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['client', clientId]);
    }
  });

  const handleFieldChange = (field, value) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

    // Auto-save e recalcular numerologia se nome ou birthdate mudarem
    let updateData = { [field]: value };

    if (field === 'full_name' || field === 'first_name' || field === 'birthdate') {
      const nameForCalc = newFormData.full_name || newFormData.first_name;
      
      if (nameForCalc) {
        const numerologyNumber = calculateNumerology(nameForCalc);
        updateData.numerology_number = numerologyNumber;
        updateData.behavioral_profile = getBehavioralProfile(numerologyNumber);
        updateData.decision_style = getDecisionStyle(numerologyNumber);
      }

      if (newFormData.birthdate) {
        updateData.life_path_number = calculateLifePath(newFormData.birthdate);
      }
    }

    updateMutation.mutate(updateData);
  };

  return (
    <Card className="p-4 bg-white">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
          <User className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800">Dados do Cliente</h3>
          <p className="text-xs text-slate-600">Edite e salvamento é automático</p>
        </div>
        {updateMutation.isPending && (
          <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
        )}
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-xs">Primeiro Nome *</Label>
          <Input
            value={formData.first_name}
            onChange={(e) => handleFieldChange('first_name', e.target.value)}
          />
        </div>

        <div>
          <Label className="text-xs">Nome Completo</Label>
          <Input
            value={formData.full_name}
            onChange={(e) => handleFieldChange('full_name', e.target.value)}
            placeholder="Para cálculo numerológico completo"
          />
        </div>

        <div>
          <Label className="text-xs">Data de Nascimento</Label>
          <Input
            type="text"
            value={formData.birthdate}
            onChange={(e) => handleFieldChange('birthdate', e.target.value)}
            placeholder="DD/MM/AAAA ou AAAA-MM-DD"
          />
          {formData.birthdate && (
            <p className="text-xs text-green-600 mt-1">
              ✓ Numerologia recalculada automaticamente
            </p>
          )}
        </div>

        <div>
          <Label className="text-xs">CNPJ</Label>
          <Input
            value={formData.cnpj}
            onChange={(e) => handleFieldChange('cnpj', e.target.value)}
            placeholder="00.000.000/0000-00"
          />
        </div>

        <div>
          <Label className="text-xs">Razão Social</Label>
          <Input
            value={formData.razao_social}
            onChange={(e) => handleFieldChange('razao_social', e.target.value)}
          />
        </div>

        <div>
          <Label className="text-xs">Email</Label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => handleFieldChange('email', e.target.value)}
          />
        </div>

        <div>
          <Label className="text-xs">WhatsApp</Label>
          <Input
            value={formData.phone}
            onChange={(e) => handleFieldChange('phone', e.target.value.replace(/\D/g, ''))}
            placeholder="5511999999999"
          />
        </div>

        <div>
          <Label className="text-xs">Endereço</Label>
          <Input
            value={formData.address}
            onChange={(e) => handleFieldChange('address', e.target.value)}
          />
        </div>

        <div>
          <Label className="text-xs">Cidade</Label>
          <Input
            value={formData.city}
            onChange={(e) => handleFieldChange('city', e.target.value)}
          />
        </div>

        <div>
          <Label className="text-xs">Nome da Clínica/Hospital</Label>
          <Input
            value={formData.clinic_name}
            onChange={(e) => handleFieldChange('clinic_name', e.target.value)}
          />
        </div>

        <div>
          <Label className="text-xs">Equipamento Atual</Label>
          <Input
            value={formData.current_equipment}
            onChange={(e) => handleFieldChange('current_equipment', e.target.value)}
          />
        </div>

        <div>
          <Label className="text-xs">Tipo de Cliente</Label>
          <Select value={formData.client_type} onValueChange={(v) => handleFieldChange('client_type', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="clinica_pequena">Clínica Pequena</SelectItem>
              <SelectItem value="clinica_media">Clínica Média</SelectItem>
              <SelectItem value="hospital_veterinario">Hospital Veterinário</SelectItem>
              <SelectItem value="laboratorio_terceirizado">Lab. Terceirizado</SelectItem>
              <SelectItem value="clinica_especializada">Clínica Especializada</SelectItem>
              <SelectItem value="sem_equipamento">Sem Equipamento</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs">Papel do Decisor *</Label>
          <Select value={formData.decision_role} onValueChange={(v) => handleFieldChange('decision_role', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="proprietario">Proprietário</SelectItem>
              <SelectItem value="veterinario_responsavel">Veterinário Responsável</SelectItem>
              <SelectItem value="gestor_laboratorio">Gestor de Laboratório</SelectItem>
              <SelectItem value="coordenador_tecnico">Coordenador Técnico</SelectItem>
              <SelectItem value="socio">Sócio</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs">Tom de Voz</Label>
          <Select value={formData.client_tone} onValueChange={(v) => handleFieldChange('client_tone', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="assertivo">Assertivo</SelectItem>
              <SelectItem value="analitico">Analítico</SelectItem>
              <SelectItem value="receptivo">Receptivo</SelectItem>
              <SelectItem value="entusiasmado">Entusiasmado</SelectItem>
              <SelectItem value="cauteloso">Cauteloso</SelectItem>
              <SelectItem value="direto">Direto</SelectItem>
              <SelectItem value="emocional">Emocional</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs">Orçamento Disponível (R$)</Label>
          <Input
            type="number"
            value={formData.available_budget}
            onChange={(e) => handleFieldChange('available_budget', e.target.value)}
            placeholder="0 a 150.000"
            min="0"
            max="150000"
          />
        </div>

        <div>
          <Label className="text-xs">Prazo para Decisão</Label>
          <Input
            type="date"
            value={formData.decision_deadline}
            onChange={(e) => handleFieldChange('decision_deadline', e.target.value)}
          />
        </div>

        <div>
          <Label className="text-xs">Notas</Label>
          <Textarea
            value={formData.notes}
            onChange={(e) => handleFieldChange('notes', e.target.value)}
            rows={4}
          />
        </div>
      </div>

      {updateMutation.isSuccess && (
        <div className="mt-3 p-2 bg-green-50 rounded border border-green-200">
          <p className="text-xs text-green-700">✓ Salvo automaticamente</p>
        </div>
      )}
    </Card>
  );
}