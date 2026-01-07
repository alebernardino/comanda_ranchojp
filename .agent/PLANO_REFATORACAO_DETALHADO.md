# Plano Detalhado de Refatoração - Frontend

## 📊 Análise Atual

### Arquivo `index.js`
- **Tamanho**: 74KB, 1845 linhas
- **Funções**: ~50 funções
- **Responsabilidades**: Dashboard, Comanda, Divisão, Pagamento, Produtos, Impressão, Fechamento

### Problema
- Arquivo monolítico dificulta manutenção
- Muitas responsabilidades em um único arquivo
- Dificulta testes e debugging
- Viola princípio de responsabilidade única

## 🎯 Solução: Modularização

### Estrutura Proposta

```
js/
├── api.js              ✅ (já existe)
├── utils.js            ✅ (já existe)
├── printer.js          ✅ (já existe)
├── colaboradores.js    ✅ (já existe)
├── financeiro.js       ✅ (já existe)
├── relatorios.js       ✅ (já existe)
├── cadastro_produto.js ✅ (já existe)
│
├── dashboard.js        ✅ (criado)
├── comanda.js          🔄 (criar)
├── divisao.js          🔄 (criar)
├── pagamento.js        🔄 (criar)
├── produtos.js         🔄 (criar)
├── impressao.js        🔄 (criar)
├── fechamento.js       🔄 (criar)
└── index.js            🔄 (refatorar - manter apenas init e config global)
```

## 📦 Detalhamento dos Módulos

### 1. ✅ dashboard.js (CRIADO)
**Responsabilidade**: Gerenciamento do dashboard principal
**Funções**:
- `carregarDashboard()`
- `renderizarGrid(mapAbertas)`
- `atualizarStats(abertas)`
- `carregarVendasHoje()`
- `initToggleVendasHoje()`
- `alternarParaDashboard()`

**Elementos DOM**:
- `grid`, `statsLivres`, `statsOcupadas`

**Constantes**:
- `TOTAL_COMANDAS = 300`

---

### 2. 🔄 comanda.js (CRIAR)
**Responsabilidade**: Gerenciamento da comanda e seus itens
**Funções**:
- `abrirComanda(numero)`
- `carregarDadosComanda()`
- `carregarItensComanda()`
- `renderizarTabelaItens(itens)`
- `removerItemUnico(id)`
- `adicionarMaisItemIndex(item)`
- `removerUmItemIndex(item)`
- `atualizarComandaAPI()`
- `adicionarItemComanda()`
- `atualizarDivisaoTotal()`

**Elementos DOM**:
- `modalComanda`, `tituloComanda`, `nomeComanda`, `telefoneComanda`
- `pessoasComanda`, `tabelaItensBody`, `totalComandaDiv`
- `qtdPessoasInput`, `valorPorPessoaDiv`
- `btnFecharModalComanda`, `btnPagamentoModal`, `btnDividirItemModal`, `btnImprimirModal`

**Variáveis Globais Necessárias**:
- `currentComandaNumero`
- `totalComandaGlobal`

---

### 3. 🔄 divisao.js (CRIAR)
**Responsabilidade**: Modal de divisão por item
**Funções**:
- `abrirModalDividirItem()`
- `renderizarTabelaDivisao()`
- `atualizarTotalSelecionadoItem()`
- `considerarSelecao(silencioso = false)`

**Elementos DOM**:
- `modalDividirItem`, `tbodyDivisaoItens`
- `totalSelecionadoItemEl`, `btnAdicionarAoPagamento`
- `btnConsiderarSelecao`, `btnImprimirDivisao`

**Variáveis Globais Necessárias**:
- `currentComandaNumero`
- `itensAgrupadosDivisao`
- `itensSelecionadosParaPagamento`

---

### 4. 🔄 pagamento.js (CRIAR)
**Responsabilidade**: Modal de pagamento e finalização
**Funções**:
- `abrirModalPagamento(valorSugerido, itensBreakdown)`
- `carregarResumoPagamento(valorSugerido)`
- `carregarPagamentosModal()`
- `lancarPagamentoModal()`
- `removerPagamentoModal(id)`
- `finalizarComandaModal()`

**Elementos DOM**:
- `modalPagamento`, `tituloPagamentoModal`, `valorPagamentoInput`
- `btnLancarPagamentoModal`, `tabelaPagamentosBody`
- `pagTotalComandaEl`, `pagTotalPagoEl`, `pagSaldoDevedorEl`
- `btnFinalizarComandaModal`, `metodosButtons`
- `btnFecharModalPagamento`, `btnVoltarDivisaoModal`

**Variáveis Globais Necessárias**:
- `currentComandaNumero`
- `totalComandaGlobal`, `totalPagoGlobal`, `saldoDevedorGlobal`
- `formaPagamentoSelecionada`
- `itensSelecionadosParaPagamento`

---

### 5. 🔄 produtos.js (CRIAR)
**Responsabilidade**: Gerenciamento de produtos (listagem, busca, seleção)
**Funções**:
- `carregarProdutosBase()`
- `renderizarProdutosModal(lista)`
- `selecionarProduto(p)`
- `filtrarProdutosModal()`
- `abrirModalCadastroProdutos()`
- `carregarProdutosCadastrados()`
- `filtrarERenderizarProdutosPage()`
- `limparFiltrosSessao()`
- `atualizarIconesOrdenacao()`
- `ordenarProdutos(campo)`
- `renderizarTabelaProdutosPage(produtos)`
- `salvarNovoProduto()`
- `salvarNovoProdutoSessao()`
- `editProduto(id, campo, novoValor)`
- `excluirProduto(id)`
- `alternarParaProdutos()`

**Elementos DOM**:
- `listaProdutos`, `buscaCodigo`, `buscaDescricao`, `qtdProduto`, `valorProduto`
- `modalCadastroProduto`, `novoCodigoInput`, `novaDescricaoInput`, `valorNovoProdutoInput`
- `tabelaProdutosModalBody`, `btnFecharModalCadastro`
- `prodPageCodigo`, `prodPageDescricao`, `prodPageValor`
- `tabelaProdutosPageBody`, `btnSalvarProdutoPage`
- `navProdutosSessao`, `sectionProdutos`

**Variáveis Globais Necessárias**:
- `produtosCache` (array)
- `produtoSelecionado`
- `estadoOrdenacaoProdutos` (objeto)

---

### 6. 🔄 impressao.js (CRIAR)
**Responsabilidade**: Funções de impressão via navegador (fallback)
**Funções**:
- `imprimirComandaAcao()`
- `imprimirDivisaoAcao(itensParaImprimir, totalParaImprimir)`
- `imprimirResumoPagamento()`
- `imprimirFechamentoFinal()`

**Elementos DOM**:
- `printItensParciais`, `printParciaisTitulo`, `printParciaisBody`, `printParciaisTotal`
- `printResumoPagamento`, `printResumoInfo`, `printResumoPagamentoBody`, `printResumoTotal`
- `printFechamentoDiario`, vários elementos de print

**Variáveis Globais Necessárias**:
- `currentComandaNumero`
- `itensAgrupadosDivisao`

**Dependências**:
- `printer.js` (para QZ Tray)
- `utils.js` (formatarMoeda, parseMoeda)

---

### 7. 🔄 fechamento.js (CRIAR)
**Responsabilidade**: Tela de fechamento diário
**Funções**:
- `alternarParaFechamento()`
- `imprimirFechamentoFinal()`
- `formatarCampoMoeda(input)`
- `parseMoedaInput(texto)`
- `adicionarLinhaFechamento(label, c, d, p)`
- `removerLinhaFechamento(btn)`
- Outras funções relacionadas ao fechamento

**Elementos DOM**:
- `sectionFechamento`, `navFechamento`
- Elementos específicos do fechamento

---

### 8. 🔄 index.js (REFATORAR)
**Responsabilidade**: Inicialização e configuração global
**Conteúdo**:
```javascript
// ===============================
// CONFIGURAÇÃO GLOBAL
// ===============================

// Variáveis globais compartilhadas
let currentComandaNumero = null;
let totalComandaGlobal = 0;
let totalPagoGlobal = 0;
let saldoDevedorGlobal = 0;
let formaPagamentoSelecionada = "Cartão Crédito";
let itensAgrupadosDivisao = [];
let itensSelecionadosParaPagamento = null;
let produtosCache = [];
let produtoSelecionado = null;
let estadoOrdenacaoProdutos = { campo: 'codigo', direcao: 'asc' };

// ===============================
// INICIALIZAÇÃO
// ===============================

async function init() {
  console.log("Sistema iniciando...");
  await carregarDashboard();
  await carregarProdutosBase();
  await carregarVendasHoje();
  initToggleVendasHoje();
  configListeners();
}

// ===============================
// CONFIGURAÇÃO DE LISTENERS
// ===============================

function configListeners() {
  // Todos os event listeners centralizados
  // ... (manter função existente)
}

// ===============================
// INICIAR SISTEMA
// ===============================

document.addEventListener("DOMContentLoaded", init);
```

---

## 🔄 Ordem de Implementação

### Fase 1: Preparação ✅
1. ✅ Criar `dashboard.js`
2. ✅ Criar documento de refatoração

### Fase 2: Módulos Core (PRÓXIMO)
3. 🔄 Criar `comanda.js`
4. 🔄 Criar `produtos.js`
5. 🔄 Atualizar `index.html` com novos scripts
6. 🔄 Testar funcionalidades básicas

### Fase 3: Módulos Secundários
7. 🔄 Criar `divisao.js`
8. 🔄 Criar `pagamento.js`
9. 🔄 Criar `impressao.js`
10. 🔄 Testar fluxo completo

### Fase 4: Finalização
11. 🔄 Criar `fechamento.js`
12. 🔄 Refatorar `index.js` (manter apenas init e config)
13. 🔄 Testes finais
14. 🔄 Documentação

---

## ⚠️ Pontos de Atenção

### Dependências entre Módulos
- **comanda.js** depende de **produtos.js** (`produtosCache`, `renderizarProdutosModal`)
- **divisao.js** depende de **comanda.js** (`currentComandaNumero`)
- **pagamento.js** depende de **divisao.js** (`itensSelecionadosParaPagamento`)
- **impressao.js** depende de **printer.js** e **utils.js**

### Variáveis Globais Compartilhadas
Manter em `index.js`:
- `currentComandaNumero`
- `totalComandaGlobal`, `totalPagoGlobal`, `saldoDevedorGlobal`
- `formaPagamentoSelecionada`
- `itensAgrupadosDivisao`
- `itensSelecionadosParaPagamento`
- `produtosCache`
- `produtoSelecionado`
- `estadoOrdenacaoProdutos`

### Ordem de Carregamento dos Scripts
```html
<!-- Utilitários -->
<script src="js/api.js"></script>
<script src="js/utils.js"></script>
<script src="js/printer.js"></script>

<!-- Módulos principais -->
<script src="js/dashboard.js"></script>
<script src="js/produtos.js"></script>
<script src="js/comanda.js"></script>
<script src="js/divisao.js"></script>
<script src="js/pagamento.js"></script>
<script src="js/impressao.js"></script>
<script src="js/fechamento.js"></script>

<!-- Módulos secundários -->
<script src="js/colaboradores.js"></script>
<script src="js/financeiro.js"></script>
<script src="js/relatorios.js"></script>

<!-- Inicialização (deve ser o último) -->
<script src="js/index.js"></script>
```

---

## 📝 Checklist de Teste

Após cada módulo criado, testar:

### Dashboard
- [ ] Grid de comandas carrega corretamente
- [ ] Estatísticas atualizam
- [ ] Vendas do dia aparecem
- [ ] Navegação funciona

### Comanda
- [ ] Abrir comanda nova
- [ ] Abrir comanda existente
- [ ] Adicionar itens
- [ ] Remover itens
- [ ] Atualizar quantidades
- [ ] Salvar dados do cliente

### Produtos
- [ ] Busca por código
- [ ] Busca por descrição
- [ ] Seleção de produto
- [ ] Cadastro de novo produto
- [ ] Edição de produto
- [ ] Exclusão de produto

### Divisão
- [ ] Abrir modal
- [ ] Selecionar itens
- [ ] Considerar seleção
- [ ] Gerar pagamento

### Pagamento
- [ ] Abrir modal
- [ ] Selecionar forma de pagamento
- [ ] Lançar pagamento
- [ ] Remover pagamento
- [ ] Finalizar comanda

### Impressão
- [ ] Imprimir comanda
- [ ] Imprimir parcial
- [ ] Imprimir resumo de pagamento
- [ ] Imprimir fechamento

---

## 🎯 Próximos Passos Imediatos

1. **Criar `comanda.js`** - Módulo mais crítico
2. **Criar `produtos.js`** - Dependência do comanda
3. **Atualizar `index.html`** - Adicionar novos scripts
4. **Refatorar `index.js`** - Remover código movido
5. **Testar** - Verificar se tudo funciona

---

## 📊 Métricas de Sucesso

### Antes
- `index.js`: 74KB, 1845 linhas, ~50 funções

### Depois (Estimado)
- `index.js`: ~5KB, ~100 linhas (apenas init e config)
- `comanda.js`: ~8KB
- `produtos.js`: ~10KB
- `divisao.js`: ~6KB
- `pagamento.js`: ~8KB
- `impressao.js`: ~10KB
- `fechamento.js`: ~8KB
- `dashboard.js`: ~5KB ✅

**Total**: Mesmo tamanho, mas **muito mais organizado e manutenível**!
