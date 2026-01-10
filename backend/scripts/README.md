# Scripts Utilitários - Backend

Esta pasta contém scripts de manutenção, migração e debug do sistema.

## 📋 Scripts Disponíveis

### 🔧 Manutenção do Banco de Dados

#### `check_db.py`
Verifica a integridade e estrutura do banco de dados.

```bash
cd backend
python scripts/check_db.py
```

#### `check_financeiro.py`
Valida dados financeiros e inconsistências em pagamentos.

```bash
cd backend
python scripts/check_financeiro.py
```

#### `limpar_fantasmas.py`
Remove registros órfãos ou inconsistentes do banco de dados.

```bash
cd backend
python scripts/limpar_fantasmas.py
```

---

### 🔄 Migrações

#### `migrate.py`
Script principal de migração do banco de dados.

```bash
cd backend
python scripts/migrate.py
```

#### `migration_remove_unique.py`
Migração específica para remover constraints UNIQUE problemáticas.

```bash
cd backend
python scripts/migration_remove_unique.py
```

---

### 🐛 Debug e Testes

#### `debug_stats.py`
Exibe estatísticas e métricas do sistema para debug.

```bash
cd backend
python scripts/debug_stats.py
```

#### `populate_today.py`
Popula o banco com dados de teste para o dia atual.

```bash
cd backend
python scripts/populate_today.py
```

---

## ⚠️ Avisos Importantes

- **Sempre faça backup do banco de dados antes de executar scripts de migração ou limpeza**
- Scripts de migração devem ser executados apenas uma vez
- Scripts de população são apenas para ambiente de desenvolvimento/teste

---

## 📝 Como Executar

Todos os scripts devem ser executados a partir da pasta `backend/`:

```bash
cd /caminho/para/comanda_ranchojp/backend
python scripts/nome_do_script.py
```
