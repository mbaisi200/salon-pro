export interface NFeProduto {
  codigo: string;
  ean: string;
  descricao: string;
  ncm: string;
  cest: string;
  cfop: string;
  cst: string;
  csosn: string;
  unidade: string;
  unidadeTributavel: string;
  quantidade: number;
  quantidadeTributavel: number;
  valorUnitario: number;
  valorUnitarioTributavel: number;
  valorTotal: number;
  origem: string;
  icmsAliquota: number;
  icmsValor: number;
  icmsBaseCalculo: number;
  ipiAliquota: number;
  ipiValor: number;
  pisAliquota: number;
  pisValor: number;
  cofinsAliquota: number;
  cofinsValor: number;
}

export interface NFeParsed {
  numero: string;
  serie: string;
  dataEmissao: Date;
  chaveAcesso?: string;
  naturezaOperacao?: string;
  emitente: {
    nome: string;
    cnpj: string;
    ie: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
    telefone: string;
    email?: string;
  };
  valorTotal: number;
  valorProdutos: number;
  valorFrete: number;
  valorSeguro: number;
  valorDesconto: number;
  valorOutrasDespesas: number;
  produtos: NFeProduto[];
}

function getTextContent(parent: Element, tagName: string): string {
  let el = parent.getElementsByTagName(tagName)[0];
  if (el) return (el.textContent || '').trim();

  const namespaces = ['nfe', 'nf', 'NFe'];
  for (const ns of namespaces) {
    el = parent.getElementsByTagName(`${ns}:${tagName}`)[0];
    if (el) return (el.textContent || '').trim();
  }
  return '';
}

function getNumberContent(parent: Element, tagName: string, defaultValue = 0): number {
  const text = getTextContent(parent, tagName);
  const num = parseFloat(text);
  return isNaN(num) ? defaultValue : num;
}

function findElement(parent: Element | Document, tagName: string): Element | null {
  let el = parent.getElementsByTagName(tagName)[0];
  if (el) return el;

  const prefixes = ['nfe', 'nf', 'NFe'];
  for (const prefix of prefixes) {
    el = parent.getElementsByTagName(`${prefix}:${tagName}`)[0];
    if (el) return el;
  }

  const allElements = parent.getElementsByTagName('*');
  for (let i = 0; i < allElements.length; i++) {
    if (allElements[i].localName === tagName) {
      return allElements[i];
    }
  }
  return null;
}

function findICMSTipo(impostoEl: Element): Element | null {
  const allElements = impostoEl.getElementsByTagName('*');
  for (let i = 0; i < allElements.length; i++) {
    const localName = allElements[i].localName;
    if (
      (localName.startsWith('ICMS') || localName.startsWith('Icms')) &&
      localName !== 'ICMSTot' &&
      localName !== 'ICMSUFDest'
    ) {
      return allElements[i];
    }
  }
  return null;
}

export function parseNFeXML(xmlString: string): NFeParsed {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

  const parseError = xmlDoc.getElementsByTagName('parsererror');
  if (parseError.length > 0) {
    throw new Error('XML inválido. Verifique se o arquivo é um XML bem formado.');
  }

  const infNFe = findElement(xmlDoc, 'infNFe');
  if (!infNFe) {
    throw new Error('XML não é uma NFe válida. Elemento "infNFe" não encontrado.');
  }

  const chaveAcesso = infNFe.getAttribute('Id')?.replace('NFe', '') || undefined;

  const ide = findElement(infNFe, 'ide') || infNFe;
  const numero = getTextContent(ide, 'nNF');
  const serie = getTextContent(ide, 'serie');
  const dhEmi = getTextContent(ide, 'dhEmi');
  const natOp = getTextContent(ide, 'natOp');

  let dataEmissao = new Date();
  if (dhEmi) {
    try {
      const parsed = new Date(dhEmi);
      if (!isNaN(parsed.getTime())) {
        dataEmissao = parsed;
      }
    } catch { /* fallback */ }
  }

  const emit = findElement(infNFe, 'emit') || infNFe;
  const enderEmit = findElement(emit, 'enderEmit') || emit;

  const emitente = {
    nome: getTextContent(emit, 'xNome'),
    cnpj: getTextContent(emit, 'CNPJ') || getTextContent(emit, 'cnpj'),
    ie: getTextContent(emit, 'IE') || getTextContent(emit, 'ie'),
    logradouro: getTextContent(enderEmit, 'xLgr'),
    numero: getTextContent(enderEmit, 'nro'),
    complemento: getTextContent(enderEmit, 'xCpl'),
    bairro: getTextContent(enderEmit, 'xBairro'),
    cidade: getTextContent(enderEmit, 'xMun'),
    uf: getTextContent(enderEmit, 'UF'),
    cep: getTextContent(enderEmit, 'CEP'),
    telefone: getTextContent(enderEmit, 'fone'),
    email: getTextContent(emit, 'email') || undefined,
  };

  const total = findElement(infNFe, 'total') || infNFe;
  const icmsTot = findElement(total, 'ICMSTot') || total;
  const valorTotal = getNumberContent(icmsTot, 'vNF');
  const valorProdutos = getNumberContent(icmsTot, 'vProd');
  const valorFrete = getNumberContent(icmsTot, 'vFrete');
  const valorSeguro = getNumberContent(icmsTot, 'vSeg');
  const valorDesconto = getNumberContent(icmsTot, 'vDesc');
  const valorOutrasDespesas = getNumberContent(icmsTot, 'vOutro');

  const produtos: NFeProduto[] = [];
  let detElements = Array.from(infNFe.getElementsByTagName('det'));

  if (detElements.length === 0) {
    const prefixes = ['nfe', 'nf', 'NFe'];
    for (const prefix of prefixes) {
      detElements = Array.from(infNFe.getElementsByTagName(`${prefix}:det`));
      if (detElements.length > 0) break;
    }
  }

  if (detElements.length === 0) {
    const allElements = Array.from(infNFe.getElementsByTagName('*'));
    detElements = allElements.filter(el => el.localName === 'det');
  }

  for (const det of detElements) {
    const prod = findElement(det, 'prod') || det;

    const codigo = getTextContent(prod, 'cProd');
    const descricao = getTextContent(prod, 'xProd');
    if (!descricao) continue;

    const cst = getTextContent(prod, 'CST') || '';
    const csosn = getTextContent(prod, 'CSOSN') || '';

    const imposto = findElement(det, 'imposto') || det;
    const icmsEl = findElement(imposto, 'ICMS') || imposto;
    const icmsTipo = findICMSTipo(icmsEl);

    const origem = icmsTipo ? getTextContent(icmsTipo, 'orig') : '';
    const icmsAliquota = icmsTipo ? getNumberContent(icmsTipo, 'pICMS') : 0;
    const icmsValor = icmsTipo ? getNumberContent(icmsTipo, 'vICMS') : 0;
    const icmsBaseCalculo = icmsTipo ? getNumberContent(icmsTipo, 'vBC') : 0;

    const ipiEl = findElement(imposto, 'IPI') || imposto;
    const ipiTrib = findElement(ipiEl, 'IPITrib');
    let ipiAliquota = 0;
    let ipiValor = 0;
    if (ipiTrib) {
      ipiAliquota = getNumberContent(ipiTrib, 'pIPI');
      ipiValor = getNumberContent(ipiTrib, 'vIPI');
    }

    const pisEl = findElement(imposto, 'PIS') || imposto;
    let pisAliquota = 0;
    let pisValor = 0;
    const pisAliq = findElement(pisEl, 'PISAliq');
    const pisOutr = findElement(pisEl, 'PISOutr');
    const pisQtde = findElement(pisEl, 'PISQtde');
    if (pisAliq) {
      pisAliquota = getNumberContent(pisAliq, 'pPIS');
      pisValor = getNumberContent(pisAliq, 'vPIS');
    } else if (pisOutr) {
      pisAliquota = getNumberContent(pisOutr, 'pPIS');
      pisValor = getNumberContent(pisOutr, 'vPIS');
    } else if (pisQtde) {
      pisAliquota = getNumberContent(pisQtde, 'pPIS');
      pisValor = getNumberContent(pisQtde, 'vPIS');
    }

    const cofinsEl = findElement(imposto, 'COFINS') || imposto;
    let cofinsAliquota = 0;
    let cofinsValor = 0;
    const cofinsAliq = findElement(cofinsEl, 'COFINSAliq');
    const cofinsOutr = findElement(cofinsEl, 'COFINSOutr');
    const cofinsQtde = findElement(cofinsEl, 'COFINSQtde');
    if (cofinsAliq) {
      cofinsAliquota = getNumberContent(cofinsAliq, 'pCOFINS');
      cofinsValor = getNumberContent(cofinsAliq, 'vCOFINS');
    } else if (cofinsOutr) {
      cofinsAliquota = getNumberContent(cofinsOutr, 'pCOFINS');
      cofinsValor = getNumberContent(cofinsOutr, 'vCOFINS');
    } else if (cofinsQtde) {
      cofinsAliquota = getNumberContent(cofinsQtde, 'pCOFINS');
      cofinsValor = getNumberContent(cofinsQtde, 'vCOFINS');
    }

    produtos.push({
      codigo,
      ean: getTextContent(prod, 'cEAN') || getTextContent(prod, 'CEAN') || '',
      descricao,
      ncm: getTextContent(prod, 'NCM') || '',
      cest: getTextContent(prod, 'CEST') || '',
      cfop: getTextContent(prod, 'CFOP') || '',
      cst: cst,
      csosn: csosn,
      unidade: getTextContent(prod, 'uCom') || 'UN',
      unidadeTributavel: getTextContent(prod, 'uTrib') || getTextContent(prod, 'uCom') || 'UN',
      quantidade: getNumberContent(prod, 'qCom'),
      quantidadeTributavel: getNumberContent(prod, 'qTrib'),
      valorUnitario: getNumberContent(prod, 'vUnCom'),
      valorUnitarioTributavel: getNumberContent(prod, 'vUnTrib'),
      valorTotal: getNumberContent(prod, 'vProd'),
      origem,
      icmsAliquota,
      icmsValor,
      icmsBaseCalculo,
      ipiAliquota,
      ipiValor,
      pisAliquota,
      pisValor,
      cofinsAliquota,
      cofinsValor,
    });
  }

  return {
    numero,
    serie,
    dataEmissao,
    chaveAcesso,
    naturezaOperacao: natOp || undefined,
    emitente,
    valorTotal,
    valorProdutos,
    valorFrete,
    valorSeguro,
    valorDesconto,
    valorOutrasDespesas,
    produtos,
  };
}

export function matchProdutoByCodigoOuEan(
  produto: { codigo?: string | null; codigoBarras?: string | null },
  nfeProduto: NFeProduto
): boolean {
  if (produto.codigoBarras && nfeProduto.ean) {
    const barrasProd = produto.codigoBarras.trim();
    const eanNFe = nfeProduto.ean.trim();
    if (barrasProd && eanNFe && barrasProd === eanNFe && barrasProd !== 'SEM GTIN') {
      return true;
    }
  }

  if (produto.codigo && nfeProduto.codigo) {
    if (produto.codigo.trim() === nfeProduto.codigo.trim()) {
      return true;
    }
  }

  return false;
}

export function formatarCNPJ(cnpj: string): string {
  const cnpjLimpo = cnpj.replace(/\D/g, '');
  if (cnpjLimpo.length === 14) {
    return cnpjLimpo.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }
  if (cnpjLimpo.length === 11) {
    return cnpjLimpo.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }
  return cnpj;
}

export function formatarCEP(cep: string): string {
  const cepLimpo = cep.replace(/\D/g, '');
  if (cepLimpo.length === 8) {
    return cepLimpo.replace(/^(\d{5})(\d{3})$/, '$1-$2');
  }
  return cep;
}
