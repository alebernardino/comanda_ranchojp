const API_URL = "http://127.0.0.1:8000";

async function apiRequest(path, method = "GET", body = null) {
  const options = {
    method,
    headers: { "Content-Type": "application/json" }
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
