import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clipboard, X, Copy, Download } from 'lucide-react';
import { toast } from 'sonner';

/**
 * ÁREA DE TRANSFERÊNCIA FIXA
 * Gerencia documentos para exportação
 */
export default function ClipboardManager() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('clipboard_manager');
    if (saved) {
      setItems(JSON.parse(saved));
    }
  }, []);

  const saveToStorage = (newItems) => {
    localStorage.setItem('clipboard_manager', JSON.stringify(newItems));
    setItems(newItems);
  };

  const addItem = (content, type = 'text') => {
    const newItem = {
      id: Date.now(),
      content,
      type,
      timestamp: new Date().toISOString()
    };
    saveToStorage([newItem, ...items].slice(0, 20));
    toast.success('Adicionado à área de transferência');
  };

  const removeItem = (id) => {
    saveToStorage(items.filter(i => i.id !== id));
  };

  const copyItem = (content) => {
    navigator.clipboard.writeText(content);
    toast.success('Copiado!');
  };

  const clearAll = () => {
    if (confirm('Limpar toda área de transferência?')) {
      saveToStorage([]);
      toast.success('Área limpa');
    }
  };

  // Expor função global para adicionar itens
  useEffect(() => {
    window.addToClipboard = addItem;
  }, [items]);

  return (
    <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clipboard className="w-5 h-5 text-green-600" />
          <h3 className="font-bold text-slate-800">Área de Transferência</h3>
          <Badge className="bg-green-600 text-white">{items.length}</Badge>
        </div>
        {items.length > 0 && (
          <Button size="sm" variant="ghost" onClick={clearAll}>
            Limpar
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-4">
          Nenhum item salvo
        </p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {items.map((item) => (
            <div key={item.id} className="p-2 bg-white rounded border flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-700 truncate">
                  {item.type === 'text' ? 'Texto' : 'Documento'}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {item.content.substring(0, 50)}...
                </p>
                <p className="text-xs text-slate-400">
                  {new Date(item.timestamp).toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="flex gap-1 ml-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyItem(item.content)}
                >
                  <Copy className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeItem(item.id)}
                >
                  <X className="w-3 h-3 text-red-600" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}