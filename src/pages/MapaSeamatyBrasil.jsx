import React, { useState, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { jsPDF } from 'jspdf';
import {
  Map, Settings, Filter, Phone, MessageSquare, MapPin, Zap,
  Eye, EyeOff, ChevronRight, ArrowUp, BarChart3, Layers, Download
} from 'lucide-react';
import { toast } from 'sonner';
import {
  CORES, calcularScoreCidade, classificarCidade, corCidade,
  calcularScoreCliente, classificarCliente, corPin,
  gerarURLGoogleMaps, gerarURLWhatsApp, otimizarRota, coordenadasValidas
} from '@/utils/locationSeamaty';

const MapaSeamatyBrasil = () => {
  const [filtroAtivo, setFiltroAtivo] = useState('todos');
  const [filtroCity, setFiltroCity] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroEquipamento, setFiltroEquipamento] = useState('');
  const [filtroRepresentante, setFiltroRepresentante] = useState('Nathan');
  const [camadaAtiva, setCamadaAtiva] = useState(new Set(['cidades', 'clientes', 'oportunidades']));
  const [modoPublicacao, setModoPublicacao] = useState(false);
  const [showGeoloc, setShowGeoloc] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [abaLateral, setAbaLateral] = useState('cidades');
  const [searchLateral, setSearchLateral] = useState('');

  // Buscar cidades do território
  const { data: cidades = [], isLoading: loadingCidades } = useQuery({
    queryKey: ['cidades-territorio'],
    queryFn: async () => {
      try {
        return await base44.entities.CidadeTerritorioSeamaty?.list?.() || [];
      } catch (e) {
        console.error('Erro ao carregar cidades:', e);
        return [];
      }
    },
    staleTime: 300000,
  });

  // Buscar pontos do mapa (clientes, leads, oportunidades)
  const { data: pontos = [], isLoading: loadingPontos } = useQuery({
    queryKey: ['location-points-seamaty'],
    queryFn: async () => {
      try {
        return await base44.entities.LocationPointSeamaty?.list?.() || [];
      } catch (e) {
        console.error('Erro ao carregar pontos:', e);
        return [];
      }
    },
    staleTime: 300000,
  });

  // Agrupar pontos por tipo
  const pontosPorTipo = useMemo(() => {
    const grupos = {
      clientes: [],
      leads: [],
      oportunidades: [],
      comodatos: [],
      recompras: [],
      inativos: [],
      posvenda: [],
    };
    
    pontos.forEach((p) => {
      if (p.tipo === 'cliente') grupos.clientes.push(p);
      else if (p.tipo === 'lead') grupos.leads.push(p);
      else if (p.tipo === 'oportunidade_equipamento') grupos.oportunidades.push(p);
      else if (p.tipo === 'comodato') grupos.comodatos.push(p);
      else if (p.tipo === 'recompra_insumo') grupos.recompras.push(p);
      else if (p.tipo === 'inativo') grupos.inativos.push(p);
      else if (p.tipo === 'pós_venda') grupos.posvenda.push(p);
    });

    return grupos;
  }, [pontos]);

  // Aplicar filtros
  const pontosFiltrados = useMemo(() => {
    let resultado = pontos;

    // Representante
    if (filtroRepresentante) {
      resultado = resultado.filter(p => p.responsavel && p.responsavel.toLowerCase().includes(filtroRepresentante.toLowerCase()));
    }

    // Tipo
    if (filtroAtivo !== 'todos') {
      resultado = resultado.filter(p => p.tipo === filtroAtivo);
    }

    // Cidade
    if (filtroCity) {
      resultado = resultado.filter(p =>
        p.cidade.toLowerCase().includes(filtroCity.toLowerCase())
      );
    }

    // Status
    if (filtroStatus) {
      resultado = resultado.filter(p => p.status_funil === filtroStatus);
    }

    // Equipamento
    if (filtroEquipamento) {
      resultado = resultado.filter(p =>
        p.equipamentos_atuais?.includes(filtroEquipamento)
      );
    }

    return resultado;
  }, [pontos, filtroAtivo, filtroCity, filtroStatus, filtroEquipamento, filtroRepresentante]);

  // Cidades filtradas
  const cidadesFiltradas = useMemo(() => {
    let resultado = cidades;
    
    // Filtrar cidades que têm clientes do representante selecionado
    if (filtroRepresentante) {
      const clientesRepresentante = pontos.filter(p => 
        p.responsavel && p.responsavel.toLowerCase().includes(filtroRepresentante.toLowerCase())
      );
      const cidadesComClientes = new Set(clientesRepresentante.map(p => p.cidade));
      resultado = resultado.filter(c => cidadesComClientes.has(c.cidade));
    }
    
    if (filtroCity) {
      resultado = resultado.filter(c =>
        c.cidade.toLowerCase().includes(filtroCity.toLowerCase())
      );
    }
    return resultado;
  }, [cidades, filtroCity, filtroRepresentante, pontos]);

  // Calcular totais para o painel superior
  const totais = useMemo(() => {
    const totalCidades = cidadesFiltradas.length;
    const totalClientes = pontosFiltrados.filter(p => p.tipo === 'cliente').length;
    const comEquipamento = pontosFiltrados.filter(p =>
      p.tipo === 'cliente' && p.equipamentos_atuais?.length > 0
    ).length;
    const semEquipamento = pontosFiltrados.filter(p =>
      p.tipo === 'cliente' && (!p.equipamentos_atuais || p.equipamentos_atuais.length === 0)
    ).length;
    const oportunidadesA = pontosFiltrados.filter(p =>
      p.prioridade === 'a_quente'
    ).length;
    const comodatos = pontosFiltrados.filter(p =>
      p.tipo === 'comodato'
    ).length;
    const recompras = pontosFiltrados.filter(p =>
      p.tipo === 'recompra_insumo'
    ).length;
    const inativos = pontosFiltrados.filter(p =>
      p.tipo === 'inativo'
    ).length;
    const cidadesMax = cidadesFiltradas.filter(c =>
      c.prioridade_cidade === 'prioridade_maxima'
    ).length;

    return {
      totalCidades,
      totalClientes,
      comEquipamento,
      semEquipamento,
      oportunidadesA,
      comodatos,
      recompras,
      inativos,
      cidadesMax,
    };
  }, [cidadesFiltradas, pontosFiltrados]);

  // Função para exportar dados
  const handleExportarDados = useCallback((formato) => {
    const timestamp = new Date().toISOString().split('T')[0];
    const nomeArquivo = `mapa-territorial-nathan-${timestamp}`;

    if (formato === 'csv') {
      // Preparar dados das cidades
      const dadosCidades = cidadesFiltradas.map(c => [
        c.cidade,
        c.uf,
        c.total_clientes || 0,
        c.total_leads || 0,
        c.total_clientes_com_equipamento || 0,
        c.total_clientes_sem_equipamento || 0,
        c.score_cidade || 0,
        c.prioridade_cidade || '',
      ]);

      // Preparar dados dos clientes
      const dadosClientes = pontosFiltrados.map(p => [
        p.nome_clinica || '',
        p.cidade || '',
        p.uf || '',
        p.tipo || '',
        p.responsavel || filtroRepresentante,
        p.equipamentos_atuais?.join(';') || '',
        p.equipamento_sugerido || '',
        p.score_oportunidade || 0,
        p.prioridade || '',
        p.status_funil || '',
        p.whatsapp || '',
        p.proxima_acao || '',
      ]);

      // Montar CSV
      const csvCidades = [
        ['CIDADES'],
        ['Cidade', 'UF', 'Clientes', 'Leads', 'Com Eq.', 'Sem Eq.', 'Score', 'Prioridade'],
        ...dadosCidades,
        [''],
        ['CLIENTES / OPORTUNIDADES'],
        ['Clínica', 'Cidade', 'UF', 'Tipo', 'Responsável', 'Equipamentos Atuais', 'Eq. Sugerido', 'Score', 'Prioridade', 'Status', 'WhatsApp', 'Próxima Ação'],
        ...dadosClientes,
      ]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      // Download
      const blob = new Blob([csvCidades], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${nomeArquivo}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV exportado com sucesso');
    } else if (formato === 'pdf') {
      const doc = new jsPDF();
      
      doc.setFontSize(14);
      doc.text('Mapa Territorial Seamaty Brasil', 10, 15);
      doc.setFontSize(10);
      doc.text(`Representante: ${filtroRepresentante || 'Todos'}`, 10, 22);
      doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 10, 28);

      // Resumo
      let y = 38;
      doc.setFontSize(11);
      doc.text('RESUMO', 10, y);
      y += 6;
      doc.setFontSize(9);
      doc.text(`Total de Cidades: ${totais.totalCidades}`, 12, y);
      y += 5;
      doc.text(`Total de Clientes: ${totais.totalClientes}`, 12, y);
      y += 5;
      doc.text(`Com Equipamento: ${totais.comEquipamento}`, 12, y);
      y += 5;
      doc.text(`Sem Equipamento: ${totais.semEquipamento}`, 12, y);
      y += 5;
      doc.text(`Oportunidades A: ${totais.oportunidadesA}`, 12, y);
      y += 10;

      // Tabela de cidades (simplificada)
      doc.setFontSize(10);
      doc.text('CIDADES (TOP 20)', 10, y);
      y += 6;
      
      const cidadesTop = cidadesFiltradas.slice(0, 20);
      doc.setFontSize(8);
      doc.text('Cidade', 12, y);
      doc.text('Clientes', 60, y);
      doc.text('Com Eq.', 85, y);
      doc.text('Score', 110, y);
      y += 4;
      
      cidadesTop.forEach(c => {
        doc.text(c.cidade?.substring(0, 20) || '', 12, y);
        doc.text(String(c.total_clientes || 0), 60, y);
        doc.text(String(c.total_clientes_com_equipamento || 0), 85, y);
        doc.text(String(c.score_cidade || 0), 110, y);
        y += 4;
        if (y > 250) {
          doc.addPage();
          y = 10;
        }
      });

      doc.save(`${nomeArquivo}.pdf`);
      toast.success('PDF exportado com sucesso');
    }
  }, [cidadesFiltradas, pontosFiltrados, totais, filtroRepresentante]);

  // Função para gerar rota sniper
  const handleGerarRotaSniper = useCallback(async () => {
    const pontosPriority = pontosFiltrados
      .filter(p => p.prioridade === 'a_quente')
      .sort((a, b) => b.score_oportunidade - a.score_oportunidade)
      .slice(0, 8); // Máx 8 visitas por dia (regra do Nathan)

    if (pontosPriority.length === 0) {
      toast.info('Nenhuma oportunidade A_QUENTE para a rota');
      return;
    }

    // Otimizar rota por proximidade (versão simplificada)
    const rotaOtimizada = otimizarRota(pontosPriority, {
      lat: -23.5505,
      lng: -46.6333, // São Paulo (referência)
    });

    // Criar tarefa de rota
    try {
      const rotaTasks = rotaOtimizada.map((ponto, idx) => ({
        title: `[Rota Sniper] ${ponto.nome_clinica}`,
        description: `Objetivo: ${ponto.proxima_acao || 'Visita comercial'}`,
        client_id: ponto.client_id,
        due_date: new Date().toISOString().split('T')[0],
        priority: 'alta',
        type: 'visita',
      }));

      // Salvar tasks (ou apenas mostrar no toast por enquanto)
      toast.success(`Rota sniper gerada com ${rotaOtimizada.length} visitas!`);
      console.log('Rota otimizada:', rotaOtimizada);
    } catch (err) {
      toast.error('Erro ao gerar rota sniper');
    }
  }, [pontosFiltrados]);

  // Listar abas laterais
  const abas = [
    { id: 'cidades', label: 'Cidades', count: cidadesFiltradas.length },
    { id: 'clientes', label: 'Clientes', count: pontosFiltrados.filter(p => p.tipo === 'cliente').length },
    { id: 'comodatos', label: 'Comodatos', count: pontosFiltrados.filter(p => p.tipo === 'comodato').length },
    { id: 'recompras', label: 'Recompras', count: pontosFiltrados.filter(p => p.tipo === 'recompra_insumo').length },
    { id: 'oportunidades', label: 'Oportunidades', count: pontosFiltrados.filter(p => p.tipo === 'oportunidade_equipamento').length },
    { id: 'inativos', label: 'Inativos', count: pontosFiltrados.filter(p => p.tipo === 'inativo').length },
  ];

  const itemsLateral = useMemo(() => {
    let items = [];

    if (abaLateral === 'cidades') {
      items = cidadesFiltradas
        .filter(c => !searchLateral || c.cidade.toLowerCase().includes(searchLateral.toLowerCase()))
        .sort((a, b) => (b.score_cidade || 0) - (a.score_cidade || 0));
    } else {
      items = pontosFiltrados
        .filter(p => p.tipo === (abaLateral === 'clientes' ? 'cliente' : abaLateral === 'comodatos' ? 'comodato' : abaLateral === 'recompras' ? 'recompra_insumo' : abaLateral === 'oportunidades' ? 'oportunidade_equipamento' : 'inativo'))
        .filter(p => !searchLateral || p.nome_clinica.toLowerCase().includes(searchLateral.toLowerCase()) || p.cidade.toLowerCase().includes(searchLateral.toLowerCase()))
        .sort((a, b) => (b.score_oportunidade || 0) - (a.score_oportunidade || 0));
    }

    return items;
  }, [abaLateral, searchLateral, cidadesFiltradas, pontosFiltrados]);

  // Estado: se houver erro de carregamento
  if (!loadingCidades && !loadingPontos && cidadesFiltradas.length === 0 && pontosFiltrados.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#fafafa' }}>
        <div className="text-center max-w-md">
          <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Sem dados de geolocalização</h2>
          <p className="text-sm text-slate-500">
            Nenhuma cidade ou cliente cadastrado com geolocalização. Importe dados ou cadastre clientes com coordenadas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#fafafa' }}>
      {/* HEADER */}
      <div className="bg-white border-b sticky top-0 z-30 px-4 py-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#ff6f00' }}>
                <Map className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900">Mapa Territorial Seamaty Brasil</h1>
                <p className="text-xs text-slate-500">Cobertura comercial — Nathan</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setModoPublicacao(!modoPublicacao)}
                className="px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1"
                style={{
                  background: modoPublicacao ? '#ff6f00' : '#e0e0e0',
                  color: modoPublicacao ? '#fff' : '#333',
                }}
              >
                {modoPublicacao ? '✓ Publicação' : '○ Operacional'}
              </button>
            </div>
          </div>

          {/* Painel superior KPI */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
            {[
              { label: 'Cidades', value: totais.totalCidades, color: '#ff6f00' },
              { label: 'Clientes', value: totais.totalClientes, color: '#1976d2' },
              { label: 'Com Eq.', value: totais.comEquipamento, color: '#388e3c' },
              { label: 'Sem Eq.', value: totais.semEquipamento, color: '#d32f2f' },
              { label: 'Oportunidades A', value: totais.oportunidadesA, color: '#d32f2f' },
            ].map((card) => (
              <div key={card.label} className="rounded-lg p-3 text-center" style={{ background: '#fff', border: `2px solid ${card.color}20` }}>
                <p className="text-2xl font-black" style={{ color: card.color }}>{card.value}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{card.label}</p>
              </div>
            ))}
          </div>

          {/* Filtros e controles */}
          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={filtroRepresentante}
              onChange={(e) => setFiltroRepresentante(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm border font-bold"
              style={{ borderColor: '#ff6f00', borderWidth: '2px' }}
            >
              <option value="">Todos representantes</option>
              <option value="Nathan">Nathan</option>
              <option value="Luan">Luan</option>
              <option value="Gabriel">Gabriel</option>
              <option value="Rosa">Rosa</option>
            </select>

            <input
              type="text"
              placeholder="Buscar cidade ou clínica..."
              value={filtroCity}
              onChange={(e) => setFiltroCity(e.target.value)}
              className="flex-1 min-w-[200px] px-3 py-2 rounded-lg text-sm border"
              style={{ borderColor: '#e0e0e0' }}
            />

            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm border"
              style={{ borderColor: '#e0e0e0' }}
            >
              <option value="">Todos status</option>
              <option value="qualificado">Qualificado</option>
              <option value="proposta">Proposta</option>
              <option value="negociacao">Negociação</option>
              <option value="fechado">Fechado</option>
            </select>

            <button
              onClick={handleGerarRotaSniper}
              className="px-4 py-2 text-sm font-bold rounded-lg flex items-center gap-2 text-white"
              style={{ background: '#d32f2f' }}
            >
              <Zap className="w-4 h-4" />
              Rota Sniper
            </button>

            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="px-4 py-2 text-sm font-bold rounded-lg flex items-center gap-2 text-white"
                style={{ background: '#2196f3' }}
              >
                <Download className="w-4 h-4" />
                Exportar
              </button>
              {showExportMenu && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowExportMenu(false)} />
                  <div className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-xl border z-40">
                    <button
                      onClick={() => { handleExportarDados('csv'); setShowExportMenu(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-100 rounded-t-lg font-medium"
                    >
                      📊 CSV Completo
                    </button>
                    <button
                      onClick={() => { handleExportarDados('pdf'); setShowExportMenu(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-100 rounded-b-lg font-medium"
                    >
                      📄 PDF Resumo
                    </button>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setShowGeoloc(!showGeoloc)}
              className="px-3 py-2 rounded-lg text-sm"
              style={{ background: showGeoloc ? '#ff6f0020' : '#e0e0e0' }}
            >
              {showGeoloc ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="flex gap-4 p-4 md:p-6 max-w-7xl mx-auto">
        {/* MAPA PRINCIPAL (simulado) */}
        <div className="flex-1 rounded-2xl overflow-hidden" style={{ background: '#e8f4f8', minHeight: '600px', position: 'relative' }}>
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="text-center max-w-md">
              <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-sm text-slate-600 mb-4">
                Mapa Interativo (Leaflet)
              </p>
              <p className="text-xs text-slate-500">
                {cidadesFiltradas.length} cidades — {pontosFiltrados.length} pontos
              </p>
              <div className="mt-4 text-xs text-slate-500">
                <p>🔴 {totais.cidadesMax} cidades prioritárias</p>
                <p>🟢 {totais.comEquipamento} clientes com equipamento</p>
                <p>🟠 {totais.semEquipamento} clientes sem equipamento</p>
              </div>
            </div>
          </div>

          {/* Legenda (sobreposto no mapa) */}
          <div className="absolute bottom-4 left-4 bg-white rounded-lg p-3 shadow-md max-w-[200px]" style={{ fontSize: '11px' }}>
            <p className="font-bold text-slate-800 mb-2">Legenda</p>
            <div className="space-y-1 text-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: CORES.PRIORIDADE_MAXIMA }} />
                <span>Prioridade Máx</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: CORES.CLIENTE_ATIVO_COM_EQ }} />
                <span>Cliente Ativo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: CORES.VENDA_ALTA }} />
                <span>Oportunidade</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: CORES.COMODATO }} />
                <span>Comodato</span>
              </div>
            </div>
          </div>
        </div>

        {/* PAINEL LATERAL */}
        <div className="w-80 flex flex-col rounded-2xl border" style={{ background: '#fff' }}>
          {/* Abas */}
          <div className="border-b overflow-x-auto flex">
            {abas.map((aba) => (
              <button
                key={aba.id}
                onClick={() => setAbaLateral(aba.id)}
                className="px-3 py-2 text-xs font-bold whitespace-nowrap border-b-2 transition-all"
                style={{
                  borderColor: abaLateral === aba.id ? '#ff6f00' : 'transparent',
                  color: abaLateral === aba.id ? '#ff6f00' : '#999',
                }}
              >
                {aba.label} ({aba.count})
              </button>
            ))}
          </div>

          {/* Busca lateral */}
          <div className="p-3 border-b">
            <input
              type="text"
              placeholder="Buscar nesta aba..."
              value={searchLateral}
              onChange={(e) => setSearchLateral(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border"
              style={{ borderColor: '#e0e0e0' }}
            />
          </div>

          {/* Lista scrollável */}
          <div className="flex-1 overflow-y-auto">
            {itemsLateral.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                Nenhum item encontrado
              </div>
            ) : (
              <div className="divide-y">
                {itemsLateral.map((item) => (
                  <div
                    key={item.id || item.cidade}
                    className="p-3 hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    {abaLateral === 'cidades' ? (
                      // Card cidade
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-bold text-sm text-slate-900">{item.cidade}/{item.uf}</p>
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ background: corCidade(item.prioridade_cidade) }}
                          />
                        </div>
                        <div className="text-xs text-slate-500 space-y-0.5 mb-2">
                          <p>Clientes: {item.total_clientes} | Leads: {item.total_leads}</p>
                          <p>Com Eq: {item.total_clientes_com_equipamento} | Sem Eq: {item.total_clientes_sem_equipamento}</p>
                          <p>Score: {item.score_cidade}</p>
                        </div>
                        <div className="flex gap-1">
                          <a
                            href={`/MapaSeamatyBrasil?city=${item.cidade}`}
                            className="flex-1 px-2 py-1 text-[10px] font-bold rounded text-white text-center"
                            style={{ background: '#1976d2' }}
                          >
                            Ver
                          </a>
                          <button className="flex-1 px-2 py-1 text-[10px] font-bold rounded text-white" style={{ background: '#ff6f00' }}>
                            Rota
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Card cliente
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-bold text-sm text-slate-900">{item.nome_clinica}</p>
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ background: corPin(item.tipo, item.prioridade, item.dias_sem_compra) }}
                          />
                        </div>
                        <div className="text-xs text-slate-500 space-y-0.5 mb-2">
                          <p>{item.cidade}/{item.uf}</p>
                          {item.responsavel && <p>Resp: {item.responsavel}</p>}
                          {item.equipamentos_atuais?.length > 0 && (
                            <p>Eq: {item.equipamentos_atuais.join(', ')}</p>
                          )}
                          {item.score_oportunidade && (
                            <p>Score: {item.score_oportunidade} ({item.prioridade})</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {item.whatsapp && (
                            <a
                              href={gerarURLWhatsApp(item.whatsapp, 'Olá!')}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 px-2 py-1 text-[10px] font-bold rounded text-white flex items-center justify-center gap-1"
                              style={{ background: '#25d366' }}
                            >
                              <MessageSquare className="w-3 h-3" />
                            </a>
                          )}
                          {item.endereco_completo && (
                            <a
                              href={gerarURLGoogleMaps(item.endereco_completo, item.cidade, item.uf)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 px-2 py-1 text-[10px] font-bold rounded text-white flex items-center justify-center gap-1"
                              style={{ background: '#1976d2' }}
                            >
                              <MapPin className="w-3 h-3" />
                            </a>
                          )}
                          <a
                            href={`/ClientProfile?id=${item.client_id || item.id}`}
                            className="flex-1 px-2 py-1 text-[10px] font-bold rounded text-white text-center"
                            style={{ background: '#ff6f00' }}
                          >
                            Ver
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODO PUBLICAÇÃO — Overlay resumido */}
      {modoPublicacao && (
        <div
          className="fixed inset-0 bg-gradient-to-b from-white to-slate-50 flex items-center justify-center p-6"
          style={{ zIndex: 50 }}
        >
          <div className="max-w-2xl text-center">
            <h2 className="text-4xl font-black text-slate-900 mb-2">
              Mapa Territorial Seamaty Brasil
            </h2>
            <p className="text-lg text-slate-600 mb-6">
              Cobertura comercial regional — Operação Nathan
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Cidades', value: totais.totalCidades, color: '#ff6f00' },
                { label: 'Clientes', value: totais.totalClientes, color: '#1976d2' },
                { label: 'Oportunidades', value: totais.oportunidadesA, color: '#d32f2f' },
                { label: 'Comodatos', value: totais.comodatos, color: '#7b1fa2' },
              ].map((card) => (
                <div key={card.label} className="p-4 rounded-xl" style={{ background: `${card.color}10` }}>
                  <p className="text-3xl font-black" style={{ color: card.color }}>{card.value}</p>
                  <p className="text-xs text-slate-600 mt-1">{card.label}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => setModoPublicacao(false)}
              className="px-6 py-3 font-bold rounded-lg text-white"
              style={{ background: '#ff6f00' }}
            >
              Voltar ao Operacional
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapaSeamatyBrasil;