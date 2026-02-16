import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Zap, Mail, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function BulkContentGenerator() {
  const [segmentId, setSegmentId] = useState('');
  const [contentType, setContentType] = useState('email_prospeccao');
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);

  const { data: segments = [] } = useQuery({
    queryKey: ['segments'],
    queryFn: () => base44.entities.ClientSegment?.list().catch(() => []),
  });

  const generateBulkMutation = useMutation({
    mutationFn: async () => {
      const segment = segments.find(s => s.id === segmentId);
      if (!segment) throw new Error('Segmento não encontrado');

      const clientIds = segment.client_ids || [];
      const generated = [];

      for (let i = 0; i < clientIds.length; i++) {
        try {
          const response = await base44.functions.invoke('generatePersonalizedContent', {
            contact_id: clientIds[i],
            content_type: contentType
          });
          
          generated.push({
            contact_id: clientIds[i],
            content: response.data.content,
            subject: response.data.content.subject
          });

          setProgress(((i + 1) / clientIds.length) * 100);
        } catch (error) {
          console.error(`Error generating for ${clientIds[i]}:`, error);
        }
      }

      return generated;
    },
    onSuccess: (data) => {
      setResults(data);
      toast.success(`${data.length} conteúdos gerados!`);
    }
  });

  const downloadCSV = () => {
    const csv = results.map(r => 
      `"${r.subject || ''}","${r.content.content?.replace(/"/g, '""')}"`
    ).join('\n');
    
    const blob = new Blob([`"Assunto","Conteúdo"\n${csv}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conteudo_${contentType}_${new Date().getTime()}.csv`;
    a.click();
  };

  return (
    <Card className="border-l-4 border-l-cyan-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-cyan-600" />
          Geração em Massa de Conteúdo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-700 mb-2 block">Segmento</label>
          <Select value={segmentId} onValueChange={setSegmentId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um segmento..." />
            </SelectTrigger>
            <SelectContent>
              {segments.map(seg => (
                <SelectItem key={seg.id} value={seg.id}>
                  {seg.segment_name} ({seg.client_count || 0} clientes)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 mb-2 block">Tipo de Conteúdo</label>
          <Select value={contentType} onValueChange={setContentType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email_prospeccao">Email Prospecção</SelectItem>
              <SelectItem value="email_followup">Email Follow-up</SelectItem>
              <SelectItem value="whatsapp_sequence">Sequência WhatsApp</SelectItem>
              <SelectItem value="social_linkedin">Post LinkedIn</SelectItem>
              <SelectItem value="social_instagram">Story Instagram</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={() => generateBulkMutation.mutate()}
          disabled={!segmentId || generateBulkMutation.isPending}
          className="w-full bg-cyan-600"
        >
          {generateBulkMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Gerando... {Math.round(progress)}%
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar para {segments.find(s => s.id === segmentId)?.client_count || 0} Contatos
            </>
          )}
        </Button>

        {generateBulkMutation.isPending && (
          <Progress value={progress} className="h-2" />
        )}

        {results.length > 0 && (
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <Badge className="bg-green-500">{results.length} gerados</Badge>
              <Button size="sm" variant="outline" onClick={downloadCSV}>
                <Download className="w-3 h-3 mr-1" />
                Baixar CSV
              </Button>
            </div>
            <p className="text-xs text-slate-600">
              Conteúdos salvos! Use o CSV para importar em ferramentas de email marketing.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}