# Instruções para Agentes de IA

## ⚠️ IMPORTANTE - LEIA ANTES DE MODIFICAR

Este documento contém instruções essenciais para qualquer agente de IA que for trabalhar neste projeto.

---

## 1. REGRAS FUNDAMENTAIS

### 1.1 Sempre Manter Documentação Atualizada

**ANTES de fazer qualquer alteração**, leia:
```
/home/marcio/Ambiente teste/salon-pro/docs/
├── SISTEMA.md      → Documentação técnica (para devs)
├── MANUAL.md       → Manual do usuário (para clientes)
└── AGENTS.md       → Este arquivo (instruções para IAs)
```

### 1.2 Checklist de Alteração

Ao modificar o sistema, SEMPRE complete:

```
□ Documentou a alteração técnica no SISTEMA.md?
□ Documentou a alteração para usuários no MANUAL.md?
□ Atualizou interfaces TypeScript?
□ Atualizou schemas Zod?
□ Adicionou defaultValues nos formulários?
□ Testou build (npm run build)?
□ Verificou lint (npm run lint)?
```

---

## 2. ESTRUTURA ATUAL DO SISTEMA

### 2.1 Arquivo Principal

O arquivo principal é **`/home/marcio/Ambiente teste/salon-pro/src/app/page.tsx`** (~7400 linhas).

Contém:
- Sidebar e navegação
- CRUD de todas entidades (clientes, profissionais, serviços, etc.)
- Formulários de agendamento
- Configurações do sistema
- Renderização condicional de views

### 2.2 Outras Páginas

| Arquivo | Linhas | Descrição |
|---------|--------|-----------|
| `src/app/agendar/[tenantId]/page.tsx` | ~1000 | Agendamento online |
| `src/app/profissional/page.tsx` | ~550 | Login e painel do profissional |

### 2.3 Collections Firebase

```
Firebase Firestore/
├── saloes/
│   ├── {tenantId}/
│   │   ├── clientes/
│   │   ├── profissionais/
│   │   │   └── {id}: {
│   │   │       nome, celular, email,
│   │   │       status, acessoAtivo,
│   │   │       loginEmail, loginSenha,
│   │   │       servicosHabilitados[],
│   │   │       tipoComissao, percentualComissao
│   │   │   }
│   │   ├── servicos/
│   │   ├── agendamentos/
│   │   ├── financeiro/
│   │   └── produtos/
│   └── {tenantId}: {
│           nome, agendamentoOnline: {
│               ativo, vagasSalao, horariosPorDia
│           }
│       }
└── profissionais/
    └── {id}: { loginEmail, loginSenha, acessoAtivo }
```

---

## 3. SCHEMAS IMPORTANTES

### 3.1 Profissional (Zod Schema)

```typescript
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
  loginEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  loginSenha: z.string().optional(),
  acessoAtivo: z.boolean().default(false),
  servicosHabilitados: z.array(z.string()).default([]),
  disponibilidade: z.object({
    horariosPorDia: z.record(z.object({
      ativo: z.boolean().default(false),
      horarios: z.array(z.string()).default([]),
    })).optional(),
  }).optional(),
});
```

### 3.2 Tenant Config (Store)

```typescript
interface Tenant {
  // ...
  agendamentoOnline?: {
    ativo: boolean;
    diasDisponiveis: string[];
    horaInicio: string;
    horaFim: string;
    intervaloMinutos: number;
    permiteCancelamento: boolean;
    antecedenciaMinimaHoras: number;
    vagasSalao: number;        // ← Número de cadeiras
    horariosPorDia: Record<string, { ativo: boolean; horarios: string[] }>;
  };
}
```

---

## 4. FLUXOS IMPLEMENTADOS

### 4.1 Login de Profissional

```typescript
// Local: /home/marcio/Ambiente teste/salon-pro/src/app/profissional/page.tsx

const handleLogin = async () => {
  // 1. Busca na collection /profissionais
  const found = snapshot.docs.find(d => 
    d.data().loginEmail === email && 
    d.data().loginSenha === senha
  );

  // 2. Verifica se existe
  if (!found) {
    setError('Email ou senha incorretos');
    return;
  }

  // 3. Verifica se acesso está ativo
  if (!profData.acessoAtivo) {
    setError('Seu acesso foi bloqueado pelo administrador. Entre em contato.');
    return;
  }

  // 4. Login bem-sucedido
  setProfissional(profWithId);
};
```

### 4.2 Filtragem de Profissionais por Serviço

```typescript
// Local: Agendamento Online e Formulário Admin

const profsFiltrados = profissionais.filter((p: any) => {
  // 1. Prof deve estar ativo
  if (p.status !== 'ativo') return false;
  
  // 2. Se não tem serviços habilitados, atende todos
  if (!p.servicosHabilitados || p.servicosHabilitados.length === 0) return true;
  
  // 3. Verifica se faz o serviço selecionado
  return p.servicosHabilitados.includes(servicoSelecionado);
});
```

### 4.3 Validação de Lotação

```typescript
const vagasSalao = config?.vagasSalao || 5;

const totalNoHorario = agendamentos.filter(a => 
  a.data === data && 
  a.hora === horario &&
  a.status !== 'Cancelado'
).length;

const lotado = totalNoHorario >= vagasSalao;
```

### 4.5 NFC-e e Importação de NF-e

**Configuração NFC-e:**
```typescript
// Local: /home/marcio/Ambiente teste/salon-pro/src/components/salon/ConfigAvancadas.tsx
// Collection: saloes/{tenantId}/config/nfce

interface NFCeConfig {
  ativo: boolean;
  cnpj: string;
  inscricaoEstadual: string;
  razaoSocial: string;
  uf: string;
  municipio: string;
  codigoMunicipio: string;
  regimeTributario: '1' | '2' | '3';
  ncmPadrao: string;
  cfopPadrao: string;
  cstIcms: string;
  csosnPadrao: string;
  cstPis: string;
  cstCofins: string;
  aliquotaIcms: number;
  aliquotaPis: number;
  aliquotaCofins: number;
}
```

**Campos fiscais nos Produtos:**
```typescript
// Local: /home/marcio/Ambiente teste/salon-pro/src/app/page.tsx
// Collection: saloes/{tenantId}/produtos

interface Produto {
  // ... outros campos
  ncm?: string;
  cfop?: string;
  cstIcms?: string;
  csosn?: string;
  cstPis?: string;
  cstCofins?: string;
  aliquotaIcms?: number;
  aliquotaPis?: number;
  aliquotaCofins?: number;
  uop?: string;  // Unidade
}
```

**Importação de NF-e de Entrada:**
```typescript
// Local: /home/marcio/Ambiente teste/salon-pro/src/app/nfe/page.tsx
// Parser: /home/marcio/Ambiente teste/salon-pro/src/lib/nfe-parser.ts
// Collection: saloes/{tenantId}/nfe_importadas

// Fluxo:
// 1. Upload XML
// 2. parseNFeXML() extrai dados
// 3. matchProdutoByCodigoOuEan() faz matching
// 4. Preview com markup
// 5. Importação → cria/atualiza produtos + registra NF-e
```

**⚠️ LEMBRETE:** Ao alterar funcionalidades de NFC-e, atualizar MANUAL.md e SISTEMA.md.

**⚠️ LEMBRETE:** Ao fazer alterações significativas, incrementar SISTEMA_VERSION em `VersionBanner.tsx` e adicionar changelog.

---

## 5. PADRÕES DE CÓDIGO

### 5.1 Textos em Maiúsculas

```typescript
// Salvar no banco
nome: toUpper(data.nome),
cidade: toUpper(data.cidade || ''),

// Exceto email (case-insensitive)
email: toLower(data.email || ''),
loginEmail: toLower(data.loginEmail || ''),
```

### 5.2 Formatos

```typescript
// Datas
const data = '2026-04-17';  // yyyy-MM-dd

// Horas
const hora = '14:30';  // HH:mm

// Valores monetários
const preco = 49.90;  // number
```

### 5.3 Formulários React Hook Form

```typescript
// Schema Zod (validação)
const profissionalSchema = z.object({
  nome: z.string().min(2, 'Nome é obrigatório'),
  // ...
});

// useForm (inicialização)
const profissionalForm = useForm<z.infer<typeof profissionalSchema>>({
  resolver: zodResolver(profissionalSchema),
  defaultValues: {
    nome: '',
    acessoAtivo: false,
    servicosHabilitados: [],
    // ⚠️ SEMPRE incluir todos os campos
  },
});

// Reset ao abrir dialog
profissionalForm.reset({
  ...item,
  acessoAtivo: item.acessoAtivo || false,
  servicosHabilitados: item.servicosHabilitados || [],
});

// Controlled inputs
<Input 
  value={field.value ?? ''}  // ⚠️ Usar ?? '' para evitar uncontrolled
  onChange={field.onChange}
/>
```

### 5.4 LocalStorage

```typescript
// Salvar
localStorage.setItem('chave', JSON.stringify(dados));

// Ler
const saved = localStorage.getItem('chave');
if (saved) {
  setDados(JSON.parse(saved));
}

// Remover
localStorage.removeItem('chave');
```

---

## 6. COMANDOS ÚTEIS

```bash
# Navegar até o projeto
cd "/home/marcio/Ambiente teste/salon-pro"

# Build de produção
npm run build

# Verificar lint
npm run lint

# Iniciar desenvolvimento
npm run dev
```

---

## 7. LOCALIZAÇÃO DE CÓDIGO FREQUENTE

### 7.1 Schema do Profissional
**Arquivo:** `src/app/page.tsx`
**Linhas:** ~85-108

### 7.2 Formulário do Profissional (Dialog)
**Arquivo:** `src/app/page.tsx`
**Linhas:** ~5700-6100

### 7.3 HandleSave do Profissional
**Arquivo:** `src/app/page.tsx`
**Linhas:** ~767-803

### 7.4 Login do Profissional
**Arquivo:** `src/app/profissional/page.tsx`
**Linhas:** ~100-155

### 7.5 Agendamento Online (Step 2 - Profissionais)
**Arquivo:** `src/app/agendar/[tenantId]/page.tsx`
**Linhas:** ~769-830

### 7.6 Render Agenda (Calendário)
**Arquivo:** `src/app/page.tsx`
**Linhas:** ~2510-2600

### 7.7 Configuração Agendamento Online
**Arquivo:** `src/app/page.tsx`
**Linhas:** ~4890-5100

---

## 8. COMO DOCUMENTAR ALTERAÇÕES

### 8.1 Adicionar Nova Feature (SISTEMA.md)

```markdown
### [Nome da Feature]
**Descrição:** Breve descrição do que faz

**Arquivo:** `src/app/page.tsx`
**Linhas:** X-Y

**Campos novos:**
- `campo1`: description
- `campo2`: description

**Regras:**
- Regra de negócio 1
- Regra de negócio 2
```

### 8.2 Adicionar ao Fluxo (SISTEMA.md)

```markdown
### Fluxo X: [Nome]
```
1. Passo 1
2. Passo 2
3. ...
```
```

### 8.3 Adicionar ao Manual (MANUAL.md)

```markdown
## [Nome da Seção]

[Descrição para o usuário]

**Como acessar:**
1. Vá para ...
2. Clique em ...

**Exemplo:**
[Passo a passo com print]
```

---

## 9. ERROS COMUNS E SOLUÇÕES

### 9.1 Uncontrolled/Controlled Input

**Erro:**
```
A component is changing an uncontrolled input to be controlled
```

**Solução:** Garantir que todos os campos têm valor inicial:
```typescript
<Input 
  value={field.value ?? ''}  // ← Usar ?? ''
  onChange={field.onChange}
/>
```

### 9.2 Campo Faltando no Reset

**Erro:** Valor undefined ao editar

**Solução:** Incluir todos os campos no reset:
```typescript
profissionalForm.reset({
  ...item,
  acessoAtivo: item.acessoAtivo || false,  // ← Sempre com fallback
  servicosHabilitados: item.servicosHabilitados || [],
});
```

### 9.3 Campo Faltando no DefaultValues

**Erro:** Comportamento inesperado no formulário

**Solução:** Definir todos os campos:
```typescript
defaultValues: {
  nome: '',
  acessoAtivo: false,  // ← Sempre incluir novos campos
  servicosHabilitados: [],
},
```

---

## 10. CHECKLIST FINAL

Antes de finalizar qualquer alteração:

- [ ] Documentou tecnicamente no SISTEMA.md?
- [ ] Documentou para usuários no MANUAL.md?
- [ ] Atualizou este AGENTS.md com novas informações?
- [ ] build passou (`npm run build`)?
- [ ] lint limpo (`npm run lint`)?
- [ ] Testou a funcionalidade?

---

*Última atualização: 17/04/2026*
*Versão: 1.0*
