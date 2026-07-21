import React from 'react';
import { ExternalLink, Loader2, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function InstagramPostQueue({ posts, publishingId, onPublish }) {
  if (!posts.length) return <p className="py-3 text-sm text-muted-foreground">Nenhuma oferta na sua fila.</p>;
  return (
    <div className="space-y-2">
      {posts.map((post) => (
        <div key={post.id} className="rounded-lg border bg-card p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0"><p className="truncate text-sm font-semibold">{post.campaign || 'Oferta NR22888'}</p><p className="text-xs text-muted-foreground">{post.scheduled_at ? new Date(post.scheduled_at).toLocaleString('pt-BR') : 'Publicação imediata'}</p></div>
            <Badge variant="outline">{post.post_status}</Badge>
          </div>
          {post.post_status !== 'publicado' && <Button size="sm" className="mt-3 w-full gap-2" onClick={() => onPublish(post.id)} disabled={publishingId === post.id}>{publishingId === post.id ? <Loader2 className="animate-spin" /> : <Send />} Publicar agora</Button>}
          {post.instagram_link && <a className="mt-2 flex items-center gap-1 text-xs text-pink-600" href={post.instagram_link} target="_blank" rel="noreferrer">Ver publicação <ExternalLink className="h-3 w-3" /></a>}
        </div>
      ))}
    </div>
  );
}