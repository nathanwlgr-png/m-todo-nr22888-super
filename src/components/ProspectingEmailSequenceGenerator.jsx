import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function ProspectingEmailSequenceGenerator({ leadId }) {
  const [sequence, setSequence] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);

  const generateSequence = async () => {
    if (!leadId) {
      toast.error('Selecione um lead');
      return;
    }

    setLoading(true);
    try {
      const res = await base44.functions.invoke('generateProspectingEmailSequence', {
        lead_id: leadId
      });

      if (res.data) {
        setSequence(res.data);
        toast.success('Sequência gerada!');
      }
    } catch (error) {
      toast.error('Erro ao gerar sequência');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast.success('Copiado!');
  };

  if (!leadId) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Mail className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Selecione um lead para gerar sequência</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={generateSequence}
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
        Gerar Sequência de Emails
      </Button>

      {sequence && (
        <div className="space-y-3">
          {sequence.emails && sequence.emails.map((email, i) => (
            <Card key={i} className="border-blue-200">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    📧 Email {i + 1} - Dia {email.day}
                  </CardTitle>
                  <Badge className="bg-blue-100 text-blue-700 text-[10px]">
                    {email.type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Subject */}
                <div>
                  <p className="text-[10px] text-slate-600 font-semibold mb-1">Assunto:</p>
                  <div className="bg-slate-50 p-2 rounded text-xs text-slate-800 flex items-center justify-between">
                    <span>{email.subject}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0"
                      onClick={() => copyToClipboard(email.subject, `subject-${i}`)}
                    >
                      {copied === `subject-${i}` ? (
                        <Check className="w-3 h-3 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Body */}
                <div>
                  <p className="text-[10px] text-slate-600 font-semibold mb-1">Corpo do Email:</p>
                  <div className="bg-slate-50 p-2 rounded text-xs text-slate-800 max-h-40 overflow-y-auto flex items-start justify-between">
                    <span className="flex-1 whitespace-pre-wrap">{email.body}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0 shrink-0 ml-2"
                      onClick={() => copyToClipboard(email.body, `body-${i}`)}
                    >
                      {copied === `body-${i}` ? (
                        <Check className="w-3 h-3 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Tips */}
                {email.tips && (
                  <div className="bg-blue-50 p-2 rounded border border-blue-200">
                    <p className="text-[10px] text-blue-700 font-semibold mb-1">💡 Dicas:</p>
                    <p className="text-[10px] text-blue-600">{email.tips}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {sequence.summary && (
            <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
              <CardContent className="p-3">
                <p className="text-[10px] text-indigo-600 font-semibold mb-1">📊 RESUMO DA SEQUÊNCIA</p>
                <p className="text-xs text-indigo-800">{sequence.summary}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}