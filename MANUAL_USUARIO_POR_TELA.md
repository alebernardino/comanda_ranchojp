# Manual do Usuario - ComandaFacil

Este material ensina o uso do sistema tela por tela.

## 1. Login
- Abra o sistema pelo arquivo `scripts/iniciar_sistema.bat`.
- No navegador, informe:
  - Usuario: `jp`
  - Senha: `123456`
- Clique em **Entrar**.

## 2. Tela Comandas (Painel principal)
- Objetivo: abrir e atender comandas.
- Acoes principais:
  - Abrir comanda pelo numero.
  - Clicar na comanda para editar cliente e itens.
  - Ver comandas ocupadas e livres.
- Atalho comum:
  - `F9` para imprimir dados da comanda aberta.

## 3. Tela Produtos
- Objetivo: cadastrar e manter o cardapio.
- Acoes principais:
  - Cadastrar produto (codigo de 3 digitos, descricao e valor).
  - Editar descricao e valor na tabela.
  - Ativar ou desativar produto.
  - Excluir produto (se nao estiver vinculado a comandas).

## 4. Tela Clientes
- Objetivo: consultar clientes por nome e telefone.
- Acoes principais:
  - Filtrar por telefone.
  - Filtrar por nome.
  - Conferir data de cadastro e atualizacao.

## 5. Tela Colaboradores
- Objetivo: gerir cadastro de equipe e parceiros.
- Acoes principais:
  - Cadastrar nome, contato e funcao.
  - Editar dados.
  - Ativar ou desativar colaborador.

## 6. Tela Financeiro
- Objetivo: registrar saidas e controles financeiros.
- Acoes principais:
  - Lancar pagamentos gerais.
  - Informar fornecedor, item/servico, valor e forma.
  - Marcar status de pago.

## 7. Tela Relatorios
- Objetivo: acompanhar resultados.
- Acoes principais:
  - Consultar vendas por periodo.
  - Filtrar por datas.
  - Conferir totais por produto e valores.

## 8. Tela Fechamento
- Objetivo: fechar o dia de operacao.
- Acoes principais:
  - Conferir vendas e recebimentos.
  - Informar recebimentos manuais (se houver).
  - Imprimir fechamento final.
- Regra:
  - Sempre revisar os valores antes da impressao final.

## 9. Tela Estoque
- Objetivo: controlar saldo e movimentos.
- Acoes principais:
  - Registrar entrada de estoque.
  - Registrar saida.
  - Fazer ajuste de quantidade.
  - Definir minimo por produto.

## 10. Tela Usuarios
- Objetivo: controlar acesso ao sistema.
- Acoes principais:
  - Criar usuario.
  - Definir perfil (`admin` ou `operador`).
  - Ativar e desativar acessos.

## 11. Tela Configuracao
- Objetivo: configurar modulos e impressora.
- Acoes principais:
  - Habilitar ou desabilitar modulos.
  - Configurar impressora serial.
- Configuracao recomendada da impressora:
  - Modo: `Serial (COM/USB)`
  - Porta: conforme Gerenciador de Dispositivos (exemplo `COM4`)
  - Baudrate: `9600`
  - Encoding: `cp860`
  - AutoCut: ligado
- Depois de salvar:
  - Clique em **Testar conexao**.
  - Clique em **Imprimir teste**.

## 12. Impressao (comanda, parcial, pagamento, fechamento)
- O sistema tenta primeiro impressao direta na porta serial.
- Se abrir janela de impressao do Windows, revise:
  - Porta COM correta.
  - Modo `Serial`.
  - Backend em execucao.

## 13. Solucao rapida de problemas

### Produtos nao aparecem
- Verifique se o backend esta ativo (janela preta aberta).
- Atualize a pagina com `Ctrl + F5`.

### Impressora nao imprime
- Confirme a porta COM no Windows.
- Atualize a porta na Configuracao da impressora.
- Teste com:
  - `scripts/testar_impressora.bat --mode serial --port COM4 --baudrate 9600`

### Sistema nao abre
- Execute novamente `scripts/iniciar_sistema.bat`.
- Nao feche a janela preta enquanto o sistema estiver em uso.

## 14. Boas praticas operacionais
- Fechar comandas somente apos conferir pagamentos.
- Fazer fechamento diario ao final do expediente.
- Nao usar `zerar_banco.bat` em ambiente de producao.
- Manter backup do banco de dados.
