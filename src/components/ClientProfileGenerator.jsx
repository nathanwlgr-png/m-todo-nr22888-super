import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Download, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { calculateNumerology, calculateLifePath, getNumerologyProfile, getMasterNumberInsight } from './NumerologyMasterNumbers';

export default function ClientProfileGenerator() {
  const [generating, setGenerating] = useState(false);
  const [clientName, setClientName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [profile, setProfile] = useState(null);
  const [savedProfiles, setSavedProfiles] = useState([]);
  const [empresaVinculada, setEmpresaVinculada] = useState('');
  const [saveToDatabase, setSaveToDatabase] = useState(false);
  const [cnpjEmpresa, setCnpjEmpresa] = useState('');
  const [cidadeCliente, setCidadeCliente] = useState('');

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const generateProfile = async () => {
    if (!clientName) {
      toast.error('Digite o nome do cliente');
      return;
    }

    setGenerating(true);
    try {
      const numeroNome = calculateNumerology(clientName);
      const numeroCaminho = birthdate ? calculateLifePath(birthdate) : null;
      const numeroFinal = numeroCaminho || numeroNome;
      const perfil = getNumerologyProfile(numeroFinal);
      const masterInsight = getMasterNumberInsight(numeroFinal);

      const profileDoc = `
╔═══════════════════════════════════════════════════════════════════════╗
║                     PERFIL COMPLETO DE CLIENTE                        ║
║                     Método NR22 - Análise Numerológica                ║
╚═══════════════════════════════════════════════════════════════════════╝


═══════════════════════════════════════════════════════════════════════
📋 DADOS BÁSICOS
═══════════════════════════════════════════════════════════════════════

Nome Completo: ${clientName}
Profissão: Veterinário
${birthdate ? `Data de Nascimento: ${new Date(birthdate).toLocaleDateString('pt-BR')}` : 'Data de Nascimento: Não informada'}


═══════════════════════════════════════════════════════════════════════
🔢 ANÁLISE NUMEROLÓGICA COMPLETA
═══════════════════════════════════════════════════════════════════════

Número do Nome: ${numeroNome}${numeroNome === 11 || numeroNome === 22 ? ' ⭐ NÚMERO MESTRE' : ''}
${numeroCaminho ? `Número do Caminho de Vida: ${numeroCaminho}${numeroCaminho === 11 || numeroCaminho === 22 ? ' ⭐ NÚMERO MESTRE' : ''}` : ''}

NÚMERO PRINCIPAL: ${numeroFinal}${numeroFinal === 11 || numeroFinal === 22 ? ' ⭐ MESTRE' : ''}


═══════════════════════════════════════════════════════════════════════
👤 PERFIL COMPORTAMENTAL: ${perfil.name}
═══════════════════════════════════════════════════════════════════════

CARACTERÍSTICAS:
${perfil.traits}

ESTILO DE COMUNICAÇÃO PREFERIDO:
${perfil.communication}

GATILHOS MENTAIS MAIS EFETIVOS:
${perfil.triggers.map(t => `✓ ${t}`).join('\n')}

OBJEÇÕES PROVÁVEIS:
${perfil.objections.map(o => `⚠️ ${o}`).join('\n')}

MELHOR ABORDAGEM DE VENDAS:
${perfil.approach}


${masterInsight ? `
═══════════════════════════════════════════════════════════════════════
⭐ INSIGHT ESPECIAL - NÚMERO MESTRE ${numeroFinal}
═══════════════════════════════════════════════════════════════════════

${masterInsight}
` : ''}


═══════════════════════════════════════════════════════════════════════
🎯 ESTRATÉGIA DE VENDAS PERSONALIZADA
═══════════════════════════════════════════════════════════════════════

PRIMEIRO CONTATO:
- Canal recomendado: ${numeroFinal === 22 || numeroFinal === 8 ? 'Reunião presencial (pensa grande)' : numeroFinal === 11 ? 'Email inspirador com visão' : 'WhatsApp ou ligação'}
- Melhor horário: ${numeroFinal === 1 || numeroFinal === 8 ? 'Manhã (energia alta)' : numeroFinal === 7 ? 'Tarde (tempo para analisar)' : 'Qualquer'}
- Tom: ${numeroFinal === 22 ? 'Visionário e ambicioso' : numeroFinal === 11 ? 'Inspirador e transformador' : perfil.communication}

APRESENTAÇÃO DO EQUIPAMENTO:
${numeroFinal === 22 ? '- Mostre como base para CRESCIMENTO e EXPANSÃO\n- Fale de múltiplas unidades\n- ROI de longo prazo\n- Construir império veterinário' :
  numeroFinal === 11 ? '- Apresente como REVOLUÇÃO na medicina veterinária\n- Impacto transformador\n- Salvar mais vidas\n- Diferenciação única' :
  numeroFinal === 8 ? '- Foco total em ROI e lucro\n- Aumento de produtividade\n- Payback rápido' :
  '- Adapte ao perfil'}

FECHAMENTO:
${numeroFinal === 22 ? 'Proposta ambiciosa com plano de expansão' : 
  numeroFinal === 11 ? 'Convide para fazer parte da transformação' :
  'Padrão com urgência'}


═══════════════════════════════════════════════════════════════════════
📊 PERFIL COMPLETO PARA CRM
═══════════════════════════════════════════════════════════════════════

Dados para cadastro (se necessário):

{
  "first_name": "${clientName.split(' ')[0]}",
  "full_name": "${clientName}",
  ${birthdate ? `"birthdate": "${birthdate}",` : ''}
  "numerology_number": ${numeroFinal},
  ${numeroCaminho ? `"life_path_number": ${numeroCaminho},` : ''}
  "behavioral_profile": "${perfil.name}",
  "decision_style": "${perfil.communication}",
  "recommended_communication": "${numeroFinal === 22 ? 'Visão de longo prazo, ambição, construção de império' : numeroFinal === 11 ? 'Inspiração, transformação, propósito maior' : perfil.communication}",
  "client_tone": "${numeroFinal === 22 ? 'assertivo' : numeroFinal === 11 ? 'entusiasmado' : 'analitico'}",
  "purchase_motivators": ${JSON.stringify(perfil.triggers)},
  "numerology_tip": "${numeroFinal === 22 ? 'Cliente Número Mestre 22 - Pensa GRANDE. Apresente visão de expansão e domínio de mercado.' : numeroFinal === 11 ? 'Cliente Número Mestre 11 - Altamente intuitivo. Use abordagem inspiradora e transformadora.' : perfil.approach}"
}


═══════════════════════════════════════════════════════════════════════
✅ PERFIL GERADO COM SUCESSO
Data: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}
Método: NR22 - Numerologia Aplicada a Vendas
═══════════════════════════════════════════════════════════════════════
`;

      setProfile(profileDoc);
      
      // Salvar perfil na lista local
      const newProfile = {
        name: clientName,
        birthdate: birthdate,
        empresa: empresaVinculada,
        date: new Date().toLocaleString('pt-BR'),
        content: profileDoc
      };
      setSavedProfiles([...savedProfiles, newProfile]);
      
      // Salvar no banco de dados se habilitado
      if (saveToDatabase) {
        try {
          const clientData = {
            first_name: clientName.split(' ')[0],
            full_name: clientName,
            birthdate: birthdate || null,
            empresa_vinculada: empresaVinculada || null,
            cnpj: cnpjEmpresa || null,
            city: cidadeCliente || null,
            numerology_number: numeroFinal,
            life_path_number: numeroCaminho || null,
            behavioral_profile: perfil.name,
            decision_style: perfil.communication,
            recommended_communication: numeroFinal === 22 ? 'Visão de longo prazo, ambição, construção de império' : numeroFinal === 11 ? 'Inspiração, transformação, propósito maior' : perfil.communication,
            client_tone: numeroFinal === 22 ? 'assertivo' : numeroFinal === 11 ? 'entusiasmado' : 'analitico',
            purchase_motivators: perfil.triggers,
            numerology_tip: numeroFinal === 22 ? 'Cliente Número Mestre 22 - Pensa GRANDE. Apresente visão de expansão e domínio de mercado.' : numeroFinal === 11 ? 'Cliente Número Mestre 11 - Altamente intuitivo. Use abordagem inspiradora e transformadora.' : perfil.approach,
            perfil_completo_gerado: profileDoc,
            status: 'morno',
            purchase_score: 60,
            lead_source: 'importacao_planilha'
          };
          
          await base44.entities.Client.create(clientData);
          toast.success('✅ Perfil gerado, salvo e cadastrado no CRM!');
        } catch (error) {
          console.error('Erro ao salvar no banco:', error);
          toast.warning('Perfil gerado mas erro ao salvar no CRM');
        }
      } else {
        await navigator.clipboard.writeText(profileDoc);
        toast.success('✅ Perfil gerado e salvo!');
      }

    } catch (error) {
      toast.error('Erro ao gerar perfil');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const downloadProfile = (profileContent = profile, name = clientName) => {
    const blob = new Blob([profileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PERFIL_${name.replace(/ /g, '_')}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sendToWhatsApp = () => {
    if (!user?.phone) {
      toast.error('Configure WhatsApp em Configurações');
      return;
    }
    const msg = `📋 *PERFIL COMPLETO GERADO*\n\nCliente: ${clientName}\n\n[Documento completo copiado para área de transferência]`;
    window.open(`https://wa.me/${user.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-800">Gerar Perfil Completo</h3>
          <p className="text-xs text-slate-600">Com numerologia e estratégia</p>
        </div>
      </div>

      <div className="space-y-3">
        <Input
          placeholder="Nome completo do cliente"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
        />
        
        <Input
          type="date"
          placeholder="Data de nascimento (opcional)"
          value={birthdate}
          onChange={(e) => setBirthdate(e.target.value)}
        />
        
        <Input
          placeholder="Empresa vinculada (ex: Spice e Cavalos)"
          value={empresaVinculada}
          onChange={(e) => setEmpresaVinculada(e.target.value)}
        />
        
        <Input
          placeholder="CNPJ da empresa (opcional)"
          value={cnpjEmpresa}
          onChange={(e) => setCnpjEmpresa(e.target.value)}
        />
        
        <Input
          placeholder="Cidade (ex: Jaú, Marília)"
          value={cidadeCliente}
          onChange={(e) => setCidadeCliente(e.target.value)}
        />
        
        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={saveToDatabase}
            onChange={(e) => setSaveToDatabase(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300"
          />
          Salvar automaticamente no CRM
        </label>

        <Button
          onClick={generateProfile}
          disabled={generating || !clientName}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 mr-2" />
              Gerar Perfil Completo
            </>
          )}
        </Button>

        {profile && (
          <div className="space-y-2">
            <div className="bg-white rounded-lg p-3 border border-purple-200 max-h-48 overflow-auto">
              <pre className="text-[10px] whitespace-pre-wrap font-mono">{profile.substring(0, 600)}...</pre>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" onClick={() => downloadProfile()}>
                <Download className="w-3 h-3 mr-1" />
                Baixar
              </Button>
              <Button size="sm" variant="outline" onClick={sendToWhatsApp}>
                <Send className="w-3 h-3 mr-1" />
                WhatsApp
              </Button>
            </div>
          </div>
        )}

        {/* Perfis Salvos */}
        {savedProfiles.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-semibold text-slate-700">Perfis Salvos ({savedProfiles.length})</h4>
            {savedProfiles.map((savedProfile, idx) => (
              <div key={idx} className="p-3 bg-white rounded-lg border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm text-slate-800">{savedProfile.name}</p>
                    {savedProfile.empresa && (
                      <p className="text-xs font-medium text-purple-600">🏢 {savedProfile.empresa}</p>
                    )}
                    <p className="text-xs text-slate-500">{savedProfile.date}</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => downloadProfile(savedProfile.content, savedProfile.name)}
                  >
                    <Download className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}