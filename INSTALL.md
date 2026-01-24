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
   - Importante: não inclua `backend/app/database/comanda.db` no zip para começar zerado

#### Passo 1: Instalar o Python
1. Execute o instalador do Python
2. **IMPORTANTE:** Marque "Add Python to PATH"
3. Reinicie o computador

#### Passo 2: Rodar o sistema
1. Duplo clique em `C:\Comanda\scripts\iniciar_sistema.bat`
2. O script instala dependências offline automaticamente (a partir de `backend\wheels`)
3. Aguarde o navegador abrir

#### (Opcional) Script para preparar pacote offline
No computador com internet, use:
```bat
scripts\preparar_offline.bat
```
Ele cria a pasta `backend\wheels` com as dependências.

#### (Opcional) Empacotar no Linux sem levar o banco local
```bash
scripts/empacotar_windows_offline.sh
```
Gera `dist/comanda_ranchojp_windows_offline.zip` sem o `comanda.db`.

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

### Instalação Offline (Linux)

#### Passo 0: Preparar o pacote (em outra máquina com internet)
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip download -r requirements.txt -d wheels
```
Inclua a pasta `backend/wheels` no zip do projeto.

#### Passo 3 (Offline): Instalar dependências
```bash
cd /opt/comanda/backend
python3 -m venv .venv
source .venv/bin/activate
pip install --no-index --find-links=./wheels -r requirements.txt
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

---

## Usuários e Login

Ao rodar a migração pela primeira vez, o sistema cria um usuário administrador:
- Usuário: `admin`
- Senha: `admin123`

Recomendação: altere a senha criando outro administrador e desativando o usuário padrão.

---

## Licenciamento Offline (por meses)

### 1) Gerar chaves (uma vez)
No computador do administrador:
```bash
python3 scripts/gerar_chaves_licenca.py
```
Copie o conteúdo de `licenca_public_key.b64` para `backend/app/license_public_key.txt`.
Guarde `licenca_private_key.b64` em local seguro.

### 2) Gerar licença por meses
```bash
python3 scripts/gerar_licenca.py --cliente "Rancho JP" --meses 4 --plano essencial --chave-privada licenca_private_key.b64 --saida licenca.json
```

### 3) Instalar licença no sistema
Copie o `licenca.json` para:
```
backend/app/database/licenca.json
```
Ou envie via endpoint:
```
POST /licenca/instalar
```
com o JSON da licença.

### (Opcional) Bypass para ambiente de testes
Defina a variável `LICENSE_BYPASS=1` antes de iniciar o backend.
