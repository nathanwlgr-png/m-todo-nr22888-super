import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Buscar todos os clientes
    const clients = await base44.asServiceRole.entities.Client.list('-updated_date', 5000);
    
    const today = new Date();
    const todayMonth = today.getMonth() + 1; // 1-12
    const todayDay = today.getDate();
    const currentYear = today.getFullYear();
    
    const birthdaysToday = [];
    const clinicAnniversaries = [];
    
    for (const client of clients) {
      let shouldSendGreeting = false;
      let greetingType = '';
      let targetDate = null;
      
      // Verificar se já enviou este ano
      if (client.birthday_greeting_sent_date) {
        const lastSentDate = new Date(client.birthday_greeting_sent_date);
        if (lastSentDate.getFullYear() === currentYear) {
          continue; // Já enviou este ano
        }
      }
      
      // Verificar aniversário do proprietário/veterinário
      if (client.birthdate) {
        const birthDate = new Date(client.birthdate);
        const birthMonth = birthDate.getMonth() + 1;
        const birthDay = birthDate.getDate();
        
        if (birthMonth === todayMonth && birthDay === todayDay) {
          shouldSendGreeting = true;
          greetingType = 'birthday';
          targetDate = client.birthdate;
          
          const age = currentYear - birthDate.getFullYear();
          birthdaysToday.push({
            client: client,
            type: 'owner',
            age: age,
            name: client.first_name || client.full_name
          });
        }
      }
      
      // Se não tem aniversário pessoal, verificar data de inauguração da clínica
      if (!shouldSendGreeting && client.clinic_opening_date && !client.birthdate) {
        const openingDate = new Date(client.clinic_opening_date);
        const openingMonth = openingDate.getMonth() + 1;
        const openingDay = openingDate.getDate();
        
        if (openingMonth === todayMonth && openingDay === todayDay) {
          shouldSendGreeting = true;
          greetingType = 'clinic_anniversary';
          targetDate = client.clinic_opening_date;
          
          const years = currentYear - openingDate.getFullYear();
          clinicAnniversaries.push({
            client: client,
            years: years,
            clinic_name: client.clinic_name || client.first_name
          });
        }
      }
      
      // Verificar aniversários dos membros da equipe
      if (client.team_members && Array.isArray(client.team_members)) {
        for (const member of client.team_members) {
          if (member.birthdate) {
            const memberBirthDate = new Date(member.birthdate);
            const memberMonth = memberBirthDate.getMonth() + 1;
            const memberDay = memberBirthDate.getDate();
            
            if (memberMonth === todayMonth && memberDay === todayDay) {
              birthdaysToday.push({
                client: client,
                type: 'team_member',
                name: member.name,
                role: member.role,
                phone: member.phone
              });
            }
          }
        }
      }
      
      // Enviar mensagem via WhatsApp se necessário
      if (shouldSendGreeting && client.phone) {
        let message = '';
        
        if (greetingType === 'birthday') {
          const age = currentYear - new Date(client.birthdate).getFullYear();
          message = `🎉🎂 *Feliz Aniversário, ${client.first_name}!*\n\n` +
                   `Parabéns pelos seus ${age} anos! 🥳\n\n` +
                   `Desejamos um dia incrível repleto de alegria e realizações! ` +
                   `Obrigado por fazer parte da nossa família de clientes.\n\n` +
                   `Um grande abraço da equipe! 🎈`;
        } else if (greetingType === 'clinic_anniversary') {
          const years = currentYear - new Date(client.clinic_opening_date).getFullYear();
          const clinicName = client.clinic_name || 'sua clínica';
          message = `🎊🏥 *Feliz Aniversário, ${clinicName}!*\n\n` +
                   `Parabéns pelos ${years} anos de ${clinicName}! 🎉\n\n` +
                   `Que continue sendo um sucesso e cuidando cada vez melhor dos pets! ` +
                   `Obrigado por confiar em nossos equipamentos.\n\n` +
                   `Um grande abraço da nossa equipe! 🐾`;
        }
        
        try {
          // SAFE: NÃO envia mensagem automaticamente. Cria PendingMessage para aprovação manual.
          await base44.asServiceRole.entities.PendingMessage.create({
            canal: 'whatsapp',
            channel: 'whatsapp',
            destinatario_nome: client.first_name || client.full_name || client.clinic_name || 'Cliente',
            destinatario_contato: client.phone || '',
            cliente_id: client.id,
            contexto: `Parabéns ${greetingType === 'birthday' ? 'aniversário' : 'aniversário da clínica'} — aguardando aprovação manual`,
            context: `Parabéns ${greetingType === 'birthday' ? 'aniversário' : 'aniversário da clínica'} — aguardando aprovação manual`,
            mensagem: message,
            message_content: message,
            status: 'aguardando_aprovacao',
            criado_por_agente: 'checkBirthdaysAndSendGreetings',
            aprovado_por_nathan: false,
            data_criacao: new Date().toISOString(),
            priority: 'media',
            recipient_id: client.id,
            recipient_name: client.first_name || client.full_name || client.clinic_name || '',
            recipient_phone: client.phone || '',
            ai_reasoning: greetingType,
            proxima_acao: 'Revisar e enviar manualmente via WhatsApp'
          });
          
          // Marcar que a rotina processou (não que enviou) para não repetir
          await base44.asServiceRole.entities.Client.update(client.id, {
            birthday_greeting_sent: true,
            birthday_greeting_sent_date: today.toISOString().split('T')[0]
          });
        } catch (error) {
          console.error(`Erro ao criar pendência de parabéns para ${client.first_name}:`, error);
        }
      }
    }
    
    return Response.json({
      success: true,
      summary: {
        birthdays_found: birthdaysToday.length,
        clinic_anniversaries_found: clinicAnniversaries.length,
        total_greetings_sent: birthdaysToday.length + clinicAnniversaries.length
      },
      birthdays: birthdaysToday,
      clinic_anniversaries: clinicAnniversaries
    });
    
  } catch (error) {
    console.error('Erro ao verificar aniversários:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});