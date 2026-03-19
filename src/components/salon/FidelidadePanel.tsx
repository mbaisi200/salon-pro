'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Gift, Star, Award, Sparkles, TrendingUp, Users, Crown,
  Check, X, Plus, Trash2, Edit, History, ChevronRight
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

// =====================================
// INTERFACES
// =====================================
interface FidelidadePanelProps {
  clientes: any[];
  agendamentos: any[];
  financeiro: any[];
  onUpdateCliente: (id: string, data: any) => void;
  onAddLancamento: (data: any) => void;
  tenantId: string;
}

// =====================================
// CONSTANTES
// =====================================
const NIVEIS_FIDELIDADE = [
  { nivel: 'Bronze', pontosMin: 0, cor: '#CD7F32', icone: '🥉', desconto: 0 },
  { nivel: 'Prata', pontosMin: 100, cor: '#C0C0C0', icone: '🥈', desconto: 5 },
  { nivel: 'Ouro', pontosMin: 300, cor: '#FFD700', icone: '🥇', desconto: 10 },
  { nivel: 'Diamante', pontosMin: 600, cor: '#B9F2FF', icone: '💎', desconto: 15 },
  { nivel: 'VIP', pontosMin: 1000, cor: '#9B59B6', icone: '👑', desconto: 20 },
];

const RECOMPENSAS = [
  { id: 'desconto10', nome: 'Desconto de R$10', pontos: 50, tipo: 'desconto', valor: 10 },
  { id: 'desconto25', nome: 'Desconto de R$25', pontos: 100, tipo: 'desconto', valor: 25 },
  { id: 'desconto50', nome: 'Desconto de R$50', pontos: 180, tipo: 'desconto', valor: 50 },
  { id: 'servico_gratis', nome: 'Serviço Grátis (até R$80)', pontos: 300, tipo: 'servico', valor: 80 },
  { id: 'pacote_especial', nome: 'Pacote Especial', pontos: 500, tipo: 'pacote', valor: 150 },
];

// =====================================
// COMPONENTE PRINCIPAL
// =====================================
export default function FidelidadePanel({
  clientes,
  agendamentos,
  financeiro,
  onUpdateCliente,
  onAddLancamento,
  tenantId
}: FidelidadePanelProps) {
  const [clienteSelecionado, setClienteSelecionado] = useState<any>(null);
  const [showResgateDialog, setShowResgateDialog] = useState(false);
  const [showAdicionarPontosDialog, setShowAdicionarPontosDialog] = useState(false);
  const [pontosParaAdicionar, setPontosParaAdicionar] = useState(0);
  const [motivoPontos, setMotivoPontos] = useState('');
  const [recompensaSelecionada, setRecompensaSelecionada] = useState<any>(null);

  // =====================================
  // CÁLCULOS
  // =====================================
  const estatisticas = useMemo(() => {
    const clientesComPontos = clientes.filter(c => (c.pontosFidelidade || 0) > 0);
    const totalPontosDistribuidos = clientes.reduce((acc, c) => acc + (c.pontosFidelidade || 0), 0);
    const mediaPontos = clientes.length > 0 ? totalPontosDistribuidos / clientes.length : 0;

    // Distribuição por nível
    const distribuicaoNiveis = NIVEIS_FIDELIDADE.map(nivel => {
      const count = clientes.filter(c => {
        const pontos = c.pontosFidelidade || 0;
        const proximoNivel = NIVEIS_FIDELIDADE.find(n => n.pontosMin > nivel.pontosMin);
        return pontos >= nivel.pontosMin && (!proximoNivel || pontos < proximoNivel.pontosMin);
      }).length;
      return { ...nivel, count };
    });

    // Top clientes
    const topClientes = [...clientes]
      .sort((a, b) => (b.pontosFidelidade || 0) - (a.pontosFidelidade || 0))
      .slice(0, 10);

    return {
      clientesComPontos: clientesComPontos.length,
      totalPontosDistribuidos,
      mediaPontos,
      distribuicaoNiveis,
      topClientes
    };
  }, [clientes]);

  // =====================================
  // FUNÇÕES
  // =====================================
  const getNivelCliente = (pontos: number) => {
    let nivelAtual = NIVEIS_FIDELIDADE[0];
    for (const nivel of NIVEIS_FIDELIDADE) {
      if (pontos >= nivel.pontosMin) {
        nivelAtual = nivel;
      }
    }
    return nivelAtual;
  };

  const getProximoNivel = (pontos: number) => {
    for (const nivel of NIVEIS_FIDELIDADE) {
      if (nivel.pontosMin > pontos) {
        return nivel;
      }
    }
    return null;
  };

  const handleAdicionarPontos = async () => {
    if (!clienteSelecionado || pontosParaAdicionar <= 0) return;

    const novosPontos = (clienteSelecionado.pontosFidelidade || 0) + pontosParaAdicionar;
    
    onUpdateCliente(clienteSelecionado.id, {
      pontosFidelidade: novosPontos,
      historicoPontos: [
        ...(clienteSelecionado.historicoPontos || []),
        {
          data: new Date().toISOString(),
          pontos: pontosParaAdicionar,
          tipo: 'credito',
          motivo: motivoPontos || 'Adição manual'
        }
      ]
    });

    setShowAdicionarPontosDialog(false);
    setPontosParaAdicionar(0);
    setMotivoPontos('');
    setClienteSelecionado(null);
  };

  const handleResgatarRecompensa = async () => {
    if (!clienteSelecionado || !recompensaSelecionada) return;

    const pontosAtuais = clienteSelecionado.pontosFidelidade || 0;
    if (pontosAtuais < recompensaSelecionada.pontos) {
      alert('Pontos insuficientes!');
      return;
    }

    const novosPontos = pontosAtuais - recompensaSelecionada.pontos;

    onUpdateCliente(clienteSelecionado.id, {
      pontosFidelidade: novosPontos,
      historicoPontos: [
        ...(clienteSelecionado.historicoPontos || []),
        {
          data: new Date().toISOString(),
          pontos: -recompensaSelecionada.pontos,
          tipo: 'debito',
          motivo: `Resgate: ${recompensaSelecionada.nome}`
        }
      ]
    });

    setShowResgateDialog(false);
    setRecompensaSelecionada(null);
    setClienteSelecionado(null);
  };

  // =====================================
  // RENDER
  // =====================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Gift className="w-6 h-6 text-purple-600" />
            Programa de Fidelidade
          </h2>
          <p className="text-muted-foreground">
            Gerencie pontos e recompensas para seus clientes
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <Users className="w-6 h-6 text-purple-600 mb-2" />
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
              {estatisticas.clientesComPontos}
            </p>
            <p className="text-sm text-muted-foreground">Clientes com Pontos</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800">
          <CardContent className="p-4">
            <Star className="w-6 h-6 text-yellow-600 mb-2" />
            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
              {estatisticas.totalPontosDistribuidos.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">Total de Pontos</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <TrendingUp className="w-6 h-6 text-green-600 mb-2" />
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">
              {estatisticas.mediaPontos.toFixed(1)}
            </p>
            <p className="text-sm text-muted-foreground">Média por Cliente</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <Crown className="w-6 h-6 text-blue-600 mb-2" />
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              {estatisticas.distribuicaoNiveis.filter(n => n.nivel === 'VIP' || n.nivel === 'Diamante').reduce((acc, n) => acc + n.count, 0)}
            </p>
            <p className="text-sm text-muted-foreground">Clientes VIP/Diamante</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="clientes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="niveis">Níveis</TabsTrigger>
          <TabsTrigger value="recompensas">Recompensas</TabsTrigger>
          <TabsTrigger value="config">Configurações</TabsTrigger>
        </TabsList>

        {/* Tab Clientes */}
        <TabsContent value="clientes">
          <Card>
            <CardHeader>
              <CardTitle>Top Clientes por Pontos</CardTitle>
              <CardDescription>Clientes com mais pontos acumulados</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {estatisticas.topClientes.map((cliente, index) => {
                    const nivel = getNivelCliente(cliente.pontosFidelidade || 0);
                    const proximoNivel = getProximoNivel(cliente.pontosFidelidade || 0);
                    const progressProximoNivel = proximoNivel
                      ? ((cliente.pontosFidelidade || 0) / proximoNivel.pontosMin) * 100
                      : 100;

                    return (
                      <div
                        key={cliente.id}
                        className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => setClienteSelecionado(cliente)}
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{cliente.nome}</span>
                            <span className="text-lg">{nivel.icone}</span>
                            <Badge variant="outline" style={{ borderColor: nivel.cor, color: nivel.cor }}>
                              {nivel.nivel}
                            </Badge>
                          </div>
                          {proximoNivel && (
                            <div className="mt-1">
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{cliente.pontosFidelidade || 0} pontos</span>
                                <span>Próximo: {proximoNivel.nivel} ({proximoNivel.pontosMin} pts)</span>
                              </div>
                              <Progress value={progressProximoNivel} className="h-1.5 mt-1" />
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-purple-600">{cliente.pontosFidelidade || 0}</p>
                          <p className="text-xs text-muted-foreground">pontos</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    );
                  })}
                  {estatisticas.topClientes.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Nenhum cliente com pontos ainda</p>
                      <p className="text-sm">Os pontos serão acumulados automaticamente a cada atendimento</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Níveis */}
        <TabsContent value="niveis">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {NIVEIS_FIDELIDADE.map((nivel, index) => {
              const clientesNivel = estatisticas.distribuicaoNiveis[index]?.count || 0;
              return (
                <Card key={nivel.nivel} className="relative overflow-hidden">
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ backgroundColor: nivel.cor }}
                  />
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-2xl">{nivel.icone}</span>
                        {nivel.nivel}
                      </CardTitle>
                      <Badge variant="secondary">{nivel.desconto}% desc.</Badge>
                    </div>
                    <CardDescription>
                      A partir de {nivel.pontosMin} pontos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Clientes</span>
                      <span className="text-2xl font-bold">{clientesNivel}</span>
                    </div>
                    <Progress
                      value={clientes.length > 0 ? (clientesNivel / clientes.length) * 100 : 0}
                      className="h-2 mt-2"
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Tab Recompensas */}
        <TabsContent value="recompensas">
          <Card>
            <CardHeader>
              <CardTitle>Recompensas Disponíveis</CardTitle>
              <CardDescription>Os clientes podem resgatar essas recompensas com seus pontos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {RECOMPENSAS.map(recompensa => (
                  <Card key={recompensa.id} className="border-purple-200 dark:border-purple-800">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{recompensa.nome}</h4>
                          <p className="text-sm text-muted-foreground">
                            {recompensa.tipo === 'desconto' && `Desconto de R$${recompensa.valor}`}
                            {recompensa.tipo === 'servico' && `Até R$${recompensa.valor}`}
                            {recompensa.tipo === 'pacote' && `Valor até R$${recompensa.valor}`}
                          </p>
                        </div>
                        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                          {recompensa.pontos} pts
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Configurações */}
        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Programa</CardTitle>
              <CardDescription>Configure como os pontos são ganhos e usados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    Regras de Pontuação
                  </h4>
                  <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Pontos por R$1 gasto</span>
                      <Badge variant="secondary">1 ponto</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Bônus primeira visita</span>
                      <Badge variant="secondary">10 pontos</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Bônus indicação</span>
                      <Badge variant="secondary">20 pontos</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Pontos expiram em</span>
                      <Badge variant="secondary">12 meses</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Award className="w-4 h-4 text-yellow-600" />
                    Benefícios por Nível
                  </h4>
                  <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                    {NIVEIS_FIDELIDADE.map(nivel => (
                      <div key={nivel.nivel} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span>{nivel.icone}</span>
                          <span className="text-sm">{nivel.nivel}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{nivel.desconto}% desconto</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Dica:</strong> Os pontos são acumulados automaticamente quando um cliente finaliza um atendimento.
                  Para cada R$1 gasto, o cliente ganha 1 ponto. Quanto mais pontos, maior o nível e maiores os descontos!
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Detalhes do Cliente */}
      <Dialog open={!!clienteSelecionado} onOpenChange={() => setClienteSelecionado(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {clienteSelecionado && (
                <>
                  <span>{getNivelCliente(clienteSelecionado.pontosFidelidade || 0).icone}</span>
                  {clienteSelecionado.nome}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Detalhes do programa de fidelidade
            </DialogDescription>
          </DialogHeader>

          {clienteSelecionado && (
            <div className="space-y-4">
              <div className="text-center py-4 bg-muted/30 rounded-lg">
                <p className="text-4xl font-bold text-purple-600">
                  {clienteSelecionado.pontosFidelidade || 0}
                </p>
                <p className="text-sm text-muted-foreground">pontos disponíveis</p>
                <Badge
                  className="mt-2"
                  style={{
                    backgroundColor: getNivelCliente(clienteSelecionado.pontosFidelidade || 0).cor + '20',
                    color: getNivelCliente(clienteSelecionado.pontosFidelidade || 0).cor
                  }}
                >
                  Nível {getNivelCliente(clienteSelecionado.pontosFidelidade || 0).nivel}
                </Badge>
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={() => setShowAdicionarPontosDialog(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Pontos
                </Button>
                <Button
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                  onClick={() => setShowResgateDialog(true)}
                  disabled={(clienteSelecionado.pontosFidelidade || 0) < 50}
                >
                  <Gift className="w-4 h-4 mr-2" />
                  Resgatar
                </Button>
              </div>

              {/* Histórico */}
              {clienteSelecionado.historicoPontos && clienteSelecionado.historicoPontos.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <History className="w-4 h-4" />
                    Histórico
                  </h4>
                  <ScrollArea className="h-[150px]">
                    <div className="space-y-2">
                      {clienteSelecionado.historicoPontos.slice(-10).reverse().map((h: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                          <div>
                            <p>{h.motivo}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(h.data), 'dd/MM/yyyy HH:mm')}
                            </p>
                          </div>
                          <span className={cn(
                            "font-medium",
                            h.tipo === 'credito' ? 'text-green-600' : 'text-red-600'
                          )}>
                            {h.tipo === 'credito' ? '+' : '-'}{Math.abs(h.pontos)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Adicionar Pontos */}
      <Dialog open={showAdicionarPontosDialog} onOpenChange={setShowAdicionarPontosDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Pontos</DialogTitle>
            <DialogDescription>
              Adicione pontos manualmente para {clienteSelecionado?.nome}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Pontos</Label>
              <Input
                type="number"
                value={pontosParaAdicionar || ''}
                onChange={(e) => setPontosParaAdicionar(parseInt(e.target.value) || 0)}
                placeholder="Quantidade de pontos"
              />
            </div>
            <div>
              <Label>Motivo (opcional)</Label>
              <Input
                value={motivoPontos}
                onChange={(e) => setMotivoPontos(e.target.value)}
                placeholder="Ex: Promoção especial, compensação..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdicionarPontosDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAdicionarPontos} disabled={pontosParaAdicionar <= 0}>
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Resgatar Recompensa */}
      <Dialog open={showResgateDialog} onOpenChange={setShowResgateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resgatar Recompensa</DialogTitle>
            <DialogDescription>
              Escolha uma recompensa para {clienteSelecionado?.nome}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {RECOMPENSAS.filter(r => r.pontos <= (clienteSelecionado?.pontosFidelidade || 0)).map(recompensa => (
              <div
                key={recompensa.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
                  recompensaSelecionada?.id === recompensa.id
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                    : "hover:bg-muted/50"
                )}
                onClick={() => setRecompensaSelecionada(recompensa)}
              >
                <div>
                  <p className="font-medium">{recompensa.nome}</p>
                  <p className="text-sm text-muted-foreground">
                    {recompensa.pontos} pontos
                  </p>
                </div>
                {recompensaSelecionada?.id === recompensa.id && (
                  <Check className="w-5 h-5 text-purple-600" />
                )}
              </div>
            ))}
            {RECOMPENSAS.filter(r => r.pontos <= (clienteSelecionado?.pontosFidelidade || 0)).length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                Pontos insuficientes para resgatar recompensas
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResgateDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleResgatarRecompensa}
              disabled={!recompensaSelecionada}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Resgatar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
