// utils.js

function formatarMoeda(valor) {
    if (valor === null || valor === undefined || isNaN(valor)) return "0,00";
    return Number(valor).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function parseMoeda(texto) {
    if (!texto) return 0;
    // Remove "R$", espaços e converte vírgula em ponto
    const limpo = texto.toString().replace(/[R$\s]/g, '').replace(',', '.');
    const numero = parseFloat(limpo);
    return isNaN(numero) ? 0 : numero;
}

function adicionarInput(containerId, className) {
    const container = document.getElementById(containerId);
    const div = document.createElement('div');
    div.className = 'flex-container';
    div.innerHTML = `
        <input class="${className}" placeholder="..." style="flex: 1;">
        <button onclick="this.parentElement.remove()" style="background: #ef4444; padding: 0 12px; border-radius: 6px; color: white; border: none; cursor: pointer;">×</button>
    `;
    container.appendChild(div);
    // Foca no novo input
    div.querySelector('input').focus();
}
