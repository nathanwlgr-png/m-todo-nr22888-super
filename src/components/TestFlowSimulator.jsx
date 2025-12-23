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

    const runAllTests = async () => {
      console.log('🧪 Iniciando testes de fluxo (3x)...');
      
      const allResults = [];
      
      for (let i = 1; i <= 3; i++) {
        console.log(`\n🔬 Teste ${i}/3 iniciando...`);
        const result = await runFlowTest(i);
        allResults.push(result);
        
        console.log(`✅ Teste ${i} concluído:`, result.success ? 'SUCESSO' : 'FALHA');
        result.steps.forEach(step => {
          console.log(`  ${step.success ? '✓' : '✗'} ${step.name}: ${step.message}`);
        });
        
        // Aguarda 3 segundos entre testes
        if (i < 3) await new Promise(resolve => setTimeout(resolve, 3000));
      }

      setTestResults(allResults);

      // Resumo final
      const allSuccess = allResults.every(r => r.success);
      const totalSteps = allResults.reduce((sum, r) => sum + r.steps.length, 0);
      const successSteps = allResults.reduce((sum, r) => sum + r.steps.filter(s => s.success).length, 0);

      console.log('\n📊 RESUMO DOS TESTES:');
      console.log(`Total de testes: 3`);
      console.log(`Testes bem-sucedidos: ${allResults.filter(r => r.success).length}`);
      console.log(`Taxa de sucesso: ${successSteps}/${totalSteps} (${Math.round(successSteps/totalSteps*100)}%)`);

      if (allSuccess) {
        toast.success('✅ Todos os testes passaram!');
      } else {
        toast.error('⚠️ Alguns testes falharam. Verifique o console.');
      }
    };

    // Inicia testes após 2 segundos
    const timeout = setTimeout(runAllTests, 2000);

    return () => clearTimeout(timeout);
  }, []);

  return null;
}