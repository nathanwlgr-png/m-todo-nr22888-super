import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Upload, Loader2, CheckCircle2, AlertCircle, FileSpreadsheet, Table, FileText, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from 'sonner';

export default function BulkClientImporter() {
  const queryClient = useQueryClient();
  const [importing, setImporting] = useState(false);
  const [importMethod, setImportMethod] = useState('paste');
  const [pastedData, setPastedData] = useState('');
  const [sheetUrl, setSheetUrl] = useState('');
  const [result, setResult] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [progress, setProgress] = useState('');
  const [showDups, setShowDups] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const fileInputRef = useRef(null);

  // ── Extrai via LLM e envia ao backend ──────────────────────────────────────
  const processViaPaste = async () => {
    if (!pastedData.trim()) { toast.error('Cole os dados primeiro'); return; }
    setImporting(true); setResult(null); setProgress('Extraindo clientes com IA...');
    try {
      const extracted = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é especialista em dados de CRM veterinário.
Dados recebidos:
${pastedData}

Extraia TODOS os clientes. Para cada linha/registro retorne:
- first_name: primeiro nome do responsável/proprietário
- full_name: nome completo
- clinic_name: nome da clínica/hospital
- city: cidade
- phone: telefone no formato 55DDD99999999 (somente números, com 55)
- email
- address: endereço completo
- cnpj: somente números (14 dígitos)
- external_code: código/ID externo

Não pule linhas. Retorne TODOS os registros encontrados.`,
        response_json_schema: {
          type: "object",
          properties: {
            clients: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  first_name: { type: "string" },
                  full_name: { type: "string" },
                  clinic_name: { type: "string" },
                  city: { type: "string" },
                  phone: { type: "string" },
                  email: { type: "string" },
                  address: { type: "string" },
                  cnpj: { type: "string" },
                  external_code: { type: "string" }
                }
              }
            }
          }
        }
      });

      const clients = extracted.clients || [];
      if (clients.length === 0) { toast.error('Nenhum cliente encontrado'); setImporting(false); return; }

      setProgress(`${clients.length} clientes extraídos. Verificando duplicatas e cadastrando...`);
      const res = await base44.functions.invoke('importClientsFromExcelV2', { clientsJson: clients });
      setResult(res.data);
      queryClient.invalidateQueries(['clients']);
      toast.success(`✅ ${res.data?.summary?.created || 0} clientes cadastrados!`);
    } catch (e) {
      toast.error('Erro: ' + e.message);
    } finally {
      setImporting(false); setProgress('');
    }
  };

  // ── Upload de arquivo ──────────────────────────────────────────────────────
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true); setResult(null); setProgress('Enviando arquivo...');
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setProgress('Extraindo dados do arquivo com IA...');
      const res = await base44.functions.invoke('importClientsFromExcelV2', { fileUrl: file_url });
      setResult(res.data);
      queryClient.invalidateQueries(['clients']);
      toast.success(`✅ ${res.data?.summary?.created || 0} clientes cadastrados!`);
    } catch (e) {
      toast.error('Erro: ' + e.message);
    } finally {
      setImporting(false); setProgress('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Google Sheets ──────────────────────────────────────────────────────────
  const handleUrlImport = async () => {
    if (!sheetUrl.trim()) { toast.error('Insira a URL'); return; }
    setImporting(true); setResult(null); setProgress('Acessando Google Sheets...');
    try {
      const sheetData = await base44.integrations.Core.InvokeLLM({
        prompt: `Acesse esta planilha Google Sheets e retorne o conteúdo completo em texto estruturado:\n${sheetUrl}`,
        add_context_from_internet: true
      });
      setProgress('Extraindo clientes com IA...');
      const extracted = await base44.integrations.Core.InvokeLLM({
        prompt: `Extraia TODOS os clientes destes dados:\n${sheetData}\nRetorne first_name, full_name, clinic_name, city, phone (55+DDD), email, address, cnpj, external_code para cada um.`,
        response_json_schema: {
          type: "object",
          properties: {
            clients: { type: "array", items: { type: "object", properties: {
              first_name:{type:"string"}, full_name:{type:"string"}, clinic_name:{type:"string"},
              city:{type:"string"}, phone:{type:"string"}, email:{type:"string"},
              address:{type:"string"}, cnpj:{type:"string"}, external_code:{type:"string"}
            }}}
          }
        }
      });
      const clients = extracted.clients || [];
      setProgress(`${clients.length} clientes extraídos. Verificando duplicatas...`);
      const res = await base44.functions.invoke('importClientsFromExcelV2', { clientsJson: clients });
      setResult(res.data);
      queryClient.invalidateQueries(['clients']);
      toast.success(`✅ ${res.data?.summary?.created || 0} clientes cadastrados!`);
    } catch (e) {
      toast.error('Erro: ' + e.message);
    } finally {
      setImporting(false); setProgress('');
    }
  };

  const reset = () => { setResult(null); setPastedData(''); setSheetUrl(''); setShowDups(false); setShowErrors(false); };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
          <Upload className="w-4 h-4 mr-2" />
          Importação em Massa — Sem Limite
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            Importação em Massa — Sem Limite de Clientes
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700 space-y-0.5">
            <p className="font-semibold text-blue-800">✅ Recursos desta importação:</p>
            <p>• <strong>Sem limite</strong> — cadastra qualquer quantidade de clientes</p>
            <p>• <strong>Anti-duplicidade</strong> — verifica por telefone, CNPJ, email e nome+cidade</p>
            <p>• <strong>Processamento paralelo</strong> — lotes de 20 em simultâneo</p>
            <p>• <strong>IA extrai dados</strong> — qualquer formato de tabela ou texto</p>
          </div>

          {/* Tabs de método */}
          {!importing && !result && (
            <>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'paste', icon: Table, label: 'Colar Dados' },
                  { id: 'url', icon: FileSpreadsheet, label: 'Google Sheets' },
                  { id: 'file', icon: FileText, label: 'Arquivo' },
                ].map(({ id, icon: Icon, label }) => (
                  <Button key={id} variant={importMethod === id ? 'default' : 'outline'}
                    onClick={() => setImportMethod(id)} className="flex-col h-auto py-3">
                    <Icon className="w-5 h-5 mb-1" />
                    <span className="text-xs">{label}</span>
                  </Button>
                ))}
              </div>

              {importMethod === 'paste' && (
                <div className="space-y-2">
                  <Label>Cole dados de qualquer tabela (Excel, Word, texto, CSV...)</Label>
                  <Textarea
                    value={pastedData}
                    onChange={e => setPastedData(e.target.value)}
                    placeholder={`Cole qualquer formato:\n\nID | Nome | Clínica | CNPJ | Telefone | Cidade\n001 | João Silva | Clínica Vet | 12.345.678/0001-90 | (14) 99999-9999 | Marília\n\nA IA extrai automaticamente!`}
                    rows={10}
                    className="font-mono text-xs"
                  />
                  <p className="text-xs text-slate-500">
                    💡 Quantidade ilimitada de linhas. Cole toda a planilha de uma vez.
                  </p>
                  <Button onClick={processViaPaste} disabled={!pastedData.trim()} className="w-full bg-green-600 hover:bg-green-700">
                    <Upload className="w-4 h-4 mr-2" /> Importar Agora
                  </Button>
                </div>
              )}

              {importMethod === 'url' && (
                <div className="space-y-2">
                  <Label>URL da Planilha Google Sheets (pública)</Label>
                  <Input value={sheetUrl} onChange={e => setSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..." />
                  <p className="text-xs text-slate-500">⚠️ A planilha deve estar com acesso público (qualquer pessoa com o link)</p>
                  <Button onClick={handleUrlImport} disabled={!sheetUrl.trim()} className="w-full bg-green-600 hover:bg-green-700">
                    <FileSpreadsheet className="w-4 h-4 mr-2" /> Importar do Sheets
                  </Button>
                </div>
              )}

              {importMethod === 'file' && (
                <div className="space-y-2">
                  <Label>Upload de Arquivo — Excel, CSV, PDF, Word (qualquer tamanho)</Label>
                  <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv,.pdf,.doc,.docx,.txt"
                    onChange={handleFileUpload} className="hidden" />
                  <Button onClick={() => fileInputRef.current?.click()} className="w-full bg-green-600 hover:bg-green-700 h-16 text-base">
                    <Upload className="w-5 h-5 mr-2" /> Selecionar Arquivo
                  </Button>
                  <p className="text-xs text-slate-500">Suporta: Excel (.xlsx, .xls), CSV, PDF, Word (.doc, .docx), Texto</p>
                </div>
              )}
            </>
          )}

          {/* Loading */}
          {importing && (
            <div className="text-center py-10 space-y-3">
              <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-800">Processando...</p>
              {progress && <p className="text-xs text-slate-500 max-w-xs mx-auto">{progress}</p>}
            </div>
          )}

          {/* Resultado */}
          {result && (
            <div className="space-y-3">
              {/* Resumo */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Processados', value: result.summary?.processed, color: 'text-slate-800' },
                  { label: '✅ Cadastrados', value: result.summary?.created, color: 'text-green-600' },
                  { label: '⚠️ Duplicados', value: result.summary?.duplicates, color: 'text-yellow-600' },
                  { label: '❌ Erros', value: result.summary?.errors, color: 'text-red-600' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-slate-50 border rounded-lg p-2 text-center">
                    <p className="text-[10px] text-slate-500">{label}</p>
                    <p className={`text-xl font-bold ${color}`}>{value ?? 0}</p>
                  </div>
                ))}
              </div>

              {result.summary?.created > 0 && (
                <div className="bg-green-50 border border-green-300 rounded-lg p-3 text-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-1" />
                  <p className="text-sm font-bold text-green-800">{result.summary.created} clientes cadastrados com sucesso!</p>
                </div>
              )}

              {/* Duplicados */}
              {result.details?.duplicates?.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <button onClick={() => setShowDups(!showDups)}
                    className="w-full flex items-center justify-between p-3 bg-yellow-50 text-yellow-800 text-sm font-medium">
                    <span>⚠️ {result.details.duplicates.length} duplicados ignorados</span>
                    {showDups ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {showDups && (
                    <div className="max-h-40 overflow-y-auto divide-y">
                      {result.details.duplicates.map((d, i) => (
                        <div key={i} className="px-3 py-2 text-xs text-slate-600 flex items-center justify-between">
                          <span>{d.name} {d.city ? `— ${d.city}` : ''}</span>
                          <Badge className="text-[9px] bg-yellow-100 text-yellow-700 border-yellow-300">{d.reason}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Erros */}
              {result.details?.errors?.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <button onClick={() => setShowErrors(!showErrors)}
                    className="w-full flex items-center justify-between p-3 bg-red-50 text-red-800 text-sm font-medium">
                    <span>❌ {result.details.errors.length} erros</span>
                    {showErrors ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {showErrors && (
                    <div className="max-h-40 overflow-y-auto divide-y">
                      {result.details.errors.map((e, i) => (
                        <div key={i} className="px-3 py-2 text-xs text-slate-600">
                          {e.name} — <span className="text-red-600">{e.reason}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={reset} variant="outline" className="flex-1">Nova Importação</Button>
                <Button onClick={() => { reset(); setDialogOpen(false); }} className="flex-1">Fechar</Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}