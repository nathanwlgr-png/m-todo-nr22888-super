import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Sparkles, Users, Mail, MessageSquare, Share2 } from 'lucide-react';
import AIContentPersonalizer from '@/components/AIContentPersonalizer';
import BulkContentGenerator from '@/components/BulkContentGenerator';

export default function AIContentStudio() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list(),
  });

  const allContacts = [...clients, ...leads];
  const filteredContacts = allContacts.filter(c => 
    c.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.company?.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 10);

  return (
    <div className="space-y-4 pb-20">
      <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Sparkles className="w-6 h-6" />
            Estúdio de Conteúdo IA
          </CardTitle>
          <p className="text-purple-100">
            Emails, WhatsApp e redes sociais personalizados por IA
          </p>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <Mail className="w-8 h-8 text-indigo-600 mb-2" />
            <p className="text-sm font-semibold">Email Marketing</p>
            <p className="text-xs text-slate-600">Prospecção e follow-up</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <MessageSquare className="w-8 h-8 text-green-600 mb-2" />
            <p className="text-sm font-semibold">WhatsApp</p>
            <p className="text-xs text-slate-600">Sequências automáticas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Share2 className="w-8 h-8 text-cyan-600 mb-2" />
            <p className="text-sm font-semibold">Redes Sociais</p>
            <p className="text-xs text-slate-600">LinkedIn e Instagram</p>
          </CardContent>
        </Card>
      </div>

      <BulkContentGenerator />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Geração Individual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Buscar cliente ou lead..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {searchTerm && (
            <div className="space-y-2">
              {filteredContacts.map(contact => (
                <div
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className="p-3 bg-slate-50 rounded hover:bg-slate-100 cursor-pointer"
                >
                  <p className="font-semibold text-sm">{contact.first_name || contact.full_name}</p>
                  <p className="text-xs text-slate-600">{contact.company || contact.city}</p>
                </div>
              ))}
            </div>
          )}

          {selectedContact && (
            <AIContentPersonalizer contact={selectedContact} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}