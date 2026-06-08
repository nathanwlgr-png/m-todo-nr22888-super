import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Phone, X, ChevronRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PhoneSearch() {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState('');

  const { data: clients = [] } = useQuery({
    queryKey: ['all-clients-phone'],
    queryFn: () => base44.entities.Client.list('-updated_date', 500),
    staleTime: 120000,
    enabled: open,
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['all-leads-phone'],
    queryFn: () => base44.entities.Lead.list('-updated_date', 300),
    staleTime: 120000,
    enabled: open,
  });

  const digits = phone.replace(/\D/g, '');

  const matchedClients = digits.length >= 4
    ? clients.filter(c => c.phone && c.phone.replace(/\D/g, '').includes(digits))
    : [];

  const matchedLeads = digits.length >= 4
    ? leads.filter(l => l.phone && l.phone.replace(/\D/g, '').includes(digits))
    : [];

  const total = matchedClients.length + matchedLeads.length;

  if (!open) {
    return (
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} title="Buscar por telefone">
        <Phone className="w-5 h-5 text-green-600" />
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-16 px-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b">
          <Phone className="w-5 h-5 text-green-600" />
          <input
            autoFocus
            type="tel"
            placeholder="Digite o telefone ou WhatsApp..."
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="flex-1 text-sm focus:outline-none"
          />
          <button onClick={() => { setOpen(false); setPhone(''); }}>
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {digits.length < 4 && (
          <div className="p-6 text-center text-slate-400 text-sm">
            <Search className="w-8 h-8 mx-auto mb-2 text-slate-200" />
            Digite ao menos 4 dígitos para buscar
          </div>
        )}

        {digits.length >= 4 && total === 0 && (
          <div className="p-6 text-center text-slate-400 text-sm">Nenhum contato encontrado</div>
        )}

        {digits.length >= 4 && total > 0 && (
          <div className="max-h-80 overflow-y-auto">
            {matchedClients.map(c => (
              <Link
                key={c.id}
                to={'/ClientProfile?id=' + c.id}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 border-b last:border-0"
              >
                <div>
                  <p className="font-semibold text-sm">{c.clinic_name || c.full_name}</p>
                  <p className="text-xs text-green-600">{c.phone}</p>
                  <p className="text-xs text-slate-400">Cliente · {c.city || ''}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </Link>
            ))}
            {matchedLeads.map(l => (
              <Link
                key={l.id}
                to={'/Leads?id=' + l.id}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 border-b last:border-0"
              >
                <div>
                  <p className="font-semibold text-sm">{l.full_name}</p>
                  <p className="text-xs text-green-600">{l.phone}</p>
                  <p className="text-xs text-blue-400">Lead · {l.company || ''}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}