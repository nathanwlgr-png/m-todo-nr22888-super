import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Download, Loader2, X } from 'lucide-react';
import { jsPDF } from 'jspdf';

const TOP5 = [
  {
    num: 1,
    name: '📋 Gerar Proposta (ProposalModal)',
    where: 'Card do cliente → ícone FileText',
    desc: 'Gera proposta personalizada com cálculo Santander 2,282% a.m. em 36x, ROI, carência de 90 dias e envia direto pelo WhatsApp do cliente.',
    steps: ['Abra o card do cliente', 'Clique no ícone de proposta (📄)', 'Selecione o equipamento', 'Copie ou envie pelo WhatsApp'],
  },
  {
    num: 2,
    name: '📅 Agendar Visita + Google Calendar',
    where: 'Card do cliente → ícone Calendário',
    desc: 'Agenda visita técnica no Google Calendar com endereço, telefone, tipo de visita e salva na entidade Visit com lembretes automáticos.',
    steps: ['Clique no ícone 📅 no card', 'Escolha tipo, data e hora', 'Adicione observações', 'Clique em Agendar Visita'],
  },
  {
    num: 3,
    name: '🤖 Assistente IA (AIAssistant)',
    where: 'Menu → IA → Assistente IA',
    desc: 'IA treinada com catálogo Seamaty, tabela de preços e técnicas SPIN/neuromarketing. Gera scripts personalizados, rebate objeções e sugere próximas ações.',
    steps: ['Acesse Assistente IA no menu', 'Digite a situação do cliente', 'Receba script personalizado', 'Use no WhatsApp ou visita'],
  },
  {
    num: 4,
    name: '💬 WhatsApp Hub',
    where: 'Menu → WhatsApp → WhatsApp Hub',
    desc: 'Central de mensagens com modelos prontos, envio de propostas em texto formatado, follow-up automático e histórico de conversas.',
    steps: ['Acesse WhatsApp Hub', 'Selecione o cliente', 'Escolha template ou escreva', 'Envie ou agende'],
  },
  {
    num: 5,
    name: '📊 Health Score + Pipeline',
    where: 'Lista de Clientes / Card',
    desc: 'Score automático 0-100 calculado por dias sem contato, estágio do pipeline e score de compra. Identifica quem atacar primeiro toda segunda-feira.',
    steps: ['Veja o badge colorido no card', '🟢=Quente, 🟡=Morno, 🔴=Frio', 'Use o Relatório Semanal na Home', 'Priorize clientes com score >60'],
  },
];

const ALL_FUNCTIONS = [
  { cat: 'CRM', items: ['Clientes (lista, filtros, busca)', 'Perfil do Cliente (dados, histórico, visitas)', 'Novo Cliente (cadastro com numerologia)', 'Leads (pipeline kanban)', 'Tarefas (follow-up, ligação, visita)', 'Agenda (calendário de visitas)'] },
  { cat: 'WhatsApp & Mensagens', items: ['WhatsApp Hub (central de envio)', 'WhatsApp Inbox (mensagens recebidas)', 'Assistente Master WhatsApp (agente IA)', 'Aprovar Mensagens (revisão antes de enviar)', 'Histórico de Mensagens', 'Automação de Mensagens'] },
  { cat: 'IA & Análise', items: ['Assistente IA (scripts e estratégias)', 'Conteúdo IA (geração de conteúdo)', 'Base de Conhecimento IA (documentos)', 'Inteligência 360° (dashboard proativo)', 'Coaching IA (análise de performance)', 'Numerologia (perfil comportamental)', 'Analytics Preditivo', 'Sequências de Follow-up IA', 'Inteligência de Mercado'] },
  { cat: 'Vendas & Pipeline', items: ['Funil de Vendas (kanban)', 'Gerar Proposta (financiamento Santander)', 'Possíveis Vendas (oportunidades abertas)', 'Previsão de Fechamento', 'Segmentação de Clientes', 'Dashboard de Sentimento'] },
  { cat: 'Relatórios', items: ['Analytics (gráficos e KPIs)', 'Dashboard Interativo', 'Analytics de Vendas', 'Relatórios Automáticos', 'Relatório Semanal de Saúde da Carteira'] },
  { cat: 'Produtos & Propostas', items: ['Catálogo de Equipamentos (VBC-50A, SMT-120VP, VG2, VQ1...)', 'Templates de Proposta', 'Gerenciador de Produtos e Insumos'] },
  { cat: 'Automação', items: ['Integrações (Google Calendar, Notion, Slides)', 'Workflows Automatizados', 'Otimizador de Rotas de Visita', 'Agendamento Automático de Follow-up'] },
];

export default function CRMManualPDF() {
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const generatePDF = () => {
    setLoading(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = 210;
      const margin = 15;
      let y = 20;

      const addPage = () => { doc.addPage(); y = 20; };
      const checkPage = (need = 10) => { if (y + need > 275) addPage(); };

      // Capa
      doc.setFillColor(49, 46, 129);
      doc.rect(0, 0, W, 60, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('CRM NR22 — Manual de Uso', W / 2, 28, { align: 'center' });
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Sistema Completo de Vendas · Seamaty Brasil', W / 2, 38, { align: 'center' });
      doc.text('Nathan Rosa · (14) 99167-6428', W / 2, 46, { align: 'center' });
      doc.setTextColor(200, 200, 255);
      doc.setFontSize(9);
      doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, W / 2, 54, { align: 'center' });

      y = 72;
      doc.setTextColor(30, 30, 30);

      // TOP 5
      doc.setFillColor(237, 233, 254);
      doc.rect(margin, y - 5, W - margin * 2, 10, 'F');
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(49, 46, 129);
      doc.text('⭐ TOP 5 FUNÇÕES PARA FECHAR VENDAS', margin + 2, y + 2);
      y += 10;
      doc.setTextColor(30, 30, 30);

      TOP5.forEach((fn) => {
        checkPage(45);
        doc.setFillColor(245, 243, 255);
        doc.rect(margin, y, W - margin * 2, 8, 'F');
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(79, 70, 229);
        doc.text(`${fn.num}. ${fn.name}`, margin + 2, y + 5.5);
        y += 9;

        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 100, 100);
        doc.text(`📍 Onde: ${fn.where}`, margin + 4, y + 4);
        y += 6;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(50, 50, 50);
        const descLines = doc.splitTextToSize(fn.desc, W - margin * 2 - 6);
        descLines.forEach(line => { checkPage(5); doc.text(line, margin + 4, y + 4); y += 5; });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(22, 101, 52);
        doc.text('Como usar:', margin + 4, y + 4);
        y += 5;
        doc.setFont('helvetica', 'normal');
        fn.steps.forEach((s, i) => {
          checkPage(5);
          doc.text(`  ${i + 1}. ${s}`, margin + 4, y + 3.5);
          y += 5;
        });
        y += 4;
      });

      // Todas as Funções
      addPage();
      doc.setFillColor(30, 58, 138);
      doc.rect(0, 0, W, 18, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('GUIA COMPLETO DE TODAS AS FUNÇÕES', W / 2, 12, { align: 'center' });
      y = 25;
      doc.setTextColor(30, 30, 30);

      ALL_FUNCTIONS.forEach(({ cat, items }) => {
        checkPage(20);
        doc.setFillColor(219, 234, 254);
        doc.rect(margin, y, W - margin * 2, 8, 'F');
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(29, 78, 216);
        doc.text(cat, margin + 3, y + 5.5);
        y += 10;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(40, 40, 40);
        items.forEach(item => {
          checkPage(6);
          doc.text(`  • ${item}`, margin + 3, y + 4);
          y += 5.5;
        });
        y += 3;
      });

      // Rodapé última página
      checkPage(30);
      y += 5;
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, y, W - margin * 2, 28, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(49, 46, 129);
      doc.text('💡 DICA DE OURO — ROTINA DIÁRIA DE VENDAS', margin + 4, y + 7);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(40, 40, 40);
      const dicas = [
        '1. Abra a Home → veja o Relatório Semanal (clientes para atacar hoje)',
        '2. Use o Health Score para priorizar (verde = ligar agora)',
        '3. Gere a proposta pelo card e envie via WhatsApp',
        '4. Agende a visita com 1 clique → salva no Google Calendar',
        '5. Registre o resultado no perfil do cliente para o histórico',
      ];
      dicas.forEach((d, i) => { doc.text(d, margin + 4, y + 13 + i * 4); });

      doc.save('CRM_NR22_Manual_Completo.pdf');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-2xl p-4 mb-4 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-base">📘 Manual CRM NR22</p>
            <p className="text-indigo-200 text-xs">Todas as funções + Top 5 para fechar vendas</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-indigo-300 underline"
          >
            {expanded ? 'Ocultar' : 'Ver Top 5'}
          </button>
          <Button
            size="sm"
            onClick={generatePDF}
            disabled={loading}
            className="bg-white text-indigo-900 hover:bg-indigo-100 gap-1.5 font-bold"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Baixar PDF
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 grid grid-cols-1 gap-2">
          {TOP5.map(fn => (
            <div key={fn.num} className="bg-white/10 rounded-xl p-3">
              <p className="font-bold text-sm">{fn.num}. {fn.name}</p>
              <p className="text-indigo-200 text-xs mt-0.5">{fn.desc}</p>
              <p className="text-indigo-300 text-xs mt-1 italic">📍 {fn.where}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}