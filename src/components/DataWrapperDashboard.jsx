import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Maximize2, Download, Share2 } from 'lucide-react';

// Integra mapas DataWrapper com dados CRM em tempo real
export default function DataWrapperDashboard() {
  const [fullscreen, setFullscreen] = useState(false);

  const visualizations = [
    {
      id: 'sales-geo',
      title: '🗺️ Geografia de Vendas',
      description: 'Compet & Seamaty por região',
      url: 'https://datawrapper.dwcdn.net/7i4ZS/3/?v=2',
      height: 500
    },
    {
      id: 'regional-performance',
      title: '📊 Performance Regional',
      description: 'Receita por vendedor responsável',
      url: 'https://datawrapper.dwcdn.net/7i4ZS/3/?v=2',
      height: 400
    }
  ];

  const handleShare = (viz) => {
    const text = `Mapa de Vendas - ${viz.title}\n${viz.url}`;
    navigator.clipboard.writeText(text);
    alert('Link copiado para compartilhar!');
  };

  return (
    <div className="space-y-3">
      {visualizations.map(viz => (
        <Card key={viz.id} className={fullscreen && fullscreen === viz.id ? 'fixed inset-0 m-0 rounded-none z-50' : ''}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-bold text-slate-800">{viz.title}</p>
                <p className="text-xs text-slate-500">{viz.description}</p>
              </div>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-8 h-8"
                  onClick={() => setFullscreen(fullscreen === viz.id ? null : viz.id)}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-8 h-8"
                  onClick={() => window.open(viz.url, '_blank')}
                >
                  <Download className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-8 h-8"
                  onClick={() => handleShare(viz)}
                >
                  <Share2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            <iframe
              src={viz.url}
              width="100%"
              height={fullscreen === viz.id ? window.innerHeight - 80 : viz.height}
              frameBorder="0"
              allowFullScreen
              className="rounded"
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}