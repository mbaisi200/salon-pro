import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name?: string;
  password?: string; // Adicionado campo para senha
  role: 'master_admin' | 'tenant_admin' | 'profissional' | 'recepcionista';
  tenantId?: string;
}

interface Tenant {
  id: string;
  nome: string;
  usuario: string;
  senha?: string;
  plano?: string;
  dataExpiracao?: string;
  ativo?: boolean;
  logoUrl?: string;
  coresPersonalizadas?: string;
  [key: string]: any;
}

interface Cliente {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  observacoes?: string;
  pontosFidelidade: number; // Pontos para programa de fidelidade
  tenantId: string;
  [key: string]: any;
}

interface Profissional {
  id: string;
  nome: string;
  celular?: string;
  fixo?: string;
  email?: string;
  endereco?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  status?: string;
  percentualComissao?: number; // Percentual de comissão
  tipoComissao?: 'percentual' | 'fixo_por_servico'; // Tipo de comissão
  tenantId: string;
  [key: string]: any;
}

interface Servico {
  id: string;
  nome: string;
  preco: number;
  duracao: number;
  tenantId: string;
  [key: string]: any;
}

interface Agendamento {
  id: string;
  data: string;
  hora: string;
  clienteNome: string;
  clienteTelefone?: string;
  servicoNome: string;
  profissionalNome: string;
  status: string;
  valor?: number;
  clienteId: string;
  servicoId: string;
  profissionalId: string;
  tenantId: string;
  [key: string]: any;
}

interface Financeiro {
  id: string;
  data: string;
  descricao: string;
  tipo: string;
  valor: number;
  formaPagamento?: string;
  observacoes?: string;
  tenantId: string;
  [key: string]: any;
}

interface Produto {
  id: string;
  nome: string;
  descricao?: string;
  precoVenda: number;
  precoCusto?: number;
  quantidadeEstoque: number;
  estoqueMinimo: number;
  tenantId: string;
  [key: string]: any;
}

interface SalonState {
  // Auth
  user: User | null;
  tenant: Tenant | null;
  isAuthenticated: boolean;
  isExpired: boolean;
  isMaster: boolean;

  // Navigation
  currentView: string;

  // Data - Master
  saloes: Tenant[];

  // Data - Tenant
  clientes: Cliente[];
  profissionais: Profissional[];
  servicos: Servico[];
  agendamentos: Agendamento[];
  financeiro: Financeiro[];
  produtos: Produto[]; // Novo: Produtos para controle de estoque

  // UI State
  sidebarOpen: boolean;
  loading: boolean;
  darkMode: boolean;

  // Actions - Auth
  login: (user: User, tenant: Tenant | null, isMaster: boolean) => void;
  logout: () => void;
  setExpired: (expired: boolean) => void;

  // Actions - Navigation
  setCurrentView: (view: string) => void;

  // Actions - Salões
  setSaloes: (saloes: Tenant[]) => void;
  addSalao: (salao: Tenant) => void;
  updateSalao: (id: string, data: Partial<Tenant>) => void;
  deleteSalao: (id: string) => void;

  // Actions - Clientes
  setClientes: (clientes: Cliente[]) => void;
  addCliente: (cliente: Cliente) => void;
  updateCliente: (id: string, data: Partial<Cliente>) => void;
  deleteCliente: (id: string) => void;

  // Actions - Profissionais
  setProfissionais: (profissionais: Profissional[]) => void;
  addProfissional: (profissional: Profissional) => void;
  updateProfissional: (id: string, data: Partial<Profissional>) => void;
  deleteProfissional: (id: string) => void;

  // Actions - Serviços
  setServicos: (servicos: Servico[]) => void;
  addServico: (servico: Servico) => void;
  updateServico: (id: string, data: Partial<Servico>) => void;
  deleteServico: (id: string) => void;

  // Actions - Agendamentos
  setAgendamentos: (agendamentos: Agendamento[]) => void;
  addAgendamento: (agendamento: Agendamento) => void;
  updateAgendamento: (id: string, data: Partial<Agendamento>) => void;
  deleteAgendamento: (id: string) => void;

  // Actions - Financeiro
  setFinanceiro: (financeiro: Financeiro[]) => void;
  addFinanceiro: (item: Financeiro) => void;
  updateFinanceiro: (id: string, data: Partial<Financeiro>) => void;
  deleteFinanceiro: (id: string) => void;

  // Actions - Produtos (Novo)
  setProdutos: (produtos: Produto[]) => void;
  addProduto: (produto: Produto) => void;
  updateProduto: (id: string, data: Partial<Produto>) => void;
  deleteProduto: (id: string) => void;

  // Actions - UI
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setLoading: (loading: boolean) => void;
  toggleDarkMode: () => void;
}

export const useSalonStore = create<SalonState>()(
  persist(
    (set) => ({
      // Initial State - Auth
      user: null,
      tenant: null,
      isAuthenticated: false,
      isExpired: false,
      isMaster: false,

      // Initial State - Navigation
      currentView: 'dashboard',

      // Initial State - Data
      saloes: [],
      clientes: [],
      profissionais: [],
      servicos: [],
      agendamentos: [],
      financeiro: [],
      produtos: [], // Inicializa array de produtos

      // Initial State - UI
      sidebarOpen: true,
      loading: false,
      darkMode: false,

      // Actions - Auth
      login: (user, tenant, isMaster) => set({
        user,
        tenant,
        isAuthenticated: true,
        isMaster,
        currentView: isMaster ? 'dashboard' : 'agenda'
      }),

      logout: () => set({
        user: null,
        tenant: null,
        isAuthenticated: false,
        isExpired: false,
        isMaster: false,
        currentView: 'dashboard',
        saloes: [],
        clientes: [],
        profissionais: [],
        servicos: [],
        agendamentos: [],
        financeiro: [],
        produtos: [],
      }),

      setExpired: (expired) => set({ isExpired: expired }),

      // Actions - Navigation
      setCurrentView: (view) => set({ currentView: view }),

      // Actions - Salões
      setSaloes: (saloes) => set({ saloes }),
      addSalao: (salao) => set((state) => ({
        saloes: [...state.saloes, salao]
      })),
      updateSalao: (id, data) => set((state) => ({
        saloes: state.saloes.map((s) =>
          s.id === id ? { ...s, ...data } : s
        )
      })),
      deleteSalao: (id) => set((state) => ({
        saloes: state.saloes.filter((s) => s.id !== id)
      })),

      // Actions - Clientes
      setClientes: (clientes) => set({ clientes }),
      addCliente: (cliente) => set((state) => ({
        clientes: [...state.clientes, cliente]
      })),
      updateCliente: (id, data) => set((state) => ({
        clientes: state.clientes.map((c) =>
          c.id === id ? { ...c, ...data } : c
        )
      })),
      deleteCliente: (id) => set((state) => ({
        clientes: state.clientes.filter((c) => c.id !== id)
      })),

      // Actions - Profissionais
      setProfissionais: (profissionais) => set({ profissionais }),
      addProfissional: (profissional) => set((state) => ({
        profissionais: [...state.profissionais, profissional]
      })),
      updateProfissional: (id, data) => set((state) => ({
        profissionais: state.profissionais.map((p) =>
          p.id === id ? { ...p, ...data } : p
        )
      })),
      deleteProfissional: (id) => set((state) => ({
        profissionais: state.profissionais.filter((p) => p.id !== id)
      })),

      // Actions - Serviços
      setServicos: (servicos) => set({ servicos }),
      addServico: (servico) => set((state) => ({
        servicos: [...state.servicos, servico]
      })),
      updateServico: (id, data) => set((state) => ({
        servicos: state.servicos.map((s) =>
          s.id === id ? { ...s, ...data } : s
        )
      })),
      deleteServico: (id) => set((state) => ({
        servicos: state.servicos.filter((s) => s.id !== id)
      })),

      // Actions - Agendamentos
      setAgendamentos: (agendamentos) => set({ agendamentos }),
      addAgendamento: (agendamento) => set((state) => ({
        agendamentos: [...state.agendamentos, agendamento]
      })),
      updateAgendamento: (id, data) => set((state) => ({
        agendamentos: state.agendamentos.map((a) =>
          a.id === id ? { ...a, ...data } : a
        )
      })),
      deleteAgendamento: (id) => set((state) => ({
        agendamentos: state.agendamentos.filter((a) => a.id !== id)
      })),

      // Actions - Financeiro
      setFinanceiro: (financeiro) => set({ financeiro }),
      addFinanceiro: (item) => set((state) => ({
        financeiro: [...state.financeiro, item]
      })),
      updateFinanceiro: (id, data) => set((state) => ({
        financeiro: state.financeiro.map((f) =>
          f.id === id ? { ...f, ...data } : f
        )
      })),
      deleteFinanceiro: (id) => set((state) => ({
        financeiro: state.financeiro.filter((f) => f.id !== id)
      })),

      // Actions - Produtos
      setProdutos: (produtos) => set({ produtos }),
      addProduto: (produto) => set((state) => ({
        produtos: [...state.produtos, produto]
      })),
      updateProduto: (id, data) => set((state) => ({
        produtos: state.produtos.map((p) =>
          p.id === id ? { ...p, ...data } : p
        )
      })),
      deleteProduto: (id) => set((state) => ({
        produtos: state.produtos.filter((p) => p.id !== id)
      })),

      // Actions - UI
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setLoading: (loading) => set({ loading }),
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
    }),
    {
      name: 'salon-storage',
      partialize: (state) => ({
        user: state.user,
        tenant: state.tenant,
        isAuthenticated: state.isAuthenticated,
        isMaster: state.isMaster,
        darkMode: state.darkMode
      }),
    }
  )
);
