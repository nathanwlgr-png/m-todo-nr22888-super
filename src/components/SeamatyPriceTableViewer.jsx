import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, DollarSign, Package, Layers, TestTube, Database, Calculator, Info } from 'lucide-react';
import { toast } from 'sonner';

// ─── REGRAS DE QUANTIDADE POR EMBALAGEM ───────────────────────────────────────
// PCR (cassetes IPCR/VQ1): vêm 6 por caixa
// Bioquímica (SMT-120VP, QT3, 3DX rotores/kits): vêm 10 ou 12
// Hemogásio (cartuchos VG1/VG2): vêm 20 por caixa
const PACK_RULES = {
  pcr: { qty: 6, label: '6 cassetes/cx', unit: 'cassete' },
  bioquimica: { qty: 10, label: '10 testes/cx', unit: 'teste' },
  imunofluorescencia: { qty: 10, label: '10 testes/cx', unit: 'teste' },
  hemogas: { qty: 20, label: '20 cartuchos/cx', unit: 'cartucho' },
  hematologia: { qty: 10, label: '10 testes/cx', unit: 'teste' },
};

const getPackRule = (product) => {
  const cat = product.category?.toLowerCase();
  const name = (product.product_name || '').toLowerCase();
  const code = (product.product_code || '').toLowerCase();
  // Detecta PCR (IPCR, VQ1)
  if (cat === 'pcr' || name.includes('pcr') || code.includes('pcr') || code.includes('ipcr') || code.includes('vq')) return PACK_RULES.pcr;
  // Detecta Hemogásio
  if (cat === 'hemogas' || name.includes('hemogas') || name.includes('cartucho') || name.includes('gas') || code.includes('vg')) return PACK_RULES.hemogas;
  // Detecta Bioquímica
  if (cat === 'bioquimica' || name.includes('bioquim') || name.includes('smt') || name.includes('qt3') || name.includes('3dx') || code.includes('smt') || code.includes('qt')) return PACK_RULES.bioquimica;
  // Imunofluorescência
  if (cat === 'imunofluorescencia' || name.includes('imuno') || name.includes('vi1') || code.includes('vi')) return PACK_RULES.imunofluorescencia;
  return null;
};

export default function SeamatyPriceTableViewer() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrices();
  }, []);

  const loadPrices = async () => {
    try {
      const data = await base44.entities.SeamatyPriceTable.list();
      setProducts(data || []);
    } catch (error) {
      console.error('Erro ao carregar preços:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFromBackend = async () => {
    try {
      toast.loading('Carregando tabela de preços SP...');
      await base44.functions.invoke('loadSeamatyPriceTable', {});
      toast.success('Tabela carregada!');
      loadPrices();
    } catch (error) {
      toast.error('Erro ao carregar tabela');
    }
  };

  // Salva as regras de embalagem como conhecimento permanente
  const savePackRulesKnowledge = async () => {
    try {
      await base44.entities.AIKnowledgeDocument.create({
        title: 'Regras de Embalagem Seamaty Brasil — Cálculo de Preço Unitário',
        content: `REGRAS OFICIAIS DE QUANTIDADE POR EMBALAGEM — SEAMATY BRASIL

📦 PCR (Cassetes IPCR / VQ1):
- Quantidade por caixa: 6 cassetes
- Cálculo: preço_cx ÷ 6 = preço por cassete
- Produto: VQ1 PCR Quantitativo

📦 Bioquímica (Rotores / Kits — SMT-120VP, QT3, 3DX):
- Quantidade por caixa: 10 ou 12 testes
- Padrão adotado: 10 testes/cx
- Produtos: SMT-120VP, QT3, LAB-3DX, rotores bioquímicos

📦 Hemogásio (Cartuchos — VG1 / VG2):
- Quantidade por caixa: 20 cartuchos
- Cálculo: preço_cx ÷ 20 = preço por cartucho
- Produtos: VG1, VG2 (gases sanguíneos + eletrólitos)

📦 Imunofluorescência (Cassetes — Vi1):
- Quantidade por caixa: 10 testes
- Produto: Vi1 Imunofluorescência

USO NA ANÁLISE COMPARATIVA:
Ao apresentar preços de insumos ao cliente, sempre calcule e mostre o preço unitário por cassete/cartucho/teste para facilitar a comparação com laboratório terceirizado e concorrentes.

Exemplo argumento: "Cada cassete PCR custa R$X — vs laboratório terceirizado que cobra R$Y por exame, ou seja, economia de R$Z por exame realizado in-house."`,
        content_type: 'pricing_rules',
        source: 'Nathan Rosa — Regra operacional Seamaty Brasil',
        tags: ['seamaty', 'insumos', 'preco-unitario', 'pcr', 'bioquimica', 'hemogas', 'cassete', 'cartucho', 'embalagem'],
        is_active: true,
      });
      toast.success('✅ Regras de embalagem salvas na base de conhecimento!');
    } catch (e) {
      toast.error('Erro ao salvar: ' + e.message);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.product_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categoryIcons = {
    bioquimica: <Layers className="w-4 h-4" />,
    imunofluorescencia: <TestTube className="w-4 h-4" />,
    hemogas: <Package className="w-4 h-4" />,
    pcr: <Database className="w-4 h-4" />,
    hematologia: <TestTube className="w-4 h-4" />
  };

  const formatPrice = (price) => {
    return price ? `R$ ${price.toFixed(2).replace('.', ',')}` : '-';
  };

  if (loading) return <p className="text-center text-slate-500">Carregando preços...</p>;

  return (
    <div className="space-y-4">
      <Card className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-green-600" />
              Tabela de Preços SP - Seamaty Brasil 2026
            </h3>
            <p className="text-sm text-slate-600 mt-1">{products.length} produtos cadastrados</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {products.length === 0 && (
              <Button onClick={loadFromBackend} className="bg-green-600 hover:bg-green-700">
                Carregar Tabela SP
              </Button>
            )}
            <Button onClick={savePackRulesKnowledge} variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50 text-xs">
              💾 Salvar Regras de Embalagem
            </Button>
          </div>
        </div>

        {/* Legenda de embalagens */}
        <div className="mt-3 p-3 bg-white/70 rounded-lg border border-green-200">
          <p className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
            <Calculator className="w-3 h-3" /> Regras de Embalagem (preço unitário calculado automaticamente)
          </p>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <div className="flex items-center gap-1.5 bg-purple-50 rounded px-2 py-1 border border-purple-200">
              <span className="text-purple-700 font-bold">PCR (IPCR/VQ1)</span>
              <span className="text-purple-600">→ 6 cassetes/cx</span>
            </div>
            <div className="flex items-center gap-1.5 bg-blue-50 rounded px-2 py-1 border border-blue-200">
              <span className="text-blue-700 font-bold">Bioquímica (SMT/QT3/3DX)</span>
              <span className="text-blue-600">→ 10 testes/cx</span>
            </div>
            <div className="flex items-center gap-1.5 bg-red-50 rounded px-2 py-1 border border-red-200">
              <span className="text-red-700 font-bold">Hemogásio (VG1/VG2)</span>
              <span className="text-red-600">→ 20 cartuchos/cx</span>
            </div>
            <div className="flex items-center gap-1.5 bg-orange-50 rounded px-2 py-1 border border-orange-200">
              <span className="text-orange-700 font-bold">Imunofluorescência (Vi1)</span>
              <span className="text-orange-600">→ 10 testes/cx</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="🔍 Buscar produto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          <option value="all">Todas Categorias</option>
          <option value="bioquimica">Bioquímica</option>
          <option value="imunofluorescencia">Imunofluorescência (K7)</option>
          <option value="hemogas">Hemogásio</option>
          <option value="pcr">PCR</option>
          <option value="hematologia">Hematologia</option>
        </select>
      </div>

      {/* Produtos */}
      <div className="grid grid-cols-1 gap-3">
        {filteredProducts.map(product => {
          const pack = getPackRule(product);
          const unitPrice1 = pack && product.price_tier1 ? product.price_tier1 / pack.qty : null;
          const unitPrice4 = pack && product.price_tier4 ? product.price_tier4 / pack.qty : null;
          const unitPriceCash = pack && product.price_cash ? product.price_cash / pack.qty : null;

          return (
          <Card key={product.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {categoryIcons[product.category]}
                  <h4 className="font-bold text-slate-800">{product.product_name}</h4>
                  <Badge variant="outline" className="text-xs">{product.product_code}</Badge>
                  {product.parameters_count && (
                    <Badge className="bg-blue-100 text-blue-800 text-xs">
                      {product.parameters_count} parâmetros
                    </Badge>
                  )}
                  {pack && (
                    <Badge className="bg-amber-100 text-amber-800 text-xs border border-amber-300">
                      📦 {pack.label}
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-slate-600 mb-2">{product.description}</p>

                {product.parameters && product.parameters.length > 0 && (
                  <p className="text-xs text-slate-500 mb-2">
                    <strong>Parâmetros:</strong> {product.parameters.join(', ')}
                  </p>
                )}

                {product.compatible_equipment && (
                  <div className="flex gap-1 flex-wrap mb-2">
                    {product.compatible_equipment.map(eq => (
                      <Badge key={eq} variant="outline" className="text-xs bg-slate-50">
                        {eq}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Preço unitário calculado — análise comparativa */}
                {pack && (unitPrice1 || unitPriceCash) && (
                  <div className="mt-2 p-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                    <p className="text-[10px] font-bold text-indigo-700 mb-1 flex items-center gap-1">
                      <Calculator className="w-3 h-3" /> Preço por {pack.unit} (análise comparativa)
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {unitPriceCash && (
                        <div>
                          <p className="text-[9px] text-slate-500">À vista / {pack.unit}</p>
                          <p className="text-sm font-bold text-indigo-700">{formatPrice(unitPriceCash)}</p>
                        </div>
                      )}
                      {unitPrice1 && (
                        <div>
                          <p className="text-[9px] text-slate-500">1 cx / {pack.unit}</p>
                          <p className="text-sm font-semibold text-slate-700">{formatPrice(unitPrice1)}</p>
                        </div>
                      )}
                      {unitPrice4 && (
                        <div>
                          <p className="text-[9px] text-slate-500">8+ cx / {pack.unit}</p>
                          <p className="text-sm font-bold text-green-700">{formatPrice(unitPrice4)}</p>
                        </div>
                      )}
                    </div>
                    <p className="text-[9px] text-indigo-500 mt-1">
                      💡 Compare com lab terceirizado para calcular economia
                    </p>
                  </div>
                )}
              </div>

              {/* Preços por caixa */}
              <div className="text-right shrink-0">
                {product.price_cash && (
                  <div className="mb-2">
                    <p className="text-xs text-slate-500">À vista/cx</p>
                    <p className="text-lg font-bold text-green-700">{formatPrice(product.price_cash)}</p>
                  </div>
                )}
                
                {product.price_5x_card && (
                  <div className="mb-2">
                    <p className="text-xs text-slate-500">5x cartão/cx</p>
                    <p className="text-sm font-semibold text-blue-700">{formatPrice(product.price_5x_card)}</p>
                  </div>
                )}

                {product.price_tier1 && (
                  <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                    <div>
                      <p className="text-slate-500">1 cx</p>
                      <p className="font-semibold">{formatPrice(product.price_tier1)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">2-4 cx</p>
                      <p className="font-semibold">{formatPrice(product.price_tier2)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">5-7 cx</p>
                      <p className="font-semibold text-green-700">{formatPrice(product.price_tier3)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">8+ cx</p>
                      <p className="font-semibold text-green-800">{formatPrice(product.price_tier4)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-slate-500">Nenhum produto encontrado</p>
        </Card>
      )}
    </div>
  );
}