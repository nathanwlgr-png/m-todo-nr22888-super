import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Instagram, Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function InstagramProfileFinder({ client, onDataFound }) {
  const [searching, setSearching] = useState(false);

  const findSocialMedia = async () => {
    setSearching(true);
    try {
      const searchQuery = `${client.first_name} ${client.clinic_name || ''} ${client.city || ''} veterinário instagram`;
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Busque informações de redes sociais e contato para este cliente veterinário:

DADOS CONHECIDOS:
- Nome: ${client.first_name}
- Clínica: ${client.clinic_name || 'Não informado'}
- Cidade: ${client.city || 'Não informado'}
- CNPJ: ${client.cnpj || 'Não informado'}

BUSQUE:
1. Instagram da clínica/pessoa (@usuario)
2. Email de contato se não tiver
3. CNPJ se tiver nome da clínica mas não tiver CNPJ
4. Análise rápida do perfil Instagram (se encontrar):
   - Frequência de posts
   - Engajamento aproximado
   - Especialidades demonstradas
   - Nível de digitalização (baixo/médio/alto)

Retorne JSON estruturado.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            instagram_handle: { type: "string" },
            email: { type: "string" },
            cnpj: { type: "string" },
            profile_analysis: {
              type: "object",
              properties: {
                post_frequency: { type: "string" },
                engagement_level: { type: "string" },
                specialties: { type: "array", items: { type: "string" } },
                digitalization_level: { type: "string" }
              }
            }
          }
        }
      });

      const updates = {};
      if (result.instagram_handle) updates.instagram_handle = result.instagram_handle;
      if (result.email && !client.email) updates.email = result.email;
      if (result.cnpj && !client.cnpj) updates.cnpj = result.cnpj;
      if (result.profile_analysis) {
        updates.social_media_analysis = JSON.stringify(result.profile_analysis);
      }

      if (Object.keys(updates).length > 0) {
        await base44.entities.Client.update(client.id, updates);
        toast.success('Dados encontrados e salvos!');
        if (onDataFound) onDataFound(updates);
      } else {
        toast.info('Nenhum dado novo encontrado');
      }

    } catch (error) {
      toast.error('Erro ao buscar dados');
    } finally {
      setSearching(false);
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-pink-50 to-fuchsia-50 border-pink-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Instagram className="w-4 h-4 text-pink-600" />
            Buscar Redes Sociais
          </h3>
          <p className="text-xs text-slate-600 mt-1">
            IA encontra Instagram, email e CNPJ automaticamente
          </p>
        </div>
        <Button
          onClick={findSocialMedia}
          disabled={searching}
          size="sm"
          className="bg-pink-600 hover:bg-pink-700"
        >
          {searching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Instagram className="w-4 h-4 mr-1" />
              Buscar
            </>
          )}
        </Button>
      </div>

      {client.instagram_handle && (
        <div className="mt-3 p-2 bg-white rounded-lg text-xs">
          <p className="text-pink-700 font-medium">
            @{client.instagram_handle}
          </p>
          {client.social_media_analysis && (
            <p className="text-slate-600 mt-1">
              {JSON.parse(client.social_media_analysis).digitalization_level} digitalização
            </p>
          )}
        </div>
      )}
    </Card>
  );
}