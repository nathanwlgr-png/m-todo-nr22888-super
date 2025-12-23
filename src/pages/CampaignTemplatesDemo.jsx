import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Upload, FileText, DollarSign, CheckCircle2, Sparkles } from 'lucide-react';

export default function CampaignTemplatesDemo() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-gradient-to-br from-purple-900 to-indigo-900 px-4 pt-4 pb-16">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Sistema de Templates</h1>
            <p className="text-purple-200 text-sm">Como funciona</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-8 space-y-4">
        {/* Step 1 */}
        <Card className="p-5 bg-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <span className="font-bold text-purple-600">1</span>
            </div>
            <h3 className="font-bold text-slate-900">Upload dos Templates</h3>
          </div>
          
          <div className="ml-13 space-y-3">
            <p className="text-sm text-slate-600">
              Na aba <Badge>Templates</Badge> de qualquer campanha, faça upload de:
            </p>
            
            <div className="space-y-2">
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-purple-600" />
                  <p className="font-semibold text-sm">Modelo de Proposta (.docx, .pdf)</p>
                </div>
                <p className="text-xs text-slate-600">Template base para propostas comerciais</p>
              </div>

              <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <p className="font-semibold text-sm">Modelo de Contrato (.docx, .pdf)</p>
                </div>
                <p className="text-xs text-slate-600">Template jurídico para contratos de venda</p>
              </div>

              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <p className="font-semibold text-sm">Tabela Retorno Financeiro (.xlsx, .pdf)</p>
                </div>
                <p className="text-xs text-slate-600">Calculadora de ROI para o cliente</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Step 2 */}
        <Card className="p-5 bg-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <span className="font-bold text-orange-600">2</span>
            </div>
            <h3 className="font-bold text-slate-900">Condições de Pagamento</h3>
          </div>
          
          <div className="ml-13">
            <p className="text-sm text-slate-600 mb-3">Configure automaticamente:</p>
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>✓ À Vista</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>✓ PICS até 36x</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>✓ Financiamento Santander até 36x</span>
                </div>
              </div>
              <div className="mt-3 p-2 bg-white rounded text-xs text-slate-700">
                <strong>Observação:</strong> Equipamentos não possuem desconto. Formas de pagamento disponíveis conforme acima.
              </div>
            </div>
          </div>
        </Card>

        {/* Step 3 */}
        <Card className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <span className="font-bold text-green-600">3</span>
            </div>
            <h3 className="font-bold text-slate-900">Geração Automática</h3>
          </div>
          
          <div className="ml-13 space-y-3">
            <p className="text-sm text-slate-700 font-semibold">
              <Sparkles className="w-4 h-4 inline text-green-600 mr-1" />
              No perfil do cliente:
            </p>
            
            <div className="space-y-2 text-sm">
              <p>1. Selecione o equipamento (ex: SMP-V5)</p>
              <p>2. Clique em "Gerar Proposta" ou "Gerar Contrato"</p>
              <p>3. IA preenche automaticamente:</p>
              <ul className="ml-6 space-y-1 text-xs text-slate-600">
                <li>• Nome completo, CNPJ, razão social</li>
                <li>• Endereço e dados de contato</li>
                <li>• Equipamento com preço e specs</li>
                <li>• Bonificação do mês</li>
                <li>• Condições de pagamento</li>
                <li>• Prazo de validade e próximos passos</li>
              </ul>
            </div>

            <div className="p-3 bg-white rounded-lg border-2 border-green-300">
              <p className="text-xs font-semibold text-green-800 mb-1">💾 Salvamento Automático</p>
              <p className="text-xs text-slate-600">
                Documento fica salvo no perfil do cliente, pronto para download e envio
              </p>
            </div>
          </div>
        </Card>

        {/* Example Output */}
        <Card className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <h3 className="font-bold text-slate-900 mb-3">📄 Exemplo de Saída</h3>
          <div className="bg-white p-4 rounded-lg border text-sm space-y-2">
            <p className="font-bold text-indigo-900">PROPOSTA COMERCIAL Nº 2025-001</p>
            <hr />
            <p><strong>Cliente:</strong> Clínica VetLife - Dr. João Silva</p>
            <p><strong>CNPJ:</strong> 12.345.678/0001-90</p>
            <p><strong>Endereço:</strong> Rua das Flores, 123 - São Paulo/SP</p>
            <hr />
            <p className="font-semibold">Equipamento: Analisador Hematológico SMP-V5</p>
            <p className="text-xs text-slate-600">Especificações técnicas completas...</p>
            <p><strong>Valor:</strong> R$ 45.000,00</p>
            <p className="text-xs text-green-700">🎁 Bonificação: 20% em reagentes no primeiro mês</p>
            <hr />
            <p className="font-semibold">Formas de Pagamento:</p>
            <ul className="text-xs ml-4">
              <li>• À Vista</li>
              <li>• PICS até 36x</li>
              <li>• Financiamento Santander até 36x</li>
            </ul>
            <p className="text-xs text-slate-500 mt-2">Validade: 30 dias</p>
          </div>
        </Card>

        {/* CTA */}
        <div className="text-center pt-4">
          <Button
            onClick={() => navigate(createPageUrl('Campaigns'))}
            className="bg-purple-600 hover:bg-purple-700"
            size="lg"
          >
            <Upload className="w-5 h-5 mr-2" />
            Ir para Campanhas
          </Button>
        </div>
      </div>
    </div>
  );
}