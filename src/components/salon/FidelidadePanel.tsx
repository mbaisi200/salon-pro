'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Gift, Star, Award, Sparkles, TrendingUp, Users, Crown,
  Check, X, Plus, Trash2, Edit, History, ChevronRight,
  Heart, Zap, Target, Diamond, Medal, Trophy
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
// NÍVEIS DE FIDELIDADE - Visual e Atrativo
// =====================================
const NIVEIS_FIDELIDADE = [
  { 
    nivel: 'Bronze', 
    pontosMin: 0, 
    cor: '#CD7F32', 
    corBg: 'from-amber-600 to-amber-800',
    icone: Medal, 
    iconeEmoji: '🥉', 
    desconto: 0,
    beneficios: ['Acúmulo de pontos', 'Newsletter exclusivo']
  },
  { 
    nivel: 'Prata', 
    pontosMin: 100, 
    cor: '#C0C0C0', 
    corBg: 'from-gray-400 to-gray-600',
    icone: Award, 
    iconeEmoji: '🥈', 
    desconto: 5,
    beneficios: ['5% de desconto', 'Prioridade no agendamento']
  },
  { 
    nivel: 'Ouro', 
    pontosMin: 300, 
    cor: '#FFD700', 
    corBg: 'from-yellow-400 to-yellow-600',
    icone: Crown, 
    iconeEmoji: '🥇', 
    desconto: 10,
    beneficios: ['10% de desconto', 'Brinde no aniversário', 'Acesso antecipado a promoções']
  },
  { 
    nivel: 'Diamante', 
    pontosMin: 600, 
    cor: '#B9F2FF', 
    corBg: 'from-cyan-400 to-blue-600',
    icone: Diamond, 
    iconeEmoji: '💎', 
    desconto: 15,
    beneficios: ['15% de desconto', 'Serviço grátis/mês', 'Atendimento VIP']
  },
  { 
    nivel: 'VIP Elite', 
    pontosMin: 1000, 
    cor: '#9B59B6', 
    corBg: 'from-purple-500 to-pink-600',
    icone: Trophy, 
    iconeEmoji: '👑', 
    desconto: 20,
    beneficios: ['20% de desconto', 'Serviços exclusivos', 'Consulta gratuita', 'Presentes mensais']
  },
];

const RECOMPENSAS = [
  { id: 'desconto10', nome: 'Desconto de R$10', descricao: 'Válido para qualquer serviço', pontos: 50, tipo: 'desconto', valor: 10, icone: '💰' },
  { id: 'desconto25', nome: 'Desconto de R$25', descricao: 'Válido para serviços acima de R$50', pontos: 100, tipo: 'desconto', valor: 25, icone: '🎁' },
  { id: 'desconto50', nome: 'Desconto de R$50', descricao: 'Válido para serviços acima de R$100', pontos: 180, tipo: 'desconto', valor: 50, icone: '🎉' },
  { id: 'servico_gratis', nome: 'Serviço Grátis', descricao: 'Até R$80 em qualquer serviço', pontos: 300, tipo: 'servico', valor: 80, icone: '✨' },
  { id: 'pacote_especial', nome: 'Pacote Premium', descricao: 'Day spa completo', pontos: 500, tipo: 'pacote', valor: 150, icone: '🌟' },
  { id: 'mes_gratis', nome: 'Mês VIP', descricao: '10 serviços grátis no mês', pontos: 1000, tipo: 'vip', valor: 500, icone: '👑' },
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
  const [planosPersonalizados, setPlanosPersonalizados] = useState<any[]>([]);
  const [showNovoPlanoDialog, setShowNovoPlanoDialog] = useState(false);
  const [editingPlano, setEditingPlano] = useState<any>(null);
  const [novoPlano, setNovoPlano] = useState({
    nome: '',
    descricao: '',
    pontos: 0,
    tipo: 'desconto' as 'desconto' | 'servico' | 'pacote' | 'vip',
    valor: 0,
    icone: '🎁'
  });

  // =====================================
  // CÁLCULOS
  // =====================================
  const estatisticas = useMemo(() => {
    const clientesComPontos = clientes.filter(c => (c.pontosFidelidade || 0) > 0);
    const totalPontosDistribuidos = clientes.reduce((acc, c) => acc + (c.pontosFidelidade || 0), 0);
    const mediaPontos = clientes.length > 0 ? totalPontosDistribuidos / clientes.length : 0;

    // Distribuição por nível
    const distribuicaoNiveis = NIVEIS_FIDELIDADE.map((nivel, index) => {
      const proximoNivel = NIVEIS_FIDELIDADE[index + 1];
      const count = clientes.filter(c => {
        const pontos = c.pontosFidelidade || 0;
        return pontos >= nivel.pontosMin && (!proximoNivel || pontos < proximoNivel.pontosMin);
      }).length;
      return { ...nivel, count };
    });

    // Top clientes
    const topClientes = [...clientes]
      .sort((a, b) => (b.pontosFidelidade || 0) - (a.pontosFidelidade || 0))
      .slice(0, 10);

    // Pontos ganhos no mês
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const pontosMes = agendamentos
      .filter(a => new Date(a.data) >= inicioMes && a.status === 'Concluido')
      .reduce((acc, a) => acc + Math.floor(a.valor || 0), 0);

    return {
      clientesComPontos: clientesComPontos.length,
      totalClientes: clientes.length,
      totalPontosDistribuidos,
      mediaPontos,
      distribuicaoNiveis,
      topClientes,
      pontosMes
    };
  }, [clientes, agendamentos]);

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
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white">
              <Gift className="w-6 h-6" />
            </div>
            Programa de Fidelidade
          </h2>
          <p className="text-muted-foreground mt-1">
            Recompense seus clientes e aumente a fidelização
          </p>
        </div>
      </div>

      {/* KPIs Visuais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent" />
          <CardContent className="p-4 relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                {estatisticas.totalClientes > 0 ? ((estatisticas.clientesComPontos / estatisticas.totalClientes) * 100).toFixed(0) : 0}% ativos
              </Badge>
            </div>
            <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {estatisticas.clientesComPontos}
            </p>
            <p className="text-sm text-muted-foreground">Clientes com Pontos</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-yellow-500/5 to-transparent" />
          <CardContent className="p-4 relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
            </div>
            <p className="text-3xl font-bold text-yellow-600">
              {estatisticas.totalPontosDistribuidos.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">Total de Pontos</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent" />
          <CardContent className="p-4 relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-green-600">
              {estatisticas.pontosMes.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">Pontos este Mês</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-cyan-500/5 to-transparent" />
          <CardContent className="p-4 relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
                <Crown className="w-5 h-5 text-cyan-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-cyan-600">
              {estatisticas.distribuicaoNiveis.filter(n => n.nivel === 'VIP Elite' || n.nivel === 'Diamante').reduce((acc, n) => acc + n.count, 0)}
            </p>
            <p className="text-sm text-muted-foreground">Clientes VIP/Diamante</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="clientes" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 h-auto">
          <TabsTrigger value="clientes" className="flex items-center gap-2 py-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Clientes</span>
          </TabsTrigger>
          <TabsTrigger value="niveis" className="flex items-center gap-2 py-2">
            <Award className="w-4 h-4" />
            <span className="hidden sm:inline">Níveis</span>
          </TabsTrigger>
          <TabsTrigger value="recompensas" className="flex items-center gap-2 py-2">
            <Gift className="w-4 h-4" />
            <span className="hidden sm:inline">Recompensas</span>
          </TabsTrigger>
          <TabsTrigger value="planos" className="flex items-center gap-2 py-2">
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Meus Planos</span>
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2 py-2">
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">Como Funciona</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab Clientes */}
        <TabsContent value="clientes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Top Clientes Fidelidade
              </CardTitle>
              <CardDescription>Seus clientes mais engajados no programa</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[450px]">
                <div className="space-y-3">
                  {estatisticas.topClientes.map((cliente, index) => {
                    const nivel = getNivelCliente(cliente.pontosFidelidade || 0);
                    const proximoNivel = getProximoNivel(cliente.pontosFidelidade || 0);
                    const IconeNivel = nivel.icone;
                    const pontosParaProximo = proximoNivel ? proximoNivel.pontosMin - (cliente.pontosFidelidade || 0) : 0;
                    const progressProximoNivel = proximoNivel
                      ? (((cliente.pontosFidelidade || 0) - nivel.pontosMin) / (proximoNivel.pontosMin - nivel.pontosMin)) * 100
                      : 100;

                    return (
                      <div
                        key={cliente.id}
                        className="flex items-center gap-4 p-4 bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl hover:from-muted/70 hover:to-muted/50 transition-all cursor-pointer border border-transparent hover:border-primary/20"
                        onClick={() => setClienteSelecionado(cliente)}
                      >
                        {/* Posição */}
                        <div className={cn(
                          "flex items-center justify-center w-12 h-12 rounded-xl font-bold text-lg",
                          index === 0 ? "bg-gradient-to-br from-yellow-400 to-amber-600 text-white shadow-lg shadow-yellow-500/30" :
                          index === 1 ? "bg-gradient-to-br from-gray-300 to-gray-500 text-white" :
                          index === 2 ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white" : 
                          "bg-muted text-muted-foreground"
                        )}>
                          {index + 1}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold truncate">{cliente.nome}</span>
                            <Badge 
                              className={cn("bg-gradient-to-r text-white border-0", nivel.corBg)}
                            >
                              <IconeNivel className="w-3 h-3 mr-1" />
                              {nivel.nivel}
                            </Badge>
                            {nivel.desconto > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {nivel.desconto}% off
                              </Badge>
                            )}
                          </div>
                          
                          {proximoNivel && (
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{pontosParaProximo} pts para {proximoNivel.nivel}</span>
                                <span className="flex items-center gap-1">
                                  <span className="text-lg">{proximoNivel.iconeEmoji}</span>
                                </span>
                              </div>
                              <Progress value={progressProximoNivel} className="h-1.5" />
                            </div>
                          )}
                        </div>

                        {/* Pontos */}
                        <div className="text-right">
                          <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            {cliente.pontosFidelidade || 0}
                          </p>
                          <p className="text-xs text-muted-foreground">pontos</p>
                        </div>

                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    );
                  })}
                  {estatisticas.topClientes.length === 0 && (
                    <div className="text-center py-12">
                      <div className="p-4 rounded-full bg-muted w-20 h-20 mx-auto flex items-center justify-center mb-4">
                        <Gift className="w-10 h-10 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground font-medium">Nenhum cliente com pontos ainda</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Os pontos são acumulados automaticamente a cada atendimento
                      </p>
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
              const IconeNivel = nivel.icone;
              const clientesNivel = estatisticas.distribuicaoNiveis[index]?.count || 0;
              
              return (
                <Card key={nivel.nivel} className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
                  {/* Background gradient */}
                  <div className={cn("absolute inset-0 opacity-10 bg-gradient-to-br", nivel.corBg)} />
                  
                  {/* Top indicator */}
                  <div className={cn("absolute top-0 left-0 right-0 h-1 bg-gradient-to-r", nivel.corBg)} />
                  
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-3 rounded-xl bg-gradient-to-br text-white shadow-lg", nivel.corBg)}>
                          <IconeNivel className="w-6 h-6" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{nivel.nivel}</CardTitle>
                          <CardDescription>
                            A partir de {nivel.pontosMin} pontos
                          </CardDescription>
                        </div>
                      </div>
                      <span className="text-3xl">{nivel.iconeEmoji}</span>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Desconto */}
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm font-medium">Desconto</span>
                      <span className={cn(
                        "text-xl font-bold",
                        nivel.desconto > 0 ? "text-green-600" : "text-muted-foreground"
                      )}>
                        {nivel.desconto > 0 ? `${nivel.desconto}%` : '—'}
                      </span>
                    </div>

                    {/* Benefícios */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">BENEFÍCIOS</p>
                      <ul className="space-y-1.5">
                        {nivel.beneficios.map((b, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <Check className="w-4 h-4 text-green-500" />
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Progress */}
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Clientes neste nível</span>
                        <span className="font-semibold">{clientesNivel}</span>
                      </div>
                      <Progress 
                        value={estatisticas.totalClientes > 0 ? (clientesNivel / estatisticas.totalClientes) * 100 : 0} 
                        className="h-2" 
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Tab Recompensas */}
        <TabsContent value="recompensas">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {RECOMPENSAS.map(recompensa => (
              <Card key={recompensa.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-purple-300 dark:hover:border-purple-700">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <span className="text-4xl">{recompensa.icone}</span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{recompensa.nome}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{recompensa.descricao}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 px-3 py-1">
                      <Star className="w-3 h-3 mr-1" />
                      {recompensa.pontos} pontos
                    </Badge>
                    <span className="text-sm font-semibold text-green-600">
                      Vale R$ {recompensa.valor}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab Planos Personalizados */}
        <TabsContent value="planos">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Planos Personalizados</h3>
                <p className="text-sm text-muted-foreground">Crie seus próprios planos de fidelidade</p>
              </div>
              <Button onClick={() => {
                setEditingPlano(null);
                setNovoPlano({ nome: '', descricao: '', pontos: 0, tipo: 'desconto', valor: 0, icone: '🎁' });
                setShowNovoPlanoDialog(true);
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Plano
              </Button>
            </div>

            {planosPersonalizados.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="p-4 rounded-full bg-muted w-20 h-20 mx-auto flex items-center justify-center mb-4">
                    <Sparkles className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-medium mb-2">Nenhum plano personalizado</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Crie planos exclusivos para recompensar seus clientes especiais
                  </p>
                  <Button onClick={() => {
                    setEditingPlano(null);
                    setNovoPlano({ nome: '', descricao: '', pontos: 0, tipo: 'desconto', valor: 0, icone: '🎁' });
                    setShowNovoPlanoDialog(true);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeiro Plano
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {planosPersonalizados.map((plano, index) => (
                  <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-purple-300 dark:hover:border-purple-700">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{plano.icone}</span>
                          <div>
                            <h4 className="font-semibold text-lg">{plano.nome}</h4>
                            <Badge variant="outline" className="mt-1 capitalize">{plano.tipo}</Badge>
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                            setEditingPlano(plano);
                            setNovoPlano({ ...plano });
                            setShowNovoPlanoDialog(true);
                          }}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => {
                            setPlanosPersonalizados(planosPersonalizados.filter((_, i) => i !== index));
                          }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">{plano.descricao}</p>
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="font-semibold">{plano.pontos} pontos</span>
                        </div>
                        <span className="text-sm font-medium text-green-600">
                          {plano.tipo === 'desconto' ? `R$ ${plano.valor} off` : `Vale R$ ${plano.valor}`}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab Configurações */}
        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Como Funciona o Programa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Regras */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2 text-lg">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    Regras de Pontuação
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl">
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        <span className="font-medium">Por R$1 gasto</span>
                      </div>
                      <Badge className="bg-green-600">1 ponto</Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl">
                      <div className="flex items-center gap-3">
                        <UserPlus className="w-5 h-5 text-blue-600" />
                        <span className="font-medium">Primeira visita</span>
                      </div>
                      <Badge className="bg-blue-600">10 pontos</Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Heart className="w-5 h-5 text-purple-600" />
                        <span className="font-medium">Indicação de amigo</span>
                      </div>
                      <Badge className="bg-purple-600">20 pontos</Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Gift className="w-5 h-5 text-orange-600" />
                        <span className="font-medium">Aniversário</span>
                      </div>
                      <Badge className="bg-orange-600">50 pontos</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2 text-lg">
                    <Award className="w-5 h-5 text-yellow-500" />
                    Benefícios por Nível
                  </h4>
                  <div className="space-y-2">
                    {NIVEIS_FIDELIDADE.map(nivel => {
                      const IconeNivel = nivel.icone;
                      return (
                        <div 
                          key={nivel.nivel}
                          className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <IconeNivel className="w-5 h-5" style={{ color: nivel.cor }} />
                            <span className="font-medium">{nivel.nivel}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {nivel.desconto > 0 ? `${nivel.desconto}% desconto` : 'Sem desconto'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Dica */}
              <div className="p-6 bg-gradient-to-r from-purple-100 via-pink-100 to-orange-100 dark:from-purple-900/30 dark:via-pink-900/30 dark:to-orange-900/30 rounded-xl border-2 border-purple-200 dark:border-purple-800">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-white dark:bg-gray-800 shadow-lg">
                    <Lightbulb className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">💡 Dica Pro</h4>
                    <p className="text-muted-foreground">
                      Os pontos são acumulados automaticamente quando um cliente finaliza um atendimento no PDV. 
                      Para cada R$1 gasto, o cliente ganha 1 ponto. Quanto mais pontos, maior o nível e melhores os descontos!
                      Mostre para seus clientes que eles podem economizar e ganhar benefícios exclusivos.
                    </p>
                  </div>
                </div>
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
                  <span className="text-2xl">{getNivelCliente(clienteSelecionado.pontosFidelidade || 0).iconeEmoji}</span>
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
              {/* Pontos */}
              <div className="text-center py-6 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-orange-900/20 rounded-xl">
                <p className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {clienteSelecionado.pontosFidelidade || 0}
                </p>
                <p className="text-sm text-muted-foreground mt-1">pontos disponíveis</p>
                <Badge
                  className="mt-3 text-white border-0"
                  style={{ background: `linear-gradient(to right, ${getNivelCliente(clienteSelecionado.pontosFidelidade || 0).cor}, ${getNivelCliente(clienteSelecionado.pontosFidelidade || 0).cor}dd)` }}
                >
                  Nível {getNivelCliente(clienteSelecionado.pontosFidelidade || 0).nivel}
                </Badge>
              </div>

              {/* Ações */}
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
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
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
                    Histórico Recente
                  </h4>
                  <ScrollArea className="h-[150px]">
                    <div className="space-y-2">
                      {clienteSelecionado.historicoPontos.slice(-10).reverse().map((h: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded-lg">
                          <div>
                            <p>{h.motivo}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(h.data), 'dd/MM/yyyy HH:mm')}
                            </p>
                          </div>
                          <span className={cn(
                            "font-semibold",
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

      {/* Dialog Novo/Editar Plano Personalizado */}
      <Dialog open={showNovoPlanoDialog} onOpenChange={setShowNovoPlanoDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPlano ? 'Editar Plano' : 'Novo Plano Personalizado'}</DialogTitle>
            <DialogDescription>
              Crie um plano exclusivo para seus clientes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Ícone</Label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {['🎁', '💎', '⭐', '🌟', '✨', '👑', '💫', '🎉', '🏆', '💝', '🎀', '🌈'].map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    className={cn(
                      "w-10 h-10 text-xl rounded-lg border-2 transition-all",
                      novoPlano.icone === emoji ? "border-purple-500 bg-purple-50" : "border-muted hover:border-purple-300"
                    )}
                    onClick={() => setNovoPlano({ ...novoPlano, icone: emoji })}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Nome do Plano</Label>
              <Input
                value={novoPlano.nome}
                onChange={(e) => setNovoPlano({ ...novoPlano, nome: e.target.value })}
                placeholder="Ex: Pacote VIP Mensal"
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Input
                value={novoPlano.descricao}
                onChange={(e) => setNovoPlano({ ...novoPlano, descricao: e.target.value })}
                placeholder="Ex: Inclui 5 serviços à escolha"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select value={novoPlano.tipo} onValueChange={(v: any) => setNovoPlano({ ...novoPlano, tipo: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desconto">Desconto</SelectItem>
                    <SelectItem value="servico">Serviço Grátis</SelectItem>
                    <SelectItem value="pacote">Pacote</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  value={novoPlano.valor || ''}
                  onChange={(e) => setNovoPlano({ ...novoPlano, valor: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <Label>Pontos necessários</Label>
              <Input
                type="number"
                value={novoPlano.pontos || ''}
                onChange={(e) => setNovoPlano({ ...novoPlano, pontos: parseInt(e.target.value) || 0 })}
                placeholder="100"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNovoPlanoDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!novoPlano.nome || novoPlano.pontos <= 0) {
                  alert('Preencha todos os campos obrigatórios');
                  return;
                }
                if (editingPlano) {
                  const index = planosPersonalizados.findIndex((p: any) => p === editingPlano);
                  const updated = [...planosPersonalizados];
                  updated[index] = { ...novoPlano };
                  setPlanosPersonalizados(updated);
                } else {
                  setPlanosPersonalizados([...planosPersonalizados, { ...novoPlano }]);
                }
                setShowNovoPlanoDialog(false);
              }}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {editingPlano ? 'Salvar' : 'Criar Plano'}
            </Button>
          </DialogFooter>
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
                className="text-lg"
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
                  "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                  recompensaSelecionada?.id === recompensa.id
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                    : "hover:border-purple-300 hover:bg-muted/50"
                )}
                onClick={() => setRecompensaSelecionada(recompensa)}
              >
                <span className="text-3xl">{recompensa.icone}</span>
                <div className="flex-1">
                  <p className="font-medium">{recompensa.nome}</p>
                  <p className="text-sm text-muted-foreground">{recompensa.descricao}</p>
                </div>
                <Badge className="bg-purple-100 text-purple-700">
                  {recompensa.pontos} pts
                </Badge>
                {recompensaSelecionada?.id === recompensa.id && (
                  <Check className="w-5 h-5 text-purple-600" />
                )}
              </div>
            ))}
            {RECOMPENSAS.filter(r => r.pontos <= (clienteSelecionado?.pontosFidelidade || 0)).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Pontos insuficientes para resgatar recompensas</p>
                <p className="text-sm mt-1">Continue acumulando pontos!</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResgateDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleResgatarRecompensa}
              disabled={!recompensaSelecionada}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              Resgatar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper component
function UserPlus({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  );
}

function Lightbulb({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}

function DollarSign({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
