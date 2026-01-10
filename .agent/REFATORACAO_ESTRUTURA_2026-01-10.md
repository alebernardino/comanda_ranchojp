# Refatoração da Estrutura do Projeto
**Data:** 2026-01-10  
**Objetivo:** Reorganizar estrutura do backend e corrigir bugs

---

## 📋 Mudanças Implementadas

### ✅ 1. Reorganização do Backend

#### Antes:
```
backend/
├── app/
├── main.py
├── requirements.txt
├── check_db.py
├── check_financeiro.py
├── limpar_fantasmas.py
├── populate_today.py
├── debug_stats.py
├── migrate.py
├── migration_remove_unique.py
└── .venv/
```

#### Depois:
```
backend/
├── app/
│   ├── api/           # Endpoints da API
│   ├── database/      # Conexão e migrações
│   └── models/        # Modelos Pydantic
├── scripts/           # ✨ NOVO: Scripts utilitários
│   ├── README.md      # Documentação dos scripts
│   ├── check_db.py
│   ├── check_financeiro.py
│   ├── debug_stats.py
│   ├── limpar_fantasmas.py
│   ├── migrate.py
│   ├── migration_remove_unique.py
│   └── populate_today.py
├── main.py            # Ponto de entrada único
├── requirements.txt
└── .venv/             # (não versionado)
```

**Benefícios:**
- ✅ Separação clara entre aplicação e utilitários
- ✅ Facilita manutenção e escalabilidade
- ✅ Scripts documentados em README próprio

---

### ✅ 2. Correção de Caminhos Hardcoded

**Arquivos corrigidos:**
- `scripts/migrate.py`
- `scripts/migration_remove_unique.py`

**Antes:**
```python
db_path = "/home/ale_bernardino/code/comanda/comanda_ranchojp/backend/app/database/comanda.db"
```

**Depois:**
```python
# Caminho relativo ao diretório backend/
db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "app", "database", "comanda.db")
```

**Benefícios:**
- ✅ Scripts funcionam em qualquer ambiente
- ✅ Portabilidade entre máquinas/desenvolvedores

---

### ✅ 3. Remoção de Duplicidade no Frontend

**Removido:**
- `frontend/cadastro_produto.html` (lógica duplicada)

**Mantido:**
- `frontend/js/produtos.js` (módulo único de produtos)
- Modal de cadastro dentro de `index.html`

**Benefícios:**
- ✅ Elimina duplicação de código
- ✅ Facilita manutenção
- ✅ Single source of truth

---

### ✅ 4. Correção do Bug de Ativação de Produtos

**Problema:**
O botão de ativar/desativar produto não funcionava porque a função `editProduto` enviava apenas o campo alterado, mas o endpoint PUT do backend esperava todos os campos obrigatórios.

**Solução:**
Modificada a função `editProduto` em `produtos.js`:

```javascript
async function editProduto(id, campo, novoValor) {
    // Para campo 'ativo', usa endpoints específicos
    if (campo === "ativo") {
        const endpoint = novoValor ? "ativar" : "desativar";
        await fetch(`${API_URL}/produtos/${id}/${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        });
        // ...
        return;
    }

    // Para outros campos, busca dados completos antes do PUT
    const produto = produtosCache.find(p => p.id === id);
    const body = {
        codigo: produto.codigo,
        descricao: campo === "descricao" ? String(novoValor) : produto.descricao,
        valor: campo === "valor" ? parseFloat(novoValor) : produto.valor,
        ativo: produto.ativo
    };
    // ...
}
```

**Benefícios:**
- ✅ Checkbox de ativar/desativar funciona corretamente
- ✅ Usa endpoints específicos do backend (`/ativar` e `/desativar`)
- ✅ Edição de outros campos continua funcionando

---

## 📊 Resumo das Melhorias

| Item | Status | Impacto |
|------|--------|---------|
| Scripts organizados em `backend/scripts/` | ✅ Concluído | Alto |
| Caminhos relativos nos scripts | ✅ Concluído | Médio |
| Remoção de duplicidade frontend | ✅ Concluído | Médio |
| Bug de ativação de produtos | ✅ Corrigido | Alto |
| `.venv` não versionado | ✅ Verificado | Baixo |
| Documentação dos scripts | ✅ Criada | Médio |

---

## 🎯 Próximos Passos (Opcional)

### Melhorias Futuras (Baixa Prioridade)

#### 5. Organização do JS por Domínio
Apenas se o projeto crescer significativamente:

```
js/
├── comanda/
│   ├── comanda.js
│   ├── divisao.js
│   └── fechamento.js
├── pagamento/
│   ├── pagamento.js
│   └── printer.js
├── produtos/
│   └── produtos.js
├── api.js
├── utils.js
└── index.js
```

**Quando fazer:** Quando houver mais de 15-20 arquivos JS ou quando módulos começarem a ter sub-módulos.

---

## ✅ Validação

### Como testar:

1. **Backend está funcionando:**
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

2. **Scripts funcionam:**
   ```bash
   cd backend
   python scripts/check_db.py
   ```

3. **Ativação de produtos funciona:**
   - Abrir frontend
   - Ir para seção Produtos
   - Clicar no checkbox de ativar/desativar
   - Verificar que o estado muda corretamente

---

## 📝 Commit

```
refactor: reorganizar estrutura do backend e corrigir bug de ativação de produtos

- Move scripts utilitários para backend/scripts/
- Adiciona README.md documentando os scripts
- Corrige caminhos hardcoded nos scripts de migração
- Remove cadastro_produto.html duplicado
- Fix: corrige função editProduto para usar endpoints corretos de ativar/desativar
```

**Commit hash:** 2dc9400
