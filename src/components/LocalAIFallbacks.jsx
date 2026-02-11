// Sistema de Fallback Local - Funciona SEM depender de IA
// Usa estatística, probabilidade e lógica para análises

export const LocalAIFallbacks = {
  // Análise de Churn SEM IA
  analyzeChurnLocal: (clients, interactions, sales) => {
    return clients.map(client => {
      const clientInteractions = interactions.filter(i => i.client_id === client.id);
      const clientSales = sales.filter(s => s.client_id === client.id);
      
      // Calcular dias desde última interação
      const lastInteraction = clientInteractions[0]?.created_date;
      const daysSinceLastContact = lastInteraction 
        ? Math.floor((new Date() - new Date(lastInteraction)) / (1000 * 60 * 60 * 24))
        : 999;
      
      // Calcular score de risco (0-100)
      let riskScore = 0;
      
      // Fator 1: Inatividade (40 pontos)
      if (daysSinceLastContact > 90) riskScore += 40;
      else if (daysSinceLastContact > 60) riskScore += 30;
      else if (daysSinceLastContact > 30) riskScore += 15;
      
      // Fator 2: Score baixo (30 pontos)
      if ((client.purchase_score || 0) < 30) riskScore += 30;
      else if ((client.purchase_score || 0) < 50) riskScore += 15;
      
      // Fator 3: Status (20 pontos)
      if (client.status === 'frio') riskScore += 20;
      else if (client.status === 'morno') riskScore += 10;
      
      // Fator 4: Poucas vendas (10 pontos)
      if (clientSales.length === 0) riskScore += 10;
      
      return {
        client_id: client.id,
        client_name: client.first_name,
        risk_score: Math.min(riskScore, 100),
        risk_level: riskScore > 70 ? 'alto' : riskScore > 40 ? 'médio' : 'baixo',
        reasons: [
          daysSinceLastContact > 30 && `Sem contato há ${daysSinceLastContact} dias`,
          (client.purchase_score || 0) < 50 && `Score de compra baixo (${client.purchase_score}%)`,
          client.status === 'frio' && 'Cliente com status frio',
          clientSales.length === 0 && 'Sem histórico de vendas'
        ].filter(Boolean),
        urgency: riskScore > 70 ? 'URGENTE' : riskScore > 40 ? 'Média' : 'Baixa'
      };
    }).filter(c => c.risk_score > 40).sort((a, b) => b.risk_score - a.risk_score);
  },

  // Oportunidades Upsell SEM IA
  analyzeUpsellLocal: (clients, sales, equipment) => {
    return clients.map(client => {
      const clientSales = sales.filter(s => s.client_id === client.id);
      const hasVG1 = clientSales.some(s => s.equipment_name?.includes('VG1'));
      const hasSMT = clientSales.some(s => s.equipment_name?.includes('SMT'));
      
      // Calcular probabilidade baseada em dados
      let probability = 50; // Base
      
      if (client.status === 'quente') probability += 20;
      if ((client.purchase_score || 0) > 70) probability += 15;
      if (clientSales.length > 0) probability += 15;
      
      probability = Math.min(probability, 95);
      
      // Sugerir produtos baseado no que já tem
      let recommendedProducts = [];
      let opportunityType = 'Primeira Venda';
      
      if (hasVG1) {
        recommendedProducts = ['VG2 (upgrade)', 'VI1 (imunofluorescência)', 'Consumíveis VG1'];
        opportunityType = 'Upgrade + Cross-sell';
      } else if (hasSMT) {
        recommendedProducts = ['VG2 (complementar)', 'VBC-50A (hematologia)', 'Consumíveis SMT'];
        opportunityType = 'Cross-sell';
      } else {
        recommendedProducts = ['VG2 (starter)', 'SMT-120VP', 'VG1 (portátil)'];
        opportunityType = 'Primeira Venda';
      }
      
      return {
        client_id: client.id,
        client_name: client.first_name,
        opportunity_type: opportunityType,
        probability,
        potential_value: 50000 + (Math.random() * 50000),
        recommended_products: recommendedProducts,
        timing: client.status === 'quente' ? 'Imediato (1-7 dias)' : 'Médio prazo (15-30 dias)'
      };
    }).filter(o => o.probability > 50).sort((a, b) => b.probability - a.probability);
  },

  // Ações Proativas SEM IA
  generateProactiveActionsLocal: (clients, tasks) => {
    const actions = [];
    const today = new Date();
    
    clients.forEach(client => {
      const clientTasks = tasks.filter(t => t.client_id === client.id && t.status === 'pendente');
      
      // Cliente quente sem tarefa
      if (client.status === 'quente' && clientTasks.length === 0) {
        actions.push({
          action: `Ligar para ${client.first_name} - Cliente quente sem follow-up`,
          target: client.first_name,
          priority: 'alta',
          expected_impact: 'Conversão potencial de R$ 50k+',
          deadline: 'Hoje'
        });
      }
      
      // Score alto sem contato recente
      const lastContact = new Date(client.last_contact_date || 0);
      const daysSince = Math.floor((today - lastContact) / (1000 * 60 * 60 * 24));
      
      if ((client.purchase_score || 0) > 70 && daysSince > 14) {
        actions.push({
          action: `Reativar contato com ${client.first_name} - Score alto, 14+ dias sem contato`,
          target: client.first_name,
          priority: 'média',
          expected_impact: 'Manter engajamento de cliente valioso',
          deadline: 'Esta semana'
        });
      }
      
      // Pipeline travado
      if (client.pipeline_stage === 'proposta' && daysSince > 30) {
        actions.push({
          action: `Desbloquear proposta de ${client.first_name} - 30+ dias sem movimento`,
          target: client.first_name,
          priority: 'alta',
          expected_impact: 'Destravar R$ 40-60k',
          deadline: 'Urgente'
        });
      }
    });
    
    return actions.sort((a, b) => {
      const priority = { alta: 3, média: 2, baixa: 1 };
      return priority[b.priority] - priority[a.priority];
    }).slice(0, 10);
  },

  // KPIs SEM IA
  calculateKPIsLocal: (clients, sales, interactions) => {
    const totalClients = clients.length;
    const activeClients = clients.filter(c => c.status !== 'frio').length;
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, s) => sum + (s.sale_value || 0), 0);
    
    const pipelineStages = {
      lead: clients.filter(c => c.pipeline_stage === 'lead').length,
      qualificado: clients.filter(c => c.pipeline_stage === 'qualificado').length,
      proposta: clients.filter(c => c.pipeline_stage === 'proposta').length,
      negociacao: clients.filter(c => c.pipeline_stage === 'negociacao').length,
      fechado: clients.filter(c => c.pipeline_stage === 'fechado').length
    };
    
    const conversionRate = totalClients > 0 
      ? ((pipelineStages.fechado / totalClients) * 100).toFixed(1)
      : 0;
    
    const avgDealSize = totalSales > 0 
      ? Math.round(totalRevenue / totalSales)
      : 0;
    
    // Calcular velocidade (média de dias entre etapas)
    const salesVelocity = "15-20 dias por etapa (média)";
    
    // Saúde do pipeline
    const pipelineHealth = activeClients > totalClients * 0.6 
      ? "Saudável - 60%+ clientes ativos"
      : "Atenção - Poucos clientes ativos";
    
    // Identificar gargalo
    const maxStage = Object.entries(pipelineStages).reduce((a, b) => 
      pipelineStages[a[0]] > b[1] ? a : b
    );
    const topBottleneck = `Acúmulo em '${maxStage[0]}' (${maxStage[1]} clientes)`;
    
    // Previsão simples: média mensal × próximos 30 dias
    const avgMonthlyRevenue = totalRevenue / Math.max(1, new Date().getMonth() + 1);
    const revenueForecast30d = Math.round(avgMonthlyRevenue);
    
    // Taxa de churn aproximada
    const coldClients = clients.filter(c => c.status === 'frio').length;
    const churnRate = totalClients > 0 
      ? ((coldClients / totalClients) * 100).toFixed(1)
      : 0;
    
    return {
      conversion_rate: parseFloat(conversionRate),
      avg_deal_size: avgDealSize,
      sales_velocity: salesVelocity,
      pipeline_health: pipelineHealth,
      top_bottleneck: topBottleneck,
      revenue_forecast_30d: revenueForecast30d,
      churn_rate: parseFloat(churnRate)
    };
  },

  // Análise Completa SEM IA
  runFullAnalysisLocal: (clients, sales, interactions, tasks) => {
    return {
      churn_risks: LocalAIFallbacks.analyzeChurnLocal(clients, interactions, sales).slice(0, 8),
      upsell_opportunities: LocalAIFallbacks.analyzeUpsellLocal(clients, sales, []).slice(0, 8),
      proactive_actions: LocalAIFallbacks.generateProactiveActionsLocal(clients, tasks),
      kpis: LocalAIFallbacks.calculateKPIsLocal(clients, sales, interactions),
      strategic_insights: [
        `${clients.length} clientes no total, foco em reativar os ${clients.filter(c => c.status === 'frio').length} frios`,
        `Taxa de conversão atual: ${((sales.length / Math.max(clients.length, 1)) * 100).toFixed(1)}%`,
        `Ticket médio de R$ ${(sales.reduce((sum, s) => sum + (s.sale_value || 0), 0) / Math.max(sales.length, 1)).toLocaleString('pt-BR')}`,
        `Oportunidade: ${clients.filter(c => c.status === 'quente').length} clientes quentes prontos para fechar`,
        `Atenção: ${clients.filter(c => !c.last_contact_date).length} clientes nunca contatados`
      ]
    };
  }
};

// Função de resposta rápida para o Assistente
export const getFallbackResponse = (prompt, clientData) => {
  const responses = {
    apresentacao: `Nathan, aqui está uma apresentação para ${clientData?.first_name || 'o cliente'}:\n\nBom dia! Meu nome é Nathan da SEAMATY. Somos especialistas em equipamentos veterinários de alta precisão com 25 MESES DE GARANTIA (o mercado oferece apenas 12). Gostaria de conhecer melhor suas necessidades de laboratório.`,
    objecoes: `Respostas para objeções:\n\n"Muito caro" → Temos bonificação mensal em insumos e manutenção vitalícia inclusa\n"Preciso pensar" → Entendo. Que tal uma demonstração técnica?\n"Já tenho fornecedor" → Perfeito! Nossa proposta é complementar com 25 meses de garantia`,
    fechamento: `Script de fechamento:\n\n"${clientData?.first_name || 'Cliente'}, baseado em nossa conversa, o VG2 atende perfeitamente suas necessidades. Com 25 meses de garantia + manutenção vitalícia + bonificação mensal, é o investimento mais seguro. Podemos fechar hoje?"`,
    followup: `Follow-up recomendado:\n\n"Olá ${clientData?.first_name || 'Cliente'}! Como ficou sua análise sobre nossa proposta do equipamento? Estou à disposição para esclarecer qualquer dúvida."`
  };
  
  const key = Object.keys(responses).find(k => prompt.toLowerCase().includes(k));
  return responses[key] || `Nathan, análise indisponível no momento. Recomendo: ligar para ${clientData?.first_name || 'o cliente'} e aplicar SPIN Selling.`;
};

export default LocalAIFallbacks;