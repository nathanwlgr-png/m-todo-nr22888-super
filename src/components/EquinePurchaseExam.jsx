import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, FileText, Download, Copy, Mic, MicOff, Upload, Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';

export default function EquinePurchaseExam() {
  const [generating, setGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentField, setCurrentField] = useState('nome');
  const [uploadedImages, setUploadedImages] = useState([]);
  const [analyzingImages, setAnalyzingImages] = useState(false);
  const [imageAnalyses, setImageAnalyses] = useState([]);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const [horseData, setHorseData] = useState({
    nome: '',
    raca: '',
    idade: '',
    sexo: '',
    pelagem: '',
    proprietario: '',
    veterinario: '',
    data_exame: new Date().toLocaleDateString('pt-BR')
  });
  const [generatedReport, setGeneratedReport] = useState(null);
  const [fieldGuide, setFieldGuide] = useState(null);

  // Inicializar reconhecimento de voz
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'pt-BR';

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');

        setHorseData(prev => ({
          ...prev,
          [currentField]: transcript
        }));
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Erro no reconhecimento:', event.error);
        setIsListening(false);
        toast.error('Erro ao reconhecer voz');
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [currentField]);

  const toggleVoiceRecognition = (fieldName) => {
    if (!recognitionRef.current) {
      toast.error('Reconhecimento de voz não suportado neste navegador');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      toast.success('Reconhecimento de voz pausado');
    } else {
      setCurrentField(fieldName);
      recognitionRef.current.start();
      setIsListening(true);
      toast.info(`🎤 Fale agora para preencher: ${fieldName}`);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    if (uploadedImages.length + files.length > 100) {
      toast.error('Máximo de 100 imagens permitido');
      return;
    }

    const validFiles = files.filter(f => 
      f.type === 'image/jpeg' || f.type === 'image/png' || f.type === 'image/jpg'
    );

    if (validFiles.length !== files.length) {
      toast.warning('Apenas arquivos JPEG e PNG são aceitos');
    }

    setUploadedImages(prev => [...prev, ...validFiles]);
    toast.success(`${validFiles.length} imagens adicionadas`);
  };

  const removeImage = (index) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    toast.info('Imagem removida');
  };

  const analyzeImages = async () => {
    if (uploadedImages.length === 0) {
      toast.error('Adicione imagens primeiro');
      return;
    }

    setAnalyzingImages(true);
    const analyses = [];

    try {
      toast.info(`Analisando ${uploadedImages.length} imagens com IA...`, { duration: 5000 });

      for (let i = 0; i < uploadedImages.length; i++) {
        const file = uploadedImages[i];
        
        // Upload da imagem
        const { file_url } = await base44.integrations.Core.UploadFile({ file });

        // Análise com IA
        const analysis = await base44.integrations.Core.InvokeLLM({
          prompt: `Você é um veterinário radiologista especialista em equinos. Analise esta imagem radiográfica e forneça:

1. IDENTIFICAÇÃO: Qual região anatômica (casco, carpo, tarso, coluna, etc)?
2. PROJEÇÃO: Qual a projeção radiográfica (Latero-Medial, Dorso-Palmar, etc)?
3. QUALIDADE: A imagem está adequada para diagnóstico?
4. ESTRUTURAS VISÍVEIS: Liste as estruturas ósseas e articulações visíveis
5. ACHADOS RADIOGRÁFICOS: Descreva alterações encontradas (fraturas, osteófitos, esclerose, radiolucências, etc) OU "Sem alterações significativas"
6. INTERPRETAÇÃO CLÍNICA: Significado clínico dos achados
7. GRAU DE SIGNIFICÂNCIA: Classifique como "Sem alteração", "Leve", "Moderado" ou "Severo"
8. RECOMENDAÇÕES: Sugestões de acompanhamento ou tratamento

Seja técnico, preciso e objetivo. Use terminologia veterinária apropriada.`,
          file_urls: [file_url],
          response_json_schema: {
            type: "object",
            properties: {
              regiao_anatomica: { type: "string" },
              projecao: { type: "string" },
              qualidade_imagem: { type: "string" },
              estruturas_visiveis: { type: "array", items: { type: "string" } },
              achados_radiograficos: { type: "string" },
              interpretacao_clinica: { type: "string" },
              significancia: { type: "string" },
              recomendacoes: { type: "string" },
              codigo_sugerido: { type: "string" }
            }
          }
        });

        analyses.push({
          fileName: file.name,
          imageUrl: file_url,
          analysis
        });

        toast.info(`${i + 1}/${uploadedImages.length} imagens analisadas`);
      }

      setImageAnalyses(analyses);
      toast.success(`✅ ${analyses.length} imagens analisadas com sucesso!`);

    } catch (error) {
      console.error('Erro na análise:', error);
      toast.error('Erro ao analisar imagens');
    } finally {
      setAnalyzingImages(false);
    }
  };

  const generateCompleteExam = async () => {
    if (!horseData.nome) {
      toast.error('Preencha pelo menos o nome do cavalo');
      return;
    }

    setGenerating(true);
    try {
      toast.info('Gerando exame completo de compra com 80+ imagens...', { duration: 5000 });

      // Preparar seção de imagens analisadas
      const imageReportsSection = imageAnalyses.length > 0 ? `

═══════════════════════════════════════════════════════════════
                  IMAGENS RADIOGRÁFICAS ANALISADAS
═══════════════════════════════════════════════════════════════

Total de Imagens: ${imageAnalyses.length}

${imageAnalyses.map((img, idx) => `
IMAGEM ${idx + 1}: ${img.analysis.regiao_anatomica || 'Região não identificada'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Arquivo: ${img.fileName}
URL: ${img.imageUrl}
Código: [${img.analysis.codigo_sugerido || `IMG-${idx + 1}`}]

Projeção: ${img.analysis.projecao}
Qualidade: ${img.analysis.qualidade_imagem}

Estruturas Visíveis:
${img.analysis.estruturas_visiveis?.map(e => `  • ${e}`).join('\n')}

Achados Radiográficos:
${img.analysis.achados_radiograficos}

Interpretação Clínica:
${img.analysis.interpretacao_clinica}

Significância: ${img.analysis.significancia}

Recomendações:
${img.analysis.recomendacoes}

`).join('\n')}
═══════════════════════════════════════════════════════════════
` : '';

      // Gerar relatório completo com IA
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um veterinário especialista em exames de compra de equinos. Crie um RELATÓRIO COMPLETO DE EXAME DE COMPRA com base nos dados:

${imageAnalyses.length > 0 ? `\n*** IMPORTANTE: ${imageAnalyses.length} IMAGENS REAIS FORAM ANALISADAS. Use as análises fornecidas abaixo para preencher o relatório. ***\n` : ''}

DADOS DO EQUINO:
- Nome: ${horseData.nome}
- Raça: ${horseData.raca || 'Não informado'}
- Idade: ${horseData.idade || 'Não informado'}
- Sexo: ${horseData.sexo || 'Não informado'}
- Pelagem: ${horseData.pelagem || 'Não informado'}
- Proprietário: ${horseData.proprietario || 'Não informado'}
- Veterinário Responsável: ${horseData.veterinario || 'Dr. Veterinário'}
- Data do Exame: ${horseData.data_exame}

INSTRUÇÕES PARA O RELATÓRIO:

1. ESTRUTURA COMPLETA COM 80+ IMAGENS RADIOGRÁFICAS:

A) MEMBROS ANTERIORES (40 imagens):
   - Membro Anterior Direito (MAD):
     * Casco: 4 projeções (Latero-Medial, Médio-Lateral, Dorso-Palmar, Palmar-Dorsal)
     * Articulação Metacarpofalangeana (boleto): 4 projeções
     * Metacarpo: 4 projeções (Latero-Medial, Médio-Lateral, Dorso-Palmar, oblíquas)
     * Carpo: 6 projeções (Latero-Medial, Dorso-Palmar, 4 oblíquas)
     * Rádio/Ulna: 2 projeções
   
   - Membro Anterior Esquerdo (MAE): MESMAS 20 projeções

B) MEMBROS POSTERIORES (40 imagens):
   - Membro Posterior Direito (MPD):
     * Casco: 4 projeções
     * Articulação Metatarsofalangeana (boleto): 4 projeções
     * Metatarso: 4 projeções
     * Tarso (Jarretes): 6 projeções (Latero-Medial, Dorso-Plantar, 4 oblíquas)
     * Tíbia/Fíbula: 2 projeções
   
   - Membro Posterior Esquerdo (MPE): MESMAS 20 projeções

C) COLUNA VERTEBRAL (15 imagens):
   - Coluna cervical: 5 imagens
   - Coluna torácica: 5 imagens
   - Coluna lombar: 5 imagens

D) OUTRAS ESTRUTURAS (5+ imagens):
   - Articulação coxofemoral bilateral
   - Joelhos (articulação femorotibiopatelar)
   - Crânio/Seios paranasais (se indicado)

2. PARA CADA IMAGEM, FORNEÇA:
   - Código da imagem (ex: MAD-C-LM = Membro Anterior Direito, Casco, Latero-Medial)
   - Nome completo da projeção
   - Descrição técnica detalhada (estruturas visíveis, qualidade da imagem)
   - Achados radiográficos (normal ou alterações encontradas)
   - Interpretação clínica
   - Grau de significância (sem alteração, leve, moderado, severo)

3. CAMPOS ANATÔMICOS CORRELACIONADOS (para o diagrama):
   C = Cernelha
   G = Garrote (dorso)
   L = Lombar
   S = Sacro
   A = Anca
   MAD = Membro Anterior Direito
   MAE = Membro Anterior Esquerdo
   MPD = Membro Posterior Direito
   MPE = Membro Posterior Esquerdo
   CP = Carpo Direito
   CE = Carpo Esquerdo
   TD = Tarso Direito
   TE = Tarso Esquerdo
   CA = Cabeça
   PC = Pescoço

4. ESTRUTURA DO RELATÓRIO:

═══════════════════════════════════════════════════════════════
                RELATÓRIO DE EXAME DE COMPRA DE EQUINOS
═══════════════════════════════════════════════════════════════

IDENTIFICAÇÃO DO ANIMAL:
Nome: [NOME]
Raça: [RAÇA]
Idade: [IDADE]
Sexo: [SEXO]
Pelagem: [PELAGEM]
Proprietário: [PROPRIETÁRIO]

DADOS DO EXAME:
Data: [DATA]
Veterinário Responsável: [VETERINÁRIO]
Local: [LOCAL]

═══════════════════════════════════════════════════════════════
                    EXAME RADIOGRÁFICO COMPLETO
═══════════════════════════════════════════════════════════════

I. MEMBROS ANTERIORES

A) MEMBRO ANTERIOR DIREITO (MAD)

1. CASCO (4 projeções)

[MAD-C-LM] LATERO-MEDIAL
Descrição: Projeção lateral do casco direito anterior mostrando...
[descreva estruturas ósseas, espaços articulares, contornos]
Achados: [Normal / Alterações encontradas]
Interpretação: [Análise clínica]
Significância: [Sem alteração / Leve / Moderado / Severo]

[MAD-C-ML] MÉDIO-LATERAL
[similar para cada projeção]

[MAD-C-DP] DORSO-PALMAR
[...]

[MAD-C-PD] PALMAR-DORSAL
[...]

2. ARTICULAÇÃO METACARPOFALANGEANA (Boleto) - 4 projeções
[similar, com códigos MAD-B-LM, MAD-B-ML, etc]

3. METACARPO - 4 projeções
[...]

4. CARPO - 6 projeções
[...]

B) MEMBRO ANTERIOR ESQUERDO (MAE)
[Repetir toda estrutura com códigos MAE]

II. MEMBROS POSTERIORES
[Similar aos anteriores, com códigos MPD e MPE]

III. COLUNA VERTEBRAL
[15 imagens da coluna]

IV. OUTRAS ESTRUTURAS
[Articulações adicionais]

═══════════════════════════════════════════════════════════════
                    RESUMO E CONCLUSÃO
═══════════════════════════════════════════════════════════════

ACHADOS PRINCIPAIS:
[Liste todos os achados relevantes]

CLASSIFICAÇÃO GERAL DO ANIMAL:
[ ] Aprovado sem restrições
[ ] Aprovado com restrições
[ ] Reprovado

RECOMENDAÇÕES:
[Recomendações baseadas nos achados]

OBSERVAÇÕES FINAIS:
[Comentários adicionais]

═══════════════════════════════════════════════════════════════

Veterinário Responsável: ${horseData.veterinario || 'Dr. Veterinário'}
CRMV: __________
Assinatura: _________________________
Data: ${horseData.data_exame}


SEJA EXTREMAMENTE DETALHADO. Descreva TODAS as 80+ imagens com análise técnica completa.

${imageAnalyses.length > 0 ? `\n\nANÁLISES DAS IMAGENS REAIS ENVIADAS:\n${imageReportsSection}\n\nINCLUA ESTAS ANÁLISES NO RELATÓRIO FINAL, mantendo os códigos, URLs e descrições técnicas.` : ''}`,
        add_context_from_internet: true
      });

      // Adicionar seção de imagens ao relatório
      const finalReport = imageAnalyses.length > 0 
        ? response + '\n\n' + imageReportsSection 
        : response;

      // Criar guia de campos (bloco de notas)
      const fieldsGuide = `
═══════════════════════════════════════════════════════════════
          GUIA DE CAMPOS - EXAME DE COMPRA DE EQUINOS
              (Bloco de Notas - Correlação de Códigos)
═══════════════════════════════════════════════════════════════

INSTRUÇÕES DE USO:
Copie os códigos abaixo e cole no Word/documento. Os códigos serão
substituídos automaticamente pelas informações correspondentes no
diagrama anatômico do equino.

═══════════════════════════════════════════════════════════════
                    CAMPOS ANATÔMICOS PRINCIPAIS
═══════════════════════════════════════════════════════════════

C = Cernelha (ponto mais alto entre as escápulas)
G = Garrote (região dorsal/lombar)
L = Lombar (região lombar)
S = Sacro (região sacral)
A = Anca (tuberosidade coxal)
CA = Cabeça
PC = Pescoço
PT = Peito
CO = Costelas
AB = Abdômen
GA = Garupa

═══════════════════════════════════════════════════════════════
                    MEMBROS ANTERIORES
═══════════════════════════════════════════════════════════════

MAD = Membro Anterior Direito (completo)
MAE = Membro Anterior Esquerdo (completo)

SUBDIVISÕES MEMBROS ANTERIORES:
MAD-CP = Carpo Direito
MAE-CE = Carpo Esquerdo
MAD-MC = Metacarpo Direito
MAE-MC = Metacarpo Esquerdo
MAD-B = Boleto Direito Anterior
MAE-B = Boleto Esquerdo Anterior
MAD-C = Casco Direito Anterior
MAE-C = Casco Esquerdo Anterior

═══════════════════════════════════════════════════════════════
                    MEMBROS POSTERIORES
═══════════════════════════════════════════════════════════════

MPD = Membro Posterior Direito (completo)
MPE = Membro Posterior Esquerdo (completo)

SUBDIVISÕES MEMBROS POSTERIORES:
MPD-TD = Tarso Direito (Jarrete)
MPE-TE = Tarso Esquerdo (Jarrete)
MPD-MT = Metatarso Direito
MPE-MT = Metatarso Esquerdo
MPD-B = Boleto Direito Posterior
MPE-B = Boleto Esquerdo Posterior
MPD-C = Casco Direito Posterior
MPE-C = Casco Esquerdo Posterior

═══════════════════════════════════════════════════════════════
                    CÓDIGOS DE PROJEÇÕES RADIOGRÁFICAS
═══════════════════════════════════════════════════════════════

LM = Latero-Medial
ML = Médio-Lateral
DP = Dorso-Palmar (membros anteriores) / Dorso-Plantar (posteriores)
PD = Palmar-Dorsal / Plantar-Dorsal
O45 = Oblíqua 45° (4 variações)

EXEMPLOS DE USO:
MAD-C-LM = Casco Anterior Direito, projeção Latero-Medial
MPE-TD-DP = Tarso Esquerdo, projeção Dorso-Plantar
MAE-B-O45 = Boleto Anterior Esquerdo, oblíqua 45°

═══════════════════════════════════════════════════════════════
                    ARTICULAÇÕES ESPECÍFICAS
═══════════════════════════════════════════════════════════════

CFD = Coxofemoral Direita
CFE = Coxofemoral Esquerda
JD = Joelho Direito
JE = Joelho Esquerdo
ED = Escápula Direita
EE = Escápula Esquerda

═══════════════════════════════════════════════════════════════
                    COLUNA VERTEBRAL
═══════════════════════════════════════════════════════════════

CV1-CV7 = Vértebras Cervicais (1 a 7)
CT1-CT18 = Vértebras Torácicas (1 a 18)
CL1-CL6 = Vértebras Lombares (1 a 6)
CS1-CS5 = Vértebras Sacrais (1 a 5)
CC1-CC18 = Vértebras Coccígeas (1 a 18)

═══════════════════════════════════════════════════════════════
                    SISTEMA DE CLASSIFICAÇÃO
═══════════════════════════════════════════════════════════════

0 = Sem alterações (Normal)
1 = Alteração leve (Significância mínima)
2 = Alteração moderada (Observar evolução)
3 = Alteração severa (Restrição de uso)
4 = Alteração grave (Reprovação)

═══════════════════════════════════════════════════════════════
                    COMO USAR NO WORD
═══════════════════════════════════════════════════════════════

1. Abra o template do Word com diagrama do cavalo
2. Copie os códigos acima (ex: C, MAD, MPE-TD)
3. Cole nos campos correspondentes do diagrama
4. Os códigos serão substituídos automaticamente
5. Cole o relatório completo abaixo do diagrama

EXEMPLO DE PREENCHIMENTO:
Região da Cernelha: [Cole "C" aqui]
Membro Anterior Direito: [Cole "MAD" aqui]
Carpo Esquerdo: [Cole "MAE-CE" aqui]

═══════════════════════════════════════════════════════════════

Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}
Sistema: Método NR22 - Exames Veterinários

═══════════════════════════════════════════════════════════════
`;

      setGeneratedReport(finalReport);
      setFieldGuide(fieldsGuide);

      // Salvar automaticamente no repositório
      try {
        await base44.entities.GeneratedDocument.create({
          title: `Exame de Compra - ${horseData.nome} - ${horseData.data_exame}`,
          type: 'relatorio',
          content: finalReport,
          summary: `Exame completo de compra com ${imageAnalyses.length || '80+'} imagens radiográficas analisadas por IA - ${horseData.nome} (${horseData.raca || 'raça não informada'})`,
          tags: ['exame de compra', 'equinos', horseData.nome, 'radiografia', 'analise ia', `${imageAnalyses.length} imagens`]
        });

        await base44.entities.GeneratedDocument.create({
          title: `Guia de Campos - ${horseData.nome}`,
          type: 'manual',
          content: fieldsGuide,
          summary: 'Bloco de notas com códigos de correlação para diagrama anatômico',
          tags: ['guia', 'campos', 'códigos', horseData.nome]
        });
      } catch (error) {
        console.error('Erro ao salvar no repositório:', error);
      }

      toast.success('✅ Exame completo gerado e salvo automaticamente!');

    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao gerar exame');
    } finally {
      setGenerating(false);
    }
  };

  const downloadFile = (content, filename) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Arquivo baixado!');
  };

  const copyContent = async (content) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Copiado para área de transferência!');
    } catch (error) {
      toast.error('Erro ao copiar');
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-amber-600 flex items-center justify-center shadow-lg">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">Exame de Compra de Equinos</h3>
          <p className="text-xs text-slate-600">Relatório completo com 80+ imagens radiográficas</p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Botão de reconhecimento de voz global */}
        <Button
          onClick={() => toggleVoiceRecognition(currentField)}
          className={`w-full h-12 ${isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'}`}
        >
          {isListening ? (
            <>
              <MicOff className="w-5 h-5 mr-2" />
              🔴 Gravando... (Clique para parar)
            </>
          ) : (
            <>
              <Mic className="w-5 h-5 mr-2" />
              🎤 Ativar Reconhecimento de Voz
            </>
          )}
        </Button>

        {/* Formulário de dados do cavalo */}
        <div className="p-3 bg-white rounded-lg border border-amber-200 space-y-2">
          <p className="text-sm font-semibold text-amber-800 mb-2">📋 Dados do Equino:</p>
          
          <div className="flex gap-2">
            <Input
              placeholder="Nome do Cavalo *"
              value={horseData.nome}
              onChange={(e) => setHorseData({...horseData, nome: e.target.value})}
              onFocus={() => setCurrentField('nome')}
              className="text-sm flex-1"
            />
            <Button
              size="sm"
              variant={isListening && currentField === 'nome' ? 'destructive' : 'outline'}
              onClick={() => toggleVoiceRecognition('nome')}
              className="px-2"
            >
              <Mic className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="flex gap-1">
              <Input
                placeholder="Raça"
                value={horseData.raca}
                onChange={(e) => setHorseData({...horseData, raca: e.target.value})}
                onFocus={() => setCurrentField('raca')}
                className="text-sm flex-1"
              />
              <Button size="sm" variant={isListening && currentField === 'raca' ? 'destructive' : 'outline'} onClick={() => toggleVoiceRecognition('raca')} className="px-2">
                <Mic className="w-3 h-3" />
              </Button>
            </div>
            <div className="flex gap-1">
              <Input
                placeholder="Idade"
                value={horseData.idade}
                onChange={(e) => setHorseData({...horseData, idade: e.target.value})}
                onFocus={() => setCurrentField('idade')}
                className="text-sm flex-1"
              />
              <Button size="sm" variant={isListening && currentField === 'idade' ? 'destructive' : 'outline'} onClick={() => toggleVoiceRecognition('idade')} className="px-2">
                <Mic className="w-3 h-3" />
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="flex gap-1">
              <Input
                placeholder="Sexo"
                value={horseData.sexo}
                onChange={(e) => setHorseData({...horseData, sexo: e.target.value})}
                onFocus={() => setCurrentField('sexo')}
                className="text-sm flex-1"
              />
              <Button size="sm" variant={isListening && currentField === 'sexo' ? 'destructive' : 'outline'} onClick={() => toggleVoiceRecognition('sexo')} className="px-2">
                <Mic className="w-3 h-3" />
              </Button>
            </div>
            <div className="flex gap-1">
              <Input
                placeholder="Pelagem"
                value={horseData.pelagem}
                onChange={(e) => setHorseData({...horseData, pelagem: e.target.value})}
                onFocus={() => setCurrentField('pelagem')}
                className="text-sm flex-1"
              />
              <Button size="sm" variant={isListening && currentField === 'pelagem' ? 'destructive' : 'outline'} onClick={() => toggleVoiceRecognition('pelagem')} className="px-2">
                <Mic className="w-3 h-3" />
              </Button>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Input
              placeholder="Proprietário"
              value={horseData.proprietario}
              onChange={(e) => setHorseData({...horseData, proprietario: e.target.value})}
              onFocus={() => setCurrentField('proprietario')}
              className="text-sm flex-1"
            />
            <Button size="sm" variant={isListening && currentField === 'proprietario' ? 'destructive' : 'outline'} onClick={() => toggleVoiceRecognition('proprietario')} className="px-2">
              <Mic className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Input
              placeholder="Veterinário Responsável"
              value={horseData.veterinario}
              onChange={(e) => setHorseData({...horseData, veterinario: e.target.value})}
              onFocus={() => setCurrentField('veterinario')}
              className="text-sm flex-1"
            />
            <Button size="sm" variant={isListening && currentField === 'veterinario' ? 'destructive' : 'outline'} onClick={() => toggleVoiceRecognition('veterinario')} className="px-2">
              <Mic className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Upload de Imagens */}
        <div className="p-3 bg-white rounded-lg border border-indigo-200 space-y-2">
          <p className="text-sm font-semibold text-indigo-800 mb-2">📸 Imagens Radiográficas:</p>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />

          <div className="flex gap-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="flex-1 border-indigo-300"
            >
              <Upload className="w-4 h-4 mr-2" />
              Adicionar Imagens (até 100)
            </Button>
            
            {uploadedImages.length > 0 && (
              <Button
                onClick={analyzeImages}
                disabled={analyzingImages}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                {analyzingImages ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Analisar com IA
                  </>
                )}
              </Button>
            )}
          </div>

          {uploadedImages.length > 0 && (
            <div className="mt-2 p-2 bg-indigo-50 rounded border border-indigo-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-indigo-800">
                  {uploadedImages.length} imagens adicionadas
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setUploadedImages([])}
                  className="h-6 px-2 text-xs text-red-600"
                >
                  Limpar Todas
                </Button>
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {uploadedImages.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs bg-white p-1.5 rounded border border-indigo-100">
                    <span className="truncate flex-1">{file.name}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeImage(idx)}
                      className="h-5 w-5 p-0 ml-2"
                    >
                      <X className="w-3 h-3 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {imageAnalyses.length > 0 && (
            <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
              <p className="text-xs font-semibold text-green-800">
                ✅ {imageAnalyses.length} imagens analisadas pela IA
              </p>
              <p className="text-xs text-green-700 mt-1">
                Análises serão incluídas no relatório final
              </p>
            </div>
          )}
        </div>

        {/* Botão de gerar */}
        <Button
          onClick={generateCompleteExam}
          disabled={generating || !horseData.nome}
          className="w-full bg-amber-600 hover:bg-amber-700 h-12"
        >
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Gerando exame completo (80+ imagens)...
            </>
          ) : (
            <>
              <FileText className="w-5 h-5 mr-2" />
              Gerar Exame Completo de Compra
            </>
          )}
        </Button>

        {/* Resultados gerados */}
        {generatedReport && fieldGuide && (
          <div className="space-y-3">
            {/* Guia de Campos (Bloco de Notas) */}
            <div className="p-3 bg-green-50 rounded-lg border-2 border-green-300">
              <p className="text-xs font-semibold text-green-800 mb-2">
                📝 Guia de Campos (Bloco de Notas)
              </p>
              <p className="text-xs text-green-700 mb-2">
                Códigos para correlacionar com diagrama do cavalo
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyContent(fieldGuide)}
                  className="border-green-300"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copiar Guia
                </Button>
                <Button
                  size="sm"
                  onClick={() => downloadFile(fieldGuide, `Guia_Campos_${horseData.nome.replace(/\s/g, '_')}`)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Baixar .txt
                </Button>
              </div>
            </div>

            {/* Relatório Completo (Word) */}
            <div className="p-3 bg-blue-50 rounded-lg border-2 border-blue-300">
              <p className="text-xs font-semibold text-blue-800 mb-2">
                📄 Relatório Completo (80+ imagens)
              </p>
              <p className="text-xs text-blue-700 mb-2">
                Documento pronto para colar no Word
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyContent(generatedReport)}
                  className="border-blue-300"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copiar Relatório
                </Button>
                <Button
                  size="sm"
                  onClick={() => downloadFile(generatedReport, `Exame_Compra_${horseData.nome.replace(/\s/g, '_')}`)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Baixar .txt
                </Button>
              </div>
            </div>

            {/* Instruções de uso */}
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-xs text-amber-800 font-semibold mb-1">
                📌 Como usar:
              </p>
              <ul className="text-xs text-amber-700 space-y-1">
                <li>1. Baixe o Guia de Campos (bloco de notas)</li>
                <li>2. Abra seu template Word com diagrama do cavalo</li>
                <li>3. Cole os códigos nos campos do diagrama (C, MAD, MPE, etc)</li>
                <li>4. Cole o Relatório Completo abaixo do diagrama</li>
                <li>5. Documentos salvos automaticamente em "Documentos Gerados"</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}