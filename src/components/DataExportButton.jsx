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
      const whatsappMessage = `📊 *EXPORTAÇÃO COMPLETA DO SISTEMA*\n\n` +
        `📅 Data: ${new Date().toLocaleString('pt-BR')}\n\n` +
        `📈 RESUMO:\n` +
        `• ${clients.length} clientes cadastrados\n` +
        `• ${sales.length} vendas registradas\n` +
        `• ${tasks.length} tarefas criadas\n` +
        `• ${visits.length} visitas programadas\n` +
        `• ${campaigns.length} campanhas ativas\n\n` +
        `💰 FINANCEIRO:\n` +
        `• Receita: R$ ${sales.reduce((sum, s) => sum + (s.sale_value || 0), 0).toLocaleString()}\n` +
        `• Pipeline: R$ ${clients.reduce((sum, c) => sum + (c.projected_revenue || 0), 0).toLocaleString()}\n\n` +
        `🔬 *ARTIGOS CIENTÍFICOS INCLUÍDOS:*\n\n` +
        `1️⃣ Arterial Blood Gas in Equine Colic\n` +
        `   https://pmc.ncbi.nlm.nih.gov/articles/PMC10603645/\n\n` +
        `2️⃣ Reference Intervals for Equine ABG\n` +
        `   https://www.sciencedirect.com/science/article/abs/pii/S1467298719301412\n\n` +
        `3️⃣ Blood Gas Analysis Predicting Survival\n` +
        `   https://onlinelibrary.wiley.com/doi/full/10.1002/vms3.70210\n\n` +
        `4️⃣ GEM Premier Performance Evaluation\n` +
        `   https://www.mdpi.com/2306-7381/10/2/114\n\n` +
        `5️⃣ Lactate in Colic Surgery\n` +
        `   https://vetsci.org/DOIx.php?id=10.4142/jvs.22038\n\n` +
        `6️⃣ Exercise-Induced Acidosis in Horses\n` +
        `   https://www.scielo.br/j/cr/a/jWPqYZP7XQz8ZtQs8tCWy5w/\n\n` +
        `7️⃣ Treatment of Metabolic Acidosis\n` +
        `   https://www.frontiersin.org/journals/veterinary-science/articles/10.3389/fvets.2024.1376578/full\n\n` +
        `✅ Arquivo JSON baixado com todos os dados\n` +
        `🐴 Referências científicas em inglês sobre cavalos`;

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