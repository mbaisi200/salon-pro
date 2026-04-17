# Manual do Usuário - SalonPro

## Sistema de Gestão para Salões de Beleza

**Versão:** 1.0
**Última atualização:** 17/04/2026

---

## 📋 Índice

1. [Como Acessar](#como-acessar)
2. [Painel do Administrador](#painel-do-administrador)
3. [Gerenciando Profissionais](#gerenciando-profissionais)
4. [Sistema de Agendamento Online](#sistema-de-agendamento-online)
5. [Controle de Cadeiras/Lotação](#controle-de-cadeiraslotação)
6. [Para Profissionais](#para-profissionais)
7. [NFC-e - Nota Fiscal](#nfc-e---nota-fiscal)
8. [Solução de Problemas](#solução-de-problemas)

---

## Como Acessar

### Acesso do Administrador

1. Acesse o sistema pelo navegador
2. Entre com seu **usuário** e **senha**
3. Você verá o **Painel Principal**

### Acesso do Profissional

1. Acesse `/profissional` (ou clique em "Sou Profissional" na página de agendamento)
2. Insira seu **email** e **senha** (fornecidos pelo administrador)
3. Clique em **Entrar**

---

## Painel do Administrador

### Menu Principal

O menu lateral oferece acesso a:

| Menu | Função |
|------|--------|
| **Dashboard** | Visão geral com estatísticas e indicadores |
| **Agenda** | Calendário com todos os agendamentos |
| **Pessoas** | Gerenciar clientes e profissionais |
| **Serviços** | Cadastrar serviços oferecidos (corte, barba, etc.) |
| **Produtos** | Controle de estoque de produtos |
| **Financeiro** | Entradas e saídas, relatórios |
| **Fidelidade** | Programa de pontos para clientes |
| **Configurações** | Ajustes do sistema, agendamento online |

---

## Gerenciando Profissionais

### Cadastrar Novo Profissional

1. Vá em **Pessoas** → aba **Profissionais**
2. Clique em **Novo Profissional**
3. Preencha os dados:

```
┌─────────────────────────────────────────────────────────────────┐
│                         Novo Profissional                         │
│                                                                   │
│  Dados Pessoais                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Nome *                      │ Celular                       │ │
│  │ [                        ]  │ [                          ]  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  Contato                                                          │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Email                        │ Telefone Fixo                │ │
│  │ [                        ]  │ [                          ]  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  Endereço                                                         │
│  ┌────────────────┬────────────────┬──────┐                     │
│  │ Cidade         │ Bairro         │ UF   │                     │
│  │ [            ] │ [            ] │ [  ] │                     │
│  └────────────────┴────────────────┴──────┘                     │
│                                                                   │
│  ───────────────────────────────────────────────────────────────  │
│                                                                   │
│  ┌────────────────┬────────────────┬────────────────┐              │
│  │ Situação       │ Tipo           │ Valor/Comissão│              │
│  │ [   Ativo   ▼] │ [Percentual ▼] │ [    0.00  ] │              │
│  └────────────────┴────────────────┴────────────────┘              │
│                                                                   │
│  ───────────────────────────────────────────────────────────────  │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ 🔑 ACESSO AO SISTEMA                          [OFF] ⚫BLOQUEADO│ │
│  │                                                              │ │
│  │ Configure o acesso do profissional ao sistema...             │ │
│  │                                                              │ │
│  │ ┌─────────────────────┐  ┌─────────────────────┐           │ │
│  │ │ Email de Login      │  │ Senha de Acesso     │           │ │
│  │ │                     │  │                     │           │ │
│  │ └─────────────────────┘  └─────────────────────┘           │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ ✂️ SERVIÇOS QUE ATENDE                                     │ │
│  │                                                              │ │
│  │ Selecione os serviços que ele está capacitado a realizar... │ │
│  │                                                              │ │
│  │ [✓] Corte      [ ] Hidratação     [ ] Coloração           │ │
│  │ [✓] Barba      [ ] Progressiva     [ ] Sobrancelha         │ │
│  │                                                              │ │
│  │ 2 de 5 serviços selecionados                                │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│                              [ 💾 Salvar Profissional ]           │
└─────────────────────────────────────────────────────────────────┘
```

### Seção: Acesso ao Sistema

Esta seção controla se o profissional pode acessar o sistema:

| Campo | Descrição |
|-------|-----------|
| **Ativar/Desativar** | Switch ON/OFF para permitir ou bloquear o acesso |
| **Email de Login** | Email que o profissional usará para entrar |
| **Senha de Acesso** | Senha de acesso |

**IMPORTANTE:**
- Quando **ATIVADO**: Profissional pode fazer login normalmente
- Quando **BLOQUEADO**: Ao tentar logar, verá mensagem "Acesso bloqueado pelo administrador"
- Admin pode bloquear/revogar acesso a qualquer momento

### Seção: Serviços que Atende

Aqui você define quais serviços este profissional está capacitado a realizar:

| Situação | Efeito |
|----------|--------|
| **Nenhum selecionado** | Profissional atende **todos** os serviços |
| **Serviços selecionados** | Profissional só atende os serviços escolhidos |

**Exemplo Prático:**
```
Salão oferece: Corte, Barba, Hidratação, Coloração

Profissional Ana:
- Selecionado: Corte, Barba
- Resultado: Só aparece para clientes que agendarem Corte ou Barba

Profissional Pedro:
- Nenhum selecionado (atenção padrão)
- Resultado: Aparece para todos os serviços
```

### Editar Profissional Existente

1. Vá em **Pessoas** → **Profissionais**
2. Encontre o profissional na lista
3. Clique no ícone de **lápis** (Editar)
4. Faça as alterações
5. Clique em **Salvar**

### Lista de Profissionais

A lista mostra:

| Coluna | O que mostra |
|--------|-------------|
| Nome | Nome do profissional |
| Celular | Telefone de contato |
| Fixo | Telefone fixo |
| Situação | 🟢 Ativo / 🔴 Inativo |
| Acesso | 🔓 Login Ativo / ⚫ Bloqueado / Sem login |
| Ações | ✏️ Editar / 🗑️ Excluir |

---

## Sistema de Agendamento Online

### O que é?

Permite que seus clientes agendem horários pela internet, sem precisar ligar ou WhatsApp.

### Configurar Agendamento Online

1. Vá em **Configurações** → **Agendamento Online**
2. **Ative** o agendamento online (switch no topo)

### Configurar Horários por Dia

```
┌─────────────────────────────────────────────────────────────────┐
│  Horários por Dia                                                │
│                                                                   │
│  Modelo rápido: [Aplicar modelo... ▼]    [💾 Salvar]           │
│                                                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ SEG      │ │ TER       │ │ QUA       │ │ QUI       │       │
│  │ [ON] ✓   │ │ [ON] ✓    │ │ [ON] ✓    │ │ [ON] ✓    │       │
│  │ 8h-18h   │ │ 8h-18h    │ │ 8h-18h    │ │ 8h-18h    │       │
│  │ 12 horários │ 12 horários │ 12 horários │ 12 horários │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ SEX      │ │ SAB       │ │ DOM       │ │          │       │
│  │ [ON] ✓   │ │ [ON] ✓    │ │ [OFF] ✗   │ │          │       │
│  │ 8h-18h   │ │ 9h-14h    │ │ Fechado   │ │          │       │
│  │ 12 horários │ 6 horários │            │           │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

**Como usar:**
1. Use **modelos快速** (templates) para configur rápida
2. Ou configure dia por dia:
   - Ligue/desligue cada dia
   - Adicione horários específicos
   - Clique no X para remover horários

### Templates Rápidos

| Template | Descrição |
|----------|-----------|
| Todos os dias (08h-18h) | Segunda a Domingo, 8h às 18h |
| Dias úteis (08h-18h) | Segunda a Sexta, 8h às 18h |
| Horário estendido | Seg-Sex 8h-20h, Sáb 9h-14h, Dom fechado |
| Fechado todos os dias | Nenhum dia disponível |

### Copiar Horários Entre Dias

1. Clique em um dia que já tem horários configurados
2. Os horários serão copiados para todos os outros dias

---

## Controle de Cadeiras/Lotação

### O que é?

Controla quantas pessoas podem ser atendidas **simultaneamente** no salão.

### Configurar Número de Cadeiras

```
┌─────────────────────────────────────────────────────────────────┐
│  👥 Número de Cadeiras                                           │
│                                                                   │
│  Quantas pessoas podem ser atendidas simultaneamente no salão?    │
│                                                                   │
│         [ 5 ]   clientes ao mesmo tempo                          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Exemplo:**
```
Salão com 5 cadeiras físicas:
- Informe 5
- Sistema impede agendamentos além da capacidade
```

### Visualização no Calendário

No calendário da agenda, você verá indicadores:

| Indicador | Significado |
|-----------|-------------|
| **[3/5]** verde | 3 agendamentos, 2 vagas livres |
| **[5/5]** vermelho | **LOTADO** - não aceita mais |
| Dia vermelho claro | Fundo vermelho indica lotação |

### Como Funciona para o Cliente

Quando cliente tenta agendar:
- Se horário tem **vaga** → pode agendar ✅
- Se horário está **lotado** → horário não aparece ❌

---

## Para Profissionais

### Como Fazer Login

1. Acesse a página de login do profissional:
   - Opção A: Acesse `/profissional`
   - Opção B: Clique em "Sou Profissional" na página de agendamento
2. Insira seu **email** e **senha**
3. Clique em **Entrar**

### Tela Inicial (Após Login)

```
┌─────────────────────────────────────────────────────────────────┐
│  Bem-vindo, Ana Silva                                           │
│  Salão Beleza Total                                    [Sair]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ 👥 Seus Próximos Agendamentos                              │ │
│  │                                                              │ │
│  │ 22/04 às 14:00 - Maria        [Pendente]                  │ │
│  │ 22/04 às 15:00 - João        [Confirmado]                 │ │
│  │ 23/04 às 10:00 - Carla       [Pendente]                   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ ⚙️ Modo Profissional                                       │ │
│  │                                                              │ │
│  │ Você está visualizando a agenda do salão. Clique em        │ │
│  │ "Gerenciar" para bloquear dias e horários.                 │ │
│  │                                                              │ │
│  │                    [Abrir Painel Completo]                  │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Bloquear um Dia

1. Clique em **Gerenciar**
2. Você verá o calendário do mês
3. **Clique no dia** que deseja bloquear
4. O dia ficará vermelho (indicando bloqueado)
5. Clique em **Salvar**

**Resultado:**
- Dia bloqueado não aparece para clientes
- Você pode desbloquear a qualquer momento (clique novamente)

### O que Acontece se o Admin Bloquear?

Se o administrador revogar seu acesso:
- Ao tentar fazer login, você verá: **"Seu acesso foi bloqueado pelo administrador"**
- **Entre em contato com o salão** para saber o motivo

### Reativar Acesso

Somente o **administrador do salão** pode reativar:
1. Admin vai em Pessoas → Profissionais
2. Edita seu cadastro
3. Ativa o switch "ACESSO AO SISTEMA"
4. Salva

---

## Fluxo para o Cliente Agendar

```
┌─────────────────────────────────────────────────────────────────┐
│                      SALÃO BELEZA TOTAL                         │
│                      Agendamento Online                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Passo 1: Selecione o Serviço                                   │
│  ┌───────────────────┐                                          │
│  │ ✂️ Corte           │ R$ 45,00 - 30 min                       │
│  └───────────────────┘                                          │
│  ┌───────────────────┐                                          │
│  │ 🧔 Barba          │ R$ 25,00 - 20 min                       │
│  └───────────────────┘                                          │
│  ┌───────────────────┐                                          │
│  │ 💆 Hidratação      │ R$ 60,00 - 45 min                       │
│  └───────────────────┘                                          │
│                                                                   │
│  ──────────────────────────────────────────────────────────────  │
│                                                                   │
│  Passo 2: Selecione o Profissional                              │
│  ┌───────────────────┐                                          │
│  │ 👤 Ana            │                                          │
│  └───────────────────┘                                          │
│  ┌───────────────────┐                                          │
│  │ 👤 Pedro          │                                          │
│  └───────────────────┘                                          │
│                                                                   │
│  ──────────────────────────────────────────────────────────────  │
│                                                                   │
│  Passo 3: Selecione a Data                                      │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                              │
│  │ Ter  │ │ Qua  │ │ Qui  │ │ Sex  │                              │
│  │  23  │ │  24  │ │  25  │ │  26  │                              │
│  └─────┘ └─────┘ └─────┘ └─────┘                              │
│                                                                   │
│  ──────────────────────────────────────────────────────────────  │
│                                                                   │
│  Passo 4: Selecione o Horário                                   │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐             │
│  │ 08:00│ │ 08:30│ │ 09:00│ │ 09:30│ │ 10:00│ │ 10:30│             │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘             │
│                                                                   │
│  ──────────────────────────────────────────────────────────────  │
│                                                                   │
│  Passo 5: Seus Dados                                            │
│  Nome: [________________________________]                       │
│  Telefone: [(__) _____-____]                                   │
│  Email: [________________________] (opcional)                   │
│                                                                   │
│                    [Confirmar Agendamento]                       │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## NFC-e - Nota Fiscal

### O que é NFC-e?

NFC-e (Nota Fiscal ao Consumidor Eletrônica) é o documento fiscal digital que registra vendas de produtos. É obrigatória em muitos estados do Brasil.

### Acessar Configurações NFC-e

1. Clique em **Configurações** no menu lateral
2. Role até encontrar a seção **NFC-e - Nota Fiscal ao Consumidor**
3. Ou use o atalho **Manual/NFC-e** no menu

### Configurar NFC-e

```
┌─────────────────────────────────────────────────────────────────┐
│  NFC-e - Nota Fiscal ao Consumidor                              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [SWITCH]  Ativar NFC-e                                  │   │
│  │            Habilita a emissão de notas fiscais          │   │
│  │                                         [Ativo ✓]       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ⚠️ Atenção: Dados Tributários                                 │
│     Para emitir NFC-e, todos os campos são OBRIGATÓRIOS         │
│     conforme exigência da SEFAZ.                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Campos Obrigatórios

| Seção | Campos |
|-------|--------|
| **Ambiente** | Homologação (teste) ou Produção |
| **Regime Tributário** | Simples Nacional, Simples Excesso, Normal |
| **Dados do Emitente** | CNPJ, IE, Razão Social, UF, Município |
| **Tributação** | NCM, CFOP, CST, CSOSN, Alíquotas |

### Campos Fiscais nos Produtos

Cada produto pode ter seus dados fiscais específicos:

1. Vá em **Produtos** no menu
2. Clique em **Novo Produto** ou edite um existente
3. Expanda a seção **Dados Fiscais para NFC-e** (ícone laranja)
4. Preencha os campos:

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| **NCM** | Código NCM do produto | 34013000 |
| **CFOP** | CFOP para venda | 5102 |
| **Unidade** | Unidade de comercialização | UN |
| **CST ICMS** | Código de situação do ICMS | 00 |
| **CSOSN** | Código para Simples Nacional | 102 |
| **CST PIS** | Código de situação PIS | 08 |
| **CST COFINS** | Código de situação COFINS | 08 |
| **ICMS %** | Alíquota ICMS | 18 |
| **PIS %** | Alíquota PIS | 0 |
| **COFINS %** | Alíquota COFINS | 0 |

### Download do Manual

Na página de Configurações Avançadas, você pode baixar o manual completo do sistema em formato TXT.

---

## Solução de Problemas

| Problema | Solução |
|----------|---------|
| Profissional não consegue login | Verificar se `acessoAtivo` está ligado |
| Horário não aparece | Verificar configuração de horários |
| Cliente não consegue agendar | Verificar lotação ou disponibilidade |
| Erro ao salvar formulário | Verificar campos obrigatórios (*) |
| Dados somem | Verificar conexão com Firebase |
| Profissional atende todos | `servicosHabilitados` está vazio = atende todos |

---

## Dicas Rápidas

### Para o Administrador

1. **Cadastre profissionais primeiro**, depois vincule os serviços
2. **Teste o agendamento online** antes de liberar para clientes
3. **Copie o link** e envie para clientes (WhatsApp, Instagram)
4. **Revogue acessos** de profissionais que saírem da equipe
5. **Configure lotação** de acordo com suas cadeiras reais

### Para Profissionais

1. **Mantenha sua disponibilidade atualizada**
2. **Bloqueie dias com antecedência** (férias, folgas)
3. **Informe o salão** se precisar bloquear emergencialmente
4. **Verifique sua agenda** antes de confirmar horários

---

## Contato e Suporte

Para suporte técnico ou dúvidas sobre o sistema, entre em contato com o desenvolvedor.

---

*Manual atualizado em: 17/04/2026*
