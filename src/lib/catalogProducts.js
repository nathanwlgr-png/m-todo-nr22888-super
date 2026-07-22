const clean = (value = '') => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

const findImage = (name, images) => {
  const target = clean(name);
  return images.find((image) => {
    if (image.is_active === false || image.approved_for_marketing_ai === false) return false;
    if (image.expiry_date && image.expiry_date < new Date().toISOString().slice(0, 10)) return false;
    const allowed = !image.usage_restrictions?.length || image.usage_restrictions.some((rule) => ['comercial', 'sem_restricao'].includes(rule));
    const related = clean(image.product_related || image.title);
    return allowed && related && (target.includes(related) || related.includes(target));
  })?.image_url || '';
};

export default function catalogProducts({ catalog, products, consumables, images }) {
  const isEquipment = (value = '') => /equipamento|analisador|maquina|máquina/i.test(value);
  const rows = [
    ...catalog.filter((p) => p.ativo !== false && p.categoria !== 'equipamento').map((p) => ({ id: p.id, source: 'ProductCatalog', name: p.nome_produto, category: p.linha || p.categoria, image_url: p.imagem_url })),
    ...consumables.filter((p) => p.is_active !== false).map((p) => ({ id: p.id, source: 'Consumable', name: p.name, category: p.category || 'Insumo', image_url: '' })),
    ...products.filter((p) => p.is_active !== false && p.status !== 'inativo' && !isEquipment(`${p.name} ${p.category}`)).map((p) => ({ id: p.id, source: 'Product', name: p.name, category: p.category || 'Produto', image_url: '' })),
  ];
  const seen = new Set();
  return rows.filter((p) => p.name && !seen.has(clean(p.name)) && seen.add(clean(p.name))).map((p) => ({ ...p, image_url: p.image_url || findImage(p.name, images) }));
}