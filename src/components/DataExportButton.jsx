import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function DataExportButton() {
  const [exporting, setExporting] = useState(false);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-created_date', 1000),
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['all-sales'],
    queryFn: () => base44.entities.Sale.list('-sale_date', 1000),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['all-tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 1000),
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['all-visits'],
    queryFn: () => base44.entities.Visit.list('-scheduled_date', 1000),
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => base44.entities.Campaign.list('-created_date', 1000),
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const exportAllData = async () => {
    setExporting(true);
    try {
      // Preparar dados completos
      const exportData = {
        timestamp: new Date().toISOString(),
        generated_by: user?.email || 'Sistema',
        summary: {
          total_clients: clients.length,
          total_sales: sales.length,
          total_tasks: tasks.length,
          total_visits: visits.length,
          total_campaigns: campaigns.length,
          total_revenue: sales.reduce((sum, s) => sum + (s.sale_value || 0), 0),
          pipeline_value: clients.reduce((sum, c) => sum + (c.projected_revenue || 0), 0)
        },
        training_guide: {
          title: "GUIA COMPLETO VENDA NR - TREINAMENTO BÁSICO",
          platform_overview: "Sistema completo de CRM veterinário com IA integrada para gestão de vendas, clientes e análises preditivas.",
          getting_started: {
            step1: "CADASTRO DE CLIENTES - Menu 'Novo Cliente' - Preencha dados básicos + numerologia para perfil comportamental",
            step2: "IMPORTAÇÃO EM MASSA - Use 'Importar Tabela' para carregar planilhas de leads/clientes existentes",
            step3: "SCANNER DE VOZ IA - 'Scanner IA Voz' transcreve ligações e extrai dados automaticamente",
            step4: "GESTÃO DE TAREFAS - Tarefas são criadas automaticamente pela IA baseado em comportamento do cliente",
            step5: "CAMPANHAS - Crie campanhas segmentadas com material personalizado por IA"
          },
          main_features: {
            client_management: "Perfil 360° com numerologia, score de compra, engagement, health score, pipeline e histórico completo",
            ai_task_automation: "IA monitora clientes e cria tarefas automáticas (follow-ups, visitas, reengajamento)",
            sales_intelligence: "IA analisa padrões e sugere melhor abordagem, gatilhos mentais e momento ideal para contato",
            predictive_analytics: "Previsão de fechamento, probabilidade de conversão, análise de tendências",
            document_generation: "Propostas, contratos e relatórios gerados automaticamente com dados do cliente",
            whatsapp_integration: "Envio de mensagens estruturadas, notificações e material de vendas via WhatsApp",
            offline_mode: "Pacote de estudo offline com guias, tarefas prioritárias e material científico",
            performance_monitoring: "Dashboards em tempo real com métricas de vendas, funil, conversão e performance individual"
          },
          ai_systems_active: {
            total_ais: 15,
            list: [
              "IA 1 - Auto Task Generator: Monitora comportamento e cria tarefas automáticas (cooldown 48h)",
              "IA 2 - Sales Intelligence: Analisa perfil e sugere melhor estratégia de abordagem",
              "IA 3 - Predictive Analytics: Prevê fechamento e probabilidade de conversão",
              "IA 4 - Content Generator: Cria mensagens personalizadas por cliente",
              "IA 5 - Report Generator: Relatórios diários/semanais/mensais automáticos",
              "IA 6 - Task Manager: Prioriza tarefas inteligentemente por urgência e impacto",
              "IA 7 - CRM External Sync: Importa e mapeia dados de CRMs externos",
              "IA 8 - Workflow Automation: Cria workflows automáticos baseados em padrões",
              "IA 9 - Numerology Analysis: Calcula perfil comportamental e sugere abordagem",
              "IA 10 - Market Intelligence: Analisa concorrência e mercado regional",
              "IA 11 - Equipment Selector: Sugere equipamento ideal por perfil do cliente",
              "IA 12 - Objection Handler: Prevê objeções e gera respostas personalizadas",
              "IA 13 - Voice Scanner: Transcreve ligações e extrai dados estruturados",
              "IA 14 - Health Score Calculator: Calcula saúde do cliente e risco de churn",
              "IA 15 - Follow-up Sequencer: Cria sequências automáticas de follow-up"
            ],
            correction_system: {
              ia_validator_1: "Monitora dados inconsistentes (scores inválidos, campos obrigatórios, duplicatas)",
              ia_validator_2: "Valida lógica de negócio (clientes quentes inativos, alto score sem ação)",
              ia_validator_3: "Otimiza performance (detecta gargalos, sugere melhorias, previne bugs)"
            }
          },
          ai_planning_workflow: {
            detection: "IAs monitoram eventos (novo cliente, email enviado, visita, status mudou, score alterado)",
            analysis: "IA analisa contexto (perfil numerológico, histórico, engagement, pipeline, concorrência)",
            decision: "IA decide ação (criar tarefa, enviar mensagem, agendar follow-up, mudar prioridade)",
            execution: "Ação executada automaticamente ou sugerida para vendedor",
            learning: "IA aprende com resultados (quais técnicas funcionaram, padrões de sucesso)"
          },
          best_practices: [
            "Mantenha dados atualizados - IA depende de informações precisas",
            "Complete perfil do cliente - quanto mais dados, melhor a análise IA",
            "Registre todas interações - alimenta learning das IAs",
            "Revise tarefas automáticas diariamente - IA sugere, você decide",
            "Use material científico nos pitches - diferencial técnico",
            "Configure WhatsApp - receba alertas e envie materiais rapidamente",
            "Exporte dados regularmente - backup e análise externa",
            "Monitore health score - previne churn de clientes quentes"
          ],
          troubleshooting: {
            ia_not_creating_tasks: "Verifique cooldown de 48h - IA não duplica tarefas recentes do mesmo tipo",
            low_engagement_score: "Registre mais interações - score baseado em visualizações, downloads, respostas",
            wrong_equipment_suggestion: "Complete 'lab_needs' e 'current_volume' para sugestão precisa",
            duplicated_clients: "Use IA de correção ou busque por email antes de criar novo"
          },
          shortcuts: {
            home: "Dashboard principal - visão geral e acesso rápido",
            new_client: "Cadastro completo com IA - análise numerológica automática",
            voice_scanner: "Transcrição de ligações - extração automática de dados",
            tasks: "Gestão de tarefas - auto-criadas pela IA + manuais",
            campaigns: "Campanhas segmentadas - material gerado por IA",
            analytics: "Dashboards avançados - performance e previsões",
            export: "Exportar tudo - dados + artigos científicos + treinamento"
          }
        },
        clients: clients.map(c => ({
          id: c.id,
          name: c.first_name,
          company: c.clinic_name,
          email: c.email,
          phone: c.phone,
          city: c.city,
          status: c.status,
          score: c.purchase_score,
          type: c.client_type,
          revenue: c.projected_revenue,
          created: c.created_date
        })),
        sales: sales.map(s => ({
          id: s.id,
          client: s.client_name,
          equipment: s.equipment_name,
          value: s.sale_value,
          date: s.sale_date,
          status: s.status
        })),
        tasks: tasks.map(t => ({
          id: t.id,
          client: t.client_name,
          title: t.title,
          type: t.type,
          priority: t.priority,
          status: t.status,
          due_date: t.due_date
        })),
        visits: visits.map(v => ({
          id: v.id,
          client: v.client_name,
          date: v.scheduled_date,
          type: v.visit_type,
          status: v.status
        })),
        campaigns: campaigns.map(c => ({
          id: c.id,
          name: c.name,
          status: c.status,
          start: c.start_date,
          end: c.end_date,
          budget: c.budget
        })),
        scientific_references: {
          title: "Hemogasômetro em Cavalos - Referências Científicas",
          description: "Estudos peer-reviewed sobre análise de gases sanguíneos em equinos",
          articles: [
            {
              title: "Arterial Blood Gas, Electrolyte and Acid-Base Values as Diagnostic and Prognostic Indicators in Equine Colic",
              url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10603645/",
              abstract: "Study investigating arterial blood gas analysis in conscious horses presenting with colic - PaCO2 lower in colic horses suggesting compensatory response to metabolic acidosis",
              language: "English",
              relevance: "Critical for colic diagnosis and prognosis"
            },
            {
              title: "Determination of reference intervals for equine arterial blood-gas, acid-base and electrolyte values",
              url: "https://www.sciencedirect.com/science/article/abs/pii/S1467298719301412",
              abstract: "Reference intervals for ABG, acid-base and electrolyte values from large population of healthy horses ≥1 year",
              language: "English",
              relevance: "Gold standard reference values for horses"
            },
            {
              title: "Can Arterial Blood Gas Analysis Predict Survival in Equine Colic?",
              url: "https://onlinelibrary.wiley.com/doi/full/10.1002/vms3.70210",
              abstract: "Arterial blood predicts survival based on colic type but less accurate for hospital discharge outcomes",
              language: "English",
              relevance: "Prognostic value in colic cases"
            },
            {
              title: "Analytical Performance Evaluation of GEM Premier ChemSTAT for Blood Gas Analysis in Horses",
              url: "https://www.mdpi.com/2306-7381/10/2/114",
              abstract: "Comparison of GEM5000 vs epoc machines for equine blood gas analysis - analytical performance validation",
              language: "English",
              relevance: "Equipment validation for equine use"
            },
            {
              title: "Serial Venous Lactate Measurement Following Gastrointestinal Surgery in Horses",
              url: "https://vetsci.org/DOIx.php?id=10.4142/jvs.22038",
              abstract: "Prospective study on lactate concentration utility in outcome prediction for colic surgery",
              language: "English",
              relevance: "Lactate as prognostic marker in surgical colic"
            },
            {
              title: "Exercise-Induced Metabolic Acidosis in Barrel Racing Horses",
              url: "https://www.scielo.br/j/cr/a/jWPqYZP7XQz8ZtQs8tCWy5w/",
              abstract: "Barrel racing training caused transient metabolic acidosis, hyperlactatemia present after 1h rest",
              language: "English/Portuguese",
              relevance: "Performance horses and acid-base balance"
            },
            {
              title: "Treatment of Hyperchloremic Metabolic Acidosis in Horses",
              url: "https://www.frontiersin.org/journals/veterinary-science/articles/10.3389/fvets.2024.1376578/full",
              abstract: "Metabolic acidosis major imbalance in horses with diarrhea, colic, chronic kidney disease",
              language: "English",
              relevance: "Treatment protocols for acid-base disorders"
            }
          ],
          key_parameters_equine: {
            pH: { normal: "7.35-7.45", critical: "Acid-base balance" },
            pO2: { normal: "90-100 mmHg", critical: "Oxygen delivery" },
            pCO2: { normal: "38-46 mmHg", critical: "Respiratory function" },
            HCO3: { normal: "24-30 mmol/L", critical: "Metabolic status" },
            Lactate: { normal: "<2 mmol/L", critical: "Tissue perfusion, >6 mmol/L = poor prognosis in colic" },
            Na: { normal: "132-146 mmol/L", critical: "Fluid balance" },
            K: { normal: "2.4-4.7 mmol/L", critical: "Cardiac function" },
            Cl: { normal: "99-109 mmol/L", critical: "Acid-base balance" },
            Glucose: { normal: "75-115 mg/dL", critical: "Energy metabolism" },
            Hb: { normal: "11-19 g/dL", critical: "Oxygen capacity" },
            Hct: { normal: "32-53%", critical: "Hydration status" }
          }
        }
      };

      // Criar arquivo JSON
      const jsonStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Download
      const link = document.createElement('a');
      link.href = url;
      link.download = `VendaNR_Export_${new Date().toISOString().split('T')[0]}.json`;
      link.click();

      // Criar resumo para WhatsApp
      const whatsappMessage = `📊 *EXPORTAÇÃO COMPLETA VENDA NR*\n\n` +
        `📅 ${new Date().toLocaleString('pt-BR')}\n\n` +
        `📈 RESUMO DADOS:\n` +
        `• ${clients.length} clientes\n` +
        `• ${sales.length} vendas\n` +
        `• ${tasks.length} tarefas\n` +
        `• ${visits.length} visitas\n` +
        `• ${campaigns.length} campanhas\n\n` +
        `💰 R$ ${sales.reduce((sum, s) => sum + (s.sale_value || 0), 0).toLocaleString()} receita\n` +
        `💎 R$ ${clients.reduce((sum, c) => sum + (c.projected_revenue || 0), 0).toLocaleString()} pipeline\n\n` +
        `${'='.repeat(50)}\n` +
        `🤖 *SISTEMA DE IA - 15 IAs ATIVAS*\n\n` +
        `*PRINCIPAIS:*\n` +
        `1. Auto Task Generator - cria tarefas automáticas\n` +
        `2. Sales Intelligence - sugere melhor abordagem\n` +
        `3. Predictive Analytics - prevê fechamento\n` +
        `4. Content Generator - mensagens personalizadas\n` +
        `5. Report Generator - relatórios automáticos\n` +
        `6. Task Manager - priorização inteligente\n` +
        `7. CRM Sync - importa dados externos\n` +
        `8. Workflow Automation - fluxos automáticos\n` +
        `9. Numerology Analysis - perfil comportamental\n` +
        `10. Market Intelligence - análise mercado\n` +
        `11. Equipment Selector - sugere equipamento\n` +
        `12. Objection Handler - prevê objeções\n` +
        `13. Voice Scanner - transcreve ligações\n` +
        `14. Health Score - risco churn\n` +
        `15. Follow-up Sequencer - sequências automáticas\n\n` +
        `*SISTEMA DE CORREÇÃO (3 IAs):*\n` +
        `✅ IA Validadora 1 - dados inconsistentes\n` +
        `✅ IA Validadora 2 - lógica de negócio\n` +
        `✅ IA Validadora 3 - performance\n\n` +
        `${'='.repeat(50)}\n` +
        `📚 *GUIA DE USO - POR ONDE COMEÇAR*\n\n` +
        `*PASSO 1:* Cadastre clientes (Novo Cliente)\n` +
        `*PASSO 2:* Importe planilhas (Importar Tabela)\n` +
        `*PASSO 3:* Use Scanner IA Voz para ligações\n` +
        `*PASSO 4:* IAs criam tarefas automaticamente\n` +
        `*PASSO 5:* Crie campanhas com IA\n\n` +
        `*PRINCIPAIS TELAS:*\n` +
        `• Home - Dashboard e acesso rápido\n` +
        `• Clientes - Gestão completa 360°\n` +
        `• Tarefas - Auto-criadas pela IA\n` +
        `• Campanhas - Material personalizado\n` +
        `• Analytics - Performance e previsões\n\n` +
        `*COMO FUNCIONA A IA:*\n` +
        `1. Detecção - monitora eventos (novo cliente, email, visita)\n` +
        `2. Análise - perfil, histórico, engagement\n` +
        `3. Decisão - criar tarefa, enviar msg, follow-up\n` +
        `4. Execução - automática ou sugerida\n` +
        `5. Aprendizado - melhora com resultados\n\n` +
        `*DICAS:*\n` +
        `✓ Complete perfil do cliente - melhor análise IA\n` +
        `✓ Registre todas interações - alimenta learning\n` +
        `✓ Revise tarefas automáticas diariamente\n` +
        `✓ Use material científico nos pitches\n` +
        `✓ Configure WhatsApp para alertas\n` +
        `✓ Monitore health score - previne churn\n\n` +
        `${'='.repeat(50)}\n` +
        `🔬 *ARTIGOS CIENTÍFICOS (7)*\n\n` +
        `*EQUINOS:*\n` +
        `1. Blood Gas in Colic\n` +
        `   pmc.ncbi.nlm.nih.gov/articles/PMC10603645\n\n` +
        `2. Reference Intervals ABG\n` +
        `   sciencedirect.com/science/article/abs/pii/S1467298719301412\n\n` +
        `3. Survival Prediction\n` +
        `   onlinelibrary.wiley.com/doi/full/10.1002/vms3.70210\n\n` +
        `4. GEM Premier Evaluation\n` +
        `   mdpi.com/2306-7381/10/2/114\n\n` +
        `5. Lactate Surgery\n` +
        `   vetsci.org/DOIx.php?id=10.4142/jvs.22038\n\n` +
        `6. Exercise Acidosis\n` +
        `   scielo.br/j/cr/a/jWPqYZP7XQz8ZtQs8tCWy5w\n\n` +
        `7. Metabolic Acidosis Treatment\n` +
        `   frontiersin.org/journals/veterinary-science/articles/10.3389/fvets.2024.1376578\n\n` +
        `✅ Arquivo JSON completo baixado\n` +
        `📖 Treinamento completo incluído\n` +
        `🤖 15 IAs + 3 validadoras ativas`;

      // Copiar para clipboard e abrir WhatsApp
      await navigator.clipboard.writeText(whatsappMessage);
      
      if (user?.whatsapp_number) {
        setTimeout(() => {
          window.open(`https://wa.me/${user.whatsapp_number}?text=${encodeURIComponent(whatsappMessage)}`, '_blank');
        }, 500);
      }

      toast.success('Dados exportados com sucesso!', {
        description: `${clients.length} clientes + ${exportData.scientific_references.articles.length} artigos científicos`
      });

    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao exportar dados');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 shadow-lg">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800 text-sm">Exportar Tudo</h3>
          <p className="text-xs text-slate-600">Dados + Artigos Científicos</p>
        </div>
      </div>

      <div className="space-y-2 text-xs text-slate-600 mb-3">
        <p>• {clients.length} clientes cadastrados</p>
        <p>• 7 artigos científicos sobre cavalos</p>
        <p>• Todas vendas, tarefas e campanhas</p>
      </div>

      <Button
        onClick={exportAllData}
        disabled={exporting}
        className="w-full bg-purple-600 hover:bg-purple-700 h-10"
        size="sm"
      >
        {exporting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Exportando...
          </>
        ) : (
          <>
            <Download className="w-4 h-4 mr-2" />
            Baixar + WhatsApp
          </>
        )}
      </Button>
    </Card>
  );
}