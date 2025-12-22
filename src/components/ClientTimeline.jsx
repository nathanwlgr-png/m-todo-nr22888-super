import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from 'date-fns';
import { 
  Calendar, 
  Mail, 
  Phone, 
  FileText, 
  DollarSign,
  MessageSquare,
  CheckCircle
} from 'lucide-react';

const getEventIcon = (type) => {
  const icons = {
    visit: Calendar,
    email: Mail,
    call: Phone,
    followup: MessageSquare,
    sale: DollarSign,
    document: FileText,
    task: CheckCircle
  };
  return icons[type] || Calendar;
};

const getEventColor = (type) => {
  const colors = {
    visit: 'bg-blue-100 text-blue-700 border-blue-300',
    email: 'bg-purple-100 text-purple-700 border-purple-300',
    call: 'bg-green-100 text-green-700 border-green-300',
    followup: 'bg-orange-100 text-orange-700 border-orange-300',
    sale: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    document: 'bg-indigo-100 text-indigo-700 border-indigo-300',
    task: 'bg-amber-100 text-amber-700 border-amber-300'
  };
  return colors[type] || 'bg-slate-100 text-slate-700 border-slate-300';
};

export default function ClientTimeline({ events }) {
  if (!events || events.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-500">Nenhuma interação registrada</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event, index) => {
        const Icon = getEventIcon(event.type);
        const colorClass = getEventColor(event.type);

        return (
          <Card key={index} className="p-4 relative">
            {/* Timeline connector */}
            {index < events.length - 1 && (
              <div className="absolute left-9 top-16 w-0.5 h-8 bg-slate-200"></div>
            )}

            <div className="flex gap-3">
              <div className={`w-10 h-10 rounded-full ${colorClass} border-2 flex items-center justify-center shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <p className="font-semibold text-slate-800">{event.title}</p>
                    <p className="text-xs text-slate-500">
                      {format(parseISO(event.date), "dd/MM/yyyy 'às' HH:mm")}
                    </p>
                  </div>
                  {event.badge && (
                    <Badge variant="outline" className="text-xs">
                      {event.badge}
                    </Badge>
                  )}
                </div>
                
                {event.description && (
                  <p className="text-sm text-slate-600 mt-2">{event.description}</p>
                )}

                {event.metadata && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(event.metadata).map(([key, value]) => (
                      <span key={key} className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded">
                        {key}: {value}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}