# Guia de Uso do Sistema ComandaFacil

## 1. Como iniciar o sistema (Windows)
1. Abra a pasta do sistema.
2. Execute `scripts\iniciar_sistema.bat`.
3. Aguarde abrir o navegador em `http://localhost:5500`.
4. Mantenha a janela preta (terminal) aberta enquanto estiver usando o sistema.

## 2. Login
- Usuario: `jp`
- Senha: `123456`

## 3. Fluxo rapido de atendimento
1. Abra a comanda (clique no numero da comanda).
2. Preencha cliente/telefone (opcional).
3. Adicione itens por codigo ou descricao.
4. Confira o total.
5. Registre os pagamentos.
6. Feche a comanda.
7. Imprima o comprovante.

## 4. Cadastro e edicao de produtos
1. Entre na tela **Produtos**.
2. Para criar: informe codigo (3 digitos), descricao e valor.
3. Para editar: altere descricao/valor diretamente na tabela.
4. Para ativar/desativar: use o checkbox de status.

## 5. Impressora (Jetway)
1. Entre em **Configuracao > Impressora**.
2. Modo: `Serial (COM/USB)`.
3. Porta: use a porta exibida no Windows (ex.: `COM4`).
4. Baudrate: `9600`.
5. Clique em **Salvar impressora**.
6. Clique em **Testar impressora**.

Se abrir tela de impressao do Windows, a configuracao serial nao foi aplicada corretamente.

## 6. Fechamento diario
1. Abra a tela **Fechamento**.
2. Preencha recebimentos manuais (se houver).
3. Marque os blocos que deseja imprimir.
4. Clique em **Imprimir fechamento**.

## 7. Problemas comuns

### Sistema abre, mas produtos nao aparecem
- Verifique se o backend esta ativo na janela preta.
- Atualize a pagina com `Ctrl + F5`.

### Impressora nao imprime
- Confirme a porta COM no Gerenciador de Dispositivos.
- Atualize a porta no sistema e teste novamente.
- Rode `scripts\testar_impressora.bat --mode serial --port COM4 --baudrate 9600` (ajuste COM conforme sua maquina).

### Tela nao abre no navegador
- Acesse manualmente: `http://localhost:5500`.

## 8. Encerrar o sistema
1. Feche o navegador.
2. Feche a janela preta (terminal).

## 9. Boas praticas
- Nao apague a pasta `backend\app\database` sem backup.
- Nao execute `zerar_banco.bat` em ambiente de producao.
- Sempre fechar comandas e conferir fechamento no fim do dia.
