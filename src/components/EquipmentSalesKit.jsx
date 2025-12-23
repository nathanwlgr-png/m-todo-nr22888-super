import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Copy, 
  MessageCircle, 
  Mail, 
  Sparkles, 
  Target, 
  Shield,
  TrendingUp,
  Zap,
  Award,
  FileText,
  Play
} from 'lucide-react';
import { toast } from 'sonner';

export default function EquipmentSalesKit({ equipment, client }) {
  const [activeTab, setActiveTab] = useState('overview');

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const personalizeMess = (template) => {
    if (!client) return template;
    return template
      .replace(/{nome}/g, client.first_name || 'cliente')
      .replace(/{clinica}/g, client.clinic_name || 'sua clínica');
  };

  if (!equipment) return null;

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-5 text-white">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-2xl font-bold mb-1">{equipment.equipment_name}</h2>
            <p className="text-orange-100 text-sm">{equipment.category}</p>
            {equipment.price && (
              <p className="text-2xl font-bold mt-2">R$ {equipment.price.toLocaleString()}</p>
            )}
          </div>
          {equipment.image_urls?.[0] && (
            <img src={equipment.image_urls[0]} className="w-20 h-20 rounded-lg object-cover" />
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="p-4">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="overview">Info</TabsTrigger>
          <TabsTrigger value="messages">Mensagens</TabsTrigger>
          <TabsTrigger value="triggers">Gatilhos</TabsTrigger>
          <TabsTrigger value="cases">Casos</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div>
            <h4 className="font-semibold text-slate-800 mb-2">Resumo</h4>
            <p className="text-sm text-slate-700">{equipment.summary}</p>
          </div>

          {equipment.differentiators && equipment.differentiators.length > 0 && (
            <div>
              <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                <Award className="w-4 h-4 text-orange-600" />
                Diferenciais Únicos
              </h4>
              <div className="space-y-2">
                {equipment.differentiators.map((diff, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 bg-orange-50 rounded-lg">
                    <Shield className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-slate-700">{diff}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {equipment.competitive_advantages && (
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-2">🏆 Vantagens Competitivas</h4>
              {equipment.competitive_advantages.unique_features?.map((feature, i) => (
                <p key={i} className="text-sm text-green-800 mb-1">✓ {feature}</p>
              ))}
              {equipment.competitive_advantages.exclusivity && (
                <p className="text-sm font-bold text-green-900 mt-2">
                  🎯 {equipment.competitive_advantages.exclusivity}
                </p>
              )}
            </div>
          )}

          {equipment.benefits && equipment.benefits.length > 0 && (
            <div>
              <h4 className="font-semibold text-slate-800 mb-2">Benefícios</h4>
              <div className="grid grid-cols-1 gap-2">
                {equipment.benefits.map((benefit, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-600" />
                    {benefit}
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Messages */}
        <TabsContent value="messages" className="space-y-4 mt-4">
          {equipment.catchphrases && equipment.catchphrases.length > 0 && (
            <div>
              <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-600" />
                Frases de Efeito
              </h4>
              <div className="space-y-2">
                {equipment.catchphrases.map((phrase, i) => (
                  <div key={i} className="p-3 bg-purple-50 rounded-lg flex items-start gap-2">
                    <p className="flex-1 text-sm font-medium text-purple-900">{phrase}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(phrase, 'Frase')}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {equipment.whatsapp_templates && equipment.whatsapp_templates.length > 0 && (
            <div>
              <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-green-600" />
                Templates WhatsApp
              </h4>
              <div className="space-y-2">
                {equipment.whatsapp_templates.map((template, i) => (
                  <div key={i} className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-slate-700 mb-2 whitespace-pre-wrap">
                      {personalizeMess(template)}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(personalizeMess(template), 'Mensagem WhatsApp')}
                      className="w-full"
                    >
                      <Copy className="w-3 h-3 mr-2" />
                      Copiar
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {equipment.email_templates && equipment.email_templates.length > 0 && (
            <div>
              <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600" />
                Templates Email
              </h4>
              <div className="space-y-2">
                {equipment.email_templates.map((template, i) => (
                  <div key={i} className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-slate-700 mb-2 whitespace-pre-wrap">
                      {personalizeMess(template)}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(personalizeMess(template), 'Email')}
                      className="w-full"
                    >
                      <Copy className="w-3 h-3 mr-2" />
                      Copiar
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Gatilhos de Persuasão */}
        <TabsContent value="triggers" className="space-y-4 mt-4">
          {equipment.persuasion_triggers && (
            <div className="space-y-3">
              {equipment.persuasion_triggers.scarcity?.length > 0 && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <h5 className="font-bold text-red-900 text-sm mb-2">🔥 Escassez</h5>
                  {equipment.persuasion_triggers.scarcity.map((item, i) => (
                    <p key={i} className="text-sm text-red-800 mb-1">• {item}</p>
                  ))}
                </div>
              )}

              {equipment.persuasion_triggers.urgency?.length > 0 && (
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <h5 className="font-bold text-orange-900 text-sm mb-2">⚡ Urgência</h5>
                  {equipment.persuasion_triggers.urgency.map((item, i) => (
                    <p key={i} className="text-sm text-orange-800 mb-1">• {item}</p>
                  ))}
                </div>
              )}

              {equipment.persuasion_triggers.authority?.length > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h5 className="font-bold text-blue-900 text-sm mb-2">🏆 Autoridade</h5>
                  {equipment.persuasion_triggers.authority.map((item, i) => (
                    <p key={i} className="text-sm text-blue-800 mb-1">• {item}</p>
                  ))}
                </div>
              )}

              {equipment.persuasion_triggers.social_proof?.length > 0 && (
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <h5 className="font-bold text-purple-900 text-sm mb-2">👥 Prova Social</h5>
                  {equipment.persuasion_triggers.social_proof.map((item, i) => (
                    <p key={i} className="text-sm text-purple-800 mb-1">• {item}</p>
                  ))}
                </div>
              )}

              {equipment.persuasion_triggers.reciprocity?.length > 0 && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <h5 className="font-bold text-green-900 text-sm mb-2">🎁 Reciprocidade</h5>
                  {equipment.persuasion_triggers.reciprocity.map((item, i) => (
                    <p key={i} className="text-sm text-green-800 mb-1">• {item}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {equipment.objection_handling && equipment.objection_handling.length > 0 && (
            <div>
              <h4 className="font-semibold text-slate-800 mb-2">💬 Tratamento de Objeções</h4>
              <div className="space-y-2">
                {equipment.objection_handling.map((obj, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm font-semibold text-red-700 mb-1">❌ "{obj.objection}"</p>
                    <p className="text-sm text-green-700 mb-1">✓ {obj.response}</p>
                    {obj.proof_point && (
                      <p className="text-xs text-blue-600">📊 {obj.proof_point}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Casos Clínicos */}
        <TabsContent value="cases" className="space-y-4 mt-4">
          {equipment.clinical_cases && equipment.clinical_cases.length > 0 ? (
            equipment.clinical_cases.map((clinicalCase, i) => (
              <div key={i} className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                <h5 className="font-bold text-indigo-900 mb-2">{clinicalCase.case_title}</h5>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-semibold text-red-700">Problema:</span>
                    <p className="text-slate-700">{clinicalCase.problem}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-blue-700">Solução:</span>
                    <p className="text-slate-700">{clinicalCase.solution}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-green-700">Resultado:</span>
                    <p className="text-slate-700">{clinicalCase.outcome}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p className="text-sm text-slate-500">Nenhum caso clínico cadastrado</p>
            </div>
          )}

          {equipment.roi_calculator && (
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <h5 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                ROI Estimado
              </h5>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-2 bg-white rounded">
                  <p className="text-green-700">Custo por Teste</p>
                  <p className="font-bold text-green-900">R$ {equipment.roi_calculator.cost_per_test}</p>
                </div>
                <div className="p-2 bg-white rounded">
                  <p className="text-green-700">Receita por Teste</p>
                  <p className="font-bold text-green-900">R$ {equipment.roi_calculator.revenue_per_test}</p>
                </div>
                <div className="p-2 bg-green-100 rounded col-span-2">
                  <p className="text-green-800">Retorno do Investimento</p>
                  <p className="font-bold text-green-900 text-lg">
                    {equipment.roi_calculator.payback_months} meses
                  </p>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="p-4 bg-slate-50 border-t grid grid-cols-2 gap-2">
        {client?.phone && equipment.whatsapp_templates?.[0] && (
          <Button
            onClick={() => {
              const message = personalizeMess(equipment.whatsapp_templates[0]);
              window.open(`https://wa.me/${client.phone}?text=${encodeURIComponent(message)}`, '_blank');
            }}
            className="bg-green-600 hover:bg-green-700"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Enviar
          </Button>
        )}
        {equipment.video_url && (
          <Button
            onClick={() => window.open(equipment.video_url, '_blank')}
            variant="outline"
          >
            <Play className="w-4 h-4 mr-2" />
            Vídeo
          </Button>
        )}
      </div>
    </Card>
  );
}