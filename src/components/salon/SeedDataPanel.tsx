'use client';

import { useState } from 'react';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Database, Play, Trash2, AlertTriangle, CheckCircle, Loader2,
  Building2, Calendar, Hash, Settings
} from 'lucide-react';
import { collection, doc, addDoc, getDoc, getDocs, deleteDoc } from 'firebase/firestore';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// =====================================
// INTERFACES
// =====================================
interface SeedDataPanelProps {
  db: any;
  saloes: any[];
  onRefresh: () => void;
}

// =====================================
// DADOS FICTÍCIOS PARA GERAÇÃO
// =====================================
const NOMES_CLIENTES = [
  'MARIA SILVA', 'ANA SANTOS', 'JULIA OLIVEIRA', 'CARLA SOUZA', 'PATRICIA LIMA',
  'FERNANDA COSTA', 'CAMILA PEREIRA', 'LUCIANA RODRIGUES', 'MARIANA ALMEIDA', 'BEATRIZ FERREIRA',
  'JESSICA GOMES', 'LETICIA MARTINS', 'VANESSA ARAUJO', 'RENATA MELO', 'DANIELA BARBOSA',
  'JULIANA ROCHA', 'TATIANA DIAS', 'LARISSA CARVALHO', 'NATALIA RIBEIRO', 'AMANDA NASCIMENTO',
  'MARIANA TEIXEIRA', 'BRUNA CASTRO', 'THAINA MOREIRA', 'GABRIELA MENDES', 'VIVIANE LOPES',
  'PRISCILA VIEIRA', 'MICHELLE SANTANA', 'DEBORA FREITAS', 'CRISTINA PAIVA', 'LUCIMARA MOURA',
  'JOAO PEDRO', 'MARCOS PAULO', 'LUCAS GABRIEL', 'GABRIEL HENRIQUE', 'BRUNO HENRIQUE',
  'PEDRO HENRIQUE', 'RAFAEL SILVA', 'FELIPE SANTOS', 'GUSTAVO OLIVEIRA', 'DANIEL SOUZA',
  'MATHEUS LIMA', 'LEONARDO COSTA', 'THIAGO PEREIRA', 'VITOR RODRIGUES', 'GUILHERME ALMEIDA',
  'RODRIGO FERREIRA', 'ANDRE GOMES', 'FERNANDO MARTINS', 'RICARDO ARAUJO', 'EDUARDO MELO'
];

const NOMES_PROFISSIONAIS = [
  'JESSICA BELEZA', 'CARLA ESTILO', 'ANA CARLA', 'PATRICIA HAIR', 'FERNANDA NAILS',
  'CAMILA MAKE', 'LUCIANA COLOR', 'MARIANA CORTES', 'JULIA DESIGN', 'RENATA SPA'
];

const SERVICOS_COMUNS = [
  { nome: 'CORTE FEMININO', preco: 80, duracao: 45 },
  { nome: 'CORTE MASCULINO', preco: 45, duracao: 30 },
  { nome: 'MECHAS', preco: 180, duracao: 120 },
  { nome: 'LUZES', preco: 200, duracao: 150 },
  { nome: 'COLORACAO', preco: 120, duracao: 90 },
  { nome: 'ESCOVA', preco: 60, duracao: 30 },
  { nome: 'HIDRATACAO', preco: 80, duracao: 40 },
  { nome: 'BOTOX CAPILAR', preco: 150, duracao: 60 },
  { nome: 'PROGRESSIVA', preco: 250, duracao: 120 },
  { nome: 'MANICURE', preco: 35, duracao: 30 },
  { nome: 'PEDICURE', preco: 40, duracao: 35 },
  { nome: 'DESIGN DE SOBRANCELHAS', preco: 30, duracao: 20 },
  { nome: 'MAQUIAGEM', preco: 100, duracao: 60 },
  { nome: 'MAQUIAGEM NOIVA', preco: 300, duracao: 120 },
  { nome: 'TRATAMENTO FACIAL', preco: 120, duracao: 60 },
  { nome: 'MASSAGEM RELAXANTE', preco: 100, duracao: 50 },
  { nome: 'UNHAS DE GEL', preco: 150, duracao: 90 },
  { nome: 'ALONGAMENTO UNHAS', preco: 180, duracao: 120 },
  { nome: 'BARBA', preco: 35, duracao: 20 },
  { nome: 'CORTE + BARBA', preco: 70, duracao: 45 }
];

const CATEGORIAS_DESPESA = ['ALUGUEL', 'LUZ', 'AGUA', 'INTERNET', 'SALARIO', 'COMISSAO', 'PRODUTOS', 'EQUIPAMENTOS', 'MARKETING'];

const FORMAS_PAGAMENTO = ['Dinheiro', 'PIX', 'Cartao Credito', 'Cartao Debito'];

// =====================================
// FUNÇÕES AUXILIARES
// =====================================
const randomElement = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;

const gerarTelefone = (): string => {
  const ddd = randomInt(11, 99);
  const parte1 = randomInt(90000, 99999);
  const parte2 = randomInt(1000, 9999);
  return `(${ddd}) ${parte1}-${parte2}`;
};

const gerarHora = (): string => {
  const hora = randomInt(8, 19);
  const minuto = [0, 15, 30, 45][randomInt(0, 3)];
  return `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;
};

const gerarId = (): string => Math.random().toString(36).substring(2, 15);

// =====================================
// COMPONENTE PRINCIPAL
// =====================================
export default function SeedDataPanel({ db, saloes, onRefresh }: SeedDataPanelProps) {
  const [salaoSelecionado, setSalaoSelecionado] = useState<string>('');
  const [dataInicio, setDataInicio] = useState<string>(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [dataFim, setDataFim] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [quantidadeClientes, setQuantidadeClientes] = useState<number>(30);
  const [quantidadeAgendamentos, setQuantidadeAgendamentos] = useState<number>(100);
  const [quantidadeFinanceiro, setQuantidadeFinanceiro] = useState<number>(150);
  const [incluirProdutos, setIncluirProdutos] = useState<boolean>(true);
  const [incluirProfissionais, setIncluirProfissionais] = useState<boolean>(true);
  const [incluirServicos, setIncluirServicos] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  // =====================================
  // FUNÇÃO PRINCIPAL DE GERAÇÃO
  // =====================================
  const handleGenerateData = async () => {
    if (!salaoSelecionado) {
      setError('Selecione um salão para popular os dados.');
      return;
    }

    setLoading(true);
    setProgress(0);
    setResult(null);
    setError('');

    try {
      const diasPeriodo = eachDayOfInterval({
        start: new Date(dataInicio),
        end: new Date(dataFim)
      });

      // Arrays para armazenar IDs
      let profissionaisIds: string[] = [];
      let servicosIds: string[] = [];
      let clientesIds: string[] = [];

      // Calcular total de operações
      let totalOps = 0;
      if (incluirProfissionais) totalOps += NOMES_PROFISSIONAIS.length;
      if (incluirServicos) totalOps += SERVICOS_COMUNS.length;
      if (incluirProdutos) totalOps += 10;
      totalOps += quantidadeClientes;
      totalOps += quantidadeAgendamentos;
      totalOps += quantidadeFinanceiro;

      let currentOp = 0;
      const updateProgress = (msg: string) => {
        currentOp++;
        setProgress(Math.round((currentOp / totalOps) * 100));
        setProgressMessage(msg);
      };

      // 1. Criar Profissionais
      if (incluirProfissionais) {
        for (const nome of NOMES_PROFISSIONAIS) {
          const profData = {
            nome,
            celular: gerarTelefone(),
            email: `${nome.toLowerCase().replace(' ', '.')}@email.com`,
            status: 'ativo',
            percentualComissao: randomInt(10, 30),
            tipoComissao: 'percentual',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          const docRef = await addDoc(collection(db, 'saloes', salaoSelecionado, 'profissionais'), profData);
          profissionaisIds.push(docRef.id);
          updateProgress(`Profissional: ${nome}`);
        }
      } else {
        // Buscar existentes
        const snap = await getDocs(collection(db, 'saloes', salaoSelecionado, 'profissionais'));
        profissionaisIds = snap.docs.map(d => d.id);
      }

      // 2. Criar Serviços
      if (incluirServicos) {
        for (const serv of SERVICOS_COMUNS) {
          const docRef = await addDoc(collection(db, 'saloes', salaoSelecionado, 'servicos'), {
            ...serv,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          servicosIds.push(docRef.id);
          updateProgress(`Serviço: ${serv.nome}`);
        }
      } else {
        const snap = await getDocs(collection(db, 'saloes', salaoSelecionado, 'servicos'));
        servicosIds = snap.docs.map(d => d.id);
      }

      // 3. Criar Produtos
      let produtosCount = 0;
      if (incluirProdutos) {
        const produtos = [
          { nome: 'SHAMPOO PROFISSIONAL', precoVenda: 45, precoCusto: 25, quantidadeEstoque: randomInt(20, 50), estoqueMinimo: 10 },
          { nome: 'CONDICIONADOR', precoVenda: 50, precoCusto: 28, quantidadeEstoque: randomInt(20, 50), estoqueMinimo: 10 },
          { nome: 'MASCARA CAPILAR', precoVenda: 65, precoCusto: 35, quantidadeEstoque: randomInt(15, 30), estoqueMinimo: 8 },
          { nome: 'OLEO REPARADOR', precoVenda: 55, precoCusto: 30, quantidadeEstoque: randomInt(15, 30), estoqueMinimo: 8 },
          { nome: 'SPRAY FINALIZADOR', precoVenda: 40, precoCusto: 20, quantidadeEstoque: randomInt(20, 40), estoqueMinimo: 10 },
          { nome: 'CREME PARA PENTEAR', precoVenda: 35, precoCusto: 18, quantidadeEstoque: randomInt(25, 50), estoqueMinimo: 12 },
          { nome: 'GEL MODELADOR', precoVenda: 25, precoCusto: 12, quantidadeEstoque: randomInt(20, 40), estoqueMinimo: 10 },
          { nome: 'POMADA MODELADORA', precoVenda: 38, precoCusto: 18, quantidadeEstoque: randomInt(15, 30), estoqueMinimo: 8 },
          { nome: 'ESMALTE VARIADO', precoVenda: 15, precoCusto: 6, quantidadeEstoque: randomInt(50, 100), estoqueMinimo: 20 },
          { nome: 'BASE PARA UNHAS', precoVenda: 35, precoCusto: 18, quantidadeEstoque: randomInt(15, 30), estoqueMinimo: 8 }
        ];

        for (const prod of produtos) {
          await addDoc(collection(db, 'saloes', salaoSelecionado, 'produtos'), {
            ...prod,
            nome: prod.nome.toUpperCase(),
            mostrarNoPdv: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          produtosCount++;
          updateProgress(`Produto: ${prod.nome}`);
        }
      }

      // 4. Criar Clientes
      for (let i = 0; i < quantidadeClientes; i++) {
        const nome = NOMES_CLIENTES[i % NOMES_CLIENTES.length];
        const clienteData = {
          nome: i >= NOMES_CLIENTES.length ? `${nome} ${i + 1}` : nome,
          telefone: gerarTelefone(),
          email: `${nome.toLowerCase().replace(' ', '.')}@email.com`,
          cidade: randomElement(['SAO PAULO', 'RIO DE JANEIRO', 'BELO HORIZONTE', 'CURITIBA', 'SALVADOR']),
          estado: randomElement(['SP', 'RJ', 'MG', 'PR', 'BA']),
          pontosFidelidade: randomInt(0, 50),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const docRef = await addDoc(collection(db, 'saloes', salaoSelecionado, 'clientes'), clienteData);
        clientesIds.push(docRef.id);
        updateProgress(`Cliente ${i + 1}/${quantidadeClientes}`);
      }

      // 5. Criar Agendamentos
      let agendamentosCount = 0;
      for (let i = 0; i < quantidadeAgendamentos; i++) {
        const dia = randomElement(diasPeriodo);
        const dataStr = format(dia, 'yyyy-MM-dd');
        const hora = gerarHora();

        const clienteNome = NOMES_CLIENTES[i % NOMES_CLIENTES.length];
        const profId = profissionaisIds.length > 0 ? randomElement(profissionaisIds) : '';
        const serv = SERVICOS_COMUNS[i % SERVICOS_COMUNS.length];

        const statusRandom = Math.random();
        const status = statusRandom < 0.6 ? 'Concluido' : statusRandom < 0.8 ? 'Confirmado' : statusRandom < 0.9 ? 'Pendente' : 'Cancelado';

        await addDoc(collection(db, 'saloes', salaoSelecionado, 'agendamentos'), {
          data: dataStr,
          hora,
          horaFim: `${parseInt(hora.split(':')[0]) + Math.floor(serv.duracao / 60)}:${(parseInt(hora.split(':')[1]) + serv.duracao % 60) % 60}`.padStart(5, '0'),
          clienteNome,
          clienteTelefone: gerarTelefone(),
          servico: serv.nome,
          profissionalId: profId,
          profissional: NOMES_PROFISSIONAIS[profissionaisIds.indexOf(profId)] || 'PROFISSIONAL',
          status,
          valor: serv.preco,
          duracao: serv.duracao,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        agendamentosCount++;
        updateProgress(`Agendamento ${i + 1}/${quantidadeAgendamentos}`);
      }

      // 6. Criar Lançamentos Financeiros
      let financeiroCount = 0;
      for (let i = 0; i < quantidadeFinanceiro; i++) {
        const dia = randomElement(diasPeriodo);
        const dataStr = format(dia, 'yyyy-MM-dd');

        // 70% receitas, 30% despesas
        if (Math.random() < 0.7) {
          const serv = randomElement(SERVICOS_COMUNS);
          await addDoc(collection(db, 'saloes', salaoSelecionado, 'financeiro'), {
            data: dataStr,
            descricao: `${randomElement(['ATENDIMENTO', 'SERVICO', 'VENDA'])} - ${serv.nome}`,
            tipo: 'entrada',
            valor: serv.preco + randomInt(-20, 20),
            formaPagamento: randomElement(FORMAS_PAGAMENTO),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        } else {
          const categoria = randomElement(CATEGORIAS_DESPESA);
          const valor = categoria === 'ALUGUEL' ? randomInt(2000, 5000) :
                        categoria === 'SALARIO' ? randomInt(1500, 3000) :
                        categoria === 'COMISSAO' ? randomInt(500, 1500) :
                        randomInt(100, 500);

          await addDoc(collection(db, 'saloes', salaoSelecionado, 'financeiro'), {
            data: dataStr,
            descricao: categoria,
            tipo: 'saida',
            valor,
            observacoes: `${categoria} - ${format(dia, 'MMMM/yyyy', { locale: ptBR })}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
        financeiroCount++;
        updateProgress(`Lançamento ${i + 1}/${quantidadeFinanceiro}`);
      }

      setResult({
        clientes: quantidadeClientes,
        profissionais: incluirProfissionais ? NOMES_PROFISSIONAIS.length : 0,
        servicos: incluirServicos ? SERVICOS_COMUNS.length : 0,
        produtos: produtosCount,
        agendamentos: agendamentosCount,
        financeiro: financeiroCount
      });

      onRefresh();
    } catch (err: any) {
      console.error('Erro ao gerar dados:', err);
      setError(`Erro ao gerar dados: ${err.message}`);
    } finally {
      setLoading(false);
      setProgress(100);
      setProgressMessage('Concluído!');
    }
  };

  // =====================================
  // FUNÇÃO PARA LIMPAR DADOS
  // =====================================
  const handleClearData = async () => {
    if (!salaoSelecionado) {
      setError('Selecione um salão para limpar os dados.');
      return;
    }

    if (!confirm('⚠️ ATENÇÃO: Esta ação excluirá TODOS os dados do salão selecionado (clientes, profissionais, serviços, agendamentos, financeiro, produtos). Deseja continuar?')) {
      return;
    }

    setLoading(true);
    setProgress(0);
    setError('');

    try {
      const subcolecoes = ['clientes', 'profissionais', 'servicos', 'agendamentos', 'financeiro', 'produtos'];
      let totalDeleted = 0;

      for (const subcolecao of subcolecoes) {
        const snapshot = await getDocs(collection(db, 'saloes', salaoSelecionado, subcolecao));
        for (const docSnapshot of snapshot.docs) {
          await deleteDoc(docSnapshot.ref);
          totalDeleted++;
          setProgress(Math.round((totalDeleted / (totalDeleted + snapshot.size)) * 100));
          setProgressMessage(`Excluindo ${subcolecao}...`);
        }
      }

      // Excluir config de caixa
      try {
        await deleteDoc(doc(db, 'saloes', salaoSelecionado, 'config', 'caixa'));
      } catch (e) {
        // Ignorar
      }

      setResult({
        clientes: 0,
        profissionais: 0,
        servicos: 0,
        produtos: 0,
        agendamentos: 0,
        financeiro: 0
      });

      alert(`✅ Dados excluídos com sucesso! ${totalDeleted} registros removidos.`);
      onRefresh();
    } catch (err: any) {
      console.error('Erro ao limpar dados:', err);
      setError(`Erro ao limpar dados: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // RENDER
  // =====================================
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Database className="w-6 h-6 text-purple-600" />
            Popular Base de Dados
          </h2>
          <p className="text-muted-foreground">
            Gere dados fictícios realistas para testes e demonstrações
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configurações */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configurações
            </CardTitle>
            <CardDescription>
              Configure os parâmetros para geração dos dados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Seleção do Salão */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Salão
              </Label>
              <Select value={salaoSelecionado} onValueChange={setSalaoSelecionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um salão" />
                </SelectTrigger>
                <SelectContent>
                  {saloes.map((salao: any) => (
                    <SelectItem key={salao.id} value={salao.id}>
                      {salao.nome} ({salao.plano || 'Básico'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Período */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Data Início
                </Label>
                <Input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                />
              </div>
            </div>

            {/* Quantidades */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  Clientes
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="200"
                  value={quantidadeClientes}
                  onChange={(e) => setQuantidadeClientes(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Agendamentos</Label>
                <Input
                  type="number"
                  min="1"
                  max="500"
                  value={quantidadeAgendamentos}
                  onChange={(e) => setQuantidadeAgendamentos(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Lanç. Financeiros</Label>
                <Input
                  type="number"
                  min="1"
                  max="500"
                  value={quantidadeFinanceiro}
                  onChange={(e) => setQuantidadeFinanceiro(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <Label className="cursor-pointer">Profissionais</Label>
                <Switch checked={incluirProfissionais} onCheckedChange={setIncluirProfissionais} />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <Label className="cursor-pointer">Serviços</Label>
                <Switch checked={incluirServicos} onCheckedChange={setIncluirServicos} />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <Label className="cursor-pointer">Produtos</Label>
                <Switch checked={incluirProdutos} onCheckedChange={setIncluirProdutos} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status e Ações */}
        <div className="space-y-4">
          {/* Progress */}
          {(loading || progress > 0) && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  <span className="font-medium">Processando...</span>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground">{progressMessage}</p>
              </CardContent>
            </Card>
          )}

          {/* Resultado */}
          {result && !loading && (
            <Card className="border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-green-600 mb-3">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Operação Concluída!</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {result.clientes > 0 && <Badge variant="secondary">{result.clientes} clientes</Badge>}
                  {result.profissionais > 0 && <Badge variant="secondary">{result.profissionais} profissionais</Badge>}
                  {result.servicos > 0 && <Badge variant="secondary">{result.servicos} serviços</Badge>}
                  {result.produtos > 0 && <Badge variant="secondary">{result.produtos} produtos</Badge>}
                  <Badge variant="secondary">{result.agendamentos} agendamentos</Badge>
                  <Badge variant="secondary">{result.financeiro} lançamentos</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Erro */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Botões de Ação */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <Button
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={handleGenerateData}
                disabled={loading || !salaoSelecionado}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Gerar Dados
                  </>
                )}
              </Button>

              <Button
                variant="destructive"
                className="w-full"
                onClick={handleClearData}
                disabled={loading || !salaoSelecionado}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Limpar Dados do Salão
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-2">📋 O que será gerado?</h4>
            <ul className="text-sm text-blue-600 dark:text-blue-300 space-y-1">
              <li>• Clientes com dados completos</li>
              <li>• Profissionais com comissões</li>
              <li>• Serviços com preços realistas</li>
              <li>• Produtos com estoque</li>
              <li>• Agendamentos variados</li>
              <li>• Lançamentos financeiros</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <CardContent className="p-4">
            <h4 className="font-semibold text-yellow-700 dark:text-yellow-400 mb-2">⚠️ Atenção</h4>
            <ul className="text-sm text-yellow-600 dark:text-yellow-300 space-y-1">
              <li>• Os dados são fictícios para testes</li>
              <li>• "Limpar Dados" remove TUDO do salão</li>
              <li>• Use em ambiente de desenvolvimento</li>
              <li>• Recomendado gerar antes de demonstrar</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">💡 Dicas</h4>
            <ul className="text-sm text-green-600 dark:text-green-300 space-y-1">
              <li>• Gere dados de 30-90 dias</li>
              <li>• Quantidades equilibradas</li>
              <li>• Teste o BI com dados reais</li>
              <li>• Demonstre todas as features</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
