'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameDay, isToday, parseISO, addMonths, subMonths, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, setDoc, onSnapshot, Timestamp
} from 'firebase/firestore';
import {
  BarChart3, Calendar, Users, Scissors, UserCheck, DollarSign, Settings, Menu, X,
  LogOut, ChevronRight, Plus, Pencil, Trash2, Search, Eye, Check, XCircle,
  TrendingUp, TrendingDown, Building2, Clock, Phone, Mail, AlertTriangle,
  Sun, Moon, LayoutDashboard, UserCog, Briefcase, Wallet, ArrowUpRight, ArrowDownRight,
  ChevronLeft, Bell, CreditCard, MapPin, Download, FileSpreadsheet, FileText, Filter,
  Package, ShoppingCart, Percent, Star, History, Save, Printer, Trash
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

import { getFirebaseDb } from '@/lib/firebase';
import { useSalonStore } from '@/lib/store';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';

// =====================================
// SCHEMAS DE VALIDAÇÃO
// =====================================
const loginSchema = z.object({
  usuario: z.string().min(1, 'Usuário é obrigatório'),
  senha: z.string().min(1, 'Senha é obrigatória'),
});

const salaoSchema = z.object({
  nome: z.string().min(2, 'Nome é obrigatório'),
  usuario: z.string().min(2, 'Usuário é obrigatório'),
  senha: z.string().min(2, 'Senha é obrigatória'),
  plano: z.enum(['basico', 'profissional', 'premium']),
  dataExpiracao: z.string().min(1, 'Data de expiração é obrigatória'),
  logoUrl: z.string().optional(),
  coresPersonalizadas: z.string().optional(),
});

const clienteSchema = z.object({
  nome: z.string().min(2, 'Nome é obrigatório'),
  telefone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  endereco: z.string().optional(),
  numero: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().max(2, 'UF').optional(),
  cep: z.string().optional(),
  observacoes: z.string().optional(),
  pontosFidelidade: z.number().min(0).default(0),
});

const profissionalSchema = z.object({
  nome: z.string().min(2, 'Nome é obrigatório'),
  celular: z.string().optional(),
  fixo: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  endereco: z.string().optional(),
  numero: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().max(2, 'UF').optional(),
  cep: z.string().optional(),
  status: z.enum(['ativo', 'inativo']),
  percentualComissao: z.number().min(0).max(100).optional(),
  tipoComissao: z.enum(['percentual', 'fixo_por_servico']).optional(),
});

const servicoSchema = z.object({
  nome: z.string().min(2, 'Nome é obrigatório'),
  preco: z.number().min(0, 'Preço deve ser maior ou igual a zero'),
  duracao: z.number().min(5, 'Duração mínima de 5 minutos'),
});

const produtoSchema = z.object({
  nome: z.string().min(2, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  precoVenda: z.number().min(0, 'Preço de venda deve ser maior ou igual a zero'),
  precoCusto: z.number().min(0, 'Preço de custo deve ser maior ou igual a zero').optional(),
  quantidadeEstoque: z.number().min(0, 'Quantidade deve ser maior ou igual a zero'),
  estoqueMinimo: z.number().min(0, 'Estoque mínimo deve ser maior ou igual a zero'),
});

const agendamentoSchema = z.object({
  data: z.string().min(1, 'Data é obrigatória'),
  hora: z.string().min(1, 'Hora é obrigatória'),
  clienteNome: z.string().min(1, 'Selecione um cliente'),
  clienteTelefone: z.string().optional(),
  servico: z.string().min(1, 'Selecione um serviço'),
  profissional: z.string().min(1, 'Selecione um profissional'),
  status: z.enum(['Pendente', 'Confirmado', 'Concluido', 'Cancelado']),
  valor: z.number().optional(),
});

const financeiroSchema = z.object({
  data: z.string().min(1, 'Data é obrigatória'),
  descricao: z.string().min(2, 'Descrição é obrigatória'),
  tipo: z.enum(['entrada', 'saida']),
  valor: z.number().min(0.01, 'Valor deve ser maior que zero'),
  formaPagamento: z.string().optional(),
  observacoes: z.string().optional(),
});

const userSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'Email é obrigatório'),
  name: z.string().optional(),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  role: z.enum(['master_admin', 'tenant_admin', 'profissional', 'recepcionista']).default('tenant_admin'),
  tenantId: z.string().optional(),
});

// =====================================
// HELPERS
// =====================================
const toUpper = (str: string) => str ? str.toUpperCase() : '';
const toLower = (str: string) => str ? str.toLowerCase() : '';

const maskPhone = (v: string) => {
  if (!v) return '';
  v = v.replace(/\D/g, '');
  v = v.replace(/^(\d{2})(\d)/g, '($1) $2');
  v = v.replace(/(\d)(\d{4})$/, '$1-$2');
  return v.substring(0, 15);
};

const maskCep = (v: string) => {
  if (!v) return '';
  v = v.replace(/\D/g, '');
  v = v.replace(/^(\d{5})(\d)/, '$1-$2');
  return v.substring(0, 9);
};

// =====================================
// USUÁRIO MASTER PADRÃO
// =====================================
const MASTER_USER = {
  email: 'admin@example.com', // Alterado para email
  senha: '123',
};

// Carregar senha master do localStorage se existir
if (typeof window !== 'undefined') {
  const savedPassword = localStorage.getItem('masterPassword');
  if (savedPassword) {
    MASTER_USER.senha = savedPassword;
  }
}

// =====================================
// COMPONENTE PRINCIPAL
// =====================================
export default function SalonApp() {
  const db = getFirebaseDb();
  
  // Estado global
  const {
    user, tenant, isAuthenticated, isExpired, isMaster,
    currentView, sidebarOpen, darkMode, loading,
    login, logout, setExpired,
    setCurrentView,
    toggleSidebar, setSidebarOpen, setLoading, toggleDarkMode,
    saloes, setSaloes, addSalao, updateSalao, deleteSalao,
    clientes, setClientes, addCliente, updateCliente, deleteCliente,
    profissionais, setProfissionais, addProfissional, updateProfissional, deleteProfissional,
    servicos, setServicos, addServico, updateServico, deleteServico,
    agendamentos, setAgendamentos, addAgendamento, updateAgendamento, deleteAgendamento,
    financeiro, setFinanceiro, addFinanceiro, updateFinanceiro, deleteFinanceiro,
    produtos, setProdutos, addProduto, updateProduto, deleteProduto,
  } = useSalonStore();
  
  // Local state
  const [loginError, setLoginError] = useState('');
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline'>('offline');
  
  // Refs for real-time listeners
  const unsubscribersRef = useRef<(() => void)[]>([]);
  
  // Form states
  const [showSalaoDialog, setShowSalaoDialog] = useState(false);
  const [showClienteDialog, setShowClienteDialog] = useState(false);
  const [showProfissionalDialog, setShowProfissionalDialog] = useState(false);
  const [showServicoDialog, setShowServicoDialog] = useState(false);
  const [showAgendamentoDialog, setShowAgendamentoDialog] = useState(false);
  const [showFinanceiroDialog, setShowFinanceiroDialog] = useState(false);
  const [showProdutoDialog, setShowProdutoDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: string } | null>(null);
  
  // Relatório filters
  const [relatorioProfissional, setRelatorioProfissional] = useState<string>('todos');
  const [relatorioDataInicio, setRelatorioDataInicio] = useState<string>('');
  const [relatorioDataFim, setRelatorioDataFim] = useState<string>('');
  const [relatorioLoading, setRelatorioLoading] = useState(false);
  
  // Busca de clientes
  const [buscaCliente, setBuscaCliente] = useState<string>('');
  const [pdvBuscaCliente, setPdvBuscaCliente] = useState<string>('');
  const [pdvClienteSelecionado, setPdvClienteSelecionado] = useState<any>(null);
  const [pdvActiveTab, setPdvActiveTab] = useState<string>("servicos");
  const [pdvCarrinho, setPdvCarrinho] = useState<any[]>([]);
  const [showPdvPagamento, setShowPdvPagamento] = useState(false);
  const [pdvFormaPagamento, setPdvFormaPagamento] = useState<string>("Dinheiro");
  
  // Caixa
  const [caixaAberto, setCaixaAberto] = useState(false);
  const [caixaValorAbertura, setCaixaValorAbertura] = useState(0);
  const [showCaixaDialog, setShowCaixaDialog] = useState(false);
  const [caixaMovimentacoes, setCaixaMovimentacoes] = useState<any[]>([]);
  
  // Histórico do cliente
  const [showClienteHistorico, setShowClienteHistorico] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<any>(null);
  
  // Alterar senha
  const [showAlterarSenha, setShowAlterarSenha] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [senhaError, setSenhaError] = useState('');
  const [senhaSuccess, setSenhaSuccess] = useState('');
  
  // Forms
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { usuario: '', senha: '' },
  });
  
  const salaoForm = useForm<z.infer<typeof salaoSchema>>({
    resolver: zodResolver(salaoSchema),
    defaultValues: {
      nome: '', usuario: '', senha: '', plano: 'basico', dataExpiracao: ''
    },
  });
  
  const clienteForm = useForm<z.infer<typeof clienteSchema>>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nome: '', telefone: '', email: '', endereco: '', numero: '', bairro: '', cidade: '', estado: '', cep: '', observacoes: ''
    },
  });
  
  const profissionalForm = useForm<z.infer<typeof profissionalSchema>>({
    resolver: zodResolver(profissionalSchema),
    defaultValues: {
      nome: '', celular: '', fixo: '', email: '', endereco: '', numero: '', bairro: '', cidade: '', estado: '', cep: '', status: 'ativo'
    },
  });
  
  const servicoForm = useForm<z.infer<typeof servicoSchema>>({
    resolver: zodResolver(servicoSchema),
    defaultValues: { nome: '', preco: 0, duracao: 30 },
  });
  
  const agendamentoForm = useForm<z.infer<typeof agendamentoSchema>>({
    resolver: zodResolver(agendamentoSchema),
    defaultValues: {
      data: '', hora: '', clienteNome: '', clienteTelefone: '', servico: '', profissional: '', status: 'Pendente'
    },
  });

  const financeiroForm = useForm<z.infer<typeof financeiroSchema>>({
    resolver: zodResolver(financeiroSchema),
    defaultValues: {
      data: format(new Date(), 'yyyy-MM-dd'),
      descricao: '',
      tipo: 'entrada',
      valor: 0,
      formaPagamento: 'Dinheiro',
      observacoes: ''
    },
  });

  const produtoForm = useForm<z.infer<typeof produtoSchema>>({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      precoVenda: 0,
      precoCusto: 0,
      quantidadeEstoque: 0,
      estoqueMinimo: 0
    },
  });

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);
  
  // =====================================
  // VERIFICAR CONEXÃO COM FIREBASE
  // =====================================
  useEffect(() => {
    // Função para verificar conexão com Firebase
    const checkConnection = async () => {
      try {
        // Tentar uma operação simples para verificar conexão
        await getDocs(query(collection(db, 'saloes'), orderBy('createdAt', 'desc')));
        setConnectionStatus('online');
      } catch (error) {
        console.error('Erro de conexão:', error);
        setConnectionStatus('offline');
      }
    };
    
    // Verificar conexão inicial
    checkConnection();
    
    // Verificar conexão a cada 30 segundos
    const interval = setInterval(checkConnection, 30000);
    
    return () => clearInterval(interval);
  }, [db]);
  
  // =====================================
  // FUNÇÕES DE AUTENTICAÇÃO
  // =====================================
  const handleLogin = useCallback(async (data: z.infer<typeof loginSchema>) => {
    setLoading(true);
    setLoginError('');
    
    try {
      // Verificar conexão
      if (!navigator.onLine) {
        setLoginError('Sem conexão com a internet');
        setConnectionStatus('offline');
        setLoading(false);
        return;
      }
      
      setConnectionStatus('online');
      
      // Master Admin Login
      if (data.usuario === MASTER_USER.email || data.usuario === 'admin') {
        if (data.senha === MASTER_USER.senha) {
          login({ id: 'master', nome: 'Master Admin', email: MASTER_USER.email, role: 'master_admin' }, null, true);
          setLoading(false);
          return;
        }
      }
      
      // Buscar salu00e3o no Firestore
      const saloesRef = collection(db, 'saloes');
      
      // Tentar primeiro com o campo 'usuario'
      let q = query(saloesRef, where('usuario', '==', data.usuario));
      let snapshot = await getDocs(q);
      
      // Se nu00e3o encontrar, tentar com o campo 'email'
      if (snapshot.empty) {
        q = query(saloesRef, where('email', '==', data.usuario));
        snapshot = await getDocs(q);
      }
      
      if (snapshot.empty) {
        setLoginError('Usuu00e1rio nu00e3o encontrado');
        setLoading(false);
        return;
      }
      
      const salaoDoc = snapshot.docs[0];
      const salaoData = { id: salaoDoc.id, ...salaoDoc.data() } as any;
      
      // Validar senha
      if (salaoData.senha !== data.senha) {
        setLoginError('Senha invu00e1lida');
        setLoading(false);
        return;
      }
      
      // Verificar expiração
      if (salaoData.dataExpiracao) {
        const expiracao = new Date(salaoData.dataExpiracao);
        const hoje = new Date();
        
        if (expiracao < hoje) {
          login({ id: salaoData.id, nome: salaoData.nome }, salaoData, false);
          setExpired(true);
          setLoading(false);
          return;
        }
      }
      
      if (!salaoData.ativo) {
        setLoginError('Salão inativo. Entre em contato com o administrador.');
        setLoading(false);
        return;
      }
      
      login({ id: salaoData.id, nome: salaoData.nome }, salaoData, false);
      setConnectionStatus('online');
      setLoading(false);
      
    } catch (error: any) {
      console.error('Erro no login:', error);
      setLoginError('Erro ao fazer login. Tente novamente.');
      setConnectionStatus('offline');
      setLoading(false);
    }
  }, [db, login, setExpired, setLoading]);
  
  const handleLogout = useCallback(() => {
    logout();
    loginForm.reset();
  }, [logout, loginForm]);
  
  // =====================================
  // FUNÇÕES CRUD - SALÕES
  // =====================================
  const loadSaloes = useCallback(async () => {
    try {
      const saloesRef = collection(db, 'saloes');
      const snapshot = await getDocs(query(saloesRef, orderBy('createdAt', 'desc')));
      const saloesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      setSaloes(saloesData);
    } catch (error) {
      console.error('Erro ao carregar salões:', error);
    }
  }, [db, setSaloes]);
  
  const handleSaveSalao = useCallback(async (data: z.infer<typeof salaoSchema>) => {
    try {
      const salaoData = {
        ...data,
        nome: toUpper(data.nome),
        ativo: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      if (editingItem) {
        await updateDoc(doc(db, 'saloes', editingItem.id), salaoData);
      } else {
        await addDoc(collection(db, 'saloes'), salaoData);
      }
      
      setShowSalaoDialog(false);
      salaoForm.reset();
      setEditingItem(null);
    } catch (error) {
      console.error('Erro ao salvar salão:', error);
    }
  }, [db, editingItem, salaoForm]);
  
  const handleDeleteSalao = useCallback(async () => {
    if (!deleteConfirm) return;
    
    try {
      await deleteDoc(doc(db, 'saloes', deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Erro ao excluir salão:', error);
    }
  }, [db, deleteConfirm]);
  
  // =====================================
  // FUNÇÕES CRUD - CLIENTES
  // =====================================
  const loadClientes = useCallback(async () => {
    if (!tenant) return;
    try {
      const clientesRef = collection(db, 'saloes', tenant.id, 'clientes');
      const snapshot = await getDocs(query(clientesRef, orderBy('nome')));
      const clientesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      setClientes(clientesData);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  }, [db, tenant, setClientes]);
  
  const handleSaveCliente = useCallback(async (data: z.infer<typeof clienteSchema>) => {
    if (!tenant) return;
    
    try {
      const clienteData = {
        ...data,
        nome: toUpper(data.nome),
        endereco: toUpper(data.endereco || ''),
        numero: toUpper(data.numero || ''),
        bairro: toUpper(data.bairro || ''),
        cidade: toUpper(data.cidade || ''),
        estado: toUpper(data.estado || ''),
        email: toLower(data.email || ''),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      if (editingItem) {
        await setDoc(doc(db, 'saloes', tenant.id, 'clientes', editingItem.id), clienteData, { merge: true });
      } else {
        await addDoc(collection(db, 'saloes', tenant.id, 'clientes'), clienteData);
      }
      
      setShowClienteDialog(false);
      clienteForm.reset();
      setEditingItem(null);
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
    }
  }, [db, tenant, editingItem, clienteForm]);
  
  const handleDeleteCliente = useCallback(async () => {
    if (!deleteConfirm || !tenant) return;
    
    try {
      await deleteDoc(doc(db, 'saloes', tenant.id, 'clientes', deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
    }
  }, [db, tenant, deleteConfirm]);
  

  // =====================================
  // FUNÇÕES CRUD - PRODUTOS
  // =====================================
  const loadProdutos = useCallback(async () => {
    if (!tenant) return;
    try {
      const produtosRef = collection(db, 'saloes', tenant.id, 'produtos');
      const snapshot = await getDocs(query(produtosRef, orderBy('nome')));
      const produtosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      setProdutos(produtosData);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  }, [db, tenant, setProdutos]);

  const handleDeleteProduto = useCallback(async () => {
    if (!deleteConfirm || !tenant) return;
    
    try {
      await deleteDoc(doc(db, 'saloes', tenant.id, 'produtos', deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
    }
  }, [db, tenant, deleteConfirm]);

  // =====================================
  // FUNÇÕES CRUD - PROFISSIONAIS
  // =====================================
  const loadProfissionais = useCallback(async () => {
    if (!tenant) return;
    try {
      const profissionaisRef = collection(db, 'saloes', tenant.id, 'profissionais');
      const snapshot = await getDocs(query(profissionaisRef, orderBy('nome')));
      const profissionaisData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      setProfissionais(profissionaisData);
    } catch (error) {
      console.error('Erro ao carregar profissionais:', error);
    }
  }, [db, tenant, setProfissionais]);
  
  const handleSaveProfissional = useCallback(async (data: z.infer<typeof profissionalSchema>) => {
    if (!tenant) return;
    
    try {
      const profissionalData = {
        ...data,
        nome: toUpper(data.nome),
        endereco: toUpper(data.endereco || ''),
        numero: toUpper(data.numero || ''),
        bairro: toUpper(data.bairro || ''),
        cidade: toUpper(data.cidade || ''),
        estado: toUpper(data.estado || ''),
        email: toLower(data.email || ''),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      if (editingItem) {
        await setDoc(doc(db, 'saloes', tenant.id, 'profissionais', editingItem.id), profissionalData, { merge: true });
      } else {
        await addDoc(collection(db, 'saloes', tenant.id, 'profissionais'), profissionalData);
      }
      
      setShowProfissionalDialog(false);
      profissionalForm.reset();
      setEditingItem(null);
    } catch (error) {
      console.error('Erro ao salvar profissional:', error);
    }
  }, [db, tenant, editingItem, profissionalForm]);
  
  const handleDeleteProfissional = useCallback(async () => {
    if (!deleteConfirm || !tenant) return;
    
    try {
      await deleteDoc(doc(db, 'saloes', tenant.id, 'profissionais', deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Erro ao excluir profissional:', error);
    }
  }, [db, tenant, deleteConfirm]);
  
  // =====================================
  // FUNÇÕES CRUD - SERVIÇOS
  // =====================================
  const loadServicos = useCallback(async () => {
    if (!tenant) return;
    try {
      const servicosRef = collection(db, 'saloes', tenant.id, 'servicos');
      const snapshot = await getDocs(query(servicosRef, orderBy('nome')));
      const servicosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      setServicos(servicosData);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
    }
  }, [db, tenant, setServicos]);
  
  const handleSaveServico = useCallback(async (data: z.infer<typeof servicoSchema>) => {
    if (!tenant) return;
    
    try {
      const servicoData = {
        ...data,
        nome: toUpper(data.nome),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      if (editingItem) {
        await setDoc(doc(db, 'saloes', tenant.id, 'servicos', editingItem.id), servicoData, { merge: true });
      } else {
        await addDoc(collection(db, 'saloes', tenant.id, 'servicos'), servicoData);
      }
      
      setShowServicoDialog(false);
      servicoForm.reset();
      setEditingItem(null);
    } catch (error) {
      console.error('Erro ao salvar serviço:', error);
    }
  }, [db, tenant, editingItem, servicoForm]);
  
  const handleDeleteServico = useCallback(async () => {
    if (!deleteConfirm || !tenant) return;
    
    try {
      await deleteDoc(doc(db, 'saloes', tenant.id, 'servicos', deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Erro ao excluir serviço:', error);
    }
  }, [db, tenant, deleteConfirm]);
  
  // =====================================
  // FUNÇÕES CRUD - AGENDAMENTOS
  // =====================================
  const loadAgendamentos = useCallback(async () => {
    if (!tenant) return;
    try {
      const agendamentosRef = collection(db, 'saloes', tenant.id, 'agendamentos');
      const snapshot = await getDocs(query(agendamentosRef, orderBy('data', 'desc')));
      const agendamentosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      setAgendamentos(agendamentosData);
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
    }
  }, [db, tenant, setAgendamentos]);
  
  const handleSaveAgendamento = useCallback(async (data: z.infer<typeof agendamentoSchema>) => {
    if (!tenant) {
      alert('Erro: Salão não identificado. Faça login novamente.');
      return;
    }
    
    // Validar se a data é anterior à data atual (apenas para novos agendamentos)
    const selectedDate = parseISO(data.data);
    const today = startOfDay(new Date());
    
    if (!editingItem && isBefore(selectedDate, today)) {
      alert('Não é possível agendar com datas anteriores à atual.');
      return;
    }
    
    try {
      // Buscar o serviço para pegar o preço
      const servicoEncontrado = servicos.find((s: any) => s.nome === data.servico);
      const valorServico = servicoEncontrado?.preco || data.valor || 0;
      
      const agendamentoData = {
        ...data,
        clienteNome: toUpper(data.clienteNome),
        servico: toUpper(data.servico),
        profissional: toUpper(data.profissional),
        valor: valorServico,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      if (editingItem) {
        await setDoc(doc(db, 'saloes', tenant.id, 'agendamentos', editingItem.id), agendamentoData, { merge: true });
      } else {
        await addDoc(collection(db, 'saloes', tenant.id, 'agendamentos'), agendamentoData);
      }
      
      // Se status for Concluido, abrir modal financeiro automaticamente
      if (data.status === 'Concluido') {
        setShowAgendamentoDialog(false);
        setEditingItem(null);
        
        // Preparar dados do financeiro
        financeiroForm.reset({
          data: data.data,
          descricao: `${data.servico} - ${data.clienteNome} (${data.profissional})`,
          tipo: 'entrada',
          valor: valorServico,
          formaPagamento: '',
          observacoes: '',
        });
        setShowFinanceiroDialog(true);
      } else {
        setShowAgendamentoDialog(false);
        agendamentoForm.reset();
        setEditingItem(null);
      }
    } catch (error: any) {
      console.error('Erro ao salvar agendamento:', error);
      alert('Erro ao salvar agendamento: ' + (error.message || 'Erro desconhecido'));
    }
  }, [db, tenant, editingItem, agendamentoForm, servicos, financeiroForm]);
  
  const handleDeleteAgendamento = useCallback(async () => {
    if (!deleteConfirm || !tenant) return;
    
    try {
      await deleteDoc(doc(db, 'saloes', tenant.id, 'agendamentos', deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Erro ao excluir agendamento:', error);
    }
  }, [db, tenant, deleteConfirm]);
  
  // =====================================
  // FUNÇÕES CRUD - FINANCEIRO
  // =====================================
  const loadFinanceiro = useCallback(async () => {
    if (!tenant) return;
    try {
      const financeiroRef = collection(db, 'saloes', tenant.id, 'financeiro');
      const snapshot = await getDocs(query(financeiroRef, orderBy('data', 'desc')));
      const financeiroData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      setFinanceiro(financeiroData);
    } catch (error) {
      console.error('Erro ao carregar financeiro:', error);
    }
  }, [db, tenant, setFinanceiro]);
  
  const handleSaveFinanceiro = useCallback(async (data: z.infer<typeof financeiroSchema>) => {
    if (!tenant) return;
    
    try {
      const financeiroData = {
        ...data,
        descricao: toUpper(data.descricao),
        formaPagamento: data.tipo === 'entrada' ? data.formaPagamento : '',
        observacoes: data.observacoes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      if (editingItem) {
        await setDoc(doc(db, 'saloes', tenant.id, 'financeiro', editingItem.id), financeiroData, { merge: true });
      } else {
        await addDoc(collection(db, 'saloes', tenant.id, 'financeiro'), financeiroData);
      }
      
      setShowFinanceiroDialog(false);
      financeiroForm.reset();
      setEditingItem(null);
    } catch (error) {
      console.error('Erro ao salvar lançamento:', error);
    }
  }, [db, tenant, editingItem, financeiroForm]);
  
  const handleDeleteFinanceiro = useCallback(async () => {
    if (!deleteConfirm || !tenant) return;
    
    try {
      await deleteDoc(doc(db, 'saloes', tenant.id, 'financeiro', deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Erro ao excluir lançamento:', error);
    }
  }, [db, tenant, deleteConfirm]);
  

  const handleSaveProduto = useCallback(async (data: z.infer<typeof produtoSchema>) => {
    if (!tenant) return;
    
    try {
      const produtoData = {
        ...data,
        nome: toUpper(data.nome),
        descricao: data.descricao || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      if (editingItem) {
        await setDoc(doc(db, 'saloes', tenant.id, 'produtos', editingItem.id), produtoData, { merge: true });
      } else {
        await addDoc(collection(db, 'saloes', tenant.id, 'produtos'), produtoData);
      }
      
      setShowProdutoDialog(false);
      produtoForm.reset();
      setEditingItem(null);
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
    }
  }, [db, tenant, editingItem, produtoForm]);

    const handleFinalizarVenda = useCallback(async (formaPagamento: string) => {
    const pdvTotal = pdvCarrinho.reduce((acc, item) => {
      const preco = item.type === "servico" ? parseFloat(item.preco) : parseFloat(item.precoVenda);
      return acc + (preco * item.qtd);
    }, 0);

    if (!tenant || pdvCarrinho.length === 0) return;
    
    setLoading(true);
    try {
      const dataVenda = format(new Date(), 'yyyy-MM-dd');
      const descricoes = pdvCarrinho.map(i => `${i.qtd}x ${i.nome}`).join(', ');
      const clienteNome = pdvClienteSelecionado ? pdvClienteSelecionado.nome : 'CONSUMIDOR';
      
      // 1. Registrar no Financeiro
      const financeiroData = {
        data: dataVenda,
        descricao: `VENDA PDV - ${clienteNome.toUpperCase()} (${descricoes.toUpperCase()})`,
        tipo: 'entrada',
        valor: pdvTotal,
        formaPagamento: formaPagamento,
        observacoes: 'Venda realizada via PDV',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await addDoc(collection(db, 'saloes', tenant.id, 'financeiro'), financeiroData);
      
      // 2. Atualizar Estoque (apenas para produtos)
      for (const item of pdvCarrinho) {
        if (item.type === 'produto') {
          const produtoRef = doc(db, 'saloes', tenant.id, 'produtos', item.id);
          const novaQtd = Math.max(0, (item.quantidadeEstoque || 0) - item.qtd);
          await updateDoc(produtoRef, {
            quantidadeEstoque: novaQtd,
            updatedAt: new Date().toISOString(),
          });
        }
      }
      
      // 3. Limpar Carrinho e Seleção
      setPdvCarrinho([]);
      setPdvClienteSelecionado(null);
      setShowPdvPagamento(false);
      alert('Venda finalizada com sucesso!');
      
    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
      alert('Erro ao finalizar venda. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [db, tenant, pdvCarrinho, pdvClienteSelecionado, setLoading]);

  

  // =====================================
  // FUNÇÃO ALTERAR SENHA
  // =====================================
  const handleAlterarSenha = useCallback(async () => {
    setSenhaError('');
    setSenhaSuccess('');
    
    // Validações
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      setSenhaError('Preencha todos os campos');
      return;
    }
    
    if (novaSenha.length < 3) {
      setSenhaError('A nova senha deve ter pelo menos 3 caracteres');
      return;
    }
    
    if (novaSenha !== confirmarSenha) {
      setSenhaError('As senhas não conferem');
      return;
    }
    
    try {
      if (isMaster) {
        // Validar senha atual do master
        if (senhaAtual !== MASTER_USER.senha) {
          setSenhaError('Senha atual incorreta');
          return;
        }
        // Atualizar senha do master (salvar no localStorage para persistência local)
        // Nota: Em produção, isso deveria ser salvo em um backend seguro
        localStorage.setItem('masterPassword', novaSenha);
        MASTER_USER.senha = novaSenha;
        setSenhaSuccess('Senha alterada com sucesso!');
        setSenhaAtual('');
        setNovaSenha('');
        setConfirmarSenha('');
        setTimeout(() => {
          setShowAlterarSenha(false);
          setSenhaSuccess('');
        }, 2000);
      } else if (tenant) {
        // Validar senha atual do salão
        if (senhaAtual !== tenant.senha) {
          setSenhaError('Senha atual incorreta');
          return;
        }
        // Atualizar senha do salão no Firestore
        await updateDoc(doc(db, 'saloes', tenant.id), {
          senha: novaSenha,
          updatedAt: new Date().toISOString(),
        });
        // Atualizar o tenant no store
        const updatedTenant = { ...tenant, senha: novaSenha };
        login(user, updatedTenant, false);
        setSenhaSuccess('Senha alterada com sucesso!');
        setSenhaAtual('');
        setNovaSenha('');
        setConfirmarSenha('');
        setTimeout(() => {
          setShowAlterarSenha(false);
          setSenhaSuccess('');
        }, 2000);
      }
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      setSenhaError('Erro ao alterar senha. Tente novamente.');
    }
  }, [db, isMaster, tenant, user, senhaAtual, novaSenha, confirmarSenha, login]);
  
  // =====================================
  // CARREGAR DADOS INICIAIS - REAL-TIME
  // =====================================
  useEffect(() => {
    // Cleanup function to unsubscribe from all listeners
    const cleanup = () => {
      unsubscribersRef.current.forEach(unsub => unsub());
      unsubscribersRef.current = [];
    };
    
    if (!isAuthenticated) {
      cleanup();
      return;
    }
    
    if (isMaster) {
      // Listener em tempo real para salões
      const saloesRef = collection(db, 'saloes');
      const unsubSaloes = onSnapshot(
        query(saloesRef, orderBy('createdAt', 'desc')),
        (snapshot) => {
          const saloesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
          setSaloes(saloesData);
          setConnectionStatus('online');
        },
        (error) => {
          console.error('Erro ao escutar salões:', error);
          setConnectionStatus('offline');
        }
      );
      unsubscribersRef.current.push(unsubSaloes);
    } else if (tenant && !isExpired) {
      // Listeners em tempo real para dados do tenant
      
      // Clientes
      const clientesRef = collection(db, 'saloes', tenant.id, 'clientes');
      const unsubClientes = onSnapshot(
        query(clientesRef, orderBy('nome')),
        (snapshot) => {
          const clientesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
          setClientes(clientesData);
          setConnectionStatus('online');
        },
        (error) => {
          console.error('Erro ao escutar clientes:', error);
          setConnectionStatus('offline');
        }
      );
      unsubscribersRef.current.push(unsubClientes);
      

      // Produtos
      const produtosRef = collection(db, 'saloes', tenant.id, 'produtos');
      const unsubProdutos = onSnapshot(
        query(produtosRef, orderBy('nome')),
        (snapshot) => {
          const produtosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
          setProdutos(produtosData);
        },
        (error) => {
          console.error('Erro ao escutar produtos:', error);
        }
      );
      unsubscribersRef.current.push(unsubProdutos);

            // Profissionais
      const profissionaisRef = collection(db, 'saloes', tenant.id, 'profissionais');
      const unsubProfissionais = onSnapshot(
        query(profissionaisRef, orderBy('nome')),
        (snapshot) => {
          const profissionaisData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
          setProfissionais(profissionaisData);
          setConnectionStatus('online');
        },
        (error) => {
          console.error('Erro ao escutar profissionais:', error);
        }
      );
      unsubscribersRef.current.push(unsubProfissionais);
      
      // Serviços
      const servicosRef = collection(db, 'saloes', tenant.id, 'servicos');
      const unsubServicos = onSnapshot(
        query(servicosRef, orderBy('nome')),
        (snapshot) => {
          const servicosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
          setServicos(servicosData);
          setConnectionStatus('online');
        },
        (error) => {
          console.error('Erro ao escutar serviços:', error);
        }
      );
      unsubscribersRef.current.push(unsubServicos);
      
      // Agendamentos
      const agendamentosRef = collection(db, 'saloes', tenant.id, 'agendamentos');
      const unsubAgendamentos = onSnapshot(
        query(agendamentosRef, orderBy('data', 'desc')),
        (snapshot) => {
          const agendamentosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
          setAgendamentos(agendamentosData);
          setConnectionStatus('online');
        },
        (error) => {
          console.error('Erro ao escutar agendamentos:', error);
        }
      );
      unsubscribersRef.current.push(unsubAgendamentos);
      
      // Financeiro
      const financeiroRef = collection(db, 'saloes', tenant.id, 'financeiro');
      const unsubFinanceiro = onSnapshot(
        query(financeiroRef, orderBy('data', 'desc')),
        (snapshot) => {
          const financeiroData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
          setFinanceiro(financeiroData);
          setConnectionStatus('online');
        },
        (error) => {
          console.error('Erro ao escutar financeiro:', error);
        }
      );
      unsubscribersRef.current.push(unsubFinanceiro);
    }
    
    return cleanup;
  }, [isAuthenticated, isMaster, tenant, isExpired, db, setSaloes, setClientes, setProfissionais, setServicos, setAgendamentos, setFinanceiro]);
  
  // =====================================
  // CÁLCULOS ESTATÍSTICOS
  // =====================================
  const getSalonStats = useCallback(() => {
    const hoje = new Date();
    const hojeStr = format(hoje, 'yyyy-MM-dd');
    const inicioMes = startOfMonth(hoje);
    const fimMes = endOfMonth(hoje);
    
    const agendamentosHoje = agendamentos.filter(a => 
      a.data === hojeStr && a.status !== 'Cancelado'
    );
    
    const entradasDia = financeiro.filter(f => {
      return f.tipo === 'entrada' && f.data === hojeStr;
    }).reduce((acc, f) => acc + f.valor, 0);
    
    const saidasDia = financeiro.filter(f => {
      return f.tipo === 'saida' && f.data === hojeStr;
    }).reduce((acc, f) => acc + f.valor, 0);
    
    const entradasMes = financeiro.filter(f => {
      return f.tipo === 'entrada' && f.data >= format(inicioMes, 'yyyy-MM-dd') && f.data <= format(fimMes, 'yyyy-MM-dd');
    }).reduce((acc, f) => acc + f.valor, 0);
    
    const saidasMes = financeiro.filter(f => {
      return f.tipo === 'saida' && f.data >= format(inicioMes, 'yyyy-MM-dd') && f.data <= format(fimMes, 'yyyy-MM-dd');
    }).reduce((acc, f) => acc + f.valor, 0);
    
    return {
      agendamentosHoje: agendamentosHoje.length,
      entradasDia,
      saidasDia,
      saldoDia: entradasDia - saidasDia,
      entradasMes,
      saidasMes,
      saldoMes: entradasMes - saidasMes,
      clientesTotal: clientes.length,
      profissionaisAtivos: profissionais.filter(p => p.status === 'ativo').length,
    };
  }, [agendamentos, financeiro, clientes, profissionais]);
  
  const getChartData = useCallback(() => {
    const hoje = new Date();
    const dados = [];
    
    for (let i = 6; i >= 0; i--) {
      const data = new Date(hoje);
      data.setDate(data.getDate() - i);
      const dataStr = format(data, 'yyyy-MM-dd');
      
      const entradasDia = financeiro.filter(f => 
        f.tipo === 'entrada' && f.data === dataStr
      ).reduce((acc, f) => acc + f.valor, 0);
      
      const saidasDia = financeiro.filter(f => 
        f.tipo === 'saida' && f.data === dataStr
      ).reduce((acc, f) => acc + f.valor, 0);
      
      dados.push({
        name: format(data, 'dd/MM', { locale: ptBR }),
        entradas: entradasDia,
        saidas: saidasDia,
      });
    }
    
    return dados;
  }, [financeiro]);
  
  // =====================================
  // RELATÓRIO POR PROFISSIONAL
  // =====================================
  const getRelatorioProfissionais = useCallback(() => {
    // Filtrar financeiro por período
    let financeiroFiltrado = financeiro.filter(f => f.tipo === 'entrada');
    
    if (relatorioDataInicio) {
      financeiroFiltrado = financeiroFiltrado.filter(f => f.data >= relatorioDataInicio);
    }
    if (relatorioDataFim) {
      financeiroFiltrado = financeiroFiltrado.filter(f => f.data <= relatorioDataFim);
    }
    
    // Agrupar por profissional (extraído da descrição)
    const porProfissional: Record<string, { total: number; qtd: number; servicos: string[] }> = {};
    
    financeiroFiltrado.forEach(f => {
      // Tentar extrair profissional da descrição (formato: "SERVIÇO - CLIENTE (PROFISSIONAL)")
      const match = f.descricao?.match(/\(([A-Z\s]+)\)/);
      const profissional = match ? match[1].trim() : 'Outros';
      
      if (!porProfissional[profissional]) {
        porProfissional[profissional] = { total: 0, qtd: 0, servicos: [] };
      }
      porProfissional[profissional].total += f.valor;
      porProfissional[profissional].qtd += 1;
      if (!porProfissional[profissional].servicos.includes(f.descricao?.split(' - ')[0] || '')) {
        porProfissional[profissional].servicos.push(f.descricao?.split(' - ')[0] || '');
      }
    });
    
    // Converter para array e filtrar por profissional selecionado
    let resultado = Object.entries(porProfissional).map(([nome, dados]) => ({
      nome,
      ...dados
    }));
    
    if (relatorioProfissional !== 'todos') {
      resultado = resultado.filter(r => r.nome === relatorioProfissional);
    }
    
    // Ordenar por total
    resultado.sort((a, b) => b.total - a.total);
    
    return resultado;
  }, [financeiro, relatorioDataInicio, relatorioDataFim, relatorioProfissional]);
  
  // =====================================
  // FUNÇÕES DE EXPORTAÇÃO
  // =====================================
  const exportarExcel = useCallback(async () => {
    setRelatorioLoading(true);
    try {
      const dados = getRelatorioProfissionais();
      
      // Criar CSV
      let csv = 'Profissional,Quantidade de Serviços,Total (R$)\n';
      dados.forEach(d => {
        csv += `"${d.nome}",${d.qtd},${d.total.toFixed(2)}\n`;
      });
      csv += `\nTOTAL,,${dados.reduce((acc, d) => acc + d.total, 0).toFixed(2)}`;
      
      // Download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `relatorio_profissionais_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
    }
    setRelatorioLoading(false);
  }, [getRelatorioProfissionais]);
  
  const exportarPDF = useCallback(async () => {
    setRelatorioLoading(true);
    try {
      const dados = getRelatorioProfissionais();
      const totalGeral = dados.reduce((acc, d) => acc + d.total, 0);
      
      // Criar HTML para impressão
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Relatório por Profissional</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #2563eb; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #2563eb; color: white; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .total { font-weight: bold; background-color: #e5e7eb; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>Relatório por Profissional</h1>
          <p style="text-align: center; color: #666;">
            Período: ${relatorioDataInicio || 'Início'} até ${relatorioDataFim || 'Hoje'}
          </p>
          <table>
            <thead>
              <tr>
                <th>Profissional</th>
                <th>Quantidade</th>
                <th>Total (R$)</th>
              </tr>
            </thead>
            <tbody>
              ${dados.map(d => `
                <tr>
                  <td>${d.nome}</td>
                  <td>${d.qtd}</td>
                  <td>R$ ${d.total.toFixed(2)}</td>
                </tr>
              `).join('')}
              <tr class="total">
                <td>TOTAL</td>
                <td>${dados.reduce((acc, d) => acc + d.qtd, 0)}</td>
                <td>R$ ${totalGeral.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          <p class="footer">Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}</p>
        </body>
        </html>
      `;
      
      // Abrir em nova janela para impressão
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.print();
      }
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
    }
    setRelatorioLoading(false);
  }, [getRelatorioProfissionais, relatorioDataInicio, relatorioDataFim]);
  
  const getMasterStats = useCallback(() => {
    const hoje = new Date();
    
    const clientesAtivos = saloes.filter(s => s.ativo).length;
    const clientesVencendo = saloes.filter(s => {
      if (!s.dataExpiracao) return false;
      const expiracao = new Date(s.dataExpiracao);
      const diasRestantes = Math.ceil((expiracao.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      return diasRestantes <= 7 && diasRestantes >= 0;
    }).length;
    
    return {
      totalSaloes: saloes.length,
      clientesAtivos,
      clientesVencendo,
      clientesInativos: saloes.filter(s => !s.ativo).length,
    };
  }, [saloes]);
  
  // =====================================
  // RENDER CALENDÁRIO
  // =====================================
  const renderCalendar = useCallback(() => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    
    const days = [];
    
    // Dias vazios no início
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-gray-50 dark:bg-gray-800/50 border-r border-b border-gray-200 dark:border-gray-700"></div>);
    }
    
    // Dias do mês
    for (let d = 1; d <= lastDate; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayAgendamentos = agendamentos.filter(a => a.data === dateStr);
      const isToday = dateStr === todayStr;
      
      days.push(
        <div
          key={d}
          className={cn(
            "h-24 border-r border-b border-gray-200 dark:border-gray-700 p-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
            isToday && "bg-blue-50 dark:bg-blue-900/20"
          )}
          onClick={() => {
            setEditingItem(null);
            agendamentoForm.reset({ ...agendamentoForm.getValues(), data: dateStr, hora: '', clienteNome: '', clienteTelefone: '', servico: '', profissional: '', status: 'Pendente', valor: 0 });
            setShowAgendamentoDialog(true);
          }}
        >
          <span className={cn(
            "text-xs font-medium block text-right mb-1",
            isToday ? "text-blue-600 dark:text-blue-400" : "text-gray-400"
          )}>{d}</span>
          <div className="space-y-0.5 overflow-hidden">
            {dayAgendamentos.slice(0, 3).map(a => (
              <div
                key={a.id}
                className={cn(
                  "text-[10px] px-1 py-0.5 rounded truncate cursor-pointer",
                  a.status === 'Concluido' ? 'bg-green-200 text-green-800 dark:bg-green-800/40 dark:text-green-300 font-medium' :
                  a.status === 'Confirmado' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                  a.status === 'Cancelado' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingItem(a);
                  agendamentoForm.reset({
                    data: a.data,
                    hora: a.hora,
                    clienteNome: a.clienteNome,
                    clienteTelefone: a.clienteTelefone || '',
                    servico: a.servico,
                    profissional: a.profissional,
                    status: a.status,
                    valor: a.valor || 0,
                  });
                  setShowAgendamentoDialog(true);
                }}
              >
                {a.hora?.slice(0, 5)} {a.clienteNome}
              </div>
            ))}
            {dayAgendamentos.length > 3 && (
              <div className="text-[10px] text-gray-500 text-center">+{dayAgendamentos.length - 3}</div>
            )}
          </div>
        </div>
      );
    }
    
    return days;
  }, [currentCalendarDate, agendamentos, agendamentoForm]);
  
  // =====================================
  // HELPERS
  // =====================================
  const openEditDialog = useCallback((type: string, item: any) => {
    setEditingItem(item);
    
    switch (type) {
      case 'salao':
        salaoForm.reset({
          nome: item.nome,
          usuario: item.usuario,
          senha: item.senha,
          plano: item.plano || 'basico',
          dataExpiracao: item.dataExpiracao?.split('T')[0] || '',
        });
        setShowSalaoDialog(true);
        break;
      case 'cliente':
        clienteForm.reset({
          ...item,
          email: item.email || '',
          telefone: item.telefone || '',
          endereco: item.endereco || '',
          numero: item.numero || '',
          bairro: item.bairro || '',
          cidade: item.cidade || '',
          estado: item.estado || '',
          cep: item.cep || '',
        });
        setShowClienteDialog(true);
        break;
      case 'profissional':
        profissionalForm.reset({
          ...item,
          email: item.email || '',
          celular: item.celular || '',
          fixo: item.fixo || '',
          endereco: item.endereco || '',
          numero: item.numero || '',
          bairro: item.bairro || '',
          cidade: item.cidade || '',
          estado: item.estado || '',
          cep: item.cep || '',
        });
        setShowProfissionalDialog(true);
        break;
      case 'servico':
        servicoForm.reset({
          nome: item.nome,
          preco: item.preco,
          duracao: item.duracao || 30,
        });
        setShowServicoDialog(true);
        break;
      case 'agendamento':
        agendamentoForm.reset({
          ...item,
          clienteTelefone: item.clienteTelefone || '',
          valor: item.valor || 0,
        });
        setShowAgendamentoDialog(true);
        break;
      case 'financeiro':
        financeiroForm.reset({
          ...item,
          formaPagamento: item.formaPagamento || '',
          observacoes: item.observacoes || '',
        });
        setShowFinanceiroDialog(true);
        break;
    }
  }, [salaoForm, clienteForm, profissionalForm, servicoForm, agendamentoForm, financeiroForm]);
  
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'Pendente': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'Confirmado': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Concluido': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Cancelado': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return styles[status] || styles['Pendente'];
  };
  
  const getPlanoBadge = (plano: string) => {
    const styles: Record<string, string> = {
      'basico': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      'profissional': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'premium': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    };
    return styles[plano] || styles['basico'];
  };
  
  // =====================================
  // RENDER TELA DE LOGIN
  // =====================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 p-4">
        <Card className="w-full max-w-md shadow-2xl border-blue-200 dark:border-blue-800">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
              <Scissors className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-blue-600">
              Salon System
            </CardTitle>
            <CardDescription>
              Sistema de Gestão para Salões de Beleza
            </CardDescription>
            <div className={cn(
              "absolute top-4 right-4 flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full",
              connectionStatus === 'online' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            )}>
              <div className={cn(
                "w-2 h-2 rounded-full",
                connectionStatus === 'online' ? "bg-green-500" : "bg-red-500 animate-pulse"
              )} />
              {connectionStatus === 'online' ? 'Online' : 'Offline'}
            </div>
          </CardHeader>
          <CardContent>
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="usuario"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Usuário</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite seu usuário" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="senha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {loginError && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {loginError}
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={loading}
                >
                  {loading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
            </Form>
            
            <div className="mt-6 pt-6 border-t dark:border-gray-700 text-center">
              <Button 
                variant="link" 
                className="text-sm text-muted-foreground"
                onClick={() => setShowAlterarSenha(true)}
              >
                Esqueci minha senha
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Dialog Alterar Senha no Login */}
        <Dialog open={showAlterarSenha} onOpenChange={setShowAlterarSenha}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Recuperar Senha</DialogTitle>
              <DialogDescription>
                Entre em contato com o administrador do sistema para redefinir sua senha.
              </DialogDescription>
            </DialogHeader>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Se você é o administrador master, acesse o sistema com suas credenciais atuais e altere a senha nas configurações.</p>
              <p>Se esqueceu sua senha de salão, entre em contato com o administrador master do sistema.</p>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowAlterarSenha(false)}>Entendi</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
  
  // =====================================
  // RENDER TELA DE ACESSO EXPIRADO
  // =====================================
  if (isExpired && tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        <Card className="w-full max-w-md shadow-2xl border-red-100 dark:border-red-900">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-red-600">
              Acesso Expirado
            </CardTitle>
            <CardDescription>
              O período de acesso da sua empresa expirou
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-center">
              <p className="font-medium">{tenant.nome}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Expirou em: {tenant.dataExpiracao ? format(new Date(tenant.dataExpiracao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'N/A'}
              </p>
            </div>
            
            <p className="text-sm text-muted-foreground text-center">
              Entre em contato com o administrador do sistema para renovar seu acesso.
            </p>
            
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // =====================================
  // SIDEBAR COMPONENT
  // =====================================
  const Sidebar = () => {
    const menuItems = isMaster ? [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'saloes', label: 'Salões', icon: Building2 },
    ] : [
      { id: 'agenda', label: 'Agenda', icon: Calendar },
      { id: 'clientes', label: 'Clientes', icon: Users },
      { id: 'profissionais', label: 'Profissionais', icon: UserCheck },
      { id: 'servicos', label: 'Serviços', icon: Scissors },
      { id: 'produtos', label: 'Estoque', icon: Package },
      { id: 'pdv', label: 'Vendas (PDV)', icon: ShoppingCart },
      { id: 'caixa', label: 'Caixa', icon: Wallet },
      { id: 'comissoes', label: 'Comissões', icon: Percent },
      { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
    ];
    
    return (
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r dark:border-gray-800 transition-transform duration-300 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between h-16 px-4 border-b dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Scissors className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-blue-600">
              Salon System
            </span>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <ScrollArea className="flex-1 h-[calc(100vh-4rem)]">
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3",
                  currentView === item.id && "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                )}
                onClick={() => setCurrentView(item.id as any)}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Button>
            ))}
          </nav>
        </ScrollArea>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t dark:border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Tema</span>
            <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <div className={cn(
              "w-2 h-2 rounded-full",
              connectionStatus === 'online' ? "bg-green-500" : "bg-red-500"
            )} />
            <span className="text-xs text-muted-foreground">
              {connectionStatus === 'online' ? 'Online' : 'Offline'}
            </span>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start mb-2 text-muted-foreground"
            onClick={() => setShowAlterarSenha(true)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Alterar Senha
          </Button>
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </aside>
    );
  };
  
  // =====================================
  // RENDER DASHBOARD MASTER
  // =====================================
  const renderMasterDashboard = () => {
    const stats = getMasterStats();
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Salões</p>
                  <p className="text-2xl font-bold">{stats.totalSaloes}</p>
                </div>
                <Building2 className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ativos</p>
                  <p className="text-2xl font-bold text-green-600">{stats.clientesAtivos}</p>
                </div>
                <Check className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Vencendo (7 dias)</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.clientesVencendo}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Inativos</p>
                  <p className="text-2xl font-bold text-red-600">{stats.clientesInativos}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-200" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };
  
  // =====================================
  // RENDER LISTA DE SALÕES
  // =====================================
  const renderSaloes = () => {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Gerenciar Salões</CardTitle>
          <Button onClick={() => {
            setEditingItem(null);
            salaoForm.reset({ nome: '', usuario: '', senha: '', plano: 'basico', dataExpiracao: '' });
            setShowSalaoDialog(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Novo
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 text-muted-foreground font-medium">Nome</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Usuário</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Plano</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Expiração</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                  <th className="text-right p-3 text-muted-foreground font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {saloes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-8 text-muted-foreground">
                      Nenhum salão cadastrado
                    </td>
                  </tr>
                ) : (
                  saloes.map((salao: any) => {
                    const diasRestantes = salao.dataExpiracao 
                      ? Math.ceil((new Date(salao.dataExpiracao).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                      : null;
                    
                    return (
                      <tr key={salao.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="p-3 font-medium">{salao.nome}</td>
                        <td className="p-3 text-muted-foreground">{salao.usuario}</td>
                        <td className="p-3">
                          <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getPlanoBadge(salao.plano || 'basico'))}>
                            {salao.plano || 'Básico'}
                          </span>
                        </td>
                        <td className="p-3">
                          <div>
                            {salao.dataExpiracao ? format(new Date(salao.dataExpiracao), 'dd/MM/yyyy') : '-'}
                            {diasRestantes !== null && diasRestantes <= 7 && diasRestantes > 0 && (
                              <span className="ml-2 text-xs text-orange-600">({diasRestantes} dias)</span>
                            )}
                            {diasRestantes !== null && diasRestantes <= 0 && (
                              <span className="ml-2 text-xs text-red-600">(Expirado)</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            salao.ativo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          )}>
                            {salao.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog('salao', salao)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => setDeleteConfirm({ type: 'salao', id: salao.id })}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  // =====================================
  // RENDER AGENDA
  // =====================================
  const renderAgenda = () => {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setCurrentCalendarDate(subMonths(currentCalendarDate, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <CardTitle className="min-w-[150px] text-center">
              {format(currentCalendarDate, 'MMMM yyyy', { locale: ptBR })}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setCurrentCalendarDate(addMonths(currentCalendarDate, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Button onClick={() => {
            setEditingItem(null);
            agendamentoForm.reset({ data: format(new Date(), 'yyyy-MM-dd'), hora: '', clienteNome: '', clienteTelefone: '', servico: '', profissional: '', status: 'Pendente' });
            setShowAgendamentoDialog(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Novo
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-7 border-b">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
              <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground border-r last:border-r-0">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {renderCalendar()}
          </div>
        </CardContent>
      </Card>
    );
  };
  
  // =====================================
  // RENDER CLIENTES
  // =====================================
  const renderClientes = () => {
    // Filtrar clientes pela busca
    const clientesFiltrados = clientes.filter((cliente: any) => {
      if (!buscaCliente) return true;
      const termo = buscaCliente.toLowerCase();
      return (
        cliente.nome?.toLowerCase().includes(termo) ||
        cliente.telefone?.includes(termo) ||
        cliente.email?.toLowerCase().includes(termo) ||
        cliente.cidade?.toLowerCase().includes(termo)
      );
    });
    
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Clientes ({clientesFiltrados.length} de {clientes.length})</CardTitle>
          <Button onClick={() => {
            setEditingItem(null);
            clienteForm.reset({ nome: '', telefone: '', email: '', endereco: '', numero: '', bairro: '', cidade: '', estado: '', cep: '', observacoes: '' });
            setShowClienteDialog(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Novo
          </Button>
        </CardHeader>
        <CardContent>
          {/* Campo de Busca */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, telefone, email ou cidade..."
                value={buscaCliente}
                onChange={(e) => setBuscaCliente(e.target.value)}
                className="pl-10"
              />
              {buscaCliente && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setBuscaCliente('')}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 text-muted-foreground font-medium">Nome</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Telefone</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Email</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Cidade/UF</th>
                  <th className="text-right p-3 text-muted-foreground font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {clientesFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center p-8 text-muted-foreground">
                      {buscaCliente ? 'Nenhum cliente encontrado para esta busca' : 'Nenhum cliente cadastrado'}
                    </td>
                  </tr>
                ) : (
                  clientesFiltrados.map((cliente: any) => (
                    <tr key={cliente.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="p-3 font-medium">
                        {cliente.nome}
                        {cliente.observacoes && (
                          <span className="block text-xs text-muted-foreground mt-1 truncate max-w-[200px]">
                            {cliente.observacoes}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-muted-foreground">{cliente.telefone || '-'}</td>
                      <td className="p-3 text-muted-foreground">{cliente.email || '-'}</td>
                      <td className="p-3 text-muted-foreground">
                        {cliente.cidade || '-'}{cliente.estado ? `/${cliente.estado}` : ''}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Ver histórico"
                            onClick={() => {
                              setClienteSelecionado(cliente);
                              setShowClienteHistorico(true);
                            }}
                          >
                            <Eye className="w-4 h-4 text-blue-500" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog('cliente', cliente)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-500" onClick={() => setDeleteConfirm({ type: 'cliente', id: cliente.id })}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  // =====================================
  // RENDER PROFISSIONAIS
  // =====================================
  const renderProfissionais = () => {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Profissionais</CardTitle>
          <Button onClick={() => {
            setEditingItem(null);
            profissionalForm.reset({ nome: '', celular: '', fixo: '', email: '', endereco: '', numero: '', bairro: '', cidade: '', estado: '', cep: '', status: 'ativo' });
            setShowProfissionalDialog(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Novo
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 text-muted-foreground font-medium">Nome</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Celular</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Fixo</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                  <th className="text-right p-3 text-muted-foreground font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {profissionais.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center p-8 text-muted-foreground">
                      Nenhum profissional cadastrado
                    </td>
                  </tr>
                ) : (
                  profissionais.map((prof: any) => (
                    <tr key={prof.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="p-3 font-medium">{prof.nome}</td>
                      <td className="p-3 text-muted-foreground">{prof.celular || '-'}</td>
                      <td className="p-3 text-muted-foreground">{prof.fixo || '-'}</td>
                      <td className="p-3">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          prof.status === 'ativo' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        )}>
                          {prof.status === 'ativo' ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog('profissional', prof)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-500" onClick={() => setDeleteConfirm({ type: 'profissional', id: prof.id })}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  // =====================================
  // RENDER SERVIÇOS
  // =====================================
  const renderServicos = () => {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Serviços</CardTitle>
          <Button onClick={() => {
            setEditingItem(null);
            servicoForm.reset({ nome: '', preco: 0, duracao: 30 });
            setShowServicoDialog(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Novo
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 text-muted-foreground font-medium">Nome</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Preço</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Duração</th>
                  <th className="text-right p-3 text-muted-foreground font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {servicos.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center p-8 text-muted-foreground">
                      Nenhum serviço cadastrado
                    </td>
                  </tr>
                ) : (
                  servicos.map((servico: any) => (
                    <tr key={servico.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="p-3 font-medium">{servico.nome}</td>
                      <td className="p-3 text-muted-foreground">R$ {parseFloat(servico.preco).toFixed(2)}</td>
                      <td className="p-3 text-muted-foreground">{servico.duracao || 30} min</td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog('servico', servico)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-500" onClick={() => setDeleteConfirm({ type: 'servico', id: servico.id })}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  // =====================================
  // RENDER FINANCEIRO
  // =====================================
  const renderFinanceiro = () => {
    const stats = getSalonStats();
    const chartData = getChartData();
    
    return (
      <div className="space-y-6">
        {/* Cards do Dia */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-muted-foreground">Hoje</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-green-200 dark:border-green-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Entradas (Dia)</p>
                    <p className="text-2xl font-bold text-green-600">R$ {stats.entradasDia.toFixed(2)}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-red-200 dark:border-red-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Saídas (Dia)</p>
                    <p className="text-2xl font-bold text-red-600">R$ {stats.saidasDia.toFixed(2)}</p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-red-400" />
                </div>
              </CardContent>
            </Card>
            <Card className={cn(stats.saldoDia >= 0 ? "border-blue-200 dark:border-blue-800" : "border-red-200 dark:border-red-800")}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Saldo (Dia)</p>
                    <p className={cn("text-2xl font-bold", stats.saldoDia >= 0 ? "text-blue-600" : "text-red-600")}>
                      R$ {stats.saldoDia.toFixed(2)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Cards do Mês */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-muted-foreground">Este Mês</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Entradas (Mês)</p>
                    <p className="text-2xl font-bold text-green-600">R$ {stats.entradasMes.toFixed(2)}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-200" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Saídas (Mês)</p>
                    <p className="text-2xl font-bold text-red-600">R$ {stats.saidasMes.toFixed(2)}</p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-red-200" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Saldo (Mês)</p>
                    <p className={cn("text-2xl font-bold", stats.saldoMes >= 0 ? "text-green-600" : "text-red-600")}>
                      R$ {stats.saldoMes.toFixed(2)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Evolução (Últimos 7 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                  <Bar dataKey="entradas" fill="#22c55e" name="Entradas" />
                  <Bar dataKey="saidas" fill="#ef4444" name="Saídas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Seção de Relatórios */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Relatório por Profissional
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <Label className="text-sm text-muted-foreground">Profissional</Label>
                <Select value={relatorioProfissional} onValueChange={setRelatorioProfissional}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {profissionais.filter((p: any) => p.status === 'ativo').map((p: any) => (
                      <SelectItem key={p.id} value={p.nome}>{p.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Data Início</Label>
                <Input 
                  type="date" 
                  value={relatorioDataInicio} 
                  onChange={(e) => setRelatorioDataInicio(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Data Fim</Label>
                <Input 
                  type="date" 
                  value={relatorioDataFim} 
                  onChange={(e) => setRelatorioDataFim(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex items-end gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setRelatorioProfissional('todos');
                    setRelatorioDataInicio('');
                    setRelatorioDataFim('');
                  }}
                >
                  <X className="w-4 h-4 mr-1" />
                  Limpar
                </Button>
              </div>
            </div>
            
            {/* Tabela do Relatório */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 text-muted-foreground font-medium">Profissional</th>
                    <th className="text-center p-3 text-muted-foreground font-medium">Qtd Serviços</th>
                    <th className="text-right p-3 text-muted-foreground font-medium">Total (R$)</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const dados = getRelatorioProfissionais();
                    if (dados.length === 0) {
                      return (
                        <tr>
                          <td colSpan={3} className="text-center p-8 text-muted-foreground">
                            Nenhum registro encontrado para os filtros selecionados
                          </td>
                        </tr>
                      );
                    }
                    return (
                      <>
                        {dados.map((d, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="p-3 font-medium">{d.nome}</td>
                            <td className="p-3 text-center">{d.qtd}</td>
                            <td className="p-3 text-right text-green-600 font-bold">
                              R$ {d.total.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-blue-50 dark:bg-blue-900/20 font-bold">
                          <td className="p-3">TOTAL</td>
                          <td className="p-3 text-center">
                            {dados.reduce((acc, d) => acc + d.qtd, 0)}
                          </td>
                          <td className="p-3 text-right text-blue-600">
                            R$ {dados.reduce((acc, d) => acc + d.total, 0).toFixed(2)}
                          </td>
                        </tr>
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>
            
            {/* Botões de Exportação */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={exportarExcel}
                disabled={relatorioLoading}
                className="flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Exportar Excel
              </Button>
              <Button 
                variant="outline" 
                onClick={exportarPDF}
                disabled={relatorioLoading}
                className="flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Exportar PDF
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Movimentações</CardTitle>
            <Button onClick={() => {
              setEditingItem(null);
              financeiroForm.reset({ data: format(new Date(), 'yyyy-MM-dd'), descricao: '', tipo: 'entrada', valor: 0, formaPagamento: '', observacoes: '' });
              setShowFinanceiroDialog(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Nova
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 text-muted-foreground font-medium">Data</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Descrição</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Pagamento</th>
                    <th className="text-right p-3 text-muted-foreground font-medium">Valor</th>
                    <th className="text-right p-3 text-muted-foreground font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {financeiro.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center p-8 text-muted-foreground">
                        Nenhuma movimentação cadastrada
                      </td>
                    </tr>
                  ) : (
                    financeiro.map((fin: any) => (
                      <tr key={fin.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="p-3">{fin.data ? format(new Date(fin.data), 'dd/MM/yyyy') : '-'}</td>
                        <td className="p-3">{fin.descricao}</td>
                        <td className="p-3">
                          {fin.tipo === 'entrada' && fin.formaPagamento && (
                            <span className="flex items-center gap-1 text-sm text-muted-foreground">
                              <CreditCard className="w-3 h-3" />
                              {fin.formaPagamento}
                            </span>
                          )}
                        </td>
                        <td className={cn("p-3 text-right font-medium", fin.tipo === 'entrada' ? "text-green-600" : "text-red-600")}>
                          {fin.tipo === 'entrada' ? '+' : '-'} R$ {parseFloat(fin.valor).toFixed(2)}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog('financeiro', fin)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => setDeleteConfirm({ type: 'financeiro', id: fin.id })}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };
  

  // =====================================
  // RENDER ESTOQUE (PRODUTOS)
  // =====================================
  const renderProdutos = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Controle de Estoque</h2>
          <Button onClick={() => {
            setEditingItem(null);
            produtoForm.reset({ nome: '', descricao: '', precoVenda: 0, precoCusto: 0, quantidadeEstoque: 0, estoqueMinimo: 0 });
            setShowProdutoDialog(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Produto
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Itens</p>
                <p className="text-2xl font-bold">{produtos.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estoque Baixo</p>
                <p className="text-2xl font-bold text-red-600">
                  {produtos.filter(p => p.quantidadeEstoque <= p.estoqueMinimo).length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor em Estoque</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {produtos.reduce((acc, p) => acc + (p.precoCusto * p.quantidadeEstoque), 0).toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium">Produto</th>
                    <th className="text-center p-4 font-medium">Qtd. Atual</th>
                    <th className="text-center p-4 font-medium">Mínimo</th>
                    <th className="text-right p-4 font-medium">Preço Custo</th>
                    <th className="text-right p-4 font-medium">Preço Venda</th>
                    <th className="text-right p-4 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {produtos.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center p-8 text-muted-foreground">Nenhum produto cadastrado</td>
                    </tr>
                  ) : (
                    produtos.map((p: any) => (
                      <tr key={p.id} className="border-b hover:bg-muted/20">
                        <td className="p-4">
                          <div className="font-medium">{p.nome}</div>
                          <div className="text-xs text-muted-foreground">{p.descricao}</div>
                        </td>
                        <td className="p-4 text-center">
                          <Badge variant={p.quantidadeEstoque <= p.estoqueMinimo ? "destructive" : "secondary"}>
                            {p.quantidadeEstoque}
                          </Badge>
                        </td>
                        <td className="p-4 text-center text-muted-foreground">{p.estoqueMinimo}</td>
                        <td className="p-4 text-right">R$ {parseFloat(p.precoCusto || 0).toFixed(2)}</td>
                        <td className="p-4 text-right font-medium">R$ {parseFloat(p.precoVenda || 0).toFixed(2)}</td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => {
                              setEditingItem(p);
                              produtoForm.reset(p);
                              setShowProdutoDialog(true);
                            }}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => setDeleteConfirm({ type: 'produtos', id: p.id })}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // =====================================
  // RENDER CAIXA
  // =====================================
  const renderCaixa = () => {
    const hoje = format(new Date(), 'yyyy-MM-dd');
    
    // Filtrar movimentações do dia
    const movimentacoesDia = financeiro.filter(f => f.data === hoje);
    const entradasDia = movimentacoesDia.filter(f => f.tipo === 'entrada').reduce((acc, f) => acc + f.valor, 0);
    const saidasDia = movimentacoesDia.filter(f => f.tipo === 'saida').reduce((acc, f) => acc + f.valor, 0);
    const saldoDia = entradasDia - saidasDia;

    // Calcular formas de pagamento
    const formasPagamento = movimentacoesDia
      .filter(f => f.tipo === 'entrada' && f.formaPagamento)
      .reduce((acc, f) => {
        acc[f.formaPagamento] = (acc[f.formaPagamento] || 0) + f.valor;
        return acc;
      }, {} as Record<string, number>);

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Caixa do Dia</h2>
          <div className="flex gap-2">
            {caixaAberto ? (
              <Button 
                variant="destructive" 
                onClick={() => {
                  if (confirm('Deseja fechar o caixa?')) {
                    setCaixaAberto(false);
                    alert(`Caixa fechado!\nSaldo final: R$ ${(caixaValorAbertura + saldoDia).toFixed(2)}`);
                  }
                }}
              >
                Fechar Caixa
              </Button>
            ) : (
              <Button onClick={() => setShowCaixaDialog(true)}>
                Abrir Caixa
              </Button>
            )}
          </div>
        </div>

        {/* Status do Caixa */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className={caixaAberto ? "border-green-500" : "border-red-500"}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", caixaAberto ? "bg-green-100" : "bg-red-100")}>
                  <Wallet className={cn("w-6 h-6", caixaAberto ? "text-green-600" : "text-red-600")} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className={cn("font-bold", caixaAberto ? "text-green-600" : "text-red-600")}>
                    {caixaAberto ? 'ABERTO' : 'FECHADO'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Abertura</p>
                  <p className="font-bold text-blue-600">R$ {caixaValorAbertura.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Entradas</p>
                  <p className="font-bold text-green-600">R$ {entradasDia.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100">
                  <TrendingDown className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Saídas</p>
                  <p className="font-bold text-red-600">R$ {saidasDia.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Saldo Total */}
        <Card className="bg-gradient-to-r from-primary/10 to-accent/10">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Saldo Atual do Caixa</p>
                <p className="text-4xl font-bold text-primary">
                  R$ {(caixaValorAbertura + saldoDia).toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Data</p>
                <p className="text-lg font-semibold">{format(new Date(), "dd/MM/yyyy")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formas de Pagamento */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Formas de Pagamento (Hoje)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(formasPagamento).map(([forma, valor]) => (
                <div key={forma} className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">{forma}</p>
                  <p className="text-lg font-bold">R$ {valor.toFixed(2)}</p>
                </div>
              ))}
              {Object.keys(formasPagamento).length === 0 && (
                <div className="col-span-full text-center text-muted-foreground py-4">
                  Nenhuma venda registrada hoje
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Movimentações do Dia */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Movimentações do Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {movimentacoesDia.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Nenhuma movimentação registrada hoje
                </div>
              ) : (
                movimentacoesDia.map((mov, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{mov.descricao}</p>
                      <p className="text-sm text-muted-foreground">
                        {mov.formaPagamento || '-'}
                      </p>
                    </div>
                    <p className={cn("font-bold", mov.tipo === 'entrada' ? "text-green-600" : "text-red-600")}>
                      {mov.tipo === 'entrada' ? '+' : '-'} R$ {mov.valor.toFixed(2)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // =====================================
  // RENDER COMISSÕES
  // =====================================
  const renderComissoes = () => {
    const comissoesData = profissionais.map(prof => {
      const servicosProf = agendamentos.filter(a => a.profissionalId === prof.id && a.status === 'Concluido');
      const totalGerado = servicosProf.reduce((acc, a) => acc + (a.valor || 0), 0);
      const comissao = prof.tipoComissao === 'percentual' 
        ? (totalGerado * (prof.percentualComissao || 0)) / 100 
        : servicosProf.length * (prof.percentualComissao || 0);
      
      return {
        ...prof,
        totalGerado,
        comissao,
        qtdServicos: servicosProf.length
      };
    });

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Relatório de Comissões</h2>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-blue-600 text-white">
            <CardContent className="p-6">
              <p className="text-blue-100 text-sm">Total Gerado (Mês)</p>
              <p className="text-3xl font-bold">R$ {comissoesData.reduce((acc, c) => acc + c.totalGerado, 0).toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card className="bg-orange-500 text-white">
            <CardContent className="p-6">
              <p className="text-orange-100 text-sm">Total Comissões</p>
              <p className="text-3xl font-bold">R$ {comissoesData.reduce((acc, c) => acc + c.comissao, 0).toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card className="bg-green-600 text-white">
            <CardContent className="p-6">
              <p className="text-green-100 text-sm">Lucro Líquido (Serviços)</p>
              <p className="text-3xl font-bold">R$ {(comissoesData.reduce((acc, c) => acc + c.totalGerado, 0) - comissoesData.reduce((acc, c) => acc + c.comissao, 0)).toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Comissões por Profissional</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium">Profissional</th>
                    <th className="text-center p-4 font-medium">Serviços</th>
                    <th className="text-right p-4 font-medium">Total Gerado</th>
                    <th className="text-center p-4 font-medium">Regra</th>
                    <th className="text-right p-4 font-medium">Comissão</th>
                    <th className="text-right p-4 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {comissoesData.map((c: any) => (
                    <tr key={c.id} className="border-b hover:bg-muted/20">
                      <td className="p-4 font-medium">{c.nome}</td>
                      <td className="p-4 text-center">{c.qtdServicos}</td>
                      <td className="p-4 text-right">R$ {c.totalGerado.toFixed(2)}</td>
                      <td className="p-4 text-center">
                        <Badge variant="outline">
                          {c.tipoComissao === 'percentual' ? `${c.percentualComissao}%` : `R$ ${c.percentualComissao} fixo`}
                        </Badge>
                      </td>
                      <td className="p-4 text-right font-bold text-orange-600">R$ {c.comissao.toFixed(2)}</td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="sm">Ver Detalhes</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const addToCart = (item: any, type: 'servico' | 'produto') => {
    setPdvCarrinho(prev => {
      const existing = prev.find(i => i.id === item.id && i.type === type);
      if (existing) {
        return prev.map(i => i.id === item.id && i.type === type ? { ...i, qtd: i.qtd + 1 } : i);
      }
      return [...prev, { ...item, type, qtd: 1 }];
    });
  };

  const removeFromCart = (id: string, type: string) => {
    setPdvCarrinho(prev => prev.filter(i => !(i.id === id && i.type === type)));
  };

  const updateCartQtd = (id: string, type: string, delta: number) => {
    setPdvCarrinho(prev => prev.map(i => {
      if (i.id === id && i.type === type) {
        const newQtd = Math.max(1, i.qtd + delta);
        return { ...i, qtd: newQtd };
      }
      return i;
    }));
  };

  // =====================================
  // RENDER PDV (PONTO DE VENDA)
  // =====================================
  const renderPDV = () => {
    const pdvTotal = pdvCarrinho.reduce((acc, item) => {
      const preco = item.type === "servico" ? parseFloat(item.preco) : parseFloat(item.precoVenda);
      return acc + (preco * item.qtd);
    }, 0);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
        {/* Lado Esquerdo: Seleção de Itens */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-10" placeholder="Buscar serviço ou produto..." />
            </div>
            <Tabs value={pdvActiveTab} onValueChange={setPdvActiveTab} className="w-auto">
              <TabsList>
                <TabsTrigger value="servicos">Serviços</TabsTrigger>
                <TabsTrigger value="produtos">Produtos</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <ScrollArea className="flex-1 border rounded-xl p-4 bg-white dark:bg-gray-900 shadow-inner">
            <Tabs value={pdvActiveTab} className="w-full">
              <TabsContent value="servicos" className="mt-0">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {servicos.map(s => (
                    <button 
                      key={s.id}
                      className="p-4 rounded-xl border-2 border-transparent hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left group relative overflow-hidden"
                      onClick={() => addToCart(s, "servico")}
                    >
                      <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="w-4 h-4 text-blue-600" />
                      </div>
                      <Scissors className="w-6 h-6 text-blue-600 mb-2" />
                      <div className="font-bold truncate">{s.nome}</div>
                      <div className="text-blue-600 font-bold">R$ {parseFloat(s.preco).toFixed(2)}</div>
                    </button>
                  ))}
                  {servicos.length === 0 && (
                    <div className="col-span-full text-center py-8 text-muted-foreground">Nenhum serviço cadastrado</div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="produtos" className="mt-0">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {produtos.map(p => (
                    <button 
                      key={p.id}
                      className="p-4 rounded-xl border-2 border-transparent hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all text-left group relative overflow-hidden"
                      onClick={() => addToCart(p, "produto")}
                    >
                      <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="w-4 h-4 text-green-600" />
                      </div>
                      <Package className="w-6 h-6 text-green-600 mb-2" />
                      <div className="font-bold truncate">{p.nome}</div>
                      <div className="text-green-600 font-bold">R$ {parseFloat(p.precoVenda).toFixed(2)}</div>
                    </button>
                  ))}
                  {produtos.length === 0 && (
                    <div className="col-span-full text-center py-8 text-muted-foreground">Nenhum produto cadastrado</div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </ScrollArea>
        </div>

        {/* Lado Direito: Carrinho e Pagamento */}
        <Card className="flex flex-col shadow-xl border-2 border-blue-100 dark:border-blue-900/30">
          <CardHeader className="bg-blue-600 text-white rounded-t-lg py-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShoppingCart className="w-5 h-5" />
              Venda Atual
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-4 flex flex-col gap-4 overflow-hidden">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-full justify-between font-normal",
                      !pdvClienteSelecionado && "text-muted-foreground"
                    )}
                  >
                    {pdvClienteSelecionado 
                      ? pdvClienteSelecionado.nome 
                      : "Buscar cliente por nome ou tel..."}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Digite o nome ou telefone..." 
                      onValueChange={setPdvBuscaCliente}
                    />
                    <CommandList>
                      <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                      <CommandGroup>
                        {clientes
                          .filter(c => 
                            c.nome.toLowerCase().includes(pdvBuscaCliente.toLowerCase()) || 
                            (c.telefone && c.telefone.includes(pdvBuscaCliente))
                          )
                          .slice(0, 10)
                          .map((c) => (
                            <CommandItem
                              key={c.id}
                              value={c.nome}
                              onSelect={() => {
                                setPdvClienteSelecionado(c);
                                setPdvBuscaCliente("");
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  pdvClienteSelecionado?.id === c.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span>{c.nome}</span>
                                <span className="text-xs text-muted-foreground">{c.telefone || "Sem telefone"}</span>
                              </div>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {pdvClienteSelecionado && (
                <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg border border-blue-100 dark:border-blue-900/30">
                  <div className="text-xs">
                    <span className="font-bold text-blue-700 dark:text-blue-400">Selecionado:</span> {pdvClienteSelecionado.nome}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-blue-700"
                    onClick={() => { setPdvClienteSelecionado(null); setPdvCarrinho([]); }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            <Separator />

            <ScrollArea className="flex-1 -mx-2 px-2">
              <div className="space-y-3">
                {pdvCarrinho.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground italic">
                    Carrinho vazio
                  </div>
                ) : (
                  pdvCarrinho.map((item, index) => (
                    <div key={`${item.id}-${item.type}`} className="flex items-center justify-between bg-muted/30 p-2 rounded-lg group">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{item.nome}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.type === 'servico' ? 'Serviço' : 'Produto'} • R$ {(item.type === 'servico' ? parseFloat(item.preco) : parseFloat(item.precoVenda)).toFixed(2)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border rounded-md bg-white dark:bg-gray-800">
                          <button 
                            className="px-2 py-1 hover:bg-muted"
                            onClick={() => updateCartQtd(item.id, item.type, -1)}
                          >-</button>
                          <span className="px-2 text-xs font-bold">{item.qtd}</span>
                          <button 
                            className="px-2 py-1 hover:bg-muted"
                            onClick={() => updateCartQtd(item.id, item.type, 1)}
                          >+</button>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeFromCart(item.id, item.type)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-blue-600">R$ {pdvTotal.toFixed(2)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  className="h-12"
                  onClick={() => { setPdvCarrinho([]); setPdvClienteSelecionado(null); }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpar
                </Button>
                <Button 
                  className="h-12 bg-green-600 hover:bg-green-700 text-white"
                  disabled={pdvCarrinho.length === 0}
                  onClick={() => setShowPdvPagamento(true)}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Finalizar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // =====================================
  // RENDER CONTEÚDO PRINCIPAL
  // =====================================
  const renderContent = () => {
    if (isMaster) {
      switch (currentView) {
        case 'dashboard':
          return renderMasterDashboard();
        case 'saloes':
          return renderSaloes();
        default:
          return renderMasterDashboard();
      }
    }
    
    switch (currentView) {
      case 'agenda':
        return renderAgenda();
      case 'clientes':
        return renderClientes();
      case 'profissionais':
        return renderProfissionais();
      case 'servicos':
        return renderServicos();
      case 'produtos':
        return renderProdutos();
      case 'pdv':
        return renderPDV();
      case 'caixa':
        return renderCaixa();
      case 'comissoes':
        return renderComissoes();
      case 'financeiro':
        return renderFinanceiro();
      default:
        return renderAgenda();
    }
  };
  
  // =====================================
  // RENDER PRINCIPAL
  // =====================================
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-b dark:border-gray-800 flex items-center justify-between px-4 z-40">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
          <Menu className="w-5 h-5" />
        </Button>
        <span className="font-bold text-blue-600">Salon System</span>
        <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
      </div>
      
      {/* Sidebar */}
      <Sidebar />
      
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 p-4 lg:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">
            {isMaster ? (
              currentView === 'dashboard' ? 'Dashboard' : 'Salões'
            ) : (
              currentView === 'agenda' ? 'Agenda' :
              currentView === 'clientes' ? 'Clientes' :
              currentView === 'profissionais' ? 'Profissionais' :
              currentView === 'servicos' ? 'Serviços' :
              currentView === 'produtos' ? 'Estoque' :
              currentView === 'pdv' ? 'Vendas (PDV)' :
              currentView === 'comissoes' ? 'Comissões' :
              currentView === 'financeiro' ? 'Financeiro' : 'Agenda'
            )}
          </h1>
          {!isMaster && tenant && (
            <p className="text-muted-foreground">{tenant.nome}</p>
          )}
        </div>
        
        {renderContent()}
      </main>
      
      {/* Dialogs */}
      
      {/* Salão Dialog */}
      <Dialog open={showSalaoDialog} onOpenChange={setShowSalaoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Salão' : 'Novo Salão'}</DialogTitle>
          </DialogHeader>
          <Form {...salaoForm}>
            <form onSubmit={salaoForm.handleSubmit(handleSaveSalao)} className="space-y-4">
              <FormField
                control={salaoForm.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do salão" {...field} onChange={e => field.onChange(toUpper(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={salaoForm.control}
                  name="usuario"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Usuário</FormLabel>
                      <FormControl>
                        <Input placeholder="Login" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={salaoForm.control}
                  name="senha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input placeholder="Senha" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={salaoForm.control}
                  name="plano"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plano</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="basico">Básico</SelectItem>
                          <SelectItem value="profissional">Profissional</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={salaoForm.control}
                  name="dataExpiracao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Expiração</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
            {/* Cliente Dialog */}
      <Dialog open={showClienteDialog} onOpenChange={setShowClienteDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
          </DialogHeader>
          <Form {...clienteForm}>
            <form onSubmit={clienteForm.handleSubmit(handleSaveCliente)} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={clienteForm.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do cliente" {...field} onChange={e => field.onChange(toUpper(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={clienteForm.control}
                  name="pontosFidelidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pontos Fidelidade</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={clienteForm.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 00000-0000" {...field} onChange={e => field.onChange(maskPhone(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={clienteForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="email@exemplo.com" {...field} onChange={e => field.onChange(toLower(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <FormField
                  control={clienteForm.control}
                  name="endereco"
                  render={({ field }) => (
                    <FormItem className="col-span-3">
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input placeholder="Logradouro" {...field} onChange={e => field.onChange(toUpper(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={clienteForm.control}
                  name="numero"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número</FormLabel>
                      <FormControl>
                        <Input placeholder="Nº" {...field} onChange={e => field.onChange(toUpper(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <FormField
                  control={clienteForm.control}
                  name="bairro"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bairro</FormLabel>
                      <FormControl>
                        <Input placeholder="Bairro" {...field} onChange={e => field.onChange(toUpper(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={clienteForm.control}
                  name="cidade"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Cidade" {...field} onChange={e => field.onChange(toUpper(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={clienteForm.control}
                  name="estado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <FormControl>
                        <Input placeholder="UF" maxLength={2} {...field} onChange={e => field.onChange(toUpper(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <FormField
                  control={clienteForm.control}
                  name="cep"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                        <Input placeholder="00000-000" {...field} onChange={e => field.onChange(maskCep(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={clienteForm.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Informações adicionais sobre o cliente, preferências, histórico de serviços..." 
                        className="min-h-[80px]"
                        {...field} 
                        onChange={e => field.onChange(toUpper(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Profissional Dialog */}
      <Dialog open={showProfissionalDialog} onOpenChange={setShowProfissionalDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Profissional' : 'Novo Profissional'}</DialogTitle>
            <DialogDescription>Cadastre um novo profissional para o salão.</DialogDescription>
          </DialogHeader>
          <Form {...profissionalForm}>
            <form onSubmit={profissionalForm.handleSubmit(handleSaveProfissional)} className="space-y-4">
              <FormField
                control={profissionalForm.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do profissional" {...field} onChange={e => field.onChange(toUpper(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                  control={profissionalForm.control}
                  name="celular"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Celular</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 00000-0000" {...field} onChange={e => field.onChange(maskPhone(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profissionalForm.control}
                  name="fixo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fixo</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 0000-0000" {...field} onChange={e => field.onChange(maskPhone(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profissionalForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="email@exemplo.com" {...field} onChange={e => field.onChange(toLower(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <FormField
                  control={profissionalForm.control}
                  name="endereco"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-3">
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input placeholder="Logradouro" {...field} onChange={e => field.onChange(toUpper(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profissionalForm.control}
                  name="numero"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número</FormLabel>
                      <FormControl>
                        <Input placeholder="Nº" {...field} onChange={e => field.onChange(toUpper(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <FormField
                  control={profissionalForm.control}
                  name="bairro"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bairro</FormLabel>
                      <FormControl>
                        <Input placeholder="Bairro" {...field} onChange={e => field.onChange(toUpper(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profissionalForm.control}
                  name="cidade"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Cidade" {...field} onChange={e => field.onChange(toUpper(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profissionalForm.control}
                  name="estado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <FormControl>
                        <Input placeholder="UF" maxLength={2} {...field} onChange={e => field.onChange(toUpper(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                  control={profissionalForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ativo">Ativo</SelectItem>
                          <SelectItem value="inativo">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profissionalForm.control}
                  name="tipoComissao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo Comissão</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="percentual">Percentual (%)</SelectItem>
                          <SelectItem value="fixo_por_servico">Fixo por Serviço (R$)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profissionalForm.control}
                  name="percentualComissao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor/Perc. Comissão</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Serviço Dialog */}
      <Dialog open={showServicoDialog} onOpenChange={setShowServicoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Serviço' : 'Novo Serviço'}</DialogTitle>
          </DialogHeader>
          <Form {...servicoForm}>
            <form onSubmit={servicoForm.handleSubmit(handleSaveServico)} className="space-y-4">
              <FormField
                control={servicoForm.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do serviço" {...field} onChange={e => field.onChange(toUpper(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={servicoForm.control}
                name="preco"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={servicoForm.control}
                name="duracao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração (minutos)</FormLabel>
                    <FormControl>
                      <Input type="number" step="5" placeholder="30" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 30)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Agendamento Dialog */}
      <Dialog open={showAgendamentoDialog} onOpenChange={setShowAgendamentoDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Agendamento' : 'Novo Agendamento'}</DialogTitle>
            <DialogDescription>Preencha os dados para criar um novo agendamento.</DialogDescription>
          </DialogHeader>
          
          <Form {...agendamentoForm}>
            <form onSubmit={agendamentoForm.handleSubmit(handleSaveAgendamento)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={agendamentoForm.control}
                  name="data"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} min={editingItem ? undefined : format(new Date(), 'yyyy-MM-dd')} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={agendamentoForm.control}
                  name="hora"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={agendamentoForm.control}
                name="clienteNome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select onValueChange={(value) => {
                      field.onChange(value);
                      const cliente = clientes.find((c: any) => c.nome === value);
                      if (cliente) {
                        agendamentoForm.setValue('clienteTelefone', cliente.telefone || '');
                      }
                    }} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clientes.map((c: any) => (
                          <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={agendamentoForm.control}
                name="clienteTelefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="Preenchimento automático" {...field} readOnly />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={agendamentoForm.control}
                name="servico"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serviço</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o serviço" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {servicos.map((s: any) => (
                          <SelectItem key={s.id} value={s.nome}>{s.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={agendamentoForm.control}
                name="profissional"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profissional</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o profissional" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {profissionais.filter((p: any) => p.status === 'ativo').map((p: any) => (
                          <SelectItem key={p.id} value={p.nome}>{p.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={agendamentoForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Pendente">Pendente</SelectItem>
                        <SelectItem value="Confirmado">Confirmado</SelectItem>
                        <SelectItem value="Concluido">Concluído</SelectItem>
                        <SelectItem value="Cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="flex justify-between">
                {editingItem && (
                  <Button type="button" variant="destructive" onClick={() => {
                    setDeleteConfirm({ type: 'agendamento', id: editingItem.id });
                    setShowAgendamentoDialog(false);
                  }}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </Button>
                )}
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Financeiro Dialog */}
      <Dialog open={showFinanceiroDialog} onOpenChange={setShowFinanceiroDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Movimentação' : 'Nova Movimentação'}</DialogTitle>
          </DialogHeader>
          <Form {...financeiroForm}>
            <form onSubmit={financeiroForm.handleSubmit(handleSaveFinanceiro)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={financeiroForm.control}
                  name="data"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={financeiroForm.control}
                  name="valor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={financeiroForm.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input placeholder="Descrição" {...field} onChange={e => field.onChange(toUpper(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={financeiroForm.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="entrada">Entrada</SelectItem>
                          <SelectItem value="saida">Saída</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {financeiroForm.watch('tipo') === 'entrada' && (
                  <FormField
                    control={financeiroForm.control}
                    name="formaPagamento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Forma de Pagamento</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="PIX">PIX</SelectItem>
                            <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                            <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                            <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
              <FormField
                control={financeiroForm.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações / Anotações</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Anotações importantes sobre este lançamento (ex: detalhes do serviço, informações para consulta futura...)" 
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      

      {/* Produto Dialog */}
      <Dialog open={showProdutoDialog} onOpenChange={setShowProdutoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          </DialogHeader>
          <Form {...produtoForm}>
            <form onSubmit={produtoForm.handleSubmit(handleSaveProduto)} className="space-y-4">
              <FormField
                control={produtoForm.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Produto</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Shampoo Pós-Química" {...field} onChange={e => field.onChange(toUpper(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={produtoForm.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input placeholder="Breve descrição" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={produtoForm.control}
                  name="precoCusto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço de Custo</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={produtoForm.control}
                  name="precoVenda"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço de Venda</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={produtoForm.control}
                  name="quantidadeEstoque"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Qtd. em Estoque</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={produtoForm.control}
                  name="estoqueMinimo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estoque Mínimo</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="submit">Salvar Produto</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

            {/* Modal Histórico do Cliente */}
      <Dialog open={showClienteHistorico} onOpenChange={setShowClienteHistorico}>
        <DialogContent className="max-w-4xl w-[90vw]">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Users className="w-4 h-4" />
              Histórico do Cliente
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-foreground">
              {clienteSelecionado?.nome}
            </DialogDescription>
          </DialogHeader>
          
          {clienteSelecionado && (
            <div className="space-y-3">
              {/* Dados do Cliente */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm p-3 bg-muted/50 rounded-lg">
                <div>
                  <span className="text-muted-foreground text-xs">Telefone:</span>
                  <p className="font-medium">{clienteSelecionado.telefone || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Email:</span>
                  <p className="font-medium truncate">{clienteSelecionado.email || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Cidade:</span>
                  <p className="font-medium">
                    {clienteSelecionado.cidade || '-'}{clienteSelecionado.estado ? `/${clienteSelecionado.estado}` : ''}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Endereço:</span>
                  <p className="font-medium text-xs">
                    {clienteSelecionado.endereco || '-'}
                    {clienteSelecionado.numero ? `, ${clienteSelecionado.numero}` : ''}
                  </p>
                </div>
                {clienteSelecionado.observacoes && (
                  <div className="col-span-full pt-2 border-t">
                    <span className="text-muted-foreground text-xs">Observações:</span>
                    <p className="text-xs mt-1">{clienteSelecionado.observacoes}</p>
                  </div>
                )}
              </div>
              
              {/* Agendamentos do Cliente */}
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Agendamentos ({agendamentos.filter((a: any) => a.clienteNome === clienteSelecionado.nome).length})
                </h4>
                <div className="max-h-32 overflow-y-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-background">
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-2 text-xs font-medium">Data</th>
                        <th className="text-left p-2 text-xs font-medium">Serviço</th>
                        <th className="text-left p-2 text-xs font-medium">Profissional</th>
                        <th className="text-left p-2 text-xs font-medium">Status</th>
                        <th className="text-right p-2 text-xs font-medium">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agendamentos
                        .filter((a: any) => a.clienteNome === clienteSelecionado.nome)
                        .sort((a: any, b: any) => b.data.localeCompare(a.data))
                        .slice(0, 5)
                        .map((a: any) => (
                          <tr key={a.id} className="border-b">
                            <td className="p-2 text-xs">{a.data ? format(new Date(a.data), 'dd/MM/yy') : '-'} {a.hora?.slice(0, 5)}</td>
                            <td className="p-2 text-xs">{a.servico}</td>
                            <td className="p-2 text-xs">{a.profissional}</td>
                            <td className="p-2">
                              <Badge className={
                                a.status === 'Concluido' ? 'bg-green-100 text-green-800 text-xs' :
                                a.status === 'Cancelado' ? 'bg-red-100 text-red-800 text-xs' :
                                a.status === 'Confirmado' ? 'bg-blue-100 text-blue-800 text-xs' :
                                'bg-yellow-100 text-yellow-800 text-xs'
                              }>
                                {a.status}
                              </Badge>
                            </td>
                            <td className="p-2 text-right text-xs font-medium">
                              {a.valor ? `R$ ${parseFloat(a.valor).toFixed(2)}` : '-'}
                            </td>
                          </tr>
                        ))
                      }
                      {agendamentos.filter((a: any) => a.clienteNome === clienteSelecionado.nome).length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center p-4 text-muted-foreground text-sm">
                            Nenhum agendamento
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Lançamentos Financeiros do Cliente */}
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Lançamentos Financeiros
                </h4>
                <div className="max-h-32 overflow-y-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-background">
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-2 text-xs font-medium">Data</th>
                        <th className="text-left p-2 text-xs font-medium">Descrição</th>
                        <th className="text-left p-2 text-xs font-medium">Pagamento</th>
                        <th className="text-right p-2 text-xs font-medium">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {financeiro
                        .filter((f: any) => f.descricao?.includes(clienteSelecionado.nome))
                        .sort((a: any, b: any) => b.data.localeCompare(a.data))
                        .slice(0, 5)
                        .map((f: any) => (
                          <tr key={f.id} className="border-b">
                            <td className="p-2 text-xs">{f.data ? format(new Date(f.data), 'dd/MM/yy') : '-'}</td>
                            <td className="p-2 text-xs max-w-[200px] truncate">{f.descricao}</td>
                            <td className="p-2 text-xs">{f.formaPagamento || '-'}</td>
                            <td className={cn("p-2 text-right text-xs font-medium", f.tipo === 'entrada' ? 'text-green-600' : 'text-red-600')}>
                              {f.tipo === 'entrada' ? '+' : '-'} R$ {parseFloat(f.valor).toFixed(2)}
                            </td>
                          </tr>
                        ))
                      }
                      {financeiro.filter((f: any) => f.descricao?.includes(clienteSelecionado.nome)).length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center p-4 text-muted-foreground text-sm">
                            Nenhum lançamento
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Total */}
                <div className="mt-2 pt-2 border-t flex justify-between items-center text-sm">
                  <span className="font-medium">Total gasto:</span>
                  <span className="font-bold text-green-600">
                    R$ {financeiro
                      .filter((f: any) => f.descricao?.includes(clienteSelecionado.nome) && f.tipo === 'entrada')
                      .reduce((acc: number, f: any) => acc + f.valor, 0)
                      .toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Dialog Alterar Senha (dentro do sistema) */}
      <Dialog open={showAlterarSenha && isAuthenticated} onOpenChange={(open) => {
        setShowAlterarSenha(open);
        if (!open) {
          setSenhaError('');
          setSenhaSuccess('');
          setSenhaAtual('');
          setNovaSenha('');
          setConfirmarSenha('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Alterar Senha
            </DialogTitle>
            <DialogDescription>
              {isMaster ? 'Alterar senha do Administrador Master' : `Alterar senha do salão ${tenant?.nome}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="senhaAtual">Senha Atual</Label>
              <Input
                id="senhaAtual"
                type="password"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div>
              <Label htmlFor="novaSenha">Nova Senha</Label>
              <Input
                id="novaSenha"
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div>
              <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
              <Input
                id="confirmarSenha"
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            
            {senhaError && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {senhaError}
              </div>
            )}
            
            {senhaSuccess && (
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm flex items-center gap-2">
                <Check className="w-4 h-4" />
                {senhaSuccess}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAlterarSenha(false);
              setSenhaError('');
              setSenhaSuccess('');
              setSenhaAtual('');
              setNovaSenha('');
              setConfirmarSenha('');
            }}>
              Cancelar
            </Button>
            <Button onClick={handleAlterarSenha}>
              Alterar Senha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* PDV Pagamento Dialog */}
      <Dialog open={showPdvPagamento} onOpenChange={setShowPdvPagamento}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Finalizar Pagamento
            </DialogTitle>
            <DialogDescription>
              Selecione a forma de pagamento para concluir a venda.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-6">
            <div className="text-center p-4 bg-muted/50 rounded-xl border-2 border-dashed border-muted">
              <p className="text-sm text-muted-foreground mb-1">Total a Pagar</p>
              <p className="text-4xl font-black text-blue-600">
                R$ {pdvCarrinho.reduce((acc, item) => {
                  const preco = item.type === "servico" ? parseFloat(item.preco) : parseFloat(item.precoVenda);
                  return acc + (preco * item.qtd);
                }, 0).toFixed(2)}
              </p>
            </div>

            <div className="space-y-3">
              <Label>Forma de Pagamento</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'Dinheiro', icon: DollarSign, color: 'text-green-600' },
                  { id: 'PIX', icon: ArrowUpRight, color: 'text-teal-600' },
                  { id: 'Cartão de Crédito', icon: CreditCard, color: 'text-blue-600' },
                  { id: 'Cartão de Débito', icon: CreditCard, color: 'text-purple-600' }
                ].map((forma) => (
                  <Button
                    key={forma.id}
                    variant={pdvFormaPagamento === forma.id ? "default" : "outline"}
                    className={cn(
                      "h-16 flex flex-col gap-1 items-center justify-center transition-all",
                      pdvFormaPagamento === forma.id ? "ring-2 ring-blue-500 ring-offset-2" : ""
                    )}
                    onClick={() => setPdvFormaPagamento(forma.id)}
                  >
                    <forma.icon className={cn("w-5 h-5", pdvFormaPagamento === forma.id ? "text-white" : forma.color)} />
                    <span className="text-[10px] font-bold uppercase">{forma.id}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPdvPagamento(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white" 
              onClick={() => handleFinalizarVenda(pdvFormaPagamento)}
              disabled={loading}
            >
              {loading ? "Processando..." : "Confirmar e Finalizar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Caixa Dialog - Abrir Caixa */}
      <Dialog open={showCaixaDialog} onOpenChange={setShowCaixaDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              Abrir Caixa
            </DialogTitle>
            <DialogDescription>
              Informe o valor inicial do caixa para começar.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Valor de Abertura</Label>
              <Input 
                type="number" 
                step="0.01"
                placeholder="0.00"
                value={caixaValorAbertura || ''}
                onChange={(e) => setCaixaValorAbertura(parseFloat(e.target.value) || 0)}
                className="text-2xl font-bold h-14 text-center"
              />
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              {[0, 50, 100, 200].map((valor) => (
                <Button 
                  key={valor}
                  variant="outline"
                  onClick={() => setCaixaValorAbertura(valor)}
                >
                  R$ {valor}
                </Button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCaixaDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                setCaixaAberto(true);
                setShowCaixaDialog(false);
              }}
            >
              Abrir Caixa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (deleteConfirm?.type === 'salao') handleDeleteSalao();
              else if (deleteConfirm?.type === 'cliente') handleDeleteCliente();
              else if (deleteConfirm?.type === 'profissional') handleDeleteProfissional();
              else if (deleteConfirm?.type === 'servico') handleDeleteServico();
              else if (deleteConfirm?.type === 'agendamento') handleDeleteAgendamento();
              else if (deleteConfirm?.type === 'financeiro') handleDeleteFinanceiro();
            }} className="bg-red-500 hover:bg-red-600">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
