'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { format, addDays, isBefore, isAfter, startOfDay, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { doc, getDoc, collection, addDoc, getDocs, updateDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { 
  Calendar, User, Scissors, Check, Phone, MapPin, AlertCircle, ChevronLeft, 
  ChevronRight, Eye, EyeOff, LogIn, LogOut, Settings, Clock, Users, Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Servico {
  id: string;
  nome: string;
  preco: number;
  duracao: number;
}

interface Profissional {
  id: string;
  nome: string;
  status: string;
  loginEmail?: string;
  servicosHabilitados?: string[];
  disponibilidade?: {
    diasBloqueados?: string[];
    horariosPorDia?: Record<string, { ativo: boolean; horarios: string[] }>;
  };
}

interface HorariosConfig {
  ativo: boolean;
  horarios: string[];
}

interface TenantConfig {
  nome: string;
  telefone?: string;
  whatsapp?: string;
  endereco?: string;
  cidade?: string;
  agendamentoOnline?: {
    ativo: boolean;
    permiteCancelamento: boolean;
    antecedenciaMinimaHoras: number;
    horariosPorDia: Record<string, HorariosConfig>;
    vagasProfissional?: number;
    vagasSalao?: number;
  };
}

export default function AgendamentoPage() {
  const params = useParams();
  const tenantId = params.tenantId as string;
  const db = getFirebaseDb();

  const [loading, setLoading] = useState(true);
  const [tenant, setTenant] = useState<TenantConfig | null>(null);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [agendamentosExistentes, setAgendamentosExistentes] = useState<any[]>([]);

  const [step, setStep] = useState(1);
  const [dataSelecionada, setDataSelecionada] = useState<Date | null>(null);
  const [horarioSelecionado, setHorarioSelecionado] = useState<string | null>(null);
  const [servicoSelecionado, setServicoSelecionado] = useState<Servico | null>(null);
  const [profissionalSelecionado, setProfissionalSelecionado] = useState<Profissional | null>(null);
  const [nomeCliente, setNomeCliente] = useState('');
  const [telefoneCliente, setTelefoneCliente] = useState('');
  const [emailCliente, setEmailCliente] = useState('');
  const [agendamentoConfirmado, setAgendamentoConfirmado] = useState(false);

  const [showProfLogin, setShowProfLogin] = useState(false);
  const [profLoginEmail, setProfLoginEmail] = useState('');
  const [profLoginSenha, setProfLoginSenha] = useState('');
  const [profSession, setProfSession] = useState<Profissional | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [blockedHours, setBlockedHours] = useState<Record<string, string[]>>({});
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [savingChanges, setSavingChanges] = useState(false);

  const loadData = useCallback(async () => {
    if (!db || !tenantId) return;

    try {
      const tenantDoc = await getDoc(doc(db, 'saloes', tenantId));
      if (tenantDoc.exists()) {
        const data = tenantDoc.data() as TenantConfig;
        setTenant(data);

        // Fallback: se não tiver config, assume ativo=true com padrões
        const config = data.agendamentoOnline;
        if (!config || config.ativo !== true) {
          // Se não tem config ou não está ativo, mas permite testar mesmo assim
          setTenant({
            ...data,
            agendamentoOnline: {
              ativo: true,
              permiteCancelamento: true,
              antecedenciaMinimaHoras: 2,
              vagasSalao: 999,
              horariosPorDia: {
                '0': { ativo: true, horarios: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'] },
                '1': { ativo: true, horarios: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'] },
                '2': { ativo: true, horarios: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'] },
                '3': { ativo: true, horarios: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'] },
                '4': { ativo: true, horarios: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'] },
                '5': { ativo: true, horarios: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'] },
                '6': { ativo: true, horarios: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'] },
              }
            }
          });
        }
      } else {
        // Tenant não existe - cria com config padrão
        setTenant({
          nome: 'Salão',
          telefone: '',
          agendamentoOnline: {
            ativo: true,
            permiteCancelamento: true,
            antecedenciaMinimaHoras: 2,
            vagasSalao: 999,
            horariosPorDia: {
              '0': { ativo: true, horarios: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'] },
              '1': { ativo: true, horarios: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'] },
              '2': { ativo: true, horarios: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'] },
              '3': { ativo: true, horarios: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'] },
              '4': { ativo: true, horarios: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'] },
              '5': { ativo: true, horarios: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'] },
              '6': { ativo: true, horarios: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'] },
            }
          }
        });
      }

      const [servicosSnap, profissionaisSnap, agendamentosSnap] = await Promise.all([
        getDocs(collection(db, 'saloes', tenantId, 'servicos')),
        getDocs(collection(db, 'saloes', tenantId, 'profissionais')),
        getDocs(collection(db, 'saloes', tenantId, 'agendamentos')),
      ]);

      setServicos(servicosSnap.docs.map(d => ({ id: d.id, ...d.data() } as Servico)));
      setProfissionais(profissionaisSnap.docs
        .filter(d => d.data().status === 'ativo')
        .map(d => ({ id: d.id, ...d.data() } as Profissional))
      );
      setAgendamentosExistentes(agendamentosSnap.docs.map(d => d.data()));
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }, [tenantId, db]);

  useEffect(() => {
    loadData();
    const saved = localStorage.getItem('profAgendarSession');
    if (saved) {
      const session = JSON.parse(saved);
      setProfSession(session);
      if (session.disponibilidade?.diasBloqueados) {
        setBlockedDates(session.disponibilidade.diasBloqueados);
      }
    }
  }, [loadData]);

  const config = tenant?.agendamentoOnline;

  const handleProfLogin = () => {
    const found = profissionais.find(p => 
      p.loginEmail?.toLowerCase() === profLoginEmail.toLowerCase()
    );
    if (found) {
      if (!found.acessoAtivo) {
        alert('Seu acesso foi bloqueado pelo administrador. Entre em contato.');
        return;
      }
      setProfSession(found);
      localStorage.setItem('profAgendarSession', JSON.stringify(found));
      setShowProfLogin(false);
      if (found.disponibilidade?.diasBloqueados) {
        setBlockedDates(found.disponibilidade.diasBloqueados);
      }
    } else {
      alert('Profissional não encontrado');
    }
  };

  const handleProfLogout = () => {
    localStorage.removeItem('profAgendarSession');
    setProfSession(null);
    setEditMode(false);
    setBlockedDates([]);
    setBlockedHours({});
  };

  const toggleDateBlock = (dateStr: string) => {
    setBlockedDates(prev => 
      prev.includes(dateStr) 
        ? prev.filter(d => d !== dateStr)
        : [...prev, dateStr]
    );
  };

  const toggleHourBlock = (dateStr: string, hour: string) => {
    setBlockedHours(prev => {
      const current = prev[dateStr] || [];
      return {
        ...prev,
        [dateStr]: current.includes(hour)
          ? current.filter(h => h !== hour)
          : [...current, hour]
      };
    });
  };

  const saveChanges = async () => {
    if (!db || !profSession) return;
    setSavingChanges(true);
    
    try {
      const snapshot = await getDocs(collection(db, 'saloes', tenantId, 'profissionais'));
      const docRef = snapshot.docs.find(d => d.data().loginEmail === profSession.loginEmail);
      
      if (docRef) {
        const updated = {
          ...profSession,
          disponibilidade: {
            ...profSession.disponibilidade,
            diasBloqueados: blockedDates,
          }
        };
        await updateDoc(docRef.ref, {
          'disponibilidade.diasBloqueados': blockedDates,
        });
        setProfSession(updated);
        localStorage.setItem('profAgendarSession', JSON.stringify(updated));
      }
      setEditMode(false);
    } catch (err) {
      console.error('Erro ao salvar:', err);
    }
    setSavingChanges(false);
  };

  const getDiasDisponiveis = () => {
    if (!config?.horariosPorDia) return [];
    const dias: Date[] = [];
    const hoje = startOfDay(new Date());
    
    const minDate = addDays(hoje, 1);
    const maxDate = addDays(hoje, 60);

    let dataAtual = minDate;
    while (isBefore(dataAtual, maxDate) || format(dataAtual, 'yyyy-MM-dd') === format(maxDate, 'yyyy-MM-dd')) {
      const diaSemana = format(dataAtual, 'e');
      const diaConfig = config.horariosPorDia[diaSemana];

      if (diaConfig?.ativo) {
        if (profSession?.disponibilidade?.diasBloqueados?.includes(format(dataAtual, 'yyyy-MM-dd'))) {
          dataAtual = addDays(dataAtual, 1);
          continue;
        }
        dias.push(new Date(dataAtual));
      }

      dataAtual = addDays(dataAtual, 1);
    }

    return dias.slice(0, 14);
  };

  const getHorariosDisponiveis = () => {
    if (!dataSelecionada || !config?.horariosPorDia || !servicoSelecionado) return [];
    
    const diaSemana = format(dataSelecionada, 'e');
    const diaConfig = config.horariosPorDia[diaSemana];
    
    if (!diaConfig?.ativo || diaConfig.horarios.length === 0) return [];

    let horariosBase = diaConfig.horarios;
    
    if (profSession?.disponibilidade?.horariosPorDia?.[diaSemana]) {
      const dispProf = profSession.disponibilidade.horariosPorDia[diaSemana];
      if (dispProf.ativo && dispProf.horarios.length > 0) {
        horariosBase = dispProf.horarios;
      } else if (!dispProf.ativo) {
        return [];
      }
    }

    const dateStr = format(dataSelecionada, 'yyyy-MM-dd');
    const blockedHoras = blockedHours[dateStr] || [];

    const duracaoServico = servicoSelecionado.duracao || 30;
    const dataFormatada = format(dataSelecionada, 'yyyy-MM-dd');
    const vagasProf = config.vagasProfissional || 1;
    const vagasSalao = config.vagasSalao || 999;

    const agendamentosPorHorario = agendamentosExistentes
      .filter(a => 
        a.data === dataFormatada && 
        (a.status === 'Pendente' || a.status === 'Confirmado')
      )
      .map(a => {
        const [h, m] = a.hora.split(':').map(Number);
        return { hora: a.hora, minutos: h * 60 + m, duracao: a.duracao || 30 };
      });

    const horariosDisponiveis = horariosBase
      .filter(h => !blockedHoras.includes(h))
      .map((horarioStr) => {
        const [h, m] = horarioStr.split(':').map(Number);
        const horarioEmMinutos = h * 60 + m;
        const fimServico = horarioEmMinutos + duracaoServico;

        const agendNoHorario = agendamentosPorHorario.filter(a => {
          const inicio = a.minutos;
          const fim = a.minutos + a.duracao;
          return (horarioEmMinutos >= inicio && horarioEmMinutos < fim) ||
                 (fimServico > inicio && fimServico <= fim) ||
                 (horarioEmMinutos <= inicio && fimServico >= fim);
        });

        const agendProf = agendNoHorario.filter(a => 
          profissionalSelecionado && agendamentosExistentes.some(ex => 
            ex.hora === a.hora && 
            ex.profissionalId === profissionalSelecionado.id &&
            ex.data === dataFormatada
          )
        );

        const lotadoProf = agendProf.length >= vagasProf;
        const lotadoSalao = agendamentosPorHorario.length >= vagasSalao;

        return {
          horario: horarioStr,
          lotadoProf,
          lotadoSalao,
          lotado: lotadoProf || lotadoSalao,
        };
      });

    return horariosDisponiveis;
  };

  const getHorariosProfMes = () => {
    if (!config?.horariosPorDia) return [];
    
    const monthDays = eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth),
    });

    return monthDays.map(dia => {
      const diaSemana = format(dia, 'e');
      const diaConfig = config.horariosPorDia[diaSemana];
      const dateStr = format(dia, 'yyyy-MM-dd');
      const bloqueado = blockedDates.includes(dateStr);
      const horariosBloqueados = blockedHours[dateStr] || [];

      return {
        date: dia,
        dateStr,
        ativo: diaConfig?.ativo && !bloqueado,
        horarios: diaConfig?.horarios || [],
        horariosBloqueados,
        totalDisponivel: (diaConfig?.horarios?.length || 0) - horariosBloqueados.length,
      };
    });
  };

  const maskPhone = (v: string) => {
    if (!v) return '';
    v = v.replace(/\D/g, '');
    v = v.replace(/^(\d{2})(\d)/g, '($1) $2');
    v = v.replace(/(\d)(\d{4})$/, '$1-$2');
    return v.slice(0, 15);
  };

  const handleAgendar = async () => {
    if (!db || !servicoSelecionado || !dataSelecionada || !horarioSelecionado || !nomeCliente || !telefoneCliente) {
      alert('Preencha todos os campos');
      return;
    }

    try {
      await addDoc(collection(db, 'saloes', tenantId, 'agendamentos'), {
        data: format(dataSelecionada, 'yyyy-MM-dd'),
        hora: horarioSelecionado,
        clienteNome: nomeCliente.toUpperCase(),
        clienteTelefone: telefoneCliente,
        clienteEmail: emailCliente,
        servico: servicoSelecionado.nome,
        servicoId: servicoSelecionado.id,
        profissional: profissionalSelecionado?.nome || '',
        profissionalId: profissionalSelecionado?.id || '',
        status: 'Pendente',
        valor: servicoSelecionado.preco,
        duracao: servicoSelecionado.duracao,
        createdAt: new Date().toISOString(),
      });

      setAgendamentoConfirmado(true);
    } catch (error) {
      console.error('Erro ao agendar:', error);
      alert('Erro ao realizar agendamento');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!config?.ativo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-6">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">Agendamento Indisponível</h1>
            <p className="text-gray-600">Este salão não está aceitando agendamentos online no momento.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (agendamentoConfirmado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-xl font-bold mb-2">Agendamento Confirmado!</h1>
            <p className="text-gray-600 mb-4">
              {nomeCliente}, seu agendamento foi realizado com sucesso.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <p><strong>Serviço:</strong> {servicoSelecionado?.nome}</p>
              <p><strong>Data:</strong> {dataSelecionada && format(dataSelecionada, "dd 'de' MMMM", { locale: ptBR })}</p>
              <p><strong>Horário:</strong> {horarioSelecionado}</p>
              <p><strong>Profissional:</strong> {profissionalSelecionado?.nome}</p>
            </div>
            {tenant?.whatsapp && (
              <a 
                href={`https://wa.me/55${tenant.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block"
              >
                <Button className="bg-green-600 hover:bg-green-700">
                  Confirmar via WhatsApp
                </Button>
              </a>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (profSession && editMode) {
    const monthDays = getHorariosProfMes();
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setEditMode(false)}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
              </Button>
              <div>
                <h1 className="font-bold">{tenant?.nome}</h1>
                <p className="text-sm text-gray-500">Gerenciar Disponibilidade</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={saveChanges} disabled={savingChanges}>
                {savingChanges ? 'Salvando...' : 'Salvar'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleProfLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Calendário de {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
              </CardTitle>
              <div className="flex gap-2 mt-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentMonth(addDays(startOfMonth(currentMonth), -1))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentMonth(addDays(endOfMonth(currentMonth), 1))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 border-b mb-2">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                  <div key={d} className="p-2 text-center text-sm font-medium text-gray-500">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} className="p-2 min-h-16 border-r border-b border-gray-100" />
                ))}
                {monthDays.map(dia => {
                  const isToday = format(dia.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                  const isPast = dia.date < startOfDay(new Date());
                  return (
                    <div 
                      key={dia.dateStr}
                      className={cn(
                        "p-2 min-h-16 border-r border-b border-gray-100 cursor-pointer transition-colors",
                        isToday && "bg-blue-50",
                        !dia.ativo && "bg-gray-100",
                        dia.ativo && !isPast && "hover:bg-green-50",
                        isPast && "opacity-50 cursor-not-allowed"
                      )}
                      onClick={() => {
                        if (isPast) return;
                        if (dia.ativo) {
                          toggleDateBlock(dia.dateStr);
                        }
                      }}
                    >
                      <span className={cn(
                        "text-sm font-medium block",
                        isToday && "text-blue-600"
                      )}>
                        {format(dia.date, 'd')}
                      </span>
                      {dia.ativo && !isPast && (
                        <span className="text-xs text-green-600">
                          {dia.totalDisponivel} horários
                        </span>
                      )}
                      {!dia.ativo && (
                        <span className="text-xs text-red-500 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Bloqueado
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Horários por Dia</CardTitle>
              <p className="text-sm text-gray-500">Clique em um dia acima para bloqueá-lo ou desbloqueá-lo</p>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 py-8">
                Selecione um dia no calendário acima para gerenciar horários específicos
              </p>
            </CardContent>
          </Card>

          <Card className="mt-6 bg-yellow-50 border-yellow-200">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">Importante</p>
                  <p className="text-sm text-yellow-700">
                    • Clique em um dia para bloqueá-lo completamente<br/>
                    • Configure seus horários padrão na área "Meu Perfil" do salão<br/>
                    • Dias bloqueados não aparecerão para clientes
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (profSession) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-200 text-sm">Bem-vindo,</p>
                <h1 className="text-2xl font-bold">{profSession.nome}</h1>
                <p className="text-purple-200 text-sm">{tenant?.nome}</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="border-white text-purple-700 hover:bg-purple-100"
                  onClick={() => setEditMode(true)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Gerenciar
                </Button>
                <Button 
                  variant="outline" 
                  className="border-white text-purple-700 hover:bg-purple-100"
                  onClick={handleProfLogout}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Seus Próximos Agendamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {agendamentosExistentes.filter(a => 
                a.profissional === profSession.nome &&
                new Date(a.data + 'T' + a.hora) >= new Date() &&
                a.status !== 'Cancelado'
              ).length === 0 ? (
                <p className="text-center text-gray-500 py-4">Nenhum agendamento agendado</p>
              ) : (
                <div className="space-y-3">
                  {agendamentosExistentes
                    .filter(a => 
                      a.profissional === profSession.nome &&
                      new Date(a.data + 'T' + a.hora) >= new Date() &&
                      a.status !== 'Cancelado'
                    )
                    .sort((a, b) => new Date(a.data + 'T' + a.hora).getTime() - new Date(b.data + 'T' + b.hora).getTime())
                    .slice(0, 10)
                    .map((a, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{a.clienteNome}</p>
                          <p className="text-sm text-gray-500">
                            {format(new Date(a.data), "dd/MM")} às {a.hora}
                          </p>
                        </div>
                        <Badge className={cn(
                          a.status === 'Confirmado' ? 'bg-blue-100 text-blue-700' :
                          a.status === 'Pendente' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        )}>
                          {a.status}
                        </Badge>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Settings className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="font-medium text-purple-800">Modo Profissional</p>
                  <p className="text-sm text-purple-700 mb-3">
                    Você está visualizando a agenda do salão. Clique em "Gerenciar" para bloquear dias e horários.
                  </p>
                  <Button onClick={() => window.location.href = `/profissional`} className="bg-purple-600">
                    Abrir Painel Completo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold">{tenant?.nome}</h1>
          <p className="text-blue-200">Agendamento Online</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex justify-end mb-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowProfLogin(!showProfLogin)}
          >
            {showProfLogin ? (
              <>
                <ChevronLeft className="w-4 h-4 mr-1" /> Fechar
              </>
            ) : (
              <>
                <User className="w-4 h-4 mr-1" /> Sou Profissional
              </>
            )}
          </Button>
        </div>

        {showProfLogin && (
          <Card className="mb-6 border-purple-300 bg-purple-50">
            <CardHeader>
              <CardTitle className="text-purple-700 flex items-center gap-2">
                <User className="w-5 h-5" />
                Área do Profissional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <Input 
                    placeholder="seu@email.com"
                    value={profLoginEmail}
                    onChange={e => setProfLoginEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Senha</Label>
                  <Input 
                    type="password"
                    placeholder="••••••"
                    value={profLoginSenha}
                    onChange={e => setProfLoginSenha(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handleProfLogin} className="bg-purple-600 hover:bg-purple-700">
                <LogIn className="w-4 h-4 mr-2" />
                Acessar
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scissors className="w-5 h-5 text-blue-600" />
                Selecione o Serviço
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {servicos.map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setServicoSelecionado(s);
                      setStep(2);
                    }}
                    className={cn(
                      "p-4 border rounded-lg text-left transition-all hover:border-blue-500 hover:bg-blue-50",
                      servicoSelecionado?.id === s.id && "border-blue-500 bg-blue-50"
                    )}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{s.nome}</p>
                        <p className="text-sm text-gray-500">{s.duracao} minutos</p>
                      </div>
                      <p className="font-bold text-green-600">R$ {s.preco.toFixed(2)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Selecione o Profissional
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Profissionais que realizam: <strong>{servicoSelecionado?.nome}</strong>
              </p>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => setStep(1)} className="mb-4">
                <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
              </Button>
              <div className="grid gap-3">
                {(() => {
                  const profsHabilitados = profissionais.filter(p => 
                    !p.servicosHabilitados || 
                    p.servicosHabilitados.length === 0 ||
                    p.servicosHabilitados.includes(servicoSelecionado?.nome || '')
                  );
                  return profsHabilitados.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">
                      Nenhum profissional habilitado para este serviço
                    </p>
                  ) : (
                    profsHabilitados.map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setProfissionalSelecionado(p);
                          setStep(3);
                        }}
                        className={cn(
                          "p-4 border rounded-lg text-left transition-all hover:border-blue-500 hover:bg-blue-50",
                          profissionalSelecionado?.id === p.id && "border-blue-500 bg-blue-50"
                        )}
                      >
                        <p className="font-medium">{p.nome}</p>
                        {p.servicosHabilitados && p.servicosHabilitados.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Também faz: {p.servicosHabilitados.filter((s: string) => s !== servicoSelecionado?.nome).slice(0, 3).join(', ')}
                            {p.servicosHabilitados.length > 4 && '...'}
                          </p>
                        )}
                      </button>
                    ))
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Selecione a Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => setStep(2)} className="mb-4">
                <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
              </Button>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {getDiasDisponiveis().map(dia => (
                  <button
                    key={dia.toISOString()}
                    onClick={() => {
                      setDataSelecionada(dia);
                      setStep(4);
                    }}
                    className="p-4 border rounded-lg text-center hover:border-blue-500 hover:bg-blue-50 transition-all"
                  >
                    <p className="text-sm text-gray-500">{format(dia, 'EEE', { locale: ptBR })}</p>
                    <p className="text-2xl font-bold">{format(dia, 'd')}</p>
                    <p className="text-sm text-gray-500">{format(dia, 'MMM', { locale: ptBR })}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Selecione o Horário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => setStep(3)} className="mb-4">
                <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
              </Button>
              
              {(config?.vagasProfissional || config?.vagasSalao) && (
                <div className="flex gap-4 mb-4 text-sm">
                  {config.vagasProfissional && (
                    <span className="flex items-center gap-1 text-blue-600">
                      <Users className="w-4 h-4" /> {config.vagasProfissional} vaga(s)/profissional
                    </span>
                  )}
                  {config.vagasSalao && (
                    <span className="flex items-center gap-1 text-purple-600">
                      <Scissors className="w-4 h-4" /> {config.vagasSalao} vagas total
                    </span>
                  )}
                </div>
              )}

              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {getHorariosDisponiveis().length === 0 ? (
                  <p className="col-span-full text-center text-gray-500 py-4">
                    Nenhum horário disponível para este dia
                  </p>
                ) : (
                  getHorariosDisponiveis().map(({ horario, lotado, lotadoProf, lotadoSalao }) => (
                    <button
                      key={horario}
                      onClick={() => !lotado && setHorarioSelecionado(horario)}
                      disabled={lotado}
                      className={cn(
                        "p-3 border rounded-lg text-center transition-all",
                        lotado 
                          ? "bg-gray-100 border-gray-200 cursor-not-allowed opacity-60"
                          : horarioSelecionado === horario
                            ? "border-blue-500 bg-blue-50"
                            : "hover:border-blue-500 hover:bg-blue-50"
                      )}
                    >
                      <p className="font-medium">{horario}</p>
                      {lotado && (
                        <p className="text-xs text-red-500 flex items-center justify-center gap-1">
                          <Lock className="w-3 h-3" /> 
                          {lotadoProf ? 'Prof' : 'Lotado'}
                        </p>
                      )}
                    </button>
                  ))
                )}
              </div>

              {horarioSelecionado && (
                <div className="mt-6">
                  <Button className="w-full" onClick={() => setStep(5)}>
                    Continuar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {step === 5 && (
          <Card>
            <CardHeader>
              <CardTitle>Seus Dados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" onClick={() => setStep(4)} className="mb-4">
                <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
              </Button>
              
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-blue-600">Resumo:</p>
                <p className="font-medium">{servicoSelecionado?.nome}</p>
                <p className="text-sm text-gray-600">
                  {dataSelecionada && format(dataSelecionada, "dd 'de' MMMM", { locale: ptBR })} às {horarioSelecionado}
                </p>
                <p className="text-sm text-gray-600">{profissionalSelecionado?.nome}</p>
              </div>

              <div>
                <Label>Nome *</Label>
                <Input 
                  placeholder="Seu nome completo"
                  value={nomeCliente}
                  onChange={e => setNomeCliente(e.target.value)}
                />
              </div>
              <div>
                <Label>Telefone *</Label>
                <Input 
                  placeholder="(00) 00000-0000"
                  value={telefoneCliente}
                  onChange={e => setTelefoneCliente(maskPhone(e.target.value))}
                />
              </div>
              <div>
                <Label>Email (opcional)</Label>
                <Input 
                  placeholder="seu@email.com"
                  value={emailCliente}
                  onChange={e => setEmailCliente(e.target.value)}
                />
              </div>

              <Button className="w-full" onClick={handleAgendar}>
                Confirmar Agendamento
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      {tenant && (
        <footer className="bg-gray-100 border-t mt-8">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div>
                <p className="font-medium">{tenant.nome}</p>
                {tenant.endereco && <p>{tenant.endereco}, {tenant.cidade}</p>}
              </div>
              {tenant.whatsapp && (
                <a 
                  href={`https://wa.me/55${tenant.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:text-green-700"
                >
                  <Phone className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
