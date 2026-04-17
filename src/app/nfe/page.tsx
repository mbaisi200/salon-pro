'use client';

import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useSalonStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  parseNFeXML,
  matchProdutoByCodigoOuEan,
  formatarCNPJ,
  formatarCEP,
  type NFeParsed,
  type NFeProduto,
} from '@/lib/nfe-parser';
import {
  Upload,
  FileText,
  Package,
  Truck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Loader2,
  DollarSign,
  ArrowDownToLine,
  Search,
  Eye,
  RefreshCw,
  FileUp,
  Trash2,
  ChevronLeft,
  FileWarning,
} from 'lucide-react';
import { doc, collection, addDoc, getDocs, query, where, orderBy, setDoc, deleteDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';

interface NFeImportada {
  id: string;
  chaveAcesso: string;
  numero: string;
  serie: string;
  data: string;
  fornecedorNome: string;
  fornecedorCnpj: string;
  valorTotal: number;
  produtosCount: number;
  criadoEm: string;
}

interface ProdutoImportacao {
  nfeProduto: NFeProduto;
  status: 'cadastrado' | 'novo';
  produtoId?: string;
  produtoNome?: string;
  selecionado: boolean;
  unidadesPorCaixa: number;
  markupPercentual: number;
  precoVenda: number;
  irParaEstoque: boolean;
  categoriaId: string;
}

const CATEGORIAS_FIXAS = [
  { value: 'SHAMPOO', label: 'Shampoo' },
  { value: 'CONDICIONADOR', label: 'Condicionador' },
  { value: 'TRATAMENTO', label: 'Tratamento' },
  { value: 'FINALIZADOR', label: 'Finalizador' },
  { value: 'COLORACAO', label: 'Coloração' },
  { value: 'DESCOLORANTE', label: 'Descolorante' },
  { value: 'PERFUME', label: 'Perfume' },
  { value: 'ACESSORIO', label: 'Acessório' },
  { value: 'OUTROS', label: 'Outros' },
];

export default function NFePage() {
  const { tenant, produtos } = useSalonStore();
  const db = getFirebaseDb();

  const [activeTab, setActiveTab] = useState<'entrada' | 'importar'>('entrada');
  const [nfeList, setNfeList] = useState<NFeImportada[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const [nfeData, setNfeData] = useState<NFeParsed | null>(null);
  const [produtosImportacao, setProdutosImportacao] = useState<ProdutoImportacao[]>([]);
  const [dialogPreview, setDialogPreview] = useState(false);
  const [dialogSucesso, setDialogSucesso] = useState(false);
  const [importando, setImportando] = useState(false);
  const [fileName, setFileName] = useState('');
  const [parseError, setParseError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const [markupDefault, setMarkupDefault] = useState('30');
  const [nfeDuplicada, setNfeDuplicada] = useState<NFeImportada | null>(null);
  const [resultadoImportacao, setResultadoImportacao] = useState<any>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (tenant && activeTab === 'entrada') {
      fetchNFeList();
    }
  }, [tenant, activeTab]);

  const fetchNFeList = async () => {
    if (!tenant) return;
    setLoadingList(true);
    try {
      const q = query(
        collection(db, 'saloes', tenant.id, 'nfe_importadas'),
        orderBy('criadoEm', 'desc')
      );
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NFeImportada));
      setNfeList(list);
    } catch (error) {
      console.error('Erro ao buscar NF-e:', error);
    } finally {
      setLoadingList(false);
    }
  };

  const processarArquivo = async (file: File) => {
    if (!file.name.endsWith('.xml')) {
      setParseError('Por favor, selecione um arquivo .xml');
      return;
    }

    setParseError('');
    setFileName(file.name);
    setNfeDuplicada(null);

    try {
      const texto = await file.text();
      const dados = parseNFeXML(texto);
      setNfeData(dados);

      const produtosMapeados: ProdutoImportacao[] = dados.produtos.map((p) => {
        const existente = produtos.find((prod: any) =>
          matchProdutoByCodigoOuEan(prod, p)
        );

        let unidadesPorCaixa = 0;
        const uCom = (p.unidade || '').toUpperCase();
        const uTrib = (p.unidadeTributavel || '').toUpperCase();
        if (uCom !== uTrib && uTrib === 'UN' && p.quantidade > 0 && p.quantidadeTributavel > 0) {
          unidadesPorCaixa = Math.round(p.quantidadeTributavel / p.quantidade);
        }
        if (unidadesPorCaixa < 1) unidadesPorCaixa = 0;

        const markup = parseFloat(markupDefault) || 30;
        return {
          nfeProduto: p,
          status: existente ? 'cadastrado' : 'novo',
          produtoId: existente?.id,
          produtoNome: existente?.nome,
          selecionado: true,
          irParaEstoque: true,
          unidadesPorCaixa,
          markupPercentual: markup,
          precoVenda: arredondarPreco(p.valorUnitario * (1 + markup / 100)),
          categoriaId: 'OUTROS',
        };
      });

      setProdutosImportacao(produtosMapeados);

      if (dados.chaveAcesso && tenant) {
        verificarNFeDuplicada(dados.chaveAcesso);
      }

      setDialogPreview(true);
    } catch (error: any) {
      setParseError(error.message || 'Erro ao processar o arquivo XML');
    }
  };

  const verificarNFeDuplicada = async (chaveAcesso: string) => {
    if (!tenant) return;
    try {
      const q = query(
        collection(db, 'saloes', tenant.id, 'nfe_importadas'),
        where('chaveAcesso', '==', chaveAcesso)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        setNfeDuplicada({ id: doc.id, ...doc.data() } as NFeImportada);
      } else {
        setNfeDuplicada(null);
      }
    } catch {
      setNfeDuplicada(null);
    }
  };

  const arredondarPreco = (v: number): number => Math.round(v / 0.05) * 0.05;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processarArquivo(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processarArquivo(file);
  };

  const toggleProduto = (index: number) => {
    setProdutosImportacao(prev =>
      prev.map((p, i) => i === index ? { ...p, selecionado: !p.selecionado } : p)
    );
  };

  const toggleTodos = (selecionado: boolean) => {
    setProdutosImportacao(prev => prev.map(p => ({ ...p, selecionado })));
  };

  const updatePrecoVenda = (index: number, value: string) => {
    const num = parseFloat(value) || 0;
    setProdutosImportacao(prev =>
      prev.map((p, i) =>
        i === index
          ? (() => {
              const custo = p.nfeProduto.valorUnitario;
              const markupCalc = custo > 0 ? ((num / custo) - 1) * 100 : 0;
              return { ...p, precoVenda: num, markupPercentual: Math.round(markupCalc * 10) / 10 };
            })()
          : p
      )
    );
  };

  const updateMarkupProduto = (index: number, value: string) => {
    const markup = parseFloat(value) || 0;
    setProdutosImportacao(prev =>
      prev.map((p, i) =>
        i === index
          ? {
              ...p,
              markupPercentual: markup,
              precoVenda: arredondarPreco(p.nfeProduto.valorUnitario * (1 + markup / 100)),
            }
          : p
      )
    );
  };

  const updateCategoria = (index: number, categoriaId: string) => {
    setProdutosImportacao(prev =>
      prev.map((p, i) => i === index ? { ...p, categoriaId } : p)
    );
  };

  const toggleIrParaEstoque = (index: number, value: boolean) => {
    setProdutosImportacao(prev =>
      prev.map((p, i) => i === index ? { ...p, irParaEstoque: value } : p)
    );
  };

  const toggleIrParaEstoqueTodos = (value: boolean) => {
    setProdutosImportacao(prev => prev.map(p => ({ ...p, irParaEstoque: value })));
  };

  const applyMarkupAll = () => {
    const markup = parseFloat(markupDefault) || 30;
    setProdutosImportacao(prev =>
      prev.map(p => ({
        ...p,
        markupPercentual: markup,
        precoVenda: arredondarPreco(p.nfeProduto.valorUnitario * (1 + markup / 100)),
      }))
    );
  };

  const confirmarImportacao = async () => {
    if (!nfeData || !tenant) return;

    if (nfeDuplicada) {
      alert('Esta NFe já foi importada! Não é possível importar novamente.');
      return;
    }

    const produtosSelecionados = produtosImportacao.filter(p => p.selecionado);
    if (produtosSelecionados.length === 0) {
      alert('Selecione ao menos um produto para importar');
      return;
    }

    setImportando(true);

    try {
      const nfeId = `nfe_${Date.now()}`;
      const now = new Date().toISOString();

      const nfeRecord: NFeImportada = {
        id: nfeId,
        chaveAcesso: nfeData.chaveAcesso || '',
        numero: nfeData.numero,
        serie: nfeData.serie,
        data: nfeData.dataEmissao.toISOString().split('T')[0],
        fornecedorNome: nfeData.emitente.nome,
        fornecedorCnpj: nfeData.emitente.cnpj,
        valorTotal: nfeData.valorTotal,
        produtosCount: produtosSelecionados.length,
        criadoEm: now,
      };

      await setDoc(doc(db, 'saloes', tenant.id, 'nfe_importadas', nfeId), nfeRecord);

      let novosProdutos = 0;
      let atualizadosEstoque = 0;

      for (const item of produtosSelecionados) {
        if (item.status === 'novo') {
          const novoProduto = {
            nome: item.nfeProduto.descricao.toUpperCase(),
            codigo: item.nfeProduto.codigo,
            codigoBarras: item.nfeProduto.ean && item.nfeProduto.ean !== 'SEM GTIN' ? item.nfeProduto.ean : '',
            categoria: item.categoriaId,
            precoVenda: item.precoVenda,
            precoCusto: item.nfeProduto.valorUnitario,
            quantidadeEstoque: item.irParaEstoque ? item.nfeProduto.quantidade * (item.unidadesPorCaixa || 1) : 0,
            estoqueMinimo: 0,
            mostrarNoPdv: true,
            ncm: item.nfeProduto.ncm,
            cfop: item.nfeProduto.cfop,
            cstIcms: item.nfeProduto.cst || '',
            csosn: item.nfeProduto.csosn || '',
            cstPis: '',
            cstCofins: '',
            aliquotaIcms: item.nfeProduto.icmsAliquota,
            aliquotaPis: item.nfeProduto.pisAliquota,
            aliquotaCofins: item.nfeProduto.cofinsAliquota,
            uop: item.nfeProduto.unidade,
            createdAt: now,
            updatedAt: now,
          };

          const prodRef = await addDoc(collection(db, 'saloes', tenant.id, 'produtos'), novoProduto);
          novosProdutos++;
        } else if (item.produtoId && item.irParaEstoque) {
          const prodRef = doc(db, 'saloes', tenant.id, 'produtos', item.produtoId);
          const prodAtual = produtos.find((p: any) => p.id === item.produtoId);
          const estoqueAtual = prodAtual?.quantidadeEstoque || 0;
          const adicional = item.nfeProduto.quantidade * (item.unidadesPorCaixa || 1);

          await setDoc(prodRef, {
            precoCusto: item.nfeProduto.valorUnitario,
            quantidadeEstoque: estoqueAtual + adicional,
            ncm: item.nfeProduto.ncm || undefined,
            cfop: item.nfeProduto.cfop || undefined,
            cstIcms: item.nfeProduto.cst || undefined,
            csosn: item.nfeProduto.csosn || undefined,
            aliquotaIcms: item.nfeProduto.icmsAliquota || undefined,
            updatedAt: now,
          }, { merge: true });
          atualizadosEstoque++;
        }
      }

      setResultadoImportacao({
        nfeNumero: nfeData.numero,
        novosProdutos,
        atualizadosEstoque,
        valorTotal: nfeData.valorTotal,
      });

      setDialogPreview(false);
      setDialogSucesso(true);
      fetchNFeList();
    } catch (error) {
      console.error('Erro ao importar:', error);
      alert('Erro ao importar NFe');
    } finally {
      setImportando(false);
    }
  };

  const excluirNFe = async (nfe: NFeImportada) => {
    if (!tenant) return;
    if (!confirm(`Excluir NF-e ${nfe.numero}/${nfe.serie}?`)) return;

    try {
      await deleteDoc(doc(db, 'saloes', tenant.id, 'nfe_importadas', nfe.id));
      fetchNFeList();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir NFe');
    }
  };

  const handleReset = () => {
    setNfeData(null);
    setProdutosImportacao([]);
    setDialogPreview(false);
    setDialogSucesso(false);
    setFileName('');
    setParseError('');
    setNfeDuplicada(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const totalSelecionados = produtosImportacao.filter(p => p.selecionado).length;
  const novosCount = produtosImportacao.filter(p => p.status === 'novo' && p.selecionado).length;
  const cadastradosCount = produtosImportacao.filter(p => p.status === 'cadastrado' && p.selecionado).length;
  const estoqueCount = produtosImportacao.filter(p => p.irParaEstoque && p.selecionado).length;

  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
      return '-';
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                <FileText className="h-7 w-7 text-orange-500" />
                Notas Fiscais
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Importe NF-e de entrada para cadastrar produtos no estoque
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 border-b pb-2">
          <Button
            variant={activeTab === 'entrada' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('entrada')}
            className="gap-2"
          >
            <ArrowDownToLine className="h-4 w-4" />
            NF-e Entrada
          </Button>
          <Button
            variant={activeTab === 'importar' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('importar')}
            className="gap-2"
          >
            <FileUp className="h-4 w-4" />
            Importar XML
          </Button>
        </div>

        {activeTab === 'entrada' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{nfeList.length}</p>
                      <p className="text-xs text-muted-foreground">Notas Importadas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <Package className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {nfeList.reduce((acc, n) => acc + n.produtosCount, 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">Produtos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {formatCurrency(nfeList.reduce((acc, n) => acc + n.valorTotal, 0))}
                      </p>
                      <p className="text-xs text-muted-foreground">Valor Total</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ArrowDownToLine className="h-5 w-5 text-blue-600" />
                  Notas Fiscais de Entrada
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-auto gap-1"
                    onClick={fetchNFeList}
                  >
                    <RefreshCw className={`h-3 w-3 ${loadingList ? 'animate-spin' : ''}`} />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingList ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Carregando...</span>
                  </div>
                ) : nfeList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <div className="h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                      <ArrowDownToLine className="h-8 w-8 text-blue-300" />
                    </div>
                    <p className="text-lg font-medium">Nenhuma nota de entrada encontrada</p>
                    <p className="text-sm mt-1">Importe uma NFe XML para começar</p>
                    <Button className="mt-6 gap-2" onClick={() => setActiveTab('importar')}>
                      <FileUp className="h-4 w-4" />
                      Importar NF-e
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10"></TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Número</TableHead>
                          <TableHead>Fornecedor</TableHead>
                          <TableHead className="text-center">Produtos</TableHead>
                          <TableHead className="text-right">Valor Total</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {nfeList.map((nfe) => (
                          <React.Fragment key={nfe.id}>
                            <TableRow className="cursor-pointer hover:bg-muted/50">
                              <TableCell onClick={() => setExpandedRow(expandedRow === nfe.id ? null : nfe.id)}>
                                {expandedRow === nfe.id ? (
                                  <ChevronRight className="h-4 w-4 rotate-90" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </TableCell>
                              <TableCell className="text-sm">{formatDate(nfe.data)}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="font-mono">
                                  {nfe.numero}/{nfe.serie}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="text-sm truncate max-w-[200px]">{nfe.fornecedorNome}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="secondary">{nfe.produtosCount}</Badge>
                              </TableCell>
                              <TableCell className="text-right font-semibold">{formatCurrency(nfe.valorTotal)}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-500 hover:text-red-700"
                                  onClick={() => excluirNFe(nfe)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                            {expandedRow === nfe.id && (
                              <TableRow>
                                <TableCell colSpan={7} className="bg-muted/30 p-4">
                                  <div className="text-sm space-y-1">
                                    <p><strong>Chave de Acesso:</strong> <span className="font-mono text-xs">{nfe.chaveAcesso || '-'}</span></p>
                                    <p><strong>CNPJ Fornecedor:</strong> {formatarCNPJ(nfe.fornecedorCnpj)}</p>
                                    <p><strong>Importado em:</strong> {formatDate(nfe.criadoEm)}</p>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'importar' && (
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div
                  className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
                    isDragging
                      ? 'border-orange-500 bg-orange-50'
                      : fileName
                      ? 'border-green-400 bg-green-50'
                      : 'border-muted-foreground/25 hover:border-orange-400 hover:bg-orange-50/50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xml"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {fileName ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-green-700">{fileName}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Clique ou arraste outro arquivo para substituir
                        </p>
                      </div>
                      {nfeData && (
                        <div className="flex items-center gap-4 mt-2">
                          <Badge variant="outline" className="text-sm">
                            <FileText className="h-3 w-3 mr-1" />
                            NFe {nfeData.numero}/{nfeData.serie}
                          </Badge>
                          <Badge variant="outline" className="text-sm">
                            <Package className="h-3 w-3 mr-1" />
                            {nfeData.produtos.length} produto(s)
                          </Badge>
                          <Badge variant="outline" className="text-sm font-semibold text-green-600">
                            <DollarSign className="h-3 w-3 mr-1" />
                            {formatCurrency(nfeData.valorTotal)}
                          </Badge>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold">Arraste o arquivo XML da NFe aqui</p>
                        <p className="text-sm text-muted-foreground mt-1">ou clique para selecionar</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Apenas arquivos .xml de Nota Fiscal Eletrônica</p>
                    </div>
                  )}
                </div>

                {parseError && (
                  <Alert variant="destructive" className="mt-4">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Erro ao processar XML</AlertTitle>
                    <AlertDescription>{parseError}</AlertDescription>
                  </Alert>
                )}

                {nfeData && !dialogPreview && (
                  <div className="flex justify-end mt-4">
                    <Button onClick={() => setDialogPreview(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
                      <ChevronRight className="h-4 w-4" />
                      Revisar e Importar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Como funciona</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                      <Upload className="h-6 w-6 text-orange-600" />
                    </div>
                    <p className="font-semibold">1. Envie o XML</p>
                    <p className="text-sm text-muted-foreground">
                      Arraste ou selecione o arquivo XML da nota fiscal
                    </p>
                  </div>
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <Search className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="font-semibold">2. Revise os dados</p>
                    <p className="text-sm text-muted-foreground">
                      Confira produtos, preços e opções de importação
                    </p>
                  </div>
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                    <p className="font-semibold">3. Confirme</p>
                    <p className="text-sm text-muted-foreground">
                      Produtos serão criados com dados fiscais automaticamente
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Dialog open={dialogPreview} onOpenChange={setDialogPreview}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-500" />
              Revisar Importação - NFe {nfeData?.numero}/{nfeData?.serie}
            </DialogTitle>
            <DialogDescription>
              Verifique os dados antes de confirmar a importação
            </DialogDescription>
          </DialogHeader>

          {nfeData && (
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Número</p>
                  <p className="font-bold text-lg">{nfeData.numero}</p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Série</p>
                  <p className="font-bold text-lg">{nfeData.serie}</p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Emissão</p>
                  <p className="font-bold text-lg">{nfeData.dataEmissao.toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Valor Total</p>
                  <p className="font-bold text-lg text-green-600">{formatCurrency(nfeData.valorTotal)}</p>
                </div>
              </div>

              {nfeDuplicada && (
                <Alert variant="destructive">
                  <FileWarning className="h-4 w-4" />
                  <AlertTitle>Esta NFe já foi importada!</AlertTitle>
                  <AlertDescription>
                    Importada em {formatDate(nfeDuplicada.criadoEm)}. Não é possível importar novamente.
                  </AlertDescription>
                </Alert>
              )}

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Fornecedor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="font-semibold">{nfeData.emitente.nome}</p>
                      <p className="text-sm text-muted-foreground">CNPJ: {formatarCNPJ(nfeData.emitente.cnpj)}</p>
                      {nfeData.emitente.ie && <p className="text-sm text-muted-foreground">IE: {nfeData.emitente.ie}</p>}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>{nfeData.emitente.logradouro}{nfeData.emitente.numero ? `, ${nfeData.emitente.numero}` : ''}</p>
                      <p>{nfeData.emitente.bairro} - {nfeData.emitente.cidade}/{nfeData.emitente.uf}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Produtos ({produtosImportacao.length})
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs text-orange-600">{novosCount} novo(s)</Badge>
                      <Badge variant="outline" className="text-xs text-green-600">{cadastradosCount} existente(s)</Badge>
                      <Button variant="ghost" size="sm" onClick={() => toggleTodos(true)}>Todos</Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleTodos(false)}>Nenhum</Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <Label className="text-sm">Markup padrão:</Label>
                    <Input
                      type="number"
                      className="w-20 h-8"
                      value={markupDefault}
                      onChange={(e) => setMarkupDefault(e.target.value)}
                    />
                    <span className="text-sm">%</span>
                    <Button size="sm" variant="outline" onClick={applyMarkupAll}>Aplicar a todos</Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[400px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10">
                            <Checkbox
                              checked={totalSelecionados === produtosImportacao.length && produtosImportacao.length > 0}
                              onCheckedChange={(checked) => toggleTodos(!!checked)}
                            />
                          </TableHead>
                          <TableHead className="text-center">Estoque</TableHead>
                          <TableHead>Produto</TableHead>
                          <TableHead className="text-center">Qtd</TableHead>
                          <TableHead className="text-right">Custo</TableHead>
                          <TableHead className="text-center">Markup %</TableHead>
                          <TableHead className="text-right">P. Venda</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-center">Categoria</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {produtosImportacao.map((item, index) => (
                          <TableRow key={index} className={!item.selecionado ? 'opacity-50' : ''}>
                            <TableCell>
                              <Checkbox checked={item.selecionado} onCheckedChange={() => toggleProduto(index)} />
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={item.irParaEstoque}
                                onCheckedChange={(checked) => toggleIrParaEstoque(index, !!checked)}
                                disabled={!item.selecionado}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="max-w-[250px]">
                                <p className="font-medium text-sm truncate">{item.nfeProduto.descricao}</p>
                                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                                  {item.nfeProduto.ncm && item.nfeProduto.ncm !== '00000000' && (
                                    <span className="text-xs text-muted-foreground">NCM: {item.nfeProduto.ncm}</span>
                                  )}
                                  {item.nfeProduto.cfop && (
                                    <span className="text-xs text-muted-foreground">CFOP: {item.nfeProduto.cfop}</span>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-mono text-sm">
                              {item.nfeProduto.quantidade} {item.nfeProduto.unidade}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {formatCurrency(item.nfeProduto.valorUnitario)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Input
                                type="number"
                                className="w-16 h-7 text-center text-xs"
                                value={item.markupPercentual}
                                onChange={(e) => updateMarkupProduto(index, e.target.value)}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <Input
                                type="number"
                                step="0.01"
                                className="w-24 h-7 text-right text-xs font-semibold text-green-600"
                                value={item.precoVenda.toFixed(2)}
                                onChange={(e) => updatePrecoVenda(index, e.target.value)}
                              />
                            </TableCell>
                            <TableCell>
                              {item.status === 'cadastrado' ? (
                                <Badge className="bg-green-500 text-xs">Existente</Badge>
                              ) : (
                                <Badge variant="outline" className="border-orange-400 text-orange-600 text-xs">Novo</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {item.status === 'novo' ? (
                                <Select value={item.categoriaId} onValueChange={(v) => updateCategoria(index, v)}>
                                  <SelectTrigger className="w-28 h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {CATEGORIAS_FIXAS.map(cat => (
                                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <span className="text-xs text-muted-foreground">{item.produtoNome || '-'}</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogPreview(false)}>Cancelar</Button>
            <Button
              onClick={confirmarImportacao}
              disabled={importando || !!nfeDuplicada || totalSelecionados === 0}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              {importando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Importar {totalSelecionados} produto(s)
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogSucesso} onOpenChange={setDialogSucesso}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-6 w-6" />
              Importação Concluída!
            </DialogTitle>
          </DialogHeader>
          {resultadoImportacao && (
            <div className="space-y-2">
              <p><strong>NF-e:</strong> {resultadoImportacao.nfeNumero}</p>
              <p><strong>Novos produtos criados:</strong> {resultadoImportacao.novosProdutos}</p>
              <p><strong>Produtos com estoque atualizado:</strong> {resultadoImportacao.atualizadosEstoque}</p>
              <p><strong>Valor total:</strong> {formatCurrency(resultadoImportacao.valorTotal)}</p>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => { setDialogSucesso(false); handleReset(); setActiveTab('entrada'); }}>
              Ver Notas Fiscais
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
