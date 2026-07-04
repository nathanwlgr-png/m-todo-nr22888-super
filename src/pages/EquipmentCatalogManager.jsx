import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit2, Save, X, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

// Equipamentos Seamaty com imagens (URLs)
const SEAMATY_EQUIPMENT = [
  {
    code: 'VG1',
    name: 'Analisador Veterinário Portátil de Gases e Eletrólitos',
    description: 'Fornece resultados precisos em 4 minutos. 17 parâmetros. Portátil com bateria integrada.',
    specifications: 'Volume: 0,1mL sangue | Tempo: 4 minutos | Parâmetros: 17 | Impressora integrada',
    image_url: 'https://images.unsplash.com/photo-1579154204601-01d82b27ebf5?w=300&h=300&fit=crop',
    price_sp: 45000,
    category: 'Portátil'
  },
  {
    code: 'SMT-120VP',
    name: 'Analisador Bioquímico Multifuncional Totalmente Automático',
    description: 'Testa até 24 parâmetros simultaneamente. 16 perfis. Centrifugadora integrada.',
    specifications: 'Volume: 0,1mL amostra | Parâmetros: 24 | Tempo: 12 minutos | Centrífuga integrada | QR Code',
    image_url: 'https://images.unsplash.com/photo-1576091160550-112173f7f869?w=300&h=300&fit=crop',
    price_sp: 85000,
    category: 'Automático'
  },
  {
    code: 'QT3',
    name: 'Analisador Bioquímico com Tecnologia Microfluídica',
    description: 'Compatível com rotores circulares e setorizados. Menu de testes abrangente.',
    specifications: 'Tecnologia: Microfluídica | Rotores: Circulares/Setorizados | Testes: Bioquímica, eletrólitos, coagulação | Calibração contínua',
    image_url: 'https://images.unsplash.com/photo-1631217316831-c6227db76b6e?w=300&h=300&fit=crop',
    price_sp: 72000,
    category: 'Automático'
  },
  {
    code: '3DX',
    name: 'Seamaty Lab 3Dx - Integrado Bioquímica + Imunofluorescência + Hemogas',
    description: 'Integra 4 análises em 1 dispositivo. Testa 5 amostras simultaneamente.',
    specifications: 'Funções: Bioquímica + Imunofluorescência + Gases + Eletrólitos | Amostras: 5 simultâneas | Tamanho: Pequeno | Automático',
    image_url: 'https://images.unsplash.com/photo-1631217316831-c6227db76b6e?w=300&h=300&fit=crop',
    price_sp: 125000,
    category: 'Integrado'
  },
  {
    code: 'VI1',
    name: 'Analisador de Imunofluorescência Veterinária',
    description: 'Tecnologia de fluoroimunocromatografia com nanocristais de terras raras.',
    specifications: 'Método: Fluoroimunocromatografia | Tecnologia: Nanocristais terras raras | Sensibilidade: Alta | Estabilidade: Excelente',
    image_url: 'https://images.unsplash.com/photo-1579154204601-01d82b27ebf5?w=300&h=300&fit=crop',
    price_sp: 95000,
    category: 'Imunofluorescência'
  },
  {
    code: 'VQ1',
    name: 'Seamaty VQ1 - Analisador Veterinário de PCR em Tempo Real',
    description: 'PCR quantitativa fluorescente com cartucho microfluídico patenteado. Operação fácil em 4 etapas. Resultados em 40 minutos.',
    specifications: 'Velocidade: 10°C/seg | Sensibilidade: 10 cópias/ciclo | Tempo: 40 min/amostra | Cartucho fechado | Tampão: Swab nasof./ocular/oral/anal | Impressora integrada | Peso: 8kg | Curva calibração contínua | 500k resultados memória',
    test_menu: {
      felino: ['Trato Respiratório', 'Patógenos Diarreia', 'Peritonite Infecciosa', 'Anemia'],
      canino: ['Trato Respiratório', 'Patógenos Diarreia', 'Arbovírus', 'Zoonose'],
      parametros: ['FHV-1', 'FCV', 'CHL', 'MYC', 'CPV', 'CDV', 'FIV', 'FeLV', 'Leptospira', 'Toxoplasma', 'Babesia', 'Ehrlichia']
    },
    image_url: 'https://images.unsplash.com/photo-1576091160550-112173f7f869?w=300&h=300&fit=crop',
    price_sp: 155000,
    category: 'PCR'
  },
  {
    code: 'VG2',
    name: 'Analisador 2 em 1 - Imunofluorescência + Hemogas/Eletrólitos',
    description: 'Combina 2 análises em 1 plataforma. Até 11 parâmetros imunoensaio + 17 hemogasometria.',
    specifications: 'Funções: Imunofluorescência + Gases/Eletrólitos | Imunoensaio: 11 parâmetros | Hemogasometria: 17 parâmetros | Tempo: 4-10 min',
    image_url: 'https://images.unsplash.com/photo-1631217316831-c6227db76b6e?w=300&h=300&fit=crop',
    price_sp: 135000,
    category: 'Integrado'
  },
  {
    code: 'VBC50A',
    name: 'Analisador Hematológico Veterinário Automático 5 Partes',
    description: 'Análise detalhada de leucócitos em 5 subgrupos. Analisa 13 espécies.',
    specifications: 'Tipo: 5 partes | Leucócitos: 5 subgrupos | Espécies: 13 analisadas | Parâmetros: 25 + 4 pesquisa | Volume: 20µL | Tela: 10.4"',
    image_url: 'https://images.unsplash.com/photo-1579154204601-01d82b27ebf5?w=300&h=300&fit=crop',
    price_sp: 68000,
    category: 'Hematologia'
  }
];

export default function EquipmentCatalogManager() {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [equipment, setEquipment] = useState(SEAMATY_EQUIPMENT);
  const queryClient = useQueryClient();

  const handleEdit = (item) => {
    setEditingId(item.code);
    setEditData({ ...item });
  };

  const handleSave = (code) => {
    const updated = equipment.map(e => e.code === code ? editData : e);
    setEquipment(updated);
    setEditingId(null);
    toast.success(`✅ ${code} atualizado!`);
  };

  const handleChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: field === 'price_sp' ? parseFloat(value) : value
    }));
  };

  const handleDelete = (code) => {
    setEquipment(equipment.filter(e => e.code !== code));
    toast.success(`❌ ${code} removido!`);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">📊 Catálogo SEAMATY Brasil</h1>
        <p className="text-slate-600">Equipamentos Seamaty - Preços São Paulo 2026</p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Total Equipamentos</p>
            <p className="text-3xl font-bold text-blue-600">{equipment.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Valor Total Catálogo</p>
            <p className="text-3xl font-bold text-green-600">
              R$ {(equipment.reduce((sum, e) => sum + e.price_sp, 0) / 1000).toFixed(0)}k
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Preço Médio</p>
            <p className="text-3xl font-bold text-purple-600">
              R$ {(equipment.reduce((sum, e) => sum + e.price_sp, 0) / equipment.length / 1000).toFixed(0)}k
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Categorias</p>
            <p className="text-3xl font-bold text-orange-600">
              {new Set(equipment.map(e => e.category)).size}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Equipamentos */}
      <div className="space-y-4">
        {equipment.map((item) => (
          <div key={item.code} className="border rounded-lg overflow-hidden hover:shadow-lg transition">
            {editingId === item.code ? (
              /* MODO EDIÇÃO */
              <div className="bg-amber-50 p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Código</label>
                    <Input value={editData.code} disabled className="bg-slate-100" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Categoria</label>
                    <Input
                      value={editData.category}
                      onChange={(e) => handleChange('category', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Nome do Equipamento</label>
                  <Input
                    value={editData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Descrição</label>
                  <textarea
                    value={editData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    className="w-full p-2 border rounded text-sm"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Especificações</label>
                  <textarea
                    value={editData.specifications}
                    onChange={(e) => handleChange('specifications', e.target.value)}
                    className="w-full p-2 border rounded text-sm"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Preço SP (R$)</label>
                    <Input
                      type="number"
                      value={editData.price_sp}
                      onChange={(e) => handleChange('price_sp', e.target.value)}
                      className="text-lg font-bold text-green-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">URL Imagem</label>
                    <Input
                      value={editData.image_url}
                      onChange={(e) => handleChange('image_url', e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => handleSave(item.code)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </Button>
                  <Button
                    onClick={() => setEditingId(null)}
                    variant="outline"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              /* MODO VISUALIZAÇÃO */
              <div className="flex gap-4 p-6 bg-white">
                {/* Imagem */}
                <div className="flex-shrink-0 w-32 h-32 bg-slate-100 rounded-lg overflow-hidden">
                  <img 
                    src={item.image_url} 
                    alt={item.code}
                    className="w-full h-full object-cover"
                    onError={(e) => e.target.src = 'https://via.placeholder.com/300'}
                  />
                </div>

                {/* Conteúdo */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                          {item.code}
                        </span>
                        <span className="text-xs bg-slate-200 px-2 py-1 rounded text-slate-700">
                          {item.category}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mt-2">{item.name}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-green-600">
                        R$ {item.price_sp.toLocaleString('pt-BR')}
                      </p>
                      <p className="text-xs text-slate-500">São Paulo</p>
                    </div>
                  </div>

                  <p className="text-sm text-slate-700">{item.description}</p>
                  <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded">
                    <strong>Specs:</strong> {item.specifications}
                  </p>

                  <div className="flex gap-2 pt-3">
                    <Button
                      size="sm"
                      onClick={() => handleEdit(item)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(item.code)}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Remover
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="ml-auto"
                    >
                      Usar em Proposta
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Botão Nova Linha */}
      <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-12">
        <Plus className="w-4 h-4 mr-2" />
        Adicionar Novo Equipamento
      </Button>
    </div>
  );
}