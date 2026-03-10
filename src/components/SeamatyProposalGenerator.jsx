import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

/**
 * Gerador de Propostas Seamaty/Compet
 * Baseado no modelo profissional fornecido
 */
export default function SeamatyProposalGenerator() {
  const [generating, setGenerating] = useState(false);
  const [params, setParams] = useState({
    client_name: '',
    equipment: 'QT3',
    price_cash: 30000,
    price_financed: 30000,
    installments: 36,
    price_card: 32900,
    card_installments: 5,
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    seller_name: 'Nathan',
    seller_phone: '(14) 991676428'
  });
  const [lastProposal, setLastProposal] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const equipmentOptions = {
    QT3: {
      name: 'QT3 - Analisador Químico Veterinário',
      description: 'Totalmente Automático, preciso e confiável'
    },
    'SMT-120VP': {
      name: 'SMT-120VP - Analisador Bioquímico',
      description: 'Análises rápidas e precisas'
    },
    VG1: {
      name: 'VG1 - Analisador de Gases e Eletrólitos',
      description: 'POCT de alta performance'
    },
    VG2: {
      name: 'VG2 - Gases Sanguíneos, Eletrólitos e Imunologia',
      description: 'Solução completa all-in-one'
    },
    VI1: {
      name: 'VI1 - Analisador de Imunofluorescência',
      description: 'Resultados rápidos e confiáveis'
    },
    'VBC-30': {
      name: 'VBC-30 - Analisador Hematológico 3 Partes',
      description: 'Contagem celular precisa'
    },
    'VBC-50A': {
      name: 'VBC-50A - Analisador Hematológico 5 Partes',
      description: 'Diferencial completo'
    },
    'LAB-3DX': {
      name: 'LAB-3DX - Sistema All-in-One',
      description: 'Gases + Química + Imunologia'
    }
  };

  const generateProposal = async () => {
    setGenerating(true);
    try {
      const proposal = {
        client: params.client_name,
        equipment: equipmentOptions[params.equipment],
        pricing: {
          cash: params.price_cash,
          financed: {
            total: params.price_financed,
            installments: params.installments,
            bank: 'Santander'
          },
          card: {
            total: params.price_card,
            installments: params.card_installments
          }
        },
        seller: {
          name: params.seller_name,
          phone: params.seller_phone
        },
        valid_until: params.valid_until,
        generated_at: new Date().toISOString()
      };

      setLastProposal(proposal);
      toast.success('Proposta gerada!', {
        description: `${params.equipment} para ${params.client_name}`
      });

    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao gerar proposta');
    } finally {
      setGenerating(false);
    }
  };

  const exportToPDF = () => {
    if (!lastProposal) return;

    const doc = new jsPDF();
    const orange = [255, 140, 0];
    const gray = [60, 60, 60];

    // Header com fundo laranja
    doc.setFillColor(...orange);
    doc.rect(0, 0, 210, 50, 'F');
    
    doc.setFontSize(32);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('seamaty', 105, 25, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text('SEAMATY BRASIL', 105, 32, { align: 'center' });
    doc.text('Seamaty Brasil', 105, 38, { align: 'center' });

    // Título
    doc.setTextColor(...gray);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('PROPOSTA COMERCIAL', 20, 70);

    // Cliente
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Cliente: ${lastProposal.client}`, 20, 85);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 92);

    // Equipamento
    doc.setFillColor(240, 240, 240);
    doc.rect(15, 100, 180, 40, 'F');
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...orange);
    doc.text(lastProposal.equipment.name, 20, 110);
    
    doc.setFontSize(11);
    doc.setTextColor(...gray);
    doc.setFont('helvetica', 'normal');
    doc.text(lastProposal.equipment.description, 20, 118);

    // Valores
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...orange);
    doc.text('PRODUTOS/VALORES', 20, 155);

    doc.setFontSize(13);
    doc.setTextColor(...gray);
    doc.setFont('helvetica', 'bold');
    
    let y = 170;
    doc.text(`À vista R$${lastProposal.pricing.cash.toLocaleString('pt-BR')}`, 20, y);
    
    y += 10;
    doc.text(
      `FINANCIAMENTO R$${lastProposal.pricing.financed.total.toLocaleString('pt-BR')} EM ATÉ ${lastProposal.pricing.financed.installments}X PELO ${lastProposal.pricing.financed.bank.toUpperCase()}`,
      20, y
    );
    
    y += 10;
    doc.text(
      `${lastProposal.pricing.card.installments}X NO CARTÃO R$${lastProposal.pricing.card.total.toLocaleString('pt-BR')}`,
      20, y
    );

    // Contato
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...orange);
    doc.text(
      `${lastProposal.seller.name} – Consultor Técnico Comercial`,
      105, 250,
      { align: 'center' }
    );
    doc.text(lastProposal.seller.phone, 105, 257, { align: 'center' });

    // Validade
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text(
      `*Proposta válida até ${new Date(lastProposal.valid_until).toLocaleDateString('pt-BR')}`,
      105, 270,
      { align: 'center' }
    );

    // Logo Compet (texto)
    doc.setFillColor(0, 51, 102);
    doc.rect(85, 280, 40, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Seamaty Brasil', 105, 286, { align: 'center' });

    doc.save(`Proposta-${params.equipment}-${params.client_name || 'Cliente'}.pdf`);
    toast.success('PDF exportado!');
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-600 to-orange-500 flex items-center justify-center">
          <FileText className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-800">Gerador Proposta Seamaty</h2>
          <p className="text-sm text-slate-600">Modelo profissional Seamaty Brasil</p>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="text-xs font-semibold text-slate-700 mb-1 block">Cliente</label>
          <Input
            placeholder="Nome do cliente ou clínica"
            value={params.client_name}
            onChange={(e) => setParams({ ...params, client_name: e.target.value })}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 mb-1 block">Equipamento</label>
          <Select value={params.equipment} onValueChange={(v) => setParams({ ...params, equipment: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(equipmentOptions).map(([key, eq]) => (
                <SelectItem key={key} value={key}>
                  {eq.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">Preço À Vista</label>
            <Input
              type="number"
              value={params.price_cash}
              onChange={(e) => setParams({ ...params, price_cash: parseInt(e.target.value) })}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">Parcelas</label>
            <Input
              type="number"
              value={params.installments}
              onChange={(e) => setParams({ ...params, installments: parseInt(e.target.value) })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">Cartão (Valor)</label>
            <Input
              type="number"
              value={params.price_card}
              onChange={(e) => setParams({ ...params, price_card: parseInt(e.target.value) })}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">Cartão (Parcelas)</label>
            <Input
              type="number"
              value={params.card_installments}
              onChange={(e) => setParams({ ...params, card_installments: parseInt(e.target.value) })}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 mb-1 block">Válido Até</label>
          <Input
            type="date"
            value={params.valid_until}
            onChange={(e) => setParams({ ...params, valid_until: e.target.value })}
          />
        </div>
      </div>

      {/* Generate */}
      <Button
        onClick={generateProposal}
        disabled={generating || !params.client_name}
        className="w-full h-12 bg-orange-600 hover:bg-orange-700 mb-4"
      >
        {generating ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Gerando...
          </>
        ) : (
          <>
            <FileText className="w-5 h-5 mr-2" />
            Gerar Proposta
          </>
        )}
      </Button>

      {/* Export */}
      {lastProposal && (
        <div className="p-4 bg-white rounded-lg border-2 border-orange-200">
          <p className="text-sm font-semibold text-slate-800 mb-2">
            Proposta: {lastProposal.equipment.name}
          </p>
          <p className="text-xs text-slate-600 mb-3">
            Cliente: {lastProposal.client} • Válido até {new Date(lastProposal.valid_until).toLocaleDateString('pt-BR')}
          </p>
          <Button onClick={exportToPDF} className="w-full bg-orange-600 hover:bg-orange-700">
            <Download className="w-4 h-4 mr-2" />
            Baixar PDF
          </Button>
        </div>
      )}
    </Card>
  );
}