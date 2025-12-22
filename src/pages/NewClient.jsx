import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft, 
  Sparkles, 
  User, 
  Building2, 
  UserCog,
  Loader2
} from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";

const clientTypes = [
  { value: 'clinica_pequena', label: 'Clínica Pequena (até 40 exames/mês)' },
  { value: 'clinica_media', label: 'Clínica Média (40-120 exames/mês)' },
  { value: 'hospital_veterinario', label: 'Hospital Veterinário (120+ exames/mês)' },
  { value: 'laboratorio_terceirizado', label: 'Laboratório Terceirizado' },
  { value: 'clinica_especializada', label: 'Clínica Especializada' },
  { value: 'sem_equipamento', label: 'Ainda não tem equipamento' },
];

const decisionRoles = [
  { value: 'proprietario', label: 'Proprietário' },
  { value: 'veterinario_responsavel', label: 'Veterinário Responsável' },
  { value: 'gestor_laboratorio', label: 'Gestor de Laboratório' },
  { value: 'coordenador_tecnico', label: 'Coordenador Técnico' },
  { value: 'socio', label: 'Sócio' },
];

// Numerologia Pitagórica - Nome
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

// Numerologia Pitagórica - Caminho de Vida (Data de Nascimento)
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

export default function NewClient() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    first_name: '',
    birthdate: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    clinic_name: '',
    current_equipment: '',
    client_type: '',
    decision_role: '',
    available_budget: '',
    decision_deadline: ''
  });
  
  const [motivators, setMotivators] = useState([]);
  const [newMotivator, setNewMotivator] = useState('');
  const [objections, setObjections] = useState([]);
  const [newObjection, setNewObjection] = useState('');

  const handleSubmit = async () => {
    if (!formData.first_name || !formData.decision_role) {
      return;
    }

    setLoading(true);
    
    try {
      const nameForNumerology = formData.full_name || formData.first_name;
      const numerologyNumber = calculateNumerology(nameForNumerology);
      const lifePathNumber = calculateLifePath(formData.birthdate);
      
      const clientData = {
        ...formData,
        numerology_number: numerologyNumber,
        life_path_number: lifePathNumber,
        behavioral_profile: getBehavioralProfile(numerologyNumber),
        decision_style: getDecisionStyle(numerologyNumber),
        purchase_motivators: motivators,
        real_objections: objections,
        purchase_score: Math.floor(Math.random() * 40) + 30,
        status: 'morno'
      };

      const client = await base44.entities.Client.create(clientData);

      // AUTOMAÇÃO 1: Email de boas-vindas
      try {
      await base44.integrations.Core.SendEmail({
        to: client.created_by,
        subject: `Novo cliente cadastrado: ${client.first_name}`,
        body: `Olá!\n\nO cliente ${client.first_name} foi cadastrado com sucesso.\n\nTipo: ${client.client_type || 'Não especificado'}\nPerfil: ${client.behavioral_profile}\n\nAcesse o sistema para começar o atendimento!`
      });
      } catch (error) {
      console.log('Email automation failed');
      }

      // AUTOMAÇÃO 2: Tarefa de primeira visita
      try {
      const threeDaysLater = new Date();
      threeDaysLater.setDate(threeDaysLater.getDate() + 3);

      await base44.entities.Task.create({
        client_id: client.id,
        client_name: client.first_name,
        title: 'Agendar primeira visita',
        description: `Entrar em contato com ${client.first_name} para agendar a primeira visita.`,
        due_date: threeDaysLater.toISOString().split('T')[0],
        status: 'pendente',
        priority: 'alta',
        type: 'follow_up',
        auto_created: true
      });
      } catch (error) {
      console.log('Task automation failed');
      }

      // Resetar formulário em vez de navegar
      setFormData({
        full_name: '',
        first_name: '',
        birthdate: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        clinic_name: '',
        current_equipment: '',
        client_type: '',
        decision_role: '',
        available_budget: '',
        decision_deadline: ''
      });
      setMotivators([]);
      setObjections([]);
      alert(`Cliente ${client.first_name} cadastrado com sucesso!`);
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      const errorMessage = error?.message || 'Erro desconhecido';
      alert(`Erro ao criar cliente: ${errorMessage}\n\nTente novamente.`);
    } finally {
      setLoading(false);
    }
  };

  const isValid = formData.first_name && formData.decision_role;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-lg font-semibold text-slate-800">Novo Cliente</h1>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Info Card */}
        <Card className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-none">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="font-medium text-slate-800">Cadastro Rápido</p>
              <p className="text-sm text-slate-500">Menos de 30 segundos</p>
            </div>
          </div>
        </Card>

        {/* Form */}
        <div className="space-y-5">
          {/* First Name */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-slate-700">
              <User className="w-4 h-4" />
              Primeiro Nome *
            </Label>
            <Input
              placeholder="Ex: João"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              className="h-14 text-lg rounded-xl border-2 focus:border-orange-500"
            />
          </div>

          {/* Decision Role */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-slate-700">
              <UserCog className="w-4 h-4" />
              Papel do Decisor *
            </Label>
            <Select
              value={formData.decision_role}
              onValueChange={(value) => setFormData({ ...formData, decision_role: value })}
            >
              <SelectTrigger className="h-14 text-base rounded-xl border-2 focus:border-orange-500">
                <SelectValue placeholder="Selecione o papel" />
              </SelectTrigger>
              <SelectContent>
                {decisionRoles.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-slate-700">
              <User className="w-4 h-4" />
              Nome Completo (opcional)
            </Label>
            <Input
              placeholder="Ex: João Silva Santos"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="h-14 text-lg rounded-xl border-2 focus:border-orange-500"
            />
          </div>

          {/* Birthdate */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-slate-700">
              <User className="w-4 h-4" />
              Data de Nascimento (opcional)
            </Label>
            <Input
              type="date"
              value={formData.birthdate}
              onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
              className="h-14 text-lg rounded-xl border-2 focus:border-orange-500"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-slate-700">
              <User className="w-4 h-4" />
              Email (opcional)
            </Label>
            <Input
              type="email"
              placeholder="Ex: joao@clinica.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="h-14 text-lg rounded-xl border-2 focus:border-orange-500"
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-slate-700">
              <User className="w-4 h-4" />
              WhatsApp (opcional)
            </Label>
            <Input
              placeholder="Ex: 5511999999999"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
              className="h-14 text-lg rounded-xl border-2 focus:border-orange-500"
            />
            <p className="text-xs text-slate-500">Formato: código do país + DDD + número</p>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-slate-700">
              <Building2 className="w-4 h-4" />
              Endereço (opcional)
            </Label>
            <Input
              placeholder="Ex: Rua das Flores, 123, Centro"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="h-14 text-lg rounded-xl border-2 focus:border-orange-500"
            />
          </div>

          {/* City */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-slate-700">
              <Building2 className="w-4 h-4" />
              Cidade (opcional)
            </Label>
            <Input
              placeholder="Ex: São Paulo"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="h-14 text-lg rounded-xl border-2 focus:border-orange-500"
            />
          </div>

          {/* Clinic Name */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-slate-700">
              <Building2 className="w-4 h-4" />
              Nome da Clínica/Hospital (opcional)
            </Label>
            <Input
              placeholder="Ex: Clínica Vida Animal"
              value={formData.clinic_name}
              onChange={(e) => setFormData({ ...formData, clinic_name: e.target.value })}
              className="h-14 text-lg rounded-xl border-2 focus:border-orange-500"
            />
          </div>

          {/* Current Equipment */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-slate-700">
              <Building2 className="w-4 h-4" />
              Máquina/Equipamento Atual (opcional)
            </Label>
            <Input
              placeholder="Ex: Analisador BC-2800"
              value={formData.current_equipment}
              onChange={(e) => setFormData({ ...formData, current_equipment: e.target.value })}
              className="h-14 text-lg rounded-xl border-2 focus:border-orange-500"
            />
          </div>

          {/* Client Type */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-slate-700">
              <Building2 className="w-4 h-4" />
              Tipo de Cliente (opcional)
            </Label>
            <Select
              value={formData.client_type}
              onValueChange={(value) => setFormData({ ...formData, client_type: value })}
            >
              <SelectTrigger className="h-14 text-base rounded-xl border-2 focus:border-orange-500">
                <SelectValue placeholder="Pode editar depois" />
              </SelectTrigger>
              <SelectContent>
                {clientTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Budget */}
          <div className="space-y-2">
            <Label className="text-slate-700">Orçamento Disponível (opcional)</Label>
            <Select
              value={formData.available_budget}
              onValueChange={(value) => setFormData({ ...formData, available_budget: value })}
            >
              <SelectTrigger className="h-14 text-base rounded-xl border-2 focus:border-orange-500">
                <SelectValue placeholder="Selecione a faixa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ate_50k">Até R$ 50.000</SelectItem>
                <SelectItem value="50k_100k">R$ 50.000 - R$ 100.000</SelectItem>
                <SelectItem value="100k_200k">R$ 100.000 - R$ 200.000</SelectItem>
                <SelectItem value="200k_500k">R$ 200.000 - R$ 500.000</SelectItem>
                <SelectItem value="acima_500k">Acima de R$ 500.000</SelectItem>
                <SelectItem value="nao_informado">Não informado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Decision Deadline */}
          <div className="space-y-2">
            <Label className="text-slate-700">Prazo para Decisão (opcional)</Label>
            <Input
              type="date"
              value={formData.decision_deadline}
              onChange={(e) => setFormData({ ...formData, decision_deadline: e.target.value })}
              className="h-14 text-lg rounded-xl border-2"
            />
            <p className="text-xs text-slate-500">Quando precisam decidir sobre a compra</p>
          </div>

          {/* Motivators */}
          <div className="space-y-2">
            <Label className="text-slate-700">Motivadores de Compra (opcional)</Label>
            <div className="flex gap-2">
              <Input
                value={newMotivator}
                onChange={(e) => setNewMotivator(e.target.value)}
                placeholder="Ex: Reduzir custos"
                className="h-12 rounded-xl"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newMotivator.trim()) {
                    e.preventDefault();
                    setMotivators([...motivators, newMotivator.trim()]);
                    setNewMotivator('');
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (newMotivator.trim()) {
                    setMotivators([...motivators, newMotivator.trim()]);
                    setNewMotivator('');
                  }
                }}
              >
                +
              </Button>
            </div>
            {motivators.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {motivators.map((m, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm cursor-pointer hover:bg-red-50"
                    onClick={() => setMotivators(motivators.filter((_, i) => i !== idx))}
                  >
                    {m} ×
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Objections */}
          <div className="space-y-2">
            <Label className="text-slate-700">Objeções Reais (opcional)</Label>
            <div className="flex gap-2">
              <Input
                value={newObjection}
                onChange={(e) => setNewObjection(e.target.value)}
                placeholder="Ex: Preço alto"
                className="h-12 rounded-xl"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newObjection.trim()) {
                    e.preventDefault();
                    setObjections([...objections, newObjection.trim()]);
                    setNewObjection('');
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (newObjection.trim()) {
                    setObjections([...objections, newObjection.trim()]);
                    setNewObjection('');
                  }
                }}
              >
                +
              </Button>
            </div>
            {objections.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {objections.map((o, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm cursor-pointer hover:bg-red-50"
                    onClick={() => setObjections(objections.filter((_, i) => i !== idx))}
                  >
                    {o} ×
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t">
        <Button
          onClick={handleSubmit}
          disabled={!isValid || loading}
          className="w-full h-14 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 rounded-xl text-lg font-semibold disabled:opacity-50 shadow-lg shadow-orange-500/30 glow-orange"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Gerar Perfil e IA
            </>
          )}
        </Button>
      </div>
    </div>
  );
}