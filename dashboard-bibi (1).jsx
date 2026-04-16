import { useState } from "react";
import {
  Users, Target, TrendingUp, PhoneOff, Calendar,
  Video, CheckCircle2, XCircle, Star, Rocket,
  BookOpen, GraduationCap, ChevronDown, ChevronUp,
  Plus, Minus, Trash2, Award, MessageSquare, Upload,
  Link, ExternalLink, Edit3, Save, X, Headphones,
  GitBranch, Zap, ChevronRight,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const ACCENT     = "#a855f7";
const ACCENT_DIM = "#6d28d9";
const CARD_BG    = "#111118";
const BORDER     = "#1e1b2e";

const abrilDiario = [
  { dia: "01/04", clientes: 2,  noDia: 2 },
  { dia: "02/04", clientes: 6,  noDia: 4 },
  { dia: "03/04", clientes: 6,  noDia: 0 },
  { dia: "04/04", clientes: 6,  noDia: 0 },
  { dia: "05/04", clientes: 6,  noDia: 0 },
  { dia: "06/04", clientes: 11, noDia: 5 },
  { dia: "07/04", clientes: 14, noDia: 3 },
  { dia: "08/04", clientes: 17, noDia: 3 },
  { dia: "09/04", clientes: 21, noDia: 4 },
  { dia: "10/04", clientes: 29, noDia: 8 },
];

const abril = {
  metas:              { m1: 60, m2: 70, m3: 80 },
  diaAtual:           10,
  diasTotal:          30,
  diasUteisRestantes: 13,
  atualizadoAte:      "10/04",
  clientes:           29,
  leads:              133,
  opps:               21,
  ltr:                26,
  noshow:             26,
  oportunidades:      50,
  conversao:          53,
  whatsapp:           0,
  video:              41,
};

const TIER_CFG = {
  "Tier 4/5": { bg: "#1e1b2e", text: "#64748b" },
  "Tier 3":   { bg: "#451a00", text: "#f59e0b" },
  "Tier 2":   { bg: "#1e1b4b", text: "#818cf8" },
  "Tier 1":   { bg: "#052e16", text: "#4ade80" },
};

const historico = [
  { mes: "Dezembro", ano: "2025", tier: "Tier 4/5", clientes: 22, metas: { m1: 32, m2: 40, m3: 55 }, megaMeta: null, m: { leads: 861, opps: 30, ltr: 33, noshow: 43, oportunidades: 43, conversao: 0, whatsapp: 0, video: 0 }, conclusao: { texto: "Não bateu meta — 22 clientes", cor: "#f87171", tipo: "fail" } },
  { mes: "Janeiro",  ano: "2026", tier: "Tier 3",   clientes: 44, metas: { m1: 32, m2: 40, m3: 50 }, megaMeta: null, m: { leads: 1121, opps: 44, ltr: 40, noshow: 11, oportunidades: 44, conversao: 72, whatsapp: 16, video: 40 }, conclusao: { texto: "Meta 2 batida — 44 clientes", cor: "#4ade80", tipo: "meta2" } },
  { mes: "Fevereiro",ano: "2026", tier: "Tier 3",   clientes: 58, metas: { m1: 25, m2: 30, m3: 38 }, megaMeta: 50,   m: { leads: 580, opps: 56, ltr: 40, noshow: 15, oportunidades: 77, conversao: 71, whatsapp: 3, video: 57 }, conclusao: { texto: "Mega Meta 1 batida! — 58 clientes", cor: "#fbbf24", tipo: "mega" } },
  { mes: "Março",    ano: "2026", tier: "Tier 1",   clientes: 88, metas: { m1: 62, m2: 68, m3: 76 }, megaMeta: 86,   m: { leads: 702, opps: 111, ltr: 52, noshow: 24, oportunidades: 154, conversao: 63, whatsapp: 29, video: 104 }, conclusao: { texto: "Mega Meta 1 batida! — 88 clientes", cor: "#4ade80", tipo: "mega" } },
];

const progressaoCarreira = [
  { nivel: "JR 1", base: 1809.51, faixa1: { m1: 20, m2: 25, m3: 30 }, faixa2: { m1: 30, m2: 35, m3: 40 } },
  { nivel: "JR 2", base: 1988.48, faixa1: { m1: 20, m2: 25, m3: 30 }, faixa2: { m1: 30, m2: 35, m3: 40 } },
  { nivel: "JR 3", base: 2185.14, faixa1: { m1: 20, m2: 25, m3: 30 }, faixa2: { m1: 30, m2: 35, m3: 40 } },
  { nivel: "PL 1", base: 2401.25, faixa1: { m1: 25, m2: 30, m3: 45 }, faixa2: { m1: 30, m2: 35, m3: 50 } },
  { nivel: "PL 2", base: 2617.36, faixa1: { m1: 25, m2: 30, m3: 45 }, faixa2: { m1: 30, m2: 35, m3: 50 } },
  { nivel: "PL 3", base: 2852.93, faixa1: { m1: 25, m2: 30, m3: 45 }, faixa2: { m1: 30, m2: 35, m3: 50 } },
  { nivel: "SR 1", base: 3109.69, faixa1: { m1: 25, m2: 30, m3: 45 }, faixa2: { m1: 30, m2: 35, m3: 50 } },
  { nivel: "SR 2", base: 3389.56, faixa1: { m1: 25, m2: 30, m3: 45 }, faixa2: { m1: 30, m2: 35, m3: 50 } },
  { nivel: "SR 3", base: 3694.62, faixa1: { m1: 25, m2: 30, m3: 45 }, faixa2: { m1: 30, m2: 35, m3: 50 } },
];

function pct(v, t) { return Math.min(Math.round((v / t) * 100), 100); }
function calcChange(cur, prev, inverso = false) {
  if (prev === 0 && cur === 0) return null;
  if (prev === 0) return { val: 100, arrow: "↑", cor: inverso ? "#f87171" : "#4ade80" };
  const p = Math.round(((cur - prev) / Math.abs(prev)) * 100);
  const subiu = p >= 0;
  const bom = inverso ? !subiu : subiu;
  return { val: Math.abs(p), arrow: subiu ? "↑" : "↓", cor: bom ? "#4ade80" : "#f87171" };
}
const numColor = (tipo) => tipo === "mega" ? "#fbbf24" : tipo === "meta2" ? "#f59e0b" : "#94a3b8";
const fmt = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Bar({ value, max, color = ACCENT }) {
  return (
    <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ backgroundColor: "#1e1b2e" }}>
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct(value, max)}%`, backgroundColor: color }} />
    </div>
  );
}

function MetricCard({ title, value, sub, icon: Icon, iconColor = ACCENT, trend }) {
  const trendColor = trend === "down" ? "#f87171" : "#a3e635";
  return (
    <div className="rounded-xl p-5 flex flex-col gap-3" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}>
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium" style={{ color: "#94a3b8" }}>{title}</p>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#1e1b2e" }}>
          <Icon size={17} style={{ color: iconColor }} />
        </div>
      </div>
      <p className="text-3xl font-bold" style={{ color: ACCENT }}>{value}</p>
      <p className="text-xs" style={{ color: trend ? trendColor : "#64748b" }}>{sub}</p>
    </div>
  );
}

let _nextId = 1;
function RegistroManual({ registros, onAdd, onRemove, dataDefault }) {
  const [data, setData] = useState(dataDefault);
  const [qtd, setQtd] = useState(1);
  const [obs, setObs] = useState("");
  const total = registros.reduce((s, r) => s + r.quantidade, 0);
  return (
    <div className="rounded-2xl p-5 space-y-3" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#64748b" }}>Registro Manual</p>
        {total > 0 && <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#2e1065", color: ACCENT }}>+{total} no forecast</span>}
      </div>
      <div className="flex items-center gap-1.5">
        <CheckCircle2 size={14} style={{ color: "#4ade80" }} />
        <p className="text-sm font-semibold text-white">Adicionar um Ganho</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-xs mb-1" style={{ color: "#64748b" }}>Data</p>
          <input value={data} onChange={e => setData(e.target.value)} placeholder="DD/MM/AAAA" className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none" style={{ backgroundColor: "#0f0f18", border: `1px solid ${BORDER}` }} />
        </div>
        <div>
          <p className="text-xs mb-1" style={{ color: "#64748b" }}>Quantidade</p>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setQtd(q => Math.max(1, q - 1))} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#1e1b2e", color: "#94a3b8" }}><Minus size={13} /></button>
            <span className="flex-1 text-center font-bold text-white">{qtd}</span>
            <button onClick={() => setQtd(q => q + 1)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#1e1b2e", color: "#94a3b8" }}><Plus size={13} /></button>
          </div>
        </div>
      </div>
      <input value={obs} onChange={e => setObs(e.target.value)} placeholder="Observação (opcional)" className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none" style={{ backgroundColor: "#0f0f18", border: `1px solid ${BORDER}` }} />
      <button onClick={() => { onAdd({ data, quantidade: qtd, obs }); setQtd(1); setObs(""); }} className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2" style={{ backgroundColor: "#14532d", color: "#4ade80", border: "1px solid #166534" }}>
        <Plus size={14} />Adicionar {qtd} fechamento{qtd > 1 ? "s" : ""}
      </button>
      {registros.length > 0 && (
        <div className="space-y-1.5 pt-1" style={{ borderTop: `1px solid ${BORDER}` }}>
          {registros.map(r => (
            <div key={r.id} className="flex items-center justify-between rounded-lg px-2.5 py-1.5" style={{ backgroundColor: "#0f0f18", border: `1px solid ${BORDER}` }}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: "#2e1065", color: ACCENT }}>+{r.quantidade}</span>
                <span className="text-xs text-white">{r.data}</span>
                {r.obs && <span className="text-xs" style={{ color: "#475569" }}>· {r.obs}</span>}
              </div>
              <button onClick={() => onRemove(r.id)} style={{ color: "#f87171" }}><Trash2 size={12} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusMeta({ clientesTotal, dadosAbril }) {
  const metas = dadosAbril.metas;
  const diaAtual = dadosAbril.diaAtual;
  const diasTotal = dadosAbril.diasTotal;
  const diasUteisRest = dadosAbril.diasUteisRestantes;
  const projecaoFinal = Math.round((clientesTotal / diaAtual) * diasTotal);
  const esperadoHoje = Math.round((metas.m3 / diasTotal) * diaAtual);
  const emRitmo = clientesTotal >= esperadoHoje;
  const nec = (meta) => Math.max(Math.ceil(((meta - clientesTotal) / diasUteisRest) * 10) / 10, 0);

  return (
    <div className="rounded-2xl p-6 space-y-5" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Target size={15} style={{ color: ACCENT }} />
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#64748b" }}>Meta do Mês — Abril · Status</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: "#64748b" }}>Dia <span className="font-bold text-white">{diaAtual}</span> de {diasTotal}</span>
          <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: emRitmo ? "#2e1065" : "#3f1515", color: emRitmo ? ACCENT : "#f87171", border: `1px solid ${emRitmo ? ACCENT : "#f87171"}` }}>{emRitmo ? "No Ritmo" : "Atrasado"}</span>
        </div>
      </div>
      <div className="flex items-baseline gap-3">
        <span className="text-6xl font-extrabold text-white">{clientesTotal}</span>
        <span className="text-2xl font-light" style={{ color: "#475569" }}>/ {metas.m3}</span>
        <span className="ml-auto text-sm" style={{ color: "#64748b" }}>Faltam <span className="font-bold text-white">{Math.max(metas.m3 - clientesTotal, 0)}</span> para Meta 3</span>
      </div>
      <div className="relative" style={{ paddingTop: 28, paddingBottom: 24 }}>
        {[{ label: "M1", val: metas.m1 }, { label: "M2", val: metas.m2 }].map(({ label, val }) => (
          <div key={label} className="absolute flex flex-col items-center" style={{ left: `${pct(val, metas.m3)}%`, top: 0, transform: "translateX(-50%)" }}>
            <span className="text-xs" style={{ color: "#64748b" }}>{label}</span>
            <div style={{ width: 1, height: 20, backgroundColor: "#334155" }} />
          </div>
        ))}
        <div className="absolute flex flex-col items-center" style={{ left: `${pct(esperadoHoje, metas.m3)}%`, top: 0, transform: "translateX(-50%)", zIndex: 10 }}>
          <span className="text-sm font-bold" style={{ color: "#f59e0b" }}>{esperadoHoje}</span>
          <div style={{ width: 1, height: 20, backgroundColor: "#f59e0b" }} />
        </div>
        <div className="w-full rounded-full overflow-hidden" style={{ height: 10, backgroundColor: "#1e1b2e" }}>
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct(clientesTotal, metas.m3)}%`, backgroundColor: ACCENT }} />
        </div>
        <div className="absolute" style={{ left: `${pct(esperadoHoje, metas.m3)}%`, top: "100%", transform: "translateX(-50%)", marginTop: -2 }}>
          <span className="text-xs whitespace-nowrap" style={{ color: "#f59e0b" }}>deveria estar aqui</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[{ label: "META 1", val: metas.m1, cor: "#fbbf24" }, { label: "META 2", val: metas.m2, cor: "#f87171" }, { label: "META 3 ★", val: metas.m3, cor: "#f87171" }].map(({ label, val, cor }) => {
          const n = nec(val);
          return (
            <div key={label} className="rounded-xl p-4" style={{ backgroundColor: "#0f0f18", border: `1px solid ${BORDER}` }}>
              <p className="text-xs font-bold tracking-wide mb-0.5" style={{ color: "#94a3b8" }}>{label}</p>
              <p className="text-xs" style={{ color: "#64748b" }}>{val} fechamentos</p>
              <p className="text-3xl font-extrabold mt-2" style={{ color: n === 0 ? "#4ade80" : cor }}>
                {n === 0 ? "✓" : n.toFixed(1)}{n > 0 && <span className="text-base font-normal ml-1" style={{ color: "#64748b" }}>/dia</span>}
              </p>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ backgroundColor: "#0f0f18", border: `1px solid ${BORDER}` }}>
          <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "#64748b" }}>Projeção Final</span>
          <span className="text-3xl font-extrabold" style={{ color: projecaoFinal >= metas.m3 ? "#4ade80" : "#f87171" }}>{projecaoFinal}</span>
          <span style={{ color: "#475569" }}>/ {metas.m3}</span>
        </div>
        <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ backgroundColor: "#0f0f18", border: `1px solid ${BORDER}` }}>
          <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "#64748b" }}>Dias Restantes</span>
          <span className="text-3xl font-extrabold text-white">{diasUteisRest}</span>
          <span style={{ color: "#475569" }}>úteis</span>
        </div>
      </div>
    </div>
  );
}

function EvolucaoChart({ diario, metaM3, diasTotal }) {
  const data = diario.map((d, i) => ({ dia: d.dia, acumulado: d.clientes, noDia: d.noDia, metaIdeal: Math.round((metaM3 / diasTotal) * (i + 1)) }));
  return (
    <div className="rounded-2xl p-6 space-y-4" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-base font-bold text-white">Evolução de Fechamentos</p>
          <p className="text-xs" style={{ color: "#64748b" }}>Acumulado diário no mês</p>
        </div>
        <div className="flex items-center gap-4 text-xs" style={{ color: "#64748b" }}>
          <span className="flex items-center gap-1.5"><span className="inline-block w-5 h-0.5 rounded" style={{ backgroundColor: ACCENT }} />Acumulado</span>
          <span className="flex items-center gap-1.5"><span className="inline-block w-5 h-0.5 rounded" style={{ backgroundColor: "#818cf8" }} />No dia</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={ACCENT} stopOpacity={0.3} /><stop offset="95%" stopColor={ACCENT} stopOpacity={0} /></linearGradient>
            <linearGradient id="gD" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#818cf8" stopOpacity={0.25} /><stop offset="95%" stopColor="#818cf8" stopOpacity={0} /></linearGradient>
          </defs>
          <CartesianGrid stroke="#1e1b2e" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="dia" tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ backgroundColor: "#111118", border: `1px solid ${BORDER}`, borderRadius: 8, color: "#fff" }} labelStyle={{ color: "#94a3b8" }} />
          <Area type="monotone" dataKey="acumulado" stroke={ACCENT} strokeWidth={2.5} fill="url(#gA)" dot={{ r: 3, fill: ACCENT }} name="Acumulado" />
          <Area type="monotone" dataKey="noDia" stroke="#818cf8" strokeWidth={1.5} fill="url(#gD)" strokeDasharray="5 3" dot={false} name="No dia" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function EvolucaoPerformance() {
  const primeiro = historico[0];
  const ultimo = historico[historico.length - 1];
  const crescPct = Math.round(((ultimo.clientes - primeiro.clientes) / primeiro.clientes) * 100);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp size={16} style={{ color: ACCENT }} />
        <p className="text-base font-bold text-white">Evolução de Performance — <span style={{ color: "#64748b" }}>{primeiro.tier}</span><span className="mx-1" style={{ color: "#475569" }}>→</span><span style={{ color: "#4ade80" }}>{ultimo.tier}</span></p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {historico.map((d) => {
          const allMetas = [{ label: "Meta 1", val: d.metas.m1 }, { label: "Meta 2", val: d.metas.m2 }, { label: "Meta 3", val: d.metas.m3 }, ...(d.megaMeta ? [{ label: "Mega Meta 1", val: d.megaMeta }] : [])];
          const maxMeta = d.megaMeta ?? d.metas.m3;
          const tierCfg = TIER_CFG[d.tier] ?? TIER_CFG["Tier 4/5"];
          const numCor = numColor(d.conclusao.tipo);
          const borderCor = d.conclusao.tipo === "mega" ? (d.tier === "Tier 1" ? "#14532d" : "#713f12") : d.conclusao.tipo === "meta2" ? "#713f12" : "#1e1b2e";
          return (
            <div key={d.mes} className="rounded-2xl p-4 space-y-3 flex flex-col" style={{ backgroundColor: CARD_BG, border: `1px solid ${borderCor}` }}>
              <div className="flex items-start justify-between gap-1 flex-wrap">
                <div><p className="font-bold text-white">{d.mes}</p><p className="text-xs" style={{ color: "#475569" }}>{d.ano}</p></div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "#1e1b2e", color: "#64748b" }}>Finalizado</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: tierCfg.bg, color: tierCfg.text }}>{d.tier}</span>
                </div>
              </div>
              <div className="text-center py-1">
                <p className="text-5xl font-extrabold leading-none" style={{ color: numCor }}>{d.clientes}</p>
                <p className="text-xs mt-1" style={{ color: "#64748b" }}>clientes entregues</p>
              </div>
              <div className="space-y-1">
                <div className="w-full rounded-full overflow-hidden" style={{ height: 6, backgroundColor: "#1e1b2e" }}>
                  <div className="h-full rounded-full" style={{ width: `${pct(d.clientes, maxMeta)}%`, backgroundColor: numCor }} />
                </div>
                <div className="flex justify-between text-xs" style={{ color: "#475569" }}><span>0</span><span>{d.megaMeta ? "Mega Meta 1" : "Meta 3"}: {maxMeta}</span></div>
              </div>
              <div className="space-y-1.5 flex-1">
                {allMetas.map(({ label, val }) => {
                  const batida = d.clientes >= val;
                  return (
                    <div key={label} className="flex items-center justify-between text-xs" style={{ color: "#94a3b8" }}>
                      <span className="flex items-center gap-1">{batida ? <CheckCircle2 size={11} style={{ color: "#4ade80" }} /> : <XCircle size={11} style={{ color: "#f87171" }} />}{label}: {val}</span>
                      <span style={{ color: batida ? "#4ade80" : "#f87171" }}>{d.clientes}/{val}</span>
                    </div>
                  );
                })}
              </div>
              <div className="rounded-lg px-3 py-2 text-center" style={{ backgroundColor: `${d.conclusao.cor}18`, border: `1px solid ${d.conclusao.cor}40` }}>
                <p className="text-xs font-semibold" style={{ color: d.conclusao.cor }}>{d.conclusao.tipo === "fail" ? "✕ " : d.conclusao.tipo === "mega" ? "★ " : "✓ "}{d.conclusao.texto}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="rounded-xl px-5 py-3 flex items-center gap-3" style={{ backgroundColor: "#052e16", border: "1px solid #166534" }}>
        <Award size={16} style={{ color: "#4ade80" }} />
        <p className="text-sm font-semibold" style={{ color: "#4ade80" }}>De {primeiro.tier} ({primeiro.clientes} clientes)<span style={{ color: "#86efac" }}> → </span>{ultimo.tier} ({ultimo.clientes} clientes)<span style={{ color: "#86efac" }}> · +{crescPct}% em {historico.length} meses</span></p>
      </div>
    </div>
  );
}

function MiniMetricCard({ label, valor, prev, inverso }) {
  const curNum = typeof valor === "string" ? parseFloat(valor) : valor;
  const prevNum = prev !== null ? (typeof prev === "string" ? parseFloat(String(prev)) : prev) : null;
  const delta = prevNum !== null ? calcChange(curNum, prevNum, inverso) : null;
  return (
    <div className="rounded-xl p-3 space-y-1" style={{ backgroundColor: "#0f0f18", border: `1px solid ${BORDER}` }}>
      <p className="text-xs" style={{ color: "#64748b" }}>{label}</p>
      <p className="text-2xl font-bold text-white">{valor}</p>
      {delta && <div className="flex items-center gap-1"><span className="text-xs font-semibold" style={{ color: delta.cor }}>{delta.arrow} +{delta.val}%</span></div>}
      {prevNum !== null && <p className="text-xs" style={{ color: "#475569" }}>antes: {prev}</p>}
    </div>
  );
}

function EvolucaoMensal({ abrilAtual }) {
  const todosOsMeses = [...historico, { mes: "Abril", ano: "2026", tier: "Tier 1", m: { leads: abrilAtual.leads, opps: abrilAtual.opps, ltr: abrilAtual.ltr, noshow: abrilAtual.noshow, oportunidades: abrilAtual.oportunidades, conversao: abrilAtual.conversao, whatsapp: abrilAtual.whatsapp, video: abrilAtual.video } }];
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2"><TrendingUp size={16} style={{ color: ACCENT }} /><p className="text-base font-bold text-white">Evolução Mensal</p></div>
      {todosOsMeses.map((d, idx) => {
        const prev = idx > 0 ? todosOsMeses[idx - 1].m : null;
        const isBase = idx === 0;
        const metricas = [
          { label: "OPPs", valor: d.m.opps, prev: prev?.opps ?? null },
          { label: "Oportunidades", valor: d.m.oportunidades, prev: prev?.oportunidades ?? null },
          { label: "Novos Leads", valor: d.m.leads, prev: prev?.leads ?? null },
          { label: "LTR", valor: `${d.m.ltr}%`, prev: prev ? `${prev.ltr}%` : null },
          { label: "No-show", valor: `${d.m.noshow}%`, prev: prev ? `${prev.noshow}%` : null, inverso: true },
          { label: "Clientes", valor: "clientes" in d ? d.clientes : abrilAtual.clientes, prev: prev ? ("clientes" in todosOsMeses[idx - 1] ? todosOsMeses[idx - 1].clientes : null) : null },
          { label: "Taxa de Conversão", valor: `${d.m.conversao}%`, prev: prev ? `${prev.conversao}%` : null },
          { label: "WhatsApp", valor: d.m.whatsapp, prev: prev?.whatsapp ?? null },
          { label: "Vídeo Chamada", valor: d.m.video, prev: prev?.video ?? null },
        ];
        return (
          <div key={d.mes} className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar size={15} style={{ color: ACCENT }} />
              <p className="font-semibold text-white">{d.mes}</p>
              {isBase && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#1e1b2e", color: "#64748b" }}>Base inicial</span>}
              {"conclusao" in d && <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${d.conclusao.cor}18`, color: d.conclusao.cor }}>{d.conclusao.texto}</span>}
              {!("conclusao" in d) && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#2e1065", color: ACCENT }}>Em andamento</span>}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {metricas.map(m => <MiniMetricCard key={m.label} {...m} prev={isBase ? null : m.prev} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TabResultados({ abrilAtual, diarioAtual }) {
  const [registros, setRegistros] = useState([]);
  const totalManual = registros.reduce((s, r) => s + r.quantidade, 0);
  const clientesStatus = abrilAtual.clientes + totalManual;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_310px] gap-4 items-start">
        <StatusMeta clientesTotal={clientesStatus} dadosAbril={abrilAtual} />
        <RegistroManual registros={registros} onAdd={r => setRegistros(prev => [...prev, { ...r, id: _nextId++ }])} onRemove={id => setRegistros(prev => prev.filter(r => r.id !== id))} dataDefault="10/04/2026" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard title="Novos Leads — Abril" value={abrilAtual.leads} sub={`→ Até ${abrilAtual.atualizadoAte}`} icon={Users} />
        <MetricCard title="OPPs — Abril" value={abrilAtual.opps} sub={`→ Até ${abrilAtual.atualizadoAte}`} icon={Target} iconColor="#818cf8" />
        <MetricCard title="LTR — Abril" value={`${abrilAtual.ltr}%`} sub="→ Taxa lead-to-reply" icon={TrendingUp} iconColor="#4ade80" trend="up" />
        <MetricCard title="No-show — Abril" value={`${abrilAtual.noshow}%`} sub="↓ Taxa de no-show" icon={PhoneOff} iconColor="#f87171" trend="down" />
        <MetricCard title="Clientes (pagaram)" value={abrilAtual.clientes} sub={`→ Até ${abrilAtual.atualizadoAte}`} icon={CheckCircle2} iconColor={ACCENT} />
        <MetricCard title="Oportunidades — Abril" value={abrilAtual.oportunidades} sub={`→ Até ${abrilAtual.atualizadoAte}`} icon={Calendar} iconColor="#818cf8" />
        <MetricCard title="Vídeo Chamada — Abril" value={abrilAtual.video} sub={`→ Até ${abrilAtual.atualizadoAte}`} icon={Video} iconColor="#c084fc" />
        <MetricCard title="WhatsApp Opps" value={abrilAtual.whatsapp} sub={`→ Até ${abrilAtual.atualizadoAte}`} icon={MessageSquare} iconColor="#34d399" />
        <MetricCard title="Taxa de Conversão" value={`${abrilAtual.conversao}%`} sub="→ Fechamentos sobre OPPs" icon={Award} iconColor="#f59e0b" />
      </div>
      <EvolucaoChart diario={diarioAtual} metaM3={abrilAtual.metas.m3} diasTotal={abrilAtual.diasTotal} />
      <EvolucaoPerformance />
      <EvolucaoMensal abrilAtual={abrilAtual} />
    </div>
  );
}

const STATUS_CFG = {
  concluido:    { label: "concluído",    bg: "#1a2e1a", text: "#4ade80" },
  andamento:    { label: "em andamento", bg: "#2e1065", text: ACCENT },
  nao_iniciado: { label: "não iniciado", bg: "#1e1b2e", text: "#64748b" },
};

const livros = [
  { titulo: "Liderança: A Inteligência Emocional na Formação do Líder de Sucesso", autor: "Daniel Goleman", progresso: 100, status: "concluido" },
  { titulo: "Os 5 Desafios das Equipes", autor: "Patrick Lencioni", progresso: 100, status: "concluido" },
  { titulo: "Prospecção Fanática", autor: "Jeb Blount", progresso: 100, status: "concluido" },
  { titulo: "Objeções", autor: "Jeb Blount", progresso: 100, status: "concluido" },
];
const cursos = [{ titulo: "Gestão de Processos e Produtividade", plataforma: "Sólides", progresso: 100, status: "concluido" }];

function ItemLideranca({ titulo, subtitulo, progresso, status }) {
  const cfg = STATUS_CFG[status];
  return (
    <div className="space-y-3 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0"><p className="font-semibold text-white text-sm leading-snug">{titulo}</p><p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{subtitulo}</p></div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.bg, color: cfg.text }}>{cfg.label}</span>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-xs" style={{ color: "#64748b" }}><span>Progresso</span><span style={{ color: progresso === 100 ? ACCENT : "#94a3b8" }}>{progresso}%</span></div>
        <Bar value={progresso} max={100} />
      </div>
    </div>
  );
}

function TabLideranca() {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-6 space-y-4" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#2e1065" }}><GraduationCap size={20} style={{ color: ACCENT }} /></div>
          <div><p className="text-base font-bold text-white">Crescimento para Liderança</p><p className="text-sm mt-1" style={{ color: "#64748b" }}>Acompanhamento de livros, cursos e anotações na jornada de crescimento para liderança.</p></div>
        </div>
        <div style={{ borderTop: `1px solid ${BORDER}` }} className="pt-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#2e1065" }}><Users size={18} style={{ color: ACCENT }} /></div>
          <div><p className="text-sm font-semibold text-white">Madrinha de Onboarding</p><p className="text-sm mt-1" style={{ color: "#64748b" }}>Atuei como madrinha de onboarding, acompanhando e integrando novos membros do time.</p></div>
        </div>
      </div>
      <div className="rounded-2xl p-6" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}>
        <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><BookOpen size={16} style={{ color: ACCENT }} /><p className="font-semibold text-white">Livros</p></div><span className="text-xs" style={{ color: "#475569" }}>{livros.length} livro(s)</span></div>
        {livros.map((l, i) => <ItemLideranca key={i} titulo={l.titulo} subtitulo={l.autor} progresso={l.progresso} status={l.status} />)}
      </div>
      <div className="rounded-2xl p-6" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}>
        <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><GraduationCap size={16} style={{ color: ACCENT }} /><p className="font-semibold text-white">Cursos</p></div><span className="text-xs" style={{ color: "#475569" }}>{cursos.length} curso(s)</span></div>
        {cursos.map((c, i) => <ItemLideranca key={i} titulo={c.titulo} subtitulo={c.plataforma} progresso={c.progresso} status={c.status} />)}
      </div>
    </div>
  );
}

function CampoEditavel({ valor, onSalvar, placeholder, multiline = false }) {
  const [editando, setEditando] = useState(false);
  const [draft, setDraft] = useState(valor);
  const salvar = () => { onSalvar(draft); setEditando(false); };
  const cancelar = () => { setDraft(valor); setEditando(false); };
  if (editando) {
    return (
      <div className="space-y-2">
        {multiline ? <textarea value={draft} onChange={e => setDraft(e.target.value)} rows={4} className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none resize-none" style={{ backgroundColor: "#0f0f18", border: `1px solid ${ACCENT}` }} autoFocus /> : <input value={draft} onChange={e => setDraft(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none" style={{ backgroundColor: "#0f0f18", border: `1px solid ${ACCENT}` }} autoFocus />}
        <div className="flex gap-2">
          <button onClick={salvar} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: "#14532d", color: "#4ade80", border: "1px solid #166534" }}><Save size={11} /> Salvar</button>
          <button onClick={cancelar} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: "#1e1b2e", color: "#94a3b8", border: `1px solid ${BORDER}` }}><X size={11} /> Cancelar</button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2 group cursor-pointer" onClick={() => { setDraft(valor); setEditando(true); }}>
      <p className="text-sm flex-1" style={{ color: valor ? "#94a3b8" : "#475569" }}>{valor || placeholder}</p>
      <Edit3 size={13} style={{ color: "#475569", flexShrink: 0, marginTop: 2 }} className="opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

const NIVEIS_SDR = [{ id: "jr1", label: "JR I", grupo: "JR" }, { id: "jr2", label: "JR II", grupo: "JR" }, { id: "jr3", label: "JR III", grupo: "JR" }, { id: "pl1", label: "PL I", grupo: "Pleno" }, { id: "pl2", label: "PL II", grupo: "Pleno" }, { id: "pl3", label: "PL III", grupo: "Pleno" }, { id: "sr1", label: "SR I", grupo: "Sênior" }, { id: "sr2", label: "SR II", grupo: "Sênior" }, { id: "sr3", label: "SR III", grupo: "Sênior" }];

function NivelAtual() {
  const nivel = NIVEIS_SDR[0];
  const etapas = [{ label: "JR I", ativo: true, concluido: false }, { label: "JR II", ativo: false, concluido: false }, { label: "Pleno", ativo: false, concluido: false }, { label: "Sênior", ativo: false, concluido: false }];
  return (
    <div className="rounded-2xl p-6 space-y-5" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}>
      <div className="flex items-center gap-2"><Rocket size={15} style={{ color: ACCENT }} /><p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#64748b" }}>Nível Atual</p></div>
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 font-extrabold text-lg" style={{ backgroundColor: "#1a2e1a", color: "#4ade80", border: "2px solid #4ade80" }}>{nivel.label}</div>
        <div><p className="text-xl font-bold text-white">SDR {nivel.grupo} {nivel.label.split(" ")[1]}</p><p className="text-sm mt-0.5" style={{ color: "#64748b" }}>Início: Dezembro 2024</p><span className="inline-block mt-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: "#1a2e1a", color: "#4ade80", border: "1px solid #166534" }}>Ativo</span></div>
      </div>
      <div className="flex items-center gap-0">
        {etapas.map((e, i) => (
          <div key={e.label} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: e.ativo ? "#4ade80" : "#1e1b2e", color: e.ativo ? "#0a0a10" : "#475569", border: e.ativo ? "none" : `1px solid ${BORDER}` }}>{e.concluido ? "✓" : i + 1}</div>
              <span className="text-xs font-medium whitespace-nowrap" style={{ color: e.ativo ? "#4ade80" : "#475569" }}>{e.label}</span>
            </div>
            {i < etapas.length - 1 && <div className="flex-1 h-0.5 mx-1 mb-5" style={{ backgroundColor: "#1e1b2e" }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function ProcessoAtendimento() {
  const [fluxo, setFluxo] = useState("");
  const [mudancas, setMudancas] = useState("");
  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}>
      <div className="px-6 py-4 flex items-center gap-2" style={{ borderBottom: `1px solid ${BORDER}` }}><Headphones size={16} style={{ color: ACCENT }} /><p className="font-bold text-white">Processo de Atendimento</p></div>
      <div className="px-6 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#64748b" }}>Canais ativos</p>
        <div className="flex gap-2 flex-wrap">{["Vídeo chamada", "WhatsApp"].map(c => <span key={c} className="text-xs font-medium px-3 py-1 rounded-full" style={{ backgroundColor: "#2e1065", color: ACCENT, border: `1px solid ${ACCENT_DIM}` }}>{c}</span>)}</div>
      </div>
      <div className="px-6 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#64748b" }}>Fluxo atual</p>
        <CampoEditavel valor={fluxo} onSalvar={setFluxo} placeholder="Clique para descrever como está o fluxo de atendimento hoje…" multiline />
      </div>
      <div className="px-6 py-4">
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#64748b" }}>Mudanças em teste</p>
        <CampoEditavel valor={mudancas} onSalvar={setMudancas} placeholder="Clique para descrever mudanças em andamento ou testes…" multiline />
      </div>
    </div>
  );
}

let _linkId = 1;
function LinksImportantes() {
  const [links, setLinks] = useState([]);
  const [adicionando, setAdicionando] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [url, setUrl] = useState("");
  const [descricao, setDescricao] = useState("");
  const adicionar = () => {
    if (!titulo.trim() && !url.trim()) return;
    setLinks(prev => [...prev, { id: _linkId++, titulo: titulo || url, url, descricao }]);
    setTitulo(""); setUrl(""); setDescricao(""); setAdicionando(false);
  };
  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}>
      <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-2"><Link size={16} style={{ color: ACCENT }} /><p className="font-bold text-white">Links Importantes</p></div>
        <button onClick={() => setAdicionando(!adicionando)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all" style={{ backgroundColor: adicionando ? "#1e1b2e" : "#2e1065", color: adicionando ? "#94a3b8" : ACCENT, border: `1px solid ${adicionando ? BORDER : ACCENT_DIM}` }}>{adicionando ? <><X size={11} /> Cancelar</> : <><Plus size={11} /> Novo link</>}</button>
      </div>
      {adicionando && (
        <div className="px-6 py-4 space-y-3" style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: "#0f0f18" }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#64748b" }}>Adicionar novo link</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1"><p className="text-xs" style={{ color: "#64748b" }}>Nome do link</p><input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="ex: Planilha de Metas" className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none" style={{ backgroundColor: "#111118", border: `1px solid ${BORDER}` }} /></div>
            <div className="space-y-1"><p className="text-xs" style={{ color: "#64748b" }}>URL</p><input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none" style={{ backgroundColor: "#111118", border: `1px solid ${BORDER}` }} /></div>
          </div>
          <div className="space-y-1"><p className="text-xs" style={{ color: "#64748b" }}>Descrição (opcional)</p><input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="ex: Metas e KPIs do mês" className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none" style={{ backgroundColor: "#111118", border: `1px solid ${BORDER}` }} /></div>
          <button onClick={adicionar} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: "#14532d", color: "#4ade80", border: "1px solid #166534" }}><Plus size={13} /> Adicionar link</button>
        </div>
      )}
      <div className="divide-y" style={{ borderColor: BORDER }}>
        {links.length === 0 && !adicionando && <div className="px-6 py-8 text-center"><Link size={24} style={{ color: "#1e1b2e", margin: "0 auto 8px" }} /><p className="text-sm" style={{ color: "#475569" }}>Nenhum link adicionado ainda.</p><p className="text-xs mt-1" style={{ color: "#334155" }}>Clique em "Novo link" para adicionar.</p></div>}
        {links.map(l => (
          <div key={l.id} className="px-6 py-4 flex items-center justify-between gap-3 group">
            <div className="flex-1 min-w-0"><p className="font-semibold text-white text-sm">{l.titulo}</p>{l.descricao && <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{l.descricao}</p>}<p className="text-xs mt-0.5 truncate" style={{ color: "#475569" }}>{l.url}</p></div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {l.url && <a href={l.url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" style={{ backgroundColor: "#1e1b2e", color: ACCENT }}><ExternalLink size={13} /></a>}
              <button onClick={() => setLinks(prev => prev.filter(x => x.id !== l.id))} className="w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: "#3f1515", color: "#f87171" }}><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabelaProgressao() {
  const [faixaSelecionada, setFaixaSelecionada] = useState("faixa1");
  const nivelAtual = "JR 1";
  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}>
      <div className="px-6 py-4 flex items-center justify-between flex-wrap gap-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-2"><TrendingUp size={16} style={{ color: ACCENT }} /><p className="font-bold text-white">Progressão de Carreira</p></div>
        <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
          {["faixa1", "faixa2"].map(f => <button key={f} onClick={() => setFaixaSelecionada(f)} className="px-4 py-1.5 text-xs font-semibold transition-all" style={{ backgroundColor: faixaSelecionada === f ? ACCENT_DIM : "transparent", color: faixaSelecionada === f ? "#fff" : "#64748b" }}>{f === "faixa1" ? "Faixa 1 — Base" : "Faixa 2 — Estrela ★"}</button>)}
        </div>
      </div>
      <div className="px-6 py-3 flex flex-wrap gap-4 text-xs" style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: "#0f0f18" }}>
        <div className="flex items-center gap-2"><CheckCircle2 size={12} style={{ color: "#4ade80" }} /><span style={{ color: "#94a3b8" }}><span className="font-semibold text-white">Elegibilidade:</span> Ramp-up concluído + Meta 3 nos últimos 2 meses</span></div>
        <div className="flex items-center gap-2"><XCircle size={12} style={{ color: "#f87171" }} /><span style={{ color: "#94a3b8" }}><span className="font-semibold text-white">Desclassificação Faixa 2:</span> Não bater Meta 3 → volta à Faixa 1</span></div>
        {faixaSelecionada === "faixa2" && <div className="flex items-center gap-2"><Star size={12} style={{ color: "#f59e0b" }} /><span style={{ color: "#94a3b8" }}><span className="font-semibold text-white">Acesso Faixa 2:</span> Bater Meta 3 no mês vigente</span></div>}
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {progressaoCarreira.map(row => {
          const faixa = faixaSelecionada === "faixa1" ? row.faixa1 : row.faixa2;
          const isAtual = row.nivel === nivelAtual;
          const oteM3 = row.base + (row.base * faixa.m3) / 100;
          return (
            <div key={row.nivel} className="rounded-xl p-4 space-y-3 relative overflow-hidden" style={{ backgroundColor: isAtual ? "#1a0e2e" : "#0f0f18", border: `1px solid ${isAtual ? ACCENT : BORDER}` }}>
              {isAtual && <div className="absolute top-0 right-0"><span className="text-xs font-bold px-2.5 py-1 rounded-bl-xl" style={{ backgroundColor: ACCENT, color: "#fff" }}>Você</span></div>}
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-sm" style={{ backgroundColor: isAtual ? "#2e1065" : "#1e1b2e", color: isAtual ? ACCENT : "#64748b", border: `1px solid ${isAtual ? ACCENT_DIM : BORDER}` }}>{row.nivel}</div>
                <div className="text-right"><p className="text-xs" style={{ color: "#64748b" }}>Base salarial</p><p className="text-base font-bold text-white">{fmt(row.base)}</p></div>
              </div>
              <div className="space-y-1.5">
                {[{ label: "Meta 1", pct: faixa.m1 }, { label: "Meta 2", pct: faixa.m2 }, { label: "Meta 3 ★", pct: faixa.m3, destaque: true }].map(({ label, pct: p, destaque }) => {
                  const comissao = (row.base * p) / 100;
                  const ote = row.base + comissao;
                  return (
                    <div key={label} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ backgroundColor: destaque ? (isAtual ? "#2e1065" : "#1a1a2e") : "transparent", border: destaque ? `1px solid ${BORDER}` : "none" }}>
                      <div><p className="text-xs font-semibold" style={{ color: destaque ? ACCENT : "#94a3b8" }}>{label}</p><p className="text-xs" style={{ color: "#475569" }}>{p}% · +{fmt(comissao)}</p></div>
                      <div className="text-right"><p className="text-xs" style={{ color: "#64748b" }}>OTE</p><p className="text-sm font-bold" style={{ color: destaque ? "#4ade80" : "#94a3b8" }}>{fmt(ote)}</p></div>
                    </div>
                  );
                })}
              </div>
              <div className="rounded-lg px-3 py-2 flex items-center justify-between" style={{ backgroundColor: "#1a2e1a", border: "1px solid #166534" }}>
                <span className="text-xs font-semibold" style={{ color: "#4ade80" }}>OTE máximo (M3)</span>
                <span className="text-sm font-extrabold" style={{ color: "#4ade80" }}>{fmt(oteM3)}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="px-6 py-3 flex flex-wrap gap-4 text-xs" style={{ borderTop: `1px solid ${BORDER}` }}>
        {[{ label: "JR 1–3", desc: "Júnior", color: "#64748b" }, { label: "PL 1–3", desc: "Pleno", color: "#818cf8" }, { label: "SR 1–3", desc: "Sênior", color: "#4ade80" }].map(g => <span key={g.label} className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: g.color }} /><span className="font-semibold" style={{ color: g.color }}>{g.label}</span><span style={{ color: "#475569" }}>— {g.desc}</span></span>)}
      </div>
    </div>
  );
}

function TabCarreira() {
  return <div className="space-y-5"><NivelAtual /><ProcessoAtendimento /><LinksImportantes /><TabelaProgressao /></div>;
}

function CampoInput({ label, value, onChange, sufixo, placeholder }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium" style={{ color: "#94a3b8" }}>{label}</p>
      <div className="flex items-center rounded-lg overflow-hidden" style={{ backgroundColor: "#0f0f18", border: `1px solid ${BORDER}` }}>
        <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder ?? "—"} className="flex-1 px-3 py-2 text-sm text-white outline-none bg-transparent" />
        {sufixo && <span className="px-3 text-xs font-bold" style={{ color: "#475569" }}>{sufixo}</span>}
      </div>
    </div>
  );
}

function TabAtualizacao({ onDadosExtraidos }) {
  const [salvo, setSalvo] = useState(false);
  const [atualizadoAte, setAtualizadoAte] = useState("");
  const [diaAtual, setDiaAtual] = useState("");
  const [diasUteisRestantes, setDiasUteisRestantes] = useState("");
  const [clientes, setClientes] = useState("");
  const [leads, setLeads] = useState("");
  const [opps, setOpps] = useState("");
  const [ltr, setLtr] = useState("");
  const [noshow, setNoshow] = useState("");
  const [oportunidades, setOportunidades] = useState("");
  const [conversao, setConversao] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [video, setVideo] = useState("");
  const [m1, setM1] = useState("");
  const [m2, setM2] = useState("");
  const [m3, setM3] = useState("");
  const n = (v) => { const x = parseFloat(v.replace(",", ".")); return isNaN(x) ? undefined : x; };
  const handleSalvar = () => {
    const dados = {
      ...(atualizadoAte && { atualizadoAte }),
      ...(n(diaAtual) != null && { diaAtual: n(diaAtual) }),
      ...(n(diasUteisRestantes) != null && { diasUteisRestantes: n(diasUteisRestantes) }),
      ...(n(clientes) != null && { clientes: n(clientes) }),
      ...(n(leads) != null && { leads: n(leads) }),
      ...(n(opps) != null && { opps: n(opps) }),
      ...(n(ltr) != null && { ltr: n(ltr) }),
      ...(n(noshow) != null && { noshow: n(noshow) }),
      ...(n(oportunidades) != null && { oportunidades: n(oportunidades) }),
      ...(n(conversao) != null && { conversao: n(conversao) }),
      ...(n(whatsapp) != null && { whatsapp: n(whatsapp) }),
      ...(n(video) != null && { video: n(video) }),
      ...((n(m1) != null || n(m2) != null || n(m3) != null) && { metas: { m1: n(m1) ?? abril.metas.m1, m2: n(m2) ?? abril.metas.m2, m3: n(m3) ?? abril.metas.m3 } }),
    };
    onDadosExtraidos(dados);
    setSalvo(true);
    setTimeout(() => setSalvo(false), 3000);
  };
  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-6 flex items-center gap-3" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#2e1065" }}><Upload size={20} style={{ color: ACCENT }} /></div>
        <div><p className="text-base font-bold text-white">Atualização Manual de Métricas</p><p className="text-sm" style={{ color: "#64748b" }}>Preencha os campos com os dados do mês e clique em Salvar — a aba Resultados atualiza na hora.</p></div>
      </div>
      <div className="rounded-2xl p-6 space-y-4" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}>
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#64748b" }}>📅 Período</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <CampoInput label="Atualizado até" value={atualizadoAte} onChange={setAtualizadoAte} placeholder="ex: 12/04" />
          <CampoInput label="Dia atual do mês" value={diaAtual} onChange={setDiaAtual} placeholder="ex: 12" />
          <CampoInput label="Dias úteis restantes" value={diasUteisRestantes} onChange={setDiasUteisRestantes} placeholder="ex: 11" />
        </div>
      </div>
      <div className="rounded-2xl p-6 space-y-4" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}>
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#64748b" }}>📊 Métricas do Mês</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <CampoInput label="Novos Leads" value={leads} onChange={setLeads} placeholder="ex: 133" />
          <CampoInput label="OPPs do mesmo mês" value={opps} onChange={setOpps} placeholder="ex: 21" />
          <CampoInput label="LTR" value={ltr} onChange={setLtr} sufixo="%" placeholder="ex: 26" />
          <CampoInput label="No-show" value={noshow} onChange={setNoshow} sufixo="%" placeholder="ex: 26" />
          <CampoInput label="Clientes (os que pagaram)" value={clientes} onChange={setClientes} placeholder="ex: 29" />
          <CampoInput label="Oportunidades" value={oportunidades} onChange={setOportunidades} placeholder="ex: 50" />
          <CampoInput label="Taxa de conversão (fechamento)" value={conversao} onChange={setConversao} sufixo="%" placeholder="ex: 53" />
          <CampoInput label="Opps de WhatsApp" value={whatsapp} onChange={setWhatsapp} placeholder="ex: 0" />
          <CampoInput label="Opps de Vídeo chamada" value={video} onChange={setVideo} placeholder="ex: 41" />
        </div>
      </div>
      <div className="rounded-2xl p-6 space-y-4" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}>
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#64748b" }}>🎯 Metas do Mês</p>
        <div className="grid grid-cols-3 gap-4">
          <CampoInput label="Meta 1" value={m1} onChange={setM1} placeholder="ex: 60" />
          <CampoInput label="Meta 2" value={m2} onChange={setM2} placeholder="ex: 70" />
          <CampoInput label="Meta 3 ★" value={m3} onChange={setM3} placeholder="ex: 80" />
        </div>
      </div>
      <button onClick={handleSalvar} className="w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all" style={{ backgroundColor: "#14532d", color: "#4ade80", border: "1px solid #166534" }}>
        <CheckCircle2 size={16} />{salvo ? "✓ Dashboard atualizado! Vá para a aba Resultados." : "Salvar e atualizar o Dashboard"}
      </button>
    </div>
  );
}

const TABS = [
  { id: "resultados", label: "Resultados", icon: Target },
  { id: "lideranca", label: "Liderança", icon: Star },
  { id: "carreira", label: "Trilha de Carreira", icon: Rocket },
  { id: "atualizacao", label: "Atualização", icon: Upload },
];

export default function App() {
  const [aba, setAba] = useState("resultados");
  const [dados, setDados] = useState({});
  const [atualizado, setAtualizado] = useState(false);

  const abrilAtual = {
    ...abril,
    ...(dados.clientes != null && { clientes: dados.clientes }),
    ...(dados.leads != null && { leads: dados.leads }),
    ...(dados.opps != null && { opps: dados.opps }),
    ...(dados.ltr != null && { ltr: dados.ltr }),
    ...(dados.noshow != null && { noshow: dados.noshow }),
    ...(dados.oportunidades != null && { oportunidades: dados.oportunidades }),
    ...(dados.conversao != null && { conversao: dados.conversao }),
    ...(dados.whatsapp != null && { whatsapp: dados.whatsapp }),
    ...(dados.video != null && { video: dados.video }),
    ...(dados.diaAtual != null && { diaAtual: dados.diaAtual }),
    ...(dados.atualizadoAte != null && { atualizadoAte: dados.atualizadoAte }),
    ...(dados.diasUteisRestantes != null && { diasUteisRestantes: dados.diasUteisRestantes }),
    ...(dados.metas != null && { metas: dados.metas }),
  };

  const handleSalvar = (d) => {
    setDados(d);
    setAtualizado(true);
    setAba("resultados");
  };

  return (
    <div className="min-h-screen px-4 py-8" style={{ backgroundColor: "#0a0a10" }}>
      <div className="max-w-5xl mx-auto space-y-7">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#6d28d9" }}>Dashboard SDR</p>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">[Resultados] <span style={{ color: ACCENT }}>[bibi]</span></h1>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {atualizado && <span className="text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1.5" style={{ backgroundColor: "#052e16", color: "#4ade80", border: "1px solid #166534" }}><CheckCircle2 size={11} />Atualizado manualmente</span>}
            <div className="text-xs" style={{ color: "#475569" }}>Atualizado até <span style={{ color: ACCENT }}>{abrilAtual.atualizadoAte}</span></div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = aba === id;
            return <button key={id} onClick={() => setAba(id)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all" style={{ backgroundColor: active ? ACCENT_DIM : CARD_BG, color: active ? "#fff" : "#64748b", border: `1px solid ${active ? ACCENT_DIM : BORDER}` }}><Icon size={14} />{label}</button>;
          })}
        </div>
        {aba === "resultados" && <TabResultados abrilAtual={abrilAtual} diarioAtual={abrilDiario} />}
        {aba === "lideranca" && <TabLideranca />}
        {aba === "carreira" && <TabCarreira />}
        {aba === "atualizacao" && <TabAtualizacao onDadosExtraidos={handleSalvar} />}
        <p className="text-center text-xs pb-4" style={{ color: "#1e1b2e" }}>[Resultados] [bibi] · 2026</p>
      </div>
    </div>
  );
}
