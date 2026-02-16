import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

// Painéis PCR VQ1 com preços São Paulo (conforme tabela enviada)
const VQ1_PANELS = [
  {
    id: 'CVP4',
    category: 'Canino',
    name: 'Canine Gastrointestinal Panel 4',
    parameters: ['CCoV', 'CPV', 'G. lamblia', 'T. foetus'],
    price_sp: 1524.75,
    status: 'ativo'
  },
  {
    id: 'CVR1',
    category: 'Canino',
    name: 'Canine Respiratory Panel (CDV - Cinomose)',
    parameters: ['CDV'],
    price_sp: 535.38,
    status: 'ativo'
  },
  {
    id: 'CVR4',
    category: 'Canino',
    name: 'Canine Respiratory Panel 4',
    parameters: ['CDV', 'CAV-2', 'CPIV', 'Bb'],
    price_sp: 1511.14,
    status: 'ativo'
  },
  {
    id: 'CVR6',
    category: 'Canino',
    name: 'Canine Respiratory Panel 6',
    parameters: ['M.cynos', 'Bb', 'CAV-2', 'CPIV', 'CDV', 'CIV'],
    price_sp: 1899.54,
    status: 'ativo'
  },
  {
    id: 'CVBD2',
    category: 'Canino',
    name: 'Canine Vector-borne Diseases Panel 2',
    parameters: ['Babesia canis', 'Babesia gibsoni'],
    price_sp: 857.28,
    status: 'ativo'
  },
  {
    id: 'CVBD6',
    category: 'Canino',
    name: 'Canine Vector-borne Diseases Panel 6',
    parameters: ['B. canis', 'B. gibsoni', 'M. haemocanis', 'H. canis', 'E. canis', 'A. phagocytophilum'],
    price_sp: 2150.40,
    status: 'ativo'
  },
  {
    id: 'CZP2',
    category: 'Canino',
    name: 'Canine Zoonosis Panel 2',
    parameters: ['Leptospira', 'Toxoplasma gondii'],
    price_sp: 857.28,
    status: 'ativo'
  },
  {
    id: 'FRP',
    category: 'Felino',
    name: 'Feline Anemia Panel 6',
    parameters: ['FeLV', 'FIV', 'Mycoplasma', 'Bartonella', 'Hemotropic', 'Outros'],
    price_sp: 2150.40,
    status: 'ativo'
  },
  {
    id: 'FGP4',
    category: 'Felino',
    name: 'Feline Gastrointestinal Panel 4',
    parameters: ['FCoV', 'FPV', 'G. lamblia', 'T. foetus'],
    price_sp: 1524.75,
    status: 'ativo'
  },
  {
    id: 'FIP2',
    category: 'Felino',
    name: 'Feline Infectious Peritonitis Panel 2',
    parameters: ['FCoV', 'FIPV'],
    price_sp: 857.28,
    status: 'ativo'
  },
  {
    id: 'FRP5',
    category: 'Felino',
    name: 'Feline Respiratory Panel 5',
    parameters: ['Bb', 'M.felis', 'C.felis', 'FHV-1', 'FCV'],
    price_sp: 1899.54,
    status: 'ativo'
  },
  {
    id: 'FZP2',
    category: 'Felino',
    name: 'Feline Zoonosis Panel 2',
    parameters: ['Toxoplasma gondii', 'Bartonella henselae'],
    price_sp: 857.28,
    status: 'ativo'
  }
];

export default function VQ1PanelPricing() {
  const [panels, setPanels] = useState(VQ1_PANELS);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  const handleEdit = (panel) => {
    setEditingId(panel.id);
    setEditData({ ...panel });
  };

  const handleSave = (id) => {
    const updated = panels.map(p => p.id === id ? editData : p);
    setPanels(updated);
    setEditingId(null);
    toast.success(`✅ Painel atualizado!`);
  };

  const handleChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: field === 'price_sp' ? parseFloat(value) || 0 : value
    }));
  };

  const canineTotal = panels
    .filter(p => p.category === 'Canino')
    .reduce((sum, p) => sum + p.price_sp, 0);
  
  const felineTotal = panels
    .filter(p => p.category === 'Felino')
    .reduce((sum, p) => sum + p.price_sp, 0);

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">🧬 Painéis PCR VQ1 Seamaty</h1>
        <p className="text-slate-600">Tabela de Preços São Paulo 2026 - Conforme Catálogo Oficial</p>
      </div>

      {/* Resumo por Categoria */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm font-semibold text-blue-900">Painéis Canino</p>
            <p className="text-3xl font-bold text-blue-600">{panels.filter(p => p.category === 'Canino').length}</p>
            <p className="text-xs text-blue-700 mt-2">
              Total: R$ {canineTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-6">
            <p className="text-sm font-semibold text-purple-900">Painéis Felino</p>
            <p className="text-3xl font-bold text-purple-600">{panels.filter(p => p.category === 'Felino').length}</p>
            <p className="text-xs text-purple-700 mt-2">
              Total: R$ {felineTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <p className="text-sm font-semibold text-green-900">Catálogo Completo</p>
            <p className="text-3xl font-bold text-green-600">{panels.length}</p>
            <p className="text-xs text-green-700 mt-2">
              Total: R$ {(canineTotal + felineTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Painéis Canino */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm">CANINO</span>
          {panels.filter(p => p.category === 'Canino').length} painéis
        </h2>
        <div className="space-y-3">
          {panels.filter(p => p.category === 'Canino').map((panel) => (
            <PanelCard 
              key={panel.id} 
              panel={panel}
              isEditing={editingId === panel.id}
              editData={editData}
              onEdit={() => handleEdit(panel)}
              onSave={() => handleSave(panel.id)}
              onCancel={() => setEditingId(null)}
              onChange={handleChange}
            />
          ))}
        </div>
      </div>

      {/* Painéis Felino */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <span className="bg-purple-600 text-white px-4 py-1 rounded-full text-sm">FELINO</span>
          {panels.filter(p => p.category === 'Felino').length} painéis
        </h2>
        <div className="space-y-3">
          {panels.filter(p => p.category === 'Felino').map((panel) => (
            <PanelCard 
              key={panel.id} 
              panel={panel}
              isEditing={editingId === panel.id}
              editData={editData}
              onEdit={() => handleEdit(panel)}
              onSave={() => handleSave(panel.id)}
              onCancel={() => setEditingId(null)}
              onChange={handleChange}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PanelCard({ panel, isEditing, editData, onEdit, onSave, onCancel, onChange }) {
  if (isEditing) {
    return (
      <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700">ID</label>
            <input type="text" value={editData.id} disabled className="w-full px-2 py-1 bg-slate-100 rounded text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700">Preço SP (R$)</label>
            <input
              type="number"
              value={editData.price_sp}
              onChange={(e) => onChange('price_sp', e.target.value)}
              className="w-full px-2 py-1 border rounded text-sm font-bold text-green-600"
              step="0.01"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700">Nome</label>
          <input
            type="text"
            value={editData.name}
            onChange={(e) => onChange('name', e.target.value)}
            className="w-full px-2 py-1 border rounded text-sm font-semibold"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={onSave} className="bg-green-600 hover:bg-green-700 text-xs">
            <Save className="w-3 h-3 mr-1" /> Salvar
          </Button>
          <Button onClick={onCancel} variant="outline" className="text-xs">
            <X className="w-3 h-3 mr-1" /> Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className="hover:shadow-lg transition border-l-4 border-l-blue-500">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-600">{panel.id}</Badge>
              <h3 className="font-semibold text-slate-900">{panel.name}</h3>
            </div>
            <div className="flex flex-wrap gap-1">
              {panel.parameters.map((param, idx) => (
                <Badge key={idx} variant="outline" className="text-xs bg-slate-100">
                  {param}
                </Badge>
              ))}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-bold text-green-600">
              R$ {panel.price_sp.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <Button
              size="sm"
              onClick={onEdit}
              className="mt-2 bg-blue-600 hover:bg-blue-700 text-xs"
            >
              <Edit2 className="w-3 h-3 mr-1" /> Editar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}