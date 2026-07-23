export const PUBLIC_MAP_CLIENTS = [
  'R S Yanagiwara Pet Shop ME', 'Hugo Vinicius Gabriel', 'Ana Carla Zago Basilio Ferro ME',
  'Caglioni & Tomazella Ltda', 'Juliano Guerreiro Marini Vera Cruz ME',
  'HVGV Comercio Produtos Veterinarios Ltda', 'Bruno Jardim Picoloto',
  'Fernandes & Soares Ferragens Ltda ME', 'Clinica do Pet Ltda',
  'Veridiana Bonazzi Von Zuben ME', 'Maria Carolina Mangini Prado ME',
  '53 128 965 Jonas Augusto Gamba Bregadioli', 'Ceavet Centro de Analises Clinicas Veterinarias Ltda',
  'Alvaro Domingos Malzoni Junior', 'Tozzetti Pet Shop Ltda', 'Alma Vet Ltda',
  'Clinica Veterinaria Logar Rodrigues Ltda', 'Mariana Zampieri de Oliveira Cardoso',
  'Denise Peruca de Melo Moretti', 'Bichos Pet Shop de Garca Ltda ME',
  'Ani Clinica Veterinaria Ltda', 'Center Vet Hospital Veterinario Ltda'
];

export const normalizeAuditName = (value) => String(value || '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .replace(/[^a-z0-9]/g, '');

export const namesMatch = (left, right) => {
  const a = normalizeAuditName(left);
  const b = normalizeAuditName(right);
  return a === b || (a.length > 14 && b.length > 14 && (a.includes(b) || b.includes(a)));
};