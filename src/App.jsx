import { useState, useCallback, useRef, useEffect } from "react";
import {
  Users, Target, TrendingUp, PhoneOff, Calendar,
  Video, CheckCircle2, XCircle, Star, Rocket,
  BookOpen, GraduationCap,
  Plus, Minus, Trash2, Award, MessageSquare,
  Link, ExternalLink, Edit3, Save, X, Headphones,
  Eye, EyeOff, LogOut, Table, BarChart2, Bell,
  RefreshCw, Moon, Sun, Sunset, ChevronRight,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const ACCENT     = "#a855f7";
const ACCENT_DIM = "#6d28d9";
const CARD_BG    = "#111118";
const BORDER     = "#1e1b2e";

const CREDENCIAIS = { usuario: "bibi", senha: "bibi2026" };

const STORAGE_GANHOS        = "bibly_registros";
const STORAGE_PLANILHA      = "bibly_planilha";
const STORAGE_PLANILHA_RAW  = "bibly_planilha_raw";
const STORAGE_PLANILHA_SALVA= "bibly_planilha_salva";

function storageGet(key) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null; } catch { return null; }
}
function storageSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

function parsearTSV(texto) {
  if (!texto || !texto.trim()) return null;
  const linhas = texto.trim().split("\n").map(l => l.split("\t").map(c => c.trim()));
  if (linhas.length < 6) return null;
  const limparNum = (v) => {
    if (v == null || v === "" || v === "-") return 0;
    const s = String(v).replace(/[^0-9.,]/g, "").replace(",", ".");
    const n = parseFloat(s); return isNaN(n) ? 0 : n;
  };
  const limparPct = (v) => {
    if (v == null || v === "" || v === "-") return 0;
    const s = String(v).replace("%", "").replace(",", ".").trim();
    const n = parseFloat(s);
    if (isNaN(n) || n > 200) return 0; return n;
  };
  const MAPA = {
    leads:["novos leads","leads"], opps:["opps do mesmo","opps"], ltr:["ltr"],
    noshow:["no-show","noshow","no show"], clientes:["clientes"], opors:["oportunidades"],
    conversao:["taxa de convers","conversão","conversao"], whatsapp:["whatsapp"],
    video:["vídeo","video chamada","video"],
  };
  function detectar(celula) {
    const c = celula.toLowerCase();
    for (const [chave, termos] of Object.entries(MAPA))
      if (termos.some(t => c.includes(t))) return chave;
    return null;
  }
  const idx = {}; let headerIdx = null;
  linhas.forEach((row, i) => {
    const cel = (row[0] || "").toLowerCase().trim();
    if (headerIdx === null && (
      cel.includes("jan")||cel.includes("fev")||cel.includes("mar")||cel.includes("abr")||
      cel.includes("mai")||cel.includes("jun")||cel.includes("jul")||cel.includes("ago")||
      cel.includes("set")||cel.includes("out")||cel.includes("nov")||cel.includes("dez")||
      cel.match(/^\d{2}[-/]/)
    )) { headerIdx = i; return; }
    const tipo = detectar(row[0] || "");
    if (tipo && idx[tipo] == null) idx[tipo] = i;
  });
  if (headerIdx === null) headerIdx = 0;
  const header = linhas[headerIdx] || [];
  let ultimaCol = 1;
  const refLinha = linhas[idx.clientes ?? idx.leads ?? (headerIdx+1)] || [];
  for (let c = 1; c < refLinha.length; c++)
    if (refLinha[c] !== "" && refLinha[c] != null) ultimaCol = c;
  const diario = [];
  for (let c = 1; c <= ultimaCol; c++) {
    const clientesAcum = idx.clientes != null ? limparNum(linhas[idx.clientes][c]) : 0;
    const clientesPrev = idx.clientes != null && c > 1 ? limparNum(linhas[idx.clientes][c-1]) : 0;
    diario.push({ dia: header[c] || `Dia ${c}`, clientes: clientesAcum, noDia: Math.max(clientesAcum - clientesPrev, 0) });
  }
  const col = ultimaCol;
  const get = (chave) => linhas[idx[chave]]?.[col] ?? "";
  const atual = {
    atualizadoAte: header[col] || "", diaAtual: col,
    clientes: limparNum(get("clientes")), leads: limparNum(get("leads")),
    opps: limparNum(get("opps")), ltr: limparPct(get("ltr")),
    noshow: limparPct(get("noshow")), oportunidades: limparNum(get("opors")),
    conversao: limparPct(get("conversao")), whatsapp: limparNum(get("whatsapp")),
    video: limparNum(get("video")),
  };
  const metas = { m1: null, m2: null, m3: null };
  linhas.forEach(row => {
    const txt = (row[0]||"")+" "+(row[1]||"");
    const m = txt.match(/Meta\s*0?(\d)[^:]*:\s*(\d+)/i);
    if (m) { const n=parseInt(m[1]),v=parseInt(m[2]); if(n===1)metas.m1=v; if(n===2)metas.m2=v; if(n===3)metas.m3=v; }
  });
  return { diario, atual, metas };
}

function TelaLogin({ onLogin }) {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const handleLogin = () => {
    if (!usuario || !senha) { setErro("Preencha todos os campos."); return; }
    setCarregando(true); setErro("");
    setTimeout(() => {
      if (usuario === CREDENCIAIS.usuario && senha === CREDENCIAIS.senha) onLogin();
      else { setErro("Usuário ou senha incorretos."); setCarregando(false); }
    }, 900);
  };
  const inp = { width:"100%", boxSizing:"border-box", padding:"12px 14px", backgroundColor:"#0a0a14", border:"1px solid rgba(168,85,247,0.2)", borderRadius:12, color:"#fff", fontSize:14, outline:"none" };
  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden", backgroundColor:"#07070f" }}>
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 80% 60% at 50% 0%, #2e1065 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 80% 80%, #4c1d95 0%, transparent 60%)" }}/>
      <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(168,85,247,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.04) 1px, transparent 1px)", backgroundSize:"48px 48px" }}/>
      <div style={{ position:"relative", zIndex:10, width:"100%", maxWidth:420, margin:"0 16px", backgroundColor:"rgba(17,17,24,0.85)", backdropFilter:"blur(24px)", border:"1px solid rgba(168,85,247,0.2)", borderRadius:24, padding:"40px 36px 36px", boxShadow:"0 32px 64px rgba(0,0,0,0.6)" }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:56, height:56, borderRadius:16, background:"linear-gradient(135deg, #6d28d9 0%, #a855f7 100%)", marginBottom:16, boxShadow:"0 8px 24px rgba(168,85,247,0.35)" }}><Target size={26} color="#fff"/></div>
          <h1 style={{ fontSize:26, fontWeight:800, color:"#fff", letterSpacing:"-0.5px", marginBottom:4 }}>Bi<span style={{ color:ACCENT }}>bly</span></h1>
          <p style={{ fontSize:13, color:"#64748b" }}>Seu dashboard, sua inteligência</p>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div>
            <label style={{ display:"block", fontSize:11, fontWeight:600, color:"#94a3b8", marginBottom:6, letterSpacing:"0.05em", textTransform:"uppercase" }}>Usuário</label>
            <input value={usuario} onChange={e=>{setUsuario(e.target.value);setErro("");}} placeholder="seu usuário" style={inp} onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
          </div>
          <div>
            <label style={{ display:"block", fontSize:11, fontWeight:600, color:"#94a3b8", marginBottom:6, letterSpacing:"0.05em", textTransform:"uppercase" }}>Senha</label>
            <div style={{ position:"relative" }}>
              <input type={mostrarSenha?"text":"password"} value={senha} onChange={e=>{setSenha(e.target.value);setErro("");}} placeholder="sua senha" style={{...inp,paddingRight:44}} onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
              <button onClick={()=>setMostrarSenha(v=>!v)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", padding:4, color:"#475569", display:"flex", alignItems:"center" }}>{mostrarSenha?<EyeOff size={16}/>:<Eye size={16}/>}</button>
            </div>
          </div>
          {erro && <div style={{ padding:"10px 14px", borderRadius:10, backgroundColor:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.3)", fontSize:13, color:"#f87171", display:"flex", alignItems:"center", gap:8 }}><XCircle size={14}/> {erro}</div>}
          <button onClick={handleLogin} disabled={carregando} style={{ marginTop:6, width:"100%", padding:"14px", background:carregando?"#3b1a6e":"linear-gradient(135deg, #6d28d9 0%, #a855f7 100%)", border:"none", borderRadius:12, color:"#fff", fontSize:14, fontWeight:700, cursor:carregando?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            {carregando?<><span style={{ width:16, height:16, border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", borderRadius:"50%", display:"inline-block", animation:"spin 0.7s linear infinite" }}/>Entrando…</>:"Entrar no dashboard"}
          </button>
        </div>
        <p style={{ marginTop:24, textAlign:"center", fontSize:12, color:"#334155" }}>Acesso restrito · Bibly 2026</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} input::placeholder{color:#334155}`}</style>
    </div>
  );
}

const abrilDiarioFallback = [
  {dia:"01/04",clientes:2,noDia:2},{dia:"02/04",clientes:6,noDia:4},{dia:"03/04",clientes:6,noDia:0},
  {dia:"04/04",clientes:6,noDia:0},{dia:"05/04",clientes:6,noDia:0},{dia:"06/04",clientes:11,noDia:5},
  {dia:"07/04",clientes:14,noDia:3},{dia:"08/04",clientes:17,noDia:3},{dia:"09/04",clientes:21,noDia:4},
  {dia:"10/04",clientes:29,noDia:8},
];
const abrilFallback = {
  metas:{m1:60,m2:70,m3:80}, diaAtual:10, diasTotal:30, diasUteisRestantes:13,
  atualizadoAte:"10/04", clientes:29, leads:133, opps:21, ltr:26, noshow:26,
  oportunidades:50, conversao:53, whatsapp:0, video:41,
};
const TIER_CFG = {
  "Tier 4/5":{bg:"#1e1b2e",text:"#64748b"}, "Tier 3":{bg:"#451a00",text:"#f59e0b"},
  "Tier 2":{bg:"#1e1b4b",text:"#818cf8"}, "Tier 1":{bg:"#052e16",text:"#4ade80"},
};
const historico = [
  {mes:"Dezembro",ano:"2025",tier:"Tier 4/5",clientes:22,metas:{m1:32,m2:40,m3:55},megaMeta:null,m:{leads:861,opps:30,ltr:33,noshow:43,oportunidades:43,conversao:0,whatsapp:0,video:0},conclusao:{texto:"Não bateu meta — 22 clientes",cor:"#f87171",tipo:"fail"}},
  {mes:"Janeiro",ano:"2026",tier:"Tier 3",clientes:44,metas:{m1:32,m2:40,m3:50},megaMeta:null,m:{leads:1121,opps:44,ltr:40,noshow:11,oportunidades:44,conversao:72,whatsapp:16,video:40},conclusao:{texto:"Meta 2 batida — 44 clientes",cor:"#4ade80",tipo:"meta2"}},
  {mes:"Fevereiro",ano:"2026",tier:"Tier 3",clientes:58,metas:{m1:25,m2:30,m3:38},megaMeta:50,m:{leads:580,opps:56,ltr:40,noshow:15,oportunidades:77,conversao:71,whatsapp:3,video:57},conclusao:{texto:"Mega Meta 1 batida! — 58 clientes",cor:"#fbbf24",tipo:"mega"}},
  {mes:"Março",ano:"2026",tier:"Tier 1",clientes:88,metas:{m1:62,m2:68,m3:76},megaMeta:86,m:{leads:702,opps:111,ltr:52,noshow:24,oportunidades:154,conversao:63,whatsapp:29,video:104},conclusao:{texto:"Mega Meta 1 batida! — 88 clientes",cor:"#4ade80",tipo:"mega"}},
];
const progressaoCarreira = [
  {nivel:"JR 1",base:1809.51,faixa1:{m1:20,m2:25,m3:30},faixa2:{m1:30,m2:35,m3:40}},
  {nivel:"JR 2",base:1988.48,faixa1:{m1:20,m2:25,m3:30},faixa2:{m1:30,m2:35,m3:40}},
  {nivel:"JR 3",base:2185.14,faixa1:{m1:20,m2:25,m3:30},faixa2:{m1:30,m2:35,m3:40}},
  {nivel:"PL 1",base:2401.25,faixa1:{m1:25,m2:30,m3:45},faixa2:{m1:30,m2:35,m3:50}},
  {nivel:"PL 2",base:2617.36,faixa1:{m1:25,m2:30,m3:45},faixa2:{m1:30,m2:35,m3:50}},
  {nivel:"PL 3",base:2852.93,faixa1:{m1:25,m2:30,m3:45},faixa2:{m1:30,m2:35,m3:50}},
  {nivel:"SR 1",base:3109.69,faixa1:{m1:25,m2:30,m3:45},faixa2:{m1:30,m2:35,m3:50}},
  {nivel:"SR 2",base:3389.56,faixa1:{m1:25,m2:30,m3:45},faixa2:{m1:30,m2:35,m3:50}},
  {nivel:"SR 3",base:3694.62,faixa1:{m1:25,m2:30,m3:45},faixa2:{m1:30,m2:35,m3:50}},
];

function pct(v,t){return Math.min(Math.round((v/t)*100),100);}
function calcChange(cur,prev,inverso=false){
  if(prev===0&&cur===0)return null;
  if(prev===0)return{val:100,arrow:"↑",cor:inverso?"#f87171":"#4ade80"};
  const p=Math.round(((cur-prev)/Math.abs(prev))*100);
  const subiu=p>=0; const bom=inverso?!subiu:subiu;
  return{val:Math.abs(p),arrow:subiu?"↑":"↓",cor:bom?"#4ade80":"#f87171"};
}
const numColor=(tipo)=>tipo==="mega"?"#fbbf24":tipo==="meta2"?"#f59e0b":"#94a3b8";
const fmt=(v)=>v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});

function Bar({value,max,color=ACCENT}){
  return(<div style={{width:"100%",borderRadius:999,height:6,overflow:"hidden",backgroundColor:"#1e1b2e"}}><div style={{height:"100%",borderRadius:999,transition:"width 0.7s",width:`${pct(value,max)}%`,backgroundColor:color}}/></div>);
}

function MetricCard({title,value,sub,icon:Icon,iconColor=ACCENT,trend}){
  const trendColor=trend==="down"?"#f87171":"#a3e635";
  return(
    <div className="rounded-xl p-5 flex flex-col gap-3" style={{backgroundColor:CARD_BG,border:`1px solid ${BORDER}`}}>
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium" style={{color:"#94a3b8"}}>{title}</p>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{backgroundColor:"#1e1b2e"}}><Icon size={17} style={{color:iconColor}}/></div>
      </div>
      <p className="text-3xl font-bold" style={{color:ACCENT}}>{value}</p>
      <p className="text-xs" style={{color:trend?trendColor:"#64748b"}}>{sub}</p>
    </div>
  );
}

let _nextId = 1;

// ─── BUG N1 CORRIGIDO ─────────────────────────────────────────
function RegistroManual({registros,onAdd,onRemove,onSalvar,salvo}){
  const total=registros.reduce((s,r)=>s+r.quantidade,0);
  const dataHoje=new Date().toLocaleDateString("pt-BR");
  return(
    <div className="rounded-2xl p-5 space-y-4" style={{backgroundColor:CARD_BG,border:`1px solid ${BORDER}`}}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-white">Adicione um Ganho</p>
          <p className="text-xs mt-0.5" style={{color:"#64748b"}}>Ajuste o forecast manualmente em segundos.</p>
        </div>
        {total>0&&<span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{backgroundColor:"#2e1065",color:ACCENT}}>+{total} no forecast</span>}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={()=>onAdd({data:dataHoje,quantidade:1,obs:"Ajuste rapido"})} className="py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5" style={{backgroundColor:"#14532d",color:"#4ade80",border:"1px solid #166534"}}>
          <Plus size={12}/> +1 ganho agora
        </button>
        <button onClick={()=>{if(registros.length>0)onRemove(registros[registros.length-1].id);}} disabled={registros.length===0}
          className="py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
          style={{backgroundColor:"#2b1320",color:"#fda4af",border:"1px solid #4c1d2a",opacity:registros.length===0?0.4:1}}>
          <Minus size={12}/> Desfazer ultimo
        </button>
      </div>
      {registros.length>0&&(
        <div className="space-y-1.5 pt-1" style={{borderTop:`1px solid ${BORDER}`}}>
          {registros.map(r=>(
            <div key={r.id} className="flex items-center justify-between rounded-lg px-2.5 py-1.5" style={{backgroundColor:"#0f0f18",border:`1px solid ${BORDER}`}}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{backgroundColor:"#2e1065",color:ACCENT}}>+{r.quantidade}</span>
                <span className="text-xs text-white">{r.data}</span>
                {r.obs&&<span className="text-xs" style={{color:"#475569"}}>· {r.obs}</span>}
              </div>
              <button onClick={()=>onRemove(r.id)} style={{color:"#f87171"}}><Trash2 size={12}/></button>
            </div>
          ))}
        </div>
      )}
      <button onClick={onSalvar} className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
        style={{backgroundColor:salvo?"#052e16":"#14532d",color:"#4ade80",border:"1px solid #166534",cursor:"pointer"}}>
        <Save size={12}/>{salvo?"✓ Ganhos salvos!":"Salvar ganhos"}
      </button>
      {registros.length===0&&<p className="text-xs text-center" style={{color:"#475569",marginTop:-8}}>Nenhum ganho. Salve para confirmar remoção.</p>}
    </div>
  );
}

function calcFechamentosSemana(clientesTotal, metas, diasTotal, diasUteisRest){
  // Calcula dias úteis restantes na semana (seg-sex)
  const hoje = new Date();
  const diaSemana = hoje.getDay(); // 0=dom, 6=sab
  const diasRestantesSemana = diaSemana === 0 ? 0 : diaSemana === 6 ? 0 : 5 - diaSemana;
  const necessarioM3 = Math.max(Math.ceil((metas.m3 - clientesTotal) / Math.max(diasUteisRest, 1) * diasRestantesSemana), 0);
  return {diasRestantesSemana, necessarioM3};
}

function StatusMeta({clientesTotal, dadosAbril, onAddGanho, onRemoveGanho, onSalvarGanho, onSalvoGanho}){
  const metas=dadosAbril.metas, diaAtual=dadosAbril.diaAtual, diasTotal=dadosAbril.diasTotal, diasUteisRest=dadosAbril.diasUteisRestantes;
  const projecaoFinal=Math.round((clientesTotal/diaAtual)*diasTotal);
  const esperadoHoje=Math.round((metas.m3/diasTotal)*diaAtual);
  const emRitmo=clientesTotal>=esperadoHoje;
  const pctRitmo=esperadoHoje>0?(clientesTotal/esperadoHoje)*100:0;
  const forecastNivel=pctRitmo>=100?3:pctRitmo>=80?2:1;
  const nec=(meta)=>Math.max(Math.ceil(((meta-clientesTotal)/diasUteisRest)*10)/10,0);
  const {diasRestantesSemana, necessarioM3} = calcFechamentosSemana(clientesTotal, metas, diasTotal, diasUteisRest);
  return(
    <div className="rounded-2xl p-6 space-y-5" style={{backgroundColor:CARD_BG,border:`1px solid ${BORDER}`}}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2"><Target size={15} style={{color:ACCENT}}/><p className="text-xs font-bold uppercase tracking-widest" style={{color:"#64748b"}}>Meta do Mês — Abril · Status</p></div>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{color:"#64748b"}}>Dia <span className="font-bold text-white">{diaAtual}</span> de {diasTotal}</span>
          <span className="text-xs font-bold px-3 py-1 rounded-full" style={{backgroundColor:emRitmo?"#2e1065":"#3f1515",color:emRitmo?ACCENT:"#f87171",border:`1px solid ${emRitmo?ACCENT:"#f87171"}`}}>{emRitmo?"No Ritmo":"Atrasado"}</span>
        </div>
      </div>
      <div className="flex items-baseline gap-3">
        <span className="text-6xl font-extrabold text-white">{clientesTotal}</span>
        <span className="text-2xl font-light" style={{color:"#475569"}}>/ {metas.m3}</span>
        <span className="ml-auto text-sm" style={{color:"#64748b"}}>Forecast atual: <span className="font-bold text-white">{forecastNivel}</span></span>
      </div>
      <div className="relative" style={{paddingTop:28,paddingBottom:24}}>
        {[{label:"M1",val:metas.m1},{label:"M2",val:metas.m2}].map(({label,val})=>(
          <div key={label} className="absolute flex flex-col items-center" style={{left:`${pct(val,metas.m3)}%`,top:0,transform:"translateX(-50%)"}}>
            <span className="text-xs" style={{color:"#64748b"}}>{label}</span>
            <div style={{width:1,height:20,backgroundColor:"#334155"}}/>
          </div>
        ))}
        <div className="absolute flex flex-col items-center" style={{left:`${pct(esperadoHoje,metas.m3)}%`,top:0,transform:"translateX(-50%)",zIndex:10}}>
          <span className="text-sm font-bold" style={{color:"#f59e0b"}}>{esperadoHoje}</span>
          <div style={{width:1,height:20,backgroundColor:"#f59e0b"}}/>
        </div>
        <div style={{width:"100%",borderRadius:999,overflow:"hidden",height:10,backgroundColor:"#1e1b2e"}}>
          <div style={{height:"100%",borderRadius:999,transition:"width 0.7s",width:`${pct(clientesTotal,metas.m3)}%`,backgroundColor:ACCENT}}/>
        </div>
        <div className="absolute" style={{left:`${pct(esperadoHoje,metas.m3)}%`,top:"100%",transform:"translateX(-50%)",marginTop:2}}>
          <span className="text-xs whitespace-nowrap font-semibold" style={{color:"#f59e0b"}}>Você está no forecast da {forecastNivel}</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[{label:"META 1",val:metas.m1,cor:"#fbbf24"},{label:"META 2",val:metas.m2,cor:"#f87171"},{label:"META 3 ★",val:metas.m3,cor:"#f87171"}].map(({label,val,cor})=>{
          const n=nec(val);
          return(<div key={label} className="rounded-xl p-4" style={{backgroundColor:"#0f0f18",border:`1px solid ${BORDER}`}}>
            <p className="text-xs font-bold tracking-wide mb-0.5" style={{color:"#94a3b8"}}>{label}</p>
            <p className="text-xs" style={{color:"#64748b"}}>{val} fechamentos</p>
            <p className="text-3xl font-extrabold mt-2" style={{color:n===0?"#4ade80":cor}}>
              {n===0?"✓":n.toFixed(1)}{n>0&&<span className="text-base font-normal ml-1" style={{color:"#64748b"}}>/dia</span>}
            </p>
          </div>);
        })}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{backgroundColor:"#0f0f18",border:`1px solid ${BORDER}`}}>
          <span className="text-xs font-bold uppercase tracking-wide" style={{color:"#64748b"}}>Projeção Final</span>
          <span className="text-3xl font-extrabold" style={{color:projecaoFinal>=metas.m3?"#4ade80":"#f87171"}}>{projecaoFinal}</span>
          <span style={{color:"#475569"}}>/ {metas.m3}</span>
        </div>
        <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{backgroundColor:"#0f0f18",border:`1px solid ${BORDER}`}}>
          <span className="text-xs font-bold uppercase tracking-wide" style={{color:"#64748b"}}>Dias Restantes</span>
          <span className="text-3xl font-extrabold text-white">{diasUteisRest}</span>
          <span style={{color:"#475569"}}>úteis</span>
        </div>
      </div>

      {/* Mensagem semanal automática */}
      {diasRestantesSemana > 0 && (
        <div className="rounded-xl px-4 py-3 flex items-center justify-between gap-3 flex-wrap"
          style={{backgroundColor:"#0f0f18", border:`1px solid ${BORDER}`}}>
          <div className="flex items-center gap-2">
            <Calendar size={13} style={{color: necessarioM3 === 0 ? "#4ade80" : ACCENT, flexShrink:0}}/>
            <p className="text-xs font-semibold" style={{color: necessarioM3 === 0 ? "#4ade80" : "#e2e8f0"}}>
              {necessarioM3 === 0
                ? "✓ Você já atingiu a Meta 3 esta semana!"
                : `Feche mais ${necessarioM3} essa semana para permanecer no forecast da 3`}
            </p>
          </div>
          <span className="text-xs" style={{color:"#475569"}}>{diasRestantesSemana} dia(s) esta semana</span>
        </div>
      )}

      {/* Botão +1 ganho dentro do quadro */}
      {onAddGanho && (
        <div className="space-y-2 pt-2" style={{borderTop:`1px solid ${BORDER}`}}>
          <div className="flex items-center justify-between gap-2">
            <button onClick={onRemoveGanho}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold flex-1 justify-center"
              style={{backgroundColor:"#2b1320",color:"#fda4af",border:"1px solid #4c1d2a",cursor:"pointer"}}>
              <Minus size={11}/> -1 ganho
            </button>
            <button onClick={onAddGanho}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold flex-1 justify-center"
              style={{backgroundColor:"#14532d",color:"#4ade80",border:"1px solid #166534",cursor:"pointer"}}>
              <Plus size={11}/> +1 ganho
            </button>
          </div>
          <button onClick={onSalvarGanho}
            className="w-full py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
            style={{backgroundColor:onSalvoGanho?"#052e16":"#1e1b2e",color:onSalvoGanho?"#4ade80":"#64748b",border:`1px solid ${onSalvoGanho?"#166534":BORDER}`,cursor:"pointer"}}>
            <Save size={10}/>{onSalvoGanho?"✓ Salvo!":"Salvar"}
          </button>
        </div>
      )}
    </div>
  );
}

function EvolucaoChart({diario,metaM3,diasTotal}){
  const data=diario.map((d,i)=>({dia:d.dia,acumulado:d.clientes,noDia:d.noDia,metaIdeal:Math.round((metaM3/diasTotal)*(i+1))}));
  return(
    <div className="rounded-2xl p-6 space-y-4" style={{backgroundColor:CARD_BG,border:`1px solid ${BORDER}`}}>
      <div className="flex items-start justify-between">
        <div><p className="text-base font-bold text-white">Evolução de Fechamentos</p><p className="text-xs" style={{color:"#64748b"}}>Acumulado diário no mês</p></div>
        <div className="flex items-center gap-4 text-xs" style={{color:"#64748b"}}>
          <span className="flex items-center gap-1.5"><span className="inline-block w-5 h-0.5 rounded" style={{backgroundColor:ACCENT}}/>Acumulado</span>
          <span className="flex items-center gap-1.5"><span className="inline-block w-5 h-0.5 rounded" style={{backgroundColor:"#818cf8"}}/>No dia</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{top:5,right:5,left:-20,bottom:0}}>
          <defs>
            <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={ACCENT} stopOpacity={0.3}/><stop offset="95%" stopColor={ACCENT} stopOpacity={0}/></linearGradient>
            <linearGradient id="gD" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#818cf8" stopOpacity={0.25}/><stop offset="95%" stopColor="#818cf8" stopOpacity={0}/></linearGradient>
          </defs>
          <CartesianGrid stroke="#1e1b2e" strokeDasharray="3 3" vertical={false}/>
          <XAxis dataKey="dia" tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}/>
          <YAxis tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}/>
          <Tooltip contentStyle={{backgroundColor:"#111118",border:`1px solid ${BORDER}`,borderRadius:8,color:"#fff"}} labelStyle={{color:"#94a3b8"}}/>
          <Area type="monotone" dataKey="acumulado" stroke={ACCENT} strokeWidth={2.5} fill="url(#gA)" dot={{r:3,fill:ACCENT}} name="Acumulado"/>
          <Area type="monotone" dataKey="noDia" stroke="#818cf8" strokeWidth={1.5} fill="url(#gD)" strokeDasharray="5 3" dot={false} name="No dia"/>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function EvolucaoPerformance(){
  const primeiro=historico[0],ultimo=historico[historico.length-1];
  const crescPct=Math.round(((ultimo.clientes-primeiro.clientes)/primeiro.clientes)*100);
  return(
    <div className="space-y-4">
      <div className="flex items-center gap-2"><TrendingUp size={16} style={{color:ACCENT}}/><p className="text-base font-bold text-white">Evolução de Performance — <span style={{color:"#64748b"}}>{primeiro.tier}</span><span className="mx-1" style={{color:"#475569"}}>→</span><span style={{color:"#4ade80"}}>{ultimo.tier}</span></p></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {historico.map((d)=>{
          const allMetas=[{label:"Meta 1",val:d.metas.m1},{label:"Meta 2",val:d.metas.m2},{label:"Meta 3",val:d.metas.m3},...(d.megaMeta?[{label:"Mega Meta 1",val:d.megaMeta}]:[])];
          const maxMeta=d.megaMeta??d.metas.m3,tierCfg=TIER_CFG[d.tier]??TIER_CFG["Tier 4/5"],numCor=numColor(d.conclusao.tipo);
          const borderCor=d.conclusao.tipo==="mega"?(d.tier==="Tier 1"?"#14532d":"#713f12"):d.conclusao.tipo==="meta2"?"#713f12":"#1e1b2e";
          return(
            <div key={d.mes} className="rounded-2xl p-4 space-y-3 flex flex-col" style={{backgroundColor:CARD_BG,border:`1px solid ${borderCor}`}}>
              <div className="flex items-start justify-between gap-1 flex-wrap">
                <div><p className="font-bold text-white">{d.mes}</p><p className="text-xs" style={{color:"#475569"}}>{d.ano}</p></div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{backgroundColor:"#1e1b2e",color:"#64748b"}}>Finalizado</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{backgroundColor:tierCfg.bg,color:tierCfg.text}}>{d.tier}</span>
                </div>
              </div>
              <div className="text-center py-1"><p className="text-5xl font-extrabold leading-none" style={{color:numCor}}>{d.clientes}</p><p className="text-xs mt-1" style={{color:"#64748b"}}>clientes entregues</p></div>
              <div className="space-y-1"><Bar value={d.clientes} max={maxMeta} color={numCor}/><div className="flex justify-between text-xs" style={{color:"#475569"}}><span>0</span><span>{d.megaMeta?"Mega Meta 1":"Meta 3"}: {maxMeta}</span></div></div>
              <div className="space-y-1.5 flex-1">
                {allMetas.map(({label,val})=>{
                  const batida=d.clientes>=val;
                  return(<div key={label} className="flex items-center justify-between text-xs" style={{color:"#94a3b8"}}>
                    <span className="flex items-center gap-1">{batida?<CheckCircle2 size={11} style={{color:"#4ade80"}}/>:<XCircle size={11} style={{color:"#f87171"}}/>}{label}: {val}</span>
                    <span style={{color:batida?"#4ade80":"#f87171"}}>{d.clientes}/{val}</span>
                  </div>);
                })}
              </div>
              <div className="rounded-lg px-3 py-2 text-center" style={{backgroundColor:`${d.conclusao.cor}18`,border:`1px solid ${d.conclusao.cor}40`}}>
                <p className="text-xs font-semibold" style={{color:d.conclusao.cor}}>{d.conclusao.tipo==="fail"?"✕ ":d.conclusao.tipo==="mega"?"★ ":"✓ "}{d.conclusao.texto}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="rounded-xl px-5 py-3 flex items-center gap-3" style={{backgroundColor:"#052e16",border:"1px solid #166534"}}>
        <Award size={16} style={{color:"#4ade80"}}/><p className="text-sm font-semibold" style={{color:"#4ade80"}}>De {primeiro.tier} ({primeiro.clientes} clientes)<span style={{color:"#86efac"}}> → </span>{ultimo.tier} ({ultimo.clientes} clientes)<span style={{color:"#86efac"}}> · +{crescPct}% em {historico.length} meses</span></p>
      </div>
    </div>
  );
}

function MiniMetricCard({label,valor,prev,inverso}){
  const curNum=typeof valor==="string"?parseFloat(valor):valor;
  const prevNum=prev!==null?(typeof prev==="string"?parseFloat(String(prev)):prev):null;
  const delta=prevNum!==null?calcChange(curNum,prevNum,inverso):null;
  return(
    <div className="rounded-xl p-3 space-y-1" style={{backgroundColor:"#0f0f18",border:`1px solid ${BORDER}`}}>
      <p className="text-xs" style={{color:"#64748b"}}>{label}</p>
      <p className="text-2xl font-bold text-white">{valor}</p>
      {delta&&<div className="flex items-center gap-1"><span className="text-xs font-semibold" style={{color:delta.cor}}>{delta.arrow} {delta.val}%</span></div>}
      {prevNum!==null&&<p className="text-xs" style={{color:"#475569"}}>antes: {prev}</p>}
    </div>
  );
}

function EvolucaoMensal({abrilAtual}){
  const todosOsMeses=[...historico,{mes:"Abril",ano:"2026",tier:"Tier 1",m:{leads:abrilAtual.leads,opps:abrilAtual.opps,ltr:abrilAtual.ltr,noshow:abrilAtual.noshow,oportunidades:abrilAtual.oportunidades,conversao:abrilAtual.conversao,whatsapp:abrilAtual.whatsapp,video:abrilAtual.video}}];
  return(
    <div className="space-y-4">
      <div className="flex items-center gap-2"><TrendingUp size={16} style={{color:ACCENT}}/><p className="text-base font-bold text-white">Evolução Mensal</p></div>
      {todosOsMeses.map((d,idx)=>{
        const prev=idx>0?todosOsMeses[idx-1].m:null,isBase=idx===0;
        const metricas=[
          {label:"OPPs",valor:d.m.opps,prev:prev?.opps??null},{label:"Oportunidades",valor:d.m.oportunidades,prev:prev?.oportunidades??null},
          {label:"Novos Leads",valor:d.m.leads,prev:prev?.leads??null},{label:"LTR",valor:`${d.m.ltr}%`,prev:prev?`${prev.ltr}%`:null},
          {label:"No-show",valor:`${d.m.noshow}%`,prev:prev?`${prev.noshow}%`:null,inverso:true},
          {label:"Clientes",valor:"clientes" in d?d.clientes:abrilAtual.clientes,prev:prev?("clientes" in todosOsMeses[idx-1]?todosOsMeses[idx-1].clientes:null):null},
          {label:"Taxa de Conversão",valor:`${d.m.conversao}%`,prev:prev?`${prev.conversao}%`:null},
          {label:"WhatsApp",valor:d.m.whatsapp,prev:prev?.whatsapp??null},{label:"Vídeo Chamada",valor:d.m.video,prev:prev?.video??null},
        ];
        return(
          <div key={d.mes} className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar size={15} style={{color:ACCENT}}/><p className="font-semibold text-white">{d.mes}</p>
              {isBase&&<span className="text-xs px-2 py-0.5 rounded-full" style={{backgroundColor:"#1e1b2e",color:"#64748b"}}>Base inicial</span>}
              {"conclusao" in d&&<span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{backgroundColor:`${d.conclusao.cor}18`,color:d.conclusao.cor}}>{d.conclusao.texto}</span>}
              {!("conclusao" in d)&&<span className="text-xs px-2 py-0.5 rounded-full" style={{backgroundColor:"#2e1065",color:ACCENT}}>Em andamento</span>}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">{metricas.map(m=><MiniMetricCard key={m.label} {...m} prev={isBase?null:m.prev}/>)}</div>
          </div>
        );
      })}
    </div>
  );
}

function TabResultados({abrilAtual,diarioAtual}){
  const [registros,setRegistros]=useState(()=>storageGet(STORAGE_GANHOS)??[]);
  const [salvo,setSalvo]=useState(false);
  const totalManual=registros.reduce((s,r)=>s+r.quantidade,0);
  const clientesStatus=abrilAtual.clientes+totalManual;
  const handleAddGanho=()=>{
    const dataHoje=new Date().toLocaleDateString("pt-BR");
    const nova=[...registros,{data:dataHoje,quantidade:1,obs:"Ajuste rapido",id:_nextId++}];
    setRegistros(nova); storageSet(STORAGE_GANHOS,nova);
  };
  const handleRemoveGanho=()=>{
    if(registros.length===0)return;
    const nova=registros.slice(0,-1);
    setRegistros(nova); storageSet(STORAGE_GANHOS,nova);
  };
  const handleSalvarGanhos=()=>{ storageSet(STORAGE_GANHOS,registros); setSalvo(true); setTimeout(()=>setSalvo(false),3000); };
  return(
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 items-start">
        <StatusMeta clientesTotal={clientesStatus} dadosAbril={abrilAtual} onAddGanho={handleAddGanho} onRemoveGanho={handleRemoveGanho} onSalvarGanho={handleSalvarGanhos} onSalvoGanho={salvo}/>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard title="Novos Leads — Abril" value={abrilAtual.leads} sub={`→ Até ${abrilAtual.atualizadoAte}`} icon={Users}/>
        <MetricCard title="OPPs — Abril" value={abrilAtual.opps} sub={`→ Até ${abrilAtual.atualizadoAte}`} icon={Target} iconColor="#818cf8"/>
        <MetricCard title="LTR — Abril" value={`${abrilAtual.ltr}%`} sub="→ Taxa lead-to-reply" icon={TrendingUp} iconColor="#4ade80" trend="up"/>
        <MetricCard title="No-show — Abril" value={`${abrilAtual.noshow}%`} sub="↓ Taxa de no-show" icon={PhoneOff} iconColor="#f87171" trend="down"/>
        <MetricCard title="Clientes (pagaram)" value={abrilAtual.clientes} sub={`→ Até ${abrilAtual.atualizadoAte}`} icon={CheckCircle2} iconColor={ACCENT}/>
        <MetricCard title="Oportunidades — Abril" value={abrilAtual.oportunidades} sub={`→ Até ${abrilAtual.atualizadoAte}`} icon={Calendar} iconColor="#818cf8"/>
        <MetricCard title="Vídeo Chamada — Abril" value={abrilAtual.video} sub={`→ Até ${abrilAtual.atualizadoAte}`} icon={Video} iconColor="#c084fc"/>
        <MetricCard title="WhatsApp Opps" value={abrilAtual.whatsapp} sub={`→ Até ${abrilAtual.atualizadoAte}`} icon={MessageSquare} iconColor="#34d399"/>
        <MetricCard title="Taxa de Conversão" value={`${abrilAtual.conversao}%`} sub="→ Fechamentos sobre OPPs" icon={Award} iconColor="#f59e0b"/>
      </div>
      <EvolucaoChart diario={diarioAtual} metaM3={abrilAtual.metas.m3} diasTotal={abrilAtual.diasTotal}/>
      <EvolucaoPerformance/>
    </div>
  );
}

function getSaudacaoHora(){
  const h=new Date().getHours();
  if(h<12)return{texto:"Bom dia",icon:Sun,cor:"#fbbf24",sub:"Bom começo de dia! Que tal atualizar suas métricas matinais?"};
  if(h<18)return{texto:"Boa tarde",icon:Sunset,cor:"#f97316",sub:"Tarde produtiva! Lembre de atualizar os números do período."};
  return{texto:"Boa noite",icon:Moon,cor:"#818cf8",sub:"Finalizando o dia? Atualize suas métricas antes de encerrar."};
}

function TabAcompanhamento({abrilAtual,dadosPlanilha,onIrParaPlanilha}){
  const s=getSaudacaoHora(),Ic=s.icon;
  const horaAtual=new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
  const dataAtual=new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"});
  return(
    <div className="space-y-6">
      <div className="rounded-2xl p-6" style={{backgroundColor:CARD_BG,border:`1px solid ${BORDER}`,background:`linear-gradient(135deg,${CARD_BG} 0%,#150d2e 100%)`}}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{backgroundColor:`${s.cor}20`,border:`1px solid ${s.cor}40`}}><Ic size={26} style={{color:s.cor}}/></div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xl font-bold text-white">{s.texto}!</p>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{backgroundColor:`${s.cor}20`,color:s.cor,border:`1px solid ${s.cor}40`}}>{horaAtual}</span>
              </div>
              <p className="text-xs mt-1 capitalize" style={{color:"#64748b"}}>{dataAtual}</p>
              <p className="text-sm mt-2" style={{color:"#94a3b8"}}>{s.sub}</p>
            </div>
          </div>
          <button onClick={onIrParaPlanilha} className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold" style={{background:"linear-gradient(135deg,#6d28d9 0%,#a855f7 100%)",color:"#fff",border:"none",cursor:"pointer",whiteSpace:"nowrap"}}>
            <RefreshCw size={15}/> Atualizar métricas <ChevronRight size={14}/>
          </button>
        </div>
        {!dadosPlanilha?(
          <div className="mt-4 rounded-xl px-4 py-3 flex items-center gap-3" style={{backgroundColor:"rgba(168,85,247,0.08)",border:"1px solid rgba(168,85,247,0.2)"}}>
            <Bell size={14} style={{color:ACCENT}}/><p className="text-xs" style={{color:"#94a3b8"}}>Nenhum dado importado ainda. Clique em <strong style={{color:ACCENT}}>"Atualizar métricas"</strong> para importar sua planilha.</p>
          </div>
        ):(
          <div className="mt-4 rounded-xl px-4 py-3 flex items-center gap-3" style={{backgroundColor:"rgba(74,222,128,0.08)",border:"1px solid rgba(74,222,128,0.2)"}}>
            <CheckCircle2 size={14} style={{color:"#4ade80"}}/><p className="text-xs" style={{color:"#4ade80"}}>Dados atualizados até <strong>{abrilAtual.atualizadoAte}</strong>. Clique em "Atualizar métricas" para importar dados mais recentes.</p>
          </div>
        )}
      </div>
      <EvolucaoMensal abrilAtual={abrilAtual}/>
    </div>
  );
}

// ─── TAB PLANILHA — BUG N2 CORRIGIDO ──────────────────────────
function TabPlanilha({onDadosImportados}){
  const [texto,setTexto]=useState(()=>storageGet(STORAGE_PLANILHA_RAW)??"");
  const [status,setStatus]=useState(null);
  const [preview,setPreview]=useState(()=>{
    const salvo=storageGet(STORAGE_PLANILHA_SALVA);
    if(salvo?.dados)return salvo.dados;
    return storageGet(STORAGE_PLANILHA)??null;
  });
  const areaRef=useRef(null);
  const processar=useCallback((txt)=>{
    const resultado=parsearTSV(txt);
    if(!resultado){setStatus("erro");return;}
    setPreview(resultado);
    storageSet(STORAGE_PLANILHA,resultado);
    storageSet(STORAGE_PLANILHA_RAW,txt);
    onDadosImportados(resultado);
    setStatus("ok"); setTimeout(()=>setStatus(null),3000);
  },[onDadosImportados]);
  const handleColar=(e)=>{ const txt=e.clipboardData?.getData("text")||e.target.value; setTexto(txt); processar(txt); };
  const handleSalvarPermanente=()=>{
    if(!preview)return;
    storageSet(STORAGE_PLANILHA_SALVA,{dados:preview,raw:texto,savedAt:new Date().toISOString()});
    setStatus("salvo"); setTimeout(()=>setStatus(null),3000);
  };
  const handleCarregarSalvo=()=>{
    const salvo=storageGet(STORAGE_PLANILHA_SALVA); if(!salvo)return;
    setPreview(salvo.dados); setTexto(salvo.raw??"");
    storageSet(STORAGE_PLANILHA,salvo.dados);
    if(salvo.raw)storageSet(STORAGE_PLANILHA_RAW,salvo.raw);
    onDadosImportados(salvo.dados); setStatus("ok"); setTimeout(()=>setStatus(null),2000);
  };
  // BUG N2: limpar NÃO apaga backup permanente
  const handleLimpar=()=>{
    setTexto(""); setPreview(null); setStatus(null);
    storageSet(STORAGE_PLANILHA,null); storageSet(STORAGE_PLANILHA_RAW,"");
    onDadosImportados(null);
  };
  const dadosSalvos=storageGet(STORAGE_PLANILHA_SALVA);
  const savedAtStr=dadosSalvos?.savedAt?new Date(dadosSalvos.savedAt).toLocaleString("pt-BR"):null;
  const borderColor=status==="ok"||status==="salvo"?"#166534":status==="erro"?"#991b1b":BORDER;
  return(
    <div className="space-y-5">
      {dadosSalvos&&(
        <div className="rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap" style={{backgroundColor:"#052e16",border:"1px solid #166534"}}>
          <div className="flex items-center gap-3"><Save size={16} style={{color:"#4ade80"}}/><div><p className="text-sm font-bold" style={{color:"#4ade80"}}>Backup salvo permanentemente</p>{savedAtStr&&<p className="text-xs" style={{color:"#86efac"}}>Salvo em: {savedAtStr}</p>}</div></div>
          <button onClick={handleCarregarSalvo} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold" style={{backgroundColor:"#14532d",color:"#4ade80",border:"1px solid #166534"}}><RefreshCw size={12}/> Carregar backup</button>
        </div>
      )}
      <div className="rounded-2xl p-6 flex items-start gap-4" style={{backgroundColor:CARD_BG,border:`1px solid ${BORDER}`}}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{backgroundColor:"#2e1065"}}><Table size={20} style={{color:ACCENT}}/></div>
        <div>
          <p className="text-base font-bold text-white">Importar Planilha do Mês</p>
          <p className="text-sm mt-1" style={{color:"#64748b"}}>Abra seu Google Sheets, selecione <strong style={{color:"#94a3b8"}}>todas as células do mês atual</strong> (Ctrl+A), copie com <strong style={{color:"#94a3b8"}}>Ctrl+C</strong> e cole abaixo com <strong style={{color:"#94a3b8"}}>Ctrl+V</strong>. O dashboard atualiza automaticamente.</p>
        </div>
      </div>
      <div className="rounded-2xl overflow-hidden" style={{backgroundColor:CARD_BG,border:`1px solid ${borderColor}`}}>
        <div className="px-5 py-3 flex items-center justify-between" style={{borderBottom:`1px solid ${BORDER}`}}>
          <p className="text-xs font-bold uppercase tracking-widest" style={{color:"#64748b"}}>Área de cola — Ctrl+V aqui</p>
          {preview&&<button onClick={handleLimpar} className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-lg" style={{backgroundColor:"#3f1515",color:"#f87171",border:"1px solid #4c1d2a"}}><X size={11}/> Limpar dados</button>}
        </div>
        <textarea ref={areaRef} value={texto} onChange={e=>setTexto(e.target.value)} onPaste={handleColar} placeholder="Cole aqui os dados copiados do Google Sheets (Ctrl+V)..." rows={8} className="w-full resize-none outline-none text-xs font-mono" style={{backgroundColor:"#0a0a10",color:"#64748b",padding:"16px",border:"none",display:"block"}}/>
        <div className="px-5 py-3 flex items-center justify-between" style={{borderTop:`1px solid ${BORDER}`}}>
          <span className="text-xs" style={{color:"#334155"}}>{texto?`${texto.split("\n").length} linhas detectadas`:"Nenhum dado colado ainda"}</span>
          {status==="ok"&&<span className="text-xs font-semibold" style={{color:"#4ade80"}}>✓ Dados importados!</span>}
          {status==="salvo"&&<span className="text-xs font-semibold" style={{color:"#4ade80"}}>✓ Backup salvo permanentemente!</span>}
          {status==="erro"&&<span className="text-xs font-semibold" style={{color:"#f87171"}}>✕ Formato inválido. Verifique os dados.</span>}
        </div>
      </div>
      {preview&&(
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-xs font-bold uppercase tracking-widest" style={{color:"#64748b"}}>Preview — Dados lidos</p>
            <button onClick={handleSalvarPermanente} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold" style={{background:"linear-gradient(135deg,#6d28d9 0%,#a855f7 100%)",color:"#fff",border:"none",cursor:"pointer"}}>
              <Save size={12}/> Salvar permanentemente
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[{label:"Clientes",val:preview.atual.clientes},{label:"Novos Leads",val:preview.atual.leads},{label:"OPPs",val:preview.atual.opps},{label:"LTR",val:`${preview.atual.ltr}%`},{label:"No-show",val:`${preview.atual.noshow}%`},{label:"Oportunidades",val:preview.atual.oportunidades},{label:"Conversão",val:`${preview.atual.conversao}%`},{label:"WhatsApp",val:preview.atual.whatsapp},{label:"Vídeo",val:preview.atual.video},{label:"Atualizado até",val:preview.atual.atualizadoAte||"—"},{label:"Meta 1",val:preview.metas.m1??"—"},{label:"Meta 2",val:preview.metas.m2??"—"},{label:"Meta 3",val:preview.metas.m3??"—"},{label:"Dias com dados",val:preview.diario.length}].map(({label,val})=>(
              <div key={label} className="rounded-xl p-3" style={{backgroundColor:"#0f0f18",border:`1px solid ${BORDER}`}}><p className="text-xs" style={{color:"#64748b"}}>{label}</p><p className="text-lg font-bold" style={{color:ACCENT}}>{val}</p></div>
            ))}
          </div>
          <div className="rounded-xl px-5 py-3 flex items-center gap-3" style={{backgroundColor:"#052e16",border:"1px solid #166534"}}>
            <CheckCircle2 size={15} style={{color:"#4ade80"}}/><p className="text-sm font-semibold" style={{color:"#4ade80"}}>Dados importados! Clique em <strong>"Salvar permanentemente"</strong> para manter o backup mesmo ao limpar os dados.</p>
          </div>
        </div>
      )}
    </div>
  );
}

const STATUS_CFG={concluido:{label:"concluído",bg:"#1a2e1a",text:"#4ade80"},andamento:{label:"em andamento",bg:"#2e1065",text:ACCENT},nao_iniciado:{label:"não iniciado",bg:"#1e1b2e",text:"#64748b"}};
const LIVROS_INICIAIS=[{titulo:"Liderança: A Inteligência Emocional na Formação do Líder de Sucesso",autor:"Daniel Goleman",progresso:100,status:"concluido"},{titulo:"Os 5 Desafios das Equipes",autor:"Patrick Lencioni",progresso:100,status:"concluido"},{titulo:"Prospecção Fanática",autor:"Jeb Blount",progresso:100,status:"concluido"},{titulo:"Objeções",autor:"Jeb Blount",progresso:100,status:"concluido"}];
const CURSOS_INICIAIS=[{titulo:"Gestão de Processos e Produtividade",plataforma:"Sólides",progresso:100,status:"concluido"}];
let _estudoId=1;

function ItemLideranca({titulo,subtitulo,progresso,status,onRemover}){
  const cfg=STATUS_CFG[status];
  return(
    <div className="space-y-3 py-4 group" style={{borderBottom:`1px solid ${BORDER}`}}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0"><p className="font-semibold text-white text-sm leading-snug">{titulo}</p><p className="text-xs mt-0.5" style={{color:"#64748b"}}>{subtitulo}</p></div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0" style={{backgroundColor:cfg.bg,color:cfg.text}}>{cfg.label}</span>
          <button onClick={onRemover} className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{backgroundColor:"#3f1515",color:"#f87171"}}><Trash2 size={12}/></button>
        </div>
      </div>
      <div className="space-y-1"><div className="flex justify-between text-xs" style={{color:"#64748b"}}><span>Progresso</span><span style={{color:progresso===100?ACCENT:"#94a3b8"}}>{progresso}%</span></div><Bar value={progresso} max={100}/></div>
    </div>
  );
}




const STORAGE_MACROS = "bibly_macros";

const MACROS_INICIAIS = [
  {
    id: "ligacao-bant", titulo: "Ligação — BANT", icone: "📞", categoria: "Script",
    conteudo: `ABERTURA
Opa, [NOME_DO_LEAD], aqui é [NOME_DO_SDR] da Cardápio Web, tudo bem? Tô entrando em contato com você porque você solicitou um atendimento pelo nosso site, tá lembrado?

CONTEXTO
Show de bola, [NOME_DO_LEAD]! Estou entrando em contato para entender melhor suas necessidades e te explicar como a Cardápio Web pode te ajudar. Também podemos alinhar a parte de valores e, se fizer sentido, agendamos uma apresentação para te mostrar tudo na prática. Tudo certo?

COMO CONHECEU
Show! Antes da gente começar, me fala, como você conheceu a Cardápio Web?

RAPPORT
Ótimo, [NOME_DO_LEAD]! Fico feliz demais que você chegou até aqui haha, a minha missão é te ajudar a entender a fundo tudo que a Cardápio Web faz.

NEED (N)
Então me fala [NOME_DO_LEAD], qual desafio que você vem enfrentando que te fez buscar a Cardápio Web?
Pergunta 1 (necessidade): Entendi perfeitamente. E como você acredita que resolver esse desafio te ajudaria no dia a dia?
Pergunta 2 (sistema/situacional): Perfeito. Atualmente você trabalha de forma manual ou já utiliza algum sistema?

— AUTOMAÇÃO —
Então [NOME_DO_LEAD]. Com relação à automação dos seus pedidos de delivery, nós temos diversas ferramentas para te auxiliar. Dentre elas:
• ChatBot com IA que vai tornar o atendimento do seu cliente mais rápido e automatizado
• Cardápio digital com pagamento online que gera uma experiência de compra mais fluída e atrativa
Isso atende o que você procura?

— GESTÃO —
Legal, [NOME_DO_LEAD]! Com relação à gestão, conseguimos te ajudar no controle de estoque, caixa, gestão de pedido na cozinha por tela (KDS), relatórios de vendas. Sua operação pode ser controlada de forma remota, com acompanhamento em tempo real.
Isso faz sentido para você?

— VENDAS —
Perfeito, [NOME_DO_LEAD]! Nossa ferramenta permite disparar mensagens em massa no WhatsApp, alcançando milhares de clientes em minutos com ofertas, cupons, pesquisas e muito mais, tudo personalizado.
Faz sentido para você?

VERIFICAR DÚVIDA
Show de bola [NOME_DO_LEAD]! Antes de falarmos sobre a parte de valores, ficou alguma dúvida até aqui?
Pergunta 3 (operação): Perfeito. Me fala como funciona sua operação, é com delivery, mesas ou ambos?

BUDGET (B)
Esses valores que eu falei estão dentro do seu orçamento?

TIMING (T)
E em relação ao início do projeto, se a ferramenta resolver sua demanda e o valor tiver dentro do que você busca, o início do projeto é imediato ou você tem uma data em específico pra começar?
De 0 a 10, qual é o seu nível de prioridade pra contratar nesse momento?

AUTHORITY (A)
Show! Você tem algum sócio ou alguém que tome essa decisão em relação à operação junto com você?

MARCANDO A REUNIÃO
Ótimo! Vocês teriam mais disponibilidade pela manhã ou pela tarde?
• Que tal às [X HORAS] no horário de Brasília?
• Existe alguma diferença no seu fuso horário?
• Maravilha, quem vai ficar à frente dessa reunião é [NOME_DO_CLOSER]!

1° GATILHO DE COMPROMISSO
Pronto [NOME_DO_LEAD]! A nossa reunião está agendada para [DIA E HORA] no horário de Brasília. O [NOME_DO_CLOSER] é um dos melhores especialistas aqui da Cardápio Web e a agenda dele é bem disputada. Posso contar com o seu compromisso nessa vídeo chamada?

2° GATILHO DE COMPROMISSO
Perfeito, [NOME_DO_LEAD]! Sei que imprevistos podem acontecer, caso aconteça algo que te impeça de participar você consegue me avisar com antecedência?

AGRADECIMENTO
[NOME_DO_LEAD], muito obrigado pela sua disponibilidade, foi um prazer falar com você! Fico na torcida aqui para que dê tudo certo. No que precisar, basta falar comigo no WhatsApp!`,
  },
  {
    id: "chat-bant", titulo: "Chat — BANT", icone: "💬", categoria: "Script",
    conteudo: `RAPPORT
Tudo bem? Aqui a gente trabalha em cima de 3 pilares principais: a Automação do Atendimento, a Gestão do Negócio e o Aumento de Vendas. Qual desses é o mais importante pra você hoje?

NEED (N)
[Mandar áudio]
Pergunta 1 (necessidade): [Mandar áudio]

DESENVOLVIMENTO DO PRODUTO
Perfeito, a gente te ajuda em três pontos:
• Primeiro automatizamos os pedidos, com cardápio digital, chatbot e pagamento online.
• Depois organizamos a operação, com controle de pedidos, estoque, caixa e relatórios em tempo real.
• E por fim aumentamos as vendas, usando campanhas no WhatsApp, cupons e fidelização.
Seria isso que você busca hoje?

Pergunta 2 (sistema/situacional): Perfeito. Atualmente você trabalha de forma manual ou já utiliza algum sistema?

VERIFICAR DÚVIDA
Show de bola! Antes de falarmos sobre a parte de valores, ficou alguma dúvida até aqui?
Pergunta 3 (operação): Me fala como funciona sua operação, é com delivery, mesas ou ambos?

FALAR DOS PLANOS
[Mandar áudio]

BUDGET (B)
Esses valores que eu falei estão dentro do seu orçamento?

TIMING (T)
E em relação ao início do projeto, o início é imediato ou você tem uma data em específico pra começar?

AUTHORITY (A)
Show! Você tem algum sócio ou alguém que tome essa decisão junto com você?

1° GATILHO DE COMPROMISSO
Tudo certo, [NOME]! Já agendei aqui. O [NOME_DO_CLOSER] está animado para te mostrar como resolver [DOR DO CLIENTE]. Posso confirmar sua presença? Assim garantimos esse espaço exclusivo para o seu negócio.

2° GATILHO DE COMPROMISSO
Combinado então. Se surgir algo que te impeça de participar, me dá um toque por aqui? Assim a gente consegue remarcar rapidinho. Pode ser?

AGRADECIMENTO
Muito obrigada pela atenção hoje! Foi um prazer conversar com você. No que precisar, estarei à disposição. Sucesso!`,
  },
  {
    id: "plano-delivery-valor", titulo: "Plano Delivery — Valores", icone: "🛵", categoria: "Planos",
    conteudo: `Plano Delivery – Cardápio Web
Ideal para quem trabalha com delivery e retirada no local.

Valores:
• Mensal: R$ 209,99
• Trimestral: R$ 199,99/mês (Total R$ 599,97)
• Semestral: R$ 189,99/mês (Total R$ 1.139,94)
• Anual: R$ 179,99/mês (Total R$ 2.159,88)

Módulos opcionais:
• iFood: R$ 29,99
• Estoque Avançado: R$ 29,99
• Cupom Fiscal: R$ 69,99
• Entregadores: R$ 54,99
• Financeiro: R$ 69,99

Me conta: qual desses formatos faz mais sentido pra sua operação hoje?`,
  },
  {
    id: "plano-mesas-valor", titulo: "Plano Mesas — Valores", icone: "🪑", categoria: "Planos",
    conteudo: `Plano Mesa – Cardápio Web
Ideal para restaurantes e cafés com atendimento no salão.

Valores:
• Mensal: R$ 169,99
• Trimestral: R$ 159,99/mês | Total R$ 479,97
• Semestral: R$ 149,99/mês | Total R$ 899,94
• Anual: R$ 139,99/mês | Total R$ 1.679,88

Módulos opcionais:
• iFood: R$ 29,99
• Estoque Avançado: R$ 29,99
• Cupom Fiscal: R$ 69,99
• Entregadores: R$ 54,99
• Financeiro: R$ 69,99

Qual desses formatos faz mais sentido pra sua operação hoje?`,
  },
  {
    id: "plano-premium-valor", titulo: "Plano Premium — Valores", icone: "👑", categoria: "Planos",
    conteudo: `Plano Premium – Cardápio Web
Tudo em um só lugar: Delivery + Mesas.

Valores:
• Mensal: R$ 269,99
• Trimestral: R$ 259,99/mês | Total R$ 779,97
• Semestral: R$ 249,99/mês | Total R$ 1.499,94
• Anual: R$ 239,99/mês | Total R$ 2.879,88

Módulos opcionais:
• iFood: R$ 29,99
• Estoque Avançado: R$ 29,99
• Cupom Fiscal: R$ 69,99
• Entregadores: R$ 54,99
• Financeiro: R$ 69,99

Qual desses formatos faz sentido pra sua operação?`,
  },
  {
    id: "oq-vem-delivery", titulo: "O que vem no Plano Delivery?", icone: "📦", categoria: "Planos",
    conteudo: `Plano Delivery – Cardápio Web
O Plano Delivery é ideal pra quem quer organizar o fluxo de pedidos e vender mais sem complicação.

O que você ganha:
• Automação completa: do pedido à entrega, tudo no mesmo sistema. Pedidos enviados direto pra cozinha com o nosso KDS integrado à impressora.
• Cardápio digital bonito, intuitivo e fácil de atualizar.
• WhatsApp integrado no PDV, agilizando o atendimento.
• Gestão de rotas e gestão de estoque simples, garantindo entregas mais rápidas e com menos falhas.
• Agendamento de pedidos e pagamentos online (crédito - Mercado Pago ou Cielo).
• Acompanhamento em tempo real de todos os pedidos.
• Integrações de marketing (Google Ads, Meta Ads, Pixel, Google Analytics), chatbot com IA (ChatGPT) e disparos automáticos no WhatsApp para aumentar a recompra.

Resumo: perfeito pra quem quer crescer no delivery com profissionalismo, automação e praticidade.`,
  },
  {
    id: "oq-vem-mesas", titulo: "O que vem no Plano Mesas?", icone: "🍽️", categoria: "Planos",
    conteudo: `Plano Mesas – Cardápio Web
Ideal para restaurantes e bares com atendimento presencial.

Você tem:
• Controle de mesas e comandas (abertura, fechamento e pedidos por mesa)
• Módulo balcão para pedidos rápidos
• Gestão de caixa
• Impressão automática na cozinha/bar
• Controle de usuários e cadastro de clientes
• Estoque simples e opção de fiado

É a solução completa para organizar o salão e agilizar o atendimento.`,
  },
  {
    id: "oq-vem-premium", titulo: "O que vem no Plano Premium?", icone: "⭐", categoria: "Planos",
    conteudo: `Plano Premium – Cardápio Web
Ideal pra quem quer ter controle total do negócio e vender em vários canais.

Na prática, você ganha:
• Atendimento mais rápido no salão, com gestão de mesas e garçons integrada.
• Delivery organizado do pedido à entrega, com envio automático dos pedidos para a cozinha via KDS integrado à impressora.
• WhatsApp integrado ao PDV, centralizando pedidos e atendimentos.
• Cardápio digital para delivery, balcão e mesas, tudo conectado.
• Menos retrabalho e mais agilidade, com todos os controles no mesmo sistema.
• Gestão de estoque clara e centralizada.
• Automação de marketing, com chatbot com IA (ChatGPT) e integração com anúncios.

Resumo: é o plano mais completo da Cardápio Web — feito pra quem busca crescimento, automação e resultados reais.`,
  },
  {
    id: "modulos", titulo: "Detalhamento dos Módulos", icone: "🧩", categoria: "Planos",
    conteudo: `Módulos Opcionais – Cardápio Web

iFood e Marketplaces (R$ 29,99)
Receba pedidos do iFood, Keeta, 99Food e AiqFome direto no sistema, tudo centralizado em um só lugar, sem precisar alternar telas.

Estoque Avançado (R$ 29,99)
Controle completo dos insumos, com registro de entradas e saídas, perdas, movimentações e alertas automáticos para evitar falta ou desperdício.

Financeiro (R$ 69,99)
Gestão financeira clara e organizada, com controle de entradas, saídas, categorias e relatórios para acompanhar o resultado do negócio.

Roteirização de Entregas / Entregadores (R$ 54,99)
Organize e acompanhe as entregas de forma simples, com controle dos entregadores e rotas otimizadas, ideal para horários de pico e alto volume de pedidos.

Cupom Fiscal / Fiscal Completo (R$ 69,99)
Emissão de notas fiscais, geração de XML, acompanhamento de status e integração com a Receita, tudo dentro do sistema.

Assim, você monta o sistema do seu jeito: começa com o plano e adiciona apenas o que realmente faz sentido para a sua operação.`,
  },
  {
    id: "confirmacao-reuniao", titulo: "Confirmação de Reunião", icone: "📅", categoria: "Outros",
    conteudo: `OK! Para facilitar, a reunião será pelo Google Meet:

• Link enviado direto no seu WhatsApp pelo meu especialista;
• 30 minutinhos de conversa focada na sua operação;
• Tolerância de 5 min (sei que correria de restaurante é real! 😄).

Se surgir algum imprevisto, me dá um toque antes? Assim consigo ajustar a agenda por aqui. Confirmado? ✅`,
  },
  {
    id: "contratacao", titulo: "Detalhamento da Contratação", icone: "✍️", categoria: "Outros",
    conteudo: `O processo de contratação é bem simples e focado em colocar sua operação para rodar o quanto antes. Funciona assim:

1️⃣ Abertura de Conta
Vou precisar de alguns dados básicos seus para gerar o seu link de pagamento e liberar seus acessos. Meu especialista entra em contato com você para finalizar essa etapa.

2️⃣ Setor de Implementação (Onboarding)
Com o acesso liberado, você é direcionado aos nossos especialistas. Eles configuram seu cardápio digital, ajustam os módulos fiscais e deixam tudo pronto para o seu delivery e salão.

3️⃣ Treinamento e Suporte
Além de treinamentos em vídeo para sua equipe, você tem nosso Suporte Prioritário de segunda a domingo. Assim, sua operação nunca para!`,
  },
];

// Ordem das seções e como renderizar cada categoria
const SECOES = [
  { categoria: "Script",  label: "Scripts",      compacto: false },
  { categoria: "Planos",  label: "Planos",        compacto: true  },
  { categoria: "Outros",  label: "Outros",        compacto: true  },
];

let _macroId = 100;

function CardMacroCompacto({ macro, onCopiar, copiado, onAbrir, aberto, onEditar, editando, draftConteudo, setDraftConteudo, onSalvar, onCancelar, onRemover, salvoId }) {
  const foiCopiado = copiado === macro.id;
  const foiSalvo = salvoId === macro.id;
  const estaAberto = aberto === macro.id;
  const estaEditando = editando === macro.id;
  return (
    <div className="rounded-xl overflow-hidden" style={{backgroundColor:"#0f0f18", border:`1px solid ${estaAberto ? ACCENT : BORDER}`, transition:"border-color 0.2s"}}>
      <div className="px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer" onClick={() => onAbrir(macro.id)}>
          <span className="text-base flex-shrink-0">{macro.icone}</span>
          <p className="text-sm font-semibold text-white truncate">{macro.titulo}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {foiSalvo && <span className="text-xs" style={{color:"#4ade80"}}>✓</span>}
          <button onClick={() => onCopiar(macro.conteudo, macro.id)}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold"
            style={{backgroundColor: foiCopiado?"#052e16":"#1e1b2e", color: foiCopiado?"#4ade80":"#64748b", border:`1px solid ${foiCopiado?"#166534":BORDER}`, cursor:"pointer"}}>
            {foiCopiado ? "✓" : "Copiar"}
          </button>
          <button onClick={() => onAbrir(macro.id)}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold"
            style={{backgroundColor: estaAberto?"#2e1065":"#1e1b2e", color: estaAberto?ACCENT:"#64748b", border:`1px solid ${estaAberto?ACCENT_DIM:BORDER}`, cursor:"pointer"}}>
            {estaAberto ? "▲" : "▼"}
          </button>
        </div>
      </div>
      {estaAberto && (
        <div className="px-4 pb-4 space-y-2" style={{borderTop:`1px solid ${BORDER}`}}>
          {estaEditando ? (
            <div className="space-y-2 pt-3">
              <textarea value={draftConteudo} onChange={e => setDraftConteudo(e.target.value)}
                rows={10} className="w-full rounded-lg outline-none resize-y text-xs font-mono"
                style={{backgroundColor:"#0a0a10",color:"#e2e8f0",padding:"12px",border:`1px solid ${ACCENT}`,lineHeight:1.7}}/>
              <div className="flex gap-2">
                <button onClick={() => onSalvar(macro.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold"
                  style={{backgroundColor:"#14532d",color:"#4ade80",border:"1px solid #166534",cursor:"pointer"}}><Save size={11}/> Salvar</button>
                <button onClick={onCancelar} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{backgroundColor:"#1e1b2e",color:"#94a3b8",border:`1px solid ${BORDER}`,cursor:"pointer"}}><X size={11}/> Cancelar</button>
                <button onClick={() => onRemover(macro.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold ml-auto"
                  style={{backgroundColor:"#3f1515",color:"#f87171",border:"1px solid #4c1d2a",cursor:"pointer"}}><Trash2 size={11}/> Excluir</button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 pt-3">
              <div className="flex justify-end">
                <button onClick={() => onEditar(macro)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold"
                  style={{backgroundColor:"#2e1065",color:ACCENT,border:`1px solid ${ACCENT_DIM}`,cursor:"pointer"}}><Edit3 size={10}/> Editar</button>
              </div>
              <div className="rounded-lg p-3 whitespace-pre-wrap text-xs leading-relaxed"
                style={{backgroundColor:"#07070f",color:"#94a3b8",border:`1px solid ${BORDER}`,maxHeight:320,overflowY:"auto",lineHeight:1.8}}>
                {macro.conteudo}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CardMacroScript({ macro, onCopiar, copiado, onAbrir, aberto, onEditar, editando, draftConteudo, setDraftConteudo, onSalvar, onCancelar, onRemover, salvoId }) {
  const foiCopiado = copiado === macro.id;
  const foiSalvo = salvoId === macro.id;
  const estaAberto = aberto === macro.id;
  const estaEditando = editando === macro.id;
  return (
    <div className="rounded-2xl overflow-hidden" style={{backgroundColor:CARD_BG, border:`1px solid ${estaAberto?ACCENT:BORDER}`, transition:"border-color 0.2s"}}>
      <div className="px-5 py-4 flex items-center justify-between gap-3 cursor-pointer"
        style={{borderBottom: estaAberto?`1px solid ${BORDER}`:"none"}}
        onClick={() => onAbrir(macro.id)}
        onMouseEnter={e=>e.currentTarget.style.backgroundColor="rgba(168,85,247,0.04)"}
        onMouseLeave={e=>e.currentTarget.style.backgroundColor="transparent"}>
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl flex-shrink-0">{macro.icone}</span>
          <div>
            <p className="font-bold text-white">{macro.titulo}</p>
            <p className="text-xs mt-0.5" style={{color:"#475569"}}>Script completo — clique para abrir</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0" onClick={e=>e.stopPropagation()}>
          {foiSalvo && <span className="text-xs font-semibold" style={{color:"#4ade80"}}>✓ Salvo</span>}
          <button onClick={() => onCopiar(macro.conteudo, macro.id)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{backgroundColor: foiCopiado?"#052e16":"#1e1b2e", color: foiCopiado?"#4ade80":"#94a3b8", border:`1px solid ${foiCopiado?"#166534":BORDER}`, cursor:"pointer"}}>
            {foiCopiado ? "✓ Copiado" : "Copiar"}
          </button>
          <button onClick={() => onAbrir(macro.id)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{backgroundColor: estaAberto?"#2e1065":"#1e1b2e", color: estaAberto?ACCENT:"#64748b", border:`1px solid ${estaAberto?ACCENT_DIM:BORDER}`, cursor:"pointer"}}>
            {estaAberto ? "Fechar" : "Abrir"}
          </button>
        </div>
      </div>
      {estaAberto && (
        <div className="px-5 pb-5 pt-4 space-y-3">
          {estaEditando ? (
            <div className="space-y-3">
              <textarea value={draftConteudo} onChange={e => setDraftConteudo(e.target.value)}
                rows={20} className="w-full rounded-xl outline-none resize-y text-sm font-mono"
                style={{backgroundColor:"#0a0a10",color:"#e2e8f0",padding:"16px",border:`1px solid ${ACCENT}`,lineHeight:1.7}}/>
              <div className="flex gap-2">
                <button onClick={() => onSalvar(macro.id)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold"
                  style={{backgroundColor:"#14532d",color:"#4ade80",border:"1px solid #166534",cursor:"pointer"}}><Save size={12}/> Salvar</button>
                <button onClick={onCancelar} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold"
                  style={{backgroundColor:"#1e1b2e",color:"#94a3b8",border:`1px solid ${BORDER}`,cursor:"pointer"}}><X size={12}/> Cancelar</button>
                <button onClick={() => onRemover(macro.id)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold ml-auto"
                  style={{backgroundColor:"#3f1515",color:"#f87171",border:"1px solid #4c1d2a",cursor:"pointer"}}><Trash2 size={12}/> Excluir</button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button onClick={() => onEditar(macro)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{backgroundColor:"#2e1065",color:ACCENT,border:`1px solid ${ACCENT_DIM}`,cursor:"pointer"}}><Edit3 size={11}/> Editar script</button>
              </div>
              <div className="rounded-xl p-4 whitespace-pre-wrap text-sm leading-relaxed"
                style={{backgroundColor:"#0a0a10",color:"#94a3b8",border:`1px solid ${BORDER}`,maxHeight:500,overflowY:"auto",lineHeight:1.8}}>
                {macro.conteudo}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TabMacros() {
  const [macros, setMacros] = useState(() => storageGet(STORAGE_MACROS) ?? MACROS_INICIAIS);
  const [aberto, setAberto] = useState(null);
  const [editando, setEditando] = useState(null);
  const [draftConteudo, setDraftConteudo] = useState("");
  const [copiado, setCopiado] = useState(null);
  const [salvoId, setSalvoId] = useState(null);
  const [adicionando, setAdicionando] = useState(false);
  const [draft, setDraft] = useState({titulo:"", icone:"📝", categoria:"Outros", conteudo:""});

  const salvarTudo = (lista) => storageSet(STORAGE_MACROS, lista);

  const onAbrir = (id) => { setAberto(a => a===id ? null : id); setEditando(null); };
  const onEditar = (macro) => { setEditando(macro.id); setDraftConteudo(macro.conteudo); };
  const onCancelar = () => setEditando(null);

  const onSalvar = (id) => {
    const novas = macros.map(m => m.id===id ? {...m, conteudo:draftConteudo} : m);
    setMacros(novas); salvarTudo(novas);
    setEditando(null); setSalvoId(id); setTimeout(()=>setSalvoId(null),2000);
  };

  const onRemover = (id) => {
    const novas = macros.filter(m => m.id!==id);
    setMacros(novas); salvarTudo(novas);
    if(aberto===id) setAberto(null);
  };

  const onCopiar = (conteudo, id) => {
    navigator.clipboard.writeText(conteudo).then(()=>{
      setCopiado(id); setTimeout(()=>setCopiado(null),2000);
    });
  };

  const adicionarMacro = () => {
    if(!draft.titulo.trim()||!draft.conteudo.trim()) return;
    const novas = [...macros, {...draft, id:`macro-${_macroId++}`}];
    setMacros(novas); salvarTudo(novas);
    setDraft({titulo:"",icone:"📝",categoria:"Outros",conteudo:""}); setAdicionando(false);
  };

  const sharedProps = { onCopiar, copiado, onAbrir, aberto, onEditar, editando, draftConteudo, setDraftConteudo, onSalvar, onCancelar, onRemover, salvoId };

  return (
    <div className="space-y-6">

      {/* Botão nova macro */}
      <div className="flex justify-end">
        <button onClick={() => setAdicionando(v=>!v)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
          style={{backgroundColor: adicionando?"#1e1b2e":"#2e1065", color: adicionando?"#94a3b8":ACCENT, border:`1px solid ${adicionando?BORDER:ACCENT_DIM}`, cursor:"pointer"}}>
          {adicionando ? <><X size={11}/> Cancelar</> : <><Plus size={11}/> Nova macro</>}
        </button>
      </div>

      {/* Form nova macro */}
      {adicionando && (
        <div className="rounded-2xl p-5 space-y-3" style={{backgroundColor:CARD_BG,border:`1px solid ${ACCENT_DIM}`}}>
          <p className="text-xs font-bold uppercase tracking-widest" style={{color:"#64748b"}}>Nova Macro</p>
          <div className="grid grid-cols-[60px_1fr_130px] gap-3">
            <div><p className="text-xs mb-1" style={{color:"#64748b"}}>Ícone</p>
              <input value={draft.icone} onChange={e=>setDraft(d=>({...d,icone:e.target.value}))} className="w-full rounded-lg px-2 py-2 text-sm text-center outline-none" style={{backgroundColor:"#0f0f18",border:`1px solid ${BORDER}`,color:"#fff"}}/></div>
            <div><p className="text-xs mb-1" style={{color:"#64748b"}}>Título</p>
              <input value={draft.titulo} onChange={e=>setDraft(d=>({...d,titulo:e.target.value}))} placeholder="Nome da macro..." className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{backgroundColor:"#0f0f18",border:`1px solid ${BORDER}`,color:"#fff"}}/></div>
            <div><p className="text-xs mb-1" style={{color:"#64748b"}}>Categoria</p>
              <select value={draft.categoria} onChange={e=>setDraft(d=>({...d,categoria:e.target.value}))} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{backgroundColor:"#0f0f18",border:`1px solid ${BORDER}`,color:"#fff"}}>
                <option value="Outros">Outros</option>
                <option value="Planos">Planos</option>
                <option value="Script">Script</option>
              </select></div>
          </div>
          <div><p className="text-xs mb-1" style={{color:"#64748b"}}>Conteúdo</p>
            <textarea value={draft.conteudo} onChange={e=>setDraft(d=>({...d,conteudo:e.target.value}))} rows={6} placeholder="Cole ou escreva o conteúdo da macro..." className="w-full rounded-xl outline-none resize-y text-sm" style={{backgroundColor:"#0a0a10",color:"#e2e8f0",padding:"12px",border:`1px solid ${BORDER}`,fontFamily:"inherit",lineHeight:1.7}}/></div>
          <button onClick={adicionarMacro} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold" style={{backgroundColor:"#14532d",color:"#4ade80",border:"1px solid #166534",cursor:"pointer"}}>
            <Plus size={12}/> Adicionar macro
          </button>
        </div>
      )}

      {/* Seções separadas */}
      {SECOES.map(secao => {
        const lista = macros.filter(m => m.categoria === secao.categoria);
        if(lista.length === 0) return null;
        return (
          <div key={secao.categoria} className="space-y-3">
            {/* Separador de seção */}
            <div className="flex items-center gap-3">
              <div style={{height:1, width:16, backgroundColor:ACCENT, borderRadius:1}}/>
              <p className="text-xs font-bold uppercase tracking-widest" style={{color:ACCENT}}>{secao.label}</p>
              <div style={{flex:1, height:1, backgroundColor:BORDER}}/>
            </div>

            {/* Cards compactos (grid) */}
            {secao.compacto ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {lista.map(macro => (
                  <CardMacroCompacto key={macro.id} macro={macro} {...sharedProps}/>
                ))}
              </div>
            ) : (
              /* Cards de script (full width) */
              <div className="space-y-3">
                {lista.map(macro => (
                  <CardMacroScript key={macro.id} macro={macro} {...sharedProps}/>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Seções de categorias customizadas (adicionadas pelo usuário) */}
      {(() => {
        const catsCustom = Array.from(new Set(macros.map(m=>m.categoria))).filter(c => !SECOES.find(s=>s.categoria===c));
        return catsCustom.map(cat => {
          const lista = macros.filter(m=>m.categoria===cat);
          return (
            <div key={cat} className="space-y-3">
              <div className="flex items-center gap-3">
                <div style={{height:1,width:16,backgroundColor:ACCENT,borderRadius:1}}/>
                <p className="text-xs font-bold uppercase tracking-widest" style={{color:ACCENT}}>{cat}</p>
                <div style={{flex:1,height:1,backgroundColor:BORDER}}/>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {lista.map(macro=><CardMacroCompacto key={macro.id} macro={macro} {...sharedProps}/>)}
              </div>
            </div>
          );
        });
      })()}
    </div>
  );
}

function TabLideranca(){
  const [livros,setLivros]=useState(()=>LIVROS_INICIAIS.map(l=>({...l,id:_estudoId++})));
  const [cursos,setCursos]=useState(()=>CURSOS_INICIAIS.map(c=>({...c,id:_estudoId++})));
  const [tipo,setTipo]=useState("livro"),[titulo,setTitulo]=useState(""),[detalhe,setDetalhe]=useState("");
  const adicionarItem=()=>{
    if(!titulo.trim())return;
    if(tipo==="livro")setLivros(prev=>[...prev,{id:_estudoId++,titulo:titulo.trim(),autor:detalhe.trim()||"Autor não informado",progresso:0,status:"andamento"}]);
    else setCursos(prev=>[...prev,{id:_estudoId++,titulo:titulo.trim(),plataforma:detalhe.trim()||"Plataforma não informada",progresso:0,status:"andamento"}]);
    setTitulo("");setDetalhe("");
  };
  return(
    <div className="space-y-5">
      <div className="rounded-2xl p-6 space-y-4" style={{backgroundColor:CARD_BG,border:`1px solid ${BORDER}`}}>
        <p className="text-xs font-bold uppercase tracking-widest" style={{color:"#64748b"}}>Adicione aqui</p>
        <div className="grid grid-cols-1 sm:grid-cols-[130px_1fr_1fr_auto] gap-3">
          <select value={tipo} onChange={e=>setTipo(e.target.value)} className="rounded-lg px-3 py-2 text-sm text-white outline-none" style={{backgroundColor:"#0f0f18",border:`1px solid ${BORDER}`}}><option value="livro">Livro</option><option value="curso">Curso</option></select>
          <input value={titulo} onChange={e=>setTitulo(e.target.value)} placeholder={tipo==="livro"?"nome do livro":"nome do curso"} className="rounded-lg px-3 py-2 text-sm text-white outline-none" style={{backgroundColor:"#0f0f18",border:`1px solid ${BORDER}`}}/>
          <input value={detalhe} onChange={e=>setDetalhe(e.target.value)} placeholder={tipo==="livro"?"autor (opcional)":"plataforma (opcional)"} className="rounded-lg px-3 py-2 text-sm text-white outline-none" style={{backgroundColor:"#0f0f18",border:`1px solid ${BORDER}`}}/>
          <button onClick={adicionarItem} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{backgroundColor:"#14532d",color:"#4ade80",border:"1px solid #166534"}}>Adicionar</button>
        </div>
      </div>
      <div className="rounded-2xl p-6" style={{backgroundColor:CARD_BG,border:`1px solid ${BORDER}`}}>
        <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><BookOpen size={16} style={{color:ACCENT}}/><p className="font-semibold text-white">Livros</p></div><span className="text-xs" style={{color:"#475569"}}>{livros.length} livro(s)</span></div>
        {livros.map(l=><ItemLideranca key={l.id} titulo={l.titulo} subtitulo={l.autor} progresso={l.progresso} status={l.status} onRemover={()=>setLivros(prev=>prev.filter(i=>i.id!==l.id))}/>)}
      </div>
      <div className="rounded-2xl p-6" style={{backgroundColor:CARD_BG,border:`1px solid ${BORDER}`}}>
        <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><GraduationCap size={16} style={{color:ACCENT}}/><p className="font-semibold text-white">Cursos</p></div><span className="text-xs" style={{color:"#475569"}}>{cursos.length} curso(s)</span></div>
        {cursos.map(c=><ItemLideranca key={c.id} titulo={c.titulo} subtitulo={c.plataforma} progresso={c.progresso} status={c.status} onRemover={()=>setCursos(prev=>prev.filter(i=>i.id!==c.id))}/>)}
      </div>
    </div>
  );
}

function CampoEditavel({valor,onSalvar,placeholder,multiline=false}){
  const [editando,setEditando]=useState(false),[draft,setDraft]=useState(valor);
  if(editando)return(<div className="space-y-2">{multiline?<textarea value={draft} onChange={e=>setDraft(e.target.value)} rows={4} className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none resize-none" style={{backgroundColor:"#0f0f18",border:`1px solid ${ACCENT}`}} autoFocus/>:<input value={draft} onChange={e=>setDraft(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none" style={{backgroundColor:"#0f0f18",border:`1px solid ${ACCENT}`}} autoFocus/>}<div className="flex gap-2"><button onClick={()=>{onSalvar(draft);setEditando(false);}} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{backgroundColor:"#14532d",color:"#4ade80",border:"1px solid #166534"}}><Save size={11}/> Salvar</button><button onClick={()=>{setDraft(valor);setEditando(false);}} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{backgroundColor:"#1e1b2e",color:"#94a3b8",border:`1px solid ${BORDER}`}}><X size={11}/> Cancelar</button></div></div>);
  return(<div className="flex items-start gap-2 group cursor-pointer" onClick={()=>{setDraft(valor);setEditando(true);}}><p className="text-sm flex-1" style={{color:valor?"#94a3b8":"#475569"}}>{valor||placeholder}</p><Edit3 size={13} style={{color:"#475569",flexShrink:0,marginTop:2}} className="opacity-0 group-hover:opacity-100 transition-opacity"/></div>);
}

function NivelAtual(){
  const etapas=[{label:"JR I",ativo:true},{label:"JR II",ativo:false},{label:"Pleno",ativo:false},{label:"Sênior",ativo:false}];
  const ROSA="#e879f9"; const ROSA_BG="#2d0a3a"; const ROSA_BORDER="#86198f";
  return(<div className="rounded-2xl p-6 space-y-5" style={{backgroundColor:CARD_BG,border:`1px solid ${BORDER}`}}><div className="flex items-center gap-2"><Rocket size={15} style={{color:ACCENT}}/><p className="text-xs font-bold uppercase tracking-widest" style={{color:"#64748b"}}>Nível Atual</p></div><div className="flex items-center gap-4"><div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 font-extrabold text-lg" style={{backgroundColor:ROSA_BG,color:ROSA,border:`2px solid ${ROSA}`}}>JR I</div><div><p className="text-xl font-bold text-white">SDR JR I</p><p className="text-sm mt-0.5" style={{color:"#64748b"}}>Início: Dezembro 2024</p><span className="inline-block mt-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{backgroundColor:ROSA_BG,color:ROSA,border:`1px solid ${ROSA_BORDER}`}}>Ativo</span></div></div><div className="flex items-center gap-0">{etapas.map((e,i)=>(<div key={e.label} className="flex items-center flex-1"><div className="flex flex-col items-center gap-1 flex-shrink-0"><div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{backgroundColor:e.ativo?ROSA:"#1e1b2e",color:e.ativo?"#0a0a10":"#475569",border:e.ativo?"none":`1px solid ${BORDER}`}}>{i+1}</div><span className="text-xs font-medium whitespace-nowrap" style={{color:e.ativo?ROSA:"#475569"}}>{e.label}</span></div>{i<etapas.length-1&&<div className="flex-1 h-0.5 mx-1 mb-5" style={{backgroundColor:"#1e1b2e"}}/>}</div>))}</div></div>);
}

function ProcessoAtendimento(){
  const [fluxo,setFluxo]=useState(""),[mudancas,setMudancas]=useState("");
  return(<div className="rounded-2xl overflow-hidden" style={{backgroundColor:CARD_BG,border:`1px solid ${BORDER}`}}><div className="px-6 py-4 flex items-center gap-2" style={{borderBottom:`1px solid ${BORDER}`}}><Headphones size={16} style={{color:ACCENT}}/><p className="font-bold text-white">Processo de Atendimento</p></div><div className="px-6 py-4" style={{borderBottom:`1px solid ${BORDER}`}}><p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{color:"#64748b"}}>Canais ativos</p><div className="flex gap-2 flex-wrap">{["Vídeo chamada","WhatsApp"].map(c=><span key={c} className="text-xs font-medium px-3 py-1 rounded-full" style={{backgroundColor:"#2e1065",color:ACCENT,border:`1px solid ${ACCENT_DIM}`}}>{c}</span>)}</div></div><div className="px-6 py-4" style={{borderBottom:`1px solid ${BORDER}`}}><p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{color:"#64748b"}}>Fluxo atual</p><CampoEditavel valor={fluxo} onSalvar={setFluxo} placeholder="Clique para descrever como está o fluxo de atendimento hoje…" multiline/></div><div className="px-6 py-4"><p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{color:"#64748b"}}>Mudanças em teste</p><CampoEditavel valor={mudancas} onSalvar={setMudancas} placeholder="Clique para descrever mudanças em andamento ou testes…" multiline/></div></div>);
}

const STORAGE_LINKS = "bibly_links";
let _linkId=1;
function LinksImportantes(){
  const [links,setLinks]=useState(()=>{ const s=storageGet(STORAGE_LINKS); return s??[]; });
  const [adicionando,setAdicionando]=useState(false),[titulo,setTitulo]=useState(""),[url,setUrl]=useState(""),[descricao,setDescricao]=useState("");
  const [salvoLinks,setSalvoLinks]=useState(false);
  const salvar=(lista)=>{ storageSet(STORAGE_LINKS,lista); setSalvoLinks(true); setTimeout(()=>setSalvoLinks(false),2000); };
  const adicionar=()=>{
    if(!titulo.trim()&&!url.trim())return;
    const nova=[...links,{id:_linkId++,titulo:titulo||url,url,descricao}];
    setLinks(nova); salvar(nova); setTitulo("");setUrl("");setDescricao("");setAdicionando(false);
  };
  const remover=(id)=>{ const nova=links.filter(x=>x.id!==id); setLinks(nova); salvar(nova); };
  return(<div className="rounded-2xl overflow-hidden" style={{backgroundColor:CARD_BG,border:`1px solid ${BORDER}`}}><div className="px-6 py-4 flex items-center justify-between" style={{borderBottom:`1px solid ${BORDER}`}}><div className="flex items-center gap-2"><Link size={16} style={{color:ACCENT}}/><p className="font-bold text-white">Links Importantes</p></div><button onClick={()=>setAdicionando(!adicionando)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{backgroundColor:adicionando?"#1e1b2e":"#2e1065",color:adicionando?"#94a3b8":ACCENT,border:`1px solid ${adicionando?BORDER:ACCENT_DIM}`}}>{adicionando?<><X size={11}/> Cancelar</>:<><Plus size={11}/> Novo link</>}</button></div>{adicionando&&(<div className="px-6 py-4 space-y-3" style={{borderBottom:`1px solid ${BORDER}`,backgroundColor:"#0f0f18"}}><div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><div className="space-y-1"><p className="text-xs" style={{color:"#64748b"}}>Nome do link</p><input value={titulo} onChange={e=>setTitulo(e.target.value)} placeholder="ex: Planilha de Metas" className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none" style={{backgroundColor:"#111118",border:`1px solid ${BORDER}`}}/></div><div className="space-y-1"><p className="text-xs" style={{color:"#64748b"}}>URL</p><input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://..." className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none" style={{backgroundColor:"#111118",border:`1px solid ${BORDER}`}}/></div></div><div className="space-y-1"><p className="text-xs" style={{color:"#64748b"}}>Descrição (opcional)</p><input value={descricao} onChange={e=>setDescricao(e.target.value)} placeholder="ex: Metas e KPIs do mês" className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none" style={{backgroundColor:"#111118",border:`1px solid ${BORDER}`}}/></div><button onClick={adicionar} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold" style={{backgroundColor:"#14532d",color:"#4ade80",border:"1px solid #166534"}}><Plus size={13}/> Adicionar link</button></div>)}<div className="divide-y" style={{borderColor:BORDER}}>{links.length===0&&!adicionando&&<div className="px-6 py-8 text-center"><Link size={24} style={{color:"#1e1b2e",margin:"0 auto 8px"}}/><p className="text-sm" style={{color:"#475569"}}>Nenhum link adicionado ainda.</p></div>}{links.map(l=>(<div key={l.id} className="px-6 py-4 flex items-center justify-between gap-3 group"><div className="flex-1 min-w-0"><p className="font-semibold text-white text-sm">{l.titulo}</p>{l.descricao&&<p className="text-xs mt-0.5" style={{color:"#64748b"}}>{l.descricao}</p>}<p className="text-xs mt-0.5 truncate" style={{color:"#475569"}}>{l.url}</p></div><div className="flex items-center gap-2 flex-shrink-0">{l.url&&<a href={l.url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg flex items-center justify-center" style={{backgroundColor:"#1e1b2e",color:ACCENT}}><ExternalLink size={13}/></a>}<button onClick={()=>remover(l.id)} className="w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{backgroundColor:"#3f1515",color:"#f87171"}}><Trash2 size={13}/></button></div></div>))}</div></div>);
}

function TabelaProgressao(){
  const [faixaSelecionada,setFaixaSelecionada]=useState("faixa1");
  const nivelAtual="JR 1";
  return(
    <div className="rounded-2xl overflow-hidden" style={{backgroundColor:CARD_BG,border:"1px solid "+BORDER}}>
      <div className="px-6 py-4 flex items-center justify-between flex-wrap gap-3" style={{borderBottom:"1px solid "+BORDER}}>
        <div className="flex items-center gap-2">
          <TrendingUp size={16} style={{color:ACCENT}}/>
          <p className="font-bold text-white">Progressão de Carreira</p>
        </div>
        <div className="flex rounded-lg overflow-hidden" style={{border:"1px solid "+BORDER}}>
          {["faixa1","faixa2"].map(f=>(
            <button key={f} onClick={()=>setFaixaSelecionada(f)} className="px-4 py-1.5 text-xs font-semibold transition-all"
              style={{backgroundColor:faixaSelecionada===f?ACCENT_DIM:"transparent",color:faixaSelecionada===f?"#fff":"#64748b"}}>
              {f==="faixa1"?"Faixa 1 — Base":"Faixa 2 — Estrela ★"}
            </button>
          ))}
        </div>
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {progressaoCarreira.map(row=>{
          const faixa=faixaSelecionada==="faixa1"?row.faixa1:row.faixa2;
          const isAtual=row.nivel===nivelAtual;
          const oteM3=row.base+(row.base*faixa.m3)/100;
          return(
            <div key={row.nivel} className="rounded-xl p-4 space-y-3 relative overflow-hidden"
              style={{backgroundColor:isAtual?"#1a0e2e":"#0f0f18",border:"1px solid "+(isAtual?ACCENT:BORDER)}}>
              {isAtual&&(
                <div className="absolute top-0 right-0">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-bl-xl" style={{backgroundColor:ACCENT,color:"#fff"}}>Você</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-sm"
                  style={{backgroundColor:isAtual?"#2e1065":"#1e1b2e",color:isAtual?ACCENT:"#64748b",border:"1px solid "+(isAtual?ACCENT_DIM:BORDER)}}>
                  {row.nivel}
                </div>
                <div className="text-right">
                  <p className="text-xs" style={{color:"#64748b"}}>Base salarial</p>
                  <p className="text-base font-bold text-white">{fmt(row.base)}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                {[{label:"Meta 1",pct:faixa.m1},{label:"Meta 2",pct:faixa.m2},{label:"Meta 3 ★",pct:faixa.m3,destaque:true}].map(({label,pct:p,destaque})=>{
                  const comissao=(row.base*p)/100;
                  const ote=row.base+comissao;
                  return(
                    <div key={label} className="flex items-center justify-between rounded-lg px-3 py-2"
                      style={{backgroundColor:destaque?(isAtual?"#2e1065":"#1a1a2e"):"transparent",border:destaque?"1px solid "+BORDER:"none"}}>
                      <div>
                        <p className="text-xs font-semibold" style={{color:destaque?ACCENT:"#94a3b8"}}>{label}</p>
                        <p className="text-xs" style={{color:"#475569"}}>{p}% · +{fmt(comissao)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs" style={{color:"#64748b"}}>OTE</p>
                        <p className="text-sm font-bold" style={{color:destaque?"#4ade80":"#94a3b8"}}>{fmt(ote)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="rounded-lg px-3 py-2 flex items-center justify-between" style={{backgroundColor:"#1a2e1a",border:"1px solid #166534"}}>
                <span className="text-xs font-semibold" style={{color:"#4ade80"}}>OTE máximo (M3)</span>
                <span className="text-sm font-extrabold" style={{color:"#4ade80"}}>{fmt(oteM3)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TabCarreira(){return <div className="space-y-5"><NivelAtual/><LinksImportantes/><TabelaProgressao/></div>;}

const TABS=[
  {id:"resultados",label:"Resultados",icon:Target},
  {id:"acompanhamento",label:"Acompanhamento",icon:BarChart2},
  {id:"planilha",label:"Planilha",icon:Table},
  {id:"macros",label:"Macros",icon:MessageSquare},
  {id:"lideranca",label:"Estudos",icon:Star},
  {id:"carreira",label:"Trilha de Carreira",icon:Rocket},
];

function getSaudacaoPorFuso(tz){
  const h=Number(new Intl.DateTimeFormat("pt-BR",{hour:"2-digit",hour12:false,timeZone:tz}).format(new Date()));
  return h<12?"Bom dia":h<18?"Boa tarde":"Boa noite";
}

// ─── DASHBOARD — Layout estilo HBO Max ────────────────────────
function Dashboard({onLogout}){
  const [aba,setAba]=useState("resultados");
  const [scrolled,setScrolled]=useState(false);
  const [dadosPlanilha,setDadosPlanilha]=useState(()=>{
    const s=storageGet(STORAGE_PLANILHA_SALVA);
    if(s?.dados)return s.dados;
    return storageGet(STORAGE_PLANILHA);
  });
  useEffect(()=>{
    const fn=()=>setScrolled(window.scrollY>10);
    window.addEventListener("scroll",fn); return()=>window.removeEventListener("scroll",fn);
  },[]);
  const tz=Intl.DateTimeFormat().resolvedOptions().timeZone||"America/Sao_Paulo";
  const saudacao=getSaudacaoPorFuso(tz);
  const abrilAtual={
    ...abrilFallback,
    ...(dadosPlanilha?.atual??{}),
    metas:{...abrilFallback.metas,...(dadosPlanilha?.metas?.m1!=null?{m1:dadosPlanilha.metas.m1}:{}),...(dadosPlanilha?.metas?.m2!=null?{m2:dadosPlanilha.metas.m2}:{}),...(dadosPlanilha?.metas?.m3!=null?{m3:dadosPlanilha.metas.m3}:{})},
  };
  const diarioAtual=dadosPlanilha?.diario?.length>0?dadosPlanilha.diario:abrilDiarioFallback;
  const handleDadosImportados=(dados)=>{
    setDadosPlanilha(dados);
    if(dados) storageSet(STORAGE_PLANILHA, dados);
  };
  return(
    <div style={{minHeight:"100vh",backgroundColor:"#07070f"}}>
      {/* NAVBAR TOPO — estilo HBO Max */}
      <header style={{position:"fixed",top:0,left:0,right:0,zIndex:100,backgroundColor:scrolled?"rgba(7,7,15,0.97)":"rgba(7,7,15,0.7)",backdropFilter:"blur(20px)",borderBottom:`1px solid ${scrolled?BORDER:"transparent"}`,transition:"all 0.3s"}}>
        <div style={{maxWidth:1200,margin:"0 auto",padding:"0 28px",height:60,display:"flex",alignItems:"center",gap:0}}>
          {/* Logo + slogan */}
          <div style={{display:"flex",flexDirection:"column",marginRight:40,flexShrink:0}}>
            <span style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.5px",lineHeight:1.1}}>Bi<span style={{color:ACCENT}}>bly</span></span>
            <span style={{fontSize:8,color:"#475569",letterSpacing:"0.1em",fontWeight:600,textTransform:"uppercase",marginTop:8}}>Seu dashboard, sua inteligência</span>
          </div>
          {/* Divisor */}
          <div style={{width:1,height:28,backgroundColor:BORDER,marginRight:32,flexShrink:0}}/>
          {/* Nav links */}
          <nav style={{display:"flex",alignItems:"center",gap:2,flex:1,overflowX:"auto"}}>
            {TABS.map(({id,label,icon:Icon})=>{
              const active=aba===id;
              return(
                <button key={id} onClick={()=>setAba(id)} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 14px",borderRadius:8,border:"none",cursor:"pointer",backgroundColor:active?"rgba(168,85,247,0.15)":"transparent",color:active?"#e2e8f0":"#64748b",fontSize:13,fontWeight:active?700:400,transition:"all 0.15s",whiteSpace:"nowrap",position:"relative"}}
                  onMouseEnter={e=>{if(!active){e.currentTarget.style.color="#94a3b8";e.currentTarget.style.backgroundColor="rgba(255,255,255,0.05)";}}}
                  onMouseLeave={e=>{if(!active){e.currentTarget.style.color="#64748b";e.currentTarget.style.backgroundColor="transparent";}}}>
                  <Icon size={13}/>{label}
                  {active&&<span style={{position:"absolute",bottom:-1,left:"50%",transform:"translateX(-50%)",width:20,height:2,backgroundColor:ACCENT,borderRadius:1}}/>}
                </button>
              );
            })}
          </nav>
          {/* Direita */}
          <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0,marginLeft:16}}>
            <span style={{fontSize:11,color:"#475569",fontWeight:500}}>{saudacao}</span>
            <button onClick={onLogout} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:7,border:`1px solid ${BORDER}`,cursor:"pointer",backgroundColor:"transparent",color:"#475569",fontSize:12,transition:"all 0.15s"}}
              onMouseEnter={e=>{e.currentTarget.style.color="#f87171";e.currentTarget.style.borderColor="#f87171";}}
              onMouseLeave={e=>{e.currentTarget.style.color="#475569";e.currentTarget.style.borderColor=BORDER;}}>
              <LogOut size={11}/> Sair
            </button>
          </div>
        </div>
      </header>

      {/* CONTEÚDO */}
      <div style={{paddingTop:60}}>
        {/* Subtítulo da página */}
        <div style={{maxWidth:1200,margin:"0 auto",padding:"28px 28px 0"}}>
          <p style={{fontSize:11,color:"#6d28d9",textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:700,marginBottom:4}}>
            {TABS.find(t=>t.id===aba)?.label} · Bibly
          </p>
          <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
            <h1 style={{fontSize:26,fontWeight:900,color:"#fff",letterSpacing:"-0.5px",margin:0}}>
              {aba==="resultados"&&"Metas e Métricas do Mês"}
              {aba==="acompanhamento"&&"Acompanhamento de Performance"}
              {aba==="planilha"&&"Importar Dados"}
              {aba==="lideranca"&&"Estudos e Desenvolvimento"}
              {aba==="macros"&&"Macros e Scripts"}
              {aba==="carreira"&&"Trilha de Carreira"}
            </h1>
            <span style={{fontSize:11,color:"#475569",letterSpacing:"0.1em",fontWeight:600,textTransform:"uppercase"}}>
              Seu dashboard, sua inteligência
            </span>
          </div>
          <div style={{height:1,backgroundColor:BORDER,marginTop:20}}/>
        </div>
        <main style={{maxWidth:1200,margin:"0 auto",padding:"24px 28px 80px"}}>
          {aba==="resultados"&&<TabResultados abrilAtual={abrilAtual} diarioAtual={diarioAtual}/>}
          {aba==="acompanhamento"&&<TabAcompanhamento abrilAtual={abrilAtual} dadosPlanilha={dadosPlanilha} onIrParaPlanilha={()=>setAba("planilha")}/>}
          {aba==="planilha"&&<TabPlanilha onDadosImportados={handleDadosImportados}/>}
          {aba==="macros"&&<TabMacros/>}
          {aba==="lideranca"&&<TabLideranca/>}
          {aba==="carreira"&&<TabCarreira/>}
          <p style={{textAlign:"center",fontSize:11,color:"#1e1b2e",marginTop:48}}>[Resultados] [bibi] · 2026</p>
        </main>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} input::placeholder,textarea::placeholder{color:#334155} *{box-sizing:border-box} ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#1e1b2e;border-radius:2px}`}</style>
    </div>
  );
}

export default function App(){
  const [logado,setLogado]=useState(false);
  return logado?<Dashboard onLogout={()=>setLogado(false)}/>:<TelaLogin onLogin={()=>setLogado(true)}/>;
}
