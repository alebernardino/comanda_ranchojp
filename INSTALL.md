# Guia de Instalação em Produção

## Windows

### Passo 1: Extrair o projeto
1. Extraia o zip em `C:\Comanda\`
2. A estrutura deve ficar:
   ```
   C:\Comanda\
   ├── backend\
   ├── frontend\
   ├── scripts\
   └── README.md
   ```

### Instalação Offline (sem internet)

#### Passo 0: Preparar o pacote (em outra máquina com internet)
1. Baixe o instalador do Python 3.10+ (Windows x64) e leve junto
2. Baixe as dependências:
   ```bash
   cd backend
   pip download -r requirements.txt -d wheels
   ```
3. Gere o zip do projeto (com a pasta `backend/wheels`)

#### Passo 1: Instalar o Python
1. Execute o instalador do Python
2. **IMPORTANTE:** Marque "Add Python to PATH"
3. Reinicie o computador

#### Passo 2: Rodar o sistema
1. Duplo clique em `C:\Comanda\scripts\iniciar_sistema.bat`
2. O script instala dependências offline automaticamente (a partir de `backend\wheels`)
3. Aguarde o navegador abrir

### Passo 2: Instalar Python
1. Baixe Python 3.10+ de https://python.org
2. **IMPORTANTE:** Marque "Add Python to PATH" durante instalação
3. Reinicie o computador

### Passo 3: Criar atalho na Área de Trabalho
1. Clique com botão direito na Área de Trabalho
2. Novo → Atalho
3. Local: `C:\Comanda\scripts\iniciar_sistema.bat`
4. Nome: `Comanda Rancho JP`

### Passo 4: Usar o sistema
1. Duplo clique no atalho
2. Aguarde o navegador abrir
3. Comece a usar!

### Banco zerado (opcional)
Se quiser garantir um banco limpo em uma instalação:
1. Apague o arquivo `C:\Comanda\backend\app\database\comanda.db` (se existir)
2. Execute `C:\Comanda\scripts\zerar_banco.bat`

---

## Linux (Ubuntu/Debian)

### Passo 1: Extrair o projeto
```bash
sudo mkdir -p /opt/comanda
sudo unzip comanda_ranchojp_limpo.zip -d /opt/comanda
sudo chown -R $USER:$USER /opt/comanda
```

### Passo 2: Instalar dependências
```bash
sudo apt update
sudo apt install python3 python3-venv python3-pip
```

### Passo 3: Criar ambiente virtual
```bash
cd /opt/comanda/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Passo 4: Criar atalho no Desktop
```bash
cp /opt/comanda/scripts/ComandaRanchoJP.desktop ~/Desktop/
chmod +x ~/Desktop/ComandaRanchoJP.desktop
```

### Passo 5: Usar o sistema
1. Duplo clique no atalho no Desktop
2. Selecione "Confiar e Executar" se perguntado
3. Aguarde o navegador abrir

---

## Solução de Problemas

### "Python não encontrado"
- Windows: Reinstale Python marcando "Add to PATH"
- Linux: `sudo apt install python3`

### Navegador não abre
- Acesse manualmente: http://localhost:5500

### Porta em uso
- Verifique se outra instância está rodando
- Encerre processos: `Ctrl+C` no terminal

---

## Suporte
Em caso de problemas, verifique se:
1. Python 3.10+ está instalado
2. As portas 5500 e 8000 estão livres
3. O firewall permite conexões locais
