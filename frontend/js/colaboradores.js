// colaboradores.js

const sectionColaboradores = document.getElementById("sectionColaboradores");
const navColaboradores = document.getElementById("navColaboradores");
const tabelaColaboradoresBody = document.getElementById("tabelaColaboradoresBody");
const btnSalvarColaborador = document.getElementById("btnSalvarColaborador");
const btnLimparColaborador = document.getElementById("btnLimparColaborador");

let colaboradoresCache = [];
let sortColabCol = 'ativo';
let sortColabAsc = false;

async function carregarColaboradores() {
    try {
        const res = await fetch(`${API_URL}/colaboradores/`);
        colaboradoresCache = await res.json();
        filtrarERenderizarColaboradores();
    } catch (err) {
        console.error("Erro ao carregar colaboradores:", err);
    }
}

function filtrarERenderizarColaboradores() {
    if (!tabelaColaboradoresBody) return;

    const fNome = document.getElementById("filtroColabNome").value.toLowerCase();
    const fFuncao = document.getElementById("filtroColabFuncao").value.toLowerCase();

    let lista = colaboradoresCache.filter(c => {
        const matchNome = c.nome.toLowerCase().includes(fNome);
        const matchFuncao = (c.funcao || "").toLowerCase().includes(fFuncao);
        return matchNome && matchFuncao;
    });

    // Ordenação
    lista.sort((a, b) => {
        let valA = a[sortColabCol];
        let valB = b[sortColabCol];

        // Caso especial para status (ativo) - inativos sempre para baixo por padrão se não for a coluna de ordenação principal
        // Mas se a coluna de ordenação for 'ativo', respeitamos a direção.

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return sortColabAsc ? -1 : 1;
        if (valA > valB) return sortColabAsc ? 1 : -1;

        // Desempate por nome
        if (sortColabCol !== 'nome') {
            return a.nome.localeCompare(b.nome);
        }
        return 0;
    });

    renderizarTabelaColaboradores(lista);
}

function renderizarTabelaColaboradores(lista) {
    tabelaColaboradoresBody.innerHTML = "";

    lista.forEach(c => {
        const tr = document.createElement("tr");
        tr.classList.add("table-row");
        if (!c.ativo) tr.classList.add("colaborador-row-inactive");

        const contatosStr = c.contatos.join(", ") || "-";
        const pixsStr = c.pixs.join(", ") || "-";

        tr.innerHTML = `
            <td class="colaborador-id">#${c.id}</td>
            <td class="colaborador-nome-container">
                <div class="colaborador-nome">${c.nome}</div>
                <div class="colaborador-endereco">${c.endereco || ''}</div>
            </td>
            <td class="colaborador-funcao">${c.funcao || '-'}</td>
            <td class="colaborador-contatos" title="${contatosStr}">${contatosStr}</td>
            <td class="colaborador-contatos" title="${pixsStr}">${pixsStr}</td>
            <td class="colaborador-actions">
                <input type="checkbox" ${c.ativo ? 'checked' : ''} onchange="alterarStatusColaborador(${c.id}, this.checked)">
            </td>
        `;
        tabelaColaboradoresBody.appendChild(tr);
    });
}

function ordenarColaboradores(coluna) {
    if (sortColabCol === coluna) {
        sortColabAsc = !sortColabAsc;
    } else {
        sortColabCol = coluna;
        sortColabAsc = true;
    }
    filtrarERenderizarColaboradores();
}

function limparFiltrosColaboradores() {
    document.getElementById("filtroColabNome").value = "";
    document.getElementById("filtroColabFuncao").value = "";
    filtrarERenderizarColaboradores();
}

async function salvarColaborador() {
    const nome = document.getElementById("colabNome").value.trim();
    const endereco = document.getElementById("colabEndereco").value.trim();
    const funcao = document.getElementById("colabFuncao").value.trim();

    if (!nome) return alert("O nome é obrigatório.");

    const contatos = Array.from(document.querySelectorAll(".colab-contato"))
        .map(i => i.value.trim())
        .filter(v => v !== "");

    const pixs = Array.from(document.querySelectorAll(".colab-pix"))
        .map(i => i.value.trim())
        .filter(v => v !== "");

    const payload = {
        nome,
        endereco,
        funcao,
        contatos,
        pixs,
        ativo: true
    };

    try {
        const res = await fetch(`${API_URL}/colaboradores/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            limparCamposColaborador();
            await carregarColaboradores();
        } else {
            const err = await res.json();
            alert(err.detail || "Erro ao salvar colaborador");
        }
    } catch (err) {
        console.error(err);
    }
}

function limparCamposColaborador() {
    document.getElementById("colabNome").value = "";
    document.getElementById("colabEndereco").value = "";
    document.getElementById("colabFuncao").value = "";

    document.getElementById("listaInputsContatos").innerHTML = `
        <div class="flex-container">
            <input class="colab-contato" placeholder="(00) 00000-0000" style="flex: 1;">
            <button onclick="adicionarInput('listaInputsContatos', 'colab-contato')" style="background: #38bdf8; padding: 0 10px; border-radius: 6px;">+</button>
        </div>
    `;
    document.getElementById("listaInputsPix").innerHTML = `
        <div class="flex-container">
            <input class="colab-pix" placeholder="Email, CPF ou Chave..." style="flex: 1;">
            <button onclick="adicionarInput('listaInputsPix', 'colab-pix')" style="background: #38bdf8; padding: 0 10px; border-radius: 6px;">+</button>
        </div>
    `;
}

async function alterarStatusColaborador(id, ativo) {
    try {
        await fetch(`${API_URL}/colaboradores/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ativo })
        });
        await carregarColaboradores();
    } catch (err) {
        console.error(err);
    }
}

function alternarParaColaboradores() {
    document.getElementById("sectionComandas").classList.add("hidden");
    document.getElementById("sectionProdutos").classList.add("hidden");
    if (document.getElementById("sectionFinanceiro")) document.getElementById("sectionFinanceiro").classList.add("hidden");
    if (document.getElementById("sectionRelatorios")) document.getElementById("sectionRelatorios").classList.add("hidden");
    if (document.getElementById("sectionFechamento")) document.getElementById("sectionFechamento").classList.add("hidden");
    sectionColaboradores.classList.remove("hidden");

    document.getElementById("navDashboard").classList.remove("active");
    document.getElementById("navProdutosSessao").classList.remove("active");
    if (document.getElementById("navFinanceiro")) document.getElementById("navFinanceiro").classList.remove("active");
    if (document.getElementById("navRelatorios")) document.getElementById("navRelatorios").classList.remove("active");
    if (document.getElementById("navFechamento")) document.getElementById("navFechamento").classList.remove("active");
    navColaboradores.classList.add("active");

    carregarColaboradores();
}

// Listeners
if (navColaboradores) navColaboradores.onclick = (e) => { e.preventDefault(); alternarParaColaboradores(); };
if (btnSalvarColaborador) btnSalvarColaborador.onclick = salvarColaborador;
if (btnLimparColaborador) btnLimparColaborador.onclick = limparCamposColaborador;

// Global
window.alterarStatusColaborador = alterarStatusColaborador;
window.ordenarColaboradores = ordenarColaboradores;
window.filtrarERenderizarColaboradores = filtrarERenderizarColaboradores;
window.limparFiltrosColaboradores = limparFiltrosColaboradores;
