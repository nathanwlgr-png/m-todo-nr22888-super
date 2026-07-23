import { CalendarPlus, ListTodo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ClientQuickActions({ client, busy, onStatusChange, onScheduleVisit, onFollowUp }) {
  const disabled = Boolean(busy?.startsWith(`${client.id}:`));

  return (
    <div className="grid grid-cols-3 gap-1.5 mt-1.5" aria-label={`Ações rápidas de ${client.first_name || 'cliente'}`}>
      <Select value={client.status || 'morno'} onValueChange={(status) => onStatusChange(client, status)} disabled={disabled}>
        <SelectTrigger className="h-11 px-2 text-xs font-bold" aria-label="Atualizar status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="quente">🔥 Quente</SelectItem>
          <SelectItem value="morno">🌡️ Morno</SelectItem>
          <SelectItem value="frio">❄️ Frio</SelectItem>
        </SelectContent>
      </Select>
      <Button size="sm" variant="outline" disabled={disabled} onClick={() => onScheduleVisit(client)} className="h-11 px-2 text-xs font-bold">
        <CalendarPlus className="w-4 h-4" /> Visita
      </Button>
      <Button size="sm" disabled={disabled} onClick={() => onFollowUp(client)} className="h-11 px-2 text-xs font-bold bg-green-600 hover:bg-green-700 text-white">
        <ListTodo className="w-4 h-4" /> Follow-up
      </Button>
    </div>
  );
}