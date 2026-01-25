import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { Loader2, Download, MapPin, Store, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const ESTADOS_BR = [
  'São Paulo', 'Rio de Janeiro', 'Minas Gerais', 'Bahia', 'Paraná', 
  'Rio Grande do Sul', 'Pernambuco', 'Ceará', 'Pará', 'Santa Catarina',
  'Maranhão', 'Goiás', 'Paraíba', 'Espírito Santo', 'Amazonas',
  'Mato Grosso', 'Rio Grande do Norte', 'Piauí', 'Alagoas', 'Distrito Federal',
  'Mato Grosso do Sul', 'Sergipe', 'Rondônia', 'Tocantins', 'Acre',
  'Amapá', 'Roraima'
];

export default function PartyStoresProspecting() {
  const [selectedState, setSelectedState] = useState('São Paulo');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState([]);

  const runProspecting = async () => {
    setLoading(true);
    setProgress([]);
    
    try {
      setProgress(prev => [...prev, `🔍 Buscando lojas de festas em ${selectedState}...`]);
      
      const response = await base44.functions.invoke('prospectPartyStores', {
        state: selectedState,
        category: 'Lojas de festas e mercados que vendem brinquedos com balinha'
      });

      setProgress(prev => [...prev, `✓ Busca concluída!`]);
      setProgress(prev => [...prev, `📄 Gerando PDF com análise de gatilhos...`]);

      // Criar blob e download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prospeccao_${selectedState.replace(/\s/g, '_')}_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      setProgress(prev => [...prev, `✅ PDF baixado com sucesso!`]);
      toast.success('Prospecção concluída! PDF baixado.');
      
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao fazer prospecção');
      setProgress(prev => [...prev, `❌ Erro: ${error.message}`]);
    } finally {
      setLoading(false);
    }
  };

  const runFullBrazil = async () => {
    setLoading(true);
    setProgress([]);
    
    try {
      setProgress(prev => [...prev, `🇧🇷 Iniciando prospecção NACIONAL...`]);
      
      for (const estado of ESTADOS_BR) {
        setProgress(prev => [...prev, `📍 Processando ${estado}...`]);
        
        const response = await base44.functions.invoke('prospectPartyStores', {
          state: estado,
          category: 'Lojas de festas e mercados que vendem brinquedos com balinha'
        });

        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prospeccao_${estado.replace(/\s/g, '_')}_${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();

        setProgress(prev => [...prev, `✅ ${estado} concluído!`]);
        
        // Delay entre estados para não estourar rate limit
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      setProgress(prev => [...prev, `🎉 PROSPECÇÃO NACIONAL CONCLUÍDA!`]);
      toast.success('Todos os estados processados!');
      
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro na prospecção nacional');
      setProgress(prev => [...prev, `❌ Erro: ${error.message}`]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-600 shadow-2xl">
            <Store className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white">
            Prospecção Inteligente
          </h1>
          <p className="text-slate-300 text-lg">
            Lojas de Festas & Mercados | Brinquedos com Balinha
          </p>
        </div>

        {/* Seletor de Estado */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Selecione o Estado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger className="h-14 text-lg bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS_BR.map(estado => (
                  <SelectItem key={estado} value={estado}>
                    {estado}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                onClick={runProspecting}
                disabled={loading}
                className="h-14 bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 text-lg"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Download className="w-5 h-5 mr-2" />
                )}
                Prospectar {selectedState}
              </Button>

              <Button
                onClick={runFullBrazil}
                disabled={loading}
                variant="outline"
                className="h-14 bg-white/10 text-white border-white/30 hover:bg-white/20 text-lg"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <TrendingUp className="w-5 h-5 mr-2" />
                )}
                BRASIL INTEIRO (27 PDFs)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* O que será gerado */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="text-white">📋 O que será gerado:</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-white">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                <div>
                  <p className="font-semibold">Dados Completos</p>
                  <p className="text-sm text-slate-300">Nome, CNPJ, proprietário, telefone, endereço</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                <div>
                  <p className="font-semibold">3 Gatilhos de Persuasão</p>
                  <p className="text-sm text-slate-300">Personalizados por perfil + mensagens prontas</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
                <div>
                  <p className="font-semibold">Abordagem Estratégica</p>
                  <p className="text-sm text-slate-300">Como abordar + melhor horário para contato</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-sm font-bold flex-shrink-0">4</div>
                <div>
                  <p className="font-semibold">PDF Pronto para WhatsApp</p>
                  <p className="text-sm text-slate-300">Formatado e otimizado para compartilhamento</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Log */}
        {progress.length > 0 && (
          <Card className="bg-black/50 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white">📊 Progresso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {progress.map((msg, idx) => (
                  <div key={idx} className="text-sm text-slate-300 font-mono">
                    {msg}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}