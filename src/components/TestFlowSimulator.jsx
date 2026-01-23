import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

// Simula o fluxo completo de cadastro 3x para detectar erros
export default function TestFlowSimulator() {
  const [testResults, setTestResults] = useState([]);

  useEffect(() => {
    const runFlowTest = async (testNumber) => {
      const results = {
        testNumber,
        timestamp: new Date().toISOString(),
        steps: [],
        success: false
      };

      try {
        // STEP 1: Verificar base44 SDK
        results.steps.push({
          name: 'SDK Check',
          success: !!base44?.entities?.Client,
          message: base44?.entities?.Client ? 'SDK OK' : 'SDK não encontrado'
        });

        // STEP 2: Simular criação de cliente (dados mínimos)
        const testClient = {
          first_name: `Teste ${testNumber}`,
          decision_role: 'proprietario',
          status: 'morno'
        };

        let createdClient = null;
        try {
          createdClient = await base44.entities.Client.create(testClient);
          results.steps.push({
            name: 'Create Client',
            success: true,
            message: `Cliente criado: ID ${createdClient.id}`
          });
        } catch (error) {
          results.steps.push({
            name: 'Create Client',
            success: false,
            message: `Erro: ${error.message}`
          });
        }

        // STEP 3: Verificar numerologia
        if (createdClient) {
          const hasNumerology = createdClient.numerology_number !== undefined;
          results.steps.push({
            name: 'Numerology',
            success: hasNumerology,
            message: hasNumerology ? `Número: ${createdClient.numerology_number}` : 'Numerologia não calculada'
          });
        }

        // STEP 4: Verificar tarefa automática
        if (createdClient) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          const tasks = await base44.entities.Task.filter({ client_id: createdClient.id });
          results.steps.push({
            name: 'Auto Task',
            success: tasks.length > 0,
            message: tasks.length > 0 ? `${tasks.length} tarefas criadas` : 'Nenhuma tarefa automática'
          });
        }

        // STEP 5: Limpar teste (deletar cliente de teste)
        if (createdClient) {
          try {
            await base44.entities.Client.delete(createdClient.id);
            results.steps.push({
              name: 'Cleanup',
              success: true,
              message: 'Cliente de teste removido'
            });
          } catch (error) {
            results.steps.push({
              name: 'Cleanup',
              success: false,
              message: 'Erro ao limpar'
            });
          }
        }

        results.success = results.steps.every(s => s.success);

      } catch (error) {
        results.steps.push({
          name: 'Fatal Error',
          success: false,
          message: error.message
        });
      }

      return results;
    };

    // Testes desabilitados - causavam rate limit
    // Apenas log passivo
    console.log('✅ Sistema pronto - Testes desabilitados');

    return () => {};
  }, []);

  return null;
}