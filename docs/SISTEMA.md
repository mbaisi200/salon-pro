# SalonPro - Sistema de Gestão de Salão

## Visão Geral

SalonPro é um sistema multi-tenant de gestão para salões de beleza, desenvolvido com **Next.js**, **TypeScript**, **Firebase Firestore** e **shadcn/ui**.

### Características Principais

- **Multi-tenant**: Cada salão (tenant) tem seus dados isolados
- **Hierarquia**: Master Admin → Tenant Admin → Profissionais → Clientes
- **Tempo Real**: Dados sincronizados em tempo real via Firebase
- **Responsivo**: Funciona em desktop e mobile
- **Profissionais Terceirizados**: Sistema permite controle de profissionais autônomos

---

## Estrutura de Dados (Firebase Firestore)

### Collections e Estrutura

```
Firebase/
├── saloes/
│   ├── {tenantId}/
│   │   ├── clientes/
│   │   │   └── {clienteId}: { nome, telefone, email, ... }
│   │   ├── profissionais/
│   │   │   └── {profissionalId}: { nome, celular, loginEmail, acessoAtivo, servicosHabilitados[], ... }
│   │   ├── servicos/
│   │   │   └── {servicoId}: { nome, preco, duracao }
│   │   ├── agendamentos/
│   │   │   └── {agendamentoId}: { data, hora, clienteNome, servico, profissional, status, ... }
│   │   ├── financeiro/
│   │   │   └── {registroId}: { data, descricao, tipo, valor, ... }
│   │   ├── produtos/
│   │   │   └── {produtoId}: { nome, precoVenda, quantidadeEstoque, ... }
│   │   ├── nfe_importadas/
│   │   │   └── {nfeId}: { chaveAcesso, numero, serie, fornecedorNome, valorTotal, ... }
│   │   ├── config/
│   │   │   └── nfce: { ativo, cnpj, ie, regimeTributario, ... }
│   │   └── (dados do tenant: nome, agendamentoOnline, etc.)
│   └── {tenantId}: { nome, agendamentoOnline: { ativo, vagasSalao, horariosPorDia } }
└── profissionais/
    └── {profId}: { loginEmail, loginSenha, acessoAtivo } (para login de profissionais)
```

### Campos Importantes

#### Tenant (saloes/{id})
```typescript
{
  id: string;
  nome: string;
  usuario: string;
  senha: string;
  plano: 'basico' | 'profissional' | 'premium';
  dataExpiracao: string;
  ativo: boolean;
  logoUrl?: string;
  coresPersonalizadas?: string;
  agendamentoOnline?: {
    ativo: boolean;
    diasDisponiveis: string[];
    horaInicio: string;
    horaFim: string;
    intervaloMinutos: number;
    permiteCancelamento: boolean;
    antecedenciaMinimaHoras: number;
    vagasSalao: number;  // Número de cadeiras disponíveis
    horariosPorDia: Record<string, { ativo: boolean; horarios: string[] }>;
  };
}
```

#### Profissional (saloes/{tenantId}/profissionais/{id})
```typescript
{
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
  status: 'ativo' | 'inativo';  // Se trabalha no salão
  percentualComissao?: number;
  tipoComissao: 'percentual' | 'fixo_por_servico';
  
  // Sistema de Login
  loginEmail?: string;       // Email para login (único)
  loginSenha?: string;       // Senha (criptografada em produção)
  acessoAtivo: boolean;      // Controla se pode fazer login
  
  // Serviços Habilitados
  servicosHabilitados: string[];  // Lista de serviços que pode realizar
  // Se vazio, atende todos os serviços
  
  // Disponibilidade (para profissionais autônomos)
  disponibilidade?: {
    horariosPorDia?: Record<string, { ativo: boolean; horarios: string[] }>;
  };
}
```

#### Agendamento (saloes/{tenantId}/agendamentos/{id})
```typescript
{
  id: string;
  data: string;           // Formato: yyyy-MM-dd
  hora: string;           // Formato: HH:mm
  horaFim?: string;       // Calculado automaticamente
  duracao: number;        // Em minutos
  clienteNome: string;
  clienteTelefone?: string;
  clienteEmail?: string;
  servico: string;
  servicoId: string;
  profissional: string;
  profissionalId: string;
  status: 'Pendente' | 'Confirmado' | 'Concluido' | 'Cancelado';
  valor?: number;
  createdAt: string;
  updatedAt: string;
}
```

#### Cliente (saloes/{tenantId}/clientes/{id})
```typescript
{
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
  pontosFidelidade: number;
}
```

#### Serviço (saloes/{tenantId}/servicos/{id})
```typescript
{
  id: string;
  nome: string;
  preco: number;
  duracao: number;  // Em minutos
}
```

#### Produto (saloes/{tenantId}/produtos/{id})
```typescript
{
  id: string;
  nome: string;
  descricao?: string;
  categoria?: string;
  precoVenda: number;
  precoCusto?: number;
  quantidadeEstoque: number;
  estoqueMinimo: number;
  mostrarNoPdv: boolean;
  // Campos fiscais para NFC-e
  ncm?: string;           // NCM (8 dígitos)
  cfop?: string;          // CFOP (4 dígitos)
  uop?: string;           // Unidade (UN, KG, etc)
  cstIcms?: string;       // CST ICMS
  csosn?: string;         // CSOSN (Simples Nacional)
  cstPis?: string;        // CST PIS
  cstCofins?: string;     // CST COFINS
  aliquotaIcms?: number;  // Alíquota ICMS %
  aliquotaPis?: number;   // Alíquota PIS %
  aliquotaCofins?: number; // Alíquota COFINS %
}
```

#### Configuração NFC-e (saloes/{tenantId}/config/nfce)
```typescript
{
  ativo: boolean;
  ambiente: 'homologacao' | 'producao';
  cnpj: string;
  inscricaoEstadual: string;
  razaoSocial: string;
  nomeFantasia: string;
  regimeTributario: '1' | '2' | '3';  // 1=Simples, 2=Simples Excesso, 3=Normal
  uf: string;
  municipio: string;
  codigoMunicipio: string;
  telefone: string;
  email: string;
  // Valores padrão para produtos
  ncmPadrao: string;
  cfopPadrao: string;
  cstPis: string;
  cstCofins: string;
  cstIcms: string;
  csosnPadrao: string;
  aliquotaIcms: number;
  aliquotaPis: number;
  aliquotaCofins: number;
  informacoesAdicionais: string;
}
```

---

## Arquitetura de Arquivos

```
src/
├── app/
│   ├── page.tsx                 # Painel admin principal (~7600 linhas)
│   │                             # Contém: Sidebar, CRUDs, Agenda, Configs
│   ├── agendar/[tenantId]/
│   │   └── page.tsx            # Página de agendamento online (~1000 linhas)
│   │                             # Contém: fluxo de agendamento, login prof
│   ├── profissional/
│   │   └── page.tsx            # Painel do profissional (~550 linhas)
│   ├── nfe/
│   │   └── page.tsx            # Importação de NF-e de entrada (~800 linhas)
│   └── layout.tsx
├── components/
│   └── salon/
│       ├── BIDashboard.tsx      # Dashboard de BI
│       ├── ConfigAvancadas.tsx  # Config NFC-e + Download manual
│       ├── FidelidadePanel.tsx  # Programa de fidelidade
│       └── SeedDataPanel.tsx    # Painel de dados iniciais
└── lib/
    ├── firebase.ts              # Configuração Firebase
    ├── nfe-parser.ts           # Parser de XML NF-e
    ├── store.ts                 # Zustand store (Tenant interface)
    └── utils.ts                 # Funções utilitárias (cn)
```

---

## Rotas e Páginas

| Rota | Descrição | Acesso |
|------|-----------|--------|
| `/` | Painel admin do salão | Admin |
| `/agendar/{tenantId}` | Agendamento online para clientes | Público + Profissionais |
| `/profissional` | Login e painel do profissional | Profissionais |
| `/nfe` | Importação de NF-e de entrada | Admin |

---

## Funcionalidades Implementadas

### 1. Sistema de Login para Profissionais ✅

**Descrição**: Permite que profissionais terceirizados acessem o sistema para gerenciar sua agenda.

**Local**: `/profissional` e `/agendar/[tenantId]` (seção "Sou Profissional")

**Campos necessários**:
- `loginEmail`: Email único do profissional
- `loginSenha`: Senha de acesso
- `acessoAtivo`: Boolean que controla se pode logar

**Fluxo de Login**:
```
1. Profissional acessa /profissional
2. Insere email e senha
3. Sistema busca em collection /profissionais
4. Verifica se email/senha conferem
5. Verifica se acessoAtivo = true
6. Se bloqueado → mensagem "Acesso bloqueado pelo administrador"
7. Se ok → carrega dados e mostra agenda
```

**Revogação de Acesso**:
- Admin vai em Pessoas → Profissionais → Editar
- Desativa o switch "ACESSO AO SISTEMA"
- Profissional perde acesso imediato

### 2. Vinculação de Serviços por Profissional ✅

**Descrição**: Cada profissional pode ser vinculado aos serviços que está capacitado a realizar.

**Local**: Cadastro/Edição de profissional (seção "SERVIÇOS QUE ATENDE")

**Campo**: `servicosHabilitados: string[]`

**Regras**:
- Se `servicosHabilitados` estiver **vazio** → profissional atende **todos**
- Se tiver valores → só atende os serviços selecionados
- Comparação feita pelo nome do serviço (case-insensitive)

**Impacto no Agendamento**:
- Admin: Ao selecionar serviço, lista de profissionais é filtrada
- Online: Cliente seleciona serviço primeiro, depois só vê profs habilitados

### 3. Controle de Lotação (Cadeiras) ✅

**Descrição**: Controla quantas pessoas podem ser atendidas simultaneamente no salão.

**Local**: Configurações → Agendamento Online → "Número de Cadeiras"

**Campo**: `vagasSalao` (número)

**Funcionamento**:
- Admin define número de cadeiras (ex: 5)
- Sistema conta agendamentos por horário
- Quando atinge o limite → horário fica indisponível
- Visualização no calendário: badge vermelho quando lotado

**Exemplo**:
```
Salão com 5 cadeiras:
- 14:00 tem 3 agendamentos → [3/5] verde (tem vagas)
- 14:00 tem 5 agendamentos → [5/5] vermelho (LOTADO)
```

### 4. Painel do Profissional ✅

**Descrição**: Área onde profissionais gerenciam sua disponibilidade.

**Local**: `/profissional`

**Funcionalidades**:
- Login com email/senha
- Visualização de agenda (próximos agendamentos)
- Calendário visual
- Bloqueio de dias específicos (férias, folgas)
- Link para área de agendamento online do salão

**Proteção**:
- Verificação de `acessoAtivo` no login
- Sessão via localStorage
- Admin pode invalidar sessão bloqueando acesso

### 5. Agendamento Online ✅

**Descrição**: Página pública para clientes marcarem horários.

**Local**: `/agendar/{tenantId}`

**Fluxo**:
```
1. Cliente acessa link
2. Seleciona serviço
3. Sistema filtra profissionais (por servicosHabilitados)
4. Cliente seleciona profissional
5. Sistema mostra dias disponíveis (respeitando configuração)
6. Cliente seleciona data
7. Sistema mostra horários (verificando lotação)
8. Cliente preenche dados e confirma
9. Agendamento salvo no Firebase
```

**Recursos**:
- Link público copiável
- "Sou Profissional" → acesso rápido para profissionais
- Visualização de lotação
- Confirmação via WhatsApp

### 6. Validação de Agendamento ✅

**Descrição**: Regras de negócio para evitar agendamentos inválidos.

**Regras aplicadas**:
1. **Data retroativa**: Bloqueia datas anteriores a hoje
2. **Horário passado**: Se data = hoje, bloqueia horas já passadas
3. **Conflito de horário**: Verifica se já existe agendamento (considerando duração)
4. **Disponibilidade do profissional**: Verifica se prof atende nesse dia/horário
5. **Lotação do salão**: Bloqueia quando atingir `vagasSalao`

### 7. Configuração NFC-e ✅

**Descrição**: Sistema completo de configuração para emissão de NFC-e (Nota Fiscal ao Consumidor Eletrônica).

**Local**: Menu → Configurações → Configurações Avançadas

**Componente**: `src/components/salon/ConfigAvancadas.tsx`

**Funcionalidades**:
- Ativar/desativar NFC-e
- Configurar ambiente (homologação/produção)
- Dados do emitente (CNPJ, IE, Razão Social, Endereço)
- Regime tributário (Simples Nacional, Normal)
- Valores padrão de tributação para produtos

**Campos configuráveis**:
| Campo | Descrição |
|-------|-----------|
| CNPJ | CNPJ do estabelecimento |
| Inscrição Estadual | IE do estabelecimento |
| Regime Tributário | 1=Simples Nacional, 2=Simples Excesso, 3=Normal |
| NCM Padrão | NCM default para novos produtos |
| CFOP Padrão | CFOP para vendas (ex: 5102) |
| CST ICMS/CSOSN | Código de situação tributária |
| CST PIS/COFINS | Código de situação tributária |
| Alíquotas | Percentuais de imposto |

**Armazenamento**: Firebase em `saloes/{tenantId}/config/nfce`

### 8. Campos Tributários nos Produtos ✅

**Descrição**: Cada produto pode ter seus dados fiscais específicos para NFC-e.

**Local**: Cadastro/Edição de produto (seção "Dados Fiscais para NFC-e")

**Campos disponíveis**:
- **NCM**: Código NCM do produto (8 dígitos)
- **CFOP**: Código CFOP para venda (4 dígitos)
- **Unidade**: Unidade de comercialização (UN, KG, etc)
- **CST ICMS**: Código de situação do ICMS
- **CSOSN**: Código para Simples Nacional
- **CST PIS**: Código de situação do PIS
- **CST COFINS**: Código de situação do COFINS
- **Alíquotas**: ICMS, PIS, COFINS (%)

**Interface**: Seção colapsável no formulário de produto, sinalizada com cor laranja.

**Campos opcionais**: Só precisam ser preenchidos se NFC-e estiver habilitado.

### 9. Importação de NF-e de Entrada ✅

**Descrição**: Sistema para importar produtos de notas fiscais eletrônicas (XML).

**Local**: Menu → Notas Fiscais → aba "Importar XML"

**Componente**: `src/app/nfe/page.tsx`

**Parser**: `src/lib/nfe-parser.ts`

**Funcionalidades**:
- Upload de arquivo XML (drag & drop)
- Parse automático de todos os dados fiscais
- Extração de produtos com NCM, CFOP, CST, alíquotas
- Identificação de fornecedor (CNPJ, IE, endereço)
- Verificação de duplicidade (pela chave de acesso)
- Configuração de markup/preço de venda
- Categorização de produtos
- Atualização de estoque

**Fluxo de Importação**:
```
1. Upload do arquivo XML
2. Parse dos dados da NFe
3. Matching de produtos existentes (por EAN/código)
4. Preview dos produtos com opções de markup
5. Confirmação da importação
6. Criação/atualização de produtos no banco
7. Registro da NFe importada
```

**Campos extraídos do XML**:
| Campo | Descrição |
|-------|-----------|
| número/série | Identificação da nota |
| dataEmissao | Data de emissão |
| chaveAcesso | Chave de acesso (44 dígitos) |
| fornecedor | Dados do emitente |
| produtos | Lista com NCM, CFOP, CST, alíquotas, valores |

**Collection Firebase**: `saloes/{tenantId}/nfe_importadas/{id}`

### 10. Sistema de Notificações de Versão ✅

**Descrição**: Banner que notifica admins quando há atualização do sistema.

**Local**: Banner no topo da página + Menu → Configurações → Manual/NFC-e → seção "Sistema"

**Componentes**:
- `src/components/salon/VersionBanner.tsx` - Banner de notificação
- `src/components/salon/ConfigAvancadas.tsx` - Gestão de versões (seção "Sistema")

**Funcionamento**:
1. O código tem uma versão constante (`SISTEMA_VERSION` em `VersionBanner.tsx`)
2. Admin pode definir versão no Firebase via ConfigAvançadas
3. Se versão no Firebase ≠ versão do código, banner aparece
4. Admin adiciona changelog (novidades)
5. Todos os admins verão o banner até fechar

**Collection Firebase**: `saloes/{tenantId}/config/sistema`
```typescript
{
  versao: "1.0.0",
  versaoData: "17/04/2026",
  ativo: true,
  changelog: ["Nova função de importação XML", "Melhorias no PDV"],
  updatedAt: "2026-04-17T00:00:00.000Z"
}
```

**Como atualizar a versão**:
1. Vá em Configurações → Manual/NFC-e
2. Role até seção "Sistema"
3. Adicione as novidades no changelog
4. Marque "Ativar notificação de atualização"
5. Clique em "Publicar Atualização"

---

## Fluxos Principais

### Fluxo 1: Admin Cadastra Profissional com Acesso

```
1. Admin vai em Pessoas → Profissionais
2. Clica em Novo Profissional
3. Preenche dados pessoais
4. Define comissão (% ou R$)
5. Na seção ACESSO AO SISTEMA:
   - Ativa o switch
   - Define email de login
   - Define senha
6. Na seção SERVIÇOS QUE ATENDE:
   - Seleciona os serviços que ele faz
7. Clica em Salvar
```

### Fluxo 2: Profissional Faz Login

```
1. Profissional acessa /profissional
2. Insere email e senha
3. Sistema verifica credenciais
4. Sistema verifica acessoAtivo
5. Se bloqueado → mostra mensagem de erro
6. Se ok → carrega agenda e disponibilidade
7. Profissional pode:
   - Ver agendamentos
   - Bloquear dias
   - Gerenciar disponibilidade
```

### Fluxo 3: Admin Bloqueia Acesso de Profissional

```
1. Admin vai em Pessoas → Profissionais
2. Encontra profissional na lista
3. Clica em Editar (lápis)
4. Na seção ACESSO AO SISTEMA:
   - Desativa o switch (ou remove email/senha)
5. Clica em Salvar
6. Profissional perde acesso imediatamente
7. Se tentar logar → "Acesso bloqueado pelo administrador"
```

### Fluxo 4: Agendamento Online (Cliente)

```
1. Cliente acessa /agendar/{tenantId}
2. Vê tela inicial com serviços
3. Seleciona serviço (ex: Corte)
4. Sistema filtra profissionais que fazem esse serviço
5. Cliente seleciona profissional
6. Sistema mostra dias disponíveis
7. Cliente seleciona data
8. Sistema mostra horários (considerando lotação)
9. Cliente seleciona horário
10. Preenche: Nome, Telefone, Email (opcional)
11. Clica em Confirmar
12. Agendamento salvo no Firebase
13. Mostra confirmação com detalhes
```

### Fluxo 5: Profissional Bloqueia Dia

```
1. Profissional faz login
2. Clica em "Gerenciar"
3. Vê calendário do mês
4. Clica no dia que quer bloquear
5. Dia fica vermelho (bloqueado)
6. Clica em Salvar
7. Sistema salva em disponibilidade do profissional
8. Dia não aparece mais para clientes
```

---

## Regras de Negócio

### Validação de Agendamento
```typescript
// 1. Não permite datas retroativas
if (data < hoje) return false;

// 2. Não permite horários passados (se data = hoje)
if (data === hoje && hora <= horaAtual) return false;

// 3. Verifica conflitos de horário
const conflito = agendamentos.find(a =>
  a.profissional === prof &&
  a.data === data &&
  a.status !== 'Cancelado' &&
  sobrepoe(hora, duracao, a.hora, a.duracao)
);
if (conflito) return false;

// 4. Verifica lotação
const totalNoHorario = agendamentos.filter(a =>
  a.data === data &&
  a.hora === hora &&
  a.status !== 'Cancelado'
).length;
if (totalNoHorario >= vagasSalao) return false;
```

### Acesso do Profissional
```typescript
// Login
const profissional = snapshot.docs.find(d =>
  d.data().loginEmail === email &&
  d.data().loginSenha === senha
);

if (!profissional) return "Email ou senha incorretos";
if (!profissional.data().acessoAtivo) return "Acesso bloqueado pelo administrador";
```

### Serviços por Profissional
```typescript
// Se vazio, atende todos
if (!profissional.servicosHabilitados || 
    profissional.servicosHabilitados.length === 0) {
  return true;
}

// Verifica se serviço está na lista
return profissional.servicosHabilitados.includes(servico.nome);
```

---

## Variáveis de Ambiente

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=salao2026
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

---

## Comandos

```bash
npm run dev      # Iniciar desenvolvimento (porta 3000)
npm run build    # Build de produção
npm run start    # Iniciar produção
npm run lint     # Verificar lint
```

---

## Padrões de Código

### Nomenclatura
- Collections: português (clientes, profissionais, servicos)
- Campos: camelCase (loginEmail, servicosHabilitados)
- Collections aninhadas: `saloes/{tenantId}/profissionais`

### Formatação
- Textos no banco: **MAIÚSCULAS** (exceto email)
- Datas: `yyyy-MM-dd`
- Horas: `HH:mm`
- Moedas: number (ex: 49.90)

### React Hook Form
- Schemas Zod para validação
- defaultValues sempre com todos os campos
- Controlled inputs com `value={field.value}` + `onChange`

---

## LocalStorage (Temporário)

| Chave | Uso |
|-------|-----|
| `masterPassword` | Sessão do Master Admin |
| `profissionalSession` | Sessão do profissional (`/profissional`) |
| `profAgendarSession` | Sessão do profissional (`/agendar`) |

---

## Próximas Implementações Possíveis

- [ ] Notificações via WhatsApp
- [ ] Histórico de pontos de fidelidade
- [ ] Relatórios avançados
- [ ] App mobile
- [ ] Pagamento online

---

*Documento criado em: 17/04/2026*
*Última atualização: 17/04/2026*
