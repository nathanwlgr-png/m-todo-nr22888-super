import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// deno-lint-ignore no-undef
// eslint-disable-next-line no-undef
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all clients with equipment data
    const clients = await base44.asServiceRole.entities.Client.list();
    
    // Calculate ROI for each client
    const clinicData = clients
      .filter(client => client.clinic_name && client.city)
      .map(client => {
        // ROI calculation based on equipment and consumables
        const estimatedMonthlyConsumables = calculateMonthlyConsumables(client);
        const estimatedAnnualValue = estimatedMonthlyConsumables * 12;
        const equipmentCost = client.equipment_sold ? 25000 : 0; // Average equipment cost
        const roiMonths = equipmentCost > 0 ? Math.round(equipmentCost / estimatedMonthlyConsumables) : 0;

        return {
          clinicName: client.clinic_name,
          ownerName: client.full_name,
          city: client.city,
          phone: client.phone,
          currentEquipment: client.current_equipment || 'Sem equipamento',
          equipmentSold: client.equipment_sold || 'N/A',
          estimatedMonthlyConsumables: estimatedMonthlyConsumables,
          estimatedAnnualValue: estimatedAnnualValue,
          roiMonths: roiMonths,
          status: client.status,
          pipelineStage: client.pipeline_stage,
          lastContact: client.last_contact_date,
          healthScore: client.health_score || 0,
        };
      })
      .sort((a, b) => b.estimatedAnnualValue - a.estimatedAnnualValue);

    // Calculate summary metrics
    const totalEstimatedAnnualValue = clinicData.reduce((sum, c) => sum + c.estimatedAnnualValue, 0);
    const avgROI = clinicData.length > 0 ? clinicData.reduce((sum, c) => sum + c.roiMonths, 0) / clinicData.length : 0;
    const highPotentialCount = clinicData.filter(c => c.estimatedAnnualValue > 50000).length;

    const report = {
      generatedAt: new Date().toISOString(),
      territory: 'Nathan',
      summary: {
        totalClinicsMaped: clinicData.length,
        totalEstimatedAnnualValue: totalEstimatedAnnualValue,
        averageROIMonths: Math.round(avgROI),
        highPotentialClinics: highPotentialCount,
      },
      clinics: clinicData,
    };

    return Response.json(report);
  } catch (error) {
    console.error('Erro ao gerar relatório consolidado:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function calculateMonthlyConsumables(client) {
  // Base estimate based on current volume
  const volumeMap = {
    'menos_40_mes': 400,
    '40_120_mes': 1200,
    '120_230_mes': 2800,
    'mais_230_mes': 5000,
  };

  const baseValue = volumeMap[client.current_volume] || 1000;
  const multiplier = client.equipment_sold ? 1.5 : 1; // Higher consumption with new equipment
  
  return baseValue * multiplier;
}