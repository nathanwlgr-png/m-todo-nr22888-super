import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfessionalContractGenerator() {
  const [generating, setGenerating] = useState(false);
  const [selectedClient, setSelectedClient] = useState('');
  const [contract, setContract] = useState(null);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 100)
  });

  const { data: equipment = [] } = useQuery({
    queryKey: ['equipment'],
    queryFn: () => base44.entities.Equipment.list()
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const generateContract = async () => {
    if (!selectedClient) {
      toast.error('Selecione um cliente');
      return;
    }

    setGenerating(true);
    try {
      const client = clients.find(c => c.id === selectedClient);
      const equip = equipment[0] || { 
        name: 'QT3 ANALISADOR BIOQUÍMICO AUTOMÁTICO VETERINÁRIO',
        price: 30000,
        category: 'analisador_bioquimico'
      };

      const contractText = `
══════════════════════════════════════════════════════════════════
CÓDIGO CLIENTE: ${client.external_code || 'N/A'}
══════════════════════════════════════════════════════════════════


CONTRATO DE COMPRA E VENDA DE EQUIPAMENTO E OUTRAS AVENÇAS


╔═══════════════════════════════════════════════════════════════════╗
║ 1 - VENDEDOR                                                      ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║ COMPET COMÉRCIO DE PRODUTOS PARA ANIMAIS                         ║
║ CNPJ 13.693.877/0001-57                                          ║
║ Rua Paes Leme, 1123 – Bairro: Jardim Marília                    ║
║ Marília - SP, 17502-460                                          ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝


╔═══════════════════════════════════════════════════════════════════╗
║ 2 - COMPRADOR(A)                                                 ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║ RAZÃO SOCIAL: ${client.razao_social || client.first_name}
║ CPF: ${client.cnpj || 'A ser preenchido'}
║ ENDEREÇO: ${client.address || 'A ser preenchido'}
║ MUNICÍPIO/ESTADO: ${client.city || 'A ser preenchido'}
║ NOME FANTASIA: ${client.clinic_name || 'A ser preenchido'}
║
║ REPRESENTANTE LEGAL:
║ NOME: ${client.first_name}
║ CPF: A ser preenchido
║ CRMV/ESTADO: A ser preenchido
║
╚═══════════════════════════════════════════════════════════════════╝


╔═══════════════════════════════════════════════════════════════════╗
║ 3 – DESCRIÇÕES DO OBJETO                                         ║
╠══════════════════════════╦════════════════╦═══════════════════════╣
║ Equipamento              ║ Marca/Modelo   ║ Nº de Série          ║
╠══════════════════════════╬════════════════╬═══════════════════════╣
║                          ║                ║                       ║
║ ${equip.name.substring(0, 24).padEnd(24)} ║ SEAMATY        ║                       ║
║                          ║                ║                       ║
╚══════════════════════════╩════════════════╩═══════════════════════╝


╔═══════════════════════════════════╦═══════════════════════════════╗
║ 4 – PRAZO DE INSTALAÇÃO           ║ 5 – VALOR DO(S) EQUIPAMENTO(S)║
╠═══════════════════════════════════╬═══════════════════════════════╣
║ Até 10 (dez) dias úteis           ║ R$ ${equip.price.toLocaleString('pt-BR', {minimumFractionDigits: 2})}              ║
╚═══════════════════════════════════╩═══════════════════════════════╝


╔═══════════════════════════════════════════════════════════════════╗
║ 6 - FORMA PAGAMENTO                                              ║
╠═══════════════════════════════════════════════════════════════════╣
║ FINANCIAMENTO DE R$ ${equip.price.toLocaleString('pt-BR', {minimumFractionDigits: 2})} EM 36 X PELO SANTANDER           ║
╚═══════════════════════════════════════════════════════════════════╝


╔══════════════════════════════════╦════════════════════════════════╗
║ 7 – GARANTIA DO(S) EQUIPAMENTO(S)║ 8 – PROPOSTA COMERCIAL         ║
╠══════════════════════════════════╬════════════════════════════════╣
║ 25 meses                         ║                                ║
╚══════════════════════════════════╩════════════════════════════════╝


As partes acima identificadas têm, entre si, justo e acertado o presente Contrato de 
Compra e Venda de Equipamento(s) e outras Avenças, que se regerá pelas clausulas 
seguintes e pelas condições de preço, forma e termo de pagamento assentias no presente.


CLÁUSULA PRIMEIRA – DA DESCRIÇÃO DOS EQUIPAMENTOS

1.1    Contrato de Compra e Venda do(s) equipamento(s): ${equip.name} 
Parágrafo único: Constituem partes integrantes do presente Contrato, como seus 
Anexos, manual técnico do equipamento e termo de garantia.


CLÁUSULA SEGUNDA - DA ENTREGA E INSTALAÇÃO

2.1    A VENDEDOR compromete-se a entregar os equipamentos no prazo improrrogável 
de 10 (dias) dias úteis, contados da assinatura do presente instrumento, quando 
disponíveis em estoque por se tratar de equipamentos importados.

2.2    O COMPRADOR se obriga a vistoriar o(s) equipamento(s) adquirido(s) no ato da 
entrega ou instalação, sendo que eventuais ressalvas deverão ser apontadas formalmente 
o VENDEDOR, que realizará a instalação de todos os produtos comercializados de acordo 
com as especificações técnicas.

2.3    Caso não ocorra a entrega ou instalação dos equipamentos por impossibilidade do 
COMPRADOR em até 30 (trinta) dias a contar da emissão da nota fiscal, ou qualquer 
motivo aplicável, calibração e testes finais de funcionamento. Para instalação e testes 
finais, o VENDEDOR disponibilizará seu corpo técnico treinado, que realizará a montagem, 
ajuste e calibrações do equipamento e treinamento com procedimentos recomendados pelo 
fabricante para este propósito.

2.5    O COMPRADOR obriga-se a receber o Equipamento no local de entrega indicado por 
ele, na data em que o VENDEDOR disponibilizar o mesmo para entrega, de acordo com o 
respectivo prazo estabelecido neste Contrato. A recusa ou omissão do COMPRADOR em 
receber o Equipamento quando da entrega ou colocação à disposição pelo VENDEDOR e/ou 
impossibilidade de recebê-lo por qualquer outro motivo não imputável exclusivamente ao 
VENDEDOR, implicará à imediata transferência do risco do Equipamento ao COMPRADOR, 
ficando o mesmo também responsável por todos e quaisquer custos ou despesas incorridas 
com relação ao Equipamento.


CLÁUSULA TERCEIRA – DO PREÇO E FORMA DE PAGAMENTO

O preço unitário dos equipamentos descrito na cláusula "1.1" perfaz a quantia de 
R$${equip.price.toLocaleString('pt-BR', {minimumFractionDigits: 2})} (${this.numeroExtenso(equip.price)}) às quais o COMPRADOR se compromete em liquidá-la 
com pagamento COM FINANCIAMENTO DE R$ ${equip.price.toLocaleString('pt-BR', {minimumFractionDigits: 2})} EM 36 X PELO SANTANDER

3.1
Beneficiário: COMPET COMÉRCIO DE PRODUTOS PARA ANIMAIS EIRELI
CNPJ: 13.693.877/0001-57
Banco ITAU
Agência 0145
Conta: 13966-3
PIX: CNPJ: 13.693.877/0001-57


CLÁUSULA QUARTA – DA GARANTIA

4.1 Garantia de 25 (vinte e cinco) meses, conforme "Termo de Garantia e Condições 
Gerais de Fornecimento" integrante e inseparável deste Contrato, cuja inobservância ou 
descumprimento das regras ensejará na imediata perda da garantia.


CLÁUSULA QUINTA – DAS DISPOSIÇÕES GERAIS

5.1 As partes elegem o foro da comarca de ${client.city || 'Marília'}-SP para dirimir quaisquer 
dúvidas oriundas do presente contrato, com expressa renúncia de qualquer outro, por mais 
privilegiado que seja.

E, por estarem justos e contratados, firmam o presente instrumento em 02 (duas) vias de 
igual teor e forma, na presença de 02 (duas) testemunhas.


${client.city || 'Marília'}, ____ de ______________ de 20____



_________________________________        _________________________________
        VENDEDOR                                  COMPRADOR


TESTEMUNHAS:

_________________________________        _________________________________
Nome:                                            Nome:
CPF:                                             CPF:


══════════════════════════════════════════════════════════════════
CÓDIGO CLIENTE: ${client.external_code || 'N/A'}
══════════════════════════════════════════════════════════════════
`;

      setContract(contractText);

      // Copiar para área de transferência
      await navigator.clipboard.writeText(contractText);

      // Enviar por WhatsApp
      if (user?.phone) {
        const msg = `📄 *CONTRATO GERADO*\n\n` +
          `Cliente: ${client.clinic_name || client.first_name}\n` +
          `Código: ${client.external_code}\n` +
          `Equipamento: ${equip.name}\n\n` +
          `Documento copiado para área de transferência!`;
        
        window.open(`https://wa.me/${user.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
      }

      toast.success('✅ Contrato gerado e copiado!');

    } catch (error) {
      toast.error('Erro ao gerar contrato');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const downloadContract = () => {
    const blob = new Blob([contract], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const client = clients.find(c => c.id === selectedClient);
    a.download = `CONTRATO_${client?.external_code || 'CLIENTE'}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-slate-50 to-gray-50 border-2 border-slate-300 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-800">Contrato Profissional</h3>
          <p className="text-xs text-slate-600">Formato padrão COMPET</p>
        </div>
      </div>

      <div className="space-y-3">
        <Select value={selectedClient} onValueChange={setSelectedClient}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o cliente" />
          </SelectTrigger>
          <SelectContent>
            {clients.map(c => (
              <SelectItem key={c.id} value={c.id}>
                [{c.external_code || 'S/C'}] {c.clinic_name || c.first_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          onClick={generateContract}
          disabled={generating || !selectedClient}
          className="w-full bg-slate-700 hover:bg-slate-800"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 mr-2" />
              Gerar Contrato Oficial
            </>
          )}
        </Button>

        {contract && (
          <div className="space-y-2">
            <div className="p-3 bg-white rounded-lg border border-slate-300 max-h-48 overflow-auto">
              <pre className="text-[10px] whitespace-pre font-mono">{contract.substring(0, 800)}...</pre>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" onClick={downloadContract}>
                <Download className="w-3 h-3 mr-1" />
                Baixar TXT
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(contract);
                  toast.success('Copiado!');
                }}
              >
                <Send className="w-3 h-3 mr-1" />
                Copiar
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}