import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function PostCalendar({ scheduledPosts = [] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = useMemo(() => (
    eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })
  ), [currentMonth]);

  const firstDayOfWeek = startOfMonth(currentMonth).getDay();
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const getPostsForDay = (day) => scheduledPosts.filter(p => (p.scheduled_at || p.date) && isSameDay(new Date(p.scheduled_at || p.date), day));

  return (
    <div className="bg-white rounded-2xl border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-800 capitalize">
          {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
        </h3>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
            onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1))}>‹</Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
            onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1))}>›</Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-slate-400 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e-${i}`} />)}
        {days.map(day => {
          const posts = getPostsForDay(day);
          return (
            <div
              key={day.toISOString()}
              className={`relative aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-medium
                ${isToday(day) ? 'bg-purple-600 text-white' : 'text-slate-700 hover:bg-slate-50'}
              `}
            >
              {format(day, 'd')}
              {posts.length > 0 && (
                <span className={`absolute bottom-0.5 w-1.5 h-1.5 rounded-full ${isToday(day) ? 'bg-white' : 'bg-pink-500'}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Posts agendados</p>
        {scheduledPosts.length === 0 ? (
          <p className="text-xs text-slate-400 py-2">Nenhum post agendado ainda. Gere conteúdo na aba Fontes!</p>
        ) : (
          scheduledPosts.slice(0, 8).map((post, i) => (
            <div key={i} className="flex items-center gap-2 bg-purple-50 rounded-lg p-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-700 truncate">{post.label || post.client_name || 'Post'}</p>
                <p className="text-[10px] text-slate-400">
                  {post.scheduled_at || post.date ? format(new Date(post.scheduled_at || post.date), "dd/MM HH:mm", { locale: ptBR }) : '—'} • {post.post_status || post.format || 'agendado'}
                </p>
              </div>
              <Badge className="text-[10px] bg-purple-100 text-purple-600 border-0 shrink-0">{post.source || 'instagram'}</Badge>
            </div>
          ))
        )}
      </div>
    </div>
  );
}