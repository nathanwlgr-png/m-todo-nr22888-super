import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageCircle, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import WhatsAppChat from '@/components/WhatsAppChat';

export default function WhatsAppInbox() {
  const navigate = useNavigate();
  const [selectedContact, setSelectedContact] = useState(null);

  const { data: messages = [] } = useQuery({
    queryKey: ['all-whatsapp-messages'],
    queryFn: () => base44.entities.WhatsAppMessage.list('-created_date', 500),
    refetchInterval: 5000
  });

  // Agrupar mensagens por contato
  const conversations = useMemo(() => {
    const grouped = messages.reduce((acc, msg) => {
      if (!acc[msg.contact_id]) {
        acc[msg.contact_id] = {
          contact_id: msg.contact_id,
          contact_name: msg.contact_name,
          contact_phone: msg.contact_phone,
          messages: [],
          unread: 0,
          last_message: null,
          last_date: null
        };
      }
      acc[msg.contact_id].messages.push(msg);
      
      // Contar não lidas (mensagens recebidas sem resposta)
      if (msg.direction === 'received') {
        const hasReply = messages.some(m => 
          m.contact_id === msg.contact_id && 
          m.direction === 'sent' && 
          new Date(m.created_date) > new Date(msg.created_date)
        );
        if (!hasReply) acc[msg.contact_id].unread++;
      }

      // Última mensagem
      if (!acc[msg.contact_id].last_date || new Date(msg.created_date) > new Date(acc[msg.contact_id].last_date)) {
        acc[msg.contact_id].last_message = msg.message;
        acc[msg.contact_id].last_date = msg.created_date;
      }

      return acc;
    }, {});

    return Object.values(grouped).sort((a, b) => 
      new Date(b.last_date) - new Date(a.last_date)
    );
  }, [messages]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-white">WhatsApp Business</h1>
          <p className="text-sm text-green-100">{conversations.length} conversas</p>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Conversations List */}
        <div className={`${selectedContact ? 'hidden md:block' : 'block'} w-full md:w-80 border-r bg-white overflow-y-auto`}>
          {conversations.length === 0 ? (
            <div className="p-12 text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">Nenhuma conversa ainda</p>
            </div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.contact_id}
                onClick={() => setSelectedContact(conv)}
                className={`p-4 border-b cursor-pointer hover:bg-slate-50 transition-colors ${
                  selectedContact?.contact_id === conv.contact_id ? 'bg-green-50' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
                      {conv.contact_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{conv.contact_name}</p>
                      <p className="text-xs text-slate-500">{conv.contact_phone}</p>
                    </div>
                  </div>
                  {conv.unread > 0 && (
                    <Badge className="bg-green-500 text-white">{conv.unread}</Badge>
                  )}
                </div>
                <p className="text-sm text-slate-600 truncate mt-2">{conv.last_message}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {format(new Date(conv.last_date), 'dd/MM/yyyy HH:mm')}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Chat Area */}
        <div className={`${selectedContact ? 'block' : 'hidden md:block'} flex-1 flex flex-col bg-[#e5ddd5]`}>
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <div className="bg-white px-4 py-3 border-b flex items-center gap-3">
                <button
                  onClick={() => setSelectedContact(null)}
                  className="md:hidden p-2 -ml-2 rounded-full hover:bg-slate-100"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
                  {selectedContact.contact_name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">{selectedContact.contact_name}</p>
                  <p className="text-xs text-slate-500">{selectedContact.contact_phone}</p>
                </div>
              </div>

              {/* Chat Component */}
              <WhatsAppChat
                contactId={selectedContact.contact_id}
                contactName={selectedContact.contact_name}
                contactPhone={selectedContact.contact_phone}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">Selecione uma conversa</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}