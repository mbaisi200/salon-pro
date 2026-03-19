'use client';

import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, eachMonthOfInterval, eachDayOfInterval, startOfWeek, endOfWeek, subDays, parseISO, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  TrendingUp, TrendingDown, DollarSign, Users, Scissors, Calendar,
  BarChart3, PieChart as PieChartIcon, ArrowUpRight, ArrowDownRight,
  Target, Award, Clock, Star, AlertCircle, CheckCircle, XCircle,
  Filter, Download, FileText, RefreshCw, Eye
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, Legend, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart
} from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
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
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

// =====================================
// COMPONENTE PRINCIPAL
// =====================================
export default function BIDashboard({
  agendamentos,
  clientes,
  profissionais,
  servicos,
  financeiro
}: BIDashboardProps) {
  const [periodo, setPeriodo] = useState<'7dias' | '30dias' | '90dias' | '12meses' | 'ano'>('30dias');
  const [chartType, setChartType] = useState<'faturamento' | 'agendamentos' | 'clientes'>('faturamento');

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

  // =====================================
  // FILTRAR DADOS POR PERÍODO
  // =====================================
  const dadosFiltrados = useMemo(() => {
    const { inicio, fim } = periodoDates;

    const agendamentosPeriodo = agendamentos.filter(a => {
      const data = parseISO(a.data);
      return isWithinInterval(data, { start: inicio, end: fim });
    });

    const financeiroPeriodo = financeiro.filter(f => {
      const data = parseISO(f.data);
      return isWithinInterval(data, { start: inicio, end: fim });
    });

    const clientesPeriodo = clientes.filter(c => {
      const data = parseISO(c.createdAt);
      return isWithinInterval(data, { start: inicio, end: fim });
    });

    return { agendamentosPeriodo, financeiroPeriodo, clientesPeriodo };
  }, [agendamentos, financeiro, clientes, periodoDates]);

  // =====================================
  // KPIs PRINCIPAIS
  // =====================================
  const kpis = useMemo(() => {
    const { agendamentosPeriodo, financeiroPeriodo, clientesPeriodo } = dadosFiltrados;

    // Faturamento
    const faturamentoTotal = financeiroPeriodo
      .filter(f => f.tipo === 'entrada')
      .reduce((acc, f) => acc + (f.valor || 0), 0);

    const despesasTotal = financeiroPeriodo
      .filter(f => f.tipo === 'saida')
      .reduce((acc, f) => acc + (f.valor || 0), 0);

    const lucroLiquido = faturamentoTotal - despesasTotal;

    // Agendamentos
    const totalAgendamentos = agendamentosPeriodo.length;
    const agendamentosConcluidos = agendamentosPeriodo.filter(a => a.status === 'Concluido').length;
    const agendamentosCancelados = agendamentosPeriodo.filter(a => a.status === 'Cancelado').length;
    const taxaConversao = totalAgendamentos > 0 ? (agendamentosConcluidos / totalAgendamentos) * 100 : 0;

    // Ticket médio
    const ticketMedio = agendamentosConcluidos > 0 ? faturamentoTotal / agendamentosConcluidos : 0;

    // Novos clientes
    const novosClientes = clientesPeriodo.length;

    // Taxa de retorno
    const clientesQueRetornaram = agendamentosPeriodo.reduce((acc, a) => {
      const cliente = a.clienteNome;
      if (!acc[cliente]) acc[cliente] = 0;
      acc[cliente]++;
      return acc;
    }, {} as Record<string, number>);

    const clientesRetorno = Object.values(clientesQueRetornaram).filter(q => q > 1).length;
    const taxaRetorno = clientes.length > 0 ? (clientesRetorno / clientes.length) * 100 : 0;

    // Comparação com período anterior
    const periodoAnterior = {
      inicio: subDays(periodoDates.inicio, periodoDates.fim.getTime() - periodoDates.inicio.getTime()) as any,
      fim: periodoDates.inicio
    };

    const financeiroAnterior = financeiro.filter(f => {
      const data = parseISO(f.data);
      return isWithinInterval(data, { start: periodoAnterior.inicio, end: periodoAnterior.fim });
    });

    const faturamentoAnterior = financeiroAnterior
      .filter(f => f.tipo === 'entrada')
      .reduce((acc, f) => acc + (f.valor || 0), 0);

    const variacaoFaturamento = faturamentoAnterior > 0
      ? ((faturamentoTotal - faturamentoAnterior) / faturamentoAnterior) * 100
      : 0;

    return {
      faturamentoTotal,
      despesasTotal,
      lucroLiquido,
      totalAgendamentos,
      agendamentosConcluidos,
      agendamentosCancelados,
      taxaConversao,
      ticketMedio,
      novosClientes,
      taxaRetorno,
      variacaoFaturamento
    };
  }, [dadosFiltrados, financeiro, clientes, periodoDates]);

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
        faturamento: entradasDia,
        despesas: saidasDia,
        lucro: entradasDia - saidasDia,
        agendamentos: agendamentosDia
      };
    });

    // Top serviços
    const servicosCount = agendamentos
      .filter(a => a.status === 'Concluido')
      .reduce((acc, a) => {
        const servico = a.servico || 'Não informado';
        if (!acc[servico]) acc[servico] = { nome: servico, total: 0, valor: 0 };
        acc[servico].total++;
        acc[servico].valor += a.valor || 0;
        return acc;
      }, {} as Record<string, { nome: string; total: number; valor: number }>);

    const topServicos = Object.values(servicosCount)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    // Top profissionais
    const profissionaisCount = agendamentos
      .filter(a => a.status === 'Concluido')
      .reduce((acc, a) => {
        const prof = a.profissional || 'Não informado';
        if (!acc[prof]) acc[prof] = { nome: prof, total: 0, valor: 0, clientes: new Set() };
        acc[prof].total++;
        acc[prof].valor += a.valor || 0;
        if (a.clienteNome) acc[prof].clientes.add(a.clienteNome);
        return acc;
      }, {} as Record<string, { nome: string; total: number; valor: number; clientes: Set<string> }>);

    const topProfissionais = Object.values(profissionaisCount)
      .map(p => ({ ...p, clientesUnicos: p.clientes.size }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 8);

    // Faturamento por forma de pagamento
    const pagamentosCount = financeiro
      .filter(f => f.tipo === 'entrada' && f.formaPagamento)
      .reduce((acc, f) => {
        const forma = f.formaPagamento || 'Não informado';
        if (!acc[forma]) acc[forma] = { nome: forma, valor: 0 };
        acc[forma].valor += f.valor || 0;
        return acc;
      }, {} as Record<string, { nome: string; valor: number }>);

    const faturamentoPorForma = Object.values(pagamentosCount);

    // Faturamento mensal (para comparativo)
    const mesesAno = eachMonthOfInterval({ start: startOfYear(new Date()), end: new Date() });
    const faturamentoMensal = mesesAno.map(mes => {
      const inicioMes = startOfMonth(mes);
      const fimMes = endOfMonth(mes);
      const faturamentoMes = financeiro
        .filter(f => {
          const data = parseISO(f.data);
          return f.tipo === 'entrada' && isWithinInterval(data, { start: inicioMes, end: fimMes });
        })
        .reduce((acc, f) => acc + (f.valor || 0), 0);

      return {
        mes: format(mes, 'MMM', { locale: ptBR }),
        faturamento: faturamentoMes
      };
    });

    return {
      faturamentoDiario,
      topServicos,
      topProfissionais,
      faturamentoPorForma,
      faturamentoMensal
    };
  }, [agendamentos, financeiro, periodoDates]);

  // =====================================
  // ANÁLISES AVANÇADAS
  // =====================================
  const analises = useMemo(() => {
    // Melhor dia da semana
    const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const agendamentosPorDia = agendamentos
      .filter(a => a.status === 'Concluido')
      .reduce((acc, a) => {
        const dia = new Date(a.data).getDay();
        acc[dia]++;
        return acc;
      }, [0, 0, 0, 0, 0, 0, 0]);

    const melhorDia = diasSemana[agendamentosPorDia.indexOf(Math.max(...agendamentosPorDia))];

    // Melhor horário
    const horarios = agendamentos
      .filter(a => a.status === 'Concluido' && a.hora)
      .reduce((acc, a) => {
        const hora = a.hora.substring(0, 2);
        acc[hora] = (acc[hora] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const melhorHorario = Object.entries(horarios)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // Previsão de faturamento (média dos últimos 3 meses * 1.05)
    const ultimos3Meses = financeiro
      .filter(f => {
        const data = parseISO(f.data);
        const tresMesesAtras = subMonths(new Date(), 3);
        return f.tipo === 'entrada' && data >= tresMesesAtras;
      })
      .reduce((acc, f) => acc + (f.valor || 0), 0);

    const previsaoFaturamento = (ultimos3Meses / 3) * 1.05;

    // Ranking de clientes (mais frequentes)
    const clientesRanking = agendamentos
      .filter(a => a.status === 'Concluido')
      .reduce((acc, a) => {
        const cliente = a.clienteNome;
        if (!acc[cliente]) acc[cliente] = { nome: cliente, visitas: 0, total: 0 };
        acc[cliente].visitas++;
        acc[cliente].total += a.valor || 0;
        return acc;
      }, {} as Record<string, { nome: string; visitas: number; total: number }>);

    const topClientes = Object.values(clientesRanking)
      .sort((a, b) => b.visitas - a.visitas)
      .slice(0, 5);

    return {
      melhorDia,
      melhorHorario,
      previsaoFaturamento,
      topClientes,
      agendamentosPorDia: diasSemana.map((dia, i) => ({ dia, total: agendamentosPorDia[i] }))
    };
  }, [agendamentos, financeiro]);

  // =====================================
  // FORMATADORES
  // =====================================
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  // =====================================
  // RENDER
  // =====================================
  return (
    <div className="space-y-6">
      {/* Header com filtros */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Business Intelligence
          </h2>
          <p className="text-muted-foreground">
            Análises e métricas avançadas do seu negócio
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={periodo} onValueChange={(v) => setPeriodo(v as any)}>
            <SelectTrigger className="w-[150px]">
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
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <DollarSign className="w-5 h-5 text-green-600" />
              <Badge variant="secondary" className={cn(
                "text-xs",
                kpis.variacaoFaturamento >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              )}>
                {formatPercent(kpis.variacaoFaturamento)}
              </Badge>
            </div>
            <p className="text-2xl font-bold text-green-700 dark:text-green-400 mt-2">
              {formatCurrency(kpis.faturamentoTotal)}
            </p>
            <p className="text-xs text-muted-foreground">Faturamento</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400 mt-2">
              {formatCurrency(kpis.lucroLiquido)}
            </p>
            <p className="text-xs text-muted-foreground">Lucro Líquido</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-400 mt-2">
              {kpis.agendamentosConcluidos}
            </p>
            <p className="text-xs text-muted-foreground">Atendimentos</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Users className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-orange-700 dark:text-orange-400 mt-2">
              {kpis.novosClientes}
            </p>
            <p className="text-xs text-muted-foreground">Novos Clientes</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 border-cyan-200 dark:border-cyan-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Star className="w-5 h-5 text-cyan-600" />
            </div>
            <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-400 mt-2">
              {formatCurrency(kpis.ticketMedio)}
            </p>
            <p className="text-xs text-muted-foreground">Ticket Médio</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 border-pink-200 dark:border-pink-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Award className="w-5 h-5 text-pink-600" />
            </div>
            <p className="text-2xl font-bold text-pink-700 dark:text-pink-400 mt-2">
              {kpis.taxaConversao.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">Taxa Conversão</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos principais */}
      <Tabs defaultValue="faturamento" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="faturamento">Faturamento</TabsTrigger>
          <TabsTrigger value="servicos">Serviços</TabsTrigger>
          <TabsTrigger value="profissionais">Profissionais</TabsTrigger>
          <TabsTrigger value="analises">Análises</TabsTrigger>
        </TabsList>

        {/* Tab Faturamento */}
        <TabsContent value="faturamento" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Gráfico de Faturamento Diário */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Evolução do Faturamento</CardTitle>
                <CardDescription>Faturamento diário no período selecionado</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData.faturamentoDiario}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="data" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Legend />
                      <Bar dataKey="faturamento" name="Faturamento" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="lucro" name="Lucro" stroke="#3b82f6" strokeWidth={2} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Faturamento por forma de pagamento */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Formas de Pagamento</CardTitle>
                <CardDescription>Distribuição por método de pagamento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.faturamentoPorForma}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="valor"
                        nameKey="nome"
                        label={({ nome, percent }) => `${nome} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {chartData.faturamentoPorForma.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Faturamento mensal */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Faturamento Mensal</CardTitle>
                <CardDescription>Comparativo mensal este ano</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData.faturamentoMensal}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="mes" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Area type="monotone" dataKey="faturamento" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
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
                <CardTitle className="text-lg">Top Serviços Realizados</CardTitle>
                <CardDescription>Ranking dos serviços mais vendidos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.topServicos} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" className="text-xs" />
                      <YAxis type="category" dataKey="nome" className="text-xs" width={100} />
                      <Tooltip />
                      <Bar dataKey="total" name="Quantidade" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Faturamento por Serviço</CardTitle>
                <CardDescription>Valor total gerado por serviço</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.topServicos} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" className="text-xs" />
                      <YAxis type="category" dataKey="nome" className="text-xs" width={100} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Bar dataKey="valor" name="Faturamento" fill="#22c55e" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab Profissionais */}
        <TabsContent value="profissionais" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Desempenho por Profissional</CardTitle>
                <CardDescription>Comparativo de performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={chartData.topProfissionais.slice(0, 5).map(p => ({
                      nome: p.nome.split(' ')[0],
                      atendimentos: p.total,
                      faturamento: p.valor / 100,
                      clientes: p.clientesUnicos
                    }))}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="nome" className="text-xs" />
                      <PolarRadiusAxis />
                      <Radar name="Atendimentos" dataKey="atendimentos" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} />
                      <Radar name="Clientes Únicos" dataKey="clientes" stroke="#22c55e" fill="#22c55e" fillOpacity={0.5} />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ranking de Faturamento</CardTitle>
                <CardDescription>Profissionais por valor gerado</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {chartData.topProfissionais.map((prof, index) => (
                      <div key={prof.nome} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center font-bold text-white",
                          index === 0 ? "bg-yellow-500" :
                          index === 1 ? "bg-gray-400" :
                          index === 2 ? "bg-orange-600" : "bg-blue-500"
                        )}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{prof.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {prof.total} atendimentos • {prof.clientesUnicos} clientes
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">{formatCurrency(prof.valor)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab Análises */}
        <TabsContent value="analises" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Melhor dia e horário */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Otimização de Agenda
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">Melhor dia da semana</p>
                  <p className="text-xl font-bold text-blue-600">{analises.melhorDia}</p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">Melhor horário</p>
                  <p className="text-xl font-bold text-green-600">{analises.melhorHorario}h</p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">Previsão próximo mês</p>
                  <p className="text-xl font-bold text-purple-600">{formatCurrency(analises.previsaoFaturamento)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Agendamentos por dia da semana */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Agendamentos por Dia</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analises.agendamentosPorDia}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="dia" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Bar dataKey="total" name="Agendamentos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Clientes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Clientes VIP
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {analises.topClientes.map((cliente, index) => (
                      <div key={cliente.nome} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-800 flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </span>
                          <span className="font-medium text-sm">{cliente.nome}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">{cliente.visitas} visitas</p>
                          <p className="text-sm font-bold text-green-600">{formatCurrency(cliente.total)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Indicadores de Saúde */}
            <Card className="md:col-span-2 lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-lg">Indicadores de Saúde do Negócio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Taxa de Conversão</p>
                    <Progress value={kpis.taxaConversao} className="h-2 mb-2" />
                    <p className="text-2xl font-bold">{kpis.taxaConversao.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">
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
                    <Progress value={kpis.totalAgendamentos > 0 ? (kpis.agendamentosCancelados / kpis.totalAgendamentos) * 100 : 0} className="h-2 mb-2" />
                    <p className="text-2xl font-bold">{kpis.totalAgendamentos > 0 ? ((kpis.agendamentosCancelados / kpis.totalAgendamentos) * 100).toFixed(1) : 0}%</p>
                    <p className="text-xs text-muted-foreground">
                      {kpis.totalAgendamentos > 0 && (kpis.agendamentosCancelados / kpis.totalAgendamentos) * 100 <= 10 ? (
                        <span className="text-green-600 flex items-center justify-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Excelente
                        </span>
                      ) : kpis.totalAgendamentos > 0 && (kpis.agendamentosCancelados / kpis.totalAgendamentos) * 100 <= 20 ? (
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
                    <Progress value={kpis.taxaRetorno} className="h-2 mb-2" />
                    <p className="text-2xl font-bold">{kpis.taxaRetorno.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">
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
                    <Progress value={kpis.faturamentoTotal > 0 ? (kpis.lucroLiquido / kpis.faturamentoTotal) * 100 : 0} className="h-2 mb-2" />
                    <p className="text-2xl font-bold">{kpis.faturamentoTotal > 0 ? ((kpis.lucroLiquido / kpis.faturamentoTotal) * 100).toFixed(1) : 0}%</p>
                    <p className="text-xs text-muted-foreground">
                      {kpis.faturamentoTotal > 0 && (kpis.lucroLiquido / kpis.faturamentoTotal) * 100 >= 30 ? (
                        <span className="text-green-600 flex items-center justify-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Excelente
                        </span>
                      ) : kpis.faturamentoTotal > 0 && (kpis.lucroLiquido / kpis.faturamentoTotal) * 100 >= 15 ? (
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
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
