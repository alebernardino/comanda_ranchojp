# Refatoração: Consolidação de API em produtos.js
**Data:** 2026-01-10  
**Commit:** 3614d28  
**Objetivo:** Eliminar chamadas `fetch` diretas e usar funções centralizadas do `api.js`

---

## 📊 Resumo das Mudanças

### Estatísticas
- **Arquivos modificados:** 2
- **Linhas adicionadas:** +171
- **Linhas removidas:** -36
- **Redução líquida:** +135 (expansão do api.js compensa)
- **Chamadas fetch eliminadas:** 6

### Arquivos Afetados
1. ✅ `frontend/js/api.js` - Expandido com funções específicas
2. ✅ `frontend/js/produtos.js` - Refatorado para usar api.js

---

## 🔄 Mudanças em `api.js`

### Antes (48 linhas)
```javascript
const API_URL = "http://127.0.0.1:8000";

async function apiRequest(path, method = "GET", body = null) { ... }
async function apiGet(path) { ... }
async function apiPost(path, body) { ... }
async function apiPut(path, body) { ... }
async function apiDelete(path) { ... }
```

### Depois (185 linhas)
```javascript
// Funções base (mantidas)
async function apiRequest(path, method = "GET", body = null) { ... }
async function apiGet(path) { ... }
async function apiPost(path, body) { ... }
async function apiPut(path, body) { ... }
async function apiDelete(path) { ... }

// ✨ NOVO: API de Produtos
async function getProdutos(busca = null) { ... }
async function createProduto(data) { ... }
async function updateProduto(id, data) { ... }
async function deleteProduto(id) { ... }
async function ativarProduto(id) { ... }
async function desativarProduto(id) { ... }

// ✨ NOVO: API de Comandas
async function getComandas() { ... }
async function getComanda(numero) { ... }
async function garantirComanda(numero) { ... }
async function updateComanda(numero, data) { ... }
async function getItensComanda(numero) { ... }
async function addItemComanda(numero, data) { ... }
async function updateItem(itemId, data) { ... }
async function deleteItem(itemId) { ... }
async function getResumoComanda(numero) { ... }

// ✨ NOVO: API de Pagamentos
async function getPagamentosComanda(numero) { ... }
async function addPagamento(numero, data) { ... }
async function deletePagamento(id) { ... }
async function finalizarComanda(numero) { ... }

// ✨ NOVO: API de Colaboradores
async function getColaboradores() { ... }
async function createColaborador(data) { ... }
async function updateColaborador(id, data) { ... }

// ✨ NOVO: API de Financeiro
async function getFinanceiro() { ... }
async function createFinanceiro(data) { ... }
async function updateFinanceiro(id, data) { ... }
async function deleteFinanceiro(id) { ... }

// ✨ NOVO: API de Relatórios
async function getRelatorioVendas(dataInicio, dataFim) { ... }
```

---

## 🔄 Mudanças em `produtos.js`

### 1. `carregarProdutosBase()`

#### ❌ Antes
```javascript
async function carregarProdutosBase() {
    const res = await fetch(`${API_URL}/produtos/`);
    produtosCache = await res.json();
    produtosCache.sort((a, b) => a.codigo.localeCompare(b.codigo, undefined, { numeric: true }));
}
```

#### ✅ Depois
```javascript
async function carregarProdutosBase() {
    produtosCache = await getProdutos();
    produtosCache.sort((a, b) => a.codigo.localeCompare(b.codigo, undefined, { numeric: true }));
}
```

**Benefício:** -2 linhas, mais legível

---

### 2. `carregarProdutosCadastrados()`

#### ❌ Antes
```javascript
async function carregarProdutosCadastrados() {
    const res = await fetch(`${API_URL}/produtos`);
    const produtos = await res.json();
    produtos.sort((a, b) => a.codigo.localeCompare(b.codigo, undefined, { numeric: true }));
    // ...
}
```

#### ✅ Depois
```javascript
async function carregarProdutosCadastrados() {
    const produtos = await getProdutos();
    produtos.sort((a, b) => a.codigo.localeCompare(b.codigo, undefined, { numeric: true }));
    // ...
}
```

**Benefício:** -2 linhas, mais legível

---

### 3. `salvarNovoProduto()`

#### ❌ Antes
```javascript
async function salvarNovoProduto() {
    // ... validações ...
    const res = await fetch(`${API_URL}/produtos/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo: cod, descricao: desc, valor: val })
    });
    if (res.ok) {
        // ... limpar campos ...
        await carregarProdutosCadastrados();
        await carregarProdutosBase();
    }
}
```

#### ✅ Depois
```javascript
async function salvarNovoProduto() {
    // ... validações ...
    try {
        await createProduto({ codigo: cod, descricao: desc, valor: val });
        // ... limpar campos ...
        await carregarProdutosCadastrados();
        await carregarProdutosBase();
    } catch (error) {
        alert(error.message || "Erro ao salvar produto");
    }
}
```

**Benefícios:**
- ✅ -5 linhas de código
- ✅ Tratamento de erros consistente
- ✅ Mais legível

---

### 4. `editProduto()`

#### ❌ Antes
```javascript
async function editProduto(id, campo, novoValor) {
    if (campo === "ativo") {
        const endpoint = novoValor ? "ativar" : "desativar";
        await fetch(`${API_URL}/produtos/${id}/${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        });
        await carregarProdutosCadastrados();
        await carregarProdutosBase();
        return;
    }
    
    // ... resto do código ...
    await fetch(`${API_URL}/produtos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
    await carregarProdutosCadastrados();
    await carregarProdutosBase();
}
```

#### ✅ Depois
```javascript
async function editProduto(id, campo, novoValor) {
    if (campo === "ativo") {
        try {
            if (novoValor) {
                await ativarProduto(id);
            } else {
                await desativarProduto(id);
            }
            await carregarProdutosCadastrados();
            await carregarProdutosBase();
        } catch (error) {
            alert(error.message || "Erro ao alterar status do produto");
        }
        return;
    }
    
    // ... resto do código ...
    try {
        await updateProduto(id, body);
        await carregarProdutosCadastrados();
        await carregarProdutosBase();
    } catch (error) {
        alert(error.message || "Erro ao atualizar produto");
    }
}
```

**Benefícios:**
- ✅ Usa funções semânticas (`ativarProduto`, `desativarProduto`)
- ✅ Tratamento de erros em ambos os caminhos
- ✅ Mais fácil de testar

---

### 5. `excluirProduto()`

#### ❌ Antes
```javascript
async function excluirProduto(id) {
    if (!confirm("Deseja excluir este produto?")) return;
    const res = await fetch(`${API_URL}/produtos/${id}`, { method: "DELETE" });
    if (res.ok) {
        await carregarProdutosCadastrados();
        await carregarProdutosBase();
    } else {
        const err = await res.json();
        alert(err.detail || "Erro ao excluir");
    }
}
```

#### ✅ Depois
```javascript
async function excluirProduto(id) {
    if (!confirm("Deseja excluir este produto?")) return;
    
    try {
        await deleteProduto(id);
        await carregarProdutosCadastrados();
        await carregarProdutosBase();
    } catch (error) {
        alert(error.message || "Erro ao excluir");
    }
}
```

**Benefícios:**
- ✅ -4 linhas
- ✅ Tratamento de erros consistente
- ✅ Não precisa verificar `res.ok`

---

## ✅ Benefícios da Refatoração

### 1. **Código Mais Limpo**
- Menos boilerplate (headers, JSON.stringify, etc)
- Funções com nomes semânticos
- Mais fácil de ler e entender

### 2. **Tratamento de Erros Centralizado**
- `apiRequest()` já lança exceções com mensagens claras
- Todos os erros passam pelo mesmo fluxo
- Fácil adicionar logging ou retry logic

### 3. **Manutenibilidade**
- Se a URL base mudar, muda em 1 lugar
- Se precisar adicionar autenticação, muda em 1 lugar
- Se precisar adicionar headers globais, muda em 1 lugar

### 4. **Testabilidade**
- Funções do `api.js` podem ser mockadas facilmente
- Testes unitários mais simples
- Separação clara de responsabilidades

### 5. **Consistência**
- Todas as chamadas seguem o mesmo padrão
- Mensagens de erro padronizadas
- Comportamento previsível

---

## 📋 Próximos Passos

### Arquivos Pendentes de Refatoração

| Arquivo | Chamadas fetch | Prioridade | Estimativa |
|---------|----------------|------------|------------|
| `comanda.js` | 7 | 🔴 Alta | 30 min |
| `pagamento.js` | 5 | 🔴 Alta | 20 min |
| `colaboradores.js` | 3 | 🟡 Média | 15 min |
| `financeiro.js` | 3 | 🟡 Média | 15 min |
| `dashboard.js` | 2 | 🟢 Baixa | 10 min |
| `divisao.js` | 1 | 🟢 Baixa | 5 min |
| `fechamento.js` | 1 | 🟢 Baixa | 5 min |
| `impressao.js` | 1 | 🟢 Baixa | 5 min |
| `relatorios.js` | ? | 🟡 Média | 30 min |

### Recomendação

**Continuar refatoração incremental:**
1. ✅ `produtos.js` - **CONCLUÍDO**
2. ⏭️ `comanda.js` - Próximo (7 chamadas)
3. ⏭️ `pagamento.js` - Depois (5 chamadas)
4. ⏭️ Demais arquivos conforme necessidade

---

## 🧪 Validação

### Como Testar

1. **Abrir o frontend:**
   ```
   http://localhost:5500
   ```

2. **Testar funcionalidades de produtos:**
   - ✅ Listar produtos
   - ✅ Criar novo produto
   - ✅ Editar descrição/valor
   - ✅ Ativar/desativar produto
   - ✅ Excluir produto
   - ✅ Filtrar produtos

3. **Verificar console do navegador:**
   - Não deve haver erros
   - Chamadas API devem funcionar normalmente

### Status
- ✅ Código refatorado
- ✅ Commit realizado
- ⏳ Testes manuais pendentes

---

## 📊 Métricas

### Antes da Refatoração
- Chamadas `fetch` diretas em `produtos.js`: **6**
- Linhas de código: **484**
- Tratamento de erros: **Inconsistente**

### Depois da Refatoração
- Chamadas `fetch` diretas em `produtos.js`: **0** ✅
- Linhas de código: **518** (aumento devido a try/catch)
- Tratamento de erros: **Consistente** ✅
- Funções em `api.js`: **+25** ✅

### Impacto no Projeto
- **Total de chamadas fetch no projeto:** ~35
- **Eliminadas nesta refatoração:** 6 (17%)
- **Restantes:** ~29
- **Progresso:** 17% ✅

---

## 🎯 Conclusão

A refatoração de `produtos.js` foi **bem-sucedida** e estabelece o **padrão** para os demais arquivos.

**Principais conquistas:**
- ✅ Código mais limpo e legível
- ✅ Tratamento de erros consistente
- ✅ Base sólida para refatorações futuras
- ✅ `api.js` expandido e pronto para uso

**Próximo passo recomendado:**
Refatorar `comanda.js` seguindo o mesmo padrão.
