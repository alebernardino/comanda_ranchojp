const API_URL = "http://127.0.0.1:8000";

const input = document.getElementById("numeroComanda");
const botao = document.getElementById("btnAbrir");

botao.onclick = abrirComanda;
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") abrirComanda();
});

async function abrirComanda() {
  const numero = input.value;

  if (!numero) {
    alert("Informe o número da comanda");
    return;
  }

  // 1. tenta buscar a comanda
  let res = await fetch(`${API_URL}/comandas/${numero}`);

  // 2. se não existir, cria
  if (res.status === 404) {
    const criar = await fetch(`${API_URL}/comandas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ numero: Number(numero) })
    });

    if (!criar.ok) {
      alert("Erro ao criar a comanda");
      return;
    }

    // 3. busca novamente para garantir que existe
    res = await fetch(`${API_URL}/comandas/${numero}`);
  }

  // 4. se ainda não existir, não segue
  if (!res.ok) {
    alert("Não foi possível abrir a comanda");
    return;
  }

  // 5. agora é 100% seguro abrir a tela da comanda
  window.location.href = `comanda.html?numero=${numero}`;
}

