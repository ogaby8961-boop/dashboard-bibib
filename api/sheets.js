// api/sheets.js
// Vercel Serverless Function — lê a aba "Resultados - Total" do Google Sheets
// e retorna os dados do mês atual formatados para o dashboard Bibly.

import { google } from "googleapis";

const SHEET_ID  = "1TC4BPI2MG9cUAq8j8GQpePOQ9ojMMNSGSWgqqkfmlQs";
const ABA       = "Resultados - Total";

// Linhas onde cada métrica está na planilha (1-indexed)
// Ajuste se a sua planilha tiver linhas diferentes
const LINHAS = {
  novosLeads:       3,
  opps:             4,
  ltr:              5,
  noshow:           6,
  clientes:         7,
  oportunidades:    8,
  taxaConversao:    9,
  oppsWhatsapp:     10,
  oppsVideo:        11,
};

function limparPct(val) {
  if (val == null || val === "") return 0;
  const s = String(val).replace("%", "").replace(",", ".").trim();
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n > 100 ? 0 : n; // ignora valores absurdos como 800%
}

function limparNum(val) {
  if (val == null || val === "") return 0;
  const s = String(val).replace(",", ".").trim();
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

export default async function handler(req, res) {
  // CORS — permite chamada do seu frontend no Vercel
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  try {
    // Monta credencial a partir das variáveis de ambiente
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // Lê a aba inteira
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `'${ABA}'`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return res.status(200).json({ erro: "Planilha vazia ou sem dados." });
    }

    // ── Descobre o mês atual ──────────────────────────────────────
    // A planilha tem blocos por mês. Cada bloco começa com o nome do mês
    // na coluna A. Vamos achar o bloco do mês mais recente com dados.
    const mesesPt = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                     "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

    // Acha todos os inícios de bloco de mês
    const blocos = [];
    rows.forEach((row, i) => {
      const celula = (row[0] || "").trim();
      if (mesesPt.includes(celula)) blocos.push({ mes: celula, linha: i });
    });

    if (blocos.length === 0) {
      return res.status(200).json({ erro: "Nenhum mês encontrado na planilha." });
    }

    // Pega o último bloco (mês mais recente)
    const blocoAtual = blocos[blocos.length - 1];
    const inicio     = blocoAtual.linha; // linha do nome do mês
    const fim        = blocos.length > 1
      ? blocos[blocos.length - 1 + 1]?.linha ?? rows.length
      : rows.length;

    // Extrai as linhas do bloco atual
    const bloco = rows.slice(inicio, fim);

    // Linha 0 do bloco = nome do mês + datas nas colunas seguintes
    const headerRow  = bloco[0] || [];
    const numColunas = headerRow.length;

    // Acha a última coluna com data preenchida (último dia com dado)
    let ultimaColuna = 1;
    for (let c = 1; c < numColunas; c++) {
      if (headerRow[c] && String(headerRow[c]).trim() !== "") ultimaColula = c;
    }
    // Corrige typo — redefine aqui
    ultimaColuna = 1;
    for (let c = 1; c < numColunas; c++) {
      const v = (bloco[1]?.[c] ?? ""); // usa linha de leads como referência
      if (v !== "" && v != null) ultimaColuna = c;
    }

    // Função auxiliar: pega valor de uma linha relativa ao bloco
    const getVal = (linhaRelativa, col) => bloco[linhaRelativa]?.[col] ?? "";

    // ── Monta série diária ─────────────────────────────────────────
    const diario = [];
    let acumuladoClientes = 0;

    for (let c = 1; c <= ultimaColuna; c++) {
      const data      = String(headerRow[c] || "").trim();
      if (!data) continue;

      const clientesHoje = limparNum(getVal(LINHAS.clientes - 1, c));
      // clientes na planilha já são acumulados
      const noDia = c === 1
        ? clientesHoje
        : clientesHoje - limparNum(getVal(LINHAS.clientes - 1, c - 1));

      diario.push({
        dia:      data,
        clientes: clientesHoje,   // acumulado
        noDia:    Math.max(noDia, 0),
      });
    }

    // ── Pega valores do último dia preenchido ──────────────────────
    const col = ultimaColuna;
    const ultimo = {
      atualizadoAte:  String(headerRow[col] || "").trim(),
      diaAtual:       col, // número da coluna = dia do mês (aproximado)
      clientes:       limparNum(getVal(LINHAS.clientes      - 1, col)),
      leads:          limparNum(getVal(LINHAS.novosLeads    - 1, col)),
      opps:           limparNum(getVal(LINHAS.opps          - 1, col)),
      ltr:            limparPct(getVal(LINHAS.ltr           - 1, col)),
      noshow:         limparPct(getVal(LINHAS.noshow        - 1, col)),
      oportunidades:  limparNum(getVal(LINHAS.oportunidades - 1, col)),
      conversao:      limparPct(getVal(LINHAS.taxaConversao - 1, col)),
      whatsapp:       limparNum(getVal(LINHAS.oppsWhatsapp  - 1, col)),
      video:          limparNum(getVal(LINHAS.oppsVideo     - 1, col)),
    };

    // ── Metas: lê as linhas após os dados ─────────────────────────
    // Procura por "Meta 0X:" nas linhas do bloco
    let metas = { m1: null, m2: null, m3: null };
    bloco.forEach(row => {
      const celula = String(row[0] || "").trim();
      const match  = celula.match(/Meta\s*0?(\d):\s*(\d+)/i)
                  || celula.match(/Meta\s*0?(\d)[^:]*:\s*(\d+)/i);
      if (match) {
        const n = parseInt(match[1]);
        const v = parseInt(match[2]);
        if (n === 1) metas.m1 = v;
        if (n === 2) metas.m2 = v;
        if (n === 3) metas.m3 = v;
      }
    });

    return res.status(200).json({
      mes:     blocoAtual.mes,
      diario,
      atual:   ultimo,
      metas,
    });

  } catch (err) {
    console.error("Erro ao ler Sheets:", err);
    return res.status(500).json({ erro: err.message });
  }
}
