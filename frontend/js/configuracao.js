// Variaveis de elementos DOM da Configuracao
let sectionConfiguracao, navConfiguracao, configPlanoInfo;
let cfgDivisaoItem, cfgEstoque, cfgClientes, cfgColaboradores, cfgUsuarios, cfgRelatorios, btnSalvarConfig;

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
}

document.addEventListener("DOMContentLoaded", setupConfiguracaoListeners);

window.setupConfiguracaoListeners = setupConfiguracaoListeners;
window.alternarParaConfiguracao = alternarParaConfiguracao;
window.carregarConfiguracao = carregarConfiguracao;
