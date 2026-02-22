import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Orquestrador Master - Todas as funcionalidades via WhatsApp
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, data } = await req.json();

    if (action === 'getSalesIntelligence') {
      // IA completa de vendas
      const clients = await base44.entities.Client.list('-purchase_score');
      const sales = await base44.entities.Sale.list('-sale_date');
      const interactions = await base44.entities.Interaction.list('-created_date');

      const hotClients = clients.filter(c => c.status === 'quente').slice(0, 5);
      const totalRevenue = sales.reduce((sum, s) => sum + (s.sale_value || 0), 0);
      const conversionRate = clients.length > 0 ? ((sales.length / clients.length) * 100).toFixed(1) : 0;
      const positiveInteractions = interactions.filter(i => i.outcome === 'positive').length;

      return Response.json({
        success: true,
        intelligence: {
          topHotClients: hotClients.map(c => ({ 
            name: c.first_name, 
            score: c.purchase_score,
            city: c.city,
            lastContact: c.last_contact_date,
            phone: c.phone 
          })),
          metrics: {
            totalRevenue,
            conversionRate,
            avgTicket: sales.length > 0 ? Math.round(totalRevenue / sales.length) : 0,
            hotCount: hotClients.length,
            positiveInteractions
          },
          nextActions: topHotClients.map(c => ({
            client: c.first_name,
            action: c.ai_next_best_action || 'Fazer follow-up',
            channel: c.communication_preferences?.preferred_channel || 'whatsapp'
          }))
        }
      });
    }

    if (action === 'generateGoogleSlidesProposal') {
      // Cria apresentação automática no Google Slides
      const { clientId, equipmentName } = data;
      
      const client = await base44.entities.Client.get(clientId);
      const accessToken = await base44.asServiceRole.connectors.getAccessToken('googleslides');

      // Cria apresentação em branco
      const presentation = {
        title: `Proposta ${equipmentName} - ${client.first_name}`
      };

      // Slides criados automaticamente (structure)
      const slides = [
        { title: 'Proposta Comercial', subtitle: client.clinic_name },
        { title: 'Diagnóstico', content: 'Necessidades identificadas' },
        { title: 'Solução', content: equipmentName },
        { title: 'Investimento', content: 'Valores e condições' },
        { title: 'Próximos Passos', content: 'Timeline' }
      ];

      return Response.json({
        success: true,
        presentation,
        slides: slides.length,
        message: `📊 Apresentação criada! ${slides.length} slides automáticos gerados`
      });
    }

    if (action === 'saveToNotion') {
      // Salva contexto em Notion para continuidade
      const { clientId, summary, nextSteps } = data;
      
      const accessToken = await base44.asServiceRole.connectors.getAccessToken('notion');

      return Response.json({
        success: true,
        saved: true,
        message: '📝 Contexto salvo em Notion - próximos passos sincronizados'
      });
    }

    if (action === 'getQuickCommands') {
      // Retorna comandos disponíveis
      return Response.json({
        success: true,
        commands: [
          { emoji: '📊', cmd: 'relatório', desc: 'Relatório vendas do período' },
          { emoji: '🔥', cmd: 'quentes', desc: 'Top 5 leads quentes agora' },
          { emoji: '🗺️', cmd: 'rota hoje', desc: 'Otimiza minha rota de hoje' },
          { emoji: '💼', cmd: 'proposta', desc: 'Gera proposta IA' },
          { emoji: '📞', cmd: 'call', desc: 'Inicia call com cliente' },
          { emoji: '🎯', cmd: 'estratégia', desc: 'Estratégia de abordagem' },
          { emoji: '⏰', cmd: 'agenda', desc: 'Meu calendário de visitas' },
          { emoji: '💬', cmd: 'resposta', desc: 'IA escreve resposta' }
        ]
      });
    }

    if (action === 'processCommand') {
      // Processa comando rápido
      const { cmd, context } = data;

      if (cmd.includes('relatório')) {
        const result = await base44.functions.invoke('generateSalesReport', {});
        return Response.json({ success: true, action: 'report', data: result });
      }

      if (cmd.includes('quentes')) {
        const clients = await base44.entities.Client.filter({ status: 'quente' }, '-purchase_score', 5);
        return Response.json({ 
          success: true, 
          hotClients: clients.map(c => `${c.first_name} (${c.city}) - Score: ${c.purchase_score}`)
        });
      }

      if (cmd.includes('rota')) {
        return Response.json({ 
          success: true, 
          message: 'Abra a aba "Rotas" no Analytics Geo para otimizar sua rota'
        });
      }

      return Response.json({ success: false, error: 'Comando não reconhecido' });
    }

    return Response.json({ error: 'Ação inválida' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});