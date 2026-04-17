'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LogIn, User, Calendar, Clock, Settings, LogOut, Building2, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Profissional = {
  id: string;
  nome: string;
  email?: string;
  celular?: string;
  loginEmail?: string;
  disponibilidade?: {
    horariosPorDia?: Record<string, { ativo: boolean; horarios: string[] }>;
  };
};

export default function ProfissionalLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [profissional, setProfissional] = useState<Profissional | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantNome, setTenantNome] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [servicos, setServicos] = useState<any[]>([]);
  const [disponibilidadeEdit, setDisponibilidadeEdit] = useState<Record<string, { ativo: boolean; horarios: string[] }>>({});
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const db = getFirebaseDb();

  const diasSemana = [
    { id: '1', nome: 'Segunda' },
    { id: '2', nome: 'Terça' },
    { id: '3', nome: 'Quarta' },
    { id: '4', nome: 'Quinta' },
    { id: '5', nome: 'Sexta' },
    { id: '6', nome: 'Sábado' },
    { id: '0', nome: 'Domingo' },
  ];

  const gerarHorarios = () => {
    const horarios: string[] = [];
    for (let h = 6; h < 22; h++) {
      horarios.push(`${String(h).padStart(2, '0')}:00`);
      horarios.push(`${String(h).padStart(2, '0')}:30`);
    }
    return horarios;
  };

  useEffect(() => {
    const saved = localStorage.getItem('profissionalSession');
    if (saved) {
      const session = JSON.parse(saved);
      setProfissional(session.profissional);
      setTenantId(session.tenantId);
      setTenantNome(session.tenantNome);
      if (session.profissional.disponibilidade?.horariosPorDia) {
        setDisponibilidadeEdit(session.profissional.disponibilidade.horariosPorDia);
      }
      loadAgendamentos(session.tenantId, session.profissional.id);
    }
  }, []);

  const loadAgendamentos = async (tId: string, profId: string) => {
    if (!db) return;
    try {
      const [agendSnap, servSnap] = await Promise.all([
        getDocs(collection(db, 'saloes', tId, 'agendamentos')),
        getDocs(collection(db, 'saloes', tId, 'servicos')),
      ]);
      const agendList = agendSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((a: any) => a.profissional === profissional?.nome && a.status !== 'Cancelado')
        .sort((a: any, b: any) => {
          const dateA = new Date(a.data + 'T' + a.hora);
          const dateB = new Date(b.data + 'T' + b.hora);
          return dateA.getTime() - dateB.getTime();
        });
      setAgendamentos(agendList);
      setServicos(servSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Erro ao carregar:', err);
    }
  };

  const handleLogin = async () => {
    if (!db || !email || !senha) return;
    setLoading(true);
    setError('');

    try {
      const snapshot = await getDocs(collection(db, 'profissionais'));
      const found = snapshot.docs.find(d => {
        const data = d.data();
        return data.loginEmail?.toLowerCase() === email.toLowerCase() && data.loginSenha === senha;
      });

      if (!found) {
        setError('Email ou senha incorretos');
        setLoading(false);
        return;
      }

      const profData = found.data() as Profissional;
      
      if (!profData.acessoAtivo) {
        setError('Seu acesso foi bloqueado pelo administrador. Entre em contato.');
        setLoading(false);
        return;
      }

      const profWithId = { ...profData, id: found.id };

      const tenantsSnap = await getDocs(collection(db, 'saloes'));
      const tenant = tenantsSnap.docs.find(d => {
        const profs = d.data().profissionais || [];
        return profs.some((p: any) => p.id === found.id || p.email === profData.loginEmail);
      });

      if (!tenant) {
        setError('Profissional não vinculado a nenhum salão');
        setLoading(false);
        return;
      }

      setProfissional(profWithId);
      setTenantId(tenant.id);
      setTenantNome(tenant.data().nome);
      setDisponibilidadeEdit(profData.disponibilidade?.horariosPorDia || {});

      localStorage.setItem('profissionalSession', JSON.stringify({
        profissional: profWithId,
        tenantId: tenant.id,
        tenantNome: tenant.data().nome,
      }));

      await loadAgendamentos(tenant.id, found.id);
    } catch (err) {
      console.error('Erro login:', err);
      setError('Erro ao fazer login');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('profissionalSession');
    setProfissional(null);
    setTenantId(null);
    setTenantNome('');
    setAgendamentos([]);
    setEditMode(false);
  };

  const toggleDia = (diaId: string) => {
    setDisponibilidadeEdit(prev => ({
      ...prev,
      [diaId]: {
        ativo: !prev[diaId]?.ativo,
        horarios: prev[diaId]?.horarios || gerarHorarios(),
      },
    }));
  };

  const toggleHorario = (diaId: string, horario: string) => {
    setDisponibilidadeEdit(prev => {
      const current = prev[diaId]?.horarios || [];
      const newHorarios = current.includes(horario)
        ? current.filter(h => h !== horario)
        : [...current, horario].sort();
      return {
        ...prev,
        [diaId]: {
          ...prev[diaId],
          ativo: prev[diaId]?.ativo && newHorarios.length > 0,
          horarios: newHorarios,
        },
      };
    });
  };

  const handleSaveDisponibilidade = async () => {
    if (!db || !profissional || !tenantId) return;
    setSaving(true);

    try {
      const snapshot = await getDocs(collection(db, 'saloes', tenantId, 'profissionais'));
      const docRef = snapshot.docs.find(d => d.data().loginEmail === profissional.loginEmail);
      if (docRef) {
        await updateDoc(docRef.ref, {
          disponibilidade: { horariosPorDia: disponibilidadeEdit },
        });

        const updated = {
          ...profissional,
          disponibilidade: { horariosPorDia: disponibilidadeEdit },
        };
        setProfissional(updated);
        localStorage.setItem('profissionalSession', JSON.stringify({
          profissional: updated,
          tenantId,
          tenantNome,
        }));
      }
      setEditMode(false);
    } catch (err) {
      console.error('Erro ao salvar:', err);
    }
    setSaving(false);
  };

  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const getAgendamentosDoDia = (dia: Date) => {
    const dateStr = format(dia, 'yyyy-MM-dd');
    return agendamentos.filter(a => a.data === dateStr);
  };

  if (!profissional) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Área do Profissional</CardTitle>
            <CardDescription>Faça login para acessar sua agenda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <div className="relative">
                <Input
                  id="senha"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Sua senha"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button className="w-full" onClick={handleLogin} disabled={loading}>
              <LogIn className="w-4 h-4 mr-2" />
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">{profissional.nome}</h1>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Building2 className="w-3 h-3" /> {tenantNome}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <CardTitle>Minha Agenda</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}>
                      Anterior
                    </Button>
                    <span className="font-medium">{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</span>
                    <Button variant="outline" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                      Próximo
                    </Button>
                  </div>
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
                    <div key={`empty-${i}`} className="p-2 min-h-24 border-r border-b border-gray-100 dark:border-gray-700" />
                  ))}
                  {monthDays.map(dia => {
                    const dayAgendamentos = getAgendamentosDoDia(dia);
                    return (
                      <div
                        key={dia.toISOString()}
                        className={cn(
                          "p-2 min-h-24 border-r border-b border-gray-100 dark:border-gray-700",
                          isSameDay(dia, new Date()) && "bg-blue-50 dark:bg-blue-900/20"
                        )}
                      >
                        <span className={cn(
                          "text-sm font-medium block mb-1",
                          isSameDay(dia, new Date()) ? "text-blue-600" : "text-gray-600 dark:text-gray-400"
                        )}>
                          {format(dia, 'd')}
                        </span>
                        <div className="space-y-1">
                          {dayAgendamentos.slice(0, 2).map(a => {
                            const servico = servicos.find(s => s.nome === a.servico);
                            return (
                              <div
                                key={a.id}
                                className={cn(
                                  "text-xs p-1 rounded truncate",
                                  a.status === 'Concluido' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                                  a.status === 'Confirmado' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                                  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
                                )}
                              >
                                {a.hora?.slice(0, 5)} {a.clienteNome}
                              </div>
                            );
                          })}
                          {dayAgendamentos.length > 2 && (
                            <div className="text-xs text-gray-500">+{dayAgendamentos.length - 2}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-green-600" />
                    <CardTitle>Próximos Agendamentos</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {agendamentos.filter(a => new Date(a.data + 'T' + a.hora) >= new Date()).length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Nenhum agendamento agendado</p>
                ) : (
                  <div className="space-y-3">
                    {agendamentos
                      .filter(a => new Date(a.data + 'T' + a.hora) >= new Date())
                      .slice(0, 10)
                      .map(a => {
                        const servico = servicos.find(s => s.nome === a.servico);
                        return (
                          <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div>
                              <p className="font-medium">{a.clienteNome}</p>
                              <p className="text-sm text-gray-500">
                                {format(parseISO(a.data), "dd 'de' MMMM", { locale: ptBR })} às {a.hora}
                              </p>
                              <p className="text-sm text-blue-600">{a.servico} ({servico?.duracao || 30} min)</p>
                            </div>
                            <span className={cn(
                              "px-2 py-1 rounded text-xs font-medium",
                              a.status === 'Confirmado' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                              a.status === 'Pendente' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' :
                              'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                            )}>
                              {a.status}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-purple-600" />
                    <CardTitle>Disponibilidade</CardTitle>
                  </div>
                  {!editMode ? (
                    <Button size="sm" onClick={() => setEditMode(true)}>
                      <Settings className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditMode(false)}>Cancelar</Button>
                      <Button size="sm" onClick={handleSaveDisponibilidade} disabled={saving}>
                        {saving ? 'Salvando...' : 'Salvar'}
                      </Button>
                    </div>
                  )}
                </div>
                {!editMode && (
                  <CardDescription>Configure seus horários de trabalho</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {diasSemana.map(dia => {
                    const config = disponibilidadeEdit[dia.id];
                    const ativo = config?.ativo ?? false;
                    const horarios = config?.horarios || [];

                    return (
                      <div key={dia.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{dia.nome}</span>
                          {editMode ? (
                            <Button
                              size="sm"
                              variant={ativo ? "default" : "outline"}
                              onClick={() => toggleDia(dia.id)}
                            >
                              {ativo ? 'Ativo' : 'Inativo'}
                            </Button>
                          ) : (
                            <span className={cn(
                              "px-2 py-1 rounded text-xs",
                              ativo ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                              'bg-gray-100 text-gray-500'
                            )}>
                              {ativo ? 'Disponível' : 'Indisponível'}
                            </span>
                          )}
                        </div>
                        {ativo && (
                          <div className="mt-2">
                            {editMode ? (
                              <>
                                <p className="text-xs text-gray-500 mb-2">Horários disponíveis:</p>
                                <div className="grid grid-cols-4 gap-1 max-h-32 overflow-y-auto">
                                  {gerarHorarios().map(hora => (
                                    <button
                                      key={hora}
                                      type="button"
                                      onClick={() => toggleHorario(dia.id, hora)}
                                      className={cn(
                                        "text-xs p-1 rounded border",
                                        horarios.includes(hora)
                                          ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-700 dark:text-blue-300'
                                          : 'bg-gray-50 border-gray-200 text-gray-400'
                                      )}
                                    >
                                      {hora}
                                    </button>
                                  ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                  {horarios.length} horários selecionados
                                </p>
                              </>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {horarios.length > 0 ? (
                                  <>
                                    <span className="text-xs text-gray-500">
                                      {horarios[0]} - {horarios[horarios.length - 1]}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      ({horarios.length} horários)
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-xs text-gray-400">Nenhum horário</span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
