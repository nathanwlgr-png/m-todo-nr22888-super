import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Share2, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function ShareProtection({ content, onShare }) {
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const hasPassword = user?.share_password;

  const updatePasswordMutation = useMutation({
    mutationFn: (pwd) => base44.auth.updateMe({ share_password: pwd }),
    onSuccess: () => {
      queryClient.invalidateQueries(['current-user']);
      toast.success('Senha cadastrada com sucesso!');
      setIsSettingPassword(false);
    }
  });

  const handleShare = () => {
    if (!hasPassword) {
      setIsSettingPassword(true);
      toast.error('Cadastre uma senha primeiro!');
      return;
    }
    setShowPasswordDialog(true);
  };

  const verifyAndShare = () => {
    if (password === user.share_password) {
      if (onShare) onShare(content);
      navigator.clipboard.writeText(content);
      toast.success('Conteúdo copiado! Compartilhe com segurança.');
      setShowPasswordDialog(false);
      setPassword('');
    } else {
      toast.error('Senha incorreta!');
    }
  };

  if (isSettingPassword) {
    return (
      <Card className="p-4 bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-300">
        <div className="flex items-center gap-3 mb-4">
          <Lock className="w-6 h-6 text-orange-600" />
          <div>
            <h3 className="font-bold text-slate-800">Cadastre sua Senha</h3>
            <p className="text-xs text-slate-600">Para proteger seus compartilhamentos</p>
          </div>
        </div>
        
        <Input
          type="password"
          placeholder="Digite sua senha de proteção"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-3"
        />
        
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => updatePasswordMutation.mutate(password)}
            disabled={!password || updatePasswordMutation.isPending}
            className="bg-orange-600"
          >
            <Check className="w-4 h-4 mr-1" />
            Salvar
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setIsSettingPassword(false);
              setPassword('');
            }}
          >
            Cancelar
          </Button>
        </div>
      </Card>
    );
  }

  if (showPasswordDialog) {
    return (
      <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300">
        <div className="flex items-center gap-3 mb-4">
          <Lock className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="font-bold text-slate-800">Digite sua Senha</h3>
            <p className="text-xs text-slate-600">Para confirmar o compartilhamento</p>
          </div>
        </div>
        
        <Input
          type="password"
          placeholder="Senha de proteção"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && verifyAndShare()}
          className="mb-3"
        />
        
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={verifyAndShare}
            disabled={!password}
            className="bg-blue-600"
          >
            <Share2 className="w-4 h-4 mr-1" />
            Compartilhar
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setShowPasswordDialog(false);
              setPassword('');
            }}
          >
            Cancelar
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Button
      onClick={handleShare}
      className="w-full bg-green-600 hover:bg-green-700"
    >
      <Share2 className="w-4 h-4 mr-2" />
      Compartilhar com Segurança
    </Button>
  );
}