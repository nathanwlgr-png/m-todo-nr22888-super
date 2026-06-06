import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { X, MapPin, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NearbyOpportunitiesModal({ onClose }) {
  const [userLocation, setUserLocation] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);

  const { data: clients = [] } = useQuery({
    queryKey: ['nearby-clients'],
    queryFn: () => base44.entities.Client.list('-purchase_score', 100),
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      }, () => setUserLocation(null));
    }
  }, []);

  useEffect(() => {
    if (!userLocation || clients.length === 0) return;

    const loadNearby = async () => {
      const nearby = [];
      
      for (const client of clients.slice(0, 20)) {
        if (!client.city) continue;
        
        try {
          const analysis = await base44.functions.invoke('analyzeSeamatyOpportunity', {
            client_id: client.id,
          });
          
          nearby.push({
            ...client,
            analysis: analysis.data,
            distance: Math.floor(Math.random() * 50) + 1, // Placeholder
          });
        } catch (e) {
          // Silent fail
        }
      }

      setOpportunities(nearby.sort((a, b) => (a.distance || 999) - (b.distance || 999)));
      setLoading(false);
    };

    loadNearby();
  }, [userLocation, clients]);

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full rounded-t-2xl p-4" style={{ background: '#0a0a0a', maxHeight: '90vh', overflow: 'auto' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-white">📍 Oportunidades Próximas</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#1a1a1a' }}>
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-400">Carregando...</div>
        ) : opportunities.length === 0 ? (
          <div className="text-center py-8 text-slate-400">Nenhuma oportunidade encontrada</div>
        ) : (
          <div className="space-y-2">
            {opportunities.map(opp => (
              <Link key={opp.id} to={`/ClientProfile?id=${opp.id}`} onClick={onClose}>
                <div className="rounded-xl p-3 flex items-center justify-between" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.15)' }}>
                  <div>
                    <p className="text-xs font-black text-white">{opp.clinic_name || opp.first_name}</p>
                    <p className="text-[11px] text-slate-400">{opp.city}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: 'rgba(255,68,68,0.15)', color: '#ff4444' }}>
                        {opp.analysis?.score || 0}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(0,255,136,0.1)', color: '#00ff88' }}>
                        {opp.analysis?.recommended_equipment || 'VG2'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-blue-400 font-bold flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{opp.distance}km
                    </p>
                    <ChevronRight className="w-3.5 h-3.5 text-orange-700 mt-2" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}