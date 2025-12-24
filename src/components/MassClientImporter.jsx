import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from '@/api/base44Client';
import { Loader2, Upload, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function MassClientImporter() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState('');
  const [result, setResult] = useState(null);

  const importClients = async () => {
    setLoading(true);
    try {
      const prompt = `Você é um especialista em extração de dados. Extraia TODOS os clientes veterinários desta lista:

${data}

**CIDADES ALVO:**
- Assis
- Presidente Prudente
- Tupã
- Adamantina
- Bauru
- Araçatuba
- Ourinhos
- Dracena
- Lins

**TAREFA:**
Extraia e estruture TODOS os clientes veterinários encontrados. Para cada um:
- Nome completo
- Clínica/Hospital (se mencionado)
- Cidade
- Telefone/WhatsApp (se disponível)
- Email (se disponível)
- CNPJ (se disponível)
- Especialidade (se mencionada)

Retorne array com TODOS os clientes encontrados, sem limites.`;

      const extracted = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            clients: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  first_name: { type: "string" },
                  clinic_name: { type: "string" },
                  city: { type: "string" },
                  phone: { type: "string" },
                  email: { type: "string" },
                  cnpj: { type: "string" },
                  specialties: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });

      // Cadastrar TODOS sem limite
      const created = [];
      for (const client of extracted.clients) {
        try {
          const newClient = await base44.entities.Client.create({
            first_name: client.first_name,
            clinic_name: client.clinic_name || '',
            city: client.city,
            phone: client.phone || '',
            email: client.email || '',
            cnpj: client.cnpj || '',
            status: 'morno',
            purchase_score: 50,
            client_type: 'clinica_pequena',
            decision_role: 'proprietario',
            lead_source: 'importacao_planilha',
            notes: `Importado em ${new Date().toLocaleDateString('pt-BR')}\nEspecialidades: ${client.specialties?.join(', ') || 'N/A'}`
          });
          created.push(newClient);
        } catch (error) {
          console.error('Erro ao criar cliente:', client.first_name, error);
        }
      }

      setResult({ total: extracted.clients.length, created: created.length });
      toast.success(`${created.length} clientes importados!`);
    } catch (error) {
      console.error(error);
      toast.error('Erro na importação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center">
          <Upload className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">Importação em Massa</h3>
          <p className="text-xs text-slate-600">Sem limites - Todas as cidades</p>
        </div>
      </div>

      <Textarea
        value={data}
        onChange={(e) => setData(e.target.value)}
        placeholder="Cole aqui a lista de clientes (planilha, texto, qualquer formato)..."
        rows={8}
        className="mb-3"
      />

      <Button
        onClick={importClients}
        disabled={loading || !data}
        className="w-full bg-green-600 hover:bg-green-700"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Importando...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            Importar Todos os Clientes
          </>
        )}
      </Button>

      {result && (
        <div className="mt-3 p-3 bg-white rounded-lg border-2 border-green-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <p className="font-semibold text-slate-800">
              {result.created} de {result.total} clientes importados
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}