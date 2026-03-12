import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, User, Phone, Mail, Calendar, Sparkles, Send } from 'lucide-react';

export default function CampaignMessagePreview({ campaign }) {
  const [selectedContact, setSelectedContact] = useState(0);

  // Exemplos de mensagens personalizadas por campanha
  const campaignMessages = {
    'Campanha Leads Quentes': {
      type: 'upsell',
      contacts: [
        { name: 'Dr. Carlos Silva', phone: '(14) 99750-5631', clinic: 'Vet Care' },
        { name: 'Dra. Maria Santos', phone: '(11) 98765-4321', clinic: 'Pet Plus' }
      ],
      messageTemplate: (contact) => `Olá Dr(a). ${contact.name}! 👋

Notei que a ${contact.clinic} tem demonstrado grande interesse em nossos equipamentos de hematologia. 

Temos uma *oferta especial exclusiva* válida até sexta-feira:

🔬 *VG2 Premium*
✅ 26 parâmetros completos
✅ Resultados em 3-5 minutos
✅ *20% de bonificação em reagentes*

Posso agendar uma demonstração técnica na ${contact.clinic} ainda esta semana?

Qual dia funciona melhor para você?`
    },
    'Campanha Leads Quentes Mas Inativos': {
      type: 'engagement',
      contacts: [
        { name: 'Dr. Pedro Costa', phone: '(14) 99123-4567', clinic: 'Clínica Animal' },
        { name: 'Dra. Ana Paula', phone: '(11) 97654-3210', clinic: 'Hospital Vet' }
      ],
      messageTemplate: (contact) => `Oi Dr(a). ${contact.name}! 😊

Faz um tempo que não conversamos sobre os equipamentos para a ${contact.clinic}.

Vi que você tinha interesse no *analisador bioquímico*. Ainda está buscando uma solução?

Temos *novidades importantes*:
🆕 Novo modelo com tecnologia aprimorada
💰 Condições especiais de pagamento
📦 Entrega imediata

Me conta, como está o laboratório da clínica atualmente?`
    },
    'Campanha Clientes Quentes': {
      type: 'engagement',
      contacts: [
        { name: 'Dr. Roberto Lima', phone: '(14) 99888-7777', clinic: 'Melhor Amigo', lastPurchase: 'VG2 em Jan/2026' },
        { name: 'Dra. Juliana Rocha', phone: '(11) 96543-2109', clinic: 'Pet Center', lastPurchase: 'Biochem em Dez/2025' }
      ],
      messageTemplate: (contact) => `Olá Dr(a). ${contact.name}! 🎉

Como está indo com o *${contact.lastPurchase}* na ${contact.clinic}?

Queria saber:
📊 Os resultados estão atendendo suas expectativas?
🔧 Precisa de algum suporte técnico?
💡 Conhece todos os recursos do equipamento?

Além disso, temos *consumíveis em promoção* este mês com condições especiais para clientes fiéis como você!

Quer saber mais?`
    },
    'Campanha Potenciais Clientes': {
      type: 'engagement',
      contacts: [
        { name: 'Dr. Lucas Ferreira', phone: '(14) 99111-2233', clinic: 'Vet Life', profile: 'clínica média' },
        { name: 'Dra. Beatriz Alves', phone: '(11) 95432-1098', clinic: 'Animal Care', profile: 'hospital veterinário' }
      ],
      messageTemplate: (contact) => `Olá Dr(a). ${contact.name}! 👋

Meu nome é [Vendedor] da NR22, especializada em equipamentos laboratoriais veterinários.

Pesquisei sobre a ${contact.clinic} e fiquei impressionado com o trabalho de vocês! 

Gostaria de entender melhor como funciona o laboratório da clínica:
🔬 Vocês terceirizam os exames atualmente?
⏱️ Qual o tempo médio de resultado?
📈 Volume mensal aproximado?

Talvez possamos ajudar a *otimizar custos e agilizar diagnósticos*.

Posso ligar rapidamente para conversar?`
    },
    'Campanha Clientes Sem Compras': {
      type: 'reactivation',
      contacts: [
        { name: 'Dr. Fernando Souza', phone: '(14) 99444-5555', clinic: 'Pet Saúde', lastContact: '6 meses atrás' },
        { name: 'Dra. Camila Dias', phone: '(11) 94321-0987', clinic: 'Vet Total', lastContact: '4 meses atrás' }
      ],
      messageTemplate: (contact) => `Oi Dr(a). ${contact.name}! 

Espero que esteja tudo bem com você e com a ${contact.clinic}! 

Faz tempo que não conversamos (${contact.lastContact}). Queria:

1️⃣ Saber como estão as coisas na clínica
2️⃣ Entender se ainda há interesse em equipamentos
3️⃣ Mostrar as *novidades* que chegaram

Não quero ser chato, mas sinto que podemos realmente ajudar a ${contact.clinic} a crescer.

Topa um café (virtual ou presencial)? 😊`
    },
    'Campanha Leads Fracos': {
      type: 'engagement',
      contacts: [
        { name: 'Dr. Alexandre Pinto', phone: '(14) 99666-7788', clinic: 'Clínica Pet', source: 'site' },
        { name: 'Dra. Patrícia Mendes', phone: '(11) 93210-9876', clinic: 'Vet House', source: 'indicação' }
      ],
      messageTemplate: (contact) => `Olá Dr(a). ${contact.name}! 👋

Vi que você demonstrou interesse em conhecer mais sobre equipamentos veterinários.

Antes de mais nada, queria entender melhor sua necessidade:

❓ O que motivou a busca por equipamentos?
🏥 Como funciona o laboratório da ${contact.clinic} hoje?
🎯 Qual o principal desafio que gostaria de resolver?

*Não vou empurrar venda*, só quero entender se e como podemos ajudar de verdade.

Me conta um pouco?`
    },
    'Campanha Leads Inativos': {
      type: 'engagement',
      contacts: [
        { name: 'Dr. Gabriel Nunes', phone: '(14) 99777-8899', clinic: 'Pet Med', daysInactive: 90 },
        { name: 'Dra. Fernanda Lopes', phone: '(11) 92109-8765', clinic: 'Animal Hospital', daysInactive: 120 }
      ],
      messageTemplate: (contact) => `Oi Dr(a). ${contact.name}!

Faz ${contact.daysInactive} dias que conversamos sobre equipamentos para a ${contact.clinic}.

Sei que às vezes os planos mudam ou o timing não é o ideal. Por isso queria perguntar:

🔄 Ainda faz sentido continuar conversando?
⏳ Prefere que eu entre em contato mais para frente?
❌ Ou prefere que eu não envie mais mensagens?

*Seja sincero(a)!* Não quero tomar seu tempo se não for o momento certo.

O que acha?`
    },
    'Campanha Leads Novos': {
      type: 'engagement',
      contacts: [
        { name: 'Dr. Ricardo Campos', phone: '(14) 99888-9900', clinic: 'Vet Center', source: 'formulário web' },
        { name: 'Dra. Mariana Torres', phone: '(11) 91098-7654', clinic: 'Pet Clinic', source: 'Google' }
      ],
      messageTemplate: (contact) => `Olá Dr(a). ${contact.name}! 👋

Bem-vindo(a) à NR22! 

Vi que você se interessou em conhecer nossos equipamentos laboratoriais veterinários.

Trabalho há anos no mercado veterinário e ajudo clínicas como a ${contact.clinic} a:
✅ Reduzir custos com terceirização
✅ Ter resultados em minutos (não dias)
✅ Aumentar a confiança dos tutores

Antes de qualquer coisa, gostaria de *fazer algumas perguntas* para entender se realmente faz sentido conversarmos.

Topa? 😊

PS: Sem pressão, só quero ajudar!`
    },
    'Campanha Novos Leads': {
      type: 'engagement',
      contacts: [
        { name: 'Dr. Eduardo Silva', phone: '(14) 99000-1122', clinic: 'Clínica Vet Pro', date: 'hoje' },
        { name: 'Dra. Sofia Costa', phone: '(11) 90987-6543', clinic: 'Pet Health', date: 'ontem' }
      ],
      messageTemplate: (contact) => `Oi Dr(a). ${contact.name}! 

Que legal ter você aqui! 🎉

Vi que você acabou de se cadastrar (${contact.date}) para conhecer mais sobre equipamentos veterinários.

Para não perder tempo, vou direto ao ponto:

📞 Prefere que eu *ligue* ou continuo por WhatsApp?
📅 Tem algum horário melhor para conversarmos?
🎯 Qual sua maior dor hoje no laboratório da ${contact.clinic}?

Responde o que for mais fácil para você!

Estou aqui para ajudar 😊`
    }
  };

  const campaignData = campaignMessages[campaign?.name] || campaignMessages['Campanha Leads Novos'];
  const contact = campaignData.contacts[selectedContact];
  const message = campaignData.messageTemplate(contact);

  return (
    <Card className="border-2 border-green-300 bg-gradient-to-br from-green-50 to-white">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <MessageSquare className="w-6 h-6 text-green-600" />
              {campaign?.name || 'Exemplo de Mensagem'}
            </CardTitle>
            <CardDescription className="mt-2">
              Exemplo de como as mensagens serão enviadas via WhatsApp
            </CardDescription>
          </div>
          <Badge className="bg-green-600">
            {campaignData.type === 'upsell' ? 'Venda' : 
             campaignData.type === 'reactivation' ? 'Reativação' : 'Engajamento'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Seletor de Contato */}
        <div>
          <div className="text-sm font-semibold text-slate-700 mb-3">
            Escolha um contato de exemplo:
          </div>
          <div className="flex gap-3 flex-wrap">
            {campaignData.contacts.map((c, idx) => (
              <Button
                key={idx}
                variant={selectedContact === idx ? 'default' : 'outline'}
                onClick={() => setSelectedContact(idx)}
                className="gap-2"
              >
                <User className="w-4 h-4" />
                {c.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Informações do Contato */}
        <div className="bg-white rounded-lg border-2 border-slate-200 p-4">
          <div className="text-sm font-semibold text-slate-700 mb-3">
            📋 Informações do Contato:
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-500" />
              <span><strong>Nome:</strong> {contact.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-500" />
              <span><strong>Telefone:</strong> {contact.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-500" />
              <span><strong>Clínica:</strong> {contact.clinic}</span>
            </div>
            {contact.lastPurchase && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span><strong>Última Compra:</strong> {contact.lastPurchase}</span>
              </div>
            )}
          </div>
        </div>

        {/* Preview da Mensagem WhatsApp */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-green-600" />
            <div className="text-sm font-semibold text-slate-700">
              Mensagem que será enviada:
            </div>
          </div>
          
          {/* Simulação de WhatsApp */}
          <div className="bg-[#ECE5DD] rounded-lg p-4 max-w-2xl">
            <div className="bg-white rounded-lg rounded-tl-none p-4 shadow-sm">
              <div className="whitespace-pre-wrap text-sm text-slate-800">
                {message}
              </div>
              <div className="text-xs text-slate-400 mt-2 text-right">
                {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </div>

        {/* Features da Mensagem */}
        <div className="bg-blue-50 rounded-lg border-2 border-blue-200 p-4">
          <div className="text-sm font-semibold text-blue-900 mb-3">
            ✨ Esta mensagem é personalizada com:
          </div>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span><strong>Nome do veterinário/proprietário</strong> (tratamento personalizado)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span><strong>Nome da clínica</strong> (mostra que você pesquisou)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span><strong>Contexto específico</strong> (histórico de compras, interesse anterior, etc)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span><strong>Tom consultivo</strong> (não é vendedor chato, é consultor)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span><strong>Call-to-action claro</strong> (próximo passo definido)</span>
            </li>
          </ul>
        </div>

        {/* Botão de Ação */}
        <div className="flex justify-center pt-4">
          <Button className="bg-green-600 hover:bg-green-700 gap-2 text-lg py-6 px-8">
            <Send className="w-5 h-5" />
            Enviar Esta Mensagem Agora
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}