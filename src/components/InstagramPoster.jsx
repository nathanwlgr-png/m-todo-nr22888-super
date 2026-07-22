import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import InstagramConnectionCard from '@/components/instagram/InstagramConnectionCard';
import InstagramPostQueue from '@/components/instagram/InstagramPostQueue';

const connectorId = '6a5efcdbac896b7758ca5c9c';

export default function InstagramPoster({ content, hashtags = [], imageUrl: initialImageUrl = '', campaign = 'Oferta NR22888', onQueued, connectionOnly = false }) {
  const [user, setUser] = useState(null);
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishingId, setPublishingId] = useState(null);
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [editableContent, setEditableContent] = useState(content || '');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');

  useEffect(() => { setEditableContent(content || ''); }, [content]);

  const fetchStatus = async () => {
    try {
      const response = await base44.functions.invoke('instagramPublish', { action: 'status' });
      setConnected(true);
      setAccount(response.data.account);
      setPosts(response.data.posts || []);
    } catch {
      setConnected(false);
      setAccount(null);
    }
  };

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (authenticated) => {
      if (authenticated) {
        setUser(await base44.auth.me());
        await fetchStatus();
      }
      setLoading(false);
    });
  }, []);

  const connect = async () => {
    const url = await base44.connectors.connectAppUser(connectorId);
    const popup = window.open(url, '_blank');
    const timer = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        fetchStatus();
      }
    }, 500);
  };

  const disconnect = async () => {
    await base44.connectors.disconnectAppUser(connectorId);
    setConnected(false);
    setAccount(null);
    setPosts([]);
  };

  const uploadImage = async (file) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(file_url);
    } catch (error) { toast.error(error.message || 'Erro ao enviar a imagem.'); }
    finally { setUploadingImage(false); }
  };

  const schedule = async () => {
    if (!editableContent || !imageUrl || !scheduleDate) return toast.error('Informe legenda, imagem e data.');
    setSaving(true);
    try {
      const response = await base44.functions.invoke('instagramPublish', {
        action: 'schedule',
        caption: editableContent,
        image_url: imageUrl,
        hashtags,
        campaign,
        scheduled_at: new Date(scheduleDate).toISOString()
      });
      setPosts((current) => [response.data.post, ...current]);
      onQueued?.({ ...response.data.post, date: response.data.post.scheduled_at, label: campaign });
      toast.success('Oferta adicionada à sua fila.');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const publish = async (postId) => {
    setPublishingId(postId);
    try {
      await base44.functions.invoke('instagramPublish', { action: 'publish', post_id: postId });
      await fetchStatus();
      toast.success('Oferta publicada no Instagram.');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setPublishingId(null);
    }
  };

  return (
    <div className="mt-4 space-y-4">
      <InstagramConnectionCard
        user={user}
        connected={connected}
        account={account}
        loading={loading}
        onLogin={() => base44.auth.redirectToLogin()}
        onConnect={connect}
        onDisconnect={disconnect}
      />
      {connectionOnly ? (connected && <Card>
        <CardHeader><CardTitle className="text-sm">Minha fila de ofertas</CardTitle></CardHeader>
        <CardContent><InstagramPostQueue posts={posts} publishingId={publishingId} onPublish={publish} /></CardContent>
      </Card>) : connected && <>
        <Card>
          <CardHeader><CardTitle className="text-sm">Agendar oferta na minha fila</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {imageUrl && <img src={imageUrl} alt="Prévia da oferta" className="h-48 w-full rounded-lg object-cover" />}
            <Textarea value={editableContent} onChange={(event) => setEditableContent(event.target.value)} rows={7} placeholder="Revise a legenda antes de publicar" />
            <Input type="file" accept="image/*" onChange={(event) => uploadImage(event.target.files?.[0])} disabled={uploadingImage} />
            <Input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="Ou informe uma URL pública" />
            <Input type="datetime-local" value={scheduleDate} onChange={(event) => setScheduleDate(event.target.value)} />
            <Button className="w-full gap-2 bg-pink-600 hover:bg-pink-700" onClick={schedule} disabled={saving || uploadingImage || !editableContent || !imageUrl || !scheduleDate}>
              {saving ? <Loader2 className="animate-spin" /> : <Send />} Adicionar à fila
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Minha fila de ofertas</CardTitle></CardHeader>
          <CardContent><InstagramPostQueue posts={posts} publishingId={publishingId} onPublish={publish} /></CardContent>
        </Card>
      </>}
    </div>
  );
}