// colaboradores.js

// Variáveis de elementos DOM dos Colaboradores
let sectionColaboradores, navColaboradores, tabelaColaboradoresBody, btnSalvarColaborador, btnLimparColaborador;

function carregarElementosColaboradores() {
    sectionColaboradores = document.getElementById("sectionColaboradores");
    navColaboradores = document.getElementById("navColaboradores");
    tabelaColaboradoresBody = document.getElementById("tabelaColaboradoresBody");
    btnSalvarColaborador = document.getElementById("btnSalvarColaborador");
    btnLimparColaborador = document.getElementById("btnLimparColaborador");
}

let colaboradoresCache = [];
let sortColabCol = 'ativo';
let sortColabAsc = false;
let colaboradorEmEdicaoId = null;

async function carregarColaboradores() {
    try {
        colaboradoresCache = await getColaboradores();
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
                <button onclick="editarColaborador(${c.id})" style="margin-left: 6px; background: #dbeafe; color: #1d4ed8; border: none; border-radius: 6px; padding: 4px 8px; cursor: pointer; font-weight: 700;" title="Editar">Ed</button>
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
        ativo: colaboradorEmEdicaoId
            ? !!(colaboradoresCache.find(c => c.id === colaboradorEmEdicaoId)?.ativo)
            : true
    };

    try {
        if (colaboradorEmEdicaoId) {
            await updateColaborador(colaboradorEmEdicaoId, payload);
        } else {
            await createColaborador(payload);
        }
        limparCamposColaborador();
        await carregarColaboradores();
    } catch (err) {
        console.error(err);
        alert(err.message || "Erro ao salvar colaborador");
    }
}

function limparCamposColaborador() {
    colaboradorEmEdicaoId = null;
    document.getElementById("colabNome").value = "";
    document.getElementById("colabEndereco").value = "";
    document.getElementById("colabFuncao").value = "";
    if (btnSalvarColaborador) btnSalvarColaborador.innerText = "Salvar";

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
    setupColaboradoresEnterNavigation();
}

function editarColaborador(id) {
    const colaborador = colaboradoresCache.find(c => c.id === id);
    if (!colaborador) return;
    const esc = (v) => String(v || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    colaboradorEmEdicaoId = id;

    document.getElementById("colabNome").value = colaborador.nome || "";
    document.getElementById("colabEndereco").value = colaborador.endereco || "";
    document.getElementById("colabFuncao").value = colaborador.funcao || "";

    const contatos = (colaborador.contatos && colaborador.contatos.length > 0) ? colaborador.contatos : [""];
    const pixs = (colaborador.pixs && colaborador.pixs.length > 0) ? colaborador.pixs : [""];

    const contatosHtml = contatos.map((valor, idx) => `
        <div class="flex-container">
            <input class="colab-contato" placeholder="(00) 00000-0000" style="flex: 1;" value="${esc(valor)}">
            <button onclick="adicionarInput('listaInputsContatos', 'colab-contato')" style="background: #38bdf8; padding: 0 10px; border-radius: 6px;">+</button>
            ${idx > 0 ? '<button onclick="this.parentElement.remove()" style="background:#fee2e2; color:#ef4444; border:none; border-radius:6px; padding:0 10px;">-</button>' : ''}
        </div>
    `).join("");

    const pixHtml = pixs.map((valor, idx) => `
        <div class="flex-container">
            <input class="colab-pix" placeholder="Email, CPF ou Chave..." style="flex: 1;" value="${esc(valor)}">
            <button onclick="adicionarInput('listaInputsPix', 'colab-pix')" style="background: #38bdf8; padding: 0 10px; border-radius: 6px;">+</button>
            ${idx > 0 ? '<button onclick="this.parentElement.remove()" style="background:#fee2e2; color:#ef4444; border:none; border-radius:6px; padding:0 10px;">-</button>' : ''}
        </div>
    `).join("");

    document.getElementById("listaInputsContatos").innerHTML = contatosHtml;
    document.getElementById("listaInputsPix").innerHTML = pixHtml;
    if (btnSalvarColaborador) btnSalvarColaborador.innerText = "Atualizar";
    setupColaboradoresEnterNavigation();
}

async function alterarStatusColaborador(id, ativo) {
    try {
        await updateColaborador(id, { ativo });
        await carregarColaboradores();
    } catch (err) {
        console.error(err);
        alert(err.message || "Erro ao alterar status");
    }
}

function alternarParaColaboradores() {
    document.getElementById("sectionComandas").classList.add("hidden");
    document.getElementById("sectionProdutos").classList.add("hidden");
    if (document.getElementById("sectionClientes")) document.getElementById("sectionClientes").classList.add("hidden");
    if (document.getElementById("sectionEstoque")) document.getElementById("sectionEstoque").classList.add("hidden");
    if (document.getElementById("sectionConfiguracao")) document.getElementById("sectionConfiguracao").classList.add("hidden");
    if (document.getElementById("sectionUsuarios")) document.getElementById("sectionUsuarios").classList.add("hidden");
    if (document.getElementById("sectionFinanceiro")) document.getElementById("sectionFinanceiro").classList.add("hidden");
    if (document.getElementById("sectionRelatorios")) document.getElementById("sectionRelatorios").classList.add("hidden");
    if (document.getElementById("sectionFechamento")) document.getElementById("sectionFechamento").classList.add("hidden");
    sectionColaboradores.classList.remove("hidden");

    document.getElementById("navDashboard").classList.remove("active");
    document.getElementById("navProdutosSessao").classList.remove("active");
    if (document.getElementById("navClientes")) document.getElementById("navClientes").classList.remove("active");
    if (document.getElementById("navEstoque")) document.getElementById("navEstoque").classList.remove("active");
    if (document.getElementById("navConfiguracao")) document.getElementById("navConfiguracao").classList.remove("active");
    if (document.getElementById("navUsuarios")) document.getElementById("navUsuarios").classList.remove("active");
    if (document.getElementById("navColaboradores")) document.getElementById("navColaboradores").classList.remove("active");
    if (document.getElementById("navFinanceiro")) document.getElementById("navFinanceiro").classList.remove("active");
    if (document.getElementById("navRelatorios")) document.getElementById("navRelatorios").classList.remove("active");
    if (document.getElementById("navFechamento")) document.getElementById("navFechamento").classList.remove("active");
    navColaboradores.classList.add("active");

    // Focar no primeiro campo
    setTimeout(() => {
        const inputNome = document.getElementById("colabNome");
        if (inputNome) inputNome.focus();
    }, 100);

    carregarColaboradores();
}

// Listeners
function setupColaboradoresListeners() {
    carregarElementosColaboradores();
    setupColaboradoresEnterNavigation();

    if (navColaboradores) navColaboradores.onclick = (e) => { e.preventDefault(); alternarParaColaboradores(); };
    if (btnSalvarColaborador) btnSalvarColaborador.onclick = salvarColaborador;
    if (btnLimparColaborador) btnLimparColaborador.onclick = limparCamposColaborador;
}

function setupColaboradoresEnterNavigation() {
    const fields = [
        "colabNome",
        "colabEndereco",
        "colabFuncao"
    ];

    fields.forEach((id, index) => {
        const el = document.getElementById(id);
        if (el) {
            el.onkeydown = (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    const nextId = fields[index + 1];
                    if (nextId) {
                        document.getElementById(nextId).focus();
                    } else {
                        // Se for o último do grid, foca no primeiro contato
                        const primContato = document.querySelector(".colab-contato");
                        if (primContato) primContato.focus();
                    }
                }
            };
        }
    });

    // Lógica para inputs dinâmicos de contato e pix usando delegação ou reassociação
    // Para simplificar e lidar com novos inputs, usamos delegação no container
    const contatosCont = document.getElementById("listaInputsContatos");
    if (contatosCont) {
        contatosCont.onkeydown = (e) => {
            if (e.key === "Enter" && e.target.classList.contains("colab-contato")) {
                e.preventDefault();
                // Tenta focar no próximo input de contato ou no primeiro pix
                const allContatos = Array.from(contatosCont.querySelectorAll(".colab-contato"));
                const currIdx = allContatos.indexOf(e.target);
                if (currIdx < allContatos.length - 1) {
                    allContatos[currIdx + 1].focus();
                } else {
                    const primPix = document.querySelector(".colab-pix");
                    if (primPix) primPix.focus();
                }
            }
        };
    }

    const pixCont = document.getElementById("listaInputsPix");
    if (pixCont) {
        pixCont.onkeydown = (e) => {
            if (e.key === "Enter" && e.target.classList.contains("colab-pix")) {
                e.preventDefault();
                const allPix = Array.from(pixCont.querySelectorAll(".colab-pix"));
                const currIdx = allPix.indexOf(e.target);
                if (currIdx < allPix.length - 1) {
                    allPix[currIdx + 1].focus();
                } else {
                    btnSalvarColaborador.focus();
                }
            }
        };
    }

    if (btnSalvarColaborador) {
        btnSalvarColaborador.onkeydown = (e) => {
            if (e.key === "Tab") {
                // Se pressionar Tab no botão de salvar, perguntamos se deseja salvar
                e.preventDefault();
                if (confirm("Deseja salvar os dados do colaborador?")) {
                    salvarColaborador();
                } else {
                    // Se não quiser salvar, pode querer voltar ao início ou para o campo anterior (Shift+Tab)
                    // Mas o pedido foi apenas perguntar se quer salvar ao apertar Tab.
                }
            }
        };
    }
}

// Chamar no carregamento inicial se o elemento existir
document.addEventListener("DOMContentLoaded", setupColaboradoresListeners);

// Global
window.alterarStatusColaborador = alterarStatusColaborador;
window.ordenarColaboradores = ordenarColaboradores;
window.filtrarERenderizarColaboradores = filtrarERenderizarColaboradores;
window.limparFiltrosColaboradores = limparFiltrosColaboradores;
window.editarColaborador = editarColaborador;
