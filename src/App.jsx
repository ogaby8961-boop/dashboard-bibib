import { useState, useCallback, useRef, useEffect } from "react";
import {
  Users, Target, TrendingUp, PhoneOff, Calendar,
  Video, CheckCircle2, XCircle, Star, Rocket,
  BookOpen, GraduationCap,
  Plus, Minus, Trash2, Award, MessageSquare,
  Link, ExternalLink, Edit3, Save, X, Headphones,
  Eye, EyeOff, LogOut, Table, BarChart2, Bell,
  RefreshCw, Moon, Sun, Sunset, ChevronRight, ChevronDown,
  Loader2, FileText,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const ACCENT     = "#a855f7";
const ACCENT_DIM = "#6d28d9";
const CARD_BG    = "#111118";
const BORDER     = "#1e1b2e";

const CREDENCIAIS = { usuario: "bibi", senha: "bibi2026" };

// ─── SUPABASE AUTH — Google Login ─────────────────────────────
const SUPABASE_URL = "https://uqfmpzqrdkcayycpsrio.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxZm1wenFyZGtjYXl5Y3BzcmlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1NDM5NDksImV4cCI6MjA5MjExOTk0OX0.lHG8LGC3CMhsgwu5G1F4JOg5EG594q37LdKK8vPpr8M";

// Google Calendar API
const GOOGLE_CLIENT_ID = "1000174954120-bomrva8lalih81fi5tov5h4k95g5l3d1.apps.googleusercontent.com";
const GOOGLE_SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

// Inicia login com Google via Supabase OAuth (redireciona e volta)
function loginComGoogle() {
  const redirectTo = window.location.origin + window.location.pathname;
  window.location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`;
}

// Pega sessão atual do Supabase (token no hash da URL após redirect)
async function getSupabaseSession() {
  // Após redirect do Google, o token vem no hash da URL
  const hash = window.location.hash;
  if (hash && hash.includes("access_token")) {
    const params = new URLSearchParams(hash.replace("#", ""));
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    if (access_token) {
      // Busca dados do usuário com o token
      const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${access_token}` }
      });
      const user = await res.json();
      if (user?.email) {
        // Limpa o hash da URL para não reprocessar
        window.history.replaceState(null, "", window.location.pathname);
        return { email: user.email, access_token, refresh_token };
      }
    }
  }
  // Tenta sessão salva no localStorage
  try {
    const saved = localStorage.getItem("bibly_google_session");
    if (saved) return JSON.parse(saved);
  } catch {}
  return null;
}

// Verifica se o e-mail está autorizado no Supabase
async function verificarEmailAutorizado(email) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/emails_autorizados?email=eq.${encodeURIComponent(email)}&select=email&limit=1`,
    { headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` } }
  );
  if (!res.ok) return false;
  const rows = await res.json();
  return rows.length > 0;
}

const STORAGE_GANHOS        = "bibly_registros";
const STORAGE_PLANILHA      = "bibly_planilha";
const STORAGE_PLANILHA_RAW  = "bibly_planilha_raw";
const STORAGE_PLANILHA_SALVA= "bibly_planilha_salva";
const STORAGE_NEGOCIOS      = "bibly_negocios";

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
  // IMPORTANTE: ordem importa — termos mais específicos devem vir primeiro
  // para evitar que "Opps de Whatsapp" seja detectado como "opps"
  const MAPA = [
    ["whatsapp",  ["whatsapp"]],
    ["video",     ["vídeo chamada","video chamada","vídeo","video"]],
    ["noshow",    ["no-show","noshow","no show"]],
    ["conversao", ["taxa de convers","conversão","conversao"]],
    ["opors",     ["oportunidades"]],
    ["clientes",  ["clientes (os que","clientes"]],
    ["leads",     ["novos leads","leads"]],
    ["opps",      ["opps do mesmo","opps"]],
    ["ltr",       ["ltr"]],
  ];
  function detectar(celula) {
    const c = celula.toLowerCase();
    for (const [chave, termos] of MAPA)
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
  const [carregandoGoogle, setCarregandoGoogle] = useState(false);

  // Ao montar, verifica se voltou do redirect do Google
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes("access_token")) return;
    setCarregandoGoogle(true);
    getSupabaseSession().then(async (session) => {
      if (!session?.email) { setErro("Não foi possível obter o e-mail do Google."); setCarregandoGoogle(false); return; }
      const autorizado = await verificarEmailAutorizado(session.email);
      if (autorizado) {
        localStorage.setItem("bibly_google_session", JSON.stringify(session));
        localStorage.setItem("bibly_email_autorizado", session.email);
        onLogin();
      } else {
        setErro(`E-mail ${session.email} não autorizado. Peça para adicionar seu e-mail ao sistema.`);
        localStorage.removeItem("bibly_google_session");
        setCarregandoGoogle(false);
      }
    }).catch(() => { setErro("Erro ao verificar login com Google."); setCarregandoGoogle(false); });
  }, []);

  // Verifica se já tem sessão Google salva e válida
  useEffect(() => {
    const saved = localStorage.getItem("bibly_google_session");
    const emailSalvo = localStorage.getItem("bibly_email_autorizado");
    if (saved && emailSalvo) {
      setCarregandoGoogle(true);
      verificarEmailAutorizado(emailSalvo)
        .then(ok => { if (ok) onLogin(); else { localStorage.removeItem("bibly_google_session"); localStorage.removeItem("bibly_email_autorizado"); setCarregandoGoogle(false); } })
        .catch(() => setCarregandoGoogle(false));
    }
  }, []);

  const handleLogin = () => {
    if (!usuario || !senha) { setErro("Preencha todos os campos."); return; }
    setCarregando(true); setErro("");
    setTimeout(() => {
      if (usuario === CREDENCIAIS.usuario && senha === CREDENCIAIS.senha) onLogin();
      else { setErro("Usuário ou senha incorretos."); setCarregando(false); }
    }, 900);
  };

  const handleGoogle = () => { setErro(""); loginComGoogle(); };

  const inp = { width:"100%", boxSizing:"border-box", padding:"12px 14px", backgroundColor:"#0a0a14", border:"1px solid rgba(168,85,247,0.2)", borderRadius:12, color:"#fff", fontSize:14, outline:"none" };

  if (carregandoGoogle) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", backgroundColor:"#07070f" }}>
      <div style={{ textAlign:"center", color:"#fff" }}>
        <div style={{ width:48, height:48, border:"3px solid rgba(168,85,247,0.3)", borderTopColor:ACCENT, borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 16px" }}/>
        <p style={{ fontSize:14, color:"#94a3b8" }}>Verificando login com Google…</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

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

        {/* Botão Google */}
        <button onClick={handleGoogle} style={{ width:"100%", padding:"13px", backgroundColor:"#fff", border:"none", borderRadius:12, color:"#1f1f1f", fontSize:14, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:20, boxShadow:"0 2px 8px rgba(0,0,0,0.3)", transition:"opacity 0.15s" }}
          onMouseEnter={e=>e.currentTarget.style.opacity="0.92"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
          {/* Ícone Google SVG */}
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg>
          Entrar com Google
        </button>

        {/* Divisor */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
          <div style={{ flex:1, height:1, backgroundColor:BORDER }}/>
          <span style={{ fontSize:11, color:"#334155", fontWeight:500 }}>ou use senha</span>
          <div style={{ flex:1, height:1, backgroundColor:BORDER }}/>
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
            {carregando?<><span style={{ width:16, height:16, border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", borderRadius:"50%", display:"inline-block", animation:"spin 0.7s linear infinite" }}/>Entrando…</>:"Entrar com senha"}
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

const FERIADOS_2026 = [
  "2026-01-01","2026-04-03","2026-04-05","2026-04-21",
  "2026-05-01","2026-06-04","2026-09-07","2026-10-12",
  "2026-11-02","2026-11-15","2026-11-20","2026-12-25",
];

function isDiaUtil(d) {
  const dia = d.getDay();
  if (dia === 0 || dia === 6) return false;
  const iso = d.toISOString().slice(0,10);
  return !FERIADOS_2026.includes(iso);
}

function calcDiasUteisRestantes() {
  const hoje = new Date();
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth()+1, 0);
  let count = 0;
  for (let d = new Date(hoje); d <= fimMes; d.setDate(d.getDate()+1)) {
    if (isDiaUtil(d)) count++;
  }
  return count;
}

function getInicioSemana() {
  // Retorna a segunda-feira da semana atual (meia-noite)
  const hoje = new Date();
  const diaSemana = hoje.getDay(); // 0=dom, 1=seg...
  const diff = diaSemana === 0 ? -6 : 1 - diaSemana; // volta pra segunda
  const seg = new Date(hoje);
  seg.setDate(hoje.getDate() + diff);
  seg.setHours(0,0,0,0);
  return seg;
}

function calcFechamentosSemana(clientesTotal, metas, diasTotal, diasUteisRest) {
  const hoje = new Date();
  const diaSemana = hoje.getDay();
  const hora = hoje.getHours();

  // Dias úteis restantes na semana (hoje inclusive se antes das 18h)
  let diasRestantesSemana = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() + i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    if (!isDiaUtil(d)) continue;
    // hoje só conta se antes das 18h
    if (i === 0 && hora >= 18) continue;
    // só conta dias até sexta desta semana
    const diffSeg = d.getDay() >= 1 && d.getDay() <= 5;
    // para quando chegar na próxima semana
    const inicioSemana = getInicioSemana();
    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(inicioSemana.getDate() + 4); // sexta
    if (d > fimSemana) break;
    diasRestantesSemana++;
  }

  // Ritmo necessário por semana baseado nos dias úteis do mês
  const diasUteisNoMes = 22; // média mensal
  const fechPorSemana = Math.ceil((metas.m3 / diasUteisNoMes) * 5);

  // Fechamentos feitos ESSA semana: usa localStorage para persistir por semana
  const chave = `bibly_semana_${getInicioSemana().toISOString().slice(0,10)}`;
  const feitosEstaSemana = storageGet(chave) ?? 0;

  const necessarioM3 = Math.max(fechPorSemana - feitosEstaSemana, 0);
  const semanaEncerrada = diaSemana === 0 || diaSemana === 6 || (diaSemana === 5 && hora >= 18);

  return { diasRestantesSemana, necessarioM3, semanaEncerrada, fechPorSemana, feitosEstaSemana, chaveStorage: chave };
}

function getSaudacaoStatus(emRitmo, forecastNivel, necessarioM3, semanaEncerrada, feitosEstaSemana, fechPorSemana) {
  const h = new Date().getHours();
  const periodo = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";

  if (semanaEncerrada) return null;

  if (emRitmo) {
    if (necessarioM3 === 0) {
      return { texto: `${periodo} — você já garantiu o forecast da ${forecastNivel} essa semana`, cor: ACCENT };
    }
    return { texto: `${periodo} — você precisa fechar mais ${necessarioM3} essa semana para permanecer no forecast da 3`, cor: ACCENT };
  } else {
    return { texto: `${periodo} — você precisa fechar mais ${necessarioM3} essa semana para retornar ao forecast da 3`, cor: "#f87171" };
  }
}


function StatusMeta({clientesTotal, dadosAbril, onAddGanho, onRemoveGanho, onSalvarGanho, onSalvoGanho}){
  const metas=dadosAbril.metas, diaAtual=dadosAbril.diaAtual, diasTotal=dadosAbril.diasTotal;
  const diasUteisRest = calcDiasUteisRestantes();
  const projecaoFinal=Math.round((clientesTotal/diaAtual)*diasTotal);
  const esperadoHoje=Math.round((metas.m3/diasTotal)*diaAtual);
  const emRitmo=clientesTotal>=esperadoHoje;
  const pctRitmo=esperadoHoje>0?(clientesTotal/esperadoHoje)*100:0;
  const forecastNivel=pctRitmo>=100?3:pctRitmo>=80?2:1;
  const nec=(meta)=>Math.max(Math.ceil(((meta-clientesTotal)/diasUteisRest)*10)/10,0);
  const {diasRestantesSemana, necessarioM3, semanaEncerrada, fechPorSemana, feitosEstaSemana} = calcFechamentosSemana(clientesTotal, metas, diasTotal, diasUteisRest);
  const saudacao = getSaudacaoStatus(emRitmo, forecastNivel, necessarioM3, semanaEncerrada, feitosEstaSemana, fechPorSemana);
  return(
    <div className="rounded-2xl p-6 space-y-5" style={{backgroundColor:CARD_BG,border:`1px solid ${BORDER}`}}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2"><Target size={15} style={{color:ACCENT}}/><p className="text-xs font-bold uppercase tracking-widest" style={{color:"#64748b"}}>Meta do Mês — Abril · Status</p></div>
        <span className="text-xs font-bold px-3 py-1 rounded-full" style={{backgroundColor:emRitmo?"#2e1065":"#3f1515",color:emRitmo?ACCENT:"#f87171",border:`1px solid ${emRitmo?ACCENT:"#f87171"}`}}>{emRitmo?"No Ritmo":"Atrasado"}</span>
      </div>

      <div className="flex items-baseline gap-3">
        <span className="text-6xl font-extrabold text-white">{clientesTotal}</span>
        <span className="text-2xl font-light" style={{color:"#475569"}}>/ {metas.m3}</span>
        <span className="ml-auto text-sm" style={{color:"#64748b"}}>Forecast atual: <span className="font-bold text-white">{forecastNivel}</span></span>
      </div>
      <div className="relative" style={{paddingTop:28,paddingBottom:48}}>
        {/* Marcadores M1 e M2 */}
        {[{label:"M1",val:metas.m1},{label:"M2",val:metas.m2}].map(({label,val})=>(
          <div key={label} className="absolute flex flex-col items-center" style={{left:`${pct(val,metas.m3)}%`,top:0,transform:"translateX(-50%)"}}>
            <span className="text-xs" style={{color:"#64748b"}}>{label}</span>
            <div style={{width:1,height:20,backgroundColor:"#334155"}}/>
          </div>
        ))}
        {/* Marcador amarelo — posição = clientesTotal */}
        <div className="absolute flex flex-col items-center" style={{left:`${Math.min(pct(clientesTotal,metas.m3),100)}%`,top:0,transform:"translateX(-50%)",zIndex:10,transition:"left 0.7s ease"}}>
          <span className="text-sm font-bold" style={{color:"#f59e0b"}}>{clientesTotal}</span>
          <div style={{width:1,height:20,backgroundColor:"#f59e0b"}}/>
        </div>
        {/* Barra */}
        <div style={{width:"100%",borderRadius:999,overflow:"hidden",height:10,backgroundColor:"#1e1b2e"}}>
          <div style={{height:"100%",borderRadius:999,transition:"width 0.7s",width:`${pct(clientesTotal,metas.m3)}%`,backgroundColor:ACCENT}}/>
        </div>
        {/* Texto embaixo — dinâmico, colado na linha */}
        <div style={{position:"absolute",left:`${Math.min(pct(clientesTotal,metas.m3),100)}%`,top:52,transform:"translateX(-50%)",transition:"left 0.7s ease",whiteSpace:"nowrap"}}>
          {emRitmo
            ? <span style={{fontSize:11,fontWeight:600,color:"#f59e0b"}}>Você está no forecast da {forecastNivel}</span>
            : <span style={{fontSize:11,fontWeight:600,color:"#f87171"}}>Feche mais {Math.ceil(esperadoHoje - clientesTotal)} pra voltar ao forecast da 3</span>
          }
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[{label:"META 1",val:metas.m1,cor:"#fbbf24"},{label:"META 2",val:metas.m2,cor:"#f87171"},{label:"META 3 ★",val:metas.m3,cor:"#f87171"}].map(({label,val,cor})=>{
          const n=nec(val);
          const falta=Math.max(val-clientesTotal,0);
          return(<div key={label} className="rounded-xl p-4" style={{backgroundColor:"#0f0f18",border:`1px solid ${BORDER}`}}>
            <p className="text-xs font-bold tracking-wide mb-0.5" style={{color:"#94a3b8"}}>{label}</p>
            <p className="text-xs" style={{color:"#64748b"}}>{val} fechamentos</p>
            <p className="text-3xl font-extrabold mt-2" style={{color:n===0?"#4ade80":cor}}>
              {n===0?"✓":n.toFixed(1)}{n>0&&<span className="text-base font-normal ml-1" style={{color:"#64748b"}}>/dia</span>}
            </p>
            {falta>0&&<p className="text-xs mt-1.5 font-semibold" style={{color:"#94a3b8"}}>Falta <span style={{color:cor,fontWeight:800}}>{falta}</span> pra meta</p>}
            {falta===0&&<p className="text-xs mt-1.5 font-semibold" style={{color:"#4ade80"}}>✓ Meta atingida!</p>}
          </div>);
        })}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl px-3 py-2 flex items-center gap-2" style={{backgroundColor:"#0f0f18",border:`1px solid ${BORDER}`}}>
          <span className="text-xs font-bold uppercase tracking-wide" style={{color:"#64748b"}}>Projeção Final</span>
          <span className="text-lg font-extrabold" style={{color:projecaoFinal>=metas.m3?"#4ade80":"#f87171"}}>{projecaoFinal}</span>
          <span className="text-xs" style={{color:"#475569"}}>/ {metas.m3}</span>
        </div>
        <div className="rounded-xl px-3 py-2 flex items-center gap-2" style={{backgroundColor:"#0f0f18",border:`1px solid ${BORDER}`}}>
          <span className="text-xs font-bold uppercase tracking-wide" style={{color:"#64748b"}}>Dias Restantes</span>
          <span className="text-lg font-extrabold text-white">{diasUteisRest}</span>
          <span className="text-xs" style={{color:"#475569"}}>úteis</span>
        </div>
      </div>

      {/* Bloco forecast da semana */}
      <div className="rounded-xl px-4 py-3 flex items-center justify-between gap-3 flex-wrap"
        style={{backgroundColor:"transparent", border:`1px solid ${BORDER}`}}>
        <div className="flex items-center gap-2">
          <Calendar size={13} style={{color: semanaEncerrada ? "#818cf8" : necessarioM3 === 0 ? "#4ade80" : ACCENT, flexShrink:0}}/>
          <p className="text-xs font-semibold" style={{color: semanaEncerrada ? "#818cf8" : necessarioM3 === 0 ? "#4ade80" : "#e2e8f0"}}>
            {semanaEncerrada
              ? "Final de semana chegou, procure descansar"
              : necessarioM3 === 0
                ? `✓ Meta da semana batida! (${feitosEstaSemana}/${fechPorSemana} fechamentos)`
                : `Você precisa fechar mais ${necessarioM3} pra permanecer no forecast da 3`}
          </p>
        </div>
        {!semanaEncerrada && <span className="text-xs" style={{color:"#475569"}}>{feitosEstaSemana}/{fechPorSemana} esta semana · {diasRestantesSemana} dia(s)</span>}
      </div>

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

// ─── NEGÓCIOS DO MÊS ─────────────────────────────────────────
const NEGOCIOS_DEFAULT = { aberto: "", perdido: "", ganho: "", obs: "" };

function NegociosMes() {
  const [dados, setDados] = useState(() => storageGet(STORAGE_NEGOCIOS) ?? NEGOCIOS_DEFAULT);
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState(dados);
  const [salvo, setSalvo] = useState(false);

  const handleSalvar = () => {
    storageSet(STORAGE_NEGOCIOS, form);
    setDados(form);
    setEditando(false);
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2500);
  };

  const handleCancelar = () => { setForm(dados); setEditando(false); };

  const total = (parseInt(dados.aberto)||0) + (parseInt(dados.perdido)||0) + (parseInt(dados.ganho)||0);
  const taxaGanho = total > 0 ? Math.round(((parseInt(dados.ganho)||0)/total)*100) : 0;

  const inp = { width:"100%", boxSizing:"border-box", padding:"8px 10px", backgroundColor:"#0a0a14", border:"1px solid rgba(168,85,247,0.25)", borderRadius:8, color:"#fff", fontSize:13, outline:"none" };

  return (
    <div className="rounded-2xl p-5 space-y-4" style={{backgroundColor:CARD_BG,border:`1px solid ${BORDER}`}}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <BarChart2 size={15} style={{color:ACCENT}}/>
          <p className="text-xs font-bold uppercase tracking-widest" style={{color:"#64748b"}}>Negócios do Mês</p>
          {salvo && <span className="text-xs font-semibold" style={{color:"#4ade80"}}>✓ Salvo!</span>}
        </div>
        {!editando
          ? <button onClick={()=>{setForm(dados);setEditando(true);}} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold" style={{backgroundColor:"#2e1065",color:ACCENT,border:`1px solid ${ACCENT_DIM}`,cursor:"pointer"}}><Edit3 size={11}/> Editar</button>
          : <div className="flex gap-2">
              <button onClick={handleCancelar} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold" style={{backgroundColor:"#3f1515",color:"#f87171",border:"1px solid #4c1d2a",cursor:"pointer"}}><X size={11}/> Cancelar</button>
              <button onClick={handleSalvar} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold" style={{backgroundColor:"#14532d",color:"#4ade80",border:"1px solid #166534",cursor:"pointer"}}><Save size={11}/> Salvar</button>
            </div>
        }
      </div>

      {editando ? (
        <div className="space-y-3">
          <p className="text-xs" style={{color:"#475569"}}>Insira os dados dos negócios iniciados neste mês:</p>
          <div className="grid grid-cols-3 gap-3">
            {[{key:"aberto",label:"Aberto (c/ closer)",cor:"#f59e0b"},{key:"perdido",label:"Perdido",cor:"#f87171"},{key:"ganho",label:"Ganho (pagou)",cor:"#4ade80"}].map(({key,label,cor})=>(
              <div key={key}>
                <label style={{display:"block",fontSize:11,fontWeight:600,color:cor,marginBottom:5,letterSpacing:"0.05em",textTransform:"uppercase"}}>{label}</label>
                <input type="number" min="0" value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} placeholder="0" style={inp}/>
              </div>
            ))}
          </div>
          <div>
            <label style={{display:"block",fontSize:11,fontWeight:600,color:"#94a3b8",marginBottom:5,letterSpacing:"0.05em",textTransform:"uppercase"}}>Observação (opcional)</label>
            <textarea value={form.obs} onChange={e=>setForm(f=>({...f,obs:e.target.value}))} placeholder="Ex: Mês com muitos leads de alta qualidade..." rows={2} style={{...inp,resize:"none"}}/>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {(dados.aberto||dados.perdido||dados.ganho) ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                {[{key:"aberto",label:"Aberto",sub:"c/ closer no pós-reunião",cor:"#f59e0b",bg:"#451a00"},{key:"perdido",label:"Perdido",sub:"closer deu perdido",cor:"#f87171",bg:"#3f1515"},{key:"ganho",label:"Ganho",sub:"cliente pagou",cor:"#4ade80",bg:"#052e16"}].map(({key,label,sub,cor,bg})=>(
                  <div key={key} className="rounded-xl p-4 text-center" style={{backgroundColor:bg,border:`1px solid ${cor}30`}}>
                    <p className="text-xs font-semibold mb-1" style={{color:cor,textTransform:"uppercase",letterSpacing:"0.05em"}}>{label}</p>
                    <p className="text-3xl font-extrabold" style={{color:cor}}>{parseInt(dados[key])||0}</p>
                    <p className="text-xs mt-1" style={{color:`${cor}80`}}>{sub}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl px-4 py-3 flex items-center justify-between gap-3 flex-wrap" style={{backgroundColor:"#0f0f18",border:`1px solid ${BORDER}`}}>
                <div className="flex items-center gap-4">
                  <span className="text-xs" style={{color:"#64748b"}}>Total de negócios: <span className="font-bold text-white">{total}</span></span>
                  <span className="text-xs" style={{color:"#64748b"}}>Taxa de ganho: <span className="font-bold" style={{color:"#4ade80"}}>{taxaGanho}%</span></span>
                </div>
                {dados.obs && <span className="text-xs italic" style={{color:"#475569"}}>"{dados.obs}"</span>}
              </div>
            </>
          ) : (
            <div className="rounded-xl px-4 py-5 flex flex-col items-center gap-2" style={{backgroundColor:"#0a0a14",border:`1px dashed ${BORDER}`}}>
              <p className="text-xs" style={{color:"#475569"}}>Nenhum dado inserido ainda.</p>
              <button onClick={()=>{setForm(dados);setEditando(true);}} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold" style={{backgroundColor:"#2e1065",color:ACCENT,border:`1px solid ${ACCENT_DIM}`,cursor:"pointer"}}><Plus size={11}/> Inserir dados</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TabResultados({abrilAtual,diarioAtual,humorKey}){
  const [registros,setRegistros]=useState(()=>storageGet(STORAGE_GANHOS)??[]);
  const [salvo,setSalvo]=useState(false);
  const [reunioesHoje,setReunioesHoje]=useState(null);
  const totalManual=registros.reduce((s,r)=>s+r.quantidade,0);
  const clientesStatus=abrilAtual.clientes+totalManual;

  useEffect(()=>{
    buscarReunioes(hojeISO()).then(r=>setReunioesHoje(r)).catch(()=>setReunioesHoje([]));
  },[]);

  const handleAddGanho=()=>{
    const dataHoje=new Date().toLocaleDateString("pt-BR");
    const nova=[...registros,{data:dataHoje,quantidade:1,obs:"Ajuste rapido",id:_nextId++}];
    setRegistros(nova); storageSet(STORAGE_GANHOS,nova);
    const chave=`bibly_semana_${getInicioSemana().toISOString().slice(0,10)}`;
    storageSet(chave,(storageGet(chave)??0)+1);
  };
  const handleRemoveGanho=()=>{
    if(registros.length===0)return;
    const nova=registros.slice(0,-1);
    setRegistros(nova); storageSet(STORAGE_GANHOS,nova);
    const chave=`bibly_semana_${getInicioSemana().toISOString().slice(0,10)}`;
    storageSet(chave,Math.max((storageGet(chave)??0)-1,0));
  };
  const handleSalvarGanhos=()=>{ storageSet(STORAGE_GANHOS,registros); setSalvo(true); setTimeout(()=>setSalvo(false),3000); };
  return(
    <div className="space-y-6">
      {/* Aviso de reuniões de hoje */}
      {reunioesHoje !== null && (()=>{
        const rc=reunioesHoje.filter(r=>!isCompromissoPessoal(r.titulo));
        return(
          <div style={{
            display:"flex", alignItems:"center", gap:12, padding:"12px 18px",
            borderRadius:14, border:`1px solid ${rc.length > 0 ? "rgba(168,85,247,0.35)" : "rgba(100,116,139,0.2)"}`,
            backgroundColor: rc.length > 0 ? "rgba(168,85,247,0.08)" : "rgba(15,15,24,0.6)",
          }}>
            <Calendar size={15} style={{color: rc.length > 0 ? ACCENT : "#475569", flexShrink:0}}/>
            <p style={{fontSize:13, fontWeight:600, color: rc.length > 0 ? "#e2e8f0" : "#475569", margin:0}}>
              {rc.length > 0
                ? <>Hoje você tem <span style={{color:ACCENT,fontWeight:800}}>{rc.length} reunião{rc.length!==1?"s":""}</span> agendada{rc.length!==1?"s":""}.</>
                : "Nenhuma reunião de cliente agendada para hoje."
              }
            </p>
          </div>
        );
      })()}
      <div className="grid grid-cols-1 gap-4 items-start">
        <StatusMeta clientesTotal={clientesStatus} dadosAbril={abrilAtual} onAddGanho={handleAddGanho} onRemoveGanho={handleRemoveGanho} onSalvarGanho={handleSalvarGanhos} onSalvoGanho={salvo}/>
      </div>
      <EvolucaoChart diario={diarioAtual} metaM3={abrilAtual.metas.m3} diasTotal={abrilAtual.diasTotal}/>
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

function TabDados({abrilAtual,dadosPlanilha,onDadosImportados,preview,syncInfo,salvando,salvoOk,onSalvarSupabase}){
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
          <button onClick={()=>document.getElementById("secao-planilha")?.scrollIntoView({behavior:"smooth"})} className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold" style={{background:"linear-gradient(135deg,#6d28d9 0%,#a855f7 100%)",color:"#fff",border:"none",cursor:"pointer",whiteSpace:"nowrap"}}>
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
      <div id="secao-planilha" style={{marginTop:32}}>
        <TabPlanilha onDadosImportados={onDadosImportados} preview={preview} syncInfo={syncInfo} salvando={salvando} salvoOk={salvoOk} onSalvarSupabase={onSalvarSupabase}/>
      </div>
    </div>
  );
}

// ─── SUPABASE — planilha (usa constantes definidas no topo) ───
const SUPABASE_USER = "bibi";

async function supabaseSalvar(dados) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/planilha_dados?on_conflict=usuario`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Prefer": "resolution=merge-duplicates",
    },
    body: JSON.stringify({ usuario: SUPABASE_USER, dados, atualizado_em: new Date().toISOString() }),
  });
  if (!res.ok) { const t = await res.text(); throw new Error(t); }
}

async function supabaseCarregar() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/planilha_dados?usuario=eq.${SUPABASE_USER}&select=dados,atualizado_em&limit=1`,
    { headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` } }
  );
  if (!res.ok) throw new Error("Erro ao carregar");
  const rows = await res.json();
  return rows?.[0] ?? null;
}

function TabPlanilha({onDadosImportados, preview, syncInfo, salvando, salvoOk, onSalvarSupabase}){
  const [texto,setTexto]=useState("");
  const [erro,setErro]=useState("");

  const handleProcessar = useCallback(()=>{
    setErro("");
    if(!texto.trim()){setErro("Cole os dados da planilha no campo acima.");return;}
    const dados = parsearTSV(texto);
    if(!dados){setErro("Não foi possível reconhecer os dados. Certifique-se de copiar diretamente do Google Sheets ou Excel (Ctrl+C nas células).");return;}
    onDadosImportados(dados);
    setTexto("");
  },[texto, onDadosImportados]);

  const handleLimpar=()=>{
    onDadosImportados(null);
    setTexto(""); setErro("");
  };

  const syncStr = syncInfo?.atualizado_em
    ? new Date(syncInfo.atualizado_em).toLocaleString("pt-BR")
    : null;

  return(
    <div className="space-y-5">
      {/* Banner nuvem */}
      <div className="rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap"
        style={{backgroundColor: syncInfo?"#052e16":"#0f0f18", border:`1px solid ${syncInfo?"#166534":BORDER}`}}>
        <div className="flex items-center gap-3">
          <CheckCircle2 size={16} style={{color: syncInfo?"#4ade80":"#475569"}}/>
          <div>
            <p className="text-sm font-bold" style={{color: syncInfo?"#4ade80":"#94a3b8"}}>
              {syncInfo ? "Dados carregados da nuvem ☁️" : "Nenhum dado salvo na nuvem ainda"}
            </p>
            {syncStr&&<p className="text-xs" style={{color:"#86efac"}}>Última atualização: {syncStr}</p>}
          </div>
        </div>
        {preview&&(
          <button onClick={onSalvarSupabase} disabled={salvando}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold"
            style={{background: salvoOk?"#14532d":"linear-gradient(135deg,#6d28d9 0%,#a855f7 100%)", color:"#fff", border:"none", cursor: salvando?"not-allowed":"pointer", opacity: salvando?0.7:1}}>
            {salvando ? <><Loader2 size={12} style={{animation:"spin 1s linear infinite"}}/> Salvando…</>
              : salvoOk ? "✓ Salvo na nuvem!"
              : <><Save size={12}/> Salvar na nuvem</>}
          </button>
        )}
      </div>

      {/* Instrução */}
      <div className="rounded-2xl p-5 flex items-start gap-4" style={{backgroundColor:CARD_BG,border:`1px solid ${BORDER}`}}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{backgroundColor:"#2e1065"}}><Table size={20} style={{color:ACCENT}}/></div>
        <div>
          <p className="text-base font-bold text-white">Importar dados da planilha</p>
          <p className="text-sm mt-1" style={{color:"#64748b"}}>
            Abra sua planilha no Google Sheets, selecione <strong style={{color:"#94a3b8"}}>todas as células com dados</strong> (Ctrl+A), copie (Ctrl+C) e cole abaixo.
          </p>
          <p className="text-xs mt-2 px-3 py-1.5 rounded-lg inline-block" style={{backgroundColor:"#1e1b2e",color:"#818cf8"}}>
            💡 Após importar, clique em <strong>"Salvar na nuvem"</strong> para acessar de qualquer computador.
          </p>
        </div>
      </div>

      {/* Área de colagem */}
      <div className="space-y-3">
        <textarea
          value={texto}
          onChange={e=>{setTexto(e.target.value); setErro("");}}
          placeholder={"Cole aqui os dados copiados da planilha (Ctrl+C no Google Sheets → Ctrl+V aqui)…"}
          rows={8}
          style={{width:"100%",boxSizing:"border-box",backgroundColor:"#0a0a14",border:`1px solid ${erro?"#991b1b":texto?"rgba(168,85,247,0.4)":BORDER}`,borderRadius:16,color:"#e2e8f0",fontSize:13,padding:"16px",outline:"none",resize:"vertical",fontFamily:"monospace",lineHeight:1.5,transition:"border-color 0.2s"}}
        />
        {erro&&(
          <div className="flex items-start gap-2 rounded-xl px-4 py-3" style={{backgroundColor:"rgba(248,113,113,0.08)",border:"1px solid rgba(248,113,113,0.25)"}}>
            <XCircle size={14} style={{color:"#f87171",flexShrink:0,marginTop:1}}/><p className="text-xs" style={{color:"#f87171"}}>{erro}</p>
          </div>
        )}
        <button onClick={handleProcessar} disabled={!texto.trim()}
          className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
          style={{background: texto.trim()?"linear-gradient(135deg,#6d28d9 0%,#a855f7 100%)":"#1e1b2e", color: texto.trim()?"#fff":"#475569", border:"none", cursor: texto.trim()?"pointer":"not-allowed", transition:"all 0.2s"}}>
          <FileText size={15}/> Processar dados colados
        </button>
      </div>

      {/* Preview */}
      {preview&&(
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-xs font-bold uppercase tracking-widest" style={{color:"#64748b"}}>
              Preview — dados atuais {preview.atual?.atualizadoAte?`· até ${preview.atual.atualizadoAte}`:""}
            </p>
            <button onClick={handleLimpar} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
              style={{backgroundColor:"#3f1515",color:"#f87171",border:"1px solid #4c1d2a",cursor:"pointer"}}>
              <X size={11}/> Limpar dados
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              {label:"Clientes",val:preview.atual?.clientes},
              {label:"Novos Leads",val:preview.atual?.leads},
              {label:"OPPs",val:preview.atual?.opps},
              {label:"LTR",val:`${preview.atual?.ltr??0}%`},
              {label:"No-show",val:`${preview.atual?.noshow??0}%`},
              {label:"Oportunidades",val:preview.atual?.oportunidades},
              {label:"Conversão",val:`${preview.atual?.conversao??0}%`},
              {label:"WhatsApp",val:preview.atual?.whatsapp},
              {label:"Vídeo",val:preview.atual?.video},
              {label:"Atualizado até",val:preview.atual?.atualizadoAte||"—"},
              {label:"Meta 1",val:preview.metas?.m1??"—"},
              {label:"Meta 2",val:preview.metas?.m2??"—"},
              {label:"Meta 3",val:preview.metas?.m3??"—"},
              {label:"Dias com dados",val:preview.diario?.length??0},
            ].map(({label,val})=>(
              <div key={label} className="rounded-xl p-3" style={{backgroundColor:"#0f0f18",border:`1px solid ${BORDER}`}}>
                <p className="text-xs" style={{color:"#64748b"}}>{label}</p>
                <p className="text-lg font-bold" style={{color:ACCENT}}>{val}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl px-5 py-3 flex items-center gap-3" style={{backgroundColor:"#1e1b2e",border:`1px solid ${BORDER}`}}>
            <CheckCircle2 size={15} style={{color:"#4ade80"}}/>
            <p className="text-sm font-semibold" style={{color:"#94a3b8"}}>
              Dados prontos! Clique em <strong style={{color:ACCENT}}>"Salvar na nuvem"</strong> acima para acessar em qualquer computador.
            </p>
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


// ─── HOME / BOAS-VINDAS ───────────────────────────────────────
const HOME_CARDS = [
  {id:"resultados",    label:"Metas",            desc:"Metas, métricas e forecast do mês em tempo real.",  cor:"#a855f7"},
  {id:"dados",         label:"Dados",            desc:"Performance, gráficos e importação de planilha.",    cor:"#60a5fa"},
  {id:"calendario",    label:"Calendário",       desc:"Reuniões, no-shows e taxa semanal de presença.",    cor:"#f87171"},
  {id:"lideranca",     label:"Estudos",          desc:"Liderança e desenvolvimento profissional.",         cor:"#818cf8"},
  {id:"carreira",      label:"Trilha de Carreira",desc:"Níveis, progressão e metas da sua jornada.",      cor:"#a855f7"},
];

function TabHome({onNavegar}){
  const tz=Intl.DateTimeFormat().resolvedOptions().timeZone||"America/Sao_Paulo";
  const h=Number(new Intl.DateTimeFormat("pt-BR",{hour:"2-digit",hour12:false,timeZone:tz}).format(new Date()));
  const saudacao=h<12?"Bom dia":h<18?"Boa tarde":"Boa noite";
  return(
    <div>
      {/* Hero */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16,marginBottom:32}}>
        <div>
          <h1 style={{fontSize:30,fontWeight:900,color:"#fff",letterSpacing:"-0.8px",lineHeight:1.1}}>
            {saudacao},{" "}
            <span style={{background:"linear-gradient(90deg,#a855f7,#7c3aed)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Bibi</span>
          </h1>
          <p style={{fontSize:13,color:"#475569",marginTop:6}}>Seu dashboard, sua inteligência</p>
        </div>
        <div style={{borderLeft:"1px solid rgba(168,85,247,0.2)",paddingLeft:24,maxWidth:420}}>
          <p style={{fontSize:12,color:"#64748b",fontStyle:"italic",lineHeight:1.65}}>"Prospecção é a base de tudo. Sem ela, o pipeline seca e as comissões somem."</p>
          <p style={{fontSize:11,color:"#6d28d9",fontWeight:600,marginTop:5}}>— Jeb Blount, Fanatical Prospecting</p>
        </div>
      </div>
      {/* divisor */}
      <div style={{height:1,backgroundColor:BORDER,marginBottom:24}}/>
      {/* grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:10}}>
        {HOME_CARDS.map(({id,label,desc,cor})=>(
          <div key={id} onClick={()=>onNavegar(id)}
            style={{backgroundColor:CARD_BG,border:`1px solid ${BORDER}`,borderRadius:12,padding:"16px 18px",cursor:"pointer",transition:"border-color 0.15s",display:"flex",flexDirection:"column",gap:6}}
            onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(168,85,247,0.35)"}
            onMouseLeave={e=>e.currentTarget.style.borderColor=BORDER}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{width:6,height:6,borderRadius:"50%",backgroundColor:cor,flexShrink:0}}/>
              <span style={{fontSize:12,color:"#334155"}}>↗</span>
            </div>
            <p style={{fontSize:13,fontWeight:700,color:"#e2e8f0"}}>{label}</p>
            <p style={{fontSize:11,color:"#475569",lineHeight:1.5}}>{desc}</p>
          </div>
        ))}
      </div>
      <div style={{marginTop:24,display:"flex",alignItems:"center",gap:8}}>
        <div style={{flex:1,height:1,background:"#0f0f1a"}}/>
        <span style={{fontSize:10,color:"#1e1b2e",fontWeight:700,letterSpacing:"0.12em"}}>BIBLY · 2026</span>
        <div style={{flex:1,height:1,background:"#0f0f1a"}}/>
      </div>
    </div>
  );
}


// ─── ABA CALENDÁRIO (REUNIÕES) ─────────────────────────────────
const STATUS_CONFIG_R = {
  agendada:  {label:"Agendada",        color:"#60a5fa",bg:"rgba(96,165,250,0.12)"},
  realizada: {label:"Realizada",       color:"#4ade80",bg:"rgba(74,222,128,0.12)"},
  noshow:    {label:"No-show",         color:"#f87171",bg:"rgba(248,113,113,0.12)"},
  pessoal:   {label:"Reunião Pessoal", color:"#f59e0b",bg:"rgba(245,158,11,0.12)"},
  cancelada: {label:"Cancelada",       color:"#94a3b8",bg:"rgba(148,163,184,0.08)"},
};

function getEmailUsuario(){
  const s=JSON.parse(localStorage.getItem("bibly_google_session")||"{}");
  return s.email||localStorage.getItem("bibly_email_autorizado")||"bibi@bibly.app";
}

async function supaReuniaoFetch(path,options={}){
  const s=JSON.parse(localStorage.getItem("bibly_google_session")||"{}");
  const res=await fetch(`${SUPABASE_URL}${path}`,{...options,headers:{"apikey":SUPABASE_KEY,"Authorization":`Bearer ${s.access_token||SUPABASE_KEY}`,"Content-Type":"application/json","Prefer":"return=representation",...options.headers}});
  if(!res.ok)throw new Error(await res.text());
  const t=await res.text();return t?JSON.parse(t):[];
}

async function buscarReunioes(data){return supaReuniaoFetch(`/rest/v1/reunioes?data=eq.${data}&email_usuario=eq.${encodeURIComponent(getEmailUsuario())}&order=hora_inicio.asc`);}
async function buscarReunioesRange(di,df){return supaReuniaoFetch(`/rest/v1/reunioes?data=gte.${di}&data=lte.${df}&email_usuario=eq.${encodeURIComponent(getEmailUsuario())}&order=data.asc,hora_inicio.asc`);}
async function salvarReuniao(r){const e=getEmailUsuario();if(r.id){return supaReuniaoFetch(`/rest/v1/reunioes?id=eq.${r.id}`,{method:"PATCH",body:JSON.stringify({...r,atualizado_em:new Date().toISOString()})});}return supaReuniaoFetch(`/rest/v1/reunioes`,{method:"POST",body:JSON.stringify({...r,email_usuario:e})});}
async function deletarReuniao(id){return supaReuniaoFetch(`/rest/v1/reunioes?id=eq.${id}`,{method:"DELETE"});}

function hojeISO(){return new Date().toISOString().split("T")[0];}
function fmtData(d){if(!d)return"";const[a,m,dia]=d.split("-");return`${dia}/${m}/${a}`;}
function semanaAtual(){const d=new Date();const dom=new Date(d);dom.setDate(d.getDate()-d.getDay());const sab=new Date(dom);sab.setDate(dom.getDate()+6);return{inicio:dom.toISOString().split("T")[0],fim:sab.toISOString().split("T")[0]};}

function BadgeR({status}){const c=STATUS_CONFIG_R[status]||STATUS_CONFIG_R.agendada;return<span style={{fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:999,color:c.color,backgroundColor:c.bg}}>{c.label}</span>;}

// ─── MODAL DE REUNIÃO (clique no bloco do calendário) ─────────
function ModalReuniao({reuniao, onFechar, onAtualizar, onDeletar}){
  const[loading,setLoading]=useState(false);
  const mudar=async(s)=>{
    setLoading(true);
    try{await salvarReuniao({...reuniao,status:s});onAtualizar();}
    finally{setLoading(false);}
  };
  const cfg=STATUS_CONFIG_R[reuniao.status]||STATUS_CONFIG_R.agendada;
  return(
    <>
      <div onClick={onFechar} style={{position:"fixed",inset:0,backgroundColor:"rgba(0,0,0,0.55)",zIndex:400,backdropFilter:"blur(3px)"}}/>
      <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:401,
        width:"100%",maxWidth:380,backgroundColor:"#0f0f18",border:`1px solid rgba(168,85,247,0.25)`,
        borderRadius:20,padding:"24px",boxShadow:"0 32px 64px rgba(0,0,0,0.7)"}}>
        {/* Header */}
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:20}}>
          <div>
            <p style={{fontSize:16,fontWeight:800,color:"#fff",marginBottom:4,lineHeight:1.3}}>{reuniao.titulo}</p>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:12,color:"#64748b"}}>{reuniao.hora_inicio}{reuniao.hora_fim&&` – ${reuniao.hora_fim}`}</span>
              <span style={{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:999,color:cfg.color,backgroundColor:cfg.bg}}>{cfg.label}</span>
            </div>
          </div>
          <button onClick={onFechar} style={{background:"none",border:"none",cursor:"pointer",color:"#475569",marginTop:-4}}>
            <X size={18}/>
          </button>
        </div>
        {reuniao.notas&&<p style={{fontSize:12,color:"#64748b",marginBottom:20,lineHeight:1.5}}>{reuniao.notas}</p>}

        {/* Botões principais */}
        {loading
          ? <div style={{textAlign:"center",padding:"16px 0"}}><Loader2 size={20} style={{color:ACCENT,animation:"spin 0.7s linear infinite"}}/></div>
          : <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <button onClick={()=>mudar("realizada")}
                style={{width:"100%",padding:"12px",borderRadius:12,border:"none",cursor:"pointer",fontWeight:700,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                  backgroundColor:reuniao.status==="realizada"?"#14532d":"rgba(74,222,128,0.1)",
                  color:"#4ade80",border:reuniao.status==="realizada"?"1px solid #166534":"1px solid rgba(74,222,128,0.25)"}}>
                <CheckCircle2 size={16}/> Compareceu ✓
              </button>
              <button onClick={()=>mudar("noshow")}
                style={{width:"100%",padding:"12px",borderRadius:12,border:"none",cursor:"pointer",fontWeight:700,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                  backgroundColor:reuniao.status==="noshow"?"#3f1515":"rgba(248,113,113,0.1)",
                  color:"#f87171",border:reuniao.status==="noshow"?"1px solid #4c1d2a":"1px solid rgba(248,113,113,0.25)"}}>
                <XCircle size={16}/> Não compareceu
              </button>
              <button onClick={()=>mudar("pessoal")}
                style={{width:"100%",padding:"12px",borderRadius:12,border:"none",cursor:"pointer",fontWeight:700,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                  backgroundColor:reuniao.status==="pessoal"?"#451a00":"rgba(245,158,11,0.1)",
                  color:"#f59e0b",border:reuniao.status==="pessoal"?"1px solid #78350f":"1px solid rgba(245,158,11,0.25)"}}>
                🗓️ Reunião Pessoal
              </button>
              {reuniao.status!=="agendada"&&(
                <button onClick={()=>mudar("agendada")}
                  style={{width:"100%",padding:"10px",borderRadius:12,border:`1px solid ${BORDER}`,cursor:"pointer",fontWeight:600,fontSize:12,color:"#64748b",backgroundColor:"transparent"}}>
                  Voltar para Agendada
                </button>
              )}
              <div style={{height:1,backgroundColor:BORDER,margin:"4px 0"}}/>
              <button onClick={()=>{onDeletar(reuniao.id);onFechar();}}
                style={{width:"100%",padding:"10px",borderRadius:12,border:"1px solid rgba(248,113,113,0.2)",cursor:"pointer",fontWeight:600,fontSize:12,color:"#f87171",backgroundColor:"transparent",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                <Trash2 size={13}/> Excluir reunião
              </button>
            </div>
        }
      </div>
    </>
  );
}

// ─── CALENDÁRIO VISUAL SEMANAL ─────────────────────────────────
const HORAS_CAL = Array.from({length:13},(_,i)=>i+8); // 8h às 20h
const DIAS_SEMANA_LABEL = ["DOM","SEG","TER","QUA","QUI","SEX","SÁB"];

function getInicioSemanaData(ref){
  const d=new Date(ref);
  d.setDate(d.getDate()-d.getDay());
  d.setHours(0,0,0,0);
  return d;
}

// ─── DETECTA COMPROMISSO PESSOAL PELO TÍTULO ─────────────────
function isCompromissoPessoal(titulo=""){
  const t=(titulo||"").toLowerCase();
  return (
    t.startsWith("[sdr]") ||
    t.startsWith("[águia]") ||
    t.startsWith("[aguia]") ||
    t.startsWith("[lid]") ||
    t.includes("almoço") ||
    t.includes("almoco") ||
    t.includes("pedir reembolso") ||
    t.includes("aniversário") ||
    t.includes("aniversario") ||
    t.includes("roda de conversa")
  );
}

function CalendarioVisual({reunioesSemana, diaFoco, onClicarReuniao, onClicarHora, carregando}){
  const hoje=new Date();
  const inicioSem=getInicioSemanaData(new Date(diaFoco));
  const dias=Array.from({length:7},(_,i)=>{
    const d=new Date(inicioSem);
    d.setDate(inicioSem.getDate()+i);
    return d;
  });

  // Agrupa reuniões por dia
  const porDia={};
  reunioesSemana.forEach(r=>{porDia[r.data]=porDia[r.data]||[];porDia[r.data].push(r);});

  // Converte hora "HH:MM" em minutos desde 8h
  const toMin=(h)=>{if(!h)return 0;const[hh,mm]=(h||"00:00").split(":");return(parseInt(hh)-8)*60+parseInt(mm||0);};
  const HORA_H=56; // pixels por hora

  const isHoje=(d)=>d.toDateString()===hoje.toDateString();

  return(
    <div style={{borderRadius:16,overflow:"hidden",border:`1px solid ${BORDER}`,backgroundColor:CARD_BG}}>
      {/* Header dias */}
      <div style={{display:"grid",gridTemplateColumns:"52px repeat(7,1fr)",borderBottom:`1px solid ${BORDER}`}}>
        <div style={{padding:"10px 0",backgroundColor:"#0a0a14"}}/>
        {dias.map((d,i)=>{
          const iso=d.toISOString().split("T")[0];
          const ativo=iso===diaFoco;
          const eh=isHoje(d);
          return(
            <div key={i} style={{padding:"10px 4px",textAlign:"center",borderLeft:`1px solid ${BORDER}`,backgroundColor:ativo?"rgba(168,85,247,0.06)":"#0a0a14"}}>
              <p style={{fontSize:10,fontWeight:700,color:eh?ACCENT:"#475569",textTransform:"uppercase",letterSpacing:"0.08em"}}>{DIAS_SEMANA_LABEL[i]}</p>
              <div style={{width:30,height:30,borderRadius:"50%",margin:"4px auto 0",display:"flex",alignItems:"center",justifyContent:"center",
                backgroundColor:eh?"#a855f7":"transparent"}}>
                <p style={{fontSize:16,fontWeight:800,color:eh?"#fff":ativo?"#e2e8f0":"#64748b"}}>{d.getDate()}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grade de horários */}
      <div style={{display:"grid",gridTemplateColumns:"52px repeat(7,1fr)",maxHeight:380,overflowY:"auto",position:"relative"}}>
        {/* Coluna de horas */}
        <div>
          {HORAS_CAL.map(h=>(
            <div key={h} style={{height:HORA_H,borderBottom:`1px solid ${BORDER}`,display:"flex",alignItems:"flex-start",justifyContent:"flex-end",paddingRight:8,paddingTop:4}}>
              <span style={{fontSize:10,color:"#334155",fontWeight:600}}>{String(h).padStart(2,"0")}h</span>
            </div>
          ))}
        </div>

        {/* Colunas dos dias */}
        {dias.map((d,di)=>{
          const iso=d.toISOString().split("T")[0];
          const reunioesDia=(porDia[iso]||[]).sort((a,b)=>a.hora_inicio.localeCompare(b.hora_inicio));
          const ativo=iso===diaFoco;
          return(
            <div key={di} style={{borderLeft:`1px solid ${BORDER}`,position:"relative",backgroundColor:ativo?"rgba(168,85,247,0.02)":"transparent"}}>
              {/* Linhas de hora clicáveis */}
              {HORAS_CAL.map(h=>(
                <div key={h} onClick={()=>onClicarHora(iso,`${String(h).padStart(2,"0")}:00`)}
                  style={{height:HORA_H,borderBottom:`1px solid ${BORDER}`,cursor:"pointer",transition:"background 0.1s"}}
                  onMouseEnter={e=>e.currentTarget.style.backgroundColor="rgba(168,85,247,0.05)"}
                  onMouseLeave={e=>e.currentTarget.style.backgroundColor="transparent"}
                />
              ))}

              {/* Blocos de reunião — lado a lado estilo Google Calendar */}
              {(()=>{
                const bgMap={agendada:"rgba(96,165,250,0.25)",realizada:"rgba(74,222,128,0.25)",noshow:"rgba(248,113,113,0.25)",pessoal:"rgba(245,158,11,0.22)",cancelada:"rgba(148,163,184,0.15)"};
                const solidMap={agendada:"#3b82f6",realizada:"#22c55e",noshow:"#ef4444",pessoal:"#f59e0b",cancelada:"#64748b"};
                const getStatus=(r)=>isCompromissoPessoal(r.titulo)?"pessoal":r.status;

                // 1. Enriquece cada reunião com top/bot/altura
                const evs=reunioesDia.map(r=>{
                  const top=toMin(r.hora_inicio)*(HORA_H/60);
                  const durMin=r.hora_fim?(toMin(r.hora_fim)-toMin(r.hora_inicio)):45;
                  const altura=Math.max(durMin*(HORA_H/60),26);
                  return{...r,top,bot:top+altura,altura,col:0,totalCols:1};
                });

                // 2. Algoritmo de colunas: para cada evento, encontra a primeira coluna livre
                const cols=[]; // cols[i] = bot do último evento nessa coluna
                evs.forEach(ev=>{
                  let placed=false;
                  for(let i=0;i<cols.length;i++){
                    if(ev.top>=cols[i]){
                      ev.col=i;
                      cols[i]=ev.bot;
                      placed=true;
                      break;
                    }
                  }
                  if(!placed){ev.col=cols.length;cols.push(ev.bot);}
                });

                // 3. Para cada evento, descobre quantas colunas existem no seu intervalo
                evs.forEach(ev=>{
                  ev.totalCols=evs.filter(x=>x.top<ev.bot&&x.bot>ev.top).reduce((m,x)=>Math.max(m,x.col+1),1);
                });

                // 4. Renderiza
                return evs.map(ev=>{
                  const st=getStatus(ev);
                  const wPct=100/ev.totalCols;
                  const leftPct=ev.col*wPct;
                  return(
                    <div key={ev.id} onClick={()=>onClicarReuniao(ev)}
                      style={{
                        position:"absolute",
                        left:`calc(${leftPct}% + 2px)`,
                        width:`calc(${wPct}% - 4px)`,
                        top:ev.top,
                        height:ev.altura,
                        backgroundColor:bgMap[st]||bgMap.agendada,
                        borderLeft:`3px solid ${solidMap[st]||solidMap.agendada}`,
                        borderRadius:"0 5px 5px 0",
                        padding:"2px 4px",
                        cursor:"pointer",
                        overflow:"hidden",
                        transition:"filter 0.15s",
                        zIndex:10+ev.col,
                        boxSizing:"border-box",
                      }}
                      onMouseEnter={e=>e.currentTarget.style.filter="brightness(1.25)"}
                      onMouseLeave={e=>e.currentTarget.style.filter="brightness(1)"}>
                      <p style={{
                        fontSize:9,fontWeight:700,
                        color:solidMap[st]||solidMap.agendada,
                        lineHeight:1.3,
                        whiteSpace:"nowrap",
                        overflow:"hidden",
                        textOverflow:"ellipsis",
                        margin:0,
                      }}>
                        {ev.hora_inicio} {ev.titulo}
                      </p>
                      {ev.altura>38&&ev.hora_fim&&(
                        <p style={{fontSize:8,color:"rgba(255,255,255,0.35)",margin:"1px 0 0"}}>
                          até {ev.hora_fim}
                        </p>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          );
        })}
      </div>
      {carregando&&(
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",backgroundColor:"rgba(7,7,15,0.5)",borderRadius:16}}>
          <Loader2 size={24} style={{color:ACCENT,animation:"spin 0.7s linear infinite"}}/>
        </div>
      )}
    </div>
  );
}

function FormReuniao({inicial,onSalvar,onCancelar}){
  const[form,setForm]=useState(inicial||{titulo:"",data:hojeISO(),hora_inicio:"",hora_fim:"",status:"agendada",origem:"manual",notas:""});
  const[salvando,setSalvando]=useState(false);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const handleSalvar=async()=>{if(!form.titulo||!form.data||!form.hora_inicio)return;setSalvando(true);try{await salvarReuniao(form);onSalvar();}finally{setSalvando(false);}};
  const inp={backgroundColor:"#0a0a14",border:`1px solid rgba(168,85,247,0.2)`,borderRadius:10,color:"#fff",fontSize:13,padding:"10px 12px",outline:"none",width:"100%",boxSizing:"border-box"};
  return(
    <div style={{backgroundColor:"#0d0d18",border:`1px solid rgba(168,85,247,0.25)`,borderRadius:14,padding:20,marginBottom:16}}>
      <p style={{fontSize:12,fontWeight:700,color:ACCENT,marginBottom:14,letterSpacing:"0.05em",textTransform:"uppercase"}}>{inicial?.id?"Editar":"Nova reunião"}</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div style={{gridColumn:"1 / -1"}}><label style={{fontSize:10,color:"#64748b",fontWeight:600,display:"block",marginBottom:4}}>TÍTULO</label><input value={form.titulo} onChange={e=>set("titulo",e.target.value)} placeholder="Ex: Call com lead" style={inp}/></div>
        <div><label style={{fontSize:10,color:"#64748b",fontWeight:600,display:"block",marginBottom:4}}>DATA</label><input type="date" value={form.data} onChange={e=>set("data",e.target.value)} style={inp}/></div>
        <div><label style={{fontSize:10,color:"#64748b",fontWeight:600,display:"block",marginBottom:4}}>STATUS</label><select value={form.status} onChange={e=>set("status",e.target.value)} style={{...inp,cursor:"pointer"}}>{Object.entries(STATUS_CONFIG_R).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select></div>
        <div><label style={{fontSize:10,color:"#64748b",fontWeight:600,display:"block",marginBottom:4}}>HORA INÍCIO</label><input type="time" value={form.hora_inicio} onChange={e=>set("hora_inicio",e.target.value)} style={inp}/></div>
        <div><label style={{fontSize:10,color:"#64748b",fontWeight:600,display:"block",marginBottom:4}}>HORA FIM</label><input type="time" value={form.hora_fim} onChange={e=>set("hora_fim",e.target.value)} style={inp}/></div>
        <div style={{gridColumn:"1 / -1"}}><label style={{fontSize:10,color:"#64748b",fontWeight:600,display:"block",marginBottom:4}}>NOTAS</label><textarea value={form.notas} onChange={e=>set("notas",e.target.value)} rows={2} style={{...inp,resize:"vertical",fontFamily:"inherit"}}/></div>
      </div>
      <div style={{display:"flex",gap:8,marginTop:12,justifyContent:"flex-end"}}>
        <button onClick={onCancelar} style={{padding:"8px 16px",borderRadius:9,border:`1px solid ${BORDER}`,background:"transparent",color:"#64748b",fontSize:12,cursor:"pointer"}}>Cancelar</button>
        <button onClick={handleSalvar} disabled={salvando||!form.titulo||!form.hora_inicio} style={{padding:"8px 18px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#6d28d9,#a855f7)",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6,opacity:(!form.titulo||!form.hora_inicio)?0.5:1}}>
          {salvando?<Loader2 size={13} style={{animation:"spin 0.7s linear infinite"}}/>:<Save size={13}/>} Salvar
        </button>
      </div>
    </div>
  );
}

function EstatR({label,valor,sub,cor}){return(<div style={{backgroundColor:CARD_BG,border:`1px solid ${BORDER}`,borderRadius:14,padding:"16px 18px"}}><p style={{fontSize:10,color:"#64748b",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6}}>{label}</p><p style={{fontSize:28,fontWeight:900,color:cor||ACCENT,lineHeight:1}}>{valor}</p>{sub&&<p style={{fontSize:11,color:"#475569",marginTop:5}}>{sub}</p>}</div>);}

function carregarGapi(){
  return new Promise((resolve,reject)=>{
    if(window.gapi){resolve();return;}
    const s=document.createElement("script");
    s.src="https://apis.google.com/js/api.js";
    s.onload=()=>window.gapi.load("client:auth2",resolve);
    s.onerror=reject;
    document.body.appendChild(s);
  });
}

async function initGapi(){
  await window.gapi.client.init({
    clientId:GOOGLE_CLIENT_ID,
    scope:GOOGLE_SCOPES,
    discoveryDocs:["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
  });
}

async function loginGcalComercial(){
  const auth=window.gapi.auth2.getAuthInstance();
  // Força login com e-mail comercial específico
  await auth.signIn({
    login_hint:"gabrielly.oliveira@cardapioweb.com",
    prompt:"select_account",
  });
}

async function buscarEventosGCal(data){
  // Garante que o cliente Calendar está inicializado
  if(!window.gapi?.client?.calendar){
    await window.gapi.client.load("calendar","v3");
  }

  const auth=window.gapi.auth2.getAuthInstance();
  if(!auth.isSignedIn.get()) throw new Error("Usuário não autenticado no Google Calendar.");

  // Garante que o token atual tem o scope de Calendar
  const user=auth.currentUser.get();
  const hasScope=user.hasGrantedScopes(GOOGLE_SCOPES);
  if(!hasScope){
    // Pede scope adicional sem fazer logout
    await user.grant({scope:GOOGLE_SCOPES});
  }

  // Usa horário local (Brasília) para não perder eventos por fuso
  const inicio=new Date(`${data}T00:00:00-03:00`).toISOString();
  const fim   =new Date(`${data}T23:59:59-03:00`).toISOString();

  const res=await window.gapi.client.calendar.events.list({
    calendarId:"primary",
    timeMin:inicio,
    timeMax:fim,
    singleEvents:true,
    orderBy:"startTime",
    maxResults:50,
  });

  const items=res.result.items||[];
  return items.map(e=>({
    google_event_id:e.id,
    titulo:e.summary||"Sem título",
    data,
    hora_inicio:e.start.dateTime?new Date(e.start.dateTime).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit",timeZone:"America/Sao_Paulo"}):"00:00",
    hora_fim:e.end.dateTime?new Date(e.end.dateTime).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit",timeZone:"America/Sao_Paulo"}):null,
    status:"agendada",origem:"google_calendar",notas:e.description||"",
    email_usuario:getEmailUsuario(),
  }));
}

function TabReunioes(){
  const[semanaRef,setSemanaRef]=useState(hojeISO());
  const[diaFoco,setDiaFoco]=useState(hojeISO());
  const[semana,setSemana]=useState([]);
  const[carregando,setCarregando]=useState(false);
  const[mostrarForm,setMostrarForm]=useState(false);
  const[formInicial,setFormInicial]=useState(null);
  const[reuniaoSel,setReuniaoSel]=useState(null);
  const[mostrarImport,setMostrarImport]=useState(false);
  const[textoImport,setTextoImport]=useState("");
  const[importando,setImportando]=useState(false);
  const[importOk,setImportOk]=useState(0);

  const carregar=useCallback(async()=>{
    setCarregando(true);
    try{
      const ini=getInicioSemanaData(new Date(semanaRef));
      const fim=new Date(ini);fim.setDate(ini.getDate()+6);
      const isoIni=ini.toISOString().split("T")[0];
      const isoFim=fim.toISOString().split("T")[0];
      const dados=await buscarReunioesRange(isoIni,isoFim);
      setSemana(dados);
    }catch(e){console.error(e);}finally{setCarregando(false);}
  },[semanaRef]);

  useEffect(()=>{carregar();},[carregar]);

  const navSemana=(dir)=>{
    const d=new Date(semanaRef);
    d.setDate(d.getDate()+dir*7);
    const iso=d.toISOString().split("T")[0];
    setSemanaRef(iso);
    setDiaFoco(iso);
  };

  const handleDelete=async(id)=>{await deletarReuniao(id);setReuniaoSel(null);carregar();};

  const importarTexto=async()=>{
    if(!textoImport.trim())return;
    setImportando(true);
    const linhas=textoImport.trim().split("\n").map(l=>l.trim()).filter(Boolean);
    const regex=/^(\d{1,2}[h:]\d{0,2})\s*[-|–]?\s*(.+)$/;
    let salvos=0;
    for(const linha of linhas){
      const m=linha.match(regex);
      if(!m)continue;
      let hora=m[1].replace("h",":");
      if(hora.endsWith(":"))hora+="00";
      const titulo=m[2].trim();
      if(!titulo)continue;
      await salvarReuniao({titulo,data:diaFoco,hora_inicio:hora,hora_fim:null,status:"agendada",origem:"manual",notas:"",email_usuario:getEmailUsuario()});
      salvos++;
    }
    setImportOk(salvos);
    setTextoImport("");setMostrarImport(false);
    setTimeout(()=>setImportOk(0),4000);
    await carregar();
    setImportando(false);
  };

  // métricas do dia focado
  const reunioesDia=semana.filter(r=>r.data===diaFoco);
  const reunioesDiaCliente=reunioesDia.filter(r=>!isCompromissoPessoal(r.titulo));
  const total=reunioesDiaCliente.length;
  const realizadas=reunioesDiaCliente.filter(r=>r.status==="realizada").length;
  const noshows=reunioesDiaCliente.filter(r=>r.status==="noshow").length;
  const agendadas=reunioesDiaCliente.filter(r=>r.status==="agendada").length;
  const taxaDia=total>0?Math.round((noshows/total)*100):0;
  const semanaCliente=semana.filter(r=>!isCompromissoPessoal(r.titulo));
  const totalSem=semanaCliente.length;
  const noshowsSem=semanaCliente.filter(r=>r.status==="noshow").length;
  const taxaSem=totalSem>0?Math.round((noshowsSem/totalSem)*100):0;

  // Datas da semana
  const ini=getInicioSemanaData(new Date(semanaRef));
  const fim=new Date(ini);fim.setDate(ini.getDate()+6);
  const labelSemana=`${ini.getDate().toString().padStart(2,"0")}/${(ini.getMonth()+1).toString().padStart(2,"0")} – ${fim.getDate().toString().padStart(2,"0")}/${(fim.getMonth()+1).toString().padStart(2,"0")}`;

  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>

      {/* Modal reunião selecionada */}
      {reuniaoSel&&(
        <ModalReuniao
          reuniao={reuniaoSel}
          onFechar={()=>setReuniaoSel(null)}
          onAtualizar={()=>{carregar();setReuniaoSel(null);}}
          onDeletar={handleDelete}
        />
      )}

      {/* Modal form nova reunião */}
      {mostrarForm&&(
        <FormReuniao
          inicial={formInicial}
          onSalvar={()=>{setMostrarForm(false);setFormInicial(null);carregar();}}
          onCancelar={()=>{setMostrarForm(false);setFormInicial(null);}}
        />
      )}

      {/* ── Barra topo ── */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        {/* Nav semana */}
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <button onClick={()=>navSemana(-1)} style={{padding:"7px 12px",borderRadius:9,border:`1px solid ${BORDER}`,backgroundColor:"transparent",color:"#64748b",cursor:"pointer",fontSize:16,lineHeight:1}}>‹</button>
          <span style={{fontSize:13,fontWeight:700,color:"#e2e8f0",minWidth:130,textAlign:"center"}}>{labelSemana}</span>
          <button onClick={()=>navSemana(1)} style={{padding:"7px 12px",borderRadius:9,border:`1px solid ${BORDER}`,backgroundColor:"transparent",color:"#64748b",cursor:"pointer",fontSize:16,lineHeight:1}}>›</button>
          <button onClick={()=>{setSemanaRef(hojeISO());setDiaFoco(hojeISO());}}
            style={{padding:"7px 12px",borderRadius:9,border:`1px solid ${BORDER}`,backgroundColor:"transparent",color:"#64748b",cursor:"pointer",fontSize:12}}>
            Hoje
          </button>
          <button onClick={carregar} disabled={carregando}
            style={{padding:"7px 10px",borderRadius:9,border:`1px solid ${BORDER}`,backgroundColor:"transparent",color:"#64748b",cursor:"pointer",display:"flex",alignItems:"center"}}>
            <RefreshCw size={13} style={{animation:carregando?"spin 0.7s linear infinite":"none"}}/>
          </button>
        </div>
        {/* Ações */}
        <div style={{display:"flex",gap:8}}>
          <a href="https://agendar-reunioes-closer.vercel.app/" target="_blank" rel="noopener noreferrer"
            style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:10,border:`1px solid rgba(168,85,247,0.4)`,backgroundColor:"rgba(168,85,247,0.08)",color:ACCENT,fontSize:12,fontWeight:600,cursor:"pointer",textDecoration:"none",transition:"all 0.2s"}}
            onMouseEnter={e=>{e.currentTarget.style.backgroundColor="rgba(168,85,247,0.18)";}}
            onMouseLeave={e=>{e.currentTarget.style.backgroundColor="rgba(168,85,247,0.08)";}}>
            <ExternalLink size={13}/> Agendar reunião
          </a>
          <button onClick={()=>setMostrarImport(v=>!v)}
            style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:10,border:`1px solid ${mostrarImport?ACCENT:BORDER}`,backgroundColor:mostrarImport?"rgba(168,85,247,0.1)":"transparent",color:mostrarImport?ACCENT:"#94a3b8",fontSize:12,fontWeight:600,cursor:"pointer"}}>
            <RefreshCw size={13}/> Sincronizar
          </button>
          <button onClick={()=>{setFormInicial({data:diaFoco,hora_inicio:"",titulo:"",hora_fim:"",status:"agendada",origem:"manual",notas:""});setMostrarForm(true);}}
            style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",background:"linear-gradient(135deg,#6d28d9,#a855f7)",border:"none",borderRadius:10,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>
            <Plus size={14}/> Nova reunião
          </button>
        </div>
      </div>

      {/* Painel importar */}
      {mostrarImport&&(
        <div style={{backgroundColor:"#0d0d18",border:`1px solid rgba(168,85,247,0.25)`,borderRadius:14,padding:20,display:"flex",flexDirection:"column",gap:12}}>
          <div>
            <p style={{fontSize:13,fontWeight:700,color:"#e2e8f0",marginBottom:4}}>📋 Colar reuniões — <span style={{color:ACCENT}}>{fmtData(diaFoco)}</span></p>
            <p style={{fontSize:11,color:"#64748b"}}>Uma por linha: <span style={{color:"#94a3b8",fontFamily:"monospace"}}>09:00 - Nome do lead</span></p>
          </div>
          <textarea value={textoImport} onChange={e=>setTextoImport(e.target.value)}
            placeholder={"09:00 - Call com João Silva\n10:30 - Demo Restaurante Central\n14:00 - Follow-up Maria"}
            rows={5}
            style={{width:"100%",boxSizing:"border-box",backgroundColor:"#0a0a14",border:`1px solid rgba(168,85,247,0.2)`,borderRadius:12,color:"#e2e8f0",fontSize:13,padding:"12px 14px",outline:"none",resize:"vertical",fontFamily:"monospace",lineHeight:1.7}}/>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
            <button onClick={()=>{setMostrarImport(false);setTextoImport("");}}
              style={{padding:"8px 16px",borderRadius:9,border:`1px solid ${BORDER}`,background:"transparent",color:"#64748b",fontSize:12,cursor:"pointer"}}>
              Cancelar
            </button>
            <button onClick={importarTexto} disabled={importando||!textoImport.trim()}
              style={{display:"flex",alignItems:"center",gap:6,padding:"8px 18px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#6d28d9,#a855f7)",color:"#fff",fontSize:12,fontWeight:700,cursor:textoImport.trim()?"pointer":"not-allowed",opacity:textoImport.trim()?1:0.5}}>
              {importando?<><Loader2 size={13} style={{animation:"spin 0.7s linear infinite"}}/> Importando…</>:<><CheckCircle2 size={13}/> Importar</>}
            </button>
          </div>
        </div>
      )}
      {importOk>0&&(
        <div style={{backgroundColor:"rgba(74,222,128,0.08)",border:"1px solid rgba(74,222,128,0.25)",borderRadius:12,padding:"10px 16px",display:"flex",alignItems:"center",gap:10}}>
          <CheckCircle2 size={14} style={{color:"#4ade80"}}/>
          <p style={{fontSize:13,fontWeight:600,color:"#4ade80"}}>✓ {importOk} reunião(ões) importadas!</p>
        </div>
      )}

      {/* ── Calendário visual ── */}
      <div style={{position:"relative"}}>
        <CalendarioVisual
          reunioesSemana={semana}
          diaFoco={diaFoco}
          carregando={carregando}
          onClicarReuniao={(r)=>setReuniaoSel(r)}
          onClicarHora={(data,hora)=>{
            setDiaFoco(data);
            setFormInicial({data,hora_inicio:hora,titulo:"",hora_fim:"",status:"agendada",origem:"manual",notas:""});
            setMostrarForm(true);
          }}
        />
      </div>
    </div>
  );
}

const TABS=[
  {id:"resultados",label:"Metas",icon:Target},
  {id:"calendario",label:"Calendário",icon:Calendar},
  {id:"dados",label:"Dados",icon:BarChart2},
  {id:"lideranca",label:"Estudos",icon:Star},
  {id:"carreira",label:"Trilha de Carreira",icon:Rocket},
];

function getSaudacaoPorFuso(tz){
  const h=Number(new Intl.DateTimeFormat("pt-BR",{hour:"2-digit",hour12:false,timeZone:tz}).format(new Date()));
  return h<12?"Bom dia":h<18?"Boa tarde":"Boa noite";
}


// ─── STORAGE PERFIL ───────────────────────────────────────────
const STORAGE_PERFIL = "bibly_perfil";
const PERFIL_DEFAULT = { nome: "Gabrielly", inicial: "G", humor: "", humorEmoji: "" };

const HUMORES_SUGERIDOS = [
  { emoji: "🔥", texto: "Hoje tô no modo máquina" },
  { emoji: "😤", texto: "Focada e sem parar" },
  { emoji: "⚡", texto: "Energia total hoje" },
  { emoji: "🎯", texto: "Olho no objetivo" },
  { emoji: "😴", texto: "Dia puxado, mas vou" },
  { emoji: "💜", texto: "Animada com os resultados" },
  { emoji: "🧠", texto: "Modo estratégia ativado" },
  { emoji: "🚀", texto: "Voando hoje" },
];

// ─── MODAL PERFIL ─────────────────────────────────────────────
function ModalPerfil({ onFechar }) {
  const [perfil, setPerfil] = useState(() => storageGet(STORAGE_PERFIL) ?? PERFIL_DEFAULT);
  const [draft, setDraft] = useState(perfil);
  const [salvo, setSalvo] = useState(false);

  const salvar = () => {
    storageSet(STORAGE_PERFIL, draft);
    setPerfil(draft);
    setSalvo(true);
    setTimeout(() => { setSalvo(false); onFechar(); }, 1200);
  };

  const inp = {
    width: "100%", boxSizing: "border-box", padding: "10px 12px",
    backgroundColor: "#0a0a14", border: `1px solid rgba(168,85,247,0.2)`,
    borderRadius: 10, color: "#fff", fontSize: 13, outline: "none",
  };

  return (
    <>
      {/* Overlay */}
      <div onClick={onFechar} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 300, backdropFilter: "blur(4px)" }} />

      {/* Modal */}
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        zIndex: 301, width: "100%", maxWidth: 420, margin: "0 16px",
        backgroundColor: "#0f0f18", border: `1px solid rgba(168,85,247,0.25)`,
        borderRadius: 20, padding: "28px 28px 24px",
        boxShadow: "0 32px 64px rgba(0,0,0,0.7)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#fff", margin: 0 }}>Meu Perfil</h2>
          <button onClick={onFechar} style={{ background: "none", border: "none", cursor: "pointer", color: "#475569", display: "flex" }}
            onMouseEnter={e => e.currentTarget.style.color = "#e2e8f0"}
            onMouseLeave={e => e.currentTarget.style.color = "#475569"}>
            <X size={18} />
          </button>
        </div>

        {/* Avatar preview */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "linear-gradient(135deg,#6d28d9,#a855f7)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, fontWeight: 900, color: "#fff",
            border: "3px solid rgba(168,85,247,0.4)",
          }}>{(draft.inicial || draft.nome?.[0] || "G").toUpperCase()}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Nome */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#94a3b8", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Nome</label>
            <input value={draft.nome} onChange={e => setDraft(d => ({ ...d, nome: e.target.value, inicial: e.target.value?.[0]?.toUpperCase() || "G" }))} placeholder="Seu nome" style={inp} />
          </div>

          {/* Humor do dia */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#94a3b8", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Humor do dia</label>

            {/* Sugestões rápidas */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {HUMORES_SUGERIDOS.map(h => {
                const ativo = draft.humorEmoji === h.emoji && draft.humor === h.texto;
                return (
                  <button key={h.emoji}
                    onClick={() => setDraft(d => ativo ? { ...d, humor: "", humorEmoji: "" } : { ...d, humor: h.texto, humorEmoji: h.emoji })}
                    style={{
                      padding: "5px 10px", borderRadius: 20, fontSize: 12, cursor: "pointer",
                      border: `1px solid ${ativo ? ACCENT : BORDER}`,
                      backgroundColor: ativo ? "rgba(168,85,247,0.12)" : "transparent",
                      color: ativo ? ACCENT : "#64748b", transition: "all 0.15s",
                    }}>
                    {h.emoji} {h.texto}
                  </button>
                );
              })}
            </div>

            {/* Emoji + texto customizado */}
            <div style={{ display: "flex", gap: 8 }}>
              <input value={draft.humorEmoji} onChange={e => setDraft(d => ({ ...d, humorEmoji: e.target.value }))}
                placeholder="😊" style={{ ...inp, width: 56, textAlign: "center", fontSize: 18, padding: "10px 6px" }} maxLength={2} />
              <input value={draft.humor} onChange={e => setDraft(d => ({ ...d, humor: e.target.value }))}
                placeholder="Como você tá hoje?" style={{ ...inp, flex: 1 }} />
            </div>
          </div>
        </div>

        {/* Botão salvar */}
        <button onClick={salvar} style={{
          marginTop: 24, width: "100%", padding: "13px",
          background: salvo ? "#14532d" : "linear-gradient(135deg,#6d28d9,#a855f7)",
          border: "none", borderRadius: 12, color: "#fff",
          fontSize: 14, fontWeight: 700, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          transition: "all 0.2s",
        }}>
          {salvo ? <><CheckCircle2 size={15} /> Salvo!</> : <><Save size={15} /> Salvar perfil</>}
        </button>
      </div>
    </>
  );
}

// ─── HUMOR DO DIA (card na aba Resultados) ────────────────────
function HumorDoDia() {
  const perfil = storageGet(STORAGE_PERFIL) ?? PERFIL_DEFAULT;
  if (!perfil.humor) return null;
  return (
    <div style={{
      borderRadius: 14, padding: "14px 20px",
      backgroundColor: "rgba(168,85,247,0.06)",
      border: "1px solid rgba(168,85,247,0.18)",
      display: "flex", alignItems: "center", gap: 14,
    }}>
      <span style={{ fontSize: 28, flexShrink: 0 }}>{perfil.humorEmoji || "💜"}</span>
      <div>
        <p style={{ fontSize: 11, color: "#6d28d9", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>Humor do dia</p>
        <p style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0" }}>{perfil.humor}</p>
      </div>
    </div>
  );
}

// ─── CLOSERS ──────────────────────────────────────────────────
const CLOSERS = [
  { email:"leandro.santos@cardapioweb.com",  nome:"Leandro Santos",    min:30, wpp:true  },
  { email:"gregory.lavor@cardapioweb.com",   nome:"Gregory Lavor",     min:30, wpp:true  },
  { email:"luan.nicolas@cardapioweb.com",    nome:"Luan Nicolas",      min:30, wpp:true  },
  { email:"gustavo.duarte@cardapioweb.com",  nome:"Gustavo Duarte",    min:30, wpp:true  },
  { email:"leonardo.santos@cardapioweb.com", nome:"Leonardo Santos",   min:30, wpp:true  },
  { email:"guilherme.silva@cardapioweb.com", nome:"Guilherme Silva",   min:45, wpp:true  },
  { email:"reno.jesse@cardapioweb.com",      nome:"Reno Jesse",        min:30, wpp:true  },
  { email:"leticia.silva@cardapioweb.com",   nome:"Leticia Silva",     min:45, wpp:false },
];

function CardClosers() {
  return (
    <div style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "16px 20px", marginBottom: 20 }}>
      <p style={{ fontSize: 10, color: "#334155", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Time de Closers</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {CLOSERS.map(c => (
          <div key={c.email} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 12px", borderRadius: 10,
            backgroundColor: "#0a0a14", border: `1px solid ${BORDER}`,
            flexShrink: 0,
          }}>
            {/* Avatar inicial */}
            <div style={{
              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg,#6d28d9,#a855f7)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 800, color: "#fff",
            }}>{c.nome[0]}</div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>{c.nome}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                <span style={{ fontSize: 10, color: "#64748b" }}>⏱ {c.min}min</span>
                {c.wpp
                  ? <span style={{ fontSize: 10, color: "#4ade80", fontWeight: 600 }}>✓ WhatsApp</span>
                  : <span style={{ fontSize: 10, color: "#f87171", fontWeight: 600 }}>✕ WhatsApp</span>
                }
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────
function Sidebar({ aberta, aba, setAba, onLogout, onFechar }) {
  const W = 272;
  const emailSalvo = localStorage.getItem("bibly_email_autorizado") || "";

  const hoje = new Date();
  const [mesVis, setMesVis] = useState({ year: hoje.getFullYear(), month: hoje.getMonth() });
  const primeiroDia = new Date(mesVis.year, mesVis.month, 1).getDay();
  const diasNoMes = new Date(mesVis.year, mesVis.month + 1, 0).getDate();
  const nomeMes = new Date(mesVis.year, mesVis.month).toLocaleDateString("pt-BR", { month: "long" });
  const cells = [];
  for (let i = 0; i < primeiroDia; i++) cells.push(null);
  for (let d = 1; d <= diasNoMes; d++) cells.push(d);

  return (
    <>
      {/* Overlay */}
      {aberta && (
        <div
          onClick={onFechar}
          style={{
            position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 149, backdropFilter: "blur(3px)",
            animation: "fadeIn 0.2s ease",
          }}
        />
      )}

      {/* Sidebar */}
      <div style={{
        position: "fixed", top: 0, left: 0, height: "100vh", width: W,
        backgroundColor: "#0b0b16",
        borderRight: `1px solid ${BORDER}`,
        zIndex: 150,
        transform: aberta ? "translateX(0)" : `translateX(-${W}px)`,
        transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
        display: "flex", flexDirection: "column", overflowY: "auto",
        boxShadow: aberta ? "8px 0 40px rgba(0,0,0,0.5)" : "none",
      }}>
        {/* Topo */}
        <div style={{
          padding: "18px 18px 14px",
          borderBottom: `1px solid ${BORDER}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px" }}>
            Bi<span style={{ color: ACCENT }}>bly</span>
          </span>
          <button
            onClick={onFechar}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#475569", display: "flex", padding: 4, borderRadius: 6, transition: "color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.color = "#e2e8f0"}
            onMouseLeave={e => e.currentTarget.style.color = "#475569"}
          >
            <X size={18} />
          </button>
        </div>

        {/* Perfil */}
        <div style={{
          padding: "14px 18px",
          borderBottom: `1px solid ${BORDER}`,
          display: "flex", alignItems: "center", gap: 12,
          flexShrink: 0,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            background: "linear-gradient(135deg,#6d28d9,#a855f7)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15, fontWeight: 800, color: "#fff",
            border: "2px solid rgba(168,85,247,0.35)", flexShrink: 0,
          }}>G</div>
          <div style={{ overflow: "hidden" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Gabrielly</p>
            {emailSalvo && (
              <p style={{ fontSize: 10, color: "#475569", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{emailSalvo}</p>
            )}
          </div>
        </div>

        {/* Navegação */}
        <div style={{ padding: "14px 12px 4px", flexShrink: 0 }}>
          <p style={{ fontSize: 10, color: "#334155", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "0 8px", marginBottom: 6 }}>Navegação</p>
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = aba === id;
            return (
              <button
                key={id}
                onClick={() => { setAba(id); onFechar(); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  width: "100%", padding: "9px 10px",
                  borderRadius: 10, border: "none", cursor: "pointer",
                  backgroundColor: active ? "rgba(168,85,247,0.12)" : "transparent",
                  color: active ? "#a855f7" : "#64748b",
                  fontSize: 13, fontWeight: active ? 700 : 500,
                  marginBottom: 2, transition: "all 0.15s", textAlign: "left",
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#e2e8f0"; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#64748b"; } }}
              >
                <Icon size={15} style={{ flexShrink: 0 }} />
                {label}
                {active && <span style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", backgroundColor: ACCENT, flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>

        {/* Divisor */}
        <div style={{ height: 1, backgroundColor: BORDER, margin: "10px 18px", flexShrink: 0 }} />

        {/* Mini Calendário */}
        <div style={{ margin: "0 12px", padding: 14, borderRadius: 14, backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, flexShrink: 0 }}>
          {/* Header mês */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <button
              onClick={() => setMesVis(v => { const d = new Date(v.year, v.month - 1); return { year: d.getFullYear(), month: d.getMonth() }; })}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#475569", padding: "2px 5px", fontSize: 16, display: "flex", borderRadius: 4 }}
              onMouseEnter={e => e.currentTarget.style.color = "#e2e8f0"}
              onMouseLeave={e => e.currentTarget.style.color = "#475569"}
            >‹</button>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "capitalize" }}>{nomeMes} {mesVis.year}</span>
            <button
              onClick={() => setMesVis(v => { const d = new Date(v.year, v.month + 1); return { year: d.getFullYear(), month: d.getMonth() }; })}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#475569", padding: "2px 5px", fontSize: 16, display: "flex", borderRadius: 4 }}
              onMouseEnter={e => e.currentTarget.style.color = "#e2e8f0"}
              onMouseLeave={e => e.currentTarget.style.color = "#475569"}
            >›</button>
          </div>
          {/* Dias da semana */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
            {["D","S","T","Q","Q","S","S"].map((d, i) => (
              <div key={i} style={{ textAlign: "center", fontSize: 9, color: "#334155", fontWeight: 700, padding: "2px 0" }}>{d}</div>
            ))}
          </div>
          {/* Células */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
            {cells.map((d, i) => {
              const isHoje = d === hoje.getDate() && mesVis.month === hoje.getMonth() && mesVis.year === hoje.getFullYear();
              return (
                <div key={i} style={{
                  textAlign: "center", fontSize: 10, padding: "4px 0", borderRadius: 6,
                  backgroundColor: isHoje ? ACCENT : "transparent",
                  color: isHoje ? "#fff" : d ? "#64748b" : "transparent",
                  fontWeight: isHoje ? 800 : 400,
                }}>{d || ""}</div>
              );
            })}
          </div>
        </div>

        {/* Divisor */}
        <div style={{ height: 1, backgroundColor: BORDER, margin: "12px 18px", flexShrink: 0 }} />

        {/* Ações rápidas */}
        <div style={{ padding: "0 12px", flexShrink: 0 }}>
          <p style={{ fontSize: 10, color: "#334155", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "0 8px", marginBottom: 6 }}>Ações Rápidas</p>
          {[
            { label: "Reuniões de hoje", icon: Bell, id: "calendario" },
            { label: "Atualizar dados", icon: RefreshCw, id: "dados" },
            { label: "Ver metas", icon: Target, id: "resultados" },
          ].map(({ label, icon: Icon, id }) => (
            <button
              key={id}
              onClick={() => { setAba(id); onFechar(); }}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                padding: "9px 10px", borderRadius: 10, border: "none", cursor: "pointer",
                backgroundColor: "transparent", color: "#64748b",
                fontSize: 13, fontWeight: 500, marginBottom: 2, transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#e2e8f0"; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#64748b"; }}
            >
              <Icon size={14} style={{ flexShrink: 0 }} />
              {label}
            </button>
          ))}
        </div>

        {/* Rodapé — Sair */}
        <div style={{ marginTop: "auto", padding: "16px 12px", borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
          <button
            onClick={onLogout}
            style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%",
              padding: "9px 10px", borderRadius: 10, border: "none", cursor: "pointer",
              backgroundColor: "transparent", color: "#f87171",
              fontSize: 13, fontWeight: 600, transition: "all 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(248,113,113,0.08)"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
          >
            <LogOut size={15} /> Sair
          </button>
        </div>
      </div>
    </>
  );
}

// ─── DASHBOARD ─────────────────────────────────────────────────
function Dashboard({ onLogout }) {
  const [aba, setAba] = useState("resultados");
  const [scrolled, setScrolled] = useState(false);
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const [perfilAberto, setPerfilAberto] = useState(false);
  const [perfilKey, setPerfilKey] = useState(0);
  const [dadosPlanilha, setDadosPlanilha] = useState(() => {
    const s = storageGet(STORAGE_PLANILHA_SALVA);
    if (s?.dados) return s.dados;
    return storageGet(STORAGE_PLANILHA);
  });
  const [syncInfo, setSyncInfo] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [salvoOk, setSalvoOk] = useState(false);
  const [erroSync, setErroSync] = useState("");

  useEffect(() => {
    supabaseCarregar()
      .then(row => {
        if (row?.dados) {
          setDadosPlanilha(row.dados);
          storageSet(STORAGE_PLANILHA, row.dados);
          storageSet(STORAGE_PLANILHA_SALVA, { dados: row.dados, savedAt: row.atualizado_em });
          setSyncInfo({ atualizado_em: row.atualizado_em });
        }
      })
      .catch(() => {
        const s = storageGet(STORAGE_PLANILHA_SALVA);
        if (s?.dados) { setDadosPlanilha(s.dados); setSyncInfo({ atualizado_em: s.savedAt }); }
      });
  }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const abrilAtual = {
    ...abrilFallback,
    ...(dadosPlanilha?.atual ?? {}),
    metas: {
      ...abrilFallback.metas,
      ...(dadosPlanilha?.metas?.m1 != null ? { m1: dadosPlanilha.metas.m1 } : {}),
      ...(dadosPlanilha?.metas?.m2 != null ? { m2: dadosPlanilha.metas.m2 } : {}),
      ...(dadosPlanilha?.metas?.m3 != null ? { m3: dadosPlanilha.metas.m3 } : {}),
    },
  };
  const diarioAtual = dadosPlanilha?.diario?.length > 0 ? dadosPlanilha.diario : abrilDiarioFallback;

  const handleDadosImportados = (dados) => {
    setDadosPlanilha(dados);
    storageSet(STORAGE_PLANILHA, dados);
  };

  const handleSalvarSupabase = async () => {
    if (!dadosPlanilha) return;
    setSalvando(true); setErroSync("");
    try {
      await supabaseSalvar(dadosPlanilha);
      const agora = new Date().toISOString();
      storageSet(STORAGE_PLANILHA_SALVA, { dados: dadosPlanilha, savedAt: agora });
      setSyncInfo({ atualizado_em: agora });
      setSalvoOk(true); setTimeout(() => setSalvoOk(false), 3000);
    } catch (e) {
      setErroSync("Erro ao salvar na nuvem: " + e.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#07070f" }}>
      {/* MODAL PERFIL */}
      {perfilAberto && <ModalPerfil onFechar={() => { setPerfilAberto(false); setPerfilKey(k => k+1); }} />}

      {/* CHAT ASSISTENTE */}
      {/* SIDEBAR */}
      <Sidebar
        aberta={sidebarAberta}
        aba={aba}
        setAba={setAba}
        onLogout={onLogout}
        onFechar={() => setSidebarAberta(false)}
      />

      {/* NAVBAR TOPO */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        backgroundColor: scrolled ? "rgba(7,7,15,0.97)" : "rgba(7,7,15,0.7)",
        backdropFilter: "blur(20px)",
        borderBottom: `1px solid ${scrolled ? BORDER : "transparent"}`,
        transition: "background-color 0.3s, border-color 0.3s",
      }}>
        <div style={{ padding: "0 32px", height: 60, display: "flex", alignItems: "center", gap: 0 }}>

          {/* Botão Menu */}
          <button
            onClick={() => setSidebarAberta(v => !v)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "7px 14px", borderRadius: 10,
              border: `1px solid ${sidebarAberta ? "rgba(168,85,247,0.5)" : BORDER}`,
              backgroundColor: sidebarAberta ? "rgba(168,85,247,0.1)" : "transparent",
              color: sidebarAberta ? ACCENT : "#94a3b8",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              transition: "all 0.2s", marginRight: 20, flexShrink: 0,
            }}
            onMouseEnter={e => { if (!sidebarAberta) { e.currentTarget.style.borderColor = "rgba(168,85,247,0.4)"; e.currentTarget.style.color = "#e2e8f0"; } }}
            onMouseLeave={e => { if (!sidebarAberta) { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = "#94a3b8"; } }}
          >
            <span style={{ display: "flex", flexDirection: "column", gap: 3.5, width: 14 }}>
              <span style={{
                height: 1.5, backgroundColor: "currentColor", borderRadius: 1, display: "block",
                transition: "transform 0.25s",
                transform: sidebarAberta ? "rotate(45deg) translate(3.5px, 5px)" : "none",
              }} />
              <span style={{
                height: 1.5, backgroundColor: "currentColor", borderRadius: 1, display: "block",
                transition: "opacity 0.25s",
                opacity: sidebarAberta ? 0 : 1,
              }} />
              <span style={{
                height: 1.5, backgroundColor: "currentColor", borderRadius: 1, display: "block",
                transition: "transform 0.25s",
                transform: sidebarAberta ? "rotate(-45deg) translate(3.5px, -5px)" : "none",
              }} />
            </span>
            Menu
          </button>

          {/* Logo + slogan */}
          <div style={{ display: "flex", flexDirection: "column", marginRight: 32, flexShrink: 0 }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px", lineHeight: 1.1 }}>
              Bi<span style={{ color: ACCENT }}>bly</span>
            </span>
            <span style={{ fontSize: 8, color: "#475569", letterSpacing: "0.1em", fontWeight: 600, textTransform: "uppercase", marginTop: 8 }}>
              Seu dashboard, sua inteligência
            </span>
          </div>

          {/* Divisor */}
          <div style={{ width: 1, height: 28, backgroundColor: BORDER, marginRight: 28, flexShrink: 0 }} />

          {/* Nav links */}
          <nav style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, flex: 1 }}>
            {TABS.map(({ id, label }) => {
              const active = aba === id;
              return (
                <button
                  key={id}
                  onClick={() => setAba(id)}
                  style={{
                    padding: "6px 16px", borderRadius: 8, border: "none", cursor: "pointer",
                    backgroundColor: active ? "rgba(168,85,247,0.15)" : "transparent",
                    color: active ? "#e2e8f0" : "#94a3b8",
                    fontSize: 14, fontWeight: active ? 700 : 400,
                    transition: "all 0.15s", whiteSpace: "nowrap",
                    position: "relative", letterSpacing: active ? "-0.2px" : "0",
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = "#e2e8f0"; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = "#94a3b8"; }}
                >
                  {label}
                  {active && (
                    <span style={{
                      position: "absolute", bottom: -1, left: "50%",
                      transform: "translateX(-50%)", width: 20, height: 2,
                      backgroundColor: ACCENT, borderRadius: 1,
                    }} />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Avatar clicável */}
          {(() => {
            const p = storageGet(STORAGE_PERFIL) ?? PERFIL_DEFAULT;
            return (
              <div
                onClick={() => setPerfilAberto(true)}
                title={`${p.nome} · clique para editar perfil`}
                style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: "linear-gradient(135deg,#6d28d9,#a855f7)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", fontSize: 12, fontWeight: 800, color: "#fff",
                  flexShrink: 0, border: "2px solid rgba(168,85,247,0.3)", marginLeft: 12,
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(168,85,247,0.7)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(168,85,247,0.3)"}
              >{(p.inicial || p.nome?.[0] || "G").toUpperCase()}</div>
            );
          })()}
        </div>
      </header>

      {/* CONTEÚDO */}
      <div style={{ paddingTop: 60 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 28px 0" }}>
          <p style={{ fontSize: 11, color: "#6d28d9", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, marginBottom: 4 }}>
            {TABS.find(t => t.id === aba)?.label} · Bibly
          </p>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px", margin: 0 }}>
              {aba === "resultados" && "Metas do Mês"}
              {aba === "dados" && "Dados e Planilha"}
              {aba === "calendario" && "Calendário"}
              {aba === "lideranca" && "Estudos e Desenvolvimento"}
              {aba === "carreira" && "Trilha de Carreira"}
            </h1>
            <span style={{ fontSize: 11, color: "#475569", letterSpacing: "0.1em", fontWeight: 600, textTransform: "uppercase" }}>
              Seu dashboard, sua inteligência
            </span>
          </div>
          <div style={{ height: 1, backgroundColor: BORDER, marginTop: 20 }} />
        </div>
        <main style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 28px 80px" }}>
          {aba === "resultados" && <TabResultados abrilAtual={abrilAtual} diarioAtual={diarioAtual} humorKey={perfilKey} />}
          {aba === "dados" && <TabDados abrilAtual={abrilAtual} dadosPlanilha={dadosPlanilha} onDadosImportados={handleDadosImportados} preview={dadosPlanilha} syncInfo={syncInfo} salvando={salvando} salvoOk={salvoOk} onSalvarSupabase={handleSalvarSupabase} />}
          {aba === "calendario" && <><CardClosers /><TabReunioes /></>}
          {aba === "lideranca" && <TabLideranca />}
          {aba === "carreira" && <TabCarreira />}
          <p style={{ textAlign: "center", fontSize: 11, color: "#1e1b2e", marginTop: 48 }}>[Resultados] [bibi] · 2026</p>
        </main>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        input::placeholder, textarea::placeholder { color: #334155 }
        * { box-sizing: border-box }
        ::-webkit-scrollbar { width: 4px }
        ::-webkit-scrollbar-thumb { background: #1e1b2e; border-radius: 2px }
      `}</style>
    </div>
  );
}

export default function App() {
  const [logado, setLogado] = useState(false);
  return logado ? <Dashboard onLogout={() => setLogado(false)} /> : <TelaLogin onLogin={() => setLogado(true)} />;
}
