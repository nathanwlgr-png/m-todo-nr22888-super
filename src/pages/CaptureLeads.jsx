import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
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
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { calculateLeadScore } from '@/components/LeadScoringEngine';
import { toast } from 'sonner';

export default function CaptureLeads() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    company: '',
    city: '',
    source: 'formulario_web',
    interest: '',
    company_size: '',
    budget_range: '',
    urgency: '',
    notes: ''
  });

  const [calculatedScore, setCalculatedScore] = useState(null);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const score = calculateLeadScore(data);
      return base44.entities.Lead.create({
        ...data,
        lead_score: score,
        status: 'novo'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['leads']);
      toast.success('Lead cadastrado!');
      navigate(createPageUrl('Leads'));
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.full_name) {
      toast.error('Nome é obrigatório');
      return;
    }
    createMutation.mutate(formData);
  };

  const previewScore = () => {
    const score = calculateLeadScore(formData);
    setCalculatedScore(score);
  };

  React.useEffect(() => {
    if (formData.company_size || formData.budget_range || formData.urgency) {
      previewScore();
    }
  }, [formData.company_size, formData.budget_range, formData.urgency]);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-gradient-to-br from-purple-600 to-indigo-600 px-4 pt-4 pb-16 rounded-b-[2rem]">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-white">Novo Lead</h1>
            <p className="text-sm text-purple-100">Preencha os dados para capturar</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Score Preview */}
          {calculatedScore !== null && (
            <Card className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                  {calculatedScore}
                </div>
                <div>
                  <p className="text-xs font-semibold text-purple-600 mb-1">
                    <Sparkles className="w-3 h-3 inline mr-1" />
                    Score Calculado
                  </p>
                  <p className="text-sm text-slate-700">
                    Lead {calculatedScore >= 70 ? 'Quente' : calculatedScore >= 40 ? 'Morno' : 'Frio'}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Dados Básicos */}
          <Card className="p-4">
            <h3 className="font-semibold text-slate-800 mb-3">Dados Básicos</h3>
            <div className="space-y-3">
              <div>
                <Label>Nome Completo *</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="João Silva"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="joao@email.com"
                  />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="5511999999999"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Empresa</Label>
                  <Input
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Clínica ABC"
                  />
                </div>
                <div>
                  <Label>Cidade</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="São Paulo"
                  />
                </div>
              </div>

              <div>
                <Label>Fonte *</Label>
                <Select value={formData.source} onValueChange={(v) => setFormData({ ...formData, source: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formulario_web">Formulário Web</SelectItem>
                    <SelectItem value="importacao_manual">Importação Manual</SelectItem>
                    <SelectItem value="indicacao">Indicação</SelectItem>
                    <SelectItem value="evento">Evento</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Qualificação */}
          <Card className="p-4">
            <h3 className="font-semibold text-slate-800 mb-3">Qualificação (afeta score)</h3>
            <div className="space-y-3">
              <div>
                <Label>Interesse/Produto</Label>
                <Input
                  value={formData.interest}
                  onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                  placeholder="Analisador Hematológico"
                />
              </div>

              <div>
                <Label>Tamanho da Empresa</Label>
                <Select value={formData.company_size} onValueChange={(v) => setFormData({ ...formData, company_size: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1-10 funcionários</SelectItem>
                    <SelectItem value="11-50">11-50 funcionários</SelectItem>
                    <SelectItem value="51-200">51-200 funcionários</SelectItem>
                    <SelectItem value="200+">200+ funcionários</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Faixa de Orçamento</Label>
                <Select value={formData.budget_range} onValueChange={(v) => setFormData({ ...formData, budget_range: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ate_50k">Até R$ 50k</SelectItem>
                    <SelectItem value="50k_100k">R$ 50k - 100k</SelectItem>
                    <SelectItem value="100k_200k">R$ 100k - 200k</SelectItem>
                    <SelectItem value="200k+">R$ 200k+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Urgência</Label>
                <Select value={formData.urgency} onValueChange={(v) => setFormData({ ...formData, urgency: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="imediata">Imediata</SelectItem>
                    <SelectItem value="1_3_meses">1-3 meses</SelectItem>
                    <SelectItem value="3_6_meses">3-6 meses</SelectItem>
                    <SelectItem value="6_meses+">6+ meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Notas */}
          <Card className="p-4">
            <h3 className="font-semibold text-slate-800 mb-3">Observações</h3>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas sobre o lead..."
              rows={4}
            />
          </Card>

          {/* Submit */}
          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full h-14 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            {createMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Cadastrar Lead'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}