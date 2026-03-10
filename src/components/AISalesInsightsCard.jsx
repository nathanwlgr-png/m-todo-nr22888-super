import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, TrendingUp, Clock } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

const AISalesInsightsCard = ({ title, description, items, type }) => {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <TrendingUp className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        <CardDescription className="text-sm text-muted-foreground mb-4">{description}</CardDescription>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum {type} encontrado com insights de IA.</p>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="border-b pb-3 last:border-b-0 last:pb-0">
                <h4 className="font-medium text-sm text-foreground">{item.full_name || item.client_name || item.name || `ID: ${item.id}`}</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Probabilidade: <span className="font-semibold text-green-600">{item.conversion_probability || item.health_score || 'N/A'}%</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                  <Clock className="h-3 w-3 mr-1" /> Ação: {item.next_best_action || item.ai_next_best_action || 'Sem ação definida'}
                </p>
                <Link to={createPageUrl(type === 'lead' ? `LeadProfile?id=${item.id}` : `ClientProfile?id=${item.id}`)}>
                  <Button variant="link" size="sm" className="px-0 mt-2 text-xs">
                    Ver Perfil <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AISalesInsightsCard;