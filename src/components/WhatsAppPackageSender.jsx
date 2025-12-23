import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, FileText, Image, Video, Table, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function WhatsAppPackageSender({ client, equipment }) {
  const [selectedItems, setSelectedItems] = useState({
    proposta: true,
    contrato: false,
    tabela_roi: true,
    tabela_santander: false,
    foto: true,
    video: false,
    notas: true
  });
  const [customMessage, setCustomMessage] = useState('');
  const [sending, setSending] = useState(false);

  const { data: documents = [] } = useQuery({
    queryKey: ['client-documents', client.id],
    queryFn: () => base44.entities.ClientDocument.filter({ client_id: client.id }),
  });

  const { data: tables = [] } = useQuery({
    queryKey: ['financial-tables'],
    queryFn: () => base44.entities.FinancialTable.list(),
  });

  const { data: equipmentMaterials = [] } = useQuery({
    queryKey: ['equipment-materials'],
    queryFn: () => base44.entities.EquipmentMaterial.list(),
  });

  const propostas = documents.filter(d => d.type === 'proposta');
  const contratos = documents.filter(d => d.type === 'contrato');
  const tabelaROI = tables.find(t => t.table_type === 'retorno_financeiro');
  const tabelaSantander = tables.find(t => t.table_type === 'simulacao_santander');
  
  const equipmentMaterial = equipmentMaterials.find(m => 
    equipment && m.equipment_name.toLowerCase().includes(equipment.name.toLowerCase())
  );

  const toggleItem = (item) => {
    setSelectedItems(prev => ({ ...prev, [item]: !prev[item] }));
  };

  const sendPackage = async () => {
    if (!client.phone) {
      toast.error('Cliente não tem WhatsApp cadastrado');
      return;
    }

    setSending(true);
    try {
      let message = customMessage || `Olá ${client.first_name}! 👋\n\nSegue o material sobre o ${equipment?.name || 'equipamento'}:\n\n`;

      if (selectedItems.proposta && propostas.length > 0) {
        message += `📄 Proposta Comercial\n`;
      }
      if (selectedItems.contrato && contratos.length > 0) {
        message += `📋 Contrato\n`;
      }
      if (selectedItems.tabela_roi && tabelaROI) {
        message += `📊 Tabela de Retorno Financeiro\n`;
      }
      if (selectedItems.tabela_santander && tabelaSantander) {
        message += `💳 Simulação Santander\n`;
      }
      if (selectedItems.foto && equipmentMaterial?.image_urls?.[0]) {
        message += `📸 Foto do equipamento\n`;
      }
      if (selectedItems.video && equipmentMaterial?.video_url) {
        message += `🎥 Vídeo demonstrativo\n`;
      }

      message += `\nQualquer dúvida, estou à disposição!`;

      // Copiar mensagem
      navigator.clipboard.writeText(message);

      // Abrir WhatsApp
      const whatsappUrl = `https://wa.me/${client.phone}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');

      toast.success('Mensagem copiada! Cole os arquivos manualmente no WhatsApp');

    } catch (error) {
      toast.error('Erro ao enviar');
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
      <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-green-600" />
        Enviar Pacote Completo - WhatsApp
      </h3>

      <div className="space-y-3">
        {/* Item Selection */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-700">Selecione os itens:</p>

          {propostas.length > 0 && (
            <label className="flex items-start gap-3 p-3 bg-white rounded-lg border cursor-pointer hover:bg-slate-50">
              <Checkbox
                checked={selectedItems.proposta}
                onCheckedChange={() => toggleItem('proposta')}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span className="font-semibold text-sm">Proposta Comercial</span>
                </div>
                <p className="text-xs text-slate-600 mt-1">{propostas[0].title}</p>
              </div>
            </label>
          )}

          {contratos.length > 0 && (
            <label className="flex items-start gap-3 p-3 bg-white rounded-lg border cursor-pointer hover:bg-slate-50">
              <Checkbox
                checked={selectedItems.contrato}
                onCheckedChange={() => toggleItem('contrato')}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-600" />
                  <span className="font-semibold text-sm">Contrato</span>
                </div>
                <p className="text-xs text-slate-600 mt-1">{contratos[0].title}</p>
              </div>
            </label>
          )}

          {tabelaROI && (
            <label className="flex items-start gap-3 p-3 bg-white rounded-lg border cursor-pointer hover:bg-slate-50">
              <Checkbox
                checked={selectedItems.tabela_roi}
                onCheckedChange={() => toggleItem('tabela_roi')}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Table className="w-4 h-4 text-green-600" />
                  <span className="font-semibold text-sm">Tabela Retorno Financeiro</span>
                </div>
                <p className="text-xs text-slate-600 mt-1">{tabelaROI.table_name}</p>
              </div>
            </label>
          )}

          {tabelaSantander && (
            <label className="flex items-start gap-3 p-3 bg-white rounded-lg border cursor-pointer hover:bg-slate-50">
              <Checkbox
                checked={selectedItems.tabela_santander}
                onCheckedChange={() => toggleItem('tabela_santander')}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Table className="w-4 h-4 text-orange-600" />
                  <span className="font-semibold text-sm">Simulação Santander</span>
                </div>
                <p className="text-xs text-slate-600 mt-1">{tabelaSantander.table_name}</p>
              </div>
            </label>
          )}

          {equipmentMaterial?.image_urls?.[0] && (
            <label className="flex items-start gap-3 p-3 bg-white rounded-lg border cursor-pointer hover:bg-slate-50">
              <Checkbox
                checked={selectedItems.foto}
                onCheckedChange={() => toggleItem('foto')}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Image className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-sm">Foto do Equipamento</span>
                </div>
              </div>
            </label>
          )}

          {equipmentMaterial?.video_url && (
            <label className="flex items-start gap-3 p-3 bg-white rounded-lg border cursor-pointer hover:bg-slate-50">
              <Checkbox
                checked={selectedItems.video}
                onCheckedChange={() => toggleItem('video')}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-red-600" />
                  <span className="font-semibold text-sm">Vídeo Demonstrativo</span>
                </div>
              </div>
            </label>
          )}
        </div>

        {/* Custom Message */}
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-2">Mensagem (opcional):</p>
          <Textarea
            placeholder="Digite uma mensagem personalizada ou deixe em branco para usar mensagem padrão..."
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            rows={3}
            className="text-sm"
          />
        </div>

        {/* Send Button */}
        <Button
          onClick={sendPackage}
          disabled={sending}
          className="w-full bg-green-600 hover:bg-green-700 h-12"
        >
          {sending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Send className="w-5 h-5 mr-2" />
              Enviar para WhatsApp
            </>
          )}
        </Button>

        <p className="text-xs text-center text-slate-600">
          Mensagem será copiada e WhatsApp aberto. Cole os arquivos manualmente.
        </p>
      </div>
    </Card>
  );
}