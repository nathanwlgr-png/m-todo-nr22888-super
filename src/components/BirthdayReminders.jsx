import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Cake, Calendar, Building2, Users, Send, Gift } from 'lucide-react';
import { toast } from 'sonner';

export default function BirthdayReminders() {
  const [sending, setSending] = useState(null);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients-birthdays'],
    queryFn: () => base44.entities.Client.list('-updated_date', 5000)
  });

  // Calcular próximos aniversários (próximos 30 dias)
  const getUpcomingBirthdays = () => {
    const today = new Date();
    const next30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const birthdays = [];
    
    clients.forEach(client => {
      // Aniversário do proprietário/veterinário
      if (client.birthdate) {
        const birthDate = new Date(client.birthdate);
        const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
        
        if (thisYearBirthday >= today && thisYearBirthday <= next30Days) {
          const daysUntil = Math.floor((thisYearBirthday - today) / (1000 * 60 * 60 * 24));
          const age = today.getFullYear() - birthDate.getFullYear();
          
          birthdays.push({
            id: `${client.id}-owner`,
            client: client,
            type: 'owner',
            name: client.first_name || client.full_name,
            date: thisYearBirthday,
            daysUntil: daysUntil,
            age: age,
            isToday: daysUntil === 0
          });
        }
      }
      
      // Aniversário da clínica (se não houver aniversário pessoal)
      if (client.clinic_opening_date && !client.birthdate) {
        const openingDate = new Date(client.clinic_opening_date);
        const thisYearAnniversary = new Date(today.getFullYear(), openingDate.getMonth(), openingDate.getDate());
        
        if (thisYearAnniversary >= today && thisYearAnniversary <= next30Days) {
          const daysUntil = Math.floor((thisYearAnniversary - today) / (1000 * 60 * 60 * 24));
          const years = today.getFullYear() - openingDate.getFullYear();
          
          birthdays.push({
            id: `${client.id}-clinic`,
            client: client,
            type: 'clinic',
            name: client.clinic_name || client.first_name,
            date: thisYearAnniversary,
            daysUntil: daysUntil,
            years: years,
            isToday: daysUntil === 0
          });
        }
      }
      
      // Aniversários dos membros da equipe
      if (client.team_members && Array.isArray(client.team_members)) {
        client.team_members.forEach((member, idx) => {
          if (member.birthdate) {
            const memberBirthDate = new Date(member.birthdate);
            const thisYearBirthday = new Date(today.getFullYear(), memberBirthDate.getMonth(), memberBirthDate.getDate());
            
            if (thisYearBirthday >= today && thisYearBirthday <= next30Days) {
              const daysUntil = Math.floor((thisYearBirthday - today) / (1000 * 60 * 60 * 24));
              const age = today.getFullYear() - memberBirthDate.getFullYear();
              
              birthdays.push({
                id: `${client.id}-team-${idx}`,
                client: client,
                type: 'team',
                name: member.name,
                role: member.role,
                date: thisYearBirthday,
                daysUntil: daysUntil,
                age: age,
                isToday: daysUntil === 0,
                phone: member.phone
              });
            }
          }
        });
      }
    });
    
    return birthdays.sort((a, b) => a.daysUntil - b.daysUntil);
  };

  const sendGreeting = async (birthday) => {
    setSending(birthday.id);
    
    try {
      const phone = birthday.type === 'team' ? birthday.phone : birthday.client.phone;
      
      if (!phone) {
        toast.error('Cliente não possui WhatsApp cadastrado');
        return;
      }
      
      let message = '';
      
      if (birthday.type === 'owner') {
        message = `🎉🎂 *Feliz Aniversário, ${birthday.name}!*\n\n` +
                 `Parabéns pelos seus ${birthday.age} anos! 🥳\n\n` +
                 `Desejamos um dia incrível repleto de alegria e realizações! ` +
                 `Obrigado por fazer parte da nossa família de clientes.\n\n` +
                 `Um grande abraço da equipe! 🎈`;
      } else if (birthday.type === 'clinic') {
        message = `🎊🏥 *Feliz Aniversário, ${birthday.name}!*\n\n` +
                 `Parabéns pelos ${birthday.years} anos! 🎉\n\n` +
                 `Que continue sendo um sucesso e cuidando cada vez melhor dos pets! ` +
                 `Obrigado por confiar em nossos equipamentos.\n\n` +
                 `Um grande abraço da nossa equipe! 🐾`;
      } else if (birthday.type === 'team') {
        message = `🎉 *Feliz Aniversário, ${birthday.name}!*\n\n` +
                 `Parabéns pelos seus ${birthday.age} anos! 🥳\n\n` +
                 `Desejamos um dia maravilhoso! 🎈`;
      }
      
      await base44.functions.invoke('sendDocumentToWhatsapp', {
        client_phone: phone,
        message: message
      });
      
      // Atualizar cliente
      await base44.entities.Client.update(birthday.client.id, {
        birthday_greeting_sent: true,
        birthday_greeting_sent_date: new Date().toISOString().split('T')[0]
      });
      
      toast.success('🎉 Parabéns enviado com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar parabéns:', error);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setSending(null);
    }
  };

  const upcomingBirthdays = getUpcomingBirthdays();
  const todayBirthdays = upcomingBirthdays.filter(b => b.isToday);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500">Carregando aniversários...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
        <div className="flex items-center gap-3">
          <Gift className="w-6 h-6" />
          <CardTitle>🎉 Aniversários e Comemorações</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {todayBirthdays.length > 0 && (
          <div className="mb-6 p-4 bg-pink-50 border-2 border-pink-300 rounded-lg">
            <h3 className="font-bold text-pink-800 mb-3 flex items-center gap-2">
              <Cake className="w-5 h-5" />
              Aniversários de Hoje! 🎂
            </h3>
            <div className="space-y-2">
              {todayBirthdays.map(birthday => (
                <div key={birthday.id} className="flex items-center justify-between bg-white p-3 rounded-lg shadow">
                  <div className="flex items-center gap-3">
                    {birthday.type === 'owner' && <Cake className="w-5 h-5 text-pink-500" />}
                    {birthday.type === 'clinic' && <Building2 className="w-5 h-5 text-purple-500" />}
                    {birthday.type === 'team' && <Users className="w-5 h-5 text-blue-500" />}
                    <div>
                      <p className="font-semibold">{birthday.name}</p>
                      {birthday.type === 'owner' && (
                        <p className="text-sm text-gray-600">{birthday.age} anos • {birthday.client.clinic_name}</p>
                      )}
                      {birthday.type === 'clinic' && (
                        <p className="text-sm text-gray-600">{birthday.years} anos de inauguração</p>
                      )}
                      {birthday.type === 'team' && (
                        <p className="text-sm text-gray-600">{birthday.role} • {birthday.client.clinic_name}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => sendGreeting(birthday)}
                    disabled={sending === birthday.id}
                    className="bg-pink-600 hover:bg-pink-700"
                  >
                    <Send className="w-4 h-4 mr-1" />
                    {sending === birthday.id ? 'Enviando...' : 'Enviar Parabéns'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Próximos 30 Dias
        </h3>

        {upcomingBirthdays.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Nenhum aniversário nos próximos 30 dias
          </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {upcomingBirthdays.map(birthday => (
              <div
                key={birthday.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  birthday.isToday ? 'bg-pink-50 border-pink-300' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {birthday.type === 'owner' && <Cake className="w-4 h-4 text-pink-500" />}
                  {birthday.type === 'clinic' && <Building2 className="w-4 h-4 text-purple-500" />}
                  {birthday.type === 'team' && <Users className="w-4 h-4 text-blue-500" />}
                  <div>
                    <p className="font-medium text-sm">{birthday.name}</p>
                    <p className="text-xs text-gray-600">
                      {birthday.type === 'owner' && `${birthday.age} anos • `}
                      {birthday.type === 'clinic' && `${birthday.years} anos • `}
                      {birthday.client.clinic_name || birthday.client.first_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={birthday.daysUntil <= 7 ? 'default' : 'outline'}>
                    {birthday.isToday ? 'Hoje!' : `${birthday.daysUntil}d`}
                  </Badge>
                  {!birthday.isToday && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => sendGreeting(birthday)}
                      disabled={sending === birthday.id}
                    >
                      <Send className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}