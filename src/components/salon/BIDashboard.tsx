'use client';

import { useState, useMemo, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, eachMonthOfInterval, eachDayOfInterval, subDays, parseISO, isWithinInterval, startOfWeek, endOfWeek, addDays, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  TrendingUp, TrendingDown, DollarSign, Users, Scissors, Calendar,
  BarChart3, ArrowUpRight, ArrowDownRight, Target, Award, Clock,
  Star, AlertCircle, CheckCircle, XCircle, Filter, Download,
  RefreshCw, Eye, ChevronRight, Sparkles, Zap, Activity, PieChart as PieChartIcon,
  LineChart as LineChartIcon, BarChart as BarChartIcon, FileText, Printer,
  Bell, Lightbulb, Rocket, Heart, Gift, Percent
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, Legend, ComposedChart,
  RadialBarChart, RadialBar, Treemap
} from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

// =====================================
// INTERFACES
// =====================================
interface BIDashboardProps {
  agendamentos: any[];
  clientes: any[];
  profissionais: any[];
  servicos: any[];
  financeiro: any[];
  tenant?: any;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];
const GRADIENTS = [
  'from-blue-500 to-blue-600',
  'from-green-500 to-green-600',
  'from-purple-500 to-purple-600',
  'from-orange-500 to-orange-600',
  'from-pink-500 to-pink-600',
  'from-cyan-500 to-cyan-600'
];

// =====================================
// COMPONENTE PRINCIPAL
// =====================================
export default function BIDashboard({
  agendamentos,
  clientes,
  profissionais,
  servicos,
  financeiro,
  tenant
}: BIDashboardProps) {
  const [periodo, setPeriodo] = useState<'7dias' | '30dias' | '90dias' | '12meses' | 'ano'>('30dias');
  const [animateCards, setAnimateCards] = useState(false);

  useEffect(() => {
    setAnimateCards(true);
  }, [periodo]);

  // =====================================
  // CÁLCULOS DE PERÍODO
  // =====================================
  const periodoDates = useMemo(() => {
    const hoje = new Date();
    let inicio: Date;
    let fim = hoje;

    switch (periodo) {
      case '7dias':
        inicio = subDays(hoje, 7);
        break;
      case '30dias':
        inicio = subDays(hoje, 30);
        break;
      case '90dias':
        inicio = subDays(hoje, 90);
        break;
      case '12meses':
        inicio = subMonths(hoje, 12);
        break;
      case 'ano':
        inicio = startOfYear(hoje);
        break;
      default:
        inicio = subDays(hoje, 30);
    }

    return { inicio, fim };
  }, [periodo]);

  // Período anterior para comparação
  const periodoAnteriorDates = useMemo(() => {
    const diasDiff = differenceInDays(periodoDates.fim, periodoDates.inicio);
    return {
      inicio: subDays(periodoDates.inicio, diasDiff + 1),
      fim: subDays(periodoDates.inicio, 1)
    };
  }, [periodoDates]);

  // =====================================
  // FILTRAR DADOS POR PERÍODO
  // =====================================
  const dadosFiltrados = useMemo(() => {
    const { inicio, fim } = periodoDates;
    const { inicio: inicioAnt, fim: fimAnt } = periodoAnteriorDates;

    const filtrarPorPeriodo = (data: string, start: Date, end: Date) => {
      try {
        const d = parseISO(data);
        return isWithinInterval(d, { start, end });
      } catch {
        return false;
      }
    };

    // Período atual
    const agendamentosPeriodo = agendamentos.filter(a => filtrarPorPeriodo(a.data, inicio, fim));
    const financeiroPeriodo = financeiro.filter(f => filtrarPorPeriodo(f.data, inicio, fim));
    const clientesNovos = clientes.filter(c => filtrarPorPeriodo(c.createdAt, inicio, fim));

    // Período anterior
    const financeiroAnterior = financeiro.filter(f => filtrarPorPeriodo(f.data, inicioAnt, fimAnt));
    const agendamentosAnterior = agendamentos.filter(a => filtrarPorPeriodo(a.data, inicioAnt, fimAnt));

    return { 
      agendamentosPeriodo, 
      financeiroPeriodo, 
      clientesNovos,
      financeiroAnterior,
      agendamentosAnterior 
    };
  }, [agendamentos, financeiro, clientes, periodoDates, periodoAnteriorDates]);

  // =====================================
  // KPIs PRINCIPAIS
  // =====================================
  const kpis = useMemo(() => {
    const { agendamentosPeriodo, financeiroPeriodo, clientesNovos, financeiroAnterior, agendamentosAnterior } = dadosFiltrados;

    // Faturamento
    const faturamentoTotal = financeiroPeriodo
      .filter(f => f.tipo === 'entrada')
      .reduce((acc, f) => acc + (f.valor || 0), 0);

    const faturamentoAnterior = financeiroAnterior
      .filter(f => f.tipo === 'entrada')
      .reduce((acc, f) => acc + (f.valor || 0), 0);

    const despesasTotal = financeiroPeriodo
      .filter(f => f.tipo === 'saida')
      .reduce((acc, f) => acc + (f.valor || 0), 0);

    const lucroLiquido = faturamentoTotal - despesasTotal;
    const margemLucro = faturamentoTotal > 0 ? (lucroLiquido / faturamentoTotal) * 100 : 0;

    // Variações
    const variacaoFaturamento = faturamentoAnterior > 0 
      ? ((faturamentoTotal - faturamentoAnterior) / faturamentoAnterior) * 100 
      : 0;

    // Agendamentos
    const totalAgendamentos = agendamentosPeriodo.length;
    const agendamentosConcluidos = agendamentosPeriodo.filter(a => a.status === 'Concluido').length;
    const agendamentosCancelados = agendamentosPeriodo.filter(a => a.status === 'Cancelado').length;
    const totalAgendamentosAnt = agendamentosAnterior.length;

    const taxaConversao = totalAgendamentos > 0 ? (agendamentosConcluidos / totalAgendamentos) * 100 : 0;
    const taxaCancelamento = totalAgendamentos > 0 ? (agendamentosCancelados / totalAgendamentos) * 100 : 0;

    const variacaoAtendimentos = totalAgendamentosAnt > 0 
      ? ((totalAgendamentos - totalAgendamentosAnt) / totalAgendamentosAnt) * 100 
      : 0;

    // Ticket médio
    const ticketMedio = agendamentosConcluidos > 0 ? faturamentoTotal / agendamentosConcluidos : 0;

    // Clientes
    const clientesAtivos = agendamentosPeriodo
      .filter(a => a.status === 'Concluido')
      .reduce((acc, a) => {
        acc.add(a.clienteNome);
        return acc;
      }, new Set()).size;

    // Taxa de retorno
    const visitasPorCliente = agendamentosPeriodo
      .filter(a => a.status === 'Concluido')
      .reduce((acc, a) => {
        acc[a.clienteNome] = (acc[a.clienteNome] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const clientesRetorno = Object.values(visitasPorCliente).filter(v => v > 1).length;
    const taxaRetorno = clientesAtivos > 0 ? (clientesRetorno / clientesAtivos) * 100 : 0;

    // Previsão
    const mediaDiaria = faturamentoTotal / differenceInDays(periodoDates.fim, periodoDates.inicio);
    const diasRestantes = differenceInDays(endOfMonth(new Date()), new Date());
    const previsaoFimMes = faturamentoTotal + (mediaDiaria * diasRestantes);

    return {
      faturamentoTotal,
      despesasTotal,
      lucroLiquido,
      margemLucro,
      totalAgendamentos,
      agendamentosConcluidos,
      agendamentosCancelados,
      taxaConversao,
      taxaCancelamento,
      ticketMedio,
      novosClientes: clientesNovos.length,
      clientesAtivos,
      taxaRetorno,
      variacaoFaturamento,
      variacaoAtendimentos,
      previsaoFimMes,
      mediaDiaria
    };
  }, [dadosFiltrados, periodoDates]);

  // =====================================
  // DADOS PARA GRÁFICOS
  // =====================================
  const chartData = useMemo(() => {
    const { inicio, fim } = periodoDates;
    const dias = eachDayOfInterval({ start: inicio, end: fim });

    // Faturamento diário
    const faturamentoDiario = dias.map(dia => {
      const dataStr = format(dia, 'yyyy-MM-dd');
      const entradasDia = financeiro
        .filter(f => f.data === dataStr && f.tipo === 'entrada')
        .reduce((acc, f) => acc + (f.valor || 0), 0);
      const saidasDia = financeiro
        .filter(f => f.data === dataStr && f.tipo === 'saida')
        .reduce((acc, f) => acc + (f.valor || 0), 0);
      const agendamentosDia = agendamentos.filter(a => a.data === dataStr && a.status === 'Concluido').length;

      return {
        data: format(dia, 'dd/MM'),
        dataFull: dataStr,
        diaSemana: format(dia, 'EEE', { locale: ptBR }),
        faturamento: entradasDia,
        despesas: saidasDia,
        lucro: entradasDia - saidasDia,
        atendimentos: agendamentosDia,
        acumulado: 0
      };
    });

    // Calcular acumulado
    let acum = 0;
    faturamentoDiario.forEach(d => {
      acum += d.faturamento;
      d.acumulado = acum;
    });

    // Top serviços
    const servicosCount = agendamentos
      .filter(a => a.status === 'Concluido')
      .reduce((acc, a) => {
        const servico = a.servico || 'Não informado';
        if (!acc[servico]) acc[servico] = { nome: servico, total: 0, valor: 0, count: 0 };
        acc[servico].total++;
        acc[servico].valor += a.valor || 0;
        acc[servico].count++;
        return acc;
      }, {} as Record<string, { nome: string; total: number; valor: number; count: number }>);

    const topServicos = Object.values(servicosCount)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    // Top profissionais
    const profissionaisData = agendamentos
      .filter(a => a.status === 'Concluido')
      .reduce((acc, a) => {
        const prof = a.profissional || 'Não informado';
        if (!acc[prof]) acc[prof] = { nome: prof, total: 0, valor: 0, clientes: new Set(), servicos: 0 };
        acc[prof].total++;
        acc[prof].valor += a.valor || 0;
        acc[prof].servicos++;
        if (a.clienteNome) acc[prof].clientes.add(a.clienteNome);
        return acc;
      }, {} as Record<string, { nome: string; total: number; valor: number; clientes: Set<string>; servicos: number }>);

    const topProfissionais = Object.values(profissionaisData)
      .map(p => ({ 
        nome: p.nome, 
        atendimentos: p.total, 
        valor: p.valor, 
        clientesUnicos: p.clientes.size,
        ticketMedio: p.total > 0 ? p.valor / p.total : 0
      }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 8);

    // Faturamento por forma de pagamento
    const pagamentosData = financeiro
      .filter(f => f.tipo === 'entrada' && f.formaPagamento)
      .reduce((acc, f) => {
        const forma = f.formaPagamento || 'Não informado';
        if (!acc[forma]) acc[forma] = { nome: forma, valor: 0, count: 0 };
        acc[forma].valor += f.valor || 0;
        acc[forma].count++;
        return acc;
      }, {} as Record<string, { nome: string; valor: number; count: number }>);

    const faturamentoPorForma = Object.values(pagamentosData).sort((a, b) => b.valor - a.valor);

    // Horários mais movimentados
    const horariosData = agendamentos
      .filter(a => a.status === 'Concluido' && a.hora)
      .reduce((acc, a) => {
        const hora = parseInt(a.hora.substring(0, 2));
        const faixa = hora < 10 ? 'Manhã Cedo' : hora < 12 ? 'Manhã' : hora < 14 ? 'Almoço' : hora < 17 ? 'Tarde' : 'Noite';
        acc[faixa] = (acc[faixa] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const horariosMovimentados = Object.entries(horariosData)
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => b.total - a.total);

    // Dias da semana
    const diasSemanaData = agendamentos
      .filter(a => a.status === 'Concluido')
      .reduce((acc, a) => {
        const dia = format(parseISO(a.data), 'EEE', { locale: ptBR });
        acc[dia] = (acc[dia] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const diasSemana = Object.entries(diasSemanaData)
      .map(([dia, total]) => ({ dia, total }));

    // Faturamento mensal
    const mesesAno = eachMonthOfInterval({ start: startOfYear(new Date()), end: new Date() });
    const faturamentoMensal = mesesAno.map(mes => {
      const inicioMes = startOfMonth(mes);
      const fimMes = endOfMonth(mes);
      const fatMes = financeiro
        .filter(f => {
          const data = parseISO(f.data);
          return f.tipo === 'entrada' && isWithinInterval(data, { start: inicioMes, end: fimMes });
        })
        .reduce((acc, f) => acc + (f.valor || 0), 0);

      const despesaMes = financeiro
        .filter(f => {
          const data = parseISO(f.data);
          return f.tipo === 'saida' && isWithinInterval(data, { start: inicioMes, end: fimMes });
        })
        .reduce((acc, f) => acc + (f.valor || 0), 0);

      return {
        mes: format(mes, 'MMM', { locale: ptBR }),
        mesFull: format(mes, 'MMMM', { locale: ptBR }),
        faturamento: fatMes,
        despesas: despesaMes,
        lucro: fatMes - despesaMes
      };
    });

    return {
      faturamentoDiario,
      topServicos,
      topProfissionais,
      faturamentoPorForma,
      horariosMovimentados,
      diasSemana,
      faturamentoMensal
    };
  }, [agendamentos, financeiro, periodoDates]);

  // =====================================
  // ALERTAS E INSIGHTS
  // =====================================
  const insights = useMemo(() => {
    const lista = [];

    // Taxa de cancelamento alta
    if (kpis.taxaCancelamento > 15) {
      lista.push({
        tipo: 'alerta',
        icone: AlertCircle,
        titulo: 'Taxa de Cancelamento Alta',
        descricao: `${kpis.taxaCancelamento.toFixed(1)}% dos agendamentos foram cancelados. Considere enviar lembretes por WhatsApp.`,
        cor: 'text-orange-500',
        bg: 'bg-orange-50 dark:bg-orange-900/20'
      });
    }

    // Crescimento positivo
    if (kpis.variacaoFaturamento > 10) {
      lista.push({
        tipo: 'sucesso',
        icone: Rocket,
        titulo: 'Crescimento Expressivo!',
        descricao: `Faturamento ${kpis.variacaoFaturamento.toFixed(0)}% maior que o período anterior. Continue assim!`,
        cor: 'text-green-500',
        bg: 'bg-green-50 dark:bg-green-900/20'
      });
    }

    // Ticket médio
    if (kpis.ticketMedio > 0) {
      lista.push({
        tipo: 'info',
        icone: Lightbulb,
        titulo: 'Dica: Aumente o Ticket Médio',
        descricao: `Ticket médio atual: R$ ${kpis.ticketMedio.toFixed(2)}. Ofereça combos e pacotes para aumentar.`,
        cor: 'text-blue-500',
        bg: 'bg-blue-50 dark:bg-blue-900/20'
      });
    }

    // Taxa de retorno baixa
    if (kpis.taxaRetorno < 30 && kpis.clientesAtivos > 5) {
      lista.push({
        tipo: 'alerta',
        icone: Heart,
        titulo: 'Reengaje seus Clientes',
        descricao: `Apenas ${kpis.taxaRetorno.toFixed(0)}% dos clientes retornaram. Use o programa de fidelidade!`,
        cor: 'text-pink-500',
        bg: 'bg-pink-50 dark:bg-pink-900/20'
      });
    }

    // Margem de lucro
    if (kpis.margemLucro < 20 && kpis.faturamentoTotal > 0) {
      lista.push({
        tipo: 'alerta',
        icone: TrendingDown,
        titulo: 'Atenção à Margem',
        descricao: `Margem de ${kpis.margemLucro.toFixed(0)}%. Revise seus custos e preços dos serviços.`,
        cor: 'text-red-500',
        bg: 'bg-red-50 dark:bg-red-900/20'
      });
    }

    // Meta de faturamento
    lista.push({
      tipo: 'info',
      icone: Target,
      titulo: 'Previsão do Mês',
      descricao: `Estimativa de fechamento: R$ ${kpis.previsaoFimMes.toFixed(0)}`,
      cor: 'text-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-900/20'
    });

    return lista;
  }, [kpis]);

  // =====================================
  // FORMATADORES
  // =====================================
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatPercent = (value: number) => {
    const prefix = value >= 0 ? '+' : '';
    return `${prefix}${value.toFixed(1)}%`;
  };

  // =====================================
  // RENDER
  // =====================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              <BarChart3 className="w-5 h-5" />
            </div>
            Business Intelligence
          </h2>
          <p className="text-muted-foreground mt-1">
            Análises e insights inteligentes do seu negócio
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={periodo} onValueChange={(v) => setPeriodo(v as any)}>
            <SelectTrigger className="w-[160px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7dias">Últimos 7 dias</SelectItem>
              <SelectItem value="30dias">Últimos 30 dias</SelectItem>
              <SelectItem value="90dias">Últimos 90 dias</SelectItem>
              <SelectItem value="12meses">Últimos 12 meses</SelectItem>
              <SelectItem value="ano">Este ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs Cards */}
      <div className={cn(
        "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 transition-all duration-500",
        animateCards ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}>
        {/* Faturamento */}
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/10" />
          <CardContent className="p-4 relative">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <Badge variant="secondary" className={cn(
                "text-xs font-medium",
                kpis.variacaoFaturamento >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              )}>
                {kpis.variacaoFaturamento >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                {formatPercent(kpis.variacaoFaturamento)}
              </Badge>
            </div>
            <p className="text-2xl font-bold text-green-700">
              {formatCurrency(kpis.faturamentoTotal)}
            </p>
            <p className="text-xs text-muted-foreground">Faturamento</p>
          </CardContent>
        </Card>

        {/* Lucro */}
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/10" />
          <CardContent className="p-4 relative">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-5 h-5 text-blue-600" />
              <Badge variant="outline" className="text-xs">
                {kpis.margemLucro.toFixed(0)}% margem
              </Badge>
            </div>
            <p className="text-2xl font-bold text-blue-700">
              {formatCurrency(kpis.lucroLiquido)}
            </p>
            <p className="text-xs text-muted-foreground">Lucro Líquido</p>
          </CardContent>
        </Card>

        {/* Atendimentos */}
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/10" />
          <CardContent className="p-4 relative">
            <div className="flex items-center justify-between mb-2">
              <Scissors className="w-5 h-5 text-purple-600" />
              <Badge variant="secondary" className={cn(
                "text-xs font-medium",
                kpis.variacaoAtendimentos >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              )}>
                {formatPercent(kpis.variacaoAtendimentos)}
              </Badge>
            </div>
            <p className="text-2xl font-bold text-purple-700">
              {kpis.agendamentosConcluidos}
            </p>
            <p className="text-xs text-muted-foreground">Atendimentos</p>
          </CardContent>
        </Card>

        {/* Novos Clientes */}
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-orange-600/10" />
          <CardContent className="p-4 relative">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-orange-600" />
              <UserPlus className="w-4 h-4 text-orange-400" />
            </div>
            <p className="text-2xl font-bold text-orange-700">
              {kpis.novosClientes}
            </p>
            <p className="text-xs text-muted-foreground">Novos Clientes</p>
          </CardContent>
        </Card>

        {/* Ticket Médio */}
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-cyan-600/10" />
          <CardContent className="p-4 relative">
            <div className="flex items-center justify-between mb-2">
              <Star className="w-5 h-5 text-cyan-600" />
              <Percent className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-bold text-cyan-700">
              {formatCurrency(kpis.ticketMedio)}
            </p>
            <p className="text-xs text-muted-foreground">Ticket Médio</p>
          </CardContent>
        </Card>

        {/* Taxa de Conversão */}
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-pink-600/10" />
          <CardContent className="p-4 relative">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-5 h-5 text-pink-600" />
            </div>
            <p className="text-2xl font-bold text-pink-700">
              {kpis.taxaConversao.toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground">Taxa Conversão</p>
          </CardContent>
        </Card>
      </div>

      {/* Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {insights.slice(0, 3).map((insight, i) => (
          <div key={i} className={cn("p-4 rounded-lg border flex items-start gap-3", insight.bg)}>
            <insight.icone className={cn("w-5 h-5 mt-0.5", insight.cor)} />
            <div>
              <p className="font-medium text-sm">{insight.titulo}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{insight.descricao}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos principais */}
      <Tabs defaultValue="faturamento" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="faturamento" className="flex items-center gap-2 py-2">
            <LineChartIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Faturamento</span>
          </TabsTrigger>
          <TabsTrigger value="servicos" className="flex items-center gap-2 py-2">
            <Scissors className="w-4 h-4" />
            <span className="hidden sm:inline">Serviços</span>
          </TabsTrigger>
          <TabsTrigger value="equipe" className="flex items-center gap-2 py-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Equipe</span>
          </TabsTrigger>
          <TabsTrigger value="clientes" className="flex items-center gap-2 py-2">
            <Heart className="w-4 h-4" />
            <span className="hidden sm:inline">Clientes</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab Faturamento */}
        <TabsContent value="faturamento" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Evolução do Faturamento */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-600" />
                  Evolução do Faturamento
                </CardTitle>
                <CardDescription>Faturamento diário e acumulado no período</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData.faturamentoDiario}>
                      <defs>
                        <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorAcumulado" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="data" className="text-xs" />
                      <YAxis yAxisId="left" className="text-xs" />
                      <YAxis yAxisId="right" orientation="right" className="text-xs" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Legend />
                      <Area yAxisId="right" type="monotone" dataKey="acumulado" name="Acumulado" stroke="#3b82f6" fill="url(#colorAcumulado)" />
                      <Bar yAxisId="left" dataKey="faturamento" name="Diário" fill="url(#colorFaturamento)" radius={[4, 4, 0, 0]} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Formas de Pagamento */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-purple-600" />
                  Formas de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.faturamentoPorForma}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="valor"
                        nameKey="nome"
                      >
                        {chartData.faturamentoPorForma.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Faturamento Mensal */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChartIcon className="w-5 h-5 text-blue-600" />
                  Comparativo Mensal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData.faturamentoMensal}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="mes" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Area type="monotone" dataKey="faturamento" name="Faturamento" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                      <Area type="monotone" dataKey="lucro" name="Lucro" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab Serviços */}
        <TabsContent value="servicos" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChartIcon className="w-5 h-5 text-purple-600" />
                  Serviços Mais Vendidos
                </CardTitle>
                <CardDescription>Ranking por quantidade de atendimentos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.topServicos} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" className="text-xs" />
                      <YAxis type="category" dataKey="nome" className="text-xs" width={120} />
                      <Tooltip />
                      <Bar dataKey="total" name="Quantidade" radius={[0, 4, 4, 0]}>
                        {chartData.topServicos.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Faturamento por Serviço
                </CardTitle>
                <CardDescription>Valor total gerado por serviço</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.topServicos} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" className="text-xs" />
                      <YAxis type="category" dataKey="nome" className="text-xs" width={120} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Bar dataKey="valor" name="Faturamento" fill="#22c55e" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab Equipe */}
        <TabsContent value="equipe" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-600" />
                  Ranking da Equipe
                </CardTitle>
                <CardDescription>Desempenho por profissional</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[350px]">
                  <div className="space-y-3">
                    {chartData.topProfissionais.map((prof, index) => (
                      <div key={prof.nome} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm",
                          index === 0 ? "bg-gradient-to-br from-yellow-400 to-yellow-600" :
                          index === 1 ? "bg-gradient-to-br from-gray-300 to-gray-500" :
                          index === 2 ? "bg-gradient-to-br from-orange-400 to-orange-600" : 
                          "bg-gradient-to-br from-blue-400 to-blue-600"
                        )}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{prof.nome}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{prof.atendimentos} atend.</span>
                            <span>{prof.clientesUnicos} clientes</span>
                          </div>
                          <Progress 
                            value={chartData.topProfissionais.length > 0 ? (prof.valor / chartData.topProfissionais[0].valor) * 100 : 0} 
                            className="h-1.5 mt-2" 
                          />
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">{formatCurrency(prof.valor)}</p>
                          <p className="text-xs text-muted-foreground">Ticket: {formatCurrency(prof.ticketMedio)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Horários de Pico
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.horariosMovimentados}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="nome" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Bar dataKey="total" name="Atendimentos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab Clientes */}
        <TabsContent value="clientes" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Indicadores de Saúde */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-600" />
                  Saúde do Negócio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Taxa de Conversão</p>
                    <Progress value={kpis.taxaConversao} className="h-3 mb-2" />
                    <p className="text-2xl font-bold">{kpis.taxaConversao.toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {kpis.taxaConversao >= 70 ? (
                        <span className="text-green-600 flex items-center justify-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Excelente
                        </span>
                      ) : kpis.taxaConversao >= 50 ? (
                        <span className="text-yellow-600 flex items-center justify-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Bom
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center justify-center gap-1">
                          <XCircle className="w-3 h-3" /> Atenção
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Taxa de Cancelamento</p>
                    <Progress value={100 - kpis.taxaCancelamento} className="h-3 mb-2" />
                    <p className="text-2xl font-bold">{kpis.taxaCancelamento.toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {kpis.taxaCancelamento <= 10 ? (
                        <span className="text-green-600 flex items-center justify-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Excelente
                        </span>
                      ) : kpis.taxaCancelamento <= 20 ? (
                        <span className="text-yellow-600 flex items-center justify-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Aceitável
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center justify-center gap-1">
                          <XCircle className="w-3 h-3" /> Crítico
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Taxa de Retorno</p>
                    <Progress value={kpis.taxaRetorno} className="h-3 mb-2" />
                    <p className="text-2xl font-bold">{kpis.taxaRetorno.toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {kpis.taxaRetorno >= 40 ? (
                        <span className="text-green-600 flex items-center justify-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Excelente
                        </span>
                      ) : kpis.taxaRetorno >= 25 ? (
                        <span className="text-yellow-600 flex items-center justify-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Bom
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center justify-center gap-1">
                          <XCircle className="w-3 h-3" /> Atenção
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Margem de Lucro</p>
                    <Progress value={kpis.margemLucro} className="h-3 mb-2" />
                    <p className="text-2xl font-bold">{kpis.margemLucro.toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {kpis.margemLucro >= 30 ? (
                        <span className="text-green-600 flex items-center justify-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Excelente
                        </span>
                      ) : kpis.margemLucro >= 15 ? (
                        <span className="text-yellow-600 flex items-center justify-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Bom
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center justify-center gap-1">
                          <XCircle className="w-3 h-3" /> Atenção
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dias da Semana */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  Melhores Dias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.diasSemana}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="dia" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Bar dataKey="total" name="Atendimentos" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// UserPlus icon component
function UserPlus({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  );
}
