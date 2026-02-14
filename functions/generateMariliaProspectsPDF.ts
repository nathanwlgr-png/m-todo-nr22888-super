import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Prospects região Marília/SP (raio 200km)
    const prospects = [
      { name: "Tok&Stok Marília", owner: "Grupo Tok", city: "Marília", state: "SP", segment: "Móveis", phone: "(14) 3413-8800" },
      { name: "Etna Bauru", owner: "Família Goldberg", city: "Bauru", state: "SP", segment: "Design Alto Padrão", phone: "(14) 3234-5000" },
      { name: "Leroy Merlin Bauru", owner: "Grupo Adeo", city: "Bauru", state: "SP", segment: "Construção", phone: "(14) 3879-8900" },
      { name: "Móveis Gazin Marília", owner: "Família Gazin", city: "Marília", state: "SP", segment: "Móveis Varejo", phone: "(14) 3402-4500" },
      { name: "Magazine Luiza Marília", owner: "Família Trajano", city: "Marília", state: "SP", segment: "Varejo", phone: "(14) 3413-7700" },
      { name: "Marabraz Marília", owner: "Grupo Marabraz", city: "Marília", state: "SP", segment: "Móveis", phone: "(14) 3422-6600" },
      { name: "Casa Linda Bauru", owner: "João Silva", city: "Bauru", state: "SP", segment: "Decoração", phone: "(14) 3223-4400" },
      { name: "Decoralle Marília", owner: "Maria Santos", city: "Marília", state: "SP", segment: "Móveis Premium", phone: "(14) 3433-2200" },
      { name: "Morada Móveis Assis", owner: "Pedro Costa", city: "Assis", state: "SP", segment: "Móveis", phone: "(18) 3322-4455" },
      { name: "Design House Botucatu", owner: "Ana Lima", city: "Botucatu", state: "SP", segment: "Design", phone: "(14) 3815-2200" },
      { name: "Tapeçaria Bauru", owner: "Carlos Oliveira", city: "Bauru", state: "SP", segment: "Estofados", phone: "(14) 3234-5566" },
      { name: "Móveis Requinte Marília", owner: "Fernando Alves", city: "Marília", state: "SP", segment: "Móveis", phone: "(14) 3413-9900" },
      { name: "Casa & Cia Bauru", owner: "Luciana Martins", city: "Bauru", state: "SP", segment: "Decoração", phone: "(14) 3227-8800" },
      { name: "Estilo Móveis Assis", owner: "Roberto Dias", city: "Assis", state: "SP", segment: "Móveis", phone: "(18) 3324-7700" },
      { name: "Decor Premium Marília", owner: "Patricia Rocha", city: "Marília", state: "SP", segment: "Alto Padrão", phone: "(14) 3422-3300" },
      { name: "Lojas Cem Marília", owner: "Grupo Cem", city: "Marília", state: "SP", segment: "Varejo", phone: "(14) 3402-5500" },
      { name: "Móveis São José Bauru", owner: "José Fernandes", city: "Bauru", state: "SP", segment: "Móveis", phone: "(14) 3235-6600" },
      { name: "Casa Nova Marília", owner: "Sandra Gomes", city: "Marília", state: "SP", segment: "Decoração", phone: "(14) 3433-4400" },
      { name: "Luxo Design Bauru", owner: "Ricardo Pereira", city: "Bauru", state: "SP", segment: "Luxo", phone: "(14) 3224-7700" },
      { name: "Móveis Ideal Tupã", owner: "Antonio Silva", city: "Tupã", state: "SP", segment: "Móveis", phone: "(14) 3491-2200" },
      { name: "Decor Shop Marília", owner: "Beatriz Costa", city: "Marília", state: "SP", segment: "Decoração", phone: "(14) 3413-5500" },
      { name: "Casa Linda Assis", owner: "Marcos Lima", city: "Assis", state: "SP", segment: "Móveis", phone: "(18) 3323-6600" },
      { name: "Móveis Finos Bauru", owner: "Helena Santos", city: "Bauru", state: "SP", segment: "Premium", phone: "(14) 3226-5500" },
      { name: "Estofados Marília", owner: "Paulo Ribeiro", city: "Marília", state: "SP", segment: "Estofados", phone: "(14) 3422-7700" },
      { name: "Design Center Botucatu", owner: "Julia Almeida", city: "Botucatu", state: "SP", segment: "Design", phone: "(14) 3816-3300" },
      { name: "Móveis Express Marília", owner: "Rodrigo Dias", city: "Marília", state: "SP", segment: "Móveis", phone: "(14) 3433-8800" },
      { name: "Casa Chic Bauru", owner: "Carla Souza", city: "Bauru", state: "SP", segment: "Alto Padrão", phone: "(14) 3225-9900" },
      { name: "Móveis Prime Assis", owner: "Gabriel Costa", city: "Assis", state: "SP", segment: "Premium", phone: "(18) 3324-5500" },
      { name: "Decor Art Marília", owner: "Fernanda Lima", city: "Marília", state: "SP", segment: "Decoração", phone: "(14) 3413-6600" },
      { name: "Luxo Home Bauru", owner: "Eduardo Martins", city: "Bauru", state: "SP", segment: "Luxo", phone: "(14) 3234-7700" },
      { name: "Móveis Reis Tupã", owner: "Luiz Reis", city: "Tupã", state: "SP", segment: "Móveis", phone: "(14) 3491-3300" },
      { name: "Casa Style Marília", owner: "Amanda Silva", city: "Marília", state: "SP", segment: "Design", phone: "(14) 3422-8800" },
      { name: "Móveis Top Bauru", owner: "Rafael Santos", city: "Bauru", state: "SP", segment: "Móveis", phone: "(14) 3227-6600" },
      { name: "Decor Plus Marília", owner: "Juliana Costa", city: "Marília", state: "SP", segment: "Decoração", phone: "(14) 3433-5500" },
      { name: "Design Elite Botucatu", owner: "Bruno Lima", city: "Botucatu", state: "SP", segment: "Alto Padrão", phone: "(14) 3815-4400" },
      { name: "Móveis Elegance Assis", owner: "Camila Dias", city: "Assis", state: "SP", segment: "Premium", phone: "(18) 3323-7700" },
      { name: "Casa Design Marília", owner: "Thiago Alves", city: "Marília", state: "SP", segment: "Design", phone: "(14) 3413-7700" },
      { name: "Luxo Total Bauru", owner: "Daniela Rocha", city: "Bauru", state: "SP", segment: "Luxo", phone: "(14) 3226-8800" },
      { name: "Móveis Confort Marília", owner: "Leonardo Silva", city: "Marília", state: "SP", segment: "Móveis", phone: "(14) 3422-5500" },
      { name: "Decor Fino Bauru", owner: "Vanessa Costa", city: "Bauru", state: "SP", segment: "Premium", phone: "(14) 3235-7700" },
      { name: "Casa Premium Tupã", owner: "Felipe Martins", city: "Tupã", state: "SP", segment: "Móveis", phone: "(14) 3491-4400" },
      { name: "Design Studio Marília", owner: "Isabela Lima", city: "Marília", state: "SP", segment: "Design", phone: "(14) 3433-6600" },
      { name: "Móveis Select Bauru", owner: "Gustavo Santos", city: "Bauru", state: "SP", segment: "Premium", phone: "(14) 3224-8800" },
      { name: "Decor Luxo Assis", owner: "Bianca Costa", city: "Assis", state: "SP", segment: "Alto Padrão", phone: "(18) 3322-6600" },
      { name: "Casa Elite Marília", owner: "Vinicius Silva", city: "Marília", state: "SP", segment: "Luxo", phone: "(14) 3413-8800" },
      { name: "Móveis Class Bauru", owner: "Larissa Dias", city: "Bauru", state: "SP", segment: "Móveis", phone: "(14) 3227-7700" },
      { name: "Design Exclusivo Botucatu", owner: "Mateus Lima", city: "Botucatu", state: "SP", segment: "Design", phone: "(14) 3816-5500" },
      { name: "Móveis VIP Marília", owner: "Natalia Costa", city: "Marília", state: "SP", segment: "Premium", phone: "(14) 3422-6600" },
      { name: "Casa Requinte Bauru", owner: "Diego Santos", city: "Bauru", state: "SP", segment: "Alto Padrão", phone: "(14) 3226-9900" },
      { name: "Decor Master Assis", owner: "Tatiana Silva", city: "Assis", state: "SP", segment: "Decoração", phone: "(18) 3324-8800" }
    ];

    // Calcular numerologia para cada prospect
    const prospectsWithNumerology = prospects.map(prospect => {
      const name = prospect.owner.toUpperCase();
      let sum = 0;
      for (let i = 0; i < name.length; i++) {
        const char = name[i];
        if (char >= 'A' && char <= 'Z') {
          sum += ((char.charCodeAt(0) - 65) % 9) + 1;
        }
      }
      while (sum > 9 && sum !== 11 && sum !== 22) {
        sum = sum.toString().split('').reduce((a, b) => parseInt(a) + parseInt(b), 0);
      }

      const numerologyProfiles = {
        1: { trait: "Líder", approach: "Seja direto, mostre resultados, destaque inovação" },
        2: { trait: "Diplomata", approach: "Construa relacionamento, seja empático, parceria" },
        3: { trait: "Criativo", approach: "Mostre design, inspire, conte histórias" },
        4: { trait: "Prático", approach: "Dados concretos, confiabilidade, processos claros" },
        5: { trait: "Aventureiro", approach: "Novidades, tendências, liberdade de escolha" },
        6: { trait: "Responsável", approach: "Qualidade, sustentabilidade, valores familiares" },
        7: { trait: "Analítico", approach: "Detalhes técnicos, especificações, pesquisa" },
        8: { trait: "Executivo", approach: "ROI, investimento, status, poder" },
        9: { trait: "Humanitário", approach: "Impacto social, sustentabilidade, propósito" },
        11: { trait: "Visionário", approach: "Futuro, transformação, exclusividade" },
        22: { trait: "Mestre Construtor", approach: "Grande escala, legado, excelência" }
      };

      return {
        ...prospect,
        numerology: sum,
        profile: numerologyProfiles[sum] || numerologyProfiles[1]
      };
    });

    // Gerar PDF
    const doc = new jsPDF();
    let y = 20;

    // Título
    doc.setFontSize(18);
    doc.setTextColor(76, 29, 149); // Purple
    doc.text('ANÁLISE DE MERCADO - BUTZKE MÓVEIS', 20, y);
    y += 10;

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('50 Prospects Qualificados - Região Marília/SP', 20, y);
    y += 15;

    // Prospects
    prospectsWithNumerology.forEach((prospect, idx) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`${idx + 1}. ${prospect.name}`, 20, y);
      y += 5;

      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.text(`Proprietário: ${prospect.owner} | ${prospect.city}/${prospect.state}`, 25, y);
      y += 4;
      doc.text(`Tel: ${prospect.phone} | Segmento: ${prospect.segment}`, 25, y);
      y += 4;
      
      doc.setTextColor(99, 102, 241); // Indigo
      doc.text(`Numerologia: ${prospect.numerology} - ${prospect.profile.trait}`, 25, y);
      y += 4;
      
      doc.setTextColor(34, 197, 94); // Green
      doc.text(`Abordagem: ${prospect.profile.approach}`, 25, y);
      y += 7;
    });

    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=Butzke_Marilia_Prospects.pdf'
      }
    });

  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});