# Refatoração de Módulos - Frontend

## Objetivo
Separar o arquivo `index.js` (74KB, 1845 linhas) em módulos especializados para melhorar a manutenibilidade e organização do código.

## Status: 🚧 EM ANDAMENTO - Fase 2

## Módulos Criados

### 1. ✅ dashboard.js
- Gerenciamento do dashboard principal
- Grid de comandas
- Estatísticas e resumos
- **Status**: Criado e integrado

### 2. ✅ produtos.js
- Gerenciamento de produtos (listagem, busca, seleção)
- CRUD de produtos
- Filtros e ordenação
- **Status**: Criado e integrado

### 3. ✅ comanda.js
- Modal de comanda
- Gerenciamento de itens
- Atualização de dados
- **Status**: Criado e integrado

### 4. ⏳ divisao.js
- Modal de divisão por item
- Cálculos de divisão
- Seleção de itens
- **Status**: Pendente

### 5. ⏳ pagamento.js
- Modal de pagamento
- Lançamento de pagamentos
- Finalização de comanda
- **Status**: Pendente

### 6. ⏳ impressao.js
- Funções de impressão via navegador
- Integração com printer.js
- **Status**: Pendente

### 7. ⏳ fechamento.js
- Tela de fechamento diário
- **Status**: Pendente

### 8. 🔄 index.js
- Refatorar para manter apenas init e config global
- **Status**: Aguardando conclusão dos outros módulos

## Arquivos Mantidos
- ✅ `printer.js` - Geração de HTML para impressão (QZ Tray)
- ✅ `utils.js` - Funções utilitárias
- ✅ `api.js` - Chamadas à API
- ✅ `colaboradores.js` - Gestão de colaboradores
- ✅ `financeiro.js` - Gestão financeira
- ✅ `relatorios.js` - Relatórios

## Próximos Passos
1. ✅ Criar dashboard.js
2. ✅ Criar produtos.js
3. ✅ Criar comanda.js
4. ✅ Atualizar index.html com novos scripts
5. 🔄 **PRÓXIMO**: Testar funcionalidades básicas
6. ⏳ Criar divisao.js, pagamento.js, impressao.js
7. ⏳ Refatorar index.js

## ⚠️ IMPORTANTE
Os módulos foram criados, mas o `index.js` ainda contém TODAS as funções originais.
Precisamos testar se os novos módulos funcionam corretamente antes de remover código do index.js.
