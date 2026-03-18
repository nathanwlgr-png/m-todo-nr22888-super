import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const products = [];

    // EQUIPAMENTOS
    products.push(
      { product_code: 'SMT-120VP', product_type: 'equipamento', product_name: 'SMT-120VP', description: 'Analisador químico multifuncional automático veterinário', price_cash: 23500, price_5x_card: 25000, category: 'bioquimica', compatible_equipment: ['SMT-120VP'], region: 'SP', offline_available: true },
      { product_code: 'QT3', product_type: 'equipamento', product_name: 'QT3', description: 'Analisador químico multifuncional automático veterinário QT3', price_cash: 31000, price_5x_card: 32900, category: 'bioquimica', compatible_equipment: ['QT3'], region: 'SP', offline_available: true },
      { product_code: 'VG1', product_type: 'equipamento', product_name: 'VG1', description: 'Analisador de gases e eletrólitos veterinário', price_cash: 28000, price_5x_card: 29700, category: 'hemogas', compatible_equipment: ['VG1'], region: 'SP', offline_available: true },
      { product_code: 'VG2', product_type: 'equipamento', product_name: 'VG2', description: 'Analisador de imunoensaio fluorescente e gases sanguíneos veterinário', price_cash: 33000, price_5x_card: 35000, category: 'hemogas', compatible_equipment: ['VG2'], region: 'SP', offline_available: true },
      { product_code: '3DX', product_type: 'equipamento', product_name: '3DX', description: 'Analisador multifuncional veterinário minilab 3DX', price_cash: 55000, price_5x_card: 58000, category: 'bioquimica', compatible_equipment: ['3DX'], region: 'SP', offline_available: true },
      { product_code: 'VBC50A', product_type: 'equipamento', product_name: 'VBC50A', description: 'Analisador hematológico 5 partes veterinária 50A', price_cash: 70000, price_5x_card: 74000, category: 'hematologia', compatible_equipment: ['VBC50A'], region: 'SP', offline_available: true },
      { product_code: 'Vi1', product_type: 'equipamento', product_name: 'Vi1', description: 'Analisador de Imunoensaio fluorescente', price_cash: 8500, price_5x_card: 9000, category: 'imunofluorescencia', compatible_equipment: ['Vi1'], region: 'SP', offline_available: true },
      { product_code: 'VQ1', product_type: 'equipamento', product_name: 'VQ1', description: 'Analisador PCR', price_cash: 45000, price_5x_card: 47700, category: 'pcr', compatible_equipment: ['VQ1'], region: 'SP', offline_available: true }
    );

    // CARTUCHOS HEMOGÁSIO
    products.push(
      { product_code: 'AW03762', product_type: 'cartucho_hemogas', product_name: 'BG17', description: 'Blood Gas & Electrolyte Test Cartridge BG17', price_tier1: 1574.27, price_tier2: 1534.92, price_tier3: 1479.82, price_tier4: 1416.84, category: 'hemogas', compatible_equipment: ['VG1', 'VG2'], parameters_count: 17, region: 'SP', offline_available: true },
      { product_code: 'AW04148', product_type: 'cartucho_hemogas', product_name: 'BG17-N', description: 'Blood gas & electrolyte syringe test cartridge BG17-N', price_tier1: 1574.27, price_tier2: 1534.92, price_tier3: 1479.82, price_tier4: 1416.84, category: 'hemogas', compatible_equipment: ['VG1', 'VG2'], parameters_count: 17, region: 'SP', offline_available: true },
      { product_code: 'AW02489', product_type: 'cartucho_hemogas', product_name: 'BG15', description: 'Blood Gas & Electrolyte Test Cartridge BG15', price_tier1: 1277.80, price_tier2: 1245.86, price_tier3: 1201.13, price_tier4: 1150.02, category: 'hemogas', compatible_equipment: ['VG1', 'VG2'], parameters_count: 15, region: 'SP', offline_available: true },
      { product_code: 'AW02988', product_type: 'cartucho_hemogas', product_name: 'BE5', description: 'Blood Gas & Electrolyte Test Cartridge BE5', price_tier1: 1117.66, price_tier2: 1089.72, price_tier3: 1050.60, price_tier4: 1005.90, category: 'hemogas', compatible_equipment: ['VG1', 'VG2'], parameters_count: 5, region: 'SP', offline_available: true }
    );

    // CASSETES IMUNOFLUORESCÊNCIA (K7)
    products.push(
      { product_code: 'AW03869', product_type: 'cassete', product_name: 'cPL', description: 'Canine Pancreas-specific Lipase (cPL) Test Kit', price_tier1: 650.52, price_tier2: 634.26, price_tier3: 611.49, price_tier4: 585.47, category: 'imunofluorescencia', compatible_equipment: ['3DX', 'Vi1'], region: 'SP', offline_available: true },
      { product_code: 'AW03867', product_type: 'cassete', product_name: 'c-CRP', description: 'Canine C-Reactive Protein (c-CRP) Test Kit', price_tier1: 418.06, price_tier2: 407.61, price_tier3: 392.98, price_tier4: 376.26, category: 'imunofluorescencia', compatible_equipment: ['3DX', 'Vi1'], region: 'SP', offline_available: true },
      { product_code: 'AW04006', product_type: 'cassete', product_name: 'f-SAA', description: 'Feline Serum Amyloid A (f-SAA) Test Kit', price_tier1: 483.36, price_tier2: 471.28, price_tier3: 454.36, price_tier4: 435.02, category: 'imunofluorescencia', compatible_equipment: ['3DX', 'Vi1'], region: 'SP', offline_available: true },
      { product_code: 'AW03852', product_type: 'cassete', product_name: 'TT4', description: 'Total Thyroxine (TT4) Test Kit', price_tier1: 362.52, price_tier2: 353.46, price_tier3: 340.77, price_tier4: 326.27, category: 'imunofluorescencia', compatible_equipment: ['3DX', 'Vi1'], region: 'SP', offline_available: true },
      { product_code: 'AW03955', product_type: 'cassete', product_name: 'fPL', description: 'Feline Pancreatic Lipase (fPL) Test Kit', price_tier1: 650.52, price_tier2: 634.26, price_tier3: 611.49, price_tier4: 585.47, category: 'imunofluorescencia', compatible_equipment: ['3DX', 'Vi1'], region: 'SP', offline_available: true },
      { product_code: 'AW03044', product_type: 'cassete', product_name: 'Cys C', description: 'Canine/Feline Cystatin C (Cys C) Test Kit', price_tier1: 483.36, price_tier2: 471.28, price_tier3: 454.36, price_tier4: 435.02, category: 'imunofluorescencia', compatible_equipment: ['3DX', 'Vi1'], region: 'SP', offline_available: true },
      { product_code: 'AW03863', product_type: 'cassete', product_name: 'Cortisol', description: 'Cortisol (Cor) Test Kit', price_tier1: 362.52, price_tier2: 353.46, price_tier3: 340.77, price_tier4: 326.27, category: 'imunofluorescencia', compatible_equipment: ['3DX', 'Vi1'], region: 'SP', offline_available: true },
      { product_code: 'AW03910', product_type: 'cassete', product_name: 'Progesterona', description: 'Progesterone (Prog) Test Kit', price_tier1: 362.52, price_tier2: 353.46, price_tier3: 340.77, price_tier4: 326.27, category: 'imunofluorescencia', compatible_equipment: ['3DX', 'Vi1'], region: 'SP', offline_available: true },
      { product_code: 'AW03967', product_type: 'cassete', product_name: 'TSH', description: 'Thyroid Stimulating Hormone (TSH) Test Kit', price_tier1: 362.52, price_tier2: 353.46, price_tier3: 340.77, price_tier4: 326.27, category: 'imunofluorescencia', compatible_equipment: ['3DX', 'Vi1'], region: 'SP', offline_available: true },
      { product_code: 'AW03051', product_type: 'cassete', product_name: 'fNT-proBNP', description: 'Feline N-terminal pro-B-type Natriuretic Peptide (fNT-proBNP) Test Kit', price_tier1: 418.06, price_tier2: 407.61, price_tier3: 392.98, price_tier4: 376.26, category: 'imunofluorescencia', compatible_equipment: ['3DX', 'Vi1'], region: 'SP', offline_available: true },
      { product_code: 'AW03050', product_type: 'cassete', product_name: 'cNT-proBNP', description: 'Canine N-terminal pro-B-type Natriuretic Peptide (cNT-proBNP) Test Kit', price_tier1: 418.06, price_tier2: 407.61, price_tier3: 392.98, price_tier4: 376.26, category: 'imunofluorescencia', compatible_equipment: ['3DX', 'Vi1'], region: 'SP', offline_available: true }
    );

    // PCR (K7 PCR)
    products.push(
      { product_code: 'AW04091', product_type: 'pcr', product_name: 'Painel Respiratório Felino 5', description: 'Feline Respiratory Panel 5 (Bb; M.felis; C.felis; FHV-1; FCV)', parameters: ['Bb', 'M.felis', 'C.felis', 'FHV-1', 'FCV'], price_tier1: 1899.54, price_tier2: 1852.05, price_tier3: 1785.57, price_tier4: 1709.59, category: 'pcr', compatible_equipment: ['VQ1'], region: 'SP', offline_available: true },
      { product_code: 'AW04090', product_type: 'pcr', product_name: 'Painel Respiratório Canino', description: 'Painel respiratorio Canino', price_tier1: 1511.14, price_tier2: 1473.36, price_tier3: 1420.47, price_tier4: 1360.02, category: 'pcr', compatible_equipment: ['VQ1'], region: 'SP', offline_available: true },
      { product_code: 'AW04128', product_type: 'pcr', product_name: 'Painel GI Felino 4', description: 'Feline Gatrointestinal Panel 4 (FCoV; FPV; G. lamblia; T. foetus)', parameters: ['FCoV', 'FPV', 'G.lamblia', 'T.foetus'], price_tier1: 1524.75, price_tier2: 1486.63, price_tier3: 1433.26, price_tier4: 1372.27, category: 'pcr', compatible_equipment: ['VQ1'], region: 'SP', offline_available: true },
      { product_code: 'AW04129', product_type: 'pcr', product_name: 'Painel GI Canino 4', description: 'Canine Gatrointestinal Panel 4 (CCoV; CPV; G. lamblia; T. foetus)', parameters: ['CCoV', 'CPV', 'G.lamblia', 'T.foetus'], price_tier1: 1524.75, price_tier2: 1486.63, price_tier3: 1433.26, price_tier4: 1372.27, category: 'pcr', compatible_equipment: ['VQ1'], region: 'SP', offline_available: true },
      { product_code: 'AW04124', product_type: 'pcr', product_name: 'Painel Respiratório Canino 6', description: 'Canine Respiratory Panel 6 (M.cynos; Bb; CAV-2; CPIV; CDV; CIV)', parameters: ['M.cynos', 'Bb', 'CAV-2', 'CPIV', 'CDV', 'CIV'], price_tier1: 1899.54, price_tier2: 1852.05, price_tier3: 1785.57, price_tier4: 1709.59, category: 'pcr', compatible_equipment: ['VQ1'], region: 'SP', offline_available: true },
      { product_code: 'AW04139', product_type: 'pcr', product_name: 'Painel Respiratório Canino 7', description: 'Painel Respiratorio Canino (7 parametros)', price_tier1: 443.23, price_tier2: 432.15, price_tier3: 416.63, price_tier4: 398.91, category: 'pcr', compatible_equipment: ['VQ1'], region: 'SP', offline_available: true }
    );

    // ROTORES BIOQUÍMICOS
    products.push(
      { product_code: 'AW01980', product_type: 'rotor', product_name: '24 Comprehensive Test Plus', description: '24 Comprehensive Test Plus', parameters_count: 24, price_tier1: 1443.23, price_tier2: 1407.14, price_tier3: 1356.63, price_tier4: 1298.90, category: 'bioquimica', compatible_equipment: ['SMT-120VP', 'QT3', '3DX'], region: 'SP', offline_available: true },
      { product_code: 'AW00686', product_type: 'rotor', product_name: '10 Primary Diagnostic', description: '10 Primary Diagnostic', parameters_count: 10, price_tier1: 999.11, price_tier2: 974.13, price_tier3: 939.16, price_tier4: 899.20, category: 'bioquimica', compatible_equipment: ['SMT-120VP', 'QT3', '3DX'], region: 'SP', offline_available: true },
      { product_code: 'AW01982', product_type: 'rotor', product_name: '10 Pre-Operation Test Parameters', description: '10 Pre-Operation Test Parameters', parameters_count: 10, parameters: ['ALT', 'AST', 'ALP', 'CK', 'Crea', 'GLU', 'TP', 'BUN', 'LDH', 'B/C*'], price_tier1: 980.61, price_tier2: 956.09, price_tier3: 921.77, price_tier4: 882.55, category: 'bioquimica', compatible_equipment: ['SMT-120VP', 'QT3', '3DX'], region: 'SP', offline_available: true },
      { product_code: 'AW03198', product_type: 'rotor', product_name: '5 Primary Diagnostic', description: '5 Primary Diagnostic', parameters: ['BUN', 'Crea', 'AST', 'ALT', 'TP'], parameters_count: 5, price_tier1: 646.46, price_tier2: 630.30, price_tier3: 607.68, price_tier4: 581.82, category: 'bioquimica', compatible_equipment: ['SMT-120VP', 'QT3', '3DX'], region: 'SP', offline_available: true },
      { product_code: 'AW02015', product_type: 'rotor', product_name: '16 Comprehensive Diagnostic Parameters', description: '16 Comprehensive Diagnostic Parameters', parameters_count: 16, parameters: ['ALB', 'AMY', 'ALP', 'ALT', 'CHE', 'GLU', 'K+', 'Na+', 'Crea', 'TB', 'TP', 'UA', 'BUN', 'A/G*', 'B/C*', 'GLOB*'], price_tier1: 998.00, price_tier2: 973.05, price_tier3: 938.12, price_tier4: 898.20, category: 'bioquimica', compatible_equipment: ['SMT-120VP', 'QT3', '3DX'], region: 'SP', offline_available: true },
      { product_code: 'AW01981', product_type: 'rotor', product_name: '16 Health Check Parameters', description: '16 Health Check Parameters', parameters_count: 16, price_tier1: 998.00, price_tier2: 973.05, price_tier3: 938.12, price_tier4: 898.20, category: 'bioquimica', compatible_equipment: ['SMT-120VP', 'QT3', '3DX'], region: 'SP', offline_available: true },
      { product_code: 'AW01985', product_type: 'rotor', product_name: '13 Electrolyte Plus Parameters', description: '13 Electrolyte Plus Parameters', parameters_count: 13, price_tier1: 781.64, price_tier2: 762.10, price_tier3: 734.75, price_tier4: 703.48, category: 'bioquimica', compatible_equipment: ['SMT-120VP', 'QT3', '3DX'], region: 'SP', offline_available: true },
      { product_code: 'AW00650', product_type: 'rotor', product_name: '4 Coagulation Parameters', description: '4 Coagulation Parameters', parameters: ['APTT', 'PT', 'TT', 'Fib'], parameters_count: 4, price_tier1: 695.00, price_tier2: 677.63, price_tier3: 653.30, price_tier4: 625.50, category: 'bioquimica', compatible_equipment: ['SMT-120VP', 'QT3', '3DX'], region: 'SP', offline_available: true },
      { product_code: 'AW01986', product_type: 'rotor', product_name: '13 Reptilian or Exotic Animals', description: '13 Reptilian or Exotic Animals', parameters_count: 13, price_tier1: 980.61, price_tier2: 956.09, price_tier3: 921.77, price_tier4: 882.55, category: 'bioquimica', compatible_equipment: ['SMT-120VP', 'QT3', '3DX'], region: 'SP', offline_available: true },
      { product_code: 'AW02991', product_type: 'rotor', product_name: '9 Kidney Function Parameters', description: '9 Kidney Function Parameters (Rim)', parameters_count: 9, price_tier1: 766.49, price_tier2: 747.32, price_tier3: 720.50, price_tier4: 689.84, category: 'bioquimica', compatible_equipment: ['SMT-120VP', 'QT3', '3DX'], region: 'SP', offline_available: true },
      { product_code: 'AW01987', product_type: 'rotor', product_name: '12 Feline Inflammation', description: '12 Feline Inflammation', parameters: ['LPS', 'GGT', 'f-SAA', 'ALP', 'BUN', 'ALB', 'TBA', 'Crea', 'TP', 'A/G*', 'B/C*', 'GLOB*'], parameters_count: 12, price_tier1: 847.00, price_tier2: 825.83, price_tier3: 796.18, price_tier4: 762.30, category: 'bioquimica', compatible_equipment: ['SMT-120VP', 'QT3', '3DX'], region: 'SP', offline_available: true },
      { product_code: 'AW01984', product_type: 'rotor', product_name: '11 Liver Function Parameters', description: '11 Liver Function Parameters (Fígado)', parameters_count: 11, price_tier1: 781.11, price_tier2: 761.59, price_tier3: 734.25, price_tier4: 703.00, category: 'bioquimica', compatible_equipment: ['SMT-120VP', 'QT3', '3DX'], region: 'SP', offline_available: true },
      { product_code: 'AW01364', product_type: 'rotor', product_name: '9 Diabetes Test Parameters', description: '9 Diabetes Test Parameters', parameters: ['FRUC', 'ALT', 'AST', 'GLU', 'TG', 'TC', 'LAC', 'AMY', 'LPS'], parameters_count: 9, price_tier1: 766.49, price_tier2: 747.32, price_tier3: 720.50, price_tier4: 689.84, category: 'bioquimica', compatible_equipment: ['SMT-120VP', 'QT3', '3DX'], region: 'SP', offline_available: true },
      { product_code: 'AW03932', product_type: 'rotor', product_name: '6 Primary Diagnostic Test', description: '6 Primary Diagnostic Test (ALP, ALT, AST, BUN, CREA, B/C)', parameters: ['ALP', 'ALT', 'AST', 'BUN', 'CREA', 'B/C'], parameters_count: 6, price_tier1: 630.81, price_tier2: 615.04, price_tier3: 592.96, price_tier4: 567.73, category: 'bioquimica', compatible_equipment: ['SMT-120VP', 'QT3', '3DX'], region: 'SP', offline_available: true },
      { product_code: 'AW01815', product_type: 'rotor', product_name: 'Ammonia Parameter', description: 'Ammonia Parameter', parameters: ['NH3'], parameters_count: 1, price_tier1: 619.36, price_tier2: 603.87, price_tier3: 582.20, price_tier4: 557.42, category: 'bioquimica', compatible_equipment: ['SMT-120VP', 'QT3', '3DX'], region: 'SP', offline_available: true },
      { product_code: 'AW02014', product_type: 'rotor', product_name: '6 Canine Inflammation', description: '6 Canine Inflammation', parameters: ['c-CRP', 'Crea', 'AMY', 'LPS', 'BUN', 'B/C*'], parameters_count: 6, price_tier1: 528.83, price_tier2: 515.61, price_tier3: 497.10, price_tier4: 475.95, category: 'bioquimica', compatible_equipment: ['SMT-120VP', 'QT3', '3DX'], region: 'SP', offline_available: true },
      { product_code: 'AW04053', product_type: 'rotor', product_name: '4 Kidney function test', description: '4 Kidney function test', parameters_count: 4, price_tier1: 606.74, price_tier2: 591.58, price_tier3: 570.34, price_tier4: 546.07, category: 'bioquimica', compatible_equipment: ['SMT-120VP', 'QT3', '3DX'], region: 'SP', offline_available: true },
      { product_code: 'AW03935', product_type: 'rotor', product_name: '4 Diabetes Test', description: '4 Diabetes Test (GLU, FRU, TC, TG)', parameters: ['GLU', 'FRU', 'TC', 'TG'], parameters_count: 4, price_tier1: 604.20, price_tier2: 589.10, price_tier3: 567.95, price_tier4: 543.78, category: 'bioquimica', compatible_equipment: ['SMT-120VP', 'QT3', '3DX'], region: 'SP', offline_available: true }
    );

    // SETORES BIOQUÍMICOS
    products.push(
      { product_code: 'AW03938', product_type: 'rotor', product_name: 'BUN setorizado', description: 'UREA setorizado (BUN)', parameters: ['BUN'], parameters_count: 1, price_tier1: 316.94, price_tier2: 309.02, price_tier3: 297.92, price_tier4: 285.25, category: 'bioquimica', compatible_equipment: ['QT3', '3DX'], region: 'SP', offline_available: true },
      { product_code: 'AW03937', product_type: 'rotor', product_name: 'CREA setorizado', description: 'CREA setorizado', parameters: ['CREA'], parameters_count: 1, price_tier1: 316.94, price_tier2: 309.02, price_tier3: 297.92, price_tier4: 285.25, category: 'bioquimica', compatible_equipment: ['QT3', '3DX'], region: 'SP', offline_available: true },
      { product_code: 'AW04052', product_type: 'rotor', product_name: '5 Electrolyte Test', description: '5 Electrolyte Test (setorizado)', parameters_count: 5, price_tier1: 622.54, price_tier2: 606.97, price_tier3: 585.19, price_tier4: 560.28, category: 'bioquimica', compatible_equipment: ['QT3', '3DX'], region: 'SP', offline_available: true },
      { product_code: 'AW03939', product_type: 'rotor', product_name: 'ALT setorizado', description: 'ALT setorizado', parameters: ['ALT'], parameters_count: 1, price_tier1: 316.94, price_tier2: 309.02, price_tier3: 297.92, price_tier4: 285.25, category: 'bioquimica', compatible_equipment: ['QT3', '3DX'], region: 'SP', offline_available: true },
      { product_code: 'AW03941', product_type: 'rotor', product_name: 'TBA setorizado', description: 'TBA setorizado', parameters: ['TBA'], parameters_count: 1, price_tier1: 316.94, price_tier2: 309.02, price_tier3: 297.92, price_tier4: 285.25, category: 'bioquimica', compatible_equipment: ['QT3', '3DX'], region: 'SP', offline_available: true },
      { product_code: 'AW04051', product_type: 'rotor', product_name: '3 Liver Function Test', description: '3 Liver Function Test (Figado) (ALT, GGT, TB)', parameters: ['ALT', 'GGT', 'TB'], parameters_count: 3, price_tier1: 601.23, price_tier2: 586.20, price_tier3: 565.16, price_tier4: 541.11, category: 'bioquimica', compatible_equipment: ['SMT-120VP', 'QT3', '3DX'], region: 'SP', offline_available: true },
      { product_code: 'AW03940', product_type: 'rotor', product_name: 'AST setorizado', description: 'AST setorizado', parameters: ['AST'], parameters_count: 1, price_tier1: 316.94, price_tier2: 309.02, price_tier3: 297.92, price_tier4: 285.25, category: 'bioquimica', compatible_equipment: ['QT3', '3DX'], region: 'SP', offline_available: true }
    );

    // HEMATOLÓGICOS
    products.push(
      { product_code: 'SMT-5L-DV-250ml', product_type: 'hematologico', product_name: 'Lisante 5 partes DV 250ml', description: 'Lisante 5 partes DV 250ml', price_tier1: 530.00, category: 'hematologia', compatible_equipment: ['VBC50A'], region: 'SP', offline_available: true },
      { product_code: 'SMT-5L-HV-100ml', product_type: 'hematologico', product_name: 'Hemolisina 5 partes HV 100ml', description: 'Hemolisina 5 partes HV 100ml', price_tier1: 604.20, category: 'hematologia', compatible_equipment: ['VBC50A'], region: 'SP', offline_available: true },
      { product_code: 'SMT-5DV-5L', product_type: 'hematologico', product_name: 'Diluente 5 partes 5L', description: 'DILUENTE 5 PARTES 5L', price_tier1: 330.00, category: 'hematologia', compatible_equipment: ['VBC50A'], region: 'SP', offline_available: true },
      { product_code: 'SMT-3LV-100ml', product_type: 'hematologico', product_name: 'Lisante 3 partes 100ml', description: 'Lisante 3 partes 100ml', price_tier1: 318.00, category: 'hematologia', compatible_equipment: ['VBC50A'], region: 'SP', offline_available: true },
      { product_code: 'SMT-3DV-5L', product_type: 'hematologico', product_name: 'Diluente 3 partes 5L', description: 'Diluente 3 partes 5L', price_tier1: 243.80, category: 'hematologia', compatible_equipment: ['VBC50A'], region: 'SP', offline_available: true },
      { product_code: 'SMT-5C-50ml', product_type: 'hematologico', product_name: 'Cleaner 50ml', description: 'Cleaner 50ml', price_tier1: 106.00, category: 'hematologia', compatible_equipment: ['VBC50A'], region: 'SP', offline_available: true }
    );

    // Inserir todos os produtos
    for (const product of products) {
      await base44.asServiceRole.entities.SeamatyPriceTable.create(product);
    }

    return Response.json({
      success: true,
      message: `${products.length} produtos cadastrados na tabela SP`,
      total: products.length,
      breakdown: {
        equipamentos: products.filter(p => p.product_type === 'equipamento').length,
        rotores: products.filter(p => p.product_type === 'rotor').length,
        cassetes: products.filter(p => p.product_type === 'cassete').length,
        cartuchos_hemogas: products.filter(p => p.product_type === 'cartucho_hemogas').length,
        pcr: products.filter(p => p.product_type === 'pcr').length,
        hematologicos: products.filter(p => p.product_type === 'hematologico').length
      }
    });

  } catch (error) {
    console.error('Erro ao carregar tabela de preços:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});