// ===============================
// MÓDULO DE IMPRESSÃO COM QZ TRAY
// ===============================

// Configuração da impressora
const PRINTER_CONFIG = {
  // Nome da impressora térmica (será detectado automaticamente ou pode ser configurado)
  printerName: null, // null = usa a impressora padrão
  // Largura do papel em mm
  paperWidth: 80,
  // Encoding para caracteres especiais (português)
  encoding: "UTF-8"
};

// Estado da conexão
let qzConnected = false;
let qzAvailable = false;

// ===============================
// INICIALIZAÇÃO DO QZ TRAY
// ===============================

async function initQzTray() {
  // Verifica se QZ Tray está disponível
  if (typeof qz === "undefined") {
    console.warn("QZ Tray não está carregado. Usando impressão padrão do navegador.");
    qzAvailable = false;
    return false;
  }

  qzAvailable = true;

  try {
    // Configura certificado de segurança (para produção, use um certificado válido)
    qz.security.setCertificatePromise(function (resolve, reject) {
      // Para desenvolvimento, aceita qualquer certificado
      // Em produção, configure com seu certificado
      resolve();
    });

    qz.security.setSignaturePromise(function (toSign) {
      return function (resolve, reject) {
        // Para desenvolvimento, retorna assinatura vazia
        // Em produção, assine com sua chave privada
        resolve();
      };
    });

    // Tenta conectar ao QZ Tray
    if (!qz.websocket.isActive()) {
      await qz.websocket.connect();
      console.log("✅ Conectado ao QZ Tray");
    }

    qzConnected = true;

    // Detecta impressoras disponíveis
    const printers = await qz.printers.find();
    console.log("Impressoras disponíveis:", printers);

    // Tenta encontrar uma impressora térmica
    const thermalPrinter = printers.find(p =>
      p.toLowerCase().includes("thermal") ||
      p.toLowerCase().includes("pos") ||
      p.toLowerCase().includes("epson") ||
      p.toLowerCase().includes("elgin") ||
      p.toLowerCase().includes("bematech") ||
      p.toLowerCase().includes("daruma") ||
      p.toLowerCase().includes("generic")
    );

    if (thermalPrinter) {
      PRINTER_CONFIG.printerName = thermalPrinter;
      console.log("📠 Impressora térmica detectada:", thermalPrinter);
    } else if (printers.length > 0) {
      PRINTER_CONFIG.printerName = printers[0];
      console.log("📠 Usando primeira impressora:", printers[0]);
    }

    return true;
  } catch (err) {
    console.error("Erro ao conectar ao QZ Tray:", err);
    qzConnected = false;
    return false;
  }
}

// ===============================
// FUNÇÃO PRINCIPAL DE IMPRESSÃO
// ===============================

async function imprimirSilencioso(conteudoHTML, titulo = "Impressão") {
  // Se QZ Tray está conectado, usa impressão silenciosa
  if (qzConnected && qzAvailable) {
    return await imprimirViaQZ(conteudoHTML, titulo);
  }

  // Fallback: tenta conectar ao QZ Tray
  if (qzAvailable && !qzConnected) {
    const conectou = await initQzTray();
    if (conectou) {
      return await imprimirViaQZ(conteudoHTML, titulo);
    }
  }

  // Fallback final: usa window.print()
  console.warn("QZ Tray não disponível. Usando impressão padrão.");
  return imprimirViaBrowser();
}

async function imprimirViaQZ(conteudoHTML, titulo) {
  try {
    const config = qz.configs.create(PRINTER_CONFIG.printerName, {
      margins: { top: 0, right: 0, bottom: 0, left: 0 },
      units: "mm",
      size: { width: PRINTER_CONFIG.paperWidth, height: null }, // altura automática
      colorType: "grayscale",
      interpolation: "nearest-neighbor"
    });

    // Converte HTML para dados de impressão
    const data = [{
      type: "html",
      format: "plain",
      data: conteudoHTML,
      options: {
        pageWidth: PRINTER_CONFIG.paperWidth,
        encoding: PRINTER_CONFIG.encoding
      }
    }];

    await qz.print(config, data);
    console.log("✅ Impressão enviada com sucesso:", titulo);
    return true;
  } catch (err) {
    console.error("Erro na impressão QZ:", err);
    // Fallback para impressão do navegador
    return imprimirViaBrowser();
  }
}

function imprimirViaBrowser() {
  window.print();
  return true;
}

// ===============================
// FUNÇÕES DE IMPRESSÃO ESPECÍFICAS
// ===============================

async function imprimirComanda(comandaNumero, nomeCliente, telefone, itens, total) {
  const html = gerarHTMLComanda(comandaNumero, nomeCliente, telefone, itens, total);
  return await imprimirSilencioso(html, `Comanda ${comandaNumero}`);
}

async function imprimirItensParciais(comandaNumero, itens, total) {
  const html = gerarHTMLItensParciais(comandaNumero, itens, total);
  return await imprimirSilencioso(html, `Parcial Comanda ${comandaNumero}`);
}

async function imprimirResumoPag(comandaNumero, pagamentos, total) {
  const html = gerarHTMLResumoPagamento(comandaNumero, pagamentos, total);
  return await imprimirSilencioso(html, `Pagamento Comanda ${comandaNumero}`);
}

async function imprimirFechamento(data, vendas, pagamentos, recebimentosSistema, recebimentosManuais) {
  const html = gerarHTMLFechamento(data, vendas, pagamentos, recebimentosSistema, recebimentosManuais);
  return await imprimirSilencioso(html, `Fechamento ${data}`);
}

// ===============================
// GERADORES DE HTML PARA IMPRESSÃO
// ===============================

function gerarCabecalhoHTML() {
  return `
    <div class="print-header">
      <h1>RESTAURANTE RANCHO JP</h1>
    </div>
  `;
}

function gerarRodapeHTML() {
  return `
    <div class="print-footer">
      <span>📸 @restauranteranchojp</span> | <span>📱 (16) 991211765</span>
    </div>
    <div class="print-spacer"></div>
  `;
}

function gerarHTMLComanda(comandaNumero, nomeCliente, telefone, itens, total) {
  let itensHTML = "";
  itens.forEach(item => {
    itensHTML += `
      <tr>
        <td class="print-table">${item.codigo}</td>
        <td>${item.descricao}</td>
        <td class="text-center">${item.quantidade}</td>
        <td class="text-right">R$ ${formatarMoeda(item.subtotal)}</td>
      </tr>
    `;
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <link rel="stylesheet" href="../css/base/print.css">
      <style>
        body { font-family: 'Courier New', monospace; font-size: 9pt; width: 76mm; margin: 0; padding: 2mm; }
        table { width: 100%; border-collapse: collapse; }
        th { border-bottom: 1px solid black; padding: 1mm 0; text-align: left; font-size: 8pt; }
        td { padding: 1mm 0; border-bottom: 0.5px dashed #ccc; }
      </style>
    </head>
    <body>
      ${gerarCabecalhoHTML()}
      <h2 class="print-comanda-title">COMANDA ${comandaNumero}</h2>
      <div class="print-comanda-info">
        ${nomeCliente ? `<div>Cliente: <strong>${nomeCliente}</strong></div>` : ""}
        ${telefone ? `<div>Tel: ${telefone}</div>` : ""}
        <div>Data: ${new Date().toLocaleString("pt-BR")}</div>
      </div>
      <table class="print-table">
        <thead>
          <tr>
            <th>CÓD</th>
            <th>ITEM</th>
            <th class="text-center">QTD</th>
            <th class="text-right">VALOR</th>
          </tr>
        </thead>
        <tbody>
          ${itensHTML}
        </tbody>
      </table>
      <div class="print-total">
        TOTAL: R$ ${formatarMoeda(total)}
      </div>
      ${gerarRodapeHTML()}
    </body>
    </html>
  `;
}

function gerarHTMLItensParciais(comandaNumero, itens, total) {
  let itensHTML = "";
  itens.forEach(item => {
    itensHTML += `
      <tr>
        <td class="print-table">${item.descricao}</td>
        <td class="text-center">${item.quantidade}</td>
        <td class="text-right">R$ ${formatarMoeda(item.subtotal)}</td>
      </tr>
    `;
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <link rel="stylesheet" href="../css/base/print.css">
      <style>
        body { font-family: 'Courier New', monospace; font-size: 9pt; width: 76mm; margin: 0; padding: 2mm; }
        table { width: 100%; border-collapse: collapse; }
        th { border-bottom: 1px solid black; padding: 1mm 0; text-align: left; font-size: 8pt; }
        td { padding: 1mm 0; border-bottom: 0.5px dashed #ccc; }
      </style>
    </head>
    <body>
      ${gerarCabecalhoHTML()}
      <h2 class="print-comanda-title">COMANDA ${comandaNumero}</h2>
      <table class="print-table">
        <thead>
          <tr>
            <th>ITEM</th>
            <th class="text-center">QTD</th>
            <th class="text-right">VALOR</th>
          </tr>
        </thead>
        <tbody>
          ${itensHTML}
        </tbody>
      </table>
      <div class="print-total">
        TOTAL: R$ ${formatarMoeda(total)}
      </div>
      ${gerarRodapeHTML()}
    </body>
    </html>
  `;
}

function gerarHTMLResumoPagamento(comandaNumero, pagamentos, total) {
  let pagamentosHTML = "";
  pagamentos.forEach(pag => {
    pagamentosHTML += `
      <tr>
        <td class="print-table">${pag.forma}</td>
        <td class="text-right">R$ ${formatarMoeda(pag.valor)}</td>
      </tr>
    `;
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <link rel="stylesheet" href="../css/base/print.css">
      <style>
        body { font-family: 'Courier New', monospace; font-size: 9pt; width: 76mm; margin: 0; padding: 2mm; }
        table { width: 100%; border-collapse: collapse; }
        th { border-bottom: 1px solid black; padding: 1mm 0; text-align: left; font-size: 8pt; }
        td { padding: 1mm 0; }
      </style>
    </head>
    <body>
      ${gerarCabecalhoHTML()}
      <h3 class="print-payment-title">RESUMO DE PAGAMENTO</h3>
      <div class="print-payment-info">
        Comanda: ${comandaNumero}<br>
        Data: ${new Date().toLocaleString("pt-BR")}
      </div>
      <table class="print-table">
        <thead>
          <tr>
            <th>FORMA</th>
            <th class="text-right">VALOR</th>
          </tr>
        </thead>
        <tbody>
          ${pagamentosHTML}
        </tbody>
      </table>
      <div class="print-total">
        TOTAL: R$ ${formatarMoeda(total)}
      </div>
      ${gerarRodapeHTML()}
    </body>
    </html>
  `;
}

function gerarHTMLFechamento(data, vendas, pagamentos, recebimentosSistema, recebimentosManuais) {
  let vendasHTML = "";
  vendas.forEach(v => {
    vendasHTML += `<tr><td class="print-table">${v.descricao}</td><td class="text-right">${v.quantidade}</td></tr>`;
  });

  let pagamentosHTML = "";
  pagamentos.forEach(p => {
    pagamentosHTML += `<tr><td class="print-table">${p.fornecedor}</td><td class="text-right">R$ ${formatarMoeda(p.total)}</td></tr>`;
  });

  let sistemaHTML = "";
  recebimentosSistema.forEach(r => {
    sistemaHTML += `<tr><td class="print-table">${r.forma}</td><td class="text-right">R$ ${formatarMoeda(r.total)}</td></tr>`;
  });

  let manualHTML = "";
  recebimentosManuais.forEach(m => {
    if (m.valor > 0) {
      manualHTML += `<tr><td class="print-table">${m.forma}</td><td class="text-right">R$ ${formatarMoeda(m.valor)}</td></tr>`;
    }
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <link rel="stylesheet" href="../css/base/print.css">
      <style>
        body { font-family: 'Courier New', monospace; font-size: 9pt; width: 76mm; margin: 0; padding: 2mm; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 3mm; }
        th { border-bottom: 1px solid black; padding: 1mm 0; text-align: left; font-size: 8pt; }
        td { padding: 1mm 0; }
        h3 { font-size: 10pt; border-bottom: 1px dashed black; margin-top: 3mm; margin-bottom: 2mm; }
      </style>
    </head>
    <body>
      ${gerarCabecalhoHTML()}
      <h2 class="print-closing-title">FECHAMENTO DIÁRIO</h2>
      <p class="print-closing-info">
        DATA: ${data}
      </p>

      ${vendas.length > 0 ? `
        <h3>VENDAS POR ITEM</h3>
        <table class="print-table">
          <thead><tr><th>ITEM</th><th class="text-right">QTD</th></tr></thead>
          <tbody>${vendasHTML}</tbody>
        </table>
      ` : ""}

      ${pagamentos.length > 0 ? `
        <h3>PAGAMENTOS (SAÍDAS)</h3>
        <table class="print-table">
          <thead><tr><th>RECEBEDOR</th><th class="text-right">VALOR</th></tr></thead>
          <tbody>${pagamentosHTML}</tbody>
        </table>
      ` : ""}

      ${recebimentosSistema.length > 0 ? `
        <h3>RECEBIMENTOS (SISTEMA)</h3>
        <table class="print-table">
          <thead><tr><th>MÉTODO</th><th class="text-right">VALOR</th></tr></thead>
          <tbody>${sistemaHTML}</tbody>
        </table>
      ` : ""}

      ${manualHTML ? `
        <h3>RECEBIMENTOS (MANUAL)</h3>
        <table class="print-table">
          <thead><tr><th>FORMA</th><th class="text-right">VALOR</th></tr></thead>
          <tbody>${manualHTML}</tbody>
        </table>
      ` : ""}

      <div class="print-closing-signature">
        <p>Conferido por: __________________</p>
      </div>
      ${gerarRodapeHTML()}
    </body>
    </html>
  `;
}

// ===============================
// VERIFICAR STATUS DO QZ TRAY
// ===============================

function isQzTrayAtivo() {
  return qzConnected && qzAvailable;
}

function getStatusImpressora() {
  if (qzConnected) {
    return {
      status: "conectado",
      impressora: PRINTER_CONFIG.printerName || "Padrão",
      metodo: "QZ Tray (Silencioso)"
    };
  }
  return {
    status: "desconectado",
    impressora: null,
    metodo: "Navegador (com preview)"
  };
}

// Tentar conectar ao iniciar
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    initQzTray().then(conectado => {
      if (conectado) {
        console.log("🖨️ Sistema de impressão silenciosa ativo");
      } else {
        console.log("🖨️ Usando impressão padrão do navegador");
      }
    });
  }, 1000);
});
