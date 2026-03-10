import React from 'react';
import DirectMaterialUploader from '@/components/DirectMaterialUploader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sparkles, Upload, Send, Zap } from 'lucide-react';

export default function MaterialUploadHub() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">
              Central de Materiais IA
            </h1>
          </div>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Envie imagens, catálogos ou documentos diretamente. Nossa IA analisa automaticamente,
            identifica o interesse do cliente e envia mensagens personalizadas via WhatsApp.
          </p>
        </div>

        {/* Como Funciona */}
        <Card className="bg-white/80 backdrop-blur border-indigo-200">
          <CardHeader>
            <CardTitle className="text-lg">Como Funciona</CardTitle>
            <CardDescription>
              Processo automatizado em 3 passos simples
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex flex-col items-center text-center space-y-2 p-4 bg-indigo-50 rounded-lg">
                <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                  <Upload className="w-5 h-5 text-white" />
                </div>
                <p className="font-semibold text-sm">1. Enviar Material</p>
                <p className="text-xs text-slate-600">
                  Faça upload de imagens, PDFs, catálogos ou documentos
                </p>
              </div>

              <div className="flex flex-col items-center text-center space-y-2 p-4 bg-purple-50 rounded-lg">
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <p className="font-semibold text-sm">2. Análise IA</p>
                <p className="text-xs text-slate-600">
                  IA extrai dados, analisa fit com o cliente e gera mensagem personalizada
                </p>
              </div>

              <div className="flex flex-col items-center text-center space-y-2 p-4 bg-green-50 rounded-lg">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                  <Send className="w-5 h-5 text-white" />
                </div>
                <p className="font-semibold text-sm">3. Envio Automático</p>
                <p className="text-xs text-slate-600">
                  Mensagem otimizada é enviada via WhatsApp e registrada no CRM
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Uploader Principal */}
        <DirectMaterialUploader />

        {/* Dicas */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-blue-900">Dicas para Melhores Resultados:</p>
                <ul className="list-disc list-inside text-blue-800 space-y-1">
                  <li>Use imagens claras e de alta qualidade</li>
                  <li>PDFs com texto são melhor analisados que imagens escaneadas</li>
                  <li>Certifique-se que o cliente tem WhatsApp cadastrado</li>
                  <li>A IA considera o perfil completo do cliente na análise</li>
                  <li>Materiais enviados ficam salvos na base de conhecimento</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}