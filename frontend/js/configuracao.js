// Variaveis de elementos DOM da Configuracao
let sectionConfiguracao, navConfiguracao, configPlanoInfo;
let cfgDivisaoItem, cfgEstoque, cfgClientes, cfgColaboradores, cfgUsuarios, cfgRelatorios, btnSalvarConfig;
let printerMode, printerPort, printerPortList, printerBaudrate, printerPaperWidth, printerEncoding, printerAutoCut;
let btnAtualizarPortas, btnTestarImpressora, btnImprimirTeste, btnSalvarImpressora, printerStatus;

function carregarElementosConfiguracao() {
    sectionConfiguracao = document.getElementById("sectionConfiguracao");
    navConfiguracao = document.getElementById("navConfiguracao");
    configPlanoInfo = document.getElementById("configPlanoInfo");
    cfgDivisaoItem = document.getElementById("cfgDivisaoItem");
    cfgEstoque = document.getElementById("cfgEstoque");
    cfgClientes = document.getElementById("cfgClientes");
    cfgColaboradores = document.getElementById("cfgColaboradores");
    cfgUsuarios = document.getElementById("cfgUsuarios");
    cfgRelatorios = document.getElementById("cfgRelatorios");
    btnSalvarConfig = document.getElementById("btnSalvarConfig");

    printerMode = document.getElementById("printerMode");
    printerPort = document.getElementById("printerPort");
    printerPortList = document.getElementById("printerPortList");
    printerBaudrate = document.getElementById("printerBaudrate");
    printerPaperWidth = document.getElementById("printerPaperWidth");
    printerEncoding = document.getElementById("printerEncoding");
    printerAutoCut = document.getElementById("printerAutoCut");
    btnAtualizarPortas = document.getElementById("btnAtualizarPortas");
    btnTestarImpressora = document.getElementById("btnTestarImpressora");
    btnImprimirTeste = document.getElementById("btnImprimirTeste");
    btnSalvarImpressora = document.getElementById("btnSalvarImpressora");
    printerStatus = document.getElementById("printerStatus");
}

function setPrinterStatus(texto, cor = "#0f172a") {
    if (!printerStatus) return;
    printerStatus.textContent = texto;
    printerStatus.style.color = cor;
}

async function atualizarListaPortas() {
    if (!printerPortList) return;
    printerPortList.innerHTML = "";
    try {
        const data = await getPrinterPorts();
        const portas = Array.isArray(data.ports) ? data.ports : [];
        portas.forEach((porta) => {
            const opt = document.createElement("option");
            opt.value = porta;
            printerPortList.appendChild(opt);
        });
        if (!data.available) {
            setPrinterStatus("pyserial não instalado no backend.", "#ef4444");
        } else if (portas.length === 0) {
            setPrinterStatus("Nenhuma porta serial detectada.", "#f59e0b");
        } else {
            setPrinterStatus(`Portas detectadas: ${portas.join(", ")}`);
        }
    } catch (err) {
        console.error(err);
        setPrinterStatus("Erro ao listar portas.", "#ef4444");
    }
}

async function carregarConfigImpressora() {
    try {
        const cfg = await getPrinterConfig();
        if (printerMode) printerMode.value = cfg.mode || "qz";
        if (printerPort) printerPort.value = cfg.port || "";
        if (printerBaudrate) printerBaudrate.value = String(cfg.baudrate || 9600);
        if (printerPaperWidth) printerPaperWidth.value = String(cfg.paperWidth || 80);
        if (printerEncoding) printerEncoding.value = cfg.encoding || "cp860";
        if (printerAutoCut) printerAutoCut.checked = cfg.autoCut !== false;
    } catch (err) {
        console.error(err);
        setPrinterStatus("Erro ao carregar configuração da impressora.", "#ef4444");
    }
    await atualizarListaPortas();
}

async function salvarConfigImpressora() {
    const payload = {
        mode: printerMode ? printerMode.value : "qz",
        port: printerPort ? printerPort.value.trim() : "",
        baudrate: printerBaudrate ? parseInt(printerBaudrate.value || "9600", 10) : 9600,
        paperWidth: printerPaperWidth ? parseInt(printerPaperWidth.value || "80", 10) : 80,
        encoding: printerEncoding ? printerEncoding.value : "cp860",
        autoCut: printerAutoCut ? printerAutoCut.checked : true
    };

    try {
        await updatePrinterConfig(payload);
        setPrinterStatus("Configuração da impressora salva.", "#10b981");
        if (typeof window.refreshPrinterConfig === "function") {
            window.refreshPrinterConfig();
        }
    } catch (err) {
        console.error(err);
        setPrinterStatus(err.message || "Erro ao salvar configuração da impressora.", "#ef4444");
    }
}

async function testarImpressora() {
    if (printerMode && printerMode.value !== "serial") {
        setPrinterStatus("Modo atual não usa porta COM.", "#f59e0b");
        return;
    }
    const payload = {
        port: printerPort ? printerPort.value.trim() : "",
        baudrate: printerBaudrate ? parseInt(printerBaudrate.value || "9600", 10) : 9600
    };
    try {
        await testPrinterPort(payload);
        setPrinterStatus("Conexão com a impressora OK.", "#10b981");
    } catch (err) {
        console.error(err);
        setPrinterStatus(err.message || "Falha ao conectar na impressora.", "#ef4444");
    }
}

async function imprimirTeste() {
    if (printerMode && printerMode.value === "browser") {
        setPrinterStatus("Modo navegador não usa impressão direta.", "#f59e0b");
        return;
    }
    const texto =
        "TESTE DE IMPRESSAO\\n" +
        "Comanda Rancho JP\\n" +
        "-------------------------------\\n" +
        "Item 1      1   R$ 10,00\\n" +
        "Item 2      2   R$ 20,00\\n" +
        "TOTAL: R$ 30,00\\n" +
        "-------------------------------\\n" +
        "Obrigado!\\n";
    try {
        await printRawText({ text: texto, cut: true });
        setPrinterStatus("Teste enviado para impressão.", "#10b981");
    } catch (err) {
        console.error(err);
        setPrinterStatus(err.message || "Falha ao imprimir teste.", "#ef4444");
    }
}

async function carregarConfiguracao() {
    try {
        const config = await getConfig();
        window.appConfig = config;
        const modulos = config.modulos || {};
        if (configPlanoInfo) {
            const plano = config.plano || "total";
            configPlanoInfo.textContent = `Plano ativo: ${plano === "essencial" ? "Essencial" : "Total"}`;
        }
        const isAdmin = window.currentUser && window.currentUser.perfil === "admin";
        const habilitaEdicao = (config.plano || "total") === "total" && isAdmin;
        if (cfgDivisaoItem) cfgDivisaoItem.disabled = !habilitaEdicao;
        if (cfgEstoque) cfgEstoque.disabled = !habilitaEdicao;
        if (cfgClientes) cfgClientes.disabled = !habilitaEdicao;
        if (cfgColaboradores) cfgColaboradores.disabled = !habilitaEdicao;
        if (cfgUsuarios) cfgUsuarios.disabled = !habilitaEdicao;
        if (cfgRelatorios) cfgRelatorios.disabled = !habilitaEdicao;
        if (btnSalvarConfig) btnSalvarConfig.disabled = !habilitaEdicao;
        if (printerMode) printerMode.disabled = !habilitaEdicao;
        if (printerPort) printerPort.disabled = !habilitaEdicao;
        if (printerBaudrate) printerBaudrate.disabled = !habilitaEdicao;
        if (printerPaperWidth) printerPaperWidth.disabled = !habilitaEdicao;
        if (printerEncoding) printerEncoding.disabled = !habilitaEdicao;
        if (printerAutoCut) printerAutoCut.disabled = !habilitaEdicao;
        if (btnAtualizarPortas) btnAtualizarPortas.disabled = !habilitaEdicao;
        if (btnTestarImpressora) btnTestarImpressora.disabled = !habilitaEdicao;
        if (btnImprimirTeste) btnImprimirTeste.disabled = !habilitaEdicao;
        if (btnSalvarImpressora) btnSalvarImpressora.disabled = !habilitaEdicao;
        if (btnSalvarConfig && !habilitaEdicao) {
            btnSalvarConfig.style.opacity = "0.6";
            btnSalvarConfig.style.pointerEvents = "none";
        }
        if (cfgDivisaoItem) cfgDivisaoItem.checked = modulos.divisao_item !== false;
        if (cfgEstoque) cfgEstoque.checked = modulos.estoque !== false;
        if (cfgClientes) cfgClientes.checked = modulos.clientes !== false;
        if (cfgColaboradores) cfgColaboradores.checked = modulos.colaboradores !== false;
        if (cfgUsuarios) cfgUsuarios.checked = modulos.usuarios !== false;
        if (cfgRelatorios) cfgRelatorios.checked = modulos.relatorios !== false;
        await carregarConfigImpressora();
    } catch (err) {
        console.error(err);
    }
}

async function salvarConfiguracao() {
    const payload = {
        modulos: {
            divisao_item: cfgDivisaoItem ? cfgDivisaoItem.checked : true,
            estoque: cfgEstoque ? cfgEstoque.checked : true,
            clientes: cfgClientes ? cfgClientes.checked : true,
            colaboradores: cfgColaboradores ? cfgColaboradores.checked : true,
            usuarios: cfgUsuarios ? cfgUsuarios.checked : true,
            relatorios: cfgRelatorios ? cfgRelatorios.checked : true
        }
    };

    try {
        const updated = await updateConfig(payload);
        window.appConfig = updated;
        if (typeof aplicarConfigModulos === "function") {
            aplicarConfigModulos(updated);
        }
        alert("Configuração salva");
    } catch (err) {
        console.error(err);
        alert(err.message || "Erro ao salvar configuração");
    }
}

function alternarParaConfiguracao() {
    document.getElementById("sectionComandas").classList.add("hidden");
    document.getElementById("sectionProdutos").classList.add("hidden");
    if (document.getElementById("sectionClientes")) document.getElementById("sectionClientes").classList.add("hidden");
    if (document.getElementById("sectionEstoque")) document.getElementById("sectionEstoque").classList.add("hidden");
    if (document.getElementById("sectionUsuarios")) document.getElementById("sectionUsuarios").classList.add("hidden");
    if (document.getElementById("sectionColaboradores")) document.getElementById("sectionColaboradores").classList.add("hidden");
    if (document.getElementById("sectionFinanceiro")) document.getElementById("sectionFinanceiro").classList.add("hidden");
    if (document.getElementById("sectionRelatorios")) document.getElementById("sectionRelatorios").classList.add("hidden");
    if (document.getElementById("sectionFluxoCaixa")) document.getElementById("sectionFluxoCaixa").classList.add("hidden");
    if (document.getElementById("sectionFechamento")) document.getElementById("sectionFechamento").classList.add("hidden");
    if (sectionConfiguracao) sectionConfiguracao.classList.remove("hidden");

    document.getElementById("navDashboard").classList.remove("active");
    document.getElementById("navProdutosSessao").classList.remove("active");
    if (document.getElementById("navClientes")) document.getElementById("navClientes").classList.remove("active");
    if (document.getElementById("navEstoque")) document.getElementById("navEstoque").classList.remove("active");
    if (document.getElementById("navUsuarios")) document.getElementById("navUsuarios").classList.remove("active");
    if (document.getElementById("navColaboradores")) document.getElementById("navColaboradores").classList.remove("active");
    if (document.getElementById("navFinanceiro")) document.getElementById("navFinanceiro").classList.remove("active");
    if (document.getElementById("navRelatorios")) document.getElementById("navRelatorios").classList.remove("active");
    if (document.getElementById("navFechamento")) document.getElementById("navFechamento").classList.remove("active");
    if (navConfiguracao) navConfiguracao.classList.add("active");

    carregarConfiguracao();
}

function setupConfiguracaoListeners() {
    carregarElementosConfiguracao();

    if (navConfiguracao) navConfiguracao.onclick = (e) => { e.preventDefault(); alternarParaConfiguracao(); };
    if (btnSalvarConfig) btnSalvarConfig.onclick = salvarConfiguracao;
    if (btnAtualizarPortas) btnAtualizarPortas.onclick = atualizarListaPortas;
    if (btnTestarImpressora) btnTestarImpressora.onclick = testarImpressora;
    if (btnImprimirTeste) btnImprimirTeste.onclick = imprimirTeste;
    if (btnSalvarImpressora) btnSalvarImpressora.onclick = salvarConfigImpressora;
}

document.addEventListener("DOMContentLoaded", setupConfiguracaoListeners);

window.setupConfiguracaoListeners = setupConfiguracaoListeners;
window.alternarParaConfiguracao = alternarParaConfiguracao;
window.carregarConfiguracao = carregarConfiguracao;
