import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Equipamentos Seamaty
    const equipments = [
      {
        equipment_name: "SMT-120VP",
        equipment_type: "analisador_automatico",
        image_url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6948a8785a1926a33e78eb00/283632281__60A8875-QT3-E-1.png",
        technology: "Espectrofotometria de comprimento de onda duplo, Colorimetria de absorção, Turbidimetria de transmissão",
        sample_volume: "100µL soro/plasma/sangue total",
        processing_time: "12 minutos",
        specifications: {
          voltage: "100-240V, 50-60Hz (bivolt)",
          temperature_range: "15-35°C",
          humidity_range: "20-85%",
          nobreak_min: "600VA"
        },
        installation_guide: "Sistema embarcado automático. Configuração: WiFi → Atualização → Data/Hora → Hospital → Impressão. Manter 20cm lateral e 10cm superior livre.",
        offline_data: true
      },
      {
        equipment_name: "QT3",
        equipment_type: "sistema_modular",
        image_url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6948a8785a1926a33e78eb00/283632281__60A8875-QT3-E-1.png",
        technology: "Dual-Rotor System, Espectrofotometria enzimática",
        sample_volume: "100µL",
        processing_time: "Variável (setores individuais)",
        specifications: {
          voltage: "100-240V, 50-60Hz (bivolt)",
          temperature_range: "15-35°C",
          humidity_range: "20-85%",
          nobreak_min: "600VA"
        },
        installation_guide: "Sistema modular flexível. Base dos setores necessária. Configuração similar ao SMT-120VP.",
        offline_data: true
      },
      {
        equipment_name: "3Dx",
        equipment_type: "imunofluorescencia",
        image_url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6948a8785a1926a33e78eb00/5b45f5b1d_Designsemnomepng.png",
        technology: "Imunofluorescência + Bioquímica, Turbidimetria de transmissão",
        sample_volume: "100µL (bioquímica) + 10µL (imunofluorescência)",
        processing_time: "Variável",
        specifications: {
          voltage: "100-240V, 50-60Hz (bivolt)",
          temperature_range: "15-35°C",
          humidity_range: "20-85%",
          nobreak_min: "600VA"
        },
        installation_guide: "Requer ponteira 10µL adicional para imunofluorescência. Interface idêntica ao QT3.",
        offline_data: true
      }
    ];

    // Rotores Bioquímicos
    const rotors = [
      {
        rotor_code: "AW00650",
        rotor_name: "Coagulação (4 Parâmetros)",
        color_code: "vermelho",
        image_url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6948a8785a1926a33e78eb00/313363328_6083E376-40D6-4560-8D1C-F94E28EA50D9.jpg",
        parameters: ["APTT", "PT", "TT", "Fib"],
        parameters_count: 4,
        clinical_application: "Avaliação de coagulação sanguínea",
        indications: ["Sangramento anormal", "Pré-cirúrgico", "Monitoramento anticoagulantes", "Doença hepática"],
        diseases_detected: ["Hemofilia", "Coagulopatias", "Deficiência fator coagulação", "Toxicidade warfarin"],
        sample_type: ["sangue_total", "plasma"],
        storage_temperature: "2°C a 8°C",
        room_temp_stability: "12 horas até 30°C",
        acclimation_time: "15 minutos",
        reference_code: "AW00650",
        compatible_equipment: ["SMT-120VP", "QT3", "3Dx"],
        offline_data: true
      },
      {
        rotor_code: "AW01982",
        rotor_name: "Pré-Operatório (10 Parâmetros)",
        color_code: "azul",
        image_url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6948a8785a1926a33e78eb00/18cead469__60A9645.jpg",
        parameters: ["ALT", "AST", "ALP", "CK", "Crea", "GLU", "TP", "BUN", "LDH", "B/C*"],
        parameters_count: 10,
        clinical_application: "Screening pré-anestésico completo",
        indications: ["Avaliação pré-cirúrgica", "Check-up geriátrico", "Triagem hepatorrenal"],
        diseases_detected: ["Hepatopatias", "Doença renal", "Diabetes", "Lesão muscular"],
        sample_type: ["sangue_total", "plasma", "soro"],
        storage_temperature: "2°C a 8°C",
        room_temp_stability: "12 horas até 30°C",
        acclimation_time: "15 minutos",
        lot_number: "9240100",
        reference_code: "AW01982",
        compatible_equipment: ["SMT-120VP", "QT3", "3Dx"],
        offline_data: true
      },
      {
        rotor_code: "AW02015",
        rotor_name: "Diagnóstico Completo (16 Parâmetros)",
        color_code: "amarelo",
        image_url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6948a8785a1926a33e78eb00/a1d273cc1__60A9649.jpg",
        parameters: ["ALB", "AMY", "ALP", "ALT", "CHE", "GLU", "K+", "Na+", "Crea", "TB", "TP", "UA", "BUN", "A/G*", "B/C*", "GLOB*"],
        parameters_count: 16,
        clinical_application: "Painel completo multi-sistêmico",
        indications: ["Diagnóstico geral", "Pacientes críticos", "Emergências", "Check-up completo"],
        diseases_detected: ["Hepatopatias", "Doença renal", "Diabetes", "Distúrbios eletrolíticos", "Desidratação", "Hipoproteinemia"],
        sample_type: ["sangue_total", "plasma", "soro"],
        storage_temperature: "2°C a 8°C",
        room_temp_stability: "12 horas até 30°C",
        acclimation_time: "15 minutos",
        lot_number: "9231896",
        reference_code: "AW02015",
        compatible_equipment: ["SMT-120VP", "QT3", "3Dx"],
        offline_data: true
      },
      {
        rotor_code: "AW02014",
        rotor_name: "Inflamação Canina (6 Parâmetros)",
        color_code: "laranja",
        image_url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6948a8785a1926a33e78eb00/bd646d65f__60A9655.jpg",
        parameters: ["c-CRP", "Crea", "AMY", "LPS", "BUN", "B/C*"],
        parameters_count: 6,
        clinical_application: "Avaliação de processos inflamatórios em cães",
        indications: ["Infecção bacteriana", "Processos inflamatórios agudos", "Pancreatite", "Piometra"],
        diseases_detected: ["SIRS", "Sepse", "Inflamação aguda", "Pancreatite"],
        sample_type: ["sangue_total", "plasma", "soro"],
        storage_temperature: "2°C a 8°C",
        room_temp_stability: "12 horas até 30°C",
        acclimation_time: "15 minutos",
        lot_number: "922757",
        reference_code: "AW02014",
        compatible_equipment: ["3Dx", "QT3"],
        offline_data: true
      },
      {
        rotor_code: "AW01987",
        rotor_name: "Inflamação Felina (12 Parâmetros)",
        color_code: "marrom",
        image_url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6948a8785a1926a33e78eb00/b0bd07144__60A9686.jpg",
        parameters: ["LPS", "GGT", "f-SAA", "ALP", "BUN", "ALB", "TBA", "Crea", "TP", "A/G*", "B/C*", "GLOB*"],
        parameters_count: 12,
        clinical_application: "Inflamação felina + função hepática",
        indications: ["Peritonite infecciosa felina", "Colangiohepatite", "Lipidose hepática", "Pancreatite felina"],
        diseases_detected: ["PIF", "Colangite", "Lipidose", "Processos inflamatórios felinos"],
        sample_type: ["sangue_total", "plasma", "soro"],
        storage_temperature: "2°C a 8°C",
        room_temp_stability: "12 horas até 30°C",
        acclimation_time: "15 minutos",
        lot_number: "9240223",
        reference_code: "AW01987",
        compatible_equipment: ["3Dx", "QT3"],
        offline_data: true
      },
      {
        rotor_code: "AW01364",
        rotor_name: "Diabetes (9 Parâmetros)",
        color_code: "vermelho",
        image_url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6948a8785a1926a33e78eb00/4ad204a8b__60A9697.jpg",
        parameters: ["FRUC", "ALT", "AST", "GLU", "TG", "TC", "LAC", "AMY", "LPS"],
        parameters_count: 9,
        clinical_application: "Monitoramento de diabetes e doenças metabólicas",
        indications: ["Diabetes mellitus", "Hiperglicemia", "Cetoacidose", "Pancreatite"],
        diseases_detected: ["Diabetes", "Síndrome metabólica", "Pancreatite diabética"],
        sample_type: ["sangue_total", "plasma"],
        storage_temperature: "2°C a 8°C",
        room_temp_stability: "12 horas até 30°C",
        acclimation_time: "15 minutos",
        lot_number: "9240169",
        reference_code: "AW01364",
        compatible_equipment: ["SMT-120VP", "QT3", "3Dx"],
        offline_data: true
      },
      {
        rotor_code: "AW03198",
        rotor_name: "Diagnóstico Primário (5 Parâmetros)",
        color_code: "roxo",
        image_url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6948a8785a1926a33e78eb00/db32725c9__60A9701.jpg",
        parameters: ["BUN", "Crea", "AST", "ALT", "TP"],
        parameters_count: 5,
        clinical_application: "Triagem rápida hepatorrenal",
        indications: ["Screening básico", "Emergências", "Consultas rápidas"],
        diseases_detected: ["Azotemia", "Hepatopatias", "Desidratação"],
        sample_type: ["sangue_total", "plasma", "soro"],
        storage_temperature: "2°C a 8°C",
        room_temp_stability: "12 horas até 30°C",
        acclimation_time: "15 minutos",
        lot_number: "9241095",
        reference_code: "AW03198",
        compatible_equipment: ["SMT-120VP", "QT3", "3Dx"],
        offline_data: true
      },
      {
        rotor_code: "LIVER",
        rotor_name: "Rotor Hepático (Liver)",
        color_code: "verde",
        image_url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6948a8785a1926a33e78eb00/6c00c6801__60A9703.jpg",
        parameters: ["ALT", "AST", "ALP", "GGT", "TBIL", "TP", "ALB"],
        parameters_count: 7,
        clinical_application: "Avaliação completa função hepática",
        indications: ["Icterícia", "Vômitos + anorexia", "Hepatopatia", "Triagem pré-anestésica", "Medicações hepatotóxicas"],
        diseases_detected: ["Hepatite aguda", "Colestase", "Lipidose hepática felina", "Cirrose", "Shunt portossistêmico"],
        sample_type: ["sangue_total", "plasma", "soro"],
        storage_temperature: "2°C a 8°C",
        room_temp_stability: "12 horas até 30°C",
        acclimation_time: "15 minutos",
        reference_code: "LIVER",
        compatible_equipment: ["SMT-120VP", "QT3", "3Dx"],
        offline_data: true
      },
      {
        rotor_code: "KIDNEY",
        rotor_name: "Rotor Renal (Kidney)",
        color_code: "ciano",
        image_url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6948a8785a1926a33e78eb00/fcceec629_IMG_1256.jpg",
        parameters: ["CREA", "BUN", "PHOS", "Ca", "K", "Na", "Cl"],
        parameters_count: 7,
        clinical_application: "Função renal completa + eletrólitos",
        indications: ["PU/PD", "Vômitos + desidratação", "Suspeita DRC/IRA", "Anúria", "Convulsões urêmicas"],
        diseases_detected: ["IRA", "DRC", "Obstrução uretral", "Desidratação", "Doença de Addison"],
        sample_type: ["sangue_total", "plasma", "soro"],
        storage_temperature: "2°C a 8°C",
        room_temp_stability: "12 horas até 30°C",
        acclimation_time: "15 minutos",
        reference_code: "KIDNEY",
        compatible_equipment: ["SMT-120VP", "QT3", "3Dx"],
        offline_data: true
      },
      {
        rotor_code: "PANCREAS",
        rotor_name: "Rotor Pancreático (Pancreas)",
        color_code: "laranja",
        image_url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6948a8785a1926a33e78eb00/76673ac3a_Rotor.png",
        parameters: ["AMYL", "LIPA", "GLU", "Ca", "TP", "ALB"],
        parameters_count: 6,
        clinical_application: "Avaliação pancreática completa",
        indications: ["Vômitos agudos + dor abdominal", "Anorexia súbita", "Diarreia + icterícia", "Suspeita pancreatite", "Abdome agudo"],
        diseases_detected: ["Pancreatite aguda", "Diabetes mellitus", "Insuficiência pancreática exócrina", "Hipocalcemia"],
        sample_type: ["sangue_total", "plasma", "soro"],
        storage_temperature: "2°C a 8°C",
        room_temp_stability: "12 horas até 30°C",
        acclimation_time: "15 minutos",
        reference_code: "PANCREAS",
        compatible_equipment: ["SMT-120VP", "QT3", "3Dx"],
        offline_data: true
      },
      {
        rotor_code: "BE5",
        rotor_name: "BE5 Setor Enzimático",
        color_code: "verde",
        image_url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6948a8785a1926a33e78eb00/edf285a27_IMG_3478PNG1.jpg",
        parameters: ["Parâmetros setorizados (enzimas hepáticas)"],
        parameters_count: 5,
        clinical_application: "Setor parcial para economia de custos",
        indications: ["Repetição de testes alterados", "Diluições", "Testes específicos isolados"],
        diseases_detected: ["Conforme parâmetros selecionados"],
        sample_type: ["sangue_total", "plasma", "soro"],
        storage_temperature: "2°C a 8°C",
        room_temp_stability: "12 horas até 30°C",
        acclimation_time: "15 minutos",
        reference_code: "BE5",
        compatible_equipment: ["QT3", "3Dx"],
        offline_data: true
      }
    ];

    // Inserir equipamentos
    for (const eq of equipments) {
      await base44.asServiceRole.entities.SeamatyEquipment.create(eq);
    }

    // Inserir rotores
    for (const rotor of rotors) {
      await base44.asServiceRole.entities.BiochemistryRotor.create(rotor);
    }

    return Response.json({
      success: true,
      message: `${equipments.length} equipamentos e ${rotors.length} rotores cadastrados com sucesso!`,
      equipments_count: equipments.length,
      rotors_count: rotors.length
    });

  } catch (error) {
    console.error('Erro ao processar catálogo:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});