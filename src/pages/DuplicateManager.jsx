import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WeeklyDuplicateCleanupCard from '@/components/duplicates/WeeklyDuplicateCleanupCard';
import { 
  Users, 
  UserPlus, 
  Search, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2,
  Mail,
  Phone,
  Calendar,
  Loader2
} from 'lucide-react';

export default function DuplicateManager() {
  const [activeTab, setActiveTab] = useState('Client');
  const [loading, setLoading] = useState(false);
  const [duplicates, setDuplicates] = useState(null);
  const [stats, setStats] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [deleting, setDeleting] = useState(false);
  const [deleteResult, setDeleteResult] = useState(null);

  const detectDuplicates = async (entityType) => {
    setLoading(true);
    setDuplicates(null);
    setStats(null);
    setSelectedIds(new Set());
    setDeleteResult(null);

    try {
      const response = await base44.functions.invoke('detectDuplicates', {
        entity_type: entityType
      });

      setDuplicates(response.data.duplicate_groups);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Erro ao detectar duplicatas:', error);
      alert('Erro ao detectar duplicatas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = (group) => {
    const newSelected = new Set(selectedIds);
    const duplicateIds = group.duplicates.map(d => d.id);

    const allSelected = duplicateIds.every(id => newSelected.has(id));

    if (allSelected) {
      duplicateIds.forEach(id => newSelected.delete(id));
    } else {
      duplicateIds.forEach(id => newSelected.add(id));
    }

    setSelectedIds(newSelected);
  };

  const toggleSelect = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const removeDuplicates = async () => {
    if (selectedIds.size === 0) {
      alert('Selecione pelo menos um registro para deletar');
      return;
    }

    const confirmMsg = `Tem certeza que deseja deletar ${selectedIds.size} registro(s)? Esta ação não pode ser desfeita.`;
    if (!confirm(confirmMsg)) return;

    setDeleting(true);
    setDeleteResult(null);

    try {
      const response = await base44.functions.invoke('removeDuplicates', {
        entity_type: activeTab,
        ids_to_delete: Array.from(selectedIds)
      });

      setDeleteResult(response.data);
      setSelectedIds(new Set());
      
      // Redetectar duplicatas
      await detectDuplicates(activeTab);
    } catch (error) {
      console.error('Erro ao remover duplicatas:', error);
      alert('Erro ao remover duplicatas: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const getMatchTypeLabel = (type) => {
    const labels = {
      email: '📧 Email',
      phone: '📱 Telefone',
      email_name: '📧👤 Email + Nome'
    };
    return labels[type] || type;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gerenciador de Duplicatas</h1>
        <p className="text-slate-600 mt-2">
          Identifique e remova clientes e leads duplicados no sistema
        </p>
      </div>

      <WeeklyDuplicateCleanupCard />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="Client" className="gap-2">
            <Users className="w-4 h-4" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="Lead" className="gap-2">
            <UserPlus className="w-4 h-4" />
            Leads
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6 mt-6">
          {/* Controles */}
          <Card>
            <CardHeader>
              <CardTitle>Detectar Duplicatas</CardTitle>
              <CardDescription>
                Analisa todos os {activeTab === 'Client' ? 'clientes' : 'leads'} e identifica registros duplicados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => detectDuplicates(activeTab)}
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Buscar Duplicatas
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Estatísticas */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{stats.total_records}</div>
                  <div className="text-sm text-slate-600">Total de Registros</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-orange-600">
                    {stats.duplicate_groups}
                  </div>
                  <div className="text-sm text-slate-600">Grupos Duplicados</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-red-600">
                    {stats.total_duplicates}
                  </div>
                  <div className="text-sm text-slate-600">Duplicatas Encontradas</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-blue-600">
                    {selectedIds.size}
                  </div>
                  <div className="text-sm text-slate-600">Selecionados</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Resultado da Exclusão */}
          {deleteResult && (
            <Alert className="border-green-300 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <strong className="text-green-800">
                  {deleteResult.deleted_count} registro(s) deletado(s) com sucesso
                </strong>
                {deleteResult.failed_count > 0 && (
                  <div className="text-red-600 mt-1">
                    {deleteResult.failed_count} falha(s)
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Ações em Massa */}
          {duplicates && duplicates.length > 0 && (
            <Card className="border-orange-300 bg-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    <span className="font-semibold text-orange-800">
                      {selectedIds.size} registro(s) selecionado(s) para exclusão
                    </span>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={removeDuplicates}
                    disabled={selectedIds.size === 0 || deleting}
                    className="gap-2"
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Deletando...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Deletar Selecionados
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de Duplicatas */}
          {duplicates && duplicates.length === 0 && (
            <Alert className="border-green-300 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Nenhuma duplicata encontrada!</strong> Seus dados estão limpos.
              </AlertDescription>
            </Alert>
          )}

          {duplicates && duplicates.length > 0 && (
            <div className="space-y-4">
              {duplicates.map((group, idx) => (
                <Card key={idx} className="border-2 border-orange-200">
                  <CardHeader className="bg-orange-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-orange-600">
                          {getMatchTypeLabel(group.match_type)}
                        </Badge>
                        <CardTitle className="text-lg">
                          {group.total_count} registros duplicados
                        </CardTitle>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleSelectAll(group)}
                      >
                        {group.duplicates.every(d => selectedIds.has(d.id))
                          ? 'Desmarcar Todos'
                          : 'Selecionar Duplicatas'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    {/* Registro Original (Manter) */}
                    <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            <span className="font-semibold text-green-800">
                              REGISTRO ORIGINAL (Manter)
                            </span>
                            <Badge className="bg-green-600">Mais antigo</Badge>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="font-semibold">
                              {group.keep_candidate.full_name || group.keep_candidate.first_name}
                            </div>
                            {group.keep_candidate.email && (
                              <div className="flex items-center gap-2 text-slate-600">
                                <Mail className="w-3 h-3" />
                                {group.keep_candidate.email}
                              </div>
                            )}
                            {group.keep_candidate.phone && (
                              <div className="flex items-center gap-2 text-slate-600">
                                <Phone className="w-3 h-3" />
                                {group.keep_candidate.phone}
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-slate-500 text-xs">
                              <Calendar className="w-3 h-3" />
                              Criado: {new Date(group.keep_candidate.created_date).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Duplicatas (Deletar) */}
                    <div className="space-y-3">
                      <div className="text-sm font-semibold text-slate-600">
                        Duplicatas ({group.duplicates.length}):
                      </div>
                      {group.duplicates.map((duplicate) => (
                        <div
                          key={duplicate.id}
                          className="bg-red-50 border border-red-200 rounded-lg p-4"
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={selectedIds.has(duplicate.id)}
                              onCheckedChange={() => toggleSelect(duplicate.id)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="space-y-1 text-sm">
                                <div className="font-semibold">
                                  {duplicate.full_name || duplicate.first_name}
                                </div>
                                {duplicate.email && (
                                  <div className="flex items-center gap-2 text-slate-600">
                                    <Mail className="w-3 h-3" />
                                    {duplicate.email}
                                  </div>
                                )}
                                {duplicate.phone && (
                                  <div className="flex items-center gap-2 text-slate-600">
                                    <Phone className="w-3 h-3" />
                                    {duplicate.phone}
                                  </div>
                                )}
                                <div className="flex items-center gap-2 text-slate-500 text-xs">
                                  <Calendar className="w-3 h-3" />
                                  Criado: {new Date(duplicate.created_date).toLocaleDateString('pt-BR')}
                                </div>
                              </div>
                            </div>
                            <Badge variant="destructive">Duplicata</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}