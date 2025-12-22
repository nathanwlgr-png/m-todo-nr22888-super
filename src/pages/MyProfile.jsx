import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Sparkles, Plus, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function MyProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const [formData, setFormData] = useState({
    communication_style: '',
    personality_traits: [],
    sales_approach: '',
    signature_phrases: []
  });

  const [newTrait, setNewTrait] = useState('');
  const [newPhrase, setNewPhrase] = useState('');

  React.useEffect(() => {
    if (user) {
      setFormData({
        communication_style: user.communication_style || '',
        personality_traits: user.personality_traits || [],
        sales_approach: user.sales_approach || '',
        signature_phrases: user.signature_phrases || []
      });
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['current-user']);
      toast.success('Perfil atualizado!');
    }
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const addTrait = () => {
    if (newTrait.trim()) {
      setFormData({
        ...formData,
        personality_traits: [...formData.personality_traits, newTrait.trim()]
      });
      setNewTrait('');
    }
  };

  const removeTrait = (index) => {
    setFormData({
      ...formData,
      personality_traits: formData.personality_traits.filter((_, i) => i !== index)
    });
  };

  const addPhrase = () => {
    if (newPhrase.trim()) {
      setFormData({
        ...formData,
        signature_phrases: [...formData.signature_phrases, newPhrase.trim()]
      });
      setNewPhrase('');
    }
  };

  const removePhrase = (index) => {
    setFormData({
      ...formData,
      signature_phrases: formData.signature_phrases.filter((_, i) => i !== index)
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-gradient-to-br from-purple-600 to-indigo-600 px-4 pt-4 pb-16 rounded-b-[2rem]">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-white">Meu Perfil de Vendedor</h1>
            <p className="text-sm text-purple-100">Personalize a IA com seu estilo</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-8 space-y-4">
        {/* Info Card */}
        <Card className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-purple-600 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800 mb-1">IA Personalizada</p>
              <p className="text-sm text-slate-600">
                Configure seu estilo para que a IA gere mensagens e sugestões com sua personalidade
              </p>
            </div>
          </div>
        </Card>

        {/* Communication Style */}
        <Card className="p-4">
          <h3 className="font-semibold text-slate-800 mb-3">Estilo de Comunicação</h3>
          <Textarea
            value={formData.communication_style}
            onChange={(e) => setFormData({ ...formData, communication_style: e.target.value })}
            placeholder="Ex: Sou direto ao ponto, mas sempre amigável. Gosto de usar analogias do dia a dia para explicar produtos técnicos."
            rows={3}
          />
        </Card>

        {/* Personality Traits */}
        <Card className="p-4">
          <h3 className="font-semibold text-slate-800 mb-3">Características da Minha Personalidade</h3>
          <p className="text-sm text-slate-500 mb-3">
            Ex: empático, objetivo, entusiasmado, consultivo, técnico
          </p>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {formData.personality_traits.map((trait, index) => (
              <Badge key={index} className="bg-purple-100 text-purple-700 pr-1">
                {trait}
                <button
                  onClick={() => removeTrait(index)}
                  className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              value={newTrait}
              onChange={(e) => setNewTrait(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTrait()}
              placeholder="Adicionar característica"
            />
            <Button onClick={addTrait} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </Card>

        {/* Sales Approach */}
        <Card className="p-4">
          <h3 className="font-semibold text-slate-800 mb-3">Minha Abordagem de Vendas</h3>
          <Textarea
            value={formData.sales_approach}
            onChange={(e) => setFormData({ ...formData, sales_approach: e.target.value })}
            placeholder="Ex: Prefiro construir relacionamento antes de vender. Sempre faço perguntas abertas para entender a dor real do cliente. Uso SPIN selling e foco em ROI."
            rows={4}
          />
        </Card>

        {/* Signature Phrases */}
        <Card className="p-4">
          <h3 className="font-semibold text-slate-800 mb-3">Frases que Eu Costumo Usar</h3>
          <p className="text-sm text-slate-500 mb-3">
            Expressões características do seu jeito de falar
          </p>
          
          <div className="space-y-2 mb-3">
            {formData.signature_phrases.map((phrase, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                <p className="flex-1 text-sm text-slate-700">"{phrase}"</p>
                <button
                  onClick={() => removePhrase(index)}
                  className="p-1 hover:bg-slate-200 rounded"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              value={newPhrase}
              onChange={(e) => setNewPhrase(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addPhrase()}
              placeholder='Ex: "Vou te falar uma coisa..."'
            />
            <Button onClick={addPhrase} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </Card>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="w-full h-14 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
        >
          {updateMutation.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Salvar Perfil
            </>
          )}
        </Button>

        {/* Examples */}
        <Card className="p-4 bg-slate-100">
          <h3 className="font-semibold text-slate-800 mb-2 text-sm">💡 Dica</h3>
          <p className="text-xs text-slate-600">
            Quanto mais detalhado seu perfil, melhor a IA consegue imitar seu estilo nas mensagens automáticas e sugestões de vendas.
          </p>
        </Card>
      </div>
    </div>
  );
}