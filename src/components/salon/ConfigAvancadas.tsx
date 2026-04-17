'use client';

import { useState, useEffect } from 'react';
import { Download, FileText, AlertCircle, CheckCircle2, X, FileType, Plus, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useSalonStore } from '@/lib/store';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { SISTEMA_VERSION, SISTEMA_VERSION_DATE } from './VersionBanner';

interface NFCeConfig {
  ativo: boolean;
  ambiente: 'homologacao' | 'producao';
  cnpj: string;
  inscricaoEstadual: string;
  razaoSocial: string;
  nomeFantasia: string;
  regimeTributario: '1' | '2' | '3';
  uf: string;
  municipio: string;
  codigoMunicipio: string;
  telefone: string;
  email: string;
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

const NFCeConfigPadrao: NFCeConfig = {
  ativo: false,
  ambiente: 'homologacao',
  cnpj: '',
  inscricaoEstadual: '',
  razaoSocial: '',
  nomeFantasia: '',
  regimeTributario: '1',
  uf: '',
  municipio: '',
  codigoMunicipio: '',
  telefone: '',
  email: '',
  ncmPadrao: '00000000',
  cfopPadrao: '5102',
  cstPis: '08',
  cstCofins: '08',
  cstIcms: '00',
  csosnPadrao: '102',
  aliquotaIcms: 0,
  aliquotaPis: 0,
  aliquotaCofins: 0,
  informacoesAdicionais: '',
};

export default function ConfiguracoesAvancadas() {
  const { tenant } = useSalonStore();
  const [nfceConfig, setNfceConfig] = useState<NFCeConfig>(NFCeConfigPadrao);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Sistema - Version management
  const [versaoFirebase, setVersaoFirebase] = useState<string>('');
  const [notificacaoAtiva, setNotificacaoAtiva] = useState(false);
  const [changelog, setChangelog] = useState<string[]>([]);
  const [savingSistema, setSavingSistema] = useState(false);
  const [savedSistema, setSavedSistema] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      if (!tenant) return;
      try {
        const db = getFirebaseDb();

        // Load NFC-e config
        const configRef = doc(db, 'saloes', tenant.id, 'config', 'nfce');
        const configSnap = await getDoc(configRef);
        if (configSnap.exists()) {
          setNfceConfig({ ...NFCeConfigPadrao, ...configSnap.data() as NFCeConfig });
        }

        // Load sistema config (version)
        const sistemaRef = doc(db, 'saloes', tenant.id, 'config', 'sistema');
        const sistemaSnap = await getDoc(sistemaRef);
        if (sistemaSnap.exists()) {
          const data = sistemaSnap.data();
          setVersaoFirebase(data.versao || '');
          setNotificacaoAtiva(data.ativo ?? false);
          setChangelog(data.changelog || []);
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    };
    loadConfig();
  }, [tenant]);

  const handleSaveSistema = async () => {
    if (!tenant) return;
    setSavingSistema(true);
    try {
      const db = getFirebaseDb();
      await setDoc(doc(db, 'saloes', tenant.id, 'config', 'sistema'), {
        versao: SISTEMA_VERSION,
        versaoData: SISTEMA_VERSION_DATE,
        ativo: notificacaoAtiva,
        changelog: changelog.filter(item => item.trim() !== ''),
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      setVersaoFirebase(SISTEMA_VERSION);
      setSavedSistema(true);
      setTimeout(() => setSavedSistema(false), 3000);
    } catch (error) {
      console.error('Erro ao salvar sistema:', error);
    } finally {
      setSavingSistema(false);
    }
  };

  const handleSaveNFCe = async () => {
    if (!tenant) return;
    setSaving(true);
    try {
      const db = getFirebaseDb();
      await setDoc(doc(db, 'saloes', tenant.id, 'config', 'nfce'), {
        ...nfceConfig,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Erro ao salvar config NFC-e:', error);
    } finally {
      setSaving(false);
    }
  };

  const downloadManualTxt = () => {
    const manualContent = `
================================================================================
                    MANUAL DO SISTEMA - SALONPRO
                    Sistema de Gestão para Salões de Beleza
================================================================================

VERSÃO: 1.0
DATA: 17/04/2026

--------------------------------------------------------------------------------
ÍNDICE
--------------------------------------------------------------------------------

1. COMO ACESSAR
   1.1 Acesso do Administrador
   1.2 Acesso do Profissional

2. PAINEL DO ADMINISTRADOR
   2.1 Menu Principal
   2.2 Dashboard
   2.3 Agenda
   2.4 Pessoas
   2.5 Serviços
   2.6 Produtos/Estoque
   2.7 PDV - Ponto de Venda
   2.8 Caixa
   2.9 Comissões
   2.10 Financeiro
   2.11 Fidelidade
   2.12 Agendamento Online
   2.13 Configurações

3. GERENCIANDO PROFISSIONAIS
   3.1 Cadastrar Profissional
   3.2 Configurar Acesso ao Sistema
   3.3 Vincular Serviços ao Profissional
   3.4 Controle de Acesso

4. SISTEMA DE AGENDAMENTO ONLINE
   4.1 Configurar Horários
   4.2 Número de Cadeiras
   4.3 Link para Clientes

5. CONTROLE DE CADEIRAS/LOTAÇÃO
   5.1 Configurar Número de Cadeiras
   5.2 Visualização no Calendário
   5.3 Como Funciona para o Cliente

6. PARA PROFISSIONAIS
   6.1 Como Fazer Login
   6.2 Bloquear um Dia
   6.3 Reativar Acesso

7. FLUXO PARA O CLIENTE AGENDAR

8. SOLUÇÃO DE PROBLEMAS

================================================================================
1. COMO ACESSAR
================================================================================

1.1 ACESSO DO ADMINISTRADOR

   1. Acesse o sistema pelo navegador
   2. Entre com seu USUÁRIO e SENHA
   3. Você verá o Painel Principal

1.2 ACESSO DO PROFISSIONAL

   1. Acesse /profissional (ou clique em "Sou Profissional")
   2. Insira seu EMAIL e SENHA (fornecidos pelo administrador)
   3. Clique em ENTRAR

================================================================================
2. PAINEL DO ADMINISTRADOR
================================================================================

2.1 MENU PRINCIPAL

   O menu lateral oferece acesso a:

   | Menu             | Função                                    |
   |------------------|-------------------------------------------|
   | Dashboard        | Visão geral com estatísticas              |
   | Agenda           | Calendário com todos os agendamentos       |
   | Pessoas          | Gerenciar clientes e profissionais          |
   | Serviços         | Cadastrar serviços oferecidos              |
   | Produtos         | Controle de estoque de produtos             |
   | PDV              | Ponto de Venda                            |
   | Caixa            | Gestão de caixa                           |
   | Comissões        | Commissionamento de profissionais         |
   | Financeiro        | Entradas e saídas, relatórios             |
   | Fidelidade       | Programa de pontos para clientes          |
   | Agend. Online    | Configurar agendamento online             |
   | Configurações     | Ajustes do sistema                       |

2.2 DASHBOARD

   Visão geral com indicadores:
   - Total de agendamentos
   - Receita do período
   - Clientes cadastrados
   - Profissionais ativos

2.3 AGENDA

   Calendário visual com todos os agendamentos.
   Clique em um dia para ver detalhes ou criar novo agendamento.

2.4 PESSOAS

   Gerencia dois tipos de pessoas:
   
   A) CLIENTES
      - Cadastro de clientes
      - Histórico de agendamentos
      - Programa de fidelidade
   
   B) PROFISSIONAIS
      - Cadastro de profissionais
      - Configuração de acesso ao sistema
      - Vincular serviços que podem realizar
      - Controle de acesso (ativo/bloqueado)

2.5 SERVIÇOS

   Cadastro dos serviços oferecidos pelo salão:
   - Nome do serviço
   - Preço
   - Duração (em minutos)

2.6 PRODUTOS/ESTOQUE

   Controle de produtos:
   - Cadastro de produtos
   - Controle de estoque
   - Gestão de entradas e saídas

2.7 PDV - PONTO DE VENDA

   Vendas rápidas no balcão:
   - Busca de produtos
   - Carrinho de compras
   - Pagamentos (dinheiro, cartão, etc.)
   - Emissão de cupom fiscal (NFC-e)*

   * requires NFC-e configuration

2.8 CAIXA

   Gestão de fluxo de caixa:
   - Abertura e fechamento de caixa
   - Sangrias
   - Suprimentos
   - Relatórios

2.9 COMISSÕES

   Cálculo e acompanhamento de comissões:
   - Por profissional
   - Por período
   - Comissionamento automático baseado em agendamentos

2.10 FINANCEIRO

   Controle financeiro completo:
   - Entradas e saídas
   - Categorias personalizadas
   - Relatórios
   - Gráficos de evolução

2.11 FIDELIDADE

   Programa de pontos para clientes:
   - Sistema de pontos por serviço
   - Resgate de recompensas
   - Configuração de planos de fidelidade

2.12 AGENDAMENTO ONLINE

   Configuração do sistema de agendamento:
   - Ativar/desativar
   - Configurar horários por dia
   - Definir número de cadeiras
   - Copiar link para clientes

2.13 CONFIGURAÇÕES

   Ajustes gerais do sistema:
   - Dados do salão
   - Configurações de NFC-e
   - Download do manual

================================================================================
3. GERENCIANDO PROFISSIONAIS
================================================================================

3.1 CADASTRAR PROFISSIONAL

   1. Vá em PESSOAS → aba PROFISSIONAIS
   2. Clique em NOVO PROFISSIONAL
   3. Preencha os dados pessoais
   4. Configure comissão (% ou valor fixo)
   5. Configure acesso ao sistema (opcional)
   6. Vincule os serviços que ele pode realizar
   7. Clique em SALVAR

3.2 CONFIGURAR ACESSO AO SISTEMA

   Na edição do profissional:

   ┌─────────────────────────────────────────┐
   │ 🔑 ACESSO AO SISTEMA              [ON]  │
   │                                         │
   │ ┌─────────────────┐ ┌────────────────┐  │
   │ │ Email de Login  │ │ Senha          │  │
   │ │ prof@email.com │ │ ••••••••       │  │
   │ └─────────────────┘ └────────────────┘  │
   └─────────────────────────────────────────┘

   - Use o botão ON/OFF para ativar/bloquear
   - Defina email e senha

3.3 VINCULAR SERVIÇOS AO PROFISSIONAL

   Na seção SERVIÇOS QUE ATENDE:

   ┌─────────────────────────────────────────┐
   │ ✂️ SERVIÇOS QUE ATENDE                  │
   │                                         │
   │ [✓] Corte      [ ] Hidratação         │
   │ [✓] Barba      [ ] Coloração          │
   └─────────────────────────────────────────┘

   - Se NENHUM serviço for selecionado → atende TODOS
   - Se serviços forem selecionados → só atende os escolhidos

3.4 CONTROLE DE ACESSO

   | Situação          | Efeito                           |
   |-------------------|----------------------------------|
   | acessoAtivo = ON  | Profissional pode fazer login    |
   | acessoAtivo = OFF | Acesso bloqueado                 |
   | Sem email/senha  | Sem acesso ao sistema            |

================================================================================
4. SISTEMA DE AGENDAMENTO ONLINE
================================================================================

4.1 CONFIGURAR HORÁRIOS

   1. Vá em CONFIGURAÇÕES → AGENDAMENTO ONLINE
   2. Ative o agendamento online
   3. Configure os horários por dia:
      - Ligue/desligue cada dia
      - Adicione horários específicos
   4. Use templates rápidos:
      - Todos os dias (08h-18h)
      - Dias úteis (Seg-Sex)
      - Horário estendido

4.2 NÚMERO DE CADEIRAS

   ┌─────────────────────────────────────────┐
   │ 👥 Número de Cadeiras                   │
   │                                         │
   │        [ 5 ]   clientes ao mesmo tempo  │
   └─────────────────────────────────────────┘

   Informe o número de cadeiras do salão.

4.3 LINK PARA CLIENTES

   O sistema gera automaticamente:
   
   https://seu-sistema.com/agendar/{ID_DO_SALÃO}

   Clique em COPIAR LINK para compartilhar.

================================================================================
5. CONTROLE DE CADEIRAS/LOTAÇÃO
================================================================================

5.1 CONFIGURAR NÚMERO DE CADEIRAS

   Define quantas pessoas podem ser atendidas SIMULTANEAMENTE.

   Exemplo: Salão com 5 cadeiras → Informe 5

5.2 VISUALIZAÇÃO NO CALENDÁRIO

   | Indicador    | Significado                       |
   |--------------|----------------------------------|
   | [3/5] verde | 3 agendamentos, 2 vagas livres  |
   | [5/5] vermelho | LOTADO - não aceita mais       |

5.3 COMO FUNCIONA PARA O CLIENTE

   - Se horário tem VAGA → pode agendar ✅
   - Se horário está LOTADO → não aparece ❌

================================================================================
6. PARA PROFISSIONAIS
================================================================================

6.1 COMO FAZER LOGIN

   1. Acesse /profissional
   2. Insira EMAIL e SENHA
   3. Clique em ENTRAR

6.2 BLOQUEAR UM DIA

   1. Clique em GERENCIAR
   2. No calendário, clique no dia a bloquear
   3. Clique em SALVAR

6.3 REATIVAR ACESSO

   Somente o administrador pode reativar:
   1. Admin vai em PESSOAS → PROFISSIONAIS
   2. Edita o cadastro
   3. Ativa o switch ACESSO AO SISTEMA
   4. SALVA

================================================================================
7. FLUXO PARA O CLIENTE AGENDAR
================================================================================

   ┌─────────────────────────────────────────┐
   │ 1. Selecionar Serviço                  │
   │    ✂️ Corte - R$ 45,00 - 30 min       │
   └─────────────────────────────────────────┘
                     ↓
   ┌─────────────────────────────────────────┐
   │ 2. Selecionar Profissional             │
   │    👤 Ana Silva                        │
   └─────────────────────────────────────────┘
                     ↓
   ┌─────────────────────────────────────────┐
   │ 3. Selecionar Data                     │
   │    [Seg] [Ter] [Qua] [Qui] [Sex]     │
   └─────────────────────────────────────────┘
                     ↓
   ┌─────────────────────────────────────────┐
   │ 4. Selecionar Horário                  │
   │    [08:00] [09:00] [10:00] [14:00]   │
   └─────────────────────────────────────────┘
                     ↓
   ┌─────────────────────────────────────────┐
   │ 5. Preencher Dados                     │
   │    Nome: ___________________           │
   │    Telefone: (__) _____-____          │
   └─────────────────────────────────────────┘
                     ↓
   ┌─────────────────────────────────────────┐
   │ ✅ AGENDAMENTO CONFIRMADO!              │
   └─────────────────────────────────────────┘

================================================================================
8. SOLUÇÃO DE PROBLEMAS
================================================================================

| Problema                          | Solução                          |
|-----------------------------------|----------------------------------|
| Profissional não consegue login    | Verificar se acessoAtivo = true  |
| Horário não aparece               | Verificar configuração            |
| Cliente não consegue agendar      | Verificar lotação/disponibilidade |
| Erro ao salvar formulário         | Verificar campos obrigatórios     |
| Dados somem                      | Verificar conexão com Firebase    |

================================================================================

Para suporte, entre em contato com o desenvolvedor.

================================================================================
                              FIM DO MANUAL
================================================================================
    `;

    const blob = new Blob([manualContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'MANUAL_SALONPRO.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const printManualPDF = () => {
    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Manual SalonPro</title>
  <style>
    @page { size: A4; margin: 2cm; }
    body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.4; color: #333; }
    h1 { font-size: 20pt; text-align: center; color: #1a1a1a; border-bottom: 3px solid #666; padding-bottom: 10px; }
    h2 { font-size: 14pt; color: #444; margin-top: 20px; border-left: 4px solid #666; padding-left: 10px; }
    h3 { font-size: 12pt; color: #555; margin-top: 15px; }
    p { margin: 8px 0; text-align: justify; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
    th { background: #f0f0f0; font-weight: bold; }
    .header { text-align: center; margin-bottom: 30px; }
    .version { color: #666; font-size: 10pt; }
    .toc { background: #f9f9f9; padding: 15px; border-radius: 5px; }
    .tip { background: #e8f4e8; padding: 10px; border-left: 4px solid #4CAF50; margin: 10px 0; }
    .warning { background: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin: 10px 0; }
    .page-break { page-break-before: always; }
    ul, ol { margin: 8px 0; padding-left: 25px; }
    li { margin: 4px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>MANUAL DO SISTEMA SALONPRO</h1>
    <p class="version">Versão 1.0 - 17 de Abril de 2026</p>
    <p>Sistema de Gestão para Salões de Beleza</p>
  </div>

  <div class="toc">
    <h2>Índice</h2>
    <ol>
      <li><a href="#acesso">Como Acessar</a></li>
      <li><a href="#painel">Painel do Administrador</a></li>
      <li><a href="#profissionais">Gerenciando Profissionais</a></li>
      <li><a href="#agendamento">Sistema de Agendamento Online</a></li>
      <li><a href="#lotacao">Controle de Cadeiras/Lotação</a></li>
      <li><a href="#prof-login">Para Profissionais</a></li>
      <li><a href="#fluxo">Fluxo para o Cliente Agendar</a></li>
      <li><a href="#problemas">Solução de Problemas</a></li>
    </ol>
  </div>

  <h2 id="acesso">1. Como Acessar</h2>
  
  <h3>1.1 Acesso do Administrador</h3>
  <p>Para acessar o sistema como administrador:</p>
  <ol>
    <li>Acesse o sistema pelo navegador</li>
    <li>Entre com seu USUÁRIO e SENHA</li>
    <li>Você verá o Painel Principal</li>
  </ol>

  <h3>1.2 Acesso do Profissional</h3>
  <ol>
    <li>Acesse /profissional (ou clique em "Sou Profissional")</li>
    <li>Insira seu EMAIL e SENHA (fornecidos pelo administrador)</li>
    <li>Clique em ENTRAR</li>
  </ol>

  <h2 id="painel">2. Painel do Administrador</h2>

  <h3>2.1 Menu Principal</h3>
  <table>
    <tr><th>Menu</th><th>Função</th></tr>
    <tr><td>Dashboard</td><td>Visão geral com estatísticas</td></tr>
    <tr><td>Agenda</td><td>Calendário com todos os agendamentos</td></tr>
    <tr><td>Pessoas</td><td>Gerenciar clientes e profissionais</td></tr>
    <tr><td>Serviços</td><td>Cadastrar serviços oferecidos</td></tr>
    <tr><td>Produtos</td><td>Controle de estoque de produtos</td></tr>
    <tr><td>PDV</td><td>Ponto de Venda</td></tr>
    <tr><td>Caixa</td><td>Gestão de caixa</td></tr>
    <tr><td>Comissões</td><td>Commissionamento de profissionais</td></tr>
    <tr><td>Financeiro</td><td>Entradas e saídas, relatórios</td></tr>
    <tr><td>Fidelidade</td><td>Programa de pontos para clientes</td></tr>
    <tr><td>Agend. Online</td><td>Configurar agendamento online</td></tr>
    <tr><td>Configurações</td><td>Ajustes do sistema</td></tr>
  </table>

  <h3>2.2 Dashboard</h3>
  <p>Visão geral com indicadores:</p>
  <ul>
    <li>Total de agendamentos</li>
    <li>Receita do período</li>
    <li>Clientes cadastrados</li>
    <li>Profissionais ativos</li>
  </ul>

  <h3>2.3 Agenda</h3>
  <p>Calendário visual com todos os agendamentos. Clique em um dia para ver detalhes ou criar novo agendamento.</p>

  <h3>2.4 Pessoas</h3>
  <p>Gerencia dois tipos de pessoas:</p>
  <p><strong>A) CLIENTES:</strong> Cadastro de clientes, histórico de agendamentos, programa de fidelidade.</p>
  <p><strong>B) PROFISSIONAIS:</strong> Cadastro de profissionais, configuração de acesso ao sistema, vincular serviços que podem realizar, controle de acesso (ativo/bloqueado).</p>

  <h3>2.5 Serviços</h3>
  <p>Cadastro dos serviços oferecidos pelo salão:</p>
  <ul>
    <li>Nome do serviço</li>
    <li>Preço</li>
    <li>Duração (em minutos)</li>
  </ul>

  <h3>2.6 Produtos/Estoque</h3>
  <p>Controle de produtos: cadastro de produtos, controle de estoque, gestão de entradas e saídas.</p>

  <h3>2.7 PDV - Ponto de Venda</h3>
  <p>Vendas rápidas no balcão:</p>
  <ul>
    <li>Busca de produtos</li>
    <li>Carrinho de compras</li>
    <li>Pagamentos (dinheiro, cartão, etc.)</li>
    <li>Emissão de cupom fiscal (NFC-e)*</li>
  </ul>
  <p class="tip">* Requer configuração de NFC-e.</p>

  <h3>2.8 Caixa</h3>
  <p>Gestão de fluxo de caixa: abertura e fechamento de caixa, sangrias, suprimentos, relatórios.</p>

  <h3>2.9 Comissões</h3>
  <p>Cálculo e acompanhamento de comissões: por profissional, por período, comissionamento automático baseado em agendamentos.</p>

  <h3>2.10 Financeiro</h3>
  <p>Controle financeiro completo: entradas e saídas, categorias personalizadas, relatórios, gráficos de evolução.</p>

  <h3>2.11 Fidelidade</h3>
  <p>Programa de pontos para clientes: sistema de pontos por serviço, resgate de recompensas, configuração de planos de fidelidade.</p>

  <h3>2.12 Agendamento Online</h3>
  <p>Configuração do sistema de agendamento: ativar/desativar, configurar horários por dia, definir número de cadeiras, copiar link para clientes.</p>

  <h3>2.13 Configurações</h3>
  <p>Ajustes gerais do sistema: dados do salão, configurações de NFC-e, download do manual.</p>

  <h2 id="profissionais">3. Gerenciando Profissionais</h2>

  <h3>3.1 Cadastrar Profissional</h3>
  <ol>
    <li>Vá em PESSOAS → aba PROFISSIONAIS</li>
    <li>Clique em NOVO PROFISSIONAL</li>
    <li>Preencha os dados pessoais</li>
    <li>Configure comissão (% ou valor fixo)</li>
    <li>Configure acesso ao sistema (opcional)</li>
    <li>Vincule os serviços que ele pode realizar</li>
    <li>Clique em SALVAR</li>
  </ol>

  <h3>3.2 Configurar Acesso ao Sistema</h3>
  <p>Na edição do profissional:</p>
  <ul>
    <li>Use o botão ON/OFF para ativar/bloquear o acesso</li>
    <li>Defina email e senha para login</li>
  </ul>

  <h3>3.3 Vincular Serviços ao Profissional</h3>
  <p>Na seção SERVIÇOS QUE ATENDE:</p>
  <ul>
    <li>Se NENHUM serviço for selecionado → atende TODOS os serviços</li>
    <li>Se serviços forem selecionados → só atende os escolhidos</li>
  </ul>

  <h3>3.4 Controle de Acesso</h3>
  <table>
    <tr><th>Situação</th><th>Efeito</th></tr>
    <tr><td>acessoAtivo = ON</td><td>Profissional pode fazer login</td></tr>
    <tr><td>acessoAtivo = OFF</td><td>Acesso bloqueado</td></tr>
    <tr><td>Sem email/senha</td><td>Sem acesso ao sistema</td></tr>
  </table>

  <h2 id="agendamento">4. Sistema de Agendamento Online</h2>

  <h3>4.1 Configurar Horários</h3>
  <ol>
    <li>Vá em CONFIGURAÇÕES → AGENDAMENTO ONLINE</li>
    <li>Ative o agendamento online</li>
    <li>Configure os horários por dia</li>
    <li>Use templates rápidos</li>
  </ol>

  <h3>4.2 Número de Cadeiras</h3>
  <p>Informe o número de cadeiras do salão para controle de lotação.</p>

  <h3>4.3 Link para Clientes</h3>
  <p>O sistema gera automaticamente o link: <code>https://seu-sistema.com/agendar/{ID_DO_SALÃO}</code></p>

  <h2 id="lotacao">5. Controle de Cadeiras/Lotação</h2>

  <h3>5.1 Configurar Número de Cadeiras</h3>
  <p>Define quantas pessoas podem ser atendidas SIMULTANEAMENTE.</p>

  <h3>5.2 Visualização no Calendário</h3>
  <table>
    <tr><th>Indicador</th><th>Significado</th></tr>
    <tr><td>[3/5] verde</td><td>3 agendamentos, 2 vagas livres</td></tr>
    <tr><td>[5/5] vermelho</td><td>LOTADO - não aceita mais</td></tr>
  </table>

  <h3>5.3 Como Funciona para o Cliente</h3>
  <ul>
    <li>Se horário tem VAGA → pode agendar ✅</li>
    <li>Se horário está LOTADO → não aparece ❌</li>
  </ul>

  <h2 id="prof-login">6. Para Profissionais</h2>

  <h3>6.1 Como Fazer Login</h3>
  <ol>
    <li>Acesse /profissional</li>
    <li>Insira EMAIL e SENHA</li>
    <li>Clique em ENTRAR</li>
  </ol>

  <h3>6.2 Bloquear um Dia</h3>
  <ol>
    <li>Clique em GERENCIAR</li>
    <li>No calendário, clique no dia a bloquear</li>
    <li>Clique em SALVAR</li>
  </ol>

  <h3>6.3 Reativar Acesso</h3>
  <p>Somente o administrador pode reativar:</p>
  <ol>
    <li>Admin vai em PESSOAS → PROFISSIONAIS</li>
    <li>Edita o cadastro</li>
    <li>Ativa o switch ACESSO AO SISTEMA</li>
    <li>SALVA</li>
  </ol>

  <h2 id="fluxo">7. Fluxo para o Cliente Agendar</h2>
  <ol>
    <li><strong>Selecionar Serviço</strong> - Cliente escolhe o serviço desejado</li>
    <li><strong>Selecionar Profissional</strong> - Escolhe o profissional (opcional)</li>
    <li><strong>Selecionar Data</strong> - Escolhe o dia disponível</li>
    <li><strong>Selecionar Horário</strong> - Escolhe horário disponível</li>
    <li><strong>Preencher Dados</strong> - Informa nome e telefone</li>
    <li><strong>AGENDAMENTO CONFIRMADO!</strong></li>
  </ol>

  <h2 id="problemas">8. Solução de Problemas</h2>
  <table>
    <tr><th>Problema</th><th>Solução</th></tr>
    <tr><td>Profissional não consegue login</td><td>Verificar se acessoAtivo = true</td></tr>
    <tr><td>Horário não aparece</td><td>Verificar configuração de horários</td></tr>
    <tr><td>Cliente não consegue agendar</td><td>Verificar lotação ou disponibilidade</td></tr>
    <tr><td>Erro ao salvar formulário</td><td>Verificar campos obrigatórios (*)</td></tr>
    <tr><td>Dados somem</td><td>Verificar conexão com Firebase</td></tr>
  </table>

  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; text-align: center;">
    <p>Para suporte, entre em contato com o desenvolvedor.</p>
    <p><strong>SalonPro - Sistema de Gestão para Salões de Beleza</strong></p>
  </div>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Download do Manual */}
      <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <FileText className="w-5 h-5" />
            Manual do Sistema
          </CardTitle>
          <CardDescription>
            Baixe o manual completo do sistema em português Brasil
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={printManualPDF} className="gap-2 bg-blue-600 hover:bg-blue-700">
              <FileType className="w-4 h-4" />
              Baixar PDF
            </Button>
            <Button onClick={downloadManualTxt} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Baixar TXT
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Versão 1.0 - Atualizado em 17/04/2026
          </p>
        </CardContent>
      </Card>

      {/* Configuração NFC-e */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-600" />
            NFC-e - Nota Fiscal ao Consumidor
          </CardTitle>
          <CardDescription>
            Configure a emissão de NFC-e para vendas de produtos. Campos tributários são obrigatórios para envio ao governo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Ativar NFC-e */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Switch 
                checked={nfceConfig.ativo}
                onCheckedChange={(checked) => setNfceConfig({...nfceConfig, ativo: checked})}
              />
              <div>
                <Label className="text-base font-medium">Ativar NFC-e</Label>
                <p className="text-sm text-muted-foreground">
                  Habilita a emissão de notas fiscais para vendas de produtos
                </p>
              </div>
            </div>
            {nfceConfig.ativo ? (
              <Badge className="bg-green-500">Ativo</Badge>
            ) : (
              <Badge variant="secondary">Inativo</Badge>
            )}
          </div>

          {nfceConfig.ativo && (
            <>
              {/* Aviso Importante */}
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-orange-800">Atenção: Dados Tributários</p>
                    <p className="text-sm text-orange-700">
                      Para emitir NFC-e, todos os campos abaixo são OBRIGATÓRIOS conforme exigência da SEFAZ.
                      Cada produto também precisará de seus dados tributários preenchidos.
                    </p>
                  </div>
                </div>
              </div>

              {/* Ambiente */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Ambiente</Label>
                  <Select 
                    value={nfceConfig.ambiente}
                    onValueChange={(v) => setNfceConfig({...nfceConfig, ambiente: v as 'homologacao' | 'producao'})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="homologacao">Homologação (Teste)</SelectItem>
                      <SelectItem value="producao">Produção</SelectItem>
                    </SelectContent>
                  </Select>
                  {nfceConfig.ambiente === 'homologacao' && (
                    <p className="text-xs text-muted-foreground mt-1">Notas de teste, sem valor fiscal</p>
                  )}
                </div>
                <div>
                  <Label>Regime Tributário</Label>
                  <Select 
                    value={nfceConfig.regimeTributario}
                    onValueChange={(v) => setNfceConfig({...nfceConfig, regimeTributario: v as '1' | '2' | '3'})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Simples Nacional</SelectItem>
                      <SelectItem value="2">Simples Nacional - Excesso</SelectItem>
                      <SelectItem value="3">Regime Normal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Dados do Emitente */}
              <Separator />
              <h3 className="font-semibold">Dados do Emitente</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label>CNPJ *</Label>
                  <Input 
                    placeholder="00.000.000/0000-00"
                    value={nfceConfig.cnpj}
                    onChange={(e) => setNfceConfig({...nfceConfig, cnpj: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Inscrição Estadual *</Label>
                  <Input 
                    placeholder="000.000.000"
                    value={nfceConfig.inscricaoEstadual}
                    onChange={(e) => setNfceConfig({...nfceConfig, inscricaoEstadual: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Razão Social *</Label>
                  <Input 
                    placeholder="Empresa LTDA"
                    value={nfceConfig.razaoSocial}
                    onChange={(e) => setNfceConfig({...nfceConfig, razaoSocial: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Nome Fantasia</Label>
                  <Input 
                    placeholder="Nome fantasia"
                    value={nfceConfig.nomeFantasia}
                    onChange={(e) => setNfceConfig({...nfceConfig, nomeFantasia: e.target.value})}
                  />
                </div>
                <div>
                  <Label>UF *</Label>
                  <Select 
                    value={nfceConfig.uf}
                    onValueChange={(v) => setNfceConfig({...nfceConfig, uf: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
                        <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Município *</Label>
                  <Input 
                    placeholder="Cidade"
                    value={nfceConfig.municipio}
                    onChange={(e) => setNfceConfig({...nfceConfig, municipio: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Código IBGE Município *</Label>
                  <Input 
                    placeholder="3550308 (São Paulo)"
                    value={nfceConfig.codigoMunicipio}
                    onChange={(e) => setNfceConfig({...nfceConfig, codigoMunicipio: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input 
                    placeholder="(00) 00000-0000"
                    value={nfceConfig.telefone}
                    onChange={(e) => setNfceConfig({...nfceConfig, telefone: e.target.value})}
                  />
                </div>
                <div>
                  <Label>E-mail</Label>
                  <Input 
                    type="email"
                    placeholder="contato@empresa.com"
                    value={nfceConfig.email}
                    onChange={(e) => setNfceConfig({...nfceConfig, email: e.target.value})}
                  />
                </div>
              </div>

              {/* Tributação Padrão */}
              <Separator />
              <h3 className="font-semibold">Tributação Padrão para Produtos</h3>
              <p className="text-sm text-muted-foreground">
                Estes valores serão usados como padrão ao cadastrar produtos. Cada produto pode ter seus valores específicos.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label>NCM Padrão *</Label>
                  <Input 
                    placeholder="00000000"
                    value={nfceConfig.ncmPadrao}
                    onChange={(e) => setNfceConfig({...nfceConfig, ncmPadrao: e.target.value})}
                  />
                </div>
                <div>
                  <Label>CFOP Saída Padrão *</Label>
                  <Input 
                    placeholder="5102"
                    value={nfceConfig.cfopPadrao}
                    onChange={(e) => setNfceConfig({...nfceConfig, cfopPadrao: e.target.value})}
                  />
                </div>
                <div>
                  <Label>CST ICMS *</Label>
                  <Select 
                    value={nfceConfig.cstIcms}
                    onValueChange={(v) => setNfceConfig({...nfceConfig, cstIcms: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="00">00 - Tributada integralmente</SelectItem>
                      <SelectItem value="20">20 - Com redução de base</SelectItem>
                      <SelectItem value="40">40 - Isenta</SelectItem>
                      <SelectItem value="41">41 - Não tributada</SelectItem>
                      <SelectItem value="60">60 - ICMS cobrado por ST</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>CSOSN (Simples) *</Label>
                  <Select 
                    value={nfceConfig.csosnPadrao}
                    onValueChange={(v) => setNfceConfig({...nfceConfig, csosnPadrao: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="102">102 - SSN sem créditos</SelectItem>
                      <SelectItem value="300">300 - Imune</SelectItem>
                      <SelectItem value="400">400 - Não tributada</SelectItem>
                      <SelectItem value="500">500 - ICMS cobrado ST</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>CST PIS *</Label>
                  <Select 
                    value={nfceConfig.cstPis}
                    onValueChange={(v) => setNfceConfig({...nfceConfig, cstPis: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="01">01 - Operação tributável</SelectItem>
                      <SelectItem value="04">04 - Não tributada</SelectItem>
                      <SelectItem value="08">08 - Alíquota zero</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>CST COFINS *</Label>
                  <Select 
                    value={nfceConfig.cstCofins}
                    onValueChange={(v) => setNfceConfig({...nfceConfig, cstCofins: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="01">01 - Operação tributável</SelectItem>
                      <SelectItem value="04">04 - Não tributada</SelectItem>
                      <SelectItem value="08">08 - Alíquota zero</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Alíquota ICMS (%)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={nfceConfig.aliquotaIcms}
                    onChange={(e) => setNfceConfig({...nfceConfig, aliquotaIcms: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label>Alíquota PIS (%)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={nfceConfig.aliquotaPis}
                    onChange={(e) => setNfceConfig({...nfceConfig, aliquotaPis: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label>Alíquota COFINS (%)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={nfceConfig.aliquotaCofins}
                    onChange={(e) => setNfceConfig({...nfceConfig, aliquotaCofins: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>

              {/* Informações Adicionais */}
              <Separator />
              <div>
                <Label>Informações Complementares (opcional)</Label>
                <textarea
                  className="w-full p-3 border rounded-md min-h-[80px] text-sm"
                  placeholder="Texto que aparecerá em todas as NFC-e..."
                  value={nfceConfig.informacoesAdicionais}
                  onChange={(e) => setNfceConfig({...nfceConfig, informacoesAdicionais: e.target.value})}
                />
              </div>

              {/* Salvar */}
              <div className="flex justify-end gap-4 pt-4">
                <Button 
                  onClick={handleSaveNFCe} 
                  disabled={saving}
                  className="gap-2 bg-orange-600 hover:bg-orange-700"
                >
                  {saving ? (
                    <>Salvando...</>
                  ) : saved ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Salvo!
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      Salvar Configurações NFC-e
                    </>
                  )}
                </Button>
              </div>

              {/* Aviso sobre implementação */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Nota:</strong> A integração real com a SEFAZ requer certificado digital e conexão com os web services
                  estaduais. Esta configuração serve como base para准备工作. 
                  Para produção, será necessário implementar a comunicação com os serviços da Sefaz do seu estado.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Sistema - Version Management */}
      <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
            <RefreshCw className="w-5 h-5" />
            Sistema
          </CardTitle>
          <CardDescription>
            Gerencie atualizações e notificações de versão
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border">
              <p className="text-sm text-muted-foreground">Versão Atual do Código</p>
              <p className="text-2xl font-bold text-purple-600">{SISTEMA_VERSION}</p>
              <p className="text-xs text-muted-foreground">{SISTEMA_VERSION_DATE}</p>
            </div>
            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border">
              <p className="text-sm text-muted-foreground">Versão no Firebase</p>
              <p className="text-2xl font-bold">{versaoFirebase || '-'}</p>
              {versaoFirebase !== SISTEMA_VERSION && (
                <p className="text-xs text-orange-500">Diferente do código</p>
              )}
            </div>
            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border">
              <p className="text-sm text-muted-foreground">Notificação</p>
              <Badge variant={notificacaoAtiva ? 'default' : 'secondary'} className="mt-1">
                {notificacaoAtiva ? 'Ativa' : 'Inativa'}
              </Badge>
            </div>
          </div>

          {versaoFirebase !== SISTEMA_VERSION && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-800">Versão desatualizada</p>
                  <p className="text-sm text-orange-700 mt-1">
                    A versão no Firebase ({versaoFirebase || 'não definida'}) é diferente da versão do código ({SISTEMA_VERSION}).
                    Todos os admins verão um banner de atualização quando acessarem.
                  </p>
                </div>
              </div>
            </div>
          )}

          <Separator />

          <div>
            <Label className="text-base font-semibold">Changelog - O que há de novo?</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Adicione as novidades desta versão. Elas aparecerão no banner para os admins.
            </p>
            <div className="space-y-2">
              {changelog.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={item}
                    onChange={(e) => {
                      const newChangelog = [...changelog];
                      newChangelog[index] = e.target.value;
                      setChangelog(newChangelog);
                    }}
                    placeholder={`Descrição da novidade ${index + 1}`}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-700"
                    onClick={() => {
                      const newChangelog = changelog.filter((_, i) => i !== index);
                      setChangelog(newChangelog);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setChangelog([...changelog, ''])}
              >
                <Plus className="h-4 w-4" />
                Adicionar novidade
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Switch
                checked={notificacaoAtiva}
                onCheckedChange={setNotificacaoAtiva}
              />
              <div>
                <Label className="font-medium">Ativar notificação de atualização</Label>
                <p className="text-sm text-muted-foreground">
                  Mostra banner para admins quando a versão for diferente
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button
              onClick={handleSaveSistema}
              disabled={savingSistema}
              className="gap-2 bg-purple-600 hover:bg-purple-700"
            >
              {savingSistema ? (
                <>Salvando...</>
              ) : savedSistema ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Salvo!
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Publicar Atualização
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
