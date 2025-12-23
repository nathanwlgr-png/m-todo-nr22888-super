import React from 'react';
import { Send, Sparkles, MapPin, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

/**
 * Botões organizados em formato de "8" (número oito em pé)
 * Posicionados após o logo "Método NR22"
 */
export default function FloatingButtonsGroup() {
  return (
    <div className="flex items-center gap-2">
      {/* Círculo Superior do 8 */}
      <div className="flex flex-col gap-1">
        <Link to={createPageUrl('WhatsAppInbox')}>
          <button className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg flex items-center justify-center hover:scale-110 transition-transform">
            <Send className="w-5 h-5 text-white" />
          </button>
        </Link>
        
        <Link to={createPageUrl('MarketIntelligence')}>
          <button className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 shadow-lg flex items-center justify-center hover:scale-110 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </button>
        </Link>
      </div>

      {/* Círculo Inferior do 8 */}
      <div className="flex flex-col gap-1">
        <Link to={createPageUrl('ClientsMap')}>
          <button className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg flex items-center justify-center hover:scale-110 transition-transform">
            <MapPin className="w-5 h-5 text-white" />
          </button>
        </Link>
        
        <Link to={createPageUrl('SalesAnalytics')}>
          <button className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-600 shadow-lg flex items-center justify-center hover:scale-110 transition-transform">
            <TrendingUp className="w-5 h-5 text-white" />
          </button>
        </Link>
      </div>
    </div>
  );
}