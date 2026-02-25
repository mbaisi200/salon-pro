// Tenant (Cliente/Empresa que compra o sistema)
export interface Tenant {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  responsavel: string;
  dataExpiracao: string;
  plano: 'basico' | 'profissional' | 'premium';
  ativo: boolean;
  logo?: string;
  configuracoes?: TenantConfiguracoes;
  createdAt: string;
  updatedAt: string;
}

export interface TenantConfiguracoes {
  corPrimaria?: string;
  corSecundaria?: string;
  moeda?: string;
  fusoHorario?: string;
  idioma?: string;
}

// User (Usuário do sistema)
export interface User {
  id: string;
  email: string;
  senha?: string;
  nome: string;
  role: 'admin' | 'gerente' | 'funcionario';
  tenantId: string;
  ativo: boolean;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

// Servico (Serviços oferecidos pelo salão)
export interface Servico {
  id: string;
  nome: string;
  descricao?: string;
  preco: number;
  duracao: number; // em minutos
  tenantId: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

// Profissional (Profissionais do salão)
export interface Profissional {
  id: string;
  nome: string;
  especialidades: string[];
  telefone?: string;
  email?: string;
  foto?: string;
  tenantId: string;
  ativo: boolean;
  horarios?: HorarioTrabalho[];
  createdAt: string;
  updatedAt: string;
}

export interface HorarioTrabalho {
  diaSemana: number; // 0-6 (domingo a sábado)
  horaInicio: string;
  horaFim: string;
}

// Cliente (Clientes do salão)
export interface Cliente {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
  observacoes?: string;
  tenantId: string;
  dataNascimento?: string;
  createdAt: string;
  updatedAt: string;
}

// Agendamento
export interface Agendamento {
  id: string;
  clienteId: string;
  profissionalId: string;
  servicoId: string;
  dataHora: string;
  status: 'pendente' | 'confirmado' | 'concluido' | 'cancelado';
  valor: number;
  observacoes?: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

// Financeiro
export interface Financeiro {
  id: string;
  tipo: 'receita' | 'despesa';
  descricao: string;
  valor: number;
  data: string;
  categoriaId?: string;
  tenantId: string;
  agendamentoId?: string;
  createdAt: string;
  updatedAt: string;
}

// Categoria Financeira
export interface Categoria {
  id: string;
  nome: string;
  tipo: 'receita' | 'despesa';
  tenantId: string;
  cor?: string;
  createdAt: string;
  updatedAt: string;
}

// Estados da aplicação
export type UserRole = 'master' | 'admin' | 'gerente' | 'funcionario';

export interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  role: UserRole;
  isAuthenticated: boolean;
  isExpired: boolean;
}

export type ViewMode = 'dashboard' | 'agendamentos' | 'clientes' | 'servicos' | 'profissionais' | 'financeiro' | 'configuracoes' | 'tenants' | 'users';

export type AdminViewMode = 'dashboard' | 'tenants' | 'configuracoes';

// Form schemas
export interface LoginFormData {
  email: string;
  senha: string;
}

export interface TenantFormData {
  nome: string;
  responsavel: string;
  email: string;
  telefone: string;
  plano: 'basico' | 'profissional' | 'premium';
  dataExpiracao: string;
}

export interface ServicoFormData {
  nome: string;
  descricao?: string;
  preco: number;
  duracao: number;
  ativo: boolean;
}

export interface ProfissionalFormData {
  nome: string;
  especialidades: string[];
  telefone?: string;
  email?: string;
  ativo: boolean;
}

export interface ClienteFormData {
  nome: string;
  telefone?: string;
  email?: string;
  observacoes?: string;
  dataNascimento?: string;
}

export interface AgendamentoFormData {
  clienteId: string;
  profissionalId: string;
  servicoId: string;
  dataHora: string;
  status: 'pendente' | 'confirmado' | 'concluido' | 'cancelado';
  observacoes?: string;
}

export interface FinanceiroFormData {
  tipo: 'receita' | 'despesa';
  descricao: string;
  valor: number;
  data: string;
  categoriaId?: string;
}

export interface CategoriaFormData {
  nome: string;
  tipo: 'receita' | 'despesa';
  cor?: string;
}
