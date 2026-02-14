import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Download, CheckCircle2, Database, FileText, Users, Loader2 } from 'lucide-react';

// Livros e frameworks de vendas em texto
const SALES_BOOKS_DATA = {
  spin_selling: {
    title: "SPIN Selling",
    author: "Neil Rackham",
    key_concepts: [
      "Situation Questions - Entender contexto atual",
      "Problem Questions - Identificar problemas",
      "Implication Questions - Ampliar consequências",
      "Need-Payoff Questions - Valor da solução"
    ],
    scripts: [
      "Situação: 'Como funciona seu processo atual de exames?'",
      "Problema: 'Quais dificuldades você enfrenta com o equipamento atual?'",
      "Implicação: 'Como isso afeta o tempo de diagnóstico dos pacientes?'",
      "Need-Payoff: 'Se você pudesse reduzir o tempo pela metade, qual seria o impacto?'"
    ]
  },
  cialdini: {
    title: "As Armas da Persuasão",
    author: "Robert Cialdini",
    principles: [
      "Reciprocidade - Dê valor antes de pedir",
      "Compromisso e Coerência - Pequenos sims levam a grandes sims",
      "Prova Social - Mostre quem já usa",
      "Autoridade - Use credenciais e expertise",
      "Escassez - Limitação genuína",
      "Afeição - Construa rapport"
    ]
  },
  never_split: {
    title: "Never Split the Difference",
    author: "Chris Voss",
    techniques: [
      "Mirroring - Repetir últimas palavras",
      "Labeling - Nomear emoções",
      "Calibrated Questions - Perguntas abertas com 'Como' e 'O que'",
      "Accusation Audit - Antecipar objeções",
      "That's Right - Buscar confirmação profunda"
    ]
  },
  challenger_sale: {
    title: "The Challenger Sale",
    author: "Matthew Dixon",
    approach: [
      "Ensinar - Trazer insights novos",
      "Adaptar - Personalizar mensagem",
      "Controlar - Guiar a conversa",
      "Desafiar - Questionar status quo"
    ]
  }
};

const NUMEROLOGY_CALCULATOR = {
  calculateFromName: (name) => {
    const values = { A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,I:9,J:1,K:2,L:3,M:4,N:5,O:6,P:7,Q:8,R:9,S:1,T:2,U:3,V:4,W:5,X:6,Y:7,Z:8 };
    const cleanName = name.toUpperCase().replace(/[^A-Z]/g, '');
    let sum = 0;
    for (let char of cleanName) {
      sum += values[char] || 0;
    }
    while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
      sum = String(sum).split('').reduce((a, b) => a + parseInt(b), 0);
    }
    return sum;
  },
  
  getProfile: (number) => {
    const profiles = {
      1: { profile: "Líder Natural", decision: "Rápido e direto", tip: "Seja assertivo, mostre resultados imediatos" },
      2: { profile: "Diplomata", decision: "Analítico e cuidadoso", tip: "Construa confiança, mostre dados" },
      3: { profile: "Comunicador", decision: "Criativo e social", tip: "Use storytelling, cases de sucesso" },
      4: { profile: "Organizador", decision: "Metódico e prático", tip: "Processo claro, garantias sólidas" },
      5: { profile: "Aventureiro", decision: "Inovador e ousado", tip: "Destaque inovação e tecnologia" },
      6: { profile: "Conselheiro", decision: "Empático e responsável", tip: "Foco em benefício dos pacientes" },
      7: { profile: "Analítico", decision: "Investigativo e técnico", tip: "Dados científicos, estudos" },
      8: { profile: "Executivo", decision: "Focado em ROI", tip: "Números, retorno financeiro" },
      9: { profile: "Humanista", decision: "Idealista e generoso", tip: "Impacto social, qualidade de vida" }
    };
    return profiles[number] || profiles[1];
  }
};

export default function OfflineDataPack() {
  const [downloading, setDownloading] = useState(false);
  const [offlineData, setOfflineData] = useState(null);
  const [dataSize, setDataSize] = useState(0);

  useEffect(() => {
    const cached = localStorage.getItem('nr22_offline_pack');
    if (cached) {
      try {
        const data = JSON.parse(cached);
        setOfflineData(data);
        setDataSize(new Blob([cached]).size / 1024); // KB
      } catch (error) {
        console.error('Erro ao carregar cache:', error);
      }
    }
  }, []);

  const downloadOfflinePack = async () => {
    setDownloading(true);
    const loading = toast.loading('📦 Baixando pacote offline completo...');

    try {
      // Buscar todos os dados
      const [clients, tasks, visits, sales, equipment, documents] = await Promise.all([
        base44.entities.Client.list('-updated_date', 10000),
        base44.entities.Task.list('-created_date', 1000),
        base44.entities.Visit.list('-created_date', 1000),
        base44.entities.Sale.list('-created_date', 1000),
        base44.entities.Equipment.list(),
        base44.entities.ExportedDocument.list('-created_date', 200)
      ]);

      const offlinePack = {
        clients,
        tasks,
        visits,
        sales,
        equipment,
        documents,
        sales_books: SALES_BOOKS_DATA,
        numerology: NUMEROLOGY_CALCULATOR,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };

      // Salvar no localStorage
      const packString = JSON.stringify(offlinePack);
      localStorage.setItem('nr22_offline_pack', packString);
      
      setOfflineData(offlinePack);
      setDataSize(new Blob([packString]).size / 1024);

      toast.dismiss(loading);
      toast.success(
        `✅ Pacote offline baixado!\n\n` +
        `👥 ${clients.length} clientes\n` +
        `📋 ${tasks.length} tarefas\n` +
        `📅 ${visits.length} visitas\n` +
        `💰 ${sales.length} vendas\n` +
        `📚 Livros de vendas incluídos\n` +
        `🔢 Calculadora numerológica\n\n` +
        `Tamanho: ${Math.round(dataSize)} KB`,
        { duration: 8000 }
      );

    } catch (error) {
      toast.dismiss(loading);
      toast.error('Erro ao baixar: ' + error.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-300">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center">
          <Database className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-indigo-900">📦 Pacote Offline Completo</h3>
          <p className="text-xs text-indigo-600">
            {offlineData 
              ? `Baixado: ${Math.round(dataSize)} KB • ${offlineData.clients?.length || 0} clientes`
              : 'Baixe tudo para usar sem internet'
            }
          </p>
        </div>
        {offlineData && (
          <CheckCircle2 className="w-6 h-6 text-green-600" />
        )}
      </div>

      <div className="space-y-3">
        {offlineData && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-white rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-indigo-900">{offlineData.clients?.length || 0}</p>
              <p className="text-xs text-slate-600">Clientes</p>
            </div>
            <div className="bg-white rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-indigo-900">{offlineData.tasks?.length || 0}</p>
              <p className="text-xs text-slate-600">Tarefas</p>
            </div>
            <div className="bg-white rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-indigo-900">4</p>
              <p className="text-xs text-slate-600">Livros</p>
            </div>
          </div>
        )}

        <Button
          onClick={downloadOfflinePack}
          disabled={downloading}
          className="w-full bg-indigo-600 hover:bg-indigo-700"
        >
          {downloading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Baixando...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              {offlineData ? 'Atualizar Pacote' : 'Baixar Pacote Offline'}
            </>
          )}
        </Button>

        {offlineData && (
          <div className="text-xs text-slate-600 text-center">
            Última atualização: {new Date(offlineData.timestamp).toLocaleString('pt-BR')}
          </div>
        )}

        <div className="bg-white rounded-lg p-3 border border-indigo-200">
          <p className="text-xs font-semibold text-indigo-800 mb-2">✅ Incluído no pacote:</p>
          <ul className="text-xs text-slate-600 space-y-1">
            <li>• Todos os clientes e dados</li>
            <li>• Tarefas, visitas e vendas</li>
            <li>• SPIN Selling completo</li>
            <li>• Cialdini - 6 princípios</li>
            <li>• Never Split the Difference</li>
            <li>• Calculadora numerológica</li>
            <li>• Funciona 100% offline</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}

// Função para acessar dados offline
export function getOfflineData() {
  const cached = localStorage.getItem('nr22_offline_pack');
  if (!cached) return null;
  
  try {
    return JSON.parse(cached);
  } catch {
    return null;
  }
}

// Calcular numerologia offline
export function calculateNumerologyOffline(name) {
  return NUMEROLOGY_CALCULATOR.calculateFromName(name);
}

export function getNumerologyProfile(number) {
  return NUMEROLOGY_CALCULATOR.getProfile(number);
}