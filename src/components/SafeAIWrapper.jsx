import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

/**
 * Wrapper seguro para chamadas de IA com fallback e controle de modo
 */
export async function safeInvokeLLM(prompt, options = {}) {
  try {
    // Verificar modo AI
    const aiMode = localStorage.getItem('nr22_ai_mode') || 'economy';
    const whatsappAI = localStorage.getItem('nr22_ai_whatsapp') !== 'false';
    
    // Se for contexto WhatsApp e WhatsApp AI está ativo, permitir
    if (options.context === 'whatsapp' && whatsappAI) {
      return await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: options.useInternet || false,
        response_json_schema: options.schema
      });
    }

    // Se modo off e não é WhatsApp, retornar fallback
    if (aiMode === 'off' && options.context !== 'whatsapp') {
      if (options.fallback) {
        return options.fallback;
      }
      throw new Error('AI_MODE_OFF');
    }

    // Se modo economy e não forçado manualmente, retornar fallback
    if (aiMode === 'economy' && !options.forceAI && options.context !== 'whatsapp') {
      if (options.fallback) {
        return options.fallback;
      }
      throw new Error('AI_MODE_ECONOMY');
    }

    // Tentar chamar IA
    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: options.useInternet || false,
      response_json_schema: options.schema,
      file_urls: options.fileUrls
    });

    return result;

  } catch (error) {
    // Se erro de limite, retornar fallback
    if (error.message?.includes('limit')) {
      if (options.fallback) {
        toast.warning('Usando modo econômico (limite atingido)');
        return options.fallback;
      }
      throw error;
    }

    // Se modo desligado
    if (error.message === 'AI_MODE_OFF') {
      toast.info('Modo AI desligado');
      if (options.fallback) return options.fallback;
      throw new Error('AI está desligada. Ative na Home.');
    }

    // Se modo economia
    if (error.message === 'AI_MODE_ECONOMY') {
      if (options.fallback) return options.fallback;
      throw new Error('Modo econômico ativo');
    }

    throw error;
  }
}

/**
 * Hook para verificar status de AI
 */
export function useAIStatus() {
  const [aiMode, setAiMode] = React.useState(() => 
    localStorage.getItem('nr22_ai_mode') || 'economy'
  );
  
  const [whatsappAI, setWhatsappAI] = React.useState(() =>
    localStorage.getItem('nr22_ai_whatsapp') !== 'false'
  );

  React.useEffect(() => {
    const handleStorage = () => {
      setAiMode(localStorage.getItem('nr22_ai_mode') || 'economy');
      setWhatsappAI(localStorage.getItem('nr22_ai_whatsapp') !== 'false');
    };
    
    window.addEventListener('storage', handleStorage);
    const interval = setInterval(handleStorage, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);

  return {
    aiMode,
    isAIEnabled: aiMode !== 'off',
    whatsappAIEnabled: whatsappAI,
    needsManualActivation: aiMode === 'economy'
  };
}