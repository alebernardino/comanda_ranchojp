const API_URL = `${window.location.protocol}//${window.location.hostname}:8000`;

// ===============================
// FUNÇÕES BASE DE API
// ===============================

async function apiRequest(path, method = "GET", body = null) {
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "include"
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(API_URL + path, options);

  // Se for 204 No Content, retorna null ou vazio
  if (res.status === 204) return null;

  // Se não for OK, tenta pegar o erro
  if (!res.ok) {
    let errorDetail = "Erro desconhecido";
    try {
      const err = await res.json();
      errorDetail = err.detail || JSON.stringify(err);
    } catch (e) {
      errorDetail = res.statusText;
    }
    throw new Error(errorDetail); // Lança erro para ser pego no try/catch do chamador
  }

  return res.json();
}

async function apiGet(path) {
  return apiRequest(path, "GET");
}

async function apiPost(path, body) {
  return apiRequest(path, "POST", body);
}

async function apiPut(path, body) {
  return apiRequest(path, "PUT", body);
}

async function apiDelete(path) {
  return apiRequest(path, "DELETE");
}

// ===============================
// API DE PRODUTOS
// ===============================

async function getProdutos(busca = null) {
  const path = busca ? `/produtos/?busca=${encodeURIComponent(busca)}` : "/produtos/";
  return apiGet(path);
}

async function createProduto(data) {
  return apiPost("/produtos/", data);
}

async function updateProduto(id, data) {
  return apiPut(`/produtos/${id}`, data);
}

async function deleteProduto(id) {
  return apiDelete(`/produtos/${id}`);
}

async function ativarProduto(id) {
  return apiPost(`/produtos/${id}/ativar`);
}

async function desativarProduto(id) {
  return apiPost(`/produtos/${id}/desativar`);
}

// ===============================
// API DE COMANDAS
// ===============================

async function getComandas() {
  return apiGet("/comandas/");
}

async function getComanda(numero) {
  return apiGet(`/comandas/${numero}`);
}

async function garantirComanda(numero) {
  return apiPost(`/comandas/garantir/${numero}`);
}

async function updateComanda(numero, data) {
  return apiPut(`/comandas/${numero}`, data);
}

async function getItensComanda(numero) {
  return apiGet(`/comandas/${numero}/itens`);
}

async function addItemComanda(numero, data) {
  return apiPost(`/comandas/${numero}/itens`, data);
}

async function updateItem(itemId, data) {
  return apiPut(`/itens/${itemId}`, data);
}

async function deleteItem(itemId) {
  return apiDelete(`/itens/${itemId}`);
}

async function getResumoComanda(numero) {
  return apiGet(`/comandas/${numero}/resumo`);
}

// ===============================
// API DE CLIENTES
// ===============================

async function getClientePorTelefone(telefone) {
  return apiGet(`/clientes/por-telefone?telefone=${encodeURIComponent(telefone)}`);
}

async function getClientes(busca = null) {
  const path = busca ? `/clientes/?busca=${encodeURIComponent(busca)}` : "/clientes/";
  return apiGet(path);
}

// ===============================
// API DE ESTOQUE
// ===============================

async function getEstoque(busca = null) {
  const path = busca ? `/estoque/?busca=${encodeURIComponent(busca)}` : "/estoque/";
  return apiGet(path);
}

async function estoqueEntrada(payload) {
  return apiPost("/estoque/entrada", payload);
}

async function estoqueSaida(payload) {
  return apiPost("/estoque/saida", payload);
}

async function estoqueAjuste(payload) {
  return apiPost("/estoque/ajuste", payload);
}

async function atualizarMinimoEstoque(produtoId, minimo) {
  return apiPut(`/estoque/minimo/${produtoId}?minimo=${encodeURIComponent(minimo)}`);
}

// ===============================
// API DE CONFIGURACAO
// ===============================

async function getConfig() {
  return apiGet("/config/");
}

async function updateConfig(payload) {
  return apiPost("/config/", payload);
}

// ===============================
// API DE IMPRESSORA (ESC/POS)
// ===============================

async function getPrinterConfig() {
  return apiGet("/printer/config");
}

async function updatePrinterConfig(payload) {
  return apiPost("/printer/config", payload);
}

async function getPrinterPorts() {
  return apiGet("/printer/ports");
}

async function testPrinterPort(payload) {
  return apiPost("/printer/test", payload);
}

async function printRawText(payload) {
  return apiPost("/printer/print", payload);
}

// ===============================
// API DE USUARIOS
// ===============================

async function getUsuarios() {
  return apiGet("/usuarios/");
}

async function createUsuario(payload) {
  return apiPost("/usuarios/", payload);
}

async function updateUsuarioStatus(id, ativo) {
  return apiPut(`/usuarios/${id}/status`, { ativo });
}

// ===============================
// API DE PAGAMENTOS
// ===============================

async function getPagamentosComanda(numero) {
  return apiGet(`/comandas/${numero}/pagamentos`);
}

async function addPagamento(numero, data) {
  return apiPost(`/comandas/${numero}/pagamentos`, data);
}

async function deletePagamento(id) {
  return apiDelete(`/pagamentos/${id}`);
}

async function finalizarComanda(numero) {
  return apiPost(`/comandas/${numero}/fechar`);
}

// ===============================
// API DE COLABORADORES
// ===============================

async function getColaboradores() {
  return apiGet("/colaboradores/");
}

async function createColaborador(data) {
  return apiPost("/colaboradores/", data);
}

async function updateColaborador(id, data) {
  return apiPut(`/colaboradores/${id}`, data);
}

// ===============================
// API DE FINANCEIRO
// ===============================

async function getFinanceiro() {
  return apiGet("/financeiro/");
}

async function createFinanceiro(data) {
  return apiPost("/financeiro/", data);
}

async function updateFinanceiro(id, data) {
  return apiPut(`/financeiro/${id}`, data);
}

async function deleteFinanceiro(id) {
  return apiDelete(`/financeiro/${id}`);
}

// ===============================
// API DE RELATÓRIOS
// ===============================

async function getRelatorioVendas(periodo, dataInicio, dataFim, busca) {
  let url = `/relatorios/vendas?periodo=${periodo}`;
  if (dataInicio) url += `&data_inicio=${encodeURIComponent(dataInicio)}`;
  if (dataFim) url += `&data_fim=${encodeURIComponent(dataFim)}`;
  if (busca) url += `&busca=${encodeURIComponent(busca)}`;
  return apiGet(url);
}

async function getRelatorioFluxoCaixa(periodo, dataInicio, dataFim) {
  let url = `/relatorios/fluxo-caixa?periodo=${periodo}`;
  if (dataInicio) url += `&data_inicio=${encodeURIComponent(dataInicio)}`;
  if (dataFim) url += `&data_fim=${encodeURIComponent(dataFim)}`;
  return apiGet(url);
}
