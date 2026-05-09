import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Send, AlertTriangle, Loader2, Instagram, Settings } from 'lucide-react';
import { toast } from 'sonner';

export default function InstagramPoster({ content, hashtags, imageUrl, campaign }) {
  const [isConnected, setIsConnected] = useState(true);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const queryClient = useQueryClient();

  const { data: posts = [] } = useQuery({
    queryKey: ['instagram-posts'],
    queryFn: () => base44.entities.InstagramPost?.list('-created_date', 20).catch(() => []),
    staleTime: 10 * 60 * 1000,
  });

  // Publicar no Instagram
  const publishMutation = useMutation({
    mutationFn: async (payload) => {
      toast.info('📸 Publicando no Instagram...');
      const result = await base44.functions.invoke('instagramPublish', payload);
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['instagram-posts'] });
      toast.success('✅ Publicado no Instagram!');
    },
    onError: (err) => toast.error('Erro: ' + err.message),
  });

  const handlePublish = async () => {
    if (!content) {
      toast.error('Caption vazio');
      return;
    }

    publishMutation.mutate({
      caption: content,
      image_url: imageUrl,
      hashtags: hashtags || [],
      campaign: campaign || 'Geral',
      scheduled_at: scheduling ? scheduleDate : null,
    });
  };

  if (!isConnected) {
    return (
      <Card className="border-orange-300 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-900">
            <Instagram className="w-5 h-5" />
            Instagram Desconectado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-orange-800">Conecte sua conta Instagram para publicar direto da app.</p>
          <Button
            onClick={() => setShowSettings(true)}
            className="w-full gap-2 bg-orange-600 hover:bg-orange-700"
          >
            <Settings className="w-4 h-4" />
            Conectar Instagram
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      
      {/* PREVIEW */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Instagram className="w-5 h-5 text-pink-600" />
            Preview do Post
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          
          {/* Imagem */}
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Preview"
              className="w-full h-64 object-cover rounded-lg"
            />
          )}

          {/* Caption */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <p className="text-sm text-slate-900 whitespace-pre-wrap">{content}</p>
            {hashtags && hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {hashtags.map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Opções */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={scheduling}
                onChange={(e) => setScheduling(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm font-semibold">Agendar para depois</span>
            </label>

            {scheduling && (
              <input
                type="datetime-local"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="w-full px-3 py-2 rounded border border-slate-300 text-sm"
              />
            )}
          </div>

          {/* Botão Publicar */}
          <Button
            onClick={handlePublish}
            disabled={publishMutation.isPending || !content}
            className="w-full gap-2 bg-pink-600 hover:bg-pink-700 text-white font-semibold"
            size="lg"
          >
            {publishMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {scheduling ? 'Agendar no Instagram' : 'Publicar Agora'}
          </Button>
        </CardContent>
      </Card>

      {/* HISTÓRICO */}
      {posts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">📊 Últimos Posts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-48 overflow-y-auto">
            {posts.slice(0, 5).map(post => (
              <div key={post.id} className="p-2 rounded bg-slate-50 border border-slate-200 text-xs">
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-slate-900">{post.campaign}</span>
                  <Badge
                    className={
                      post.post_status === 'publicado'
                        ? 'bg-green-600'
                        : post.post_status === 'agendado'
                        ? 'bg-blue-600'
                        : 'bg-slate-600'
                    }
                  >
                    {post.post_status}
                  </Badge>
                </div>
                <p className="text-slate-600 mt-1 line-clamp-2">{post.post_content}</p>
                {post.instagram_link && (
                  <a
                    href={post.instagram_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-600 hover:underline text-xs mt-1 block"
                  >
                    Ver no Instagram →
                  </a>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

    </div>
  );
}