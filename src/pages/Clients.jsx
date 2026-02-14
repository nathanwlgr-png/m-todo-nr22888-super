import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft, 
  Search, 
  UserPlus,
  Users,
  Loader2,
  Filter,
  X,
  Tag,
  TrendingUp,
  Upload,
  ArrowUpDown,
  Table,
  FileDown,
  Edit2,
  FileText,
  Eye,
  Download
} from 'lucide-react';
import ClientCard from '@/components/ClientCard';
import SalesFunnelChart from '@/components/SalesFunnelChart';
import AIMetricsBadges from '@/components/AIMetricsBadges';
import { useOfflineClients } from '@/components/OfflineClientCache';
import OfflineIndicator from '@/components/OfflineIndicator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';
import jsPDF from 'jspdf';

const ORANGE_REGION_CITIES = [
  'Marília', 'Presidente Prudente', 'Assis', 'Tupã', 'Adamantina', 
  'Bauru', 'Araçatuba', 'Ourinhos', 'Dracena', 'Lins'
];

export default function Clients() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const urlFilter = urlParams.get('filter');
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(urlFilter || 'all');
  const [scoreFilter, setScoreFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showFunnel, setShowFunnel] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [visitFilter, setVisitFilter] = useState('all');
  const [pipelineFilter, setPipelineFilter] = useState('all');
  const [sortBy, setSortBy] = useState('city'); // 'city', 'alpha', 'importance'
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [tableData, setTableData] = useState('');
  const [processing, setProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState('');
  const [results, setResults] = useState(null);
  const [editingClientId, setEditingClientId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('all');

  const { clients, isOffline, isLoading: offlineLoading, isCached, cacheAge } = useOfflineClients();
  const isLoading = offlineLoading;

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      try {
        const allSales = await base44.entities.Sale.list();
        const validClientIds = new Set(clients.filter(c => c && c.id && !c.is_deleted).map(c => c.id));
        return allSales.filter(s => {
          if (!s || !s.id) return false;
          if (!s.client_id) return true;
          return validClientIds.has(s.client_id);
        });
      } catch (error) {
        console.warn('Erro ao carregar vendas (ignorando):', error);
        return [];
      }
    },
    enabled: clients.length > 0,
    retry: 0,
    staleTime: 60 * 60 * 1000,
    meta: {
      errorHandler: () => {}
    }
  });

  const { data: allVisits = [] } = useQuery({
    queryKey: ['all-visits'],
    queryFn: async () => {
      try {
        const allVisits = await base44.entities.Visit.list('-scheduled_date');
        const validClientIds = new Set(clients.map(c => c.id));
        return allVisits.filter(v => !v.client_id || validClientIds.has(v.client_id));
      } catch (error) {
        console.warn('Erro ao carregar visitas (ignorando):', error);
        return [];
      }
    },
    enabled: clients.length > 0,
    retry: 0,
    staleTime: 60 * 60 * 1000,
    meta: {
      errorHandler: () => {}
    }
  });

  // Lista única de cidades
  // Cidades da região laranja (Nathan)
  const ORANGE_REGION_CITIES = [
    'Marília', 'Presidente Prudente', 'Assis', 'Tupã', 'Adamantina', 
    'Bauru', 'Araçatuba', 'Ourinhos', 'Dracena', 'Lins'
  ];

  const cities = useMemo(() => {
    const unique = [...new Set(clients.map(c => c.city).filter(Boolean))];
    return unique.sort();
  }, [clients]);

  const cityCoverage = useMemo(() => {
    const clientCities = new Set(clients.map(c => c.city).filter(Boolean));
    const covered = ORANGE_REGION_CITIES.filter(city => 
      Array.from(clientCities).some(clientCity => 
        clientCity.toLowerCase().includes(city.toLowerCase())
      )
    );
    const missing = ORANGE_REGION_CITIES.filter(city => !covered.includes(city));
    
    return { covered, missing, clientCities: Array.from(clientCities) };
  }, [clients]);

  // Busca e ordenação
  const filteredClients = useMemo(() => {
    let filtered = clients.filter(client => {
      // Busca por nome do cliente ou clínica
      const matchesSearch = !search || (
        client.first_name?.toLowerCase().includes(search.toLowerCase()) ||
        client.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        client.clinic_name?.toLowerCase().includes(search.toLowerCase())
      );
      
      // Filtros
      const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
      const matchesCity = cityFilter === 'all' || client.city === cityFilter;
      
      // Score filter
      let matchesScore = true;
      if (scoreFilter !== 'all') {
        const score = client.purchase_score || 0;
        if (scoreFilter === 'high') matchesScore = score >= 70;
        else if (scoreFilter === 'medium') matchesScore = score >= 40 && score < 70;
        else if (scoreFilter === 'low') matchesScore = score < 40;
      }

      // Filtro de visitas
      let matchesVisit = true;
      if (visitFilter !== 'all') {
        const hasScheduled = allVisits.some(v => v.client_id === client.id && v.status === 'agendada');
        const hasCompleted = allVisits.some(v => v.client_id === client.id && v.status === 'realizada');
        if (visitFilter === 'scheduled') matchesVisit = hasScheduled;
        else if (visitFilter === 'completed') matchesVisit = hasCompleted;
        else if (visitFilter === 'none') matchesVisit = !hasScheduled && !hasCompleted;
      }

      // Filtro de pipeline
      const matchesPipeline = pipelineFilter === 'all' || 
        client.visit_objective === pipelineFilter || 
        client.pipeline_stage === pipelineFilter;
      
      // Filtro de segmento IA
      const matchesSegment = segmentFilter === 'all' || client.ai_segment === segmentFilter;
      
      return matchesSearch && matchesStatus && matchesScore && matchesCity && matchesVisit && matchesPipeline && matchesSegment;
    });

    // Ordenação
    if (sortBy === 'city') {
      // Agrupa por cidade e ordena alfabeticamente dentro de cada grupo
      filtered.sort((a, b) => {
        const cityA = a.city || 'Sem cidade';
        const cityB = b.city || 'Sem cidade';
        if (cityA !== cityB) return cityA.localeCompare(cityB);
        return (a.first_name || '').localeCompare(b.first_name || '');
      });
    } else if (sortBy === 'alpha') {
      // Ordem alfabética por nome
      filtered.sort((a, b) => (a.first_name || '').localeCompare(b.first_name || ''));
    } else if (sortBy === 'importance') {
      // Ordem de importância: status + score
      filtered.sort((a, b) => {
        const statusPriority = { quente: 3, morno: 2, frio: 1 };
        const priorityA = (statusPriority[a.status] || 0) * 100 + (a.purchase_score || 0);
        const priorityB = (statusPriority[b.status] || 0) * 100 + (b.purchase_score || 0);
        return priorityB - priorityA;
      });
    }

    return filtered;
  }, [clients, search, statusFilter, scoreFilter, cityFilter, visitFilter, pipelineFilter, allVisits, sortBy]);

  // Autocomplete suggestions - busca desde a primeira letra
  const handleSearchChange = (value) => {
    setSearch(value);
    
    if (value.length >= 1) {
      const searchLower = value.toLowerCase();
      const matches = clients
        .filter(c => {
          // Busca em qualquer parte do nome, clínica ou cidade
          const nameMatch = c.first_name?.toLowerCase().includes(searchLower);
          const fullNameMatch = c.full_name?.toLowerCase().includes(searchLower);
          const clinicMatch = c.clinic_name?.toLowerCase().includes(searchLower);
          const cityMatch = c.city?.toLowerCase().includes(searchLower);
          const cnpjMatch = c.cnpj?.includes(value);
          const phoneMatch = c.phone?.includes(value);
          
          return nameMatch || fullNameMatch || clinicMatch || cityMatch || cnpjMatch || phoneMatch;
        })
        .sort((a, b) => {
          // Priorizar matches que começam com a busca
          const aStartsWith = a.first_name?.toLowerCase().startsWith(searchLower);
          const bStartsWith = b.first_name?.toLowerCase().startsWith(searchLower);
          if (aStartsWith && !bStartsWith) return -1;
          if (!aStartsWith && bStartsWith) return 1;
          
          // Depois ordenar por status (quente primeiro)
          const statusPriority = { quente: 3, morno: 2, frio: 1 };
          return (statusPriority[b.status] || 0) - (statusPriority[a.status] || 0);
        })
        .slice(0, 8)
        .map(c => ({
          id: c.id,
          label: c.first_name,
          sublabel: c.clinic_name || c.city
        }));
      setSuggestions(matches);
    } else {
      setSuggestions([]);
    }
  };

  const activeFiltersCount = [statusFilter, scoreFilter, cityFilter, visitFilter, pipelineFilter, segmentFilter].filter(f => f !== 'all').length;

  const handleQuickEdit = (client) => {
    setEditingClientId(client.id);
    setEditingName(client.first_name || '');
  };

  const saveQuickEdit = async () => {
    if (!editingName.trim()) {
      toast.error('Nome não pode estar vazio');
      return;
    }
    try {
      await base44.entities.Client.update(editingClientId, {
        first_name: editingName.trim()
      });
      toast.success('Nome atualizado!');
      setEditingClientId(null);
      setEditingName('');
    } catch (error) {
      toast.error('Erro ao atualizar');
    }
  };

  const exportClientDocument = async (client) => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`Perfil do Cliente - ${client.first_name}`, 14, 15);
    
    doc.setFontSize(10);
    let y = 30;
    
    const addLine = (label, value) => {
      doc.text(`${label}: ${value || '-'}`, 14, y);
      y += 6;
    };
    
    addLine('Nome', client.first_name);
    addLine('Clínica', client.clinic_name);
    addLine('Cidade', client.city);
    addLine('Telefone', client.phone);
    addLine('Email', client.email);
    addLine('Endereço', client.address);
    addLine('Status', client.status);
    addLine('Score', `${client.purchase_score || 0}%`);
    addLine('Equipamento Atual', client.current_equipment);
    addLine('Pipeline', client.pipeline_stage);
    
    doc.save(`cliente-${client.first_name}-${Date.now()}.pdf`);
    toast.success('Documento exportado!');
  };

  const generatePDF = () => {
    const doc = new jsPDF('portrait');
    
    // Título
    doc.setFontSize(16);
    doc.text('Lista de Clientes - Nathan', 14, 15);
    
    doc.setFontSize(9);
    doc.text(`Total: ${clients.length} clientes | ${new Date().toLocaleDateString('pt-BR')}`, 14, 22);
    
    let yPos = 30;
    doc.setFontSize(8);
    
    clients.forEach((client, index) => {
      // Nova página se necessário
      if (yPos > 270) {
        doc.addPage();
        yPos = 15;
      }
      
      // Dados do cliente
      const status = client.status === 'quente' ? 'Quente' : 
                     client.status === 'morno' ? 'Morno' : 'Frio';
      
      doc.text(`${index + 1}. ${client.first_name || '-'}`, 14, yPos);
      yPos += 4;
      doc.text(`   Clinica: ${client.clinic_name || '-'}`, 14, yPos);
      yPos += 4;
      doc.text(`   Cidade: ${client.city || '-'} | Tel: ${client.phone || '-'}`, 14, yPos);
      yPos += 4;
      doc.text(`   Email: ${client.email || '-'}`, 14, yPos);
      yPos += 4;
      doc.text(`   Equip: ${client.current_equipment || '-'} | Status: ${status}`, 14, yPos);
      yPos += 6;
    });
    
    // Salvar PDF
    doc.save(`clientes-nathan-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF gerado com sucesso!');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadedFile(file);
    toast.info('Arquivo selecionado! Clique em Importar para processar.');
  };

  const handleImportTable = async () => {
    if (!tableData.trim() && !uploadedFile && !googleSheetsUrl.trim()) {
      toast.error('Cole os dados da tabela, link do Google Sheets ou faça upload de um arquivo/imagem');
      return;
    }

    setProcessing(true);
    try {
      let fileUrl = null;
      
      // Se houver arquivo, fazer upload primeiro
      if (uploadedFile) {
        toast.info('Fazendo upload do arquivo...');
        const uploadResult = await base44.integrations.Core.UploadFile({ file: uploadedFile });
        fileUrl = uploadResult.file_url;
        toast.info('Extraindo dados do arquivo...');
      }

      const aiMode = localStorage.getItem('nr22_ai_mode') || 'economy';
      
      if (aiMode === 'off') {
        toast.error('IA desligada - Ative na Home para importar via IA');
        setProcessing(false);
        return;
      }

      toast.info('Processando com IA...');

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise ${fileUrl ? 'este arquivo/imagem' : googleSheetsUrl ? 'esta planilha do Google Sheets' : 'esta tabela/lista de clientes'} e extraia as informações estruturadas.

${googleSheetsUrl ? `LINK DO GOOGLE SHEETS: ${googleSheetsUrl}\n\nBusque e extraia TODOS os dados desta planilha do Google.` : ''}

${!fileUrl ? `DADOS DA TABELA:\n${tableData}` : ''}

Extraia e retorne um array de clientes com os seguintes campos (se disponíveis):
- first_name (nome do responsável)
- clinic_name (nome da clínica)
- city (cidade)
- phone (telefone/WhatsApp)
- email
- address (endereço)
- cnpj
- current_equipment (equipamento/máquina atual que possui)
- decision_role: Sugira automaticamente baseado no nome da clínica:
  * Se tiver "Hospital", "Centro" ou "Clínica Grande" → "veterinario_responsavel"
  * Se tiver "Dr.", "Dra.", nome próprio → "veterinario_responsavel"
  * Casos simples como "Clínica", "Pet Shop" → "proprietario"
  * Se não conseguir determinar → "proprietario"

Se o cliente já possui equipamento mencionado, capture em "current_equipment".
Se não houver informação sobre um campo, deixe vazio ou null.

Retorne JSON válido com TODOS os clientes encontrados.`,
        file_urls: fileUrl ? [fileUrl] : undefined,
        add_context_from_internet: googleSheetsUrl ? true : false,
        response_json_schema: {
          type: "object",
          properties: {
            clients: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  first_name: { type: "string" },
                  clinic_name: { type: "string" },
                  city: { type: "string" },
                  phone: { type: "string" },
                  email: { type: "string" },
                  address: { type: "string" },
                  cnpj: { type: "string" },
                  current_equipment: { type: "string" },
                  decision_role: { type: "string" }
                }
              }
            }
          }
        }
      });

      // Buscar clientes existentes
      const existingClients = await base44.entities.Client.list('-updated_date');
      
      const createdClients = [];
      const updatedClients = [];
      const rejected = [];
      const duplicates = [];
      
      for (const clientData of response.clients) {
        if (!clientData.first_name) continue;
        
        const cityMatch = ORANGE_REGION_CITIES.some(validCity => 
          clientData.city?.toLowerCase().includes(validCity.toLowerCase())
        );
        
        if (!cityMatch) {
          rejected.push({ 
            name: clientData.first_name, 
            city: clientData.city, 
            reason: 'Cidade fora da região laranja' 
          });
          continue;
        }
        
        // Verificar duplicatas por nome ou telefone
        const duplicate = existingClients.find(c => 
          (c.first_name?.toLowerCase() === clientData.first_name?.toLowerCase()) ||
          (clientData.phone && c.phone && c.phone.replace(/\D/g, '') === clientData.phone.replace(/\D/g, ''))
        );
        
        if (duplicate) {
          duplicates.push({ 
            existing: duplicate,
            new: clientData,
            name: clientData.first_name 
          });
          continue;
        }
        
        try {
          const client = await base44.entities.Client.create({
            ...clientData,
            decision_role: clientData.decision_role || 'proprietario',
            status: 'morno',
            purchase_score: 50
          });
          createdClients.push(client);
        } catch (error) {
          console.error('Erro ao criar cliente:', clientData.first_name, error);
          rejected.push({ 
            name: clientData.first_name, 
            city: clientData.city, 
            reason: 'Erro ao cadastrar' 
          });
        }
      }

      // Mostrar resumo
      let summary = [];
      if (createdClients.length > 0) summary.push(`${createdClients.length} novos`);
      if (updatedClients.length > 0) summary.push(`${updatedClients.length} atualizados`);
      if (rejected.length > 0) summary.push(`${rejected.length} rejeitados`);
      if (duplicates.length > 0) summary.push(`${duplicates.length} duplicados`);
      
      if (createdClients.length > 0 || updatedClients.length > 0) {
        toast.success(`Importação concluída: ${summary.join(', ')}`);
        if (duplicates.length === 0) {
          setShowImportDialog(false);
          setTableData('');
          setUploadedFile(null);
          setGoogleSheetsUrl('');
        }
      } else if (duplicates.length > 0) {
        toast.info(`${duplicates.length} clientes duplicados encontrados - revise abaixo`);
      } else {
        toast.warning('Nenhum cliente foi importado');
      }
      
      if (rejected.length > 0) {
        console.log('Clientes rejeitados:', rejected);
      }
      
      // Armazenar duplicatas para revisão
      if (duplicates.length > 0) {
        setResults({ duplicates, createdClients, rejected });
      }
      
    } catch (error) {
      console.error('Erro ao importar:', error);
      if (error.message?.includes('limit')) {
        toast.error('Limite de IA atingido - Aguarde renovação ou use modo econômico');
      } else {
        toast.error('Erro ao processar: ' + (error.message || 'Erro desconhecido'));
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        {/* Offline Indicator */}
        {(isOffline || isCached) && (
          <div className="px-4 pt-4">
            <OfflineIndicator cacheAge={cacheAge} clientsCount={clients.length} />
          </div>
        )}
        
        <div className="px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(createPageUrl('Home'))} className="p-2 -ml-2 rounded-full hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-lg font-semibold text-slate-800 flex-1">Clientes</h1>
          <Button
            size="sm"
            variant={showFunnel ? "default" : "outline"}
            onClick={() => setShowFunnel(!showFunnel)}
            className={`mr-2 ${showFunnel ? 'bg-indigo-600' : ''}`}
          >
            <TrendingUp className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={generatePDF}
            className="mr-2"
          >
            <FileDown className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowImportDialog(true)}
            className="mr-2"
          >
            <Table className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            onClick={() => navigate(createPageUrl('NewClient'))}
            className="bg-indigo-600 hover:bg-indigo-700 rounded-lg"
          >
            <UserPlus className="w-4 h-4" />
          </Button>
        </div>

        {/* Search with Autocomplete */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Buscar por nome, clínica, cidade, telefone..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-10 h-12 rounded-xl border-2"
              autoComplete="off"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch('');
                  setSuggestions([]);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
            
            {/* Autocomplete Suggestions com ações */}
            {suggestions.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-white border-2 border-indigo-300 rounded-xl shadow-xl z-20 max-h-96 overflow-y-auto">
                {suggestions.map((suggestion) => {
                  const client = clients.find(c => c.id === suggestion.id);
                  return (
                    <div
                      key={suggestion.id}
                      className="px-4 py-3 hover:bg-indigo-50 border-b last:border-b-0"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800">{suggestion.label}</p>
                          {suggestion.sublabel && (
                            <p className="text-xs text-slate-500">{suggestion.sublabel}</p>
                          )}
                          <div className="flex gap-2 mt-1">
                            {client?.status && (
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                client.status === 'quente' ? 'bg-red-100 text-red-700' :
                                client.status === 'morno' ? 'bg-orange-100 text-orange-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {client.status === 'quente' ? '🔥' : client.status === 'morno' ? '🌡️' : '❄️'}
                              </span>
                            )}
                            {client?.purchase_score !== undefined && (
                              <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded">
                                {client.purchase_score}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(createPageUrl(`ClientProfile?id=${suggestion.id}`))}
                          className="flex-1 h-8 text-xs"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Ver Perfil
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuickEdit(client)}
                          className="h-8 text-xs"
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => exportClientDocument(client)}
                          className="h-8 text-xs"
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick Status Filter */}
        <div className="px-4 pb-3">
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList className="w-full bg-slate-100 p-1 rounded-xl">
              <TabsTrigger value="all" className="flex-1 rounded-lg text-xs">Todos</TabsTrigger>
              <TabsTrigger value="quente" className="flex-1 rounded-lg text-xs">🔥</TabsTrigger>
              <TabsTrigger value="morno" className="flex-1 rounded-lg text-xs">🌡️</TabsTrigger>
              <TabsTrigger value="frio" className="flex-1 rounded-lg text-xs">❄️</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Ordenação */}
        <div className="px-4 pb-3">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-10 border-2">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="city">🏙️ Por Cidade (agrupado)</SelectItem>
              <SelectItem value="alpha">🔤 Ordem Alfabética</SelectItem>
              <SelectItem value="importance">⭐ Por Importância</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* City Coverage - Região Laranja */}
        <div className="px-4 pb-4 bg-gradient-to-r from-orange-50 to-amber-50 border-t">
          <div className="p-4">
            <h3 className="font-bold text-orange-900 mb-3 flex items-center gap-2">
              🟠 Cobertura - Região Laranja
              <span className="text-sm font-normal text-orange-700">
                ({cityCoverage.covered.length}/{ORANGE_REGION_CITIES.length} cidades)
              </span>
            </h3>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-green-100 rounded-lg text-center">
                <p className="text-3xl font-bold text-green-800">{cityCoverage.covered.length}</p>
                <p className="text-xs text-green-700">Com Clientes</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg text-center">
                <p className="text-3xl font-bold text-red-800">{cityCoverage.missing.length}</p>
                <p className="text-xs text-red-700">Sem Clientes</p>
              </div>
            </div>

            {cityCoverage.covered.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-green-800 mb-2">✅ Cidades com Clientes:</p>
                <div className="flex flex-wrap gap-1">
                  {cityCoverage.covered.map(city => (
                    <span key={city} className="px-2 py-1 bg-green-200 text-green-900 rounded-full text-xs font-medium">
                      {city}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {cityCoverage.missing.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-red-800 mb-2">⚠️ Cidades Faltando:</p>
                <div className="flex flex-wrap gap-1">
                  {cityCoverage.missing.map(city => (
                    <span key={city} className="px-2 py-1 bg-red-200 text-red-900 rounded-full text-xs font-medium">
                      {city}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {cityCoverage.clientCities.length > ORANGE_REGION_CITIES.length && (
              <div className="mt-3 p-2 bg-blue-100 rounded-lg">
                <p className="text-xs text-blue-800">
                  ℹ️ Há {cityCoverage.clientCities.length - cityCoverage.covered.length} clientes em cidades fora da região laranja
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Funnel Chart */}
        {showFunnel && (
          <div className="px-4 pb-4 bg-slate-50 border-t">
            <SalesFunnelChart clients={clients} />
          </div>
        )}

        {/* Advanced Filters Toggle */}
        <div className="px-4 pb-4">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="w-full border-2 border-slate-200 hover:bg-slate-50"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros Avançados
            {activeFiltersCount > 0 && (
              <span className="ml-2 bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </Button>

          {showFilters && (
            <div className="mt-3 space-y-3 p-4 bg-slate-50 rounded-xl border-2 border-slate-200">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-2 block">Score de Compra</label>
                <Select value={scoreFilter} onValueChange={setScoreFilter}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os scores</SelectItem>
                    <SelectItem value="high">Alto (70-100)</SelectItem>
                    <SelectItem value="medium">Médio (40-69)</SelectItem>
                    <SelectItem value="low">Baixo (0-39)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-2 block">Cidade</label>
                <Select value={cityFilter} onValueChange={setCityFilter}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as cidades</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-2 block">Situação de Visita</label>
                <Select value={visitFilter} onValueChange={setVisitFilter}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="scheduled">📅 Com Visita Agendada</SelectItem>
                    <SelectItem value="completed">✓ Já Visitados</SelectItem>
                    <SelectItem value="none">Sem Visita</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-2 block">Fase da Negociação</label>
                <Select value={pipelineFilter} onValueChange={setPipelineFilter}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Fases</SelectItem>
                    <SelectItem value="diagnosticar_necessidades">Diagnóstico</SelectItem>
                    <SelectItem value="apresentar_equipamento">Apresentação</SelectItem>
                    <SelectItem value="demonstracao_tecnica">Demo Técnica</SelectItem>
                    <SelectItem value="negociar_proposta">Negociação</SelectItem>
                    <SelectItem value="fechar_venda">Fechamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-2 block">Segmento IA</label>
                <Select value={segmentFilter} onValueChange={setSegmentFilter}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Segmentos</SelectItem>
                    <SelectItem value="VIP">👑 VIP</SelectItem>
                    <SelectItem value="Champions">🏆 Champions</SelectItem>
                    <SelectItem value="Potential">⭐ Potenciais</SelectItem>
                    <SelectItem value="Nurture">🌱 Desenvolver</SelectItem>
                    <SelectItem value="At Risk">⚠️ Em Risco</SelectItem>
                    <SelectItem value="Cold">❄️ Frios</SelectItem>
                    <SelectItem value="Dormant">💤 Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="ghost"
                onClick={() => {
                  setStatusFilter('all');
                  setScoreFilter('all');
                  setCityFilter('all');
                  setVisitFilter('all');
                  setPipelineFilter('all');
                  setSegmentFilter('all');
                }}
                className="w-full text-sm"
              >
                <X className="w-4 h-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Client List */}
      <div className="p-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500">Nenhum cliente encontrado</p>
            <Button
              variant="link"
              onClick={() => navigate(createPageUrl('NewClient'))}
              className="mt-2 text-indigo-600"
            >
              Cadastrar novo cliente
            </Button>
          </div>
        ) : (
          <>
            {sortBy === 'city' && (() => {
              // Agrupa por cidade
              const grouped = filteredClients.reduce((acc, client) => {
                const city = client.city || 'Sem cidade';
                if (!acc[city]) acc[city] = [];
                acc[city].push(client);
                return acc;
              }, {});

              return Object.entries(grouped).map(([city, cityClients]) => (
                <div key={city} className="space-y-3">
                  <div className="sticky top-20 bg-slate-50 py-2 z-10">
                    <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide flex items-center gap-2">
                      📍 {city}
                      <span className="text-xs font-normal text-slate-500">({cityClients.length})</span>
                    </h3>
                  </div>
                  {cityClients.map((client) => {
                    const hasPurchase = sales.some(s => 
                      s.client_id === client.id && 
                      (s.status === 'fechada' || s.status === 'entregue')
                    );
                    const scheduledVisit = allVisits.find(v => 
                      v.client_id === client.id && 
                      v.status === 'agendada'
                    );
                    const lastVisit = allVisits.find(v => 
                      v.client_id === client.id && 
                      v.status === 'realizada'
                    );
                    return (
                      <div key={client.id} className="relative">
                        {editingClientId === client.id ? (
                          <div className="p-4 bg-white rounded-lg border-2 border-indigo-300 shadow-sm">
                            <div className="flex gap-2 mb-3">
                              <Input
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                placeholder="Nome do cliente"
                                className="flex-1"
                                autoFocus
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={saveQuickEdit} className="flex-1 bg-green-600 hover:bg-green-700">
                                Salvar
                              </Button>
                              <Button variant="outline" onClick={() => setEditingClientId(null)} className="flex-1">
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <ClientCard 
                              client={client} 
                              hasPurchase={hasPurchase} 
                              scheduledVisit={scheduledVisit}
                              lastVisit={lastVisit}
                            />
                            <div className="flex gap-2 mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleQuickEdit(client)}
                                className="flex-1 h-9"
                              >
                                <Edit2 className="w-3 h-3 mr-1" />
                                Editar Nome
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => exportClientDocument(client)}
                                className="flex-1 h-9"
                              >
                                <FileText className="w-3 h-3 mr-1" />
                                Exportar
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ));
            })()}

            {sortBy !== 'city' && filteredClients.map((client) => {
              const hasPurchase = sales.some(s => 
                s.client_id === client.id && 
                (s.status === 'fechada' || s.status === 'entregue')
              );
              const scheduledVisit = allVisits.find(v => 
                v.client_id === client.id && 
                v.status === 'agendada'
              );
              const lastVisit = allVisits.find(v => 
                v.client_id === client.id && 
                v.status === 'realizada'
              );
              return (
                <div key={client.id} className="relative">
                  {editingClientId === client.id ? (
                    <div className="p-4 bg-white rounded-lg border-2 border-indigo-300 shadow-sm">
                      <div className="flex gap-2 mb-3">
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          placeholder="Nome do cliente"
                          className="flex-1"
                          autoFocus
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={saveQuickEdit} className="flex-1 bg-green-600 hover:bg-green-700">
                          Salvar
                        </Button>
                        <Button variant="outline" onClick={() => setEditingClientId(null)} className="flex-1">
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <ClientCard 
                        client={client} 
                        hasPurchase={hasPurchase} 
                        scheduledVisit={scheduledVisit}
                        lastVisit={lastVisit}
                      />
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuickEdit(client)}
                          className="flex-1 h-9"
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          Editar Nome
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => exportClientDocument(client)}
                          className="flex-1 h-9"
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          Exportar
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importar Clientes da Planilha</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800 font-medium mb-2">🟠 Região Laranja (Nathan)</p>
              <p className="text-xs text-orange-700">
                Apenas cidades: Marília, Presidente Prudente, Assis, Tupã, Adamantina, Bauru, Araçatuba, Ourinhos, Dracena, Lins
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Opção 1: Link do Google Sheets
                </label>
                <Input
                  placeholder="Cole o link da planilha do Google aqui..."
                  value={googleSheetsUrl}
                  onChange={(e) => setGoogleSheetsUrl(e.target.value)}
                  className="h-12"
                  disabled={!!uploadedFile || !!tableData.trim()}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Ex: https://docs.google.com/spreadsheets/d/1abc.../edit
                </p>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500">OU</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Opção 2: Upload de Imagem ou Arquivo
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv,.jpg,.jpeg,.png,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                    <p className="text-sm text-slate-600">
                      {uploadedFile ? (
                        <span className="text-green-600 font-medium">✓ {uploadedFile.name}</span>
                      ) : (
                        <>Clique para fazer upload</>
                      )}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Formatos: Excel, CSV, PDF ou Imagem (JPG, PNG)
                    </p>
                  </label>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500">OU</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Opção 3: Cole os dados da tabela
                </label>
                <Textarea
                  value={tableData}
                  onChange={(e) => setTableData(e.target.value)}
                  placeholder="Ex:
Nome        | Clínica              | Cidade        | Telefone      | Equipamento
João Silva  | Clínica Vida Animal  | Marília       | 14999999999   | BC-2800
Maria Costa | Pet Care Center      | Tupã          | 14988888888   | Sem equipamento
..."
                  className="min-h-[200px] font-mono text-sm"
                  disabled={!!uploadedFile || !!googleSheetsUrl.trim()}
                />
              </div>
            </div>

            {results?.duplicates?.length > 0 && (
              <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
                <h4 className="font-semibold text-slate-800">Clientes Duplicados Encontrados:</h4>
                {results.duplicates.map((dup, idx) => (
                  <div key={idx} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="font-semibold text-slate-800 mb-2">{dup.name}</p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-2 bg-white rounded">
                        <p className="font-semibold text-slate-600 mb-1">Existente:</p>
                        <p>Clínica: {dup.existing.clinic_name || '-'}</p>
                        <p>Tel: {dup.existing.phone || '-'}</p>
                        <p>Cidade: {dup.existing.city || '-'}</p>
                      </div>
                      <div className="p-2 bg-green-50 rounded">
                        <p className="font-semibold text-green-700 mb-1">Novo:</p>
                        <p>Clínica: {dup.new.clinic_name || '-'}</p>
                        <p>Tel: {dup.new.phone || '-'}</p>
                        <p>Cidade: {dup.new.city || '-'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        onClick={async () => {
                          try {
                            await base44.entities.Client.update(dup.existing.id, {
                              ...dup.new,
                              decision_role: dup.new.decision_role || 'proprietario',
                            });
                            toast.success(`Cliente ${dup.name} atualizado!`);
                            setResults(prev => ({
                              ...prev,
                              duplicates: prev.duplicates.filter((_, i) => i !== idx)
                            }));
                          } catch (error) {
                            toast.error('Erro ao atualizar');
                          }
                        }}
                        className="flex-1 bg-blue-600"
                      >
                        Atualizar Existente
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            await base44.entities.Client.create({
                              ...dup.new,
                              decision_role: dup.new.decision_role || 'proprietario',
                              status: 'morno',
                              purchase_score: 50
                            });
                            toast.success(`Novo cliente ${dup.name} criado!`);
                            setResults(prev => ({
                              ...prev,
                              duplicates: prev.duplicates.filter((_, i) => i !== idx)
                            }));
                          } catch (error) {
                            toast.error('Erro ao criar');
                          }
                        }}
                        className="flex-1"
                      >
                        Criar Novo
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleImportTable}
                disabled={(!tableData.trim() && !uploadedFile && !googleSheetsUrl.trim()) || processing}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Importar Clientes
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowImportDialog(false);
                  setTableData('');
                  setUploadedFile(null);
                  setGoogleSheetsUrl('');
                  setResults(null);
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}