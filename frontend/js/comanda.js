const API_URL = "http://127.0.0.1:8000";

// pega numero da comanda da URL
const params = new URLSearchParams(window.location.search);
const numero = params.get("numero");

if (!numero) {
  alert("Comanda não informada");
  window.location.href = "index.html";
}

const titulo = document.getElementById("tituloComanda");

async function carregarComanda() {
  const res = await fetch(`${API_URL}/comandas/${numero}`);

  if (!res.ok) {
    alert("Comanda não encontrada");
    window.location.href = "index.html";
    return;
  }

  const comanda = await res.json();
  titulo.innerText = `Comanda ${comanda.numero}`;
}

carregarComanda();
