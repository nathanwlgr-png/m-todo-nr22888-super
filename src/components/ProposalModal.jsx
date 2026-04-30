import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, FileText, Share2 } from 'lucide-react';
import { toast } from 'sonner';

const EQUIPAMENTOS = [
  { id: 'SMT-120VP', nome: 'Analisador Bioquímico Multifuncional SMT-120VP', preco: 23500, preco5x: 25000 },
  { id: 'QT3', nome: 'Analisador Bioquímico QT3', preco: 12900, preco5x: 12900 },
  { id: 'VG1', nome: 'Analisador de Gases e Eletrólitos VG1', preco: 28000, preco5x: 29700 },
  { id: 'VG2', nome: 'Analisador de Imunoensaio Fluorescente VG2', preco: 33000, preco5x: 35000 },
  { id: '3DX', nome: 'Analisador Multifuncional 3DX (hematol. + bioquím. + eletról.)', preco: 55000, preco5x: 58000 },
  { id: 'VBC-50A', nome: 'Analisador Hematológico 5 partes VBC-50A', preco: 36376, preco5x: 38000 },
  { id: 'Vi1', nome: 'Analisador de Imunoensaio Fluorescente Vi1', preco: 8500, preco5x: 9000 },
  { id: 'VQ1', nome: 'Analisador PCR VQ1', preco: 45000, preco5x: 47700 },
  { id: 'Maleta-VG1', nome: 'Maleta de Proteção VG1', preco: 1500, preco5x: 1600 },
];

const TAXA_SANTANDER = 0.02282; // 2,282% ao mês
const PARCELAS = 36;
const CARENCIA_DIAS = 90;

function calcParcela(preco) {
  // PMT formula: P * i / (1 - (1+i)^-n)
  return preco * TAXA_SANTANDER / (1 - Math.pow(1 + TAXA_SANTANDER, -PARCELAS));
}

function formatCurrency(val) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function ProposalModal({ client, open, onOpenChange }) {
  const [equipId, setEquipId] = useState(
    EQUIPAMENTOS.find(e => client?.equipment_interest?.includes(e.id))?.id ||
    EQUIPAMENTOS[0].id
  );

  if (!client) return null;

  const equip = EQUIPAMENTOS.find(e => e.id === equipId);
  const parcela = calcParcela(equip.preco);
  const roi = Math.ceil(parcela / 120); // ~R$120 por exame
  const hoje = new Date();
  const validade = new Date(hoje);
  validade.setDate(validade.getDate() + 30);
  const primeiroVenc = new Date(hoje);
  primeiroVenc.setDate(primeiroVenc.getDate() + CARENCIA_DIAS);

  const proposta = `━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 PROPOSTA COMERCIAL SEAMATY BRASIL
━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 Cliente: ${client.first_name}${client.clinic_name ? `\n🏥 Clínica: ${client.clinic_name}` : ''}${client.city ? `\n📍 Cidade: ${client.city}` : ''}

🔬 EQUIPAMENTO: ${equip.nome}

💰 CONDIÇÕES DE PAGAMENTO:

• À vista: ${formatCurrency(equip.preco)}

• 5x Cartão: ${formatCurrency(equip.preco5x)} (${formatCurrency(equip.preco5x / 5)}/parcela)

• Financiado (Santander):
  ${PARCELAS}x de ${formatCurrency(parcela)}
  Taxa: 2,282% a.m.
  Carência: ${CARENCIA_DIAS} dias para o 1º vencimento
  1º vencimento: ${primeiroVenc.toLocaleDateString('pt-BR')}

📊 ROI ESTIMADO:
  Apenas ${roi} exames/mês cobrem a parcela!
  Economia mensal vs laboratório: R$ 2.000 a R$ 8.000

✅ DIFERENCIAIS SEAMATY:
• 25 meses de garantia (mercado: 12 meses)
• Manutenção vitalícia inclusa
• Bonificação mensal em insumos
• ISO 13485:2016

📅 Validade desta proposta: ${validade.toLocaleDateString('pt-BR')}

📞 Nathan Rosa – Consultor Técnico Seamaty Brasil
(14) 99167-6428

━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  const copiar = () => {
    navigator.clipboard.writeText(proposta);
    toast.success('Proposta copiada!');
  };

  const enviarWhatsApp = () => {
    if (!client.phone) {
      toast.error('Cliente sem número de WhatsApp');
      return;
    }
    const num = client.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(proposta)}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>📋 Gerar Proposta — {client.first_name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Equipamento</label>
            <Select value={equipId} onValueChange={setEquipId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EQUIPAMENTOS.map(e => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.id} — {formatCurrency(e.preco)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-2 gap-3 text-sm">
            <div className="bg-white rounded-lg p-3 text-center shadow-sm">
              <p className="text-xs text-slate-500">À vista</p>
              <p className="font-bold text-slate-800">{formatCurrency(equip.preco)}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center shadow-sm">
              <p className="text-xs text-slate-500">5x Cartão</p>
              <p className="font-bold text-purple-700">{formatCurrency(equip.preco5x / 5)}/parcela</p>
            </div>
            <div className="bg-indigo-50 rounded-lg p-3 text-center shadow-sm">
              <p className="text-xs text-slate-500">36x Santander</p>
              <p className="font-bold text-indigo-700">{formatCurrency(parcela)}/mês</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center shadow-sm">
              <p className="text-xs text-slate-500">ROI (exames/mês)</p>
              <p className="font-bold text-green-700">{roi} exames</p>
            </div>
          </div>

          <pre className="bg-slate-900 text-green-400 text-xs rounded-xl p-4 overflow-x-auto whitespace-pre-wrap">
            {proposta}
          </pre>

          <div className="flex gap-2">
            <Button onClick={copiar} variant="outline" className="flex-1 gap-2">
              <Copy className="w-4 h-4" />
              Copiar
            </Button>
            <Button onClick={enviarWhatsApp} className="flex-1 bg-green-600 hover:bg-green-700 gap-2">
              <Share2 className="w-4 h-4" />
              WhatsApp
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}