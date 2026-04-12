import { useState, useEffect, useCallback, useRef } from "react";

const FINNHUB_KEY    = process.env.REACT_APP_FINNHUB_KEY || "";
const FINNHUB        = "https://finnhub.io/api/v1";
const COINGECKO      = "https://api.coingecko.com/api/v3";
const POLYMARKET_API = "https://gamma-api.polymarket.com";

// Stock logo CDN (tickerlogos.com — free, no key)
const STOCK_DOMAINS = {
  SPY:"ssga.com",QQQ:"invesco.com",NVDA:"nvidia.com",AAPL:"apple.com",TSLA:"tesla.com",
  META:"meta.com",MSFT:"microsoft.com",AMZN:"amazon.com",GOOGL:"google.com",GOOG:"google.com",
  NFLX:"netflix.com",AMD:"amd.com",INTC:"intel.com",COIN:"coinbase.com",
  JPM:"jpmorganchase.com",GS:"goldmansachs.com",BAC:"bankofamerica.com",WMT:"walmart.com",
  DIS:"thewaltdisneycompany.com",UBER:"uber.com",ABNB:"airbnb.com",
  V:"visa.com",MA:"mastercard.com",PYPL:"paypal.com",SQ:"block.xyz",
  CRM:"salesforce.com",BA:"boeing.com",KO:"coca-colacompany.com",PEP:"pepsico.com",
  NKE:"nike.com",SBUX:"starbucks.com",MCD:"mcdonalds.com",SHOP:"shopify.com",
  SPOT:"spotify.com",SNAP:"snap.com",HOOD:"robinhood.com",PLTR:"palantir.com",
  ARM:"arm.com",SMCI:"supermicro.com",
};
const tickerLogo = (t) => STOCK_DOMAINS[t] ? `https://cdn.tickerlogos.com/${STOCK_DOMAINS[t]}` : null;
const CG_DAYS = {"1W":"7","1M":"30","3M":"90","1Y":"365","5Y":"max"};

const STOCK_WATCHLIST = [
  {ticker:"SPY",name:"S&P 500 ETF",type:"etf"},{ticker:"QQQ",name:"Nasdaq 100",type:"etf"},
  {ticker:"NVDA",name:"Nvidia",type:"stock"},{ticker:"AAPL",name:"Apple",type:"stock"},
  {ticker:"TSLA",name:"Tesla",type:"stock"},{ticker:"META",name:"Meta",type:"stock"},
  {ticker:"MSFT",name:"Microsoft",type:"stock"},{ticker:"AMZN",name:"Amazon",type:"stock"},
  {ticker:"GOOGL",name:"Alphabet",type:"stock"},
];
const POLY_KEYWORDS = ["fed","rate","recession","bitcoin","inflation","oil","iran","ukraine","china","tariff","gdp","crypto"];

// ── Commodities & Bonds via Yahoo Finance proxy ──
const COMMODITIES = [
  {id:"GC=F", name:"Gold",         unit:"oz",  category:"metal",  color:"#f59e0b"},
  {id:"SI=F", name:"Silver",       unit:"oz",  category:"metal",  color:"#94a3b8"},
  {id:"CL=F", name:"WTI Crude",    unit:"bbl", category:"energy", color:"#0ea569"},
  {id:"BZ=F", name:"Brent Crude",  unit:"bbl", category:"energy", color:"#059669"},
  {id:"NG=F", name:"Natural Gas",  unit:"MMBtu",category:"energy",color:"#f97316"},
  {id:"HG=F", name:"Copper",       unit:"lb",  category:"metal",  color:"#ea580c"},
  {id:"PL=F", name:"Platinum",     unit:"oz",  category:"metal",  color:"#6366f1"},
  {id:"ZW=F", name:"Wheat",        unit:"bu",  category:"agri",   color:"#ca8a04"},
  {id:"ZC=F", name:"Corn",         unit:"bu",  category:"agri",   color:"#eab308"},
  {id:"ZS=F", name:"Soybeans",     unit:"bu",  category:"agri",   color:"#84cc16"},
];

const BONDS = [
  {id:"^IRX", name:"3-Month T-Bill",  tenor:"3M",  color:"#2563eb"},
  {id:"^FVX", name:"5-Year Treasury", tenor:"5Y",  color:"#7c3aed"},
  {id:"^TNX", name:"10-Year Treasury",tenor:"10Y", color:"#0891b2"},
  {id:"^TYX", name:"30-Year Treasury",tenor:"30Y", color:"#0f766e"},
];

// Commodity SVG icons — inline so no external dep
const COMMODITY_ICONS = {
  "GC=F": (size=28)=>(
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#fef3c7"/>
      <rect x="6" y="12" width="20" height="11" rx="2" fill="#f59e0b"/>
      <rect x="9" y="10" width="14" height="4" rx="1.5" fill="#d97706"/>
      <rect x="8" y="20" width="16" height="2" rx="1" fill="#b45309" opacity="0.4"/>
      <text x="16" y="19.5" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#78350f">Au</text>
    </svg>
  ),
  "SI=F": (size=28)=>(
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#f1f5f9"/>
      <rect x="6" y="12" width="20" height="11" rx="2" fill="#94a3b8"/>
      <rect x="9" y="10" width="14" height="4" rx="1.5" fill="#64748b"/>
      <rect x="8" y="20" width="16" height="2" rx="1" fill="#475569" opacity="0.4"/>
      <text x="16" y="19.5" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#1e293b">Ag</text>
    </svg>
  ),
  "CL=F": (size=28)=>(
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#f0fdf4"/>
      <rect x="11" y="7" width="10" height="18" rx="3" fill="#15803d"/>
      <rect x="13" y="5" width="6" height="4" rx="1" fill="#166534"/>
      <rect x="9" y="21" width="14" height="3" rx="1.5" fill="#14532d"/>
      <circle cx="16" cy="16" r="3" fill="#bbf7d0"/>
    </svg>
  ),
  "BZ=F": (size=28)=>(
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#ecfdf5"/>
      <rect x="11" y="7" width="10" height="18" rx="3" fill="#059669"/>
      <rect x="13" y="5" width="6" height="4" rx="1" fill="#047857"/>
      <rect x="9" y="21" width="14" height="3" rx="1.5" fill="#065f46"/>
      <circle cx="16" cy="16" r="3" fill="#a7f3d0"/>
    </svg>
  ),
  "NG=F": (size=28)=>(
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#fff7ed"/>
      <path d="M16 6 C14 10 10 12 11 17 C12 21 14 22 16 23 C18 22 20 21 21 17 C22 12 18 10 16 6Z" fill="#f97316"/>
      <path d="M16 12 C15 14 13 15 14 18 C14.5 20 15.5 21 16 21 C16.5 21 17.5 20 18 18 C19 15 17 14 16 12Z" fill="#fbbf24"/>
      <circle cx="16" cy="19" r="2" fill="#fff7ed" opacity="0.6"/>
    </svg>
  ),
  "HG=F": (size=28)=>(
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#fff7ed"/>
      <circle cx="16" cy="16" r="9" fill="#c2410c" opacity="0.15"/>
      <circle cx="16" cy="16" r="7" fill="#ea580c"/>
      <text x="16" y="19.5" textAnchor="middle" fontSize="7" fontWeight="bold" fill="white">Cu</text>
    </svg>
  ),
  "PL=F": (size=28)=>(
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#eef2ff"/>
      <circle cx="16" cy="16" r="9" fill="#6366f1" opacity="0.15"/>
      <circle cx="16" cy="16" r="7" fill="#6366f1"/>
      <text x="16" y="19.5" textAnchor="middle" fontSize="7" fontWeight="bold" fill="white">Pt</text>
    </svg>
  ),
  "ZW=F": (size=28)=>(
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#fefce8"/>
      <line x1="16" y1="26" x2="16" y2="8" stroke="#ca8a04" strokeWidth="2"/>
      <ellipse cx="16" cy="9" rx="4" ry="6" fill="#eab308"/>
      <line x1="16" y1="16" x2="11" y2="13" stroke="#a16207" strokeWidth="1.5"/>
      <line x1="16" y1="19" x2="21" y2="16" stroke="#a16207" strokeWidth="1.5"/>
    </svg>
  ),
  "ZC=F": (size=28)=>(
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#fefce8"/>
      <line x1="16" y1="26" x2="16" y2="8" stroke="#65a30d" strokeWidth="2"/>
      <rect x="12" y="10" width="8" height="13" rx="2" fill="#eab308"/>
      <line x1="14" y1="10" x2="14" y2="23" stroke="#a16207" strokeWidth="0.8"/>
      <line x1="16" y1="10" x2="16" y2="23" stroke="#a16207" strokeWidth="0.8"/>
      <line x1="18" y1="10" x2="18" y2="23" stroke="#a16207" strokeWidth="0.8"/>
    </svg>
  ),
  "ZS=F": (size=28)=>(
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#f7fee7"/>
      <ellipse cx="12" cy="17" rx="5" ry="6" fill="#84cc16"/>
      <ellipse cx="20" cy="15" rx="5" ry="6" fill="#65a30d"/>
      <ellipse cx="16" cy="13" rx="4" ry="5" fill="#a3e635"/>
    </svg>
  ),
};

// Bond icon — same for all, differentiated by colour
const BondIcon = ({bond, size=28})=>(
  <div style={{width:size,height:size,borderRadius:size/3.5,background:`${bond.color}18`,border:`1px solid ${bond.color}35`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
    <svg width={size*0.55} height={size*0.55} viewBox="0 0 20 20" fill="none">
      <rect x="2" y="3" width="16" height="14" rx="2" stroke={bond.color} strokeWidth="1.5" fill="none"/>
      <line x1="5" y1="7" x2="15" y2="7" stroke={bond.color} strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="5" y1="10" x2="15" y2="10" stroke={bond.color} strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="5" y1="13" x2="11" y2="13" stroke={bond.color} strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  </div>
);

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmtPrice =(n)=>{if(!n&&n!==0)return"—";if(n>=10000)return n.toLocaleString("en-US",{maximumFractionDigits:0});if(n>=100)return n.toFixed(2);if(n>=1)return n.toFixed(3);return n.toFixed(5);};
const fmtPct   =(n)=>(!n&&n!==0)?"—":(n>=0?"+":"")+n.toFixed(2)+"%";
const fmtLarge =(n)=>{if(!n)return"—";if(n>=1e12)return"$"+(n/1e12).toFixed(2)+"T";if(n>=1e9)return"$"+(n/1e9).toFixed(2)+"B";if(n>=1e6)return"$"+(n/1e6).toFixed(2)+"M";return"$"+n.toLocaleString();};
const timeAgo  =(ts)=>{if(!ts)return"";const s=Math.floor(Date.now()/1000-ts);if(s<60)return s+"s ago";if(s<3600)return Math.floor(s/60)+"m ago";if(s<86400)return Math.floor(s/3600)+"h ago";return Math.floor(s/86400)+"d ago";};
const isCryptoQ=(q)=>q?.type==="crypto";

// ─── LOGO COMPONENTS ──────────────────────────────────────────────────────────
function StockLogo({ticker,size=34}){
  const [err,setErr]=useState(false);
  const url=tickerLogo(ticker);
  if(url&&!err) return(
    <div style={{width:size,height:size,borderRadius:size/3.5,overflow:"hidden",flexShrink:0,background:"#f8fafc",border:"1px solid #e2e8f0",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <img src={url} alt={ticker} style={{width:size*0.78,height:size*0.78,objectFit:"contain"}} onError={()=>setErr(true)}/>
    </div>
  );
  return(
    <div style={{width:size,height:size,borderRadius:size/3.5,background:"linear-gradient(135deg,#eff6ff,#dbeafe)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,border:"1px solid #bfdbfe"}}>
      <span style={{fontSize:Math.max(8,size*0.26),fontWeight:700,color:"#1d4ed8"}}>{ticker?.slice(0,4)}</span>
    </div>
  );
}

function CryptoLogo({imageUrl,symbol,size=34}){
  const [err,setErr]=useState(false);
  const colors={BTC:"#f7931a",ETH:"#627eea",SOL:"#9945ff",BNB:"#f3ba2f",XRP:"#00aae4",ADA:"#0033ad",DOGE:"#c2a633",AVAX:"#e84142"};
  const col=colors[symbol?.toUpperCase()]||"#7c3aed";
  if(imageUrl&&!err) return(
    <div style={{width:size,height:size,borderRadius:"50%",overflow:"hidden",flexShrink:0,background:`${col}12`,border:`1px solid ${col}25`,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <img src={imageUrl} alt={symbol} style={{width:size*0.78,height:size*0.78,objectFit:"contain"}} onError={()=>setErr(true)}/>
    </div>
  );
  return(
    <div style={{width:size,height:size,borderRadius:"50%",background:`${col}15`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,border:`1px solid ${col}25`}}>
      <span style={{fontSize:size*0.26,fontWeight:800,color:col}}>{symbol?.slice(0,3)}</span>
    </div>
  );
}

function AssetLogo({q,size=34}){
  if(!q)return null;
  if(q.type==="crypto") return <CryptoLogo imageUrl={q.image} symbol={q.symbol} size={size}/>;
  if(q.type==="commodity"){
    const Icon=COMMODITY_ICONS[q.id];
    if(Icon)return <div style={{flexShrink:0}}>{Icon(size)}</div>;
    return <div style={{width:size,height:size,borderRadius:size/3.5,background:`${q.color||"#f59e0b"}15`,border:`1px solid ${q.color||"#f59e0b"}30`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:Math.max(8,size*0.25),fontWeight:700,color:q.color||"#f59e0b"}}>{(q.id||"").replace("=F","").slice(0,4)}</span></div>;
  }
  if(q.type==="bond") return <BondIcon bond={q} size={size}/>;
  return <StockLogo ticker={q.ticker} size={size}/>;
}

// ─── SPARKLINE ────────────────────────────────────────────────────────────────
function Spark({up,w=80,h=32}){
  const seed=up?1:-1;
  const raw=Array.from({length:16},(_,i)=>(Math.sin(i*2.1+seed*0.9)+Math.cos(i*1.3)*0.4)*3);
  let acc=0;const cum=raw.map(v=>{acc+=v;return acc;});
  const mn=Math.min(...cum),mx=Math.max(...cum);
  const norm=cum.map(v=>((v-mn)/(mx-mn||1))*(h-4)+2);
  const pts=norm.map((y,i)=>`${(i/15)*w},${h-y}`).join(" ");
  const color=up?"#0ea569":"#e53e3e";
  const fid=`sf${up?"u":"d"}${w}${Math.random().toString(36).slice(2,5)}`;
  return(
    <svg width={w} height={h} style={{display:"block"}}>
      <defs><linearGradient id={fid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.15"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#${fid})`}/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}

// ─── CANVAS CHART ─────────────────────────────────────────────────────────────
function drawChart(canvas,data){
  if(!canvas||data.length<2)return;
  const ctx=canvas.getContext("2d");
  const W=canvas.width,H=canvas.height;
  ctx.clearRect(0,0,W,H);
  const prices=data.map(d=>d.c);
  const mn=Math.min(...prices),mx=Math.max(...prices);
  const pad={t:16,b:28,l:8,r:58};
  const cw=W-pad.l-pad.r,ch=H-pad.t-pad.b;
  const px=i=>pad.l+(i/(data.length-1))*cw;
  const py=v=>pad.t+(1-(v-mn)/(mx-mn||1))*ch;
  ctx.strokeStyle="#f1f5f9";ctx.lineWidth=1;
  for(let i=0;i<4;i++){
    const y=pad.t+(i/3)*ch;
    ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(W-pad.r,y);ctx.stroke();
    const val=mx-(i/3)*(mx-mn);
    ctx.fillStyle="#94a3b8";ctx.font="10px 'JetBrains Mono',monospace";ctx.textAlign="left";
    ctx.fillText(val>=100?val.toFixed(0):val>=1?val.toFixed(2):val.toFixed(4),W-pad.r+4,y+4);
  }
  const up=prices[prices.length-1]>=prices[0];
  const grad=ctx.createLinearGradient(0,pad.t,0,H-pad.b);
  grad.addColorStop(0,up?"rgba(14,165,105,0.18)":"rgba(229,62,62,0.18)");
  grad.addColorStop(1,"rgba(255,255,255,0)");
  ctx.beginPath();ctx.moveTo(px(0),H-pad.b);
  data.forEach((d,i)=>ctx.lineTo(px(i),py(d.c)));
  ctx.lineTo(px(data.length-1),H-pad.b);ctx.closePath();
  ctx.fillStyle=grad;ctx.fill();
  ctx.beginPath();ctx.strokeStyle=up?"#0ea569":"#e53e3e";ctx.lineWidth=2;ctx.lineJoin="round";
  data.forEach((d,i)=>i===0?ctx.moveTo(px(i),py(d.c)):ctx.lineTo(px(i),py(d.c)));
  ctx.stroke();
  ctx.fillStyle="#94a3b8";ctx.font="10px 'Plus Jakarta Sans',sans-serif";ctx.textAlign="center";
  const lc=Math.min(5,data.length);
  for(let i=0;i<lc;i++){
    const idx=Math.floor((i/(lc-1))*(data.length-1));
    const d=new Date(data[idx].t);
    ctx.fillText(d.toLocaleDateString("en-GB",{day:"2-digit",month:"short"}),px(idx),H-6);
  }
}

function PriceChart({q}){
  const RANGES=["1W","1M","3M","1Y","5Y"];
  const [data,setData]=useState([]);
  const [range,setRange]=useState("1M");
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(false);
  const canvasRef=useRef(null);
  const crypto=isCryptoQ(q);
  useEffect(()=>{
    setLoading(true);setData([]);setError(false);
    let cancelled=false;
    const load=async()=>{
      try{
        let chartData=[];
        if(crypto){
          const cgId=q.cgId;if(!cgId){setError(true);setLoading(false);return;}
          await new Promise(r=>setTimeout(r,300));
          const res=await fetch(`${COINGECKO}/coins/${cgId}/market_chart?vs_currency=usd&days=${CG_DAYS[range]||"30"}&precision=4`);
          if(!res.ok){setError(true);setLoading(false);return;}
          const d=await res.json();
          if(d.prices?.length>1){const step=Math.max(1,Math.floor(d.prices.length/200));chartData=d.prices.filter((_,i)=>i%step===0).map(([t,c])=>({t,c}));}
        } else if(q.type==="commodity"||q.type==="bond"){
          // Fallback: generate smooth demo chart from current price
          const points={"1W":7,"1M":30,"3M":90,"1Y":52,"5Y":60}[range]||30;
          const span={"1W":7,"1M":30,"3M":90,"1Y":365,"5Y":1825}[range]*86400000;
          const now2=Date.now();
          let val=q.c||100;
          const vol=q.type==="bond"?0.004:q.category==="metal"?0.007:q.category==="energy"?0.018:0.010;
          chartData=Array.from({length:points},(_,i)=>{
            val*=(1+(Math.random()-0.49)*vol);
            return{t:now2-span+(i/points)*span,c:Math.max(0.001,val)};
          });
        } else {
          const now=Math.floor(Date.now()/1000);
          const fromMap={"1W":now-604800,"1M":now-2592000,"3M":now-7776000,"1Y":now-31536000,"5Y":now-157680000};
          const resMap={"1W":"60","1M":"D","3M":"D","1Y":"W","5Y":"M"};
          if(!FINNHUB_KEY){const from=fromMap[range];let val=100;chartData=Array.from({length:60},(_,i)=>{val+=(Math.random()-0.48)*3;return{t:(from+(i/59)*(now-from))*1000,c:Math.max(10,val)};});}
          else{const res=await fetch(`${FINNHUB}/stock/candle?symbol=${q.ticker}&resolution=${resMap[range]}&from=${fromMap[range]}&to=${now}&token=${FINNHUB_KEY}`);const d=await res.json();if(d.s==="ok"&&d.c?.length>1)chartData=d.t.map((t,i)=>({t:t*1000,c:d.c[i]}));}
        }
        if(!cancelled){if(chartData.length>1)setData(chartData);else setError(true);setLoading(false);}
      }catch{if(!cancelled){setError(true);setLoading(false);}}
    };
    load();return()=>{cancelled=true;};
  },[q.id,range,crypto,q.cgId]); // eslint-disable-line
  useEffect(()=>{if(!loading&&data.length>1&&canvasRef.current)drawChart(canvasRef.current,data);},[data,loading]);
  const isUp=data.length>1&&data[data.length-1].c>=data[0].c;
  const pct=data.length>1?((data[data.length-1].c-data[0].c)/data[0].c*100).toFixed(2):null;
  return(
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <div style={{display:"flex",gap:3}}>{RANGES.map(r=><button key={r} onClick={()=>setRange(r)} style={{padding:"5px 11px",borderRadius:7,fontSize:12,fontWeight:600,border:"none",cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",background:range===r?(isUp?"#f0fdf4":"#fff5f5"):"transparent",color:range===r?(isUp?"#0ea569":"#e53e3e"):"#94a3b8",transition:"all 0.15s"}}>{r}</button>)}</div>
        {pct&&!loading&&!error&&<span style={{fontSize:13,fontWeight:700,color:isUp?"#0ea569":"#e53e3e"}}>{isUp?"↑":"↓"} {Math.abs(pct)}%</span>}
      </div>
      <div style={{position:"relative",height:190,background:"#fafbfc",borderRadius:10,overflow:"hidden"}}>
        {loading&&<div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8}}><span style={{display:"inline-block",width:22,height:22,border:"2.5px solid #e2e8f0",borderTopColor:"#2563eb",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/><span style={{fontSize:11,color:"#94a3b8"}}>Loading chart…</span></div>}
        {!loading&&error&&<div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6}}><span style={{fontSize:13,color:"#94a3b8"}}>Chart unavailable</span><span style={{fontSize:11,color:"#cbd5e1"}}>Try a different timeframe</span></div>}
        {!loading&&!error&&data.length>1&&<canvas ref={canvasRef} width={580} height={190} style={{width:"100%",height:190,display:"block",borderRadius:10}}/>}
      </div>
    </div>
  );
}

// ─── PIN BUTTON ───────────────────────────────────────────────────────────────
function PinBtn({id,pinned,onToggle,size="sm"}){
  const isPinned=pinned.has(id);
  const sz=size==="lg"?34:26;
  return(
    <button onClick={e=>{e.stopPropagation();onToggle(id);}}
      title={isPinned?"Remove from watchlist":"Add to watchlist"}
      style={{width:sz,height:sz,borderRadius:8,border:isPinned?"1px solid #fde68a":"1px solid #e2e8f0",cursor:"pointer",background:isPinned?"#fef9c3":"transparent",color:isPinned?"#ca8a04":"#d1d5db",fontSize:size==="lg"?18:14,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.15s"}}
      onMouseEnter={e=>{if(!isPinned){e.currentTarget.style.borderColor="#fde68a";e.currentTarget.style.color="#f59e0b";}}}
      onMouseLeave={e=>{if(!isPinned){e.currentTarget.style.borderColor="#e2e8f0";e.currentTarget.style.color="#d1d5db";}}}
    >★</button>
  );
}

// ─── ASSET MODAL ──────────────────────────────────────────────────────────────
function AssetModal({q,onClose,C,pinned,onToggle}){
  const [quote,setQuote]=useState(null);
  const [details,setDetails]=useState(null);
  const [loading,setLoading]=useState(true);
  const crypto=isCryptoQ(q);
  const isCommodity=q?.type==="commodity";
  const isBond=q?.type==="bond";
  const isPinned=pinned.has(q.id);
  useEffect(()=>{
    const load=async()=>{
      // Commodities and bonds — use data we already have from allQ (Yahoo proxy)
      if(isCommodity||isBond){
        setQuote({c:q.c,d:q.change||0,dp:q.dp||0,h:q.high||q.c,l:q.low||q.c,open:q.open||q.c});
        setDetails({name:q.name,unit:q.unit,category:q.category,tenor:q.tenor,color:q.color});
        setLoading(false);return;
      }
      try{
        if(crypto){
          const res=await fetch(`${COINGECKO}/coins/${q.cgId}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false`);
          const d=await res.json();const md=d.market_data;
          setQuote({c:md.current_price?.usd,d:md.price_change_24h,dp:md.price_change_percentage_24h,h:md.high_24h?.usd,l:md.low_24h?.usd});
          setDetails({name:d.name,marketCap:md.market_cap?.usd,volume24h:md.total_volume?.usd,ath:md.ath?.usd,athDate:md.ath_date?.usd?.slice(0,10),atl:md.atl?.usd,circulatingSupply:md.circulating_supply,totalSupply:md.total_supply,rank:d.market_cap_rank,description:d.description?.en?.replace(/<[^>]*>/g,"").split(".")[0]});
        } else {
          if(!FINNHUB_KEY){setQuote({c:q.c,d:q.c*(q.dp||0)/100,dp:q.dp||0,h:q.c*1.01,l:q.c*0.99,pc:q.c-(q.c*(q.dp||0)/100)});setDetails({name:q.name,exchange:"NASDAQ",industry:"Technology",marketCap:null,pe:null,eps:null,high52w:null,low52w:null,beta:null});setLoading(false);return;}
          const [qt,p,m]=await Promise.all([
            fetch(`${FINNHUB}/quote?symbol=${q.ticker}&token=${FINNHUB_KEY}`).then(r=>r.json()),
            fetch(`${FINNHUB}/stock/profile2?symbol=${q.ticker}&token=${FINNHUB_KEY}`).then(r=>r.json()),
            fetch(`${FINNHUB}/stock/metric?symbol=${q.ticker}&metric=all&token=${FINNHUB_KEY}`).then(r=>r.json()),
          ]);
          setQuote(qt);setDetails({name:p.name||q.name,exchange:p.exchange,industry:p.finnhubIndustry,marketCap:(p.marketCapitalization||0)*1e6,pe:m?.metric?.peNormalizedAnnual,eps:m?.metric?.epsNormalizedAnnual,high52w:m?.metric?.["52WeekHigh"],low52w:m?.metric?.["52WeekLow"],beta:m?.metric?.beta});
        }
      }catch(e){console.error(e);}
      setLoading(false);
    };load();
  },[q.id]); // eslint-disable-line
  const up=(quote?.dp||0)>=0;
  const Stat=({label,value,sub})=>(
    <div style={{background:C.bg,borderRadius:10,padding:"11px 13px"}}>
      <div style={{fontSize:10,fontWeight:700,color:C.faint,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:3}}>{label}</div>
      <div style={{fontSize:14,fontWeight:700,color:C.text,fontFamily:"'JetBrains Mono',monospace",wordBreak:"break-all"}}>{value||"—"}</div>
      {sub&&<div style={{fontSize:10,color:C.faint,marginTop:2}}>{sub}</div>}
    </div>
  );
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20,backdropFilter:"blur(6px)"}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:C.surface,borderRadius:20,width:"100%",maxWidth:660,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 24px 64px rgba(0,0,0,0.22)"}}>
        <div style={{padding:"16px 22px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,background:C.surface,zIndex:1,borderRadius:"20px 20px 0 0"}}>
          <AssetLogo q={q} size={42}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              <span style={{fontSize:17,fontWeight:800,color:C.text,letterSpacing:"-0.02em"}}>{details?.name||q.name}</span>
              <span style={{fontSize:11,fontWeight:700,color:C.muted,background:C.bg,padding:"2px 8px",borderRadius:6}}>{q.symbol||q.ticker}</span>
              {crypto&&details?.rank&&<span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:6,background:"#f5f3ff",color:"#7c3aed"}}>#{details.rank}</span>}
              {!crypto&&details?.exchange&&<span style={{fontSize:11,color:C.faint}}>{details.exchange}</span>}
            </div>
            {(details?.description||details?.industry)&&<div style={{fontSize:11,color:C.faint,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:360}}>{details.description||details.industry}</div>}
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,flexShrink:0}}>
            <PinBtn id={q.id} pinned={pinned} onToggle={onToggle} size="lg"/>
            <span style={{fontSize:9,fontWeight:700,letterSpacing:"0.06em",color:isPinned?C.amber:C.faint}}>{isPinned?"PINNED":"PIN"}</span>
          </div>
          <button onClick={onClose} style={{width:30,height:30,borderRadius:8,border:`1px solid ${C.border}`,background:"transparent",cursor:"pointer",color:C.muted,fontSize:16,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
        <div style={{padding:"18px 22px"}}>
          {loading?<div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:56,gap:10,color:C.muted,fontSize:13}}><span style={{display:"inline-block",width:20,height:20,border:`2.5px solid ${C.border}`,borderTopColor:C.accent,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>Loading…</div>
          :<>
            <div style={{display:"flex",alignItems:"flex-end",gap:12,marginBottom:16}}>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:34,fontWeight:800,color:C.text,letterSpacing:"-0.03em"}}>${fmtPrice(quote?.c)}</span>
              <div style={{paddingBottom:4}}>
                <span style={{fontSize:14,fontWeight:700,color:up?C.green:C.red}}>{up?"↑":"↓"} ${fmtPrice(Math.abs(quote?.d||0))} ({fmtPct(quote?.dp)})</span>
                <div style={{fontSize:11,color:C.faint}}>24h · USD</div>
              </div>
            </div>
            <PriceChart q={q}/>
            <div style={{marginTop:16}}>
              <div style={{fontSize:11,fontWeight:700,color:C.faint,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10}}>
                {isCommodity?"Commodity Data":isBond?"Bond Data":crypto?"Market Data":"Fundamentals"}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                {isCommodity&&<>
                  <Stat label="Price" value={"$"+fmtPrice(quote?.c)} />
                  <Stat label="24h Change" value={fmtPct(quote?.dp)} />
                  <Stat label="Category" value={details?.category?.charAt(0).toUpperCase()+(details?.category?.slice(1)||"")}/>
                  <Stat label="Day High" value={quote?.h?"$"+fmtPrice(quote.h):"—"}/>
                  <Stat label="Day Low" value={quote?.l?"$"+fmtPrice(quote.l):"—"}/>
                  <Stat label="Open" value={quote?.open?"$"+fmtPrice(quote.open):"—"}/>
                  <Stat label="Unit" value={"Per "+details?.unit}/>
                </>}
                {isBond&&<>
                  <Stat label="Yield" value={(quote?.c||0).toFixed(3)+"%"}/>
                  <Stat label="Change" value={fmtPct(quote?.dp)}/>
                  <Stat label="Tenor" value={details?.tenor}/>
                  <Stat label="Day High" value={quote?.h?(quote.h).toFixed(3)+"%":"—"}/>
                  <Stat label="Day Low" value={quote?.l?(quote.l).toFixed(3)+"%":"—"}/>
                  <Stat label="Open" value={quote?.open?(quote.open).toFixed(3)+"%":"—"}/>
                  <Stat label="Issuer" value="US Treasury"/>
                  <Stat label="Currency" value="USD"/>
                </>}
                {crypto&&<>
                  <Stat label="Market Cap" value={fmtLarge(details?.marketCap)}/>
                  <Stat label="24h Volume" value={fmtLarge(details?.volume24h)}/>
                  <Stat label="Rank" value={details?.rank?"#"+details.rank:"—"}/>
                  <Stat label="24h High" value={quote?.h?"$"+fmtPrice(quote.h):"—"}/>
                  <Stat label="24h Low" value={quote?.l?"$"+fmtPrice(quote.l):"—"}/>
                  <Stat label="All-Time High" value={details?.ath?"$"+fmtPrice(details.ath):"—"} sub={details?.athDate}/>
                  <Stat label="All-Time Low" value={details?.atl?"$"+fmtPrice(details.atl):"—"}/>
                  <Stat label="Circulating" value={details?.circulatingSupply?Number(details.circulatingSupply.toFixed(0)).toLocaleString()+" "+(q.symbol||""):"—"}/>
                  <Stat label="Total Supply" value={details?.totalSupply?Number(details.totalSupply.toFixed(0)).toLocaleString()+" "+(q.symbol||""):"Unlimited"}/>
                </>}
                {!isCommodity&&!isBond&&!crypto&&<>
                  <Stat label="Market Cap" value={fmtLarge(details?.marketCap)}/>
                  <Stat label="P/E Ratio" value={details?.pe?details.pe.toFixed(1):"—"}/>
                  <Stat label="EPS" value={details?.eps?"$"+details.eps.toFixed(2):"—"}/>
                  <Stat label="52W High" value={details?.high52w?"$"+fmtPrice(details.high52w):"—"}/>
                  <Stat label="52W Low" value={details?.low52w?"$"+fmtPrice(details.low52w):"—"}/>
                  <Stat label="Beta" value={details?.beta?details.beta.toFixed(2):"—"}/>
                  <Stat label="24h High" value={quote?.h?"$"+fmtPrice(quote.h):"—"}/>
                  <Stat label="24h Low" value={quote?.l?"$"+fmtPrice(quote.l):"—"}/>
                  <Stat label="Prev Close" value={quote?.pc?"$"+fmtPrice(quote.pc):"—"}/>
                </>}
              </div>
            </div>
          </>}
        </div>
      </div>
    </div>
  );
}

// ─── CUSTOMISE MODAL ──────────────────────────────────────────────────────────
function CustomiseModal({type,allQ,visible,onSave,onClose,C}){
  const [selected,setSelected]=useState(new Set(visible));
  const toggle=(id)=>{setSelected(prev=>{const next=new Set(prev);if(next.has(id))next.delete(id);else next.add(id);return next;});};
  const items=Object.values(allQ).filter(q=>{
    if(type==="stock")   return q.type==="stock"||q.type==="etf";
    if(type==="crypto")  return q.type==="crypto";
    if(type==="commodity")return q.type==="commodity";
    if(type==="bond")    return q.type==="bond";
    return false;
  });
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1001,padding:20,backdropFilter:"blur(6px)"}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:C.surface,borderRadius:20,width:"100%",maxWidth:520,maxHeight:"80vh",display:"flex",flexDirection:"column",boxShadow:"0 24px 64px rgba(0,0,0,0.22)"}}>
        <div style={{padding:"16px 22px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:15,fontWeight:700,color:C.text}}>Customise {type==="crypto"?"Crypto":"Stocks"} on Overview</div>
            <div style={{fontSize:12,color:C.faint,marginTop:2}}>Select which assets appear on the front page</div>
          </div>
          <button onClick={onClose} style={{width:30,height:30,borderRadius:8,border:`1px solid ${C.border}`,background:"transparent",cursor:"pointer",color:C.muted,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
        <div style={{overflowY:"auto",flex:1,padding:"12px 22px"}}>
          {items.map(q=>{
            const sym=q.symbol||q.ticker;
            const checked=selected.has(q.id);
            const up=(q.dp||0)>=0;
            return(
              <div key={q.id} onClick={()=>toggle(q.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 10px",borderRadius:10,marginBottom:4,cursor:"pointer",background:checked?C.accentBg:"transparent",border:`1px solid ${checked?C.accent:C.border}`,transition:"all 0.15s"}}>
                <AssetLogo q={q} size={30}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600,color:C.text}}>{q.name}</div>
                  <div style={{fontSize:11,color:C.faint}}>{sym}</div>
                </div>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:C.text}}>{isCryptoQ(q)?"$":""}{fmtPrice(q.c)}</span>
                <span style={{fontSize:11,fontWeight:700,color:up?C.green:C.red,minWidth:54,textAlign:"right"}}>{fmtPct(q.dp)}</span>
                <div style={{width:20,height:20,borderRadius:6,border:`2px solid ${checked?C.accent:C.border}`,background:checked?C.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {checked&&<svg width="10" height="10" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{padding:"14px 22px",borderTop:`1px solid ${C.border}`,display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{padding:"8px 16px",borderRadius:9,border:`1px solid ${C.border}`,background:"transparent",color:C.muted,fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,fontWeight:600,cursor:"pointer"}}>Cancel</button>
          <button onClick={()=>onSave([...selected])} style={{padding:"8px 20px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#2563eb,#7c3aed)",color:"white",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,fontWeight:600,cursor:"pointer",boxShadow:"0 2px 8px rgba(37,99,235,0.3)"}}>Save changes</button>
        </div>
      </div>
    </div>
  );
}

// ─── SCROLLABLE ASSET STRIP ───────────────────────────────────────────────────
function AssetStrip({items,onSelect,onPin,pinned,onCustomise,label,accent,C}){
  const ref=useRef(null);
  const scroll=(dir)=>{if(ref.current)ref.current.scrollBy({left:dir*220,behavior:"smooth"});};
  return(
    <div style={{...{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:16}}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:C.faint,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{label}</div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <button onClick={onCustomise} style={{padding:"4px 10px",borderRadius:7,border:`1px solid ${C.border}`,background:"transparent",fontSize:11,fontWeight:600,color:C.muted,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",display:"flex",alignItems:"center",gap:4}}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            Customise
          </button>
          <button onClick={()=>scroll(-1)} style={{width:26,height:26,borderRadius:7,border:`1px solid ${C.border}`,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.muted}}>‹</button>
          <button onClick={()=>scroll(1)} style={{width:26,height:26,borderRadius:7,border:`1px solid ${C.border}`,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.muted}}>›</button>
        </div>
      </div>
      <div ref={ref} style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:4,scrollbarWidth:"none",msOverflowStyle:"none"}}
        className="hide-scroll">
        {items.length===0&&<div style={{fontSize:13,color:C.faint,padding:"20px 0"}}>No assets selected — click Customise to add some.</div>}
        {items.map(q=>{
          const up=(q.dp||0)>=0;
          const sym=q.symbol||q.ticker;
          return(
            <div key={q.id} onClick={()=>onSelect(q)}
              style={{flexShrink:0,width:180,background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:14,cursor:"pointer",position:"relative",transition:"all 0.15s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="#bfdbfe";e.currentTarget.style.boxShadow="0 4px 16px rgba(37,99,235,0.08)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.boxShadow="none";}}>
              <div style={{position:"absolute",top:10,right:10}} onClick={e=>e.stopPropagation()}>
                <PinBtn id={q.id} pinned={pinned} onToggle={onPin}/>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <AssetLogo q={q} size={28}/>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:11,fontWeight:700,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sym}</div>
                  <div style={{fontSize:10,color:C.faint,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{q.name}</div>
                </div>
              </div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:16,fontWeight:700,color:C.text,marginBottom:4}}>{isCryptoQ(q)?"$":""}{fmtPrice(q.c)}</div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <span style={{fontSize:11,fontWeight:700,padding:"2px 6px",borderRadius:5,background:up?C.greenBg:C.redBg,color:up?C.green:C.red}}>{fmtPct(q.dp)}</span>
              </div>
              <div style={{marginTop:8}}><Spark up={up} w={148} h={30}/></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── GAINER / LOSER CARDS ─────────────────────────────────────────────────────
function GainerLoserSection({cryptoQ,onSelect,C}){
  const top100=Object.values(cryptoQ).filter(q=>q.rank&&q.rank<=100&&q.dp!=null);
  if(top100.length<2)return null;
  const sorted=[...top100].sort((a,b)=>(b.dp||0)-(a.dp||0));
  const gainer=sorted[0];
  const loser=sorted[sorted.length-1];
  const Card=({q,label,col,bg})=>{
    const up=(q.dp||0)>=0;
    return(
      <div onClick={()=>onSelect(q)} style={{flex:1,background:bg,border:`1px solid ${col}30`,borderRadius:12,padding:14,cursor:"pointer",transition:"all 0.15s"}}
        onMouseEnter={e=>{e.currentTarget.style.boxShadow=`0 4px 16px ${col}20`;}}
        onMouseLeave={e=>{e.currentTarget.style.boxShadow="none";}}>
        <div style={{fontSize:10,fontWeight:700,color:col,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10}}>{label}</div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          <CryptoLogo imageUrl={q.image} symbol={q.symbol} size={36}/>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:C.text}}>{q.name}</div>
            <div style={{fontSize:11,color:C.faint}}>{q.symbol} · #{q.rank}</div>
          </div>
        </div>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:20,fontWeight:800,color:C.text,marginBottom:4}}>${fmtPrice(q.c)}</div>
        <div style={{fontSize:16,fontWeight:800,color:col}}>{up?"↑":"↓"} {Math.abs(q.dp).toFixed(2)}%</div>
        <div style={{marginTop:8}}><Spark up={up} w={"100%"} h={32}/></div>
      </div>
    );
  };
  return(
    <div style={{display:"flex",gap:12}}>
      <Card q={gainer} label="📈 Top Gainer (24h)" col="#0ea569" bg="#f0fdf4"/>
      <Card q={loser}  label="📉 Top Loser (24h)"  col="#e53e3e" bg="#fff5f5"/>
    </div>
  );
}

// ─── TICKER TAPE ──────────────────────────────────────────────────────────────
function TickerTape({allQ,onSelect}){
  const items=Object.values(allQ).filter(q=>q.c).slice(0,30);
  return(
    <div style={{background:"#f0f4ff",borderBottom:"1px solid #e2e8f0",overflow:"hidden",height:32,display:"flex",alignItems:"center"}}>
      <style>{`.hide-scroll::-webkit-scrollbar{display:none} @keyframes scrolltape{0%{transform:translateX(0)}100%{transform:translateX(-50%)}} .tapew{display:flex;animation:scrolltape 80s linear infinite;white-space:nowrap;}`}</style>
      {items.length===0?<span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,color:"#94a3b8",paddingLeft:16}}>Loading…</span>
      :<div className="tapew">{[...items,...items].map((q,i)=>(
        <span key={i} onClick={()=>onSelect(q)} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"0 14px",fontSize:11,fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:500,cursor:"pointer"}}>
          {isCryptoQ(q)&&q.image?<img src={q.image} alt={q.symbol} style={{width:13,height:13,borderRadius:"50%"}}/>:null}
          <span style={{color:"#64748b"}}>{(q.symbol||q.ticker)?.slice(0,6)}</span>
          <span style={{color:"#1e293b"}}>{fmtPrice(q.c)}</span>
          <span style={{color:(q.dp||0)>=0?"#0ea569":"#e53e3e",fontWeight:600}}>{(q.dp||0)>=0?"↑":"↓"}{Math.abs(q.dp||0).toFixed(2)}%</span>
        </span>
      ))}</div>}
    </div>
  );
}

// ─── WATCHLIST STRIP ──────────────────────────────────────────────────────────
function WatchlistStrip({pinned,allQ,onSelect,onUnpin,C}){
  const items=[...pinned].map(id=>allQ[id]).filter(Boolean);
  return(
    <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"8px 22px",display:"flex",alignItems:"center",gap:8,overflowX:"auto",minHeight:44}} className="hide-scroll">
      <span style={{fontSize:10,fontWeight:700,color:C.faint,letterSpacing:"0.1em",textTransform:"uppercase",flexShrink:0}}>Watchlist</span>
      {items.length===0?<span style={{fontSize:12,color:C.faint}}>— click ★ on any asset or inside the modal to pin it here</span>
      :items.map(q=>{const up=(q.dp||0)>=0;const sym=q.symbol||q.ticker;return(
        <div key={q.id} onClick={()=>onSelect(q)}
          style={{display:"inline-flex",alignItems:"center",gap:7,padding:"5px 10px",borderRadius:10,background:C.bg,border:`1px solid ${C.border}`,cursor:"pointer",flexShrink:0,transition:"all 0.15s",position:"relative"}}
          onMouseEnter={e=>e.currentTarget.style.borderColor="#bfdbfe"} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
          <AssetLogo q={q} size={22}/>
          <div><div style={{fontSize:11,fontWeight:700,color:C.text,fontFamily:"'JetBrains Mono',monospace"}}>${fmtPrice(q.c)}</div><div style={{fontSize:10,color:up?C.green:C.red,fontWeight:600}}>{fmtPct(q.dp)}</div></div>
          <span style={{fontSize:10,fontWeight:700,color:C.muted}}>{sym?.slice(0,6)}</span>
          <button onClick={e=>{e.stopPropagation();onUnpin(q.id);}} style={{position:"absolute",top:-5,right:-5,width:16,height:16,borderRadius:"50%",background:"#e2e8f0",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:C.muted,fontWeight:700}}>✕</button>
        </div>
      );})}
    </div>
  );
}

// ─── DEMO DATA ────────────────────────────────────────────────────────────────
const mkStock=(ticker,name,c,dp,type="stock")=>({id:ticker,ticker,name,c,dp,type});
const DEMO_SQ={SPY:mkStock("SPY","S&P 500 ETF",524.38,0.24,"etf"),QQQ:mkStock("QQQ","Nasdaq 100",447.92,0.64,"etf"),NVDA:mkStock("NVDA","Nvidia",887.24,2.47),AAPL:mkStock("AAPL","Apple",189.30,-0.63),TSLA:mkStock("TSLA","Tesla",174.48,2.84),META:mkStock("META","Meta",512.63,1.45),MSFT:mkStock("MSFT","Microsoft",415.60,0.82),AMZN:mkStock("AMZN","Amazon",182.40,1.10),GOOGL:mkStock("GOOGL","Alphabet",162.30,0.55)};
const DEMO_CQ_LIST=[
  {id:"bitcoin",cgId:"bitcoin",symbol:"BTC",name:"Bitcoin",image:"https://assets.coingecko.com/coins/images/1/small/bitcoin.png",c:68420,dp:1.85,type:"crypto",rank:1},
  {id:"ethereum",cgId:"ethereum",symbol:"ETH",name:"Ethereum",image:"https://assets.coingecko.com/coins/images/279/small/ethereum.png",c:3280,dp:1.12,type:"crypto",rank:2},
  {id:"solana",cgId:"solana",symbol:"SOL",name:"Solana",image:"https://assets.coingecko.com/coins/images/4128/small/solana.png",c:142.50,dp:3.21,type:"crypto",rank:5},
  {id:"binancecoin",cgId:"binancecoin",symbol:"BNB",name:"BNB",image:"https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",c:412.80,dp:0.94,type:"crypto",rank:4},
  {id:"ripple",cgId:"ripple",symbol:"XRP",name:"XRP",image:"https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png",c:0.5821,dp:-0.43,type:"crypto",rank:6},
  {id:"cardano",cgId:"cardano",symbol:"ADA",name:"Cardano",image:"https://assets.coingecko.com/coins/images/975/small/cardano.png",c:0.4432,dp:1.23,type:"crypto",rank:9},
  {id:"dogecoin",cgId:"dogecoin",symbol:"DOGE",name:"Dogecoin",image:"https://assets.coingecko.com/coins/images/5/small/dogecoin.png",c:0.1621,dp:2.10,type:"crypto",rank:8},
  {id:"avalanche-2",cgId:"avalanche-2",symbol:"AVAX",name:"Avalanche",image:"https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png",c:34.82,dp:-1.20,type:"crypto",rank:12},
  {id:"polkadot",cgId:"polkadot",symbol:"DOT",name:"Polkadot",image:"https://assets.coingecko.com/coins/images/12171/small/polkadot.png",c:7.82,dp:0.54,type:"crypto",rank:14},
  {id:"chainlink",cgId:"chainlink",symbol:"LINK",name:"Chainlink",image:"https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png",c:14.21,dp:8.83,type:"crypto",rank:15},
  {id:"near",cgId:"near",symbol:"NEAR",name:"NEAR Protocol",image:"https://assets.coingecko.com/coins/images/10365/small/near.jpg",c:5.43,dp:-4.14,type:"crypto",rank:18},
  {id:"uniswap",cgId:"uniswap",symbol:"UNI",name:"Uniswap",image:"https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png",c:8.92,dp:-0.87,type:"crypto",rank:20},
  {id:"sui",cgId:"sui",symbol:"SUI",name:"Sui",image:"https://assets.coingecko.com/coins/images/26375/small/sui-ocean-square.png",c:1.82,dp:12.41,type:"crypto",rank:22},
  {id:"injective-protocol",cgId:"injective-protocol",symbol:"INJ",name:"Injective",image:"https://assets.coingecko.com/coins/images/12882/small/Secondary_Symbol.png",c:24.50,dp:-6.22,type:"crypto",rank:28},
];
const DEMO_CQ=Object.fromEntries(DEMO_CQ_LIST.map(c=>[c.id,c]));
const DEMO_NEWS=[{id:1,source:"Reuters",headline:"Fed officials signal caution on rate cuts as inflation stays sticky",datetime:Math.floor(Date.now()/1000)-1800,url:"#"},{id:2,source:"Bloomberg",headline:"Nvidia surges as data centre demand exceeds Wall Street estimates",datetime:Math.floor(Date.now()/1000)-3600,url:"#"},{id:3,source:"WSJ",headline:"Treasury yields climb as investors reassess Fed cut timeline",datetime:Math.floor(Date.now()/1000)-5400,url:"#"},{id:4,source:"FT",headline:"Private equity dry powder hits $2.6 trillion record high",datetime:Math.floor(Date.now()/1000)-7200,url:"#"},{id:5,source:"Bloomberg",headline:"Goldman raises S&P 500 year-end target to 5,600",datetime:Math.floor(Date.now()/1000)-9000,url:"#"},{id:6,source:"Reuters",headline:"Oil falls on demand concerns despite Middle East tensions",datetime:Math.floor(Date.now()/1000)-10800,url:"#"},{id:7,source:"CoinDesk",headline:"Bitcoin ETF inflows reach $500M in a single day for first time",datetime:Math.floor(Date.now()/1000)-14400,url:"#"}];
const DEMO_TWEETS=[{handle:"RaoulGMI",name:"Raoul Pal",text:"The Everything Code keeps playing out. Liquidity drives all assets. Watch the Fed balance sheet, not the rate.",likes:"12.8K",time:"2h"},{handle:"elerianm",name:"Mohamed El-Erian",text:"Today's CPI print will be closely watched. Any upside surprise risks a sharp repricing in rate expectations.",likes:"7.1K",time:"3h"},{handle:"LukeGromen",name:"Luke Gromen",text:"The bond market is telling you something equities haven't priced yet. Fiscal dominance is here.",likes:"5.9K",time:"4h"},{handle:"naval",name:"Naval Ravikant",text:"Inflation is a hidden tax on savers. The monetary system redistributes from the cautious to the leveraged.",likes:"31.4K",time:"1h"},{handle:"APompliano",name:"Anthony Pompliano",text:"Bitcoin is up on the day while the dollar weakens. This is the trade of the decade.",likes:"9.3K",time:"2h"},{handle:"zerohedge",name:"ZeroHedge",text:"JPMorgan cuts GDP forecast — stagflation risks rising, strategists warn.",likes:"6.4K",time:"3h"}];

// ─── RSS NEWS FEED ────────────────────────────────────────────────────────────
const RSS_SOURCES = [
  {id:"reuters",      label:"Reuters",       color:"#ff8000", category:"markets"},
  {id:"wsj",          label:"WSJ Markets",   color:"#0274b6", category:"markets"},
  {id:"ft",           label:"FT",            color:"#fff1e0", textColor:"#990f3d", category:"markets"},
  {id:"bloomberg",    label:"Bloomberg",     color:"#000000", category:"markets"},
  {id:"coindesk",     label:"CoinDesk",      color:"#0f5ca3", category:"crypto"},
  {id:"cointelegraph",label:"CoinTelegraph", color:"#2f9f6e", category:"crypto"},
  {id:"investing",    label:"Investing.com", color:"#e63329", category:"markets"},
];

function timeAgoRss(ts){
  if(!ts)return"";
  const s=Math.floor(Date.now()/1000-ts);
  if(s<60)return s+"s ago";
  if(s<3600)return Math.floor(s/60)+"m ago";
  if(s<86400)return Math.floor(s/3600)+"h ago";
  return Math.floor(s/86400)+"d ago";
}

function RssFeed({C}){
  const [activeSource,setActiveSource]=useState("all");
  const [feeds,setFeeds]=useState({}); // {sourceId: [items]}
  const [loading,setLoading]=useState({});
  const [lastUpdated,setLastUpdated]=useState(null);
  const [categoryFilter,setCategoryFilter]=useState("all"); // all|markets|crypto

  const fetchSource=useCallback(async(srcId)=>{
    setLoading(prev=>({...prev,[srcId]:true}));
    try{
      const res=await fetch(`/api/rss?source=${srcId}`);
      if(!res.ok)throw new Error("Feed error");
      const d=await res.json();
      setFeeds(prev=>({...prev,[srcId]:d.items||[]}));
    }catch{
      // Keep existing items or set empty
      setFeeds(prev=>({...prev,[srcId]:prev[srcId]||[]}));
    }
    setLoading(prev=>({...prev,[srcId]:false}));
  },[]);

  const fetchAll=useCallback(async()=>{
    await Promise.all(RSS_SOURCES.map(s=>fetchSource(s.id)));
    setLastUpdated(new Date());
  },[fetchSource]);

  useEffect(()=>{fetchAll();},[fetchAll]);
  // Refresh every 5 minutes
  useEffect(()=>{const iv=setInterval(fetchAll,5*60*1000);return()=>clearInterval(iv);},[fetchAll]);

  // Merge and sort all items
  const allItems=Object.entries(feeds)
    .flatMap(([srcId,items])=>items.map(item=>({...item,sourceId:srcId})))
    .sort((a,b)=>b.timestamp-a.timestamp);

  const filteredSources=RSS_SOURCES.filter(s=>categoryFilter==="all"||s.category===categoryFilter);

  const displayItems=activeSource==="all"
    ?allItems.filter(item=>filteredSources.some(s=>s.id===item.sourceId))
    :feeds[activeSource]||[];

  const isLoadingAny=Object.values(loading).some(Boolean);

  const srcMeta=(id)=>RSS_SOURCES.find(s=>s.id===id);

  return(
    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {/* Header */}
      <div style={{padding:"14px 18px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,borderRadius:9,background:"linear-gradient(135deg,#f97316,#dc2626)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/></svg>
          </div>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:C.text}}>Live News Feed</div>
            <div style={{fontSize:11,color:C.faint}}>
              {isLoadingAny?"Fetching latest…":lastUpdated?`Updated ${lastUpdated.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}`:""}
              {" · "}{displayItems.length} articles
            </div>
          </div>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {/* Category filter */}
          {["all","markets","crypto"].map(cat=>(
            <button key={cat} onClick={()=>{setCategoryFilter(cat);setActiveSource("all");}}
              style={{padding:"4px 10px",borderRadius:20,fontSize:11,fontWeight:600,border:"none",cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",
                background:categoryFilter===cat?"#1e293b":"#f1f5f9",
                color:categoryFilter===cat?"white":C.muted,
                textTransform:"capitalize",transition:"all 0.15s"}}>
              {cat}
            </button>
          ))}
          <button onClick={fetchAll} disabled={isLoadingAny}
            style={{padding:"5px 10px",borderRadius:8,border:`1px solid ${C.border}`,background:"transparent",fontSize:12,fontWeight:600,color:isLoadingAny?C.faint:C.muted,cursor:isLoadingAny?"default":"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",display:"flex",alignItems:"center",gap:4}}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{animation:isLoadingAny?"spin 1s linear infinite":"none"}}>
              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Source tabs */}
      <div style={{padding:"10px 18px",borderBottom:`1px solid ${C.border}`,display:"flex",gap:6,flexWrap:"wrap"}}>
        <button onClick={()=>setActiveSource("all")} style={{padding:"5px 12px",borderRadius:20,fontSize:11,fontWeight:700,border:"none",cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",background:activeSource==="all"?"#1e293b":"#f1f5f9",color:activeSource==="all"?"white":C.muted,transition:"all 0.15s"}}>
          All Sources
        </button>
        {filteredSources.map(s=>(
          <button key={s.id} onClick={()=>setActiveSource(s.id)}
            style={{padding:"5px 12px",borderRadius:20,fontSize:11,fontWeight:700,border:"none",cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",
              background:activeSource===s.id?s.color:"#f1f5f9",
              color:activeSource===s.id?(s.textColor||"white"):C.muted,
              transition:"all 0.15s",display:"flex",alignItems:"center",gap:5}}>
            {s.label}
            {loading[s.id]&&<span style={{display:"inline-block",width:8,height:8,border:"1.5px solid rgba(255,255,255,0.4)",borderTopColor:"white",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>}
            {!loading[s.id]&&feeds[s.id]&&<span style={{fontSize:9,opacity:0.7}}>{feeds[s.id].length}</span>}
          </button>
        ))}
      </div>

      {/* Articles list */}
      <div style={{flex:1,overflowY:"auto",maxHeight:680}}>
        {isLoadingAny&&displayItems.length===0&&(
          <div style={{padding:24,display:"flex",flexDirection:"column",gap:10}}>
            {Array.from({length:6}).map((_,i)=>(
              <div key={i} style={{padding:"12px",borderRadius:10,background:"#f8fafc",border:`1px solid ${C.border}`}}>
                <div style={{height:12,background:"#e2e8f0",borderRadius:6,marginBottom:8,width:`${70+Math.random()*25}%`,animation:"shimmer 1.2s ease-in-out infinite"}}/>
                <div style={{height:10,background:"#e2e8f0",borderRadius:6,width:"40%",animation:"shimmer 1.2s ease-in-out infinite"}}/>
              </div>
            ))}
          </div>
        )}

        {!isLoadingAny&&displayItems.length===0&&(
          <div style={{padding:40,textAlign:"center",color:C.faint,fontSize:13}}>
            No articles loaded — check your network or try refreshing.
          </div>
        )}

        {displayItems.map((item,i)=>{
          const src=srcMeta(item.sourceId);
          return(
            <a key={i} href={item.link} target="_blank" rel="noreferrer"
              style={{display:"flex",gap:12,padding:"12px 18px",borderBottom:`1px solid ${C.border}`,textDecoration:"none",transition:"background 0.12s",cursor:"pointer"}}
              onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              {/* Source badge */}
              <div style={{flexShrink:0,paddingTop:2}}>
                <span style={{display:"inline-block",padding:"2px 7px",borderRadius:6,fontSize:9,fontWeight:700,letterSpacing:"0.04em",
                  background:src?.color||"#64748b",color:src?.textColor||"white",whiteSpace:"nowrap"}}>
                  {src?.label||item.sourceId}
                </span>
              </div>
              {/* Title + time */}
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:600,color:C.text,lineHeight:1.5,marginBottom:3}}>{item.title}</div>
                {item.description&&<div style={{fontSize:11,color:C.faint,lineHeight:1.4,marginBottom:3,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{item.description}</div>}
                <div style={{fontSize:10,color:C.faint,fontFamily:"'JetBrains Mono',monospace"}}>{timeAgoRss(item.timestamp)}</div>
              </div>
              {/* Arrow */}
              <div style={{flexShrink:0,paddingTop:4,color:C.faint,fontSize:12}}>↗</div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

// ─── COMBINED SIGNALS TAB ─────────────────────────────────────────────────────
function SignalsTab({C,allQ,onSelect}){
  const [activePanel,setActivePanel]=useState("both");
  return(
    <div style={{animation:"fadeUp 0.25s ease"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
        <div style={{fontSize:13,fontWeight:700,color:C.text}}>Signals</div>
        <div style={{display:"flex",gap:4,marginLeft:"auto"}}>
          {[{id:"both",label:"Both"},{id:"reddit",label:"Reddit Sentiment"},{id:"news",label:"News Feed"}].map(p=>(
            <button key={p.id} onClick={()=>setActivePanel(p.id)} style={{
              padding:"5px 12px",borderRadius:8,fontSize:12,fontWeight:600,border:"none",
              cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",transition:"all 0.15s",
              background:activePanel===p.id?"#1e293b":"#f1f5f9",
              color:activePanel===p.id?"white":C.muted,
            }}>{p.label}</button>
          ))}
        </div>
      </div>
      {activePanel==="both"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,alignItems:"start"}}>
          <RedditSignals C={C} allQ={allQ} onSelect={onSelect}/>
          <RssFeed C={C}/>
        </div>
      )}
      {activePanel==="reddit"&&<RedditSignals C={C} allQ={allQ} onSelect={onSelect}/>}
      {activePanel==="news"&&<RssFeed C={C}/>}
    </div>
  );
}

// ─── REDDIT SIGNALS ───────────────────────────────────────────────────────────
const APEWISDOM = "/api/reddit";

const SUBREDDITS = [
  {id:"all-stocks",  label:"All Stock Subs",  type:"stock",  color:"#ff4500"},
  {id:"wallstreetbets",label:"r/WallStreetBets",type:"stock",color:"#ff4500"},
  {id:"stocks",      label:"r/stocks",         type:"stock",  color:"#ff6314"},
  {id:"investing",   label:"r/investing",      type:"stock",  color:"#ff7849"},
  {id:"all-crypto",  label:"All Crypto Subs",  type:"crypto", color:"#9945ff"},
  {id:"CryptoCurrency",label:"r/CryptoCurrency",type:"crypto",color:"#7c3aed"},
  {id:"SatoshiStreetBets",label:"r/SatoshiStreetBets",type:"crypto",color:"#627eea"},
];

function RedditSignals({C,allQ,onSelect}){
  const [filter,setFilter]=useState("all-stocks");
  const [data,setData]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(false);
  const [lastUpdated,setLastUpdated]=useState(null);

  const activeSub=SUBREDDITS.find(s=>s.id===filter)||SUBREDDITS[0];

  const fetchData=useCallback(async(f)=>{
    setLoading(true);setError(false);
    try{
      const res=await fetch(`${APEWISDOM}?filter=${f}`);
      if(!res.ok)throw new Error("API error");
      const d=await res.json();
      setData(d.results||[]);
      setLastUpdated(new Date());
    }catch{
      setError(true);
      // Fallback demo data
      setData([
        {rank:1,ticker:"NVDA",name:"Nvidia",mentions:"847",upvotes:"3241",rank_24h_ago:"2",mentions_24h_ago:"412"},
        {rank:2,ticker:"TSLA",name:"Tesla",mentions:"634",upvotes:"2187",rank_24h_ago:"1",mentions_24h_ago:"891"},
        {rank:3,ticker:"AAPL",name:"Apple",mentions:"521",upvotes:"1843",rank_24h_ago:"3",mentions_24h_ago:"498"},
        {rank:4,ticker:"META",name:"Meta",mentions:"418",upvotes:"1562",rank_24h_ago:"6",mentions_24h_ago:"201"},
        {rank:5,ticker:"AMZN",name:"Amazon",mentions:"387",upvotes:"1234",rank_24h_ago:"4",mentions_24h_ago:"412"},
        {rank:6,ticker:"SPY",name:"S&P 500 ETF",mentions:"341",upvotes:"987",rank_24h_ago:"5",mentions_24h_ago:"356"},
        {rank:7,ticker:"PLTR",name:"Palantir",mentions:"298",upvotes:"876",rank_24h_ago:"9",mentions_24h_ago:"143"},
        {rank:8,ticker:"AMD",name:"AMD",mentions:"276",upvotes:"812",rank_24h_ago:"7",mentions_24h_ago:"289"},
        {rank:9,ticker:"MSFT",name:"Microsoft",mentions:"254",upvotes:"743",rank_24h_ago:"8",mentions_24h_ago:"267"},
        {rank:10,ticker:"GME",name:"GameStop",mentions:"231",upvotes:"2341",rank_24h_ago:"14",mentions_24h_ago:"87"},
        {rank:11,ticker:"COIN",name:"Coinbase",mentions:"198",upvotes:"567",rank_24h_ago:"10",mentions_24h_ago:"212"},
        {rank:12,ticker:"HOOD",name:"Robinhood",mentions:"187",upvotes:"432",rank_24h_ago:"15",mentions_24h_ago:"65"},
        {rank:13,ticker:"QQQ",name:"Nasdaq ETF",mentions:"176",upvotes:"398",rank_24h_ago:"11",mentions_24h_ago:"189"},
        {rank:14,ticker:"NFLX",name:"Netflix",mentions:"165",upvotes:"376",rank_24h_ago:"13",mentions_24h_ago:"142"},
        {rank:15,ticker:"SMCI",name:"Super Micro",mentions:"154",upvotes:"512",rank_24h_ago:"20",mentions_24h_ago:"43"},
      ]);
    }
    setLoading(false);
  },[]);

  useEffect(()=>{fetchData(filter);},[filter,fetchData]);
  // Refresh every 15 minutes
  useEffect(()=>{const iv=setInterval(()=>fetchData(filter),15*60*1000);return()=>clearInterval(iv);},[filter,fetchData]);

  const rankChange=(item)=>{
    const prev=parseInt(item.rank_24h_ago||"0");
    const curr=parseInt(item.rank||"0");
    if(!prev||!curr)return null;
    return prev-curr; // positive = climbed (was higher number before)
  };

  const topMover=data.length>0?[...data].sort((a,b)=>rankChange(b)-rankChange(a))[0]:null;

  // Try to match ticker to known quote for logo
  const getQ=(ticker)=>allQ[ticker]||Object.values(allQ).find(q=>q.ticker===ticker||q.symbol===ticker);

  const card={background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:20};
  const redditOrange="#ff4500";

  return(
    <div style={{animation:"fadeUp 0.25s ease"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {/* Reddit logo */}
          <div style={{width:36,height:36,borderRadius:10,background:"#ff4500",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="white"><circle cx="10" cy="10" r="10" fill="#ff4500"/><path d="M16.67 10a1.46 1.46 0 0 0-2.47-1 7.12 7.12 0 0 0-3.85-1.23l.65-3.08 2.13.45a1 1 0 1 0 1-.95 1 1 0 0 0-.96.68l-2.38-.5a.16.16 0 0 0-.19.12l-.73 3.44a7.14 7.14 0 0 0-3.89 1.23 1.46 1.46 0 1 0-1.61 2.39 2.87 2.87 0 0 0 0 .44c0 2.24 2.61 4.06 5.83 4.06s5.83-1.82 5.83-4.06a2.87 2.87 0 0 0 0-.44 1.46 1.46 0 0 0 .64-1.55zm-10 1.81a1 1 0 1 1 1 1 1 1 0 0 1-1-1zm5.58 2.64a3.56 3.56 0 0 1-2.25.63 3.56 3.56 0 0 1-2.25-.63.17.17 0 0 1 .23-.23 3.24 3.24 0 0 0 2 .5 3.24 3.24 0 0 0 2-.5.17.17 0 0 1 .23.23zm-.17-1.64a1 1 0 1 1 1-1 1 1 0 0 1-1 1z" fill="white"/></svg>
          </div>
          <div>
            <div style={{fontSize:15,fontWeight:800,color:C.text,letterSpacing:"-0.02em"}}>Reddit Sentiment</div>
            <div style={{fontSize:11,color:C.faint}}>
              {loading?"Fetching latest data…":error?"Demo data (API unavailable)":lastUpdated?`Updated ${lastUpdated.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}`:""}
              {" · "}via <a href="https://apewisdom.io" target="_blank" rel="noreferrer" style={{color:redditOrange}}>ApeWisdom</a>
            </div>
          </div>
        </div>
        <button onClick={()=>fetchData(filter)} disabled={loading} style={{padding:"6px 14px",borderRadius:9,border:`1px solid ${C.border}`,background:"transparent",fontSize:12,fontWeight:600,color:loading?C.faint:C.muted,cursor:loading?"default":"pointer",fontFamily:C.sans,display:"flex",alignItems:"center",gap:6}}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{animation:loading?"spin 1s linear infinite":"none"}}>
            <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Refresh
        </button>
      </div>

      {/* Subreddit filter tabs */}
      <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
        {SUBREDDITS.map(s=>(
          <button key={s.id} onClick={()=>setFilter(s.id)} style={{
            padding:"6px 12px",borderRadius:20,fontSize:12,fontWeight:600,border:"none",cursor:"pointer",
            fontFamily:C.sans,transition:"all 0.15s",
            background:filter===s.id?s.color:"#f1f5f9",
            color:filter===s.id?"white":C.muted,
          }}>{s.label}</button>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:16}}>
        {/* Main mentions table */}
        <div style={card}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:C.faint,marginBottom:14,fontFamily:C.sans,display:"flex",alignItems:"center",gap:8}}>
            Most Mentioned · {activeSub.label}
            {!loading&&data.length>0&&<span style={{fontSize:10,background:"#fff1ee",color:redditOrange,padding:"1px 7px",borderRadius:10,fontWeight:600}}>{data.length} tickers</span>}
          </div>

          {loading&&(
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {Array.from({length:8}).map((_,i)=>(
                <div key={i} style={{height:52,borderRadius:10,background:"#f1f5f9",animation:"shimmer 1.2s ease-in-out infinite",opacity:0.6}}/>
              ))}
            </div>
          )}

          {!loading&&data.slice(0,20).map((item,i)=>{
            const chg=rankChange(item);
            const q=getQ(item.ticker);
            const mentionChange=parseInt(item.mentions||0)-parseInt(item.mentions_24h_ago||0);
            return(
              <div key={i} className="rh" onClick={()=>q&&onSelect(q)}
                style={{display:"flex",alignItems:"center",gap:10,padding:"9px 8px",borderRadius:10,marginBottom:3,cursor:q?"pointer":"default"}}>
                {/* Rank */}
                <div style={{width:28,textAlign:"center",flexShrink:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:C.muted,fontFamily:C.mono}}>#{item.rank}</div>
                </div>
                {/* Rank change */}
                <div style={{width:24,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {chg>0&&<span style={{fontSize:10,fontWeight:700,color:C.green}}>▲{chg}</span>}
                  {chg<0&&<span style={{fontSize:10,fontWeight:700,color:C.red}}>▼{Math.abs(chg)}</span>}
                  {chg===0&&<span style={{fontSize:10,color:C.faint}}>—</span>}
                </div>
                {/* Logo if we have it */}
                {q?<AssetLogo q={q} size={30}/>
                 :<div style={{width:30,height:30,borderRadius:8,background:`#ff450015`,border:"1px solid #ff450030",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <span style={{fontSize:9,fontWeight:700,color:redditOrange}}>{item.ticker?.slice(0,4)}</span>
                  </div>
                }
                {/* Name + ticker */}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:C.text}}>{item.name||item.ticker}</div>
                  <div style={{fontSize:11,color:C.faint,fontFamily:C.mono}}>{item.ticker}</div>
                </div>
                {/* Mentions */}
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:C.text}}>{Number(item.mentions).toLocaleString()} <span style={{fontSize:10,color:C.faint,fontWeight:400}}>mentions</span></div>
                  <div style={{fontSize:11,color:mentionChange>=0?C.green:C.red,fontWeight:600}}>
                    {mentionChange>=0?"+":""}{mentionChange} vs yesterday
                  </div>
                </div>
                {/* Upvotes */}
                <div style={{textAlign:"right",minWidth:60,flexShrink:0}}>
                  <div style={{fontSize:12,color:C.muted,display:"flex",alignItems:"center",gap:3,justifyContent:"flex-end"}}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    {Number(item.upvotes).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right column — top mover + stats */}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>

          {/* Top mover card */}
          {topMover&&!loading&&(
            <div style={{...card,background:"linear-gradient(135deg,#fff8f6,#fff1ee)",borderColor:"#fed7c3"}}>
              <div style={{fontSize:10,fontWeight:700,color:redditOrange,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:12}}>🚀 Biggest Climber</div>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                {(()=>{const q=getQ(topMover.ticker);return q?<AssetLogo q={q} size={36}/>:<div style={{width:36,height:36,borderRadius:10,background:"#ff450020",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:11,fontWeight:700,color:redditOrange}}>{topMover.ticker?.slice(0,4)}</span></div>;})()}
                <div>
                  <div style={{fontSize:15,fontWeight:800,color:C.text}}>{topMover.name||topMover.ticker}</div>
                  <div style={{fontSize:11,color:C.faint,fontFamily:C.mono}}>{topMover.ticker}</div>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <div style={{background:"white",borderRadius:10,padding:"10px 12px"}}>
                  <div style={{fontSize:10,fontWeight:700,color:C.faint,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:2}}>Rank now</div>
                  <div style={{fontSize:18,fontWeight:800,color:C.text,fontFamily:C.mono}}>#{topMover.rank}</div>
                </div>
                <div style={{background:"white",borderRadius:10,padding:"10px 12px"}}>
                  <div style={{fontSize:10,fontWeight:700,color:C.faint,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:2}}>Was rank</div>
                  <div style={{fontSize:18,fontWeight:800,color:C.muted,fontFamily:C.mono}}>#{topMover.rank_24h_ago}</div>
                </div>
                <div style={{background:"white",borderRadius:10,padding:"10px 12px",gridColumn:"1/-1"}}>
                  <div style={{fontSize:10,fontWeight:700,color:C.faint,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:2}}>Mentions today</div>
                  <div style={{fontSize:18,fontWeight:800,color:redditOrange,fontFamily:C.mono}}>{Number(topMover.mentions).toLocaleString()}</div>
                  <div style={{fontSize:11,color:C.green,fontWeight:600,marginTop:2}}>+{rankChange(topMover)} rank positions ↑</div>
                </div>
              </div>
            </div>
          )}

          {/* What is this */}
          <div style={{...card,background:C.bg}}>
            <div style={{fontSize:11,fontWeight:700,color:C.faint,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10}}>About this feed</div>
            <p style={{fontSize:12,color:C.muted,lineHeight:1.7,marginBottom:10}}>
              Live sentiment data from Reddit's top finance communities. Mentions are counted from posts and comments in the last 24 hours. Rankings update every 15 minutes.
            </p>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {[
                {sub:"r/wallstreetbets",desc:"Retail traders, options, memes"},
                {sub:"r/stocks",desc:"Long-term investing discussion"},
                {sub:"r/investing",desc:"Portfolio strategy & analysis"},
                {sub:"r/CryptoCurrency",desc:"Crypto news & discussion"},
              ].map(({sub,desc})=>(
                <div key={sub} style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:redditOrange,flexShrink:0}}/>
                  <div>
                    <span style={{fontSize:12,fontWeight:600,color:C.text}}>{sub}</span>
                    <span style={{fontSize:11,color:C.faint}}> — {desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Heatmap-style top 5 */}
          {!loading&&data.length>0&&(
            <div style={card}>
              <div style={{fontSize:11,fontWeight:700,color:C.faint,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:12}}>Mention share · Top 5</div>
              {(()=>{
                const top5=data.slice(0,5);
                const totalMentions=top5.reduce((sum,d)=>sum+parseInt(d.mentions||0),0);
                return top5.map((item,i)=>{
                  const pct=totalMentions>0?Math.round(parseInt(item.mentions||0)/totalMentions*100):0;
                  const colors=["#ff4500","#ff6314","#ff7849","#ff9472","#ffb8a0"];
                  return(
                    <div key={i} style={{marginBottom:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                        <span style={{fontSize:12,fontWeight:600,color:C.text}}>{item.ticker}</span>
                        <span style={{fontSize:12,fontWeight:600,color:C.muted,fontFamily:C.mono}}>{pct}%</span>
                      </div>
                      <div style={{height:6,background:"#f1f5f9",borderRadius:99,overflow:"hidden"}}>
                        <div style={{width:`${pct}%`,height:"100%",background:colors[i],borderRadius:99,transition:"width 0.5s"}}/>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App(){
  const [tab,setTab]=useState("overview");
  const [clock,setClock]=useState(new Date());
  const [stockQ,setStockQ]=useState({});
  const [cryptoQ,setCryptoQ]=useState({});
  const [commodityQ,setCommodityQ]=useState({});
  const [bondQ,setBondQ]=useState({});
  const [searchedQ,setSearchedQ]=useState({});
  const [news,setNews]=useState([]);
  const [poly,setPoly]=useState([]);
  const [brief,setBrief]=useState("");
  const [briefing,setBriefing]=useState(false);
  const [briefDone,setBriefDone]=useState(false);
  const [modal,setModal]=useState(null);
  const [search,setSearch]=useState("");
  const [searching,setSearching]=useState(false);
  const [cryptoSearch,setCryptoSearch]=useState("");
  const [customiseType,setCustomiseType]=useState(null); // "stock"|"crypto"|null
  const [pinned,setPinned]=useState(()=>{try{return new Set(JSON.parse(localStorage.getItem("am_pinned")||"[]"));}catch{return new Set();}});
  // Visible IDs on overview — stored in localStorage
  const [visibleStocks,setVisibleStocks]=useState(()=>{try{const s=localStorage.getItem("am_vis_stocks");return s?JSON.parse(s):Object.keys(DEMO_SQ);}catch{return Object.keys(DEMO_SQ);}});
  const [visibleCrypto,setVisibleCrypto]=useState(()=>{try{const s=localStorage.getItem("am_vis_crypto");return s?JSON.parse(s):["bitcoin","ethereum","solana","binancecoin","ripple","cardano","dogecoin","avalanche-2"];}catch{return ["bitcoin","ethereum","solana","binancecoin","ripple","cardano","dogecoin","avalanche-2"];}});
  const [visibleCommodities,setVisibleCommodities]=useState(()=>{try{const s=localStorage.getItem("am_vis_comm");return s?JSON.parse(s):["GC=F","SI=F","CL=F","NG=F","HG=F","ZW=F"];}catch{return ["GC=F","SI=F","CL=F","NG=F","HG=F","ZW=F"];}});
  const [visibleBonds,setVisibleBonds]=useState(()=>{try{const s=localStorage.getItem("am_vis_bonds");return s?JSON.parse(s):["^IRX","^FVX","^TNX","^TYX"];}catch{return ["^IRX","^FVX","^TNX","^TYX"];}});
  const searchRef=useRef(null);
  const isDemo=!FINNHUB_KEY;
  const allQ={...stockQ,...cryptoQ,...commodityQ,...bondQ,...searchedQ};

  useEffect(()=>{try{localStorage.setItem("am_pinned",JSON.stringify([...pinned]));}catch{};},[pinned]);
  useEffect(()=>{try{localStorage.setItem("am_vis_stocks",JSON.stringify(visibleStocks));}catch{};},[visibleStocks]);
  useEffect(()=>{try{localStorage.setItem("am_vis_crypto",JSON.stringify(visibleCrypto));}catch{};},[visibleCrypto]);
  useEffect(()=>{try{localStorage.setItem("am_vis_comm",JSON.stringify(visibleCommodities));}catch{};},[visibleCommodities]);
  useEffect(()=>{try{localStorage.setItem("am_vis_bonds",JSON.stringify(visibleBonds));}catch{};},[visibleBonds]);

  const togglePin=useCallback((id)=>{setPinned(prev=>{const next=new Set(prev);if(next.has(id))next.delete(id);else next.add(id);return next;});},[]);

  useEffect(()=>{const t=setInterval(()=>setClock(new Date()),1000);return()=>clearInterval(t);},[]);

  // ── Auto-generate briefing on load once data arrives ──
  const briefGenerated=useRef(false);
  useEffect(()=>{
    if(briefGenerated.current)return;
    if(Object.keys(stockQ).length>0&&Object.keys(cryptoQ).length>0&&news.length>0){
      briefGenerated.current=true;
      generateBriefing(stockQ,cryptoQ,news,poly,[]);
    }
  },[stockQ,cryptoQ,news,poly]); // eslint-disable-line

  const handleSearch=async(e)=>{
    if(e.key!=="Enter"||!search.trim())return;
    const raw=search.trim().toUpperCase();
    setSearching(true);
    const cryptoMatch=Object.values(cryptoQ).find(q=>q.symbol===raw);
    if(cryptoMatch){setModal(cryptoMatch);setSearch("");setSearching(false);return;}
    if(!FINNHUB_KEY){const q={id:raw,ticker:raw,name:raw,c:150,dp:0.5,type:"stock"};setSearchedQ(prev=>({...prev,[raw]:q}));setModal(q);setSearch("");setSearching(false);return;}
    try{
      const r=await fetch(`${FINNHUB}/quote?symbol=${raw}&token=${FINNHUB_KEY}`);
      const d=await r.json();
      if(d.c&&d.c>0){const q={id:raw,ticker:raw,name:raw,c:d.c,dp:d.dp||0,type:"stock"};setSearchedQ(prev=>({...prev,[raw]:q}));setModal(q);setSearch("");}
      else alert(`"${raw}" not found. Try AAPL, NFLX, BTC, SOL…`);
    }catch{const q={id:raw,ticker:raw,name:raw,c:0,dp:0,type:"stock"};setSearchedQ(prev=>({...prev,[raw]:q}));setModal(q);setSearch("");}
    setSearching(false);
  };

  const fetchStocks=useCallback(async()=>{
    if(isDemo){setStockQ(DEMO_SQ);return;}
    try{
      const res=await Promise.all(STOCK_WATCHLIST.map(async w=>{
        const r=await fetch(`${FINNHUB}/quote?symbol=${w.ticker}&token=${FINNHUB_KEY}`);
        const d=await r.json();
        return{id:w.ticker,ticker:w.ticker,name:w.name,type:w.type,c:d.c,dp:d.dp||0,h:d.h,l:d.l,pc:d.pc};
      }));
      const m={};res.forEach(r=>{m[r.id]=r;});setStockQ(m);
    }catch{setStockQ(DEMO_SQ);}
  },[isDemo]);

  const fetchCrypto=useCallback(async()=>{
    if(isDemo){setCryptoQ(DEMO_CQ);return;}
    try{
      const res=await fetch(`${COINGECKO}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false&price_change_percentage=24h`);
      const coins=await res.json();
      if(!Array.isArray(coins))return;
      const m={};
      coins.forEach(coin=>{
        m[coin.id]={id:coin.id,cgId:coin.id,symbol:(coin.symbol||"").toUpperCase(),name:coin.name,image:coin.image,c:coin.current_price,dp:coin.price_change_percentage_24h||0,type:"crypto",rank:coin.market_cap_rank,marketCap:coin.market_cap};
      });
      setCryptoQ(m);
      // If user hasn't customised crypto yet, update visible to use loaded IDs
      setVisibleCrypto(prev=>{
        const loaded=Object.keys(m);
        // keep only IDs that exist in loaded data
        const valid=prev.filter(id=>loaded.includes(id));
        return valid.length>0?valid:loaded.slice(0,8);
      });
    }catch(e){console.error("Crypto fetch error:",e);}
  },[isDemo]);

  const fetchNews=useCallback(async()=>{
    if(isDemo){setNews(DEMO_NEWS);return;}
    try{const r=await fetch(`${FINNHUB}/news?category=general&token=${FINNHUB_KEY}`);const d=await r.json();setNews((d||[]).slice(0,20));}
    catch{setNews(DEMO_NEWS);}
  },[isDemo]);

  const fetchCommodities=useCallback(async()=>{
    const DEMO_COMM={};
    const demos=[
      {id:"GC=F",name:"Gold",      c:3321.40,dp:0.82,unit:"oz", category:"metal", color:"#f59e0b"},
      {id:"SI=F",name:"Silver",    c:32.84,  dp:1.14,unit:"oz", category:"metal", color:"#94a3b8"},
      {id:"CL=F",name:"WTI Crude", c:61.28,  dp:-1.23,unit:"bbl",category:"energy",color:"#0ea569"},
      {id:"BZ=F",name:"Brent Crude",c:64.82, dp:-0.98,unit:"bbl",category:"energy",color:"#059669"},
      {id:"NG=F",name:"Natural Gas",c:3.42,  dp:2.31,unit:"MMBtu",category:"energy",color:"#f97316"},
      {id:"HG=F",name:"Copper",    c:4.68,   dp:0.54,unit:"lb", category:"metal", color:"#ea580c"},
      {id:"PL=F",name:"Platinum",  c:982.40, dp:-0.32,unit:"oz",category:"metal", color:"#6366f1"},
      {id:"ZW=F",name:"Wheat",     c:548.25, dp:-0.87,unit:"bu",category:"agri",  color:"#ca8a04"},
      {id:"ZC=F",name:"Corn",      c:464.50, dp:0.43,unit:"bu", category:"agri",  color:"#eab308"},
      {id:"ZS=F",name:"Soybeans",  c:1024.75,dp:1.02,unit:"bu", category:"agri",  color:"#84cc16"},
    ];
    demos.forEach(d=>DEMO_COMM[d.id]={...d,type:"commodity"});
    if(isDemo){setCommodityQ(DEMO_COMM);return;}
    try{
      const results=await Promise.all(COMMODITIES.map(async c=>{
        try{
          const r=await fetch(`/api/yahoo?symbol=${encodeURIComponent(c.id)}`);
          const d=await r.json();
          if(d.price)return{id:c.id,name:c.name,unit:c.unit,category:c.category,color:c.color,type:"commodity",c:d.price,dp:d.changePct||0,change:d.change||0,high:d.high,low:d.low,open:d.open,currency:d.currency};
        }catch{}
        return DEMO_COMM[c.id]||null;
      }));
      const m={};results.filter(Boolean).forEach(r=>{m[r.id]=r;});
      if(Object.keys(m).length>0)setCommodityQ(m);
      else setCommodityQ(DEMO_COMM);
    }catch{setCommodityQ(DEMO_COMM);}
  },[isDemo]);

  const fetchBonds=useCallback(async()=>{
    const DEMO_BONDS={};
    const demos=[
      {id:"^IRX",name:"3-Month T-Bill", tenor:"3M", c:4.32,dp:-0.02,color:"#2563eb"},
      {id:"^FVX",name:"5-Year Treasury",tenor:"5Y", c:4.08,dp:0.04, color:"#7c3aed"},
      {id:"^TNX",name:"10-Year Treasury",tenor:"10Y",c:4.42,dp:0.06,color:"#0891b2"},
      {id:"^TYX",name:"30-Year Treasury",tenor:"30Y",c:4.78,dp:0.03,color:"#0f766e"},
    ];
    demos.forEach(d=>DEMO_BONDS[d.id]={...d,type:"bond"});
    if(isDemo){setBondQ(DEMO_BONDS);return;}
    try{
      const results=await Promise.all(BONDS.map(async b=>{
        try{
          const r=await fetch(`/api/yahoo?symbol=${encodeURIComponent(b.id)}`);
          const d=await r.json();
          if(d.price)return{id:b.id,name:b.name,tenor:b.tenor,color:b.color,type:"bond",c:d.price,dp:d.changePct||0,change:d.change||0};
        }catch{}
        return DEMO_BONDS[b.id]||null;
      }));
      const m={};results.filter(Boolean).forEach(r=>{m[r.id]=r;});
      if(Object.keys(m).length>0)setBondQ(m);
      else setBondQ(DEMO_BONDS);
    }catch{setBondQ(DEMO_BONDS);}
  },[isDemo]);

  const fetchPoly=useCallback(async()=>{
    try{
      const r=await fetch(`${POLYMARKET_API}/markets?active=true&order=volumeNum&ascending=false&limit=50`);
      const d=await r.json();const raw=Array.isArray(d)?d:(d.data||[]);
      const filtered=raw.filter(m=>POLY_KEYWORDS.some(k=>(m.question||"").toLowerCase().includes(k))).slice(0,12).map(m=>{
        let yes=null;try{const op=JSON.parse(m.outcomePrices||"[]");yes=Math.round(parseFloat(op[0])*100);}catch{}
        return{id:m.id,question:m.question,yes,no:yes!==null?100-yes:null,volume:m.volumeNum?"$"+(m.volumeNum>=1e6?(m.volumeNum/1e6).toFixed(1)+"M":(m.volumeNum/1e3).toFixed(0)+"K"):"—",endDate:(m.endDate||"").slice(0,10)};
      }).filter(m=>m.yes!==null);
      setPoly(filtered.length?filtered:getDemoPoly());
    }catch{setPoly(getDemoPoly());}
  },[]);

  function getDemoPoly(){return[{id:1,question:"Fed cuts rates at June 2025 FOMC",yes:31,no:69,volume:"$18.7M",endDate:"2025-06-18"},{id:2,question:"Bitcoin reaches $100K by end of 2025",yes:54,no:46,volume:"$22.3M",endDate:"2025-12-31"},{id:3,question:"US enters recession by Q3 2025",yes:22,no:78,volume:"$9.1M",endDate:"2025-10-01"},{id:4,question:"Russia-Ukraine ceasefire signed in 2025",yes:38,no:62,volume:"$11.4M",endDate:"2025-12-31"},{id:5,question:"Iranian regime falls by end of 2025",yes:12,no:88,volume:"$4.2M",endDate:"2025-12-31"},{id:6,question:"Oil exceeds $100/barrel in 2025",yes:18,no:82,volume:"$3.9M",endDate:"2025-12-31"}];}

  useEffect(()=>{
    fetchStocks();fetchCrypto();fetchCommodities();fetchBonds();fetchNews();fetchPoly();
    const iv=[
      setInterval(fetchStocks,30000),
      setInterval(fetchCrypto,60000),
      setInterval(fetchCommodities,60000),
      setInterval(fetchBonds,60000),
      setInterval(fetchNews,300000),
      setInterval(fetchPoly,120000),
    ];
    return()=>iv.forEach(clearInterval);
  },[fetchStocks,fetchCrypto,fetchCommodities,fetchBonds,fetchNews,fetchPoly]);

  // ── AI Briefing — accepts data directly so it can be called on load ──
  async function generateBriefing(sQ,cQ,nws,ply,_cong){
    setBriefing(true);setBrief("");setBriefDone(false);
    const sq=sQ||stockQ,cq=cQ||cryptoQ,nw=nws||news,pl=ply||poly;
    const topStocks=Object.values(sq).slice(0,4).map(q=>`${q.ticker} ${fmtPrice(q.c)} (${fmtPct(q.dp)})`).join(", ");
    const topCrypto=Object.values(cq).slice(0,4).map(q=>`${q.symbol} ${fmtPrice(q.c)} (${fmtPct(q.dp)})`).join(", ");
    const topComm=Object.values(commodityQ).slice(0,3).map(q=>`${q.name} $${fmtPrice(q.c)} (${fmtPct(q.dp)})`).join(", ");
    const nStr=nw.slice(0,5).map(n=>`• ${n.headline}`).join("\n");
    const pStr=pl.slice(0,4).map(p=>`• "${p.question}" YES ${p.yes}%`).join("\n");
    const prompt=`You are a senior market strategist. Write a 4-5 sentence intelligence briefing for sophisticated investors covering: the dominant market/crypto theme today, key commodity moves, what prediction markets are pricing in, and one key risk. Be direct — no filler.\n\nStocks: ${topStocks}\nCrypto: ${topCrypto}\nCommodities: ${topComm}\n\nNews:\n${nStr}\n\nPolymarket:\n${pStr}`;
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:prompt}]})});
      const data=await res.json();setBrief(data.content?.map(b=>b.text||"").join("")||"Unable to generate.");
    }catch{setBrief("AI briefing unavailable — check API connection.");}
    setBriefing(false);setBriefDone(true);
  }

  const TABS=["overview","markets","crypto","commodities","bonds","watchlist","polymarket","signals"];

  const C={bg:"#f8fafc",surface:"#ffffff",border:"#e2e8f0",text:"#1e293b",muted:"#64748b",faint:"#94a3b8",accent:"#2563eb",accentBg:"#eff6ff",green:"#0ea569",greenBg:"#f0fdf4",red:"#e53e3e",redBg:"#fff5f5",amber:"#d97706",amberBg:"#fffbeb",sans:"'Plus Jakarta Sans',sans-serif",mono:"'JetBrains Mono',monospace"};
  const card={background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:20};
  const secTitle={fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:C.faint,marginBottom:14,fontFamily:C.sans};

  const pinnedItems=[...pinned].map(id=>allQ[id]).filter(Boolean);
  const pinnedStocks=pinnedItems.filter(q=>q.type==="stock"||q.type==="etf");
  const pinnedCrypto=pinnedItems.filter(q=>q.type==="crypto");
  const pinnedCommodities=pinnedItems.filter(q=>q.type==="commodity");
  const pinnedBonds=pinnedItems.filter(q=>q.type==="bond");

  // Resolve visible items from IDs
  const visibleStockItems=visibleStocks.map(id=>allQ[id]).filter(Boolean);
  const visibleCryptoItems=visibleCrypto.map(id=>allQ[id]).filter(Boolean);
  const visibleCommodityItems=visibleCommodities.map(id=>allQ[id]).filter(Boolean);
  const visibleBondItems=visibleBonds.map(id=>allQ[id]).filter(Boolean);

  const cryptoList=Object.values(cryptoQ).filter(q=>!cryptoSearch||q.name.toLowerCase().includes(cryptoSearch.toLowerCase())||q.symbol.toLowerCase().includes(cryptoSearch.toLowerCase()));

  const StockRow=({q})=>(
    <div className="rh" style={{display:"flex",alignItems:"center",gap:9,padding:"8px",borderRadius:8,marginBottom:2}} onClick={()=>setModal(q)}>
      <StockLogo ticker={q.ticker} size={34}/>
      <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:600,color:C.text}}>{q.name}</div><div style={{fontSize:11,color:C.faint}}>{q.ticker}</div></div>
      <Spark up={(q.dp||0)>=0} w={50} h={24}/>
      <div style={{textAlign:"right",minWidth:76}}><div style={{fontSize:13,fontWeight:700,color:C.text,fontFamily:C.mono}}>{fmtPrice(q.c)}</div><div style={{fontSize:11,fontWeight:600,color:(q.dp||0)>=0?C.green:C.red,fontFamily:C.mono}}>{fmtPct(q.dp)}</div></div>
      <PinBtn id={q.id} pinned={pinned} onToggle={togglePin}/>
    </div>
  );

  const CryptoRow=({q})=>{const up=(q.dp||0)>=0;return(
    <div className="rh" style={{display:"flex",alignItems:"center",gap:9,padding:"8px",borderRadius:8,marginBottom:2}} onClick={()=>setModal(q)}>
      <CryptoLogo imageUrl={q.image} symbol={q.symbol} size={34}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{fontSize:13,fontWeight:600,color:C.text}}>{q.name}</div>{q.rank&&<span style={{fontSize:9,color:C.faint,background:C.bg,padding:"1px 5px",borderRadius:4,border:`1px solid ${C.border}`}}>#{q.rank}</span>}</div>
        <div style={{fontSize:11,color:C.faint}}>{q.symbol}</div>
      </div>
      <Spark up={up} w={50} h={24}/>
      <div style={{textAlign:"right",minWidth:84}}><div style={{fontSize:13,fontWeight:700,color:C.text,fontFamily:C.mono}}>${fmtPrice(q.c)}</div><div style={{fontSize:11,fontWeight:600,color:up?C.green:C.red,fontFamily:C.mono}}>{fmtPct(q.dp)}</div></div>
      <PinBtn id={q.id} pinned={pinned} onToggle={togglePin}/>
    </div>
  );};

  const CommodityRow=({q})=>{
    const up=(q.dp||0)>=0;
    const Icon=COMMODITY_ICONS[q.id];
    return(
      <div className="rh" style={{display:"flex",alignItems:"center",gap:9,padding:"8px",borderRadius:8,marginBottom:2}} onClick={()=>setModal(q)}>
        {Icon?<div style={{flexShrink:0}}>{Icon(34)}</div>
          :<div style={{width:34,height:34,borderRadius:9,background:`${q.color}15`,border:`1px solid ${q.color}30`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:9,fontWeight:700,color:q.color}}>{q.id.replace("=F","").slice(0,4)}</span></div>}
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:600,color:C.text}}>{q.name}</div>
          <div style={{fontSize:11,color:C.faint,textTransform:"capitalize"}}>{q.category} · per {q.unit}</div>
        </div>
        <Spark up={up} w={50} h={24}/>
        <div style={{textAlign:"right",minWidth:80}}>
          <div style={{fontSize:13,fontWeight:700,color:C.text,fontFamily:C.mono}}>${fmtPrice(q.c)}</div>
          <div style={{fontSize:11,fontWeight:600,color:up?C.green:C.red,fontFamily:C.mono}}>{fmtPct(q.dp)}</div>
        </div>
        <PinBtn id={q.id} pinned={pinned} onToggle={togglePin}/>
      </div>
    );
  };

  const BondRow=({q})=>{
    const up=(q.dp||0)>=0;
    return(
      <div className="rh" style={{display:"flex",alignItems:"center",gap:9,padding:"8px",borderRadius:8,marginBottom:2}} onClick={()=>setModal(q)}>
        <BondIcon bond={q} size={34}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:600,color:C.text}}>{q.name}</div>
          <div style={{fontSize:11,color:C.faint}}>US Treasury · {q.tenor}</div>
        </div>
        <div style={{flex:0,minWidth:120,textAlign:"center"}}>
          <div style={{height:4,background:C.bg,borderRadius:99,overflow:"hidden",width:100,margin:"0 auto"}}>
            <div style={{width:`${Math.min(100,((q.c||0)/6)*100)}%`,height:"100%",background:q.color,borderRadius:99}}/>
          </div>
          <div style={{fontSize:10,color:C.faint,marginTop:2}}>yield gauge</div>
        </div>
        <div style={{textAlign:"right",minWidth:72}}>
          <div style={{fontSize:15,fontWeight:700,color:q.color,fontFamily:C.mono}}>{(q.c||0).toFixed(2)}%</div>
          <div style={{fontSize:11,fontWeight:600,color:up?C.green:C.red,fontFamily:C.mono}}>{fmtPct(q.dp)}</div>
        </div>
        <PinBtn id={q.id} pinned={pinned} onToggle={togglePin}/>
      </div>
    );
  };

  return(
    <div style={{background:C.bg,minHeight:"100vh",color:C.text,fontFamily:C.sans}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px;height:4px;background:#f1f5f9}
        ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:4px}
        .hide-scroll::-webkit-scrollbar{display:none}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .rh:hover{background:#f1f5f9!important;cursor:pointer}
        .ch:hover{box-shadow:0 4px 20px rgba(37,99,235,0.08)!important;border-color:#bfdbfe!important}
        a{color:inherit;text-decoration:none} a:hover{color:#2563eb}
      `}</style>

      {/* HEADER */}
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"0 22px",display:"flex",alignItems:"center",height:58,gap:14,position:"sticky",top:0,zIndex:100,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
          <div style={{width:26,height:26,background:"linear-gradient(135deg,#2563eb,#7c3aed)",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
          </div>
          <span style={{fontSize:15,fontWeight:800,color:C.text,letterSpacing:"-0.03em"}}>AlternoMetric</span>
        </div>
        <div style={{display:"flex",gap:1}}>
          {TABS.map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{padding:"5px 10px",borderRadius:7,fontSize:12,fontWeight:600,fontFamily:C.sans,cursor:"pointer",border:"none",transition:"all 0.15s",background:tab===t?(t==="watchlist"?"#fef9c3":C.accentBg):"transparent",color:tab===t?(t==="watchlist"?C.amber:C.accent):C.muted,textTransform:"capitalize",display:"flex",alignItems:"center",gap:4}}>
              {t==="watchlist"&&"★ "}{t}
              {t==="watchlist"&&pinned.size>0&&<span style={{background:C.amber,color:"white",borderRadius:10,padding:"1px 5px",fontSize:9,fontWeight:700}}>{pinned.size}</span>}
            </button>
          ))}
        </div>
        <div style={{flex:1,maxWidth:280,position:"relative"}}>
          <svg style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.faint} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input ref={searchRef} value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={handleSearch}
            placeholder="Search any stock or crypto… Enter to open"
            style={{width:"100%",padding:"7px 10px 7px 26px",borderRadius:9,border:`1px solid ${C.border}`,background:C.bg,fontSize:12,color:C.text,fontFamily:C.sans,outline:"none",transition:"border-color 0.15s"}}
            onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
          {searching&&<span style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",display:"inline-block",width:11,height:11,border:`2px solid ${C.border}`,borderTopColor:C.accent,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0,marginLeft:"auto"}}>
          {isDemo&&<span style={{fontSize:11,fontWeight:600,padding:"3px 9px",background:C.amberBg,color:C.amber,borderRadius:20,border:"1px solid #fde68a"}}>Demo</span>}
          <div style={{textAlign:"right"}}><div style={{fontSize:12,fontWeight:600,color:C.text,fontFamily:C.mono}}>{clock.toLocaleTimeString("en-GB")}</div><div style={{fontSize:10,color:C.faint}}>{clock.toLocaleDateString("en-GB",{weekday:"short",day:"2-digit",month:"short"})}</div></div>
          <div style={{width:7,height:7,borderRadius:"50%",background:C.green,boxShadow:"0 0 0 3px #dcfce7",animation:"shimmer 2s infinite"}}/>
        </div>
      </div>

      <TickerTape allQ={allQ} onSelect={setModal}/>
      <WatchlistStrip pinned={pinned} allQ={allQ} onSelect={setModal} onUnpin={togglePin} C={C}/>

      {modal&&<AssetModal q={modal} onClose={()=>setModal(null)} C={C} pinned={pinned} onToggle={togglePin}/>}
      {customiseType&&<CustomiseModal type={customiseType} allQ={allQ} visible={customiseType==="stock"?visibleStocks:customiseType==="crypto"?visibleCrypto:customiseType==="commodity"?visibleCommodities:visibleBonds}
        onSave={(ids)=>{
          if(customiseType==="stock")setVisibleStocks(ids);
          else if(customiseType==="crypto")setVisibleCrypto(ids);
          else if(customiseType==="commodity")setVisibleCommodities(ids);
          else setVisibleBonds(ids);
          setCustomiseType(null);
        }}
        onClose={()=>setCustomiseType(null)} C={C}/>}

      <div style={{maxWidth:1200,margin:"0 auto",padding:"20px"}}>

        {/* ══ OVERVIEW ══ */}
        {tab==="overview"&&<div style={{animation:"fadeUp 0.25s ease"}}>

          {/* AI Briefing — auto-generates on load */}
          <div style={{...card,marginBottom:16,background:briefDone?"linear-gradient(135deg,#eff6ff,#f5f3ff)":C.surface,borderColor:briefDone?"#bfdbfe":C.border}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:brief||briefing?14:0}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:30,height:30,borderRadius:9,background:"linear-gradient(135deg,#2563eb,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                </div>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:C.text}}>AI Morning Briefing</div>
                  <div style={{fontSize:11,color:C.faint}}>{briefing?"Generating now…":briefDone?"Updated just now · Powered by Claude":"Auto-generates when market data loads"}</div>
                </div>
              </div>
              <button onClick={()=>generateBriefing()} disabled={briefing} style={{padding:"7px 16px",borderRadius:9,fontSize:13,fontWeight:600,fontFamily:C.sans,cursor:briefing?"default":"pointer",border:"none",background:briefing?"#e2e8f0":"linear-gradient(135deg,#2563eb,#7c3aed)",color:briefing?C.muted:"white",boxShadow:briefing?"none":"0 2px 8px rgba(37,99,235,0.3)"}}>
                {briefing?"Generating…":"↻ Refresh"}
              </button>
            </div>
            {briefing&&<div style={{display:"flex",alignItems:"center",gap:8,color:C.muted,fontSize:13}}><span style={{display:"inline-block",width:14,height:14,border:"2px solid #e2e8f0",borderTopColor:C.accent,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>Analysing live market data…</div>}
            {brief&&<p style={{fontSize:14,lineHeight:1.8,color:C.text}}>{brief}</p>}
            {!brief&&!briefing&&<p style={{fontSize:13,color:C.faint,fontStyle:"italic"}}>Loading market data — your briefing will appear automatically…</p>}
          </div>

          {/* Scrollable stocks strip */}
          <div style={{marginBottom:14}}>
            <AssetStrip items={visibleStockItems} onSelect={setModal} onPin={togglePin} pinned={pinned} onCustomise={()=>setCustomiseType("stock")} label="Markets" accent={C.accent} C={C}/>
          </div>

          {/* Scrollable crypto strip */}
          <div style={{marginBottom:14}}>
            <AssetStrip items={visibleCryptoItems} onSelect={setModal} onPin={togglePin} pinned={pinned} onCustomise={()=>setCustomiseType("crypto")} label="Crypto" accent="#7c3aed" C={C}/>
          </div>

          {/* Scrollable commodity strip */}
          <div style={{marginBottom:14}}>
            <AssetStrip items={visibleCommodityItems} onSelect={setModal} onPin={togglePin} pinned={pinned} onCustomise={()=>setCustomiseType("commodity")} label="Commodities" accent="#f59e0b" C={C}/>
          </div>

          {/* Scrollable bond strip */}
          <div style={{marginBottom:14}}>
            <AssetStrip items={visibleBondItems} onSelect={setModal} onPin={togglePin} pinned={pinned} onCustomise={()=>setCustomiseType("bond")} label="Government Bonds · Yield %" accent="#0891b2" C={C}/>
          </div>
          <div style={{marginBottom:14}}>
            <GainerLoserSection cryptoQ={cryptoQ} onSelect={setModal} C={C}/>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div style={card}>
              <div style={secTitle}>Headlines</div>
              {news.slice(0,6).map((n,i)=>(
                <div key={i} className="rh" style={{display:"flex",gap:10,padding:"8px",borderRadius:8,marginBottom:2,alignItems:"flex-start"}}>
                  <span style={{fontSize:10,fontWeight:700,color:C.accent,background:C.accentBg,padding:"2px 7px",borderRadius:6,flexShrink:0,marginTop:1}}>{(n.source||"NEWS").slice(0,7)}</span>
                  <a href={n.url||"#"} target="_blank" rel="noreferrer" style={{flex:1,fontSize:12,lineHeight:1.45,color:C.text,fontWeight:500}}>{n.headline}</a>
                  <span style={{fontSize:11,color:C.faint,flexShrink:0,marginTop:1}}>{timeAgo(n.datetime)}</span>
                </div>
              ))}
            </div>
            <div style={card}>
              <div style={secTitle}>Polymarket Odds</div>
              {poly.slice(0,5).map(p=>(
                <div key={p.id} style={{padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                  <div style={{fontSize:12,color:C.text,fontWeight:500,marginBottom:6,lineHeight:1.35}}>{p.question}</div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{flex:1,height:5,background:"#f1f5f9",borderRadius:99,overflow:"hidden"}}><div style={{width:`${p.yes}%`,height:"100%",borderRadius:99,background:p.yes>60?C.green:p.yes>35?"#f59e0b":C.red}}/></div>
                    <span style={{fontFamily:C.mono,fontSize:12,fontWeight:700,color:p.yes>50?C.green:C.amber,minWidth:32,textAlign:"right"}}>{p.yes}%</span>
                    <span style={{fontSize:10,color:C.faint}}>{p.volume}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>}

        {/* ══ MARKETS ══ */}
        {tab==="markets"&&<div style={{animation:"fadeUp 0.25s ease"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
            {Object.values(stockQ).slice(0,4).map(q=>{const up=(q.dp||0)>=0;return(
              <div key={q.id} style={{...card,padding:16,cursor:"pointer",position:"relative"}} className="ch" onClick={()=>setModal(q)}>
                <div style={{position:"absolute",top:12,right:12}} onClick={e=>e.stopPropagation()}><PinBtn id={q.id} pinned={pinned} onToggle={togglePin}/></div>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><StockLogo ticker={q.ticker} size={28}/><div><div style={{fontSize:11,fontWeight:700,color:C.text}}>{q.ticker}</div><div style={{fontSize:10,color:C.faint}}>{q.name}</div></div></div>
                <div style={{fontFamily:C.mono,fontSize:20,fontWeight:700,color:C.text,marginBottom:4}}>{fmtPrice(q.c)}</div>
                <span style={{fontSize:11,fontWeight:700,padding:"2px 7px",borderRadius:6,background:up?C.greenBg:C.redBg,color:up?C.green:C.red,display:"inline-block",marginBottom:8}}>{fmtPct(q.dp)}</span>
                <Spark up={up} w={130} h={34}/>
              </div>
            );})}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div style={card}><div style={secTitle}>All Stocks & ETFs</div>{Object.values(stockQ).map(q=><StockRow key={q.id} q={q}/>)}</div>
            <div style={card}>
              <div style={secTitle}>Market News</div>
              {news.map((n,i)=>(
                <div key={i} className="rh" style={{display:"flex",gap:10,padding:"8px",borderRadius:8,marginBottom:2,alignItems:"flex-start"}}>
                  <span style={{fontSize:10,fontWeight:700,color:C.accent,background:C.accentBg,padding:"2px 7px",borderRadius:6,flexShrink:0,marginTop:1}}>{(n.source||"").slice(0,7)}</span>
                  <a href={n.url||"#"} target="_blank" rel="noreferrer" style={{flex:1,fontSize:12,lineHeight:1.45,color:C.text,fontWeight:500}}>{n.headline}</a>
                  <span style={{fontSize:11,color:C.faint,flexShrink:0}}>{timeAgo(n.datetime)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>}

        {/* ══ CRYPTO ══ */}
        {tab==="crypto"&&<div style={{animation:"fadeUp 0.25s ease"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
            {Object.values(cryptoQ).slice(0,4).map(q=>{const up=(q.dp||0)>=0;return(
              <div key={q.id} style={{...card,padding:16,cursor:"pointer",position:"relative"}} className="ch" onClick={()=>setModal(q)}>
                <div style={{position:"absolute",top:12,right:12}} onClick={e=>e.stopPropagation()}><PinBtn id={q.id} pinned={pinned} onToggle={togglePin}/></div>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><CryptoLogo imageUrl={q.image} symbol={q.symbol} size={28}/><div><div style={{fontSize:11,fontWeight:700,color:C.text}}>{q.symbol}</div><div style={{fontSize:10,color:C.faint}}>{q.name}</div></div></div>
                <div style={{fontFamily:C.mono,fontSize:20,fontWeight:700,color:C.text,marginBottom:4}}>${fmtPrice(q.c)}</div>
                <span style={{fontSize:11,fontWeight:700,padding:"2px 7px",borderRadius:6,background:up?C.greenBg:C.redBg,color:up?C.green:C.red,display:"inline-block",marginBottom:8}}>{fmtPct(q.dp)}</span>
                <Spark up={up} w={130} h={34}/>
              </div>
            );})}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div style={card}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                <div style={secTitle}>All Crypto <span style={{fontSize:10,background:"#f5f3ff",color:"#7c3aed",padding:"1px 6px",borderRadius:4,marginLeft:4,fontWeight:600,letterSpacing:0}}>{Object.keys(cryptoQ).length} coins</span></div>
              </div>
              <div style={{position:"relative",marginBottom:12}}>
                <svg style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}} width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={C.faint} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input value={cryptoSearch} onChange={e=>setCryptoSearch(e.target.value)} placeholder="Filter coins…" style={{width:"100%",padding:"6px 10px 6px 24px",borderRadius:8,border:`1px solid ${C.border}`,background:C.bg,fontSize:12,color:C.text,fontFamily:C.sans,outline:"none"}}/>
              </div>
              <div style={{maxHeight:600,overflowY:"auto"}}>
                {cryptoList.slice(0,100).map(q=><CryptoRow key={q.id} q={q}/>)}
                {cryptoList.length>100&&<div style={{fontSize:12,color:C.faint,textAlign:"center",padding:"12px 0"}}>Showing top 100 — filter to narrow down</div>}
              </div>
            </div>
            <div>
              <div style={{...card,marginBottom:14}}>
                <div style={secTitle}>Top Gainer & Loser (24h · Top 100)</div>
                <GainerLoserSection cryptoQ={cryptoQ} onSelect={setModal} C={C}/>
              </div>
              <div style={card}>
                <div style={secTitle}>Polymarket — Crypto & Macro</div>
                {poly.slice(0,6).map((p,i)=>(
                  <div key={i} style={{padding:"9px 0",borderBottom:`1px solid ${C.border}`}}>
                    <div style={{fontSize:12,color:C.text,fontWeight:500,marginBottom:7,lineHeight:1.35}}>{p.question}</div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{flex:1,height:5,background:"#f1f5f9",borderRadius:99,overflow:"hidden"}}><div style={{width:`${p.yes}%`,height:"100%",borderRadius:99,background:p.yes>60?C.green:p.yes>35?"#f59e0b":C.red}}/></div>
                      <span style={{fontFamily:C.mono,fontSize:12,fontWeight:700,color:p.yes>50?C.green:C.amber,minWidth:32,textAlign:"right"}}>{p.yes}%</span>
                      <span style={{fontSize:10,color:C.faint,minWidth:48,textAlign:"right"}}>{p.volume}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>}

        {/* ══ WATCHLIST ══ */}
        {tab==="watchlist"&&<div style={{animation:"fadeUp 0.25s ease"}}>
          {pinnedItems.length===0?(
            <div style={{...card,textAlign:"center",padding:60}}>
              <div style={{fontSize:40,marginBottom:16}}>★</div>
              <div style={{fontSize:18,fontWeight:700,color:C.text,marginBottom:8}}>Your watchlist is empty</div>
              <div style={{fontSize:14,color:C.faint,maxWidth:400,margin:"0 auto",lineHeight:1.6}}>Pin any stock or crypto by clicking ★ on a row, card, or inside the detail modal after searching.</div>
              <div style={{display:"flex",gap:10,justifyContent:"center",marginTop:20}}>
                <button onClick={()=>setTab("markets")} style={{padding:"8px 18px",borderRadius:10,background:C.accentBg,color:C.accent,border:`1px solid #bfdbfe`,fontFamily:C.sans,fontSize:13,fontWeight:600,cursor:"pointer"}}>Browse Markets</button>
                <button onClick={()=>setTab("crypto")} style={{padding:"8px 18px",borderRadius:10,background:"#f5f3ff",color:"#7c3aed",border:"1px solid #ddd6fe",fontFamily:C.sans,fontSize:13,fontWeight:600,cursor:"pointer"}}>Browse Crypto</button>
              </div>
            </div>
          ):(
            <>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:10,marginBottom:16}}>
                {pinnedItems.map(q=>{const up=(q.dp||0)>=0;const sym=q.symbol||q.ticker;return(
                  <div key={q.id} style={{...card,padding:14,cursor:"pointer",position:"relative"}} className="ch" onClick={()=>setModal(q)}>
                    <div style={{position:"absolute",top:10,right:10}} onClick={e=>e.stopPropagation()}><PinBtn id={q.id} pinned={pinned} onToggle={togglePin}/></div>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><AssetLogo q={q} size={26}/><div><div style={{fontSize:11,fontWeight:700,color:C.text}}>{sym}</div><div style={{fontSize:9,color:C.faint}}>{q.name}</div></div></div>
                    <div style={{fontFamily:C.mono,fontSize:17,fontWeight:700,color:C.text,marginBottom:2}}>${fmtPrice(q.c)}</div>
                    <span style={{fontSize:11,fontWeight:700,color:up?C.green:C.red}}>{fmtPct(q.dp)}</span>
                    <div style={{marginTop:6}}><Spark up={up} w={100} h={28}/></div>
                  </div>
                );})}
              </div>
              {pinnedStocks.length>0&&<div style={{...card,marginBottom:14}}><div style={secTitle}>Pinned Stocks & ETFs <span style={{background:C.accentBg,color:C.accent,borderRadius:10,padding:"1px 6px",fontSize:10,marginLeft:4}}>{pinnedStocks.length}</span></div>{pinnedStocks.map(q=><StockRow key={q.id} q={q}/>)}</div>}
              {pinnedCrypto.length>0&&<div style={{...card,marginBottom:14}}><div style={secTitle}>Pinned Crypto <span style={{background:"#f5f3ff",color:"#7c3aed",borderRadius:10,padding:"1px 6px",fontSize:10,marginLeft:4}}>{pinnedCrypto.length}</span></div>{pinnedCrypto.map(q=><CryptoRow key={q.id} q={q}/>)}</div>}
              {pinnedCommodities.length>0&&<div style={{...card,marginBottom:14}}><div style={secTitle}>Pinned Commodities <span style={{background:"#fffbeb",color:C.amber,borderRadius:10,padding:"1px 6px",fontSize:10,marginLeft:4}}>{pinnedCommodities.length}</span></div>{pinnedCommodities.map(q=><CommodityRow key={q.id} q={q}/>)}</div>}
              {pinnedBonds.length>0&&<div style={card}><div style={secTitle}>Pinned Bonds <span style={{background:"#eff6ff",color:C.accent,borderRadius:10,padding:"1px 6px",fontSize:10,marginLeft:4}}>{pinnedBonds.length}</span></div>{pinnedBonds.map(q=><BondRow key={q.id} q={q}/>)}</div>}
            </>
          )}
        </div>}

        {/* ══ CONGRESS ══ */}
        {/* ══ COMMODITIES ══ */}
        {tab==="commodities"&&<div style={{animation:"fadeUp 0.25s ease"}}>
          {/* Category cards */}
          {["metal","energy","agri"].map(cat=>{
            const items=Object.values(commodityQ).filter(q=>q.category===cat);
            if(!items.length)return null;
            const labels={metal:"Precious & Industrial Metals",energy:"Energy",agri:"Agriculture"};
            const colors={metal:"#f59e0b",energy:"#0ea569",agri:"#84cc16"};
            return(
              <div key={cat} style={{...card,marginBottom:14}}>
                <div style={{...secTitle,color:colors[cat]}}>{labels[cat]}</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:8}}>
                  {items.map(q=>{
                    const up=(q.dp||0)>=0;
                    const Icon=COMMODITY_ICONS[q.id];
                    return(
                      <div key={q.id} className="rh ch" style={{display:"flex",alignItems:"center",gap:10,padding:"12px 10px 12px 12px",borderRadius:12,border:`1px solid ${C.border}`,cursor:"pointer"}} onClick={()=>setModal(q)}>
                        {Icon?<div style={{flexShrink:0}}>{Icon(38)}</div>
                          :<div style={{width:38,height:38,borderRadius:10,background:`${q.color}15`,border:`1px solid ${q.color}30`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:10,fontWeight:700,color:q.color}}>{q.id.replace("=F","")}</span></div>}
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:700,color:C.text}}>{q.name}</div>
                          <div style={{fontSize:10,color:C.faint,textTransform:"capitalize"}}>per {q.unit}</div>
                        </div>
                        <div style={{textAlign:"right",marginRight:4}}>
                          <div style={{fontSize:16,fontWeight:800,color:C.text,fontFamily:C.mono}}>${fmtPrice(q.c)}</div>
                          <div style={{fontSize:12,fontWeight:700,color:up?C.green:C.red}}>{fmtPct(q.dp)}</div>
                        </div>
                        <div onClick={e=>e.stopPropagation()} style={{flexShrink:0}}>
                          <PinBtn id={q.id} pinned={pinned} onToggle={togglePin}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {/* Full list */}
          <div style={card}>
            <div style={secTitle}>All Commodities</div>
            {Object.values(commodityQ).map(q=><CommodityRow key={q.id} q={q}/>)}
          </div>
        </div>}

        {/* ══ BONDS ══ */}
        {tab==="bonds"&&<div style={{animation:"fadeUp 0.25s ease"}}>
          {/* Yield curve visual */}
          <div style={{...card,marginBottom:14}}>
            <div style={secTitle}>US Treasury Yield Curve</div>
            <div style={{display:"flex",alignItems:"flex-end",gap:12,height:140,padding:"10px 0 0 0"}}>
              {Object.values(bondQ).sort((a,b)=>{const order={"^IRX":0,"^FVX":1,"^TNX":2,"^TYX":3};return(order[a.id]||0)-(order[b.id]||0);}).map(b=>{
                const maxYield=6;
                const barPx=Math.max(10,Math.round(((b.c||0)/maxYield)*90)); // max 90px bar
                const up=(b.dp||0)>=0;
                return(
                  <div key={b.id} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                    <div style={{fontSize:12,fontWeight:700,color:b.color,fontFamily:C.mono,marginBottom:4}}>{(b.c||0).toFixed(2)}%</div>
                    <div style={{width:"100%",display:"flex",alignItems:"flex-end",height:90}}>
                      <div style={{width:"100%",height:barPx,background:`linear-gradient(to top, ${b.color}, ${b.color}80)`,borderRadius:"6px 6px 0 0",transition:"height 0.6s ease"}}/>
                    </div>
                    <div style={{fontSize:11,fontWeight:600,color:C.muted,marginTop:6}}>{b.tenor}</div>
                    <div style={{fontSize:10,color:up?C.green:C.red,fontWeight:600}}>{fmtPct(b.dp)}</div>
                  </div>
                );
              })}
            </div>
            <div style={{fontSize:11,color:C.faint,marginTop:8,borderTop:`1px solid ${C.border}`,paddingTop:8}}>
              Yield curve shows current US Treasury yields across maturities. An inverted curve (short rates &gt; long rates) has historically preceded recessions.
            </div>
          </div>
          {/* Bond rows */}
          <div style={card}>
            <div style={secTitle}>US Government Bonds</div>
            {Object.values(bondQ).sort((a,b)=>{const order={"^IRX":0,"^FVX":1,"^TNX":2,"^TYX":3};return(order[a.id]||0)-(order[b.id]||0);}).map(q=><BondRow key={q.id} q={q}/>)}
          </div>
        </div>}

        {/* ══ POLYMARKET ══ */}
        {tab==="polymarket"&&<div style={{animation:"fadeUp 0.25s ease"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            {poly.map(p=>(
              <div key={p.id} style={{...card,padding:18}} className="ch">
                <div style={{fontSize:13,fontWeight:600,color:C.text,lineHeight:1.5,marginBottom:14}}>{p.question}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                  {[["YES",p.yes,C.green,C.greenBg],["NO",p.no,C.red,C.redBg]].map(([label,val,col,bg])=>(
                    <div key={label} style={{background:bg,borderRadius:10,padding:"11px 13px"}}>
                      <div style={{fontSize:10,fontWeight:700,color:col,letterSpacing:"0.06em",marginBottom:3}}>{label}</div>
                      <div style={{fontFamily:C.mono,fontSize:22,fontWeight:700,color:col}}>{val}¢</div>
                      <div style={{height:4,background:"rgba(0,0,0,0.06)",borderRadius:99,marginTop:7,overflow:"hidden"}}><div style={{width:`${val}%`,height:"100%",background:col,borderRadius:99}}/></div>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.faint}}><span>Vol {p.volume}</span>{p.endDate&&<span>Ends {p.endDate}</span>}</div>
              </div>
            ))}
          </div>
        </div>}

        {/* ══ SIGNALS ══ */}
        {tab==="signals"&&<SignalsTab C={C} allQ={allQ} onSelect={setModal}/>}

      </div>

      <div style={{textAlign:"center",padding:"16px",fontSize:10,color:C.faint,borderTop:`1px solid ${C.border}`}}>
        Stock logos by <a href="https://www.allinvestview.com/tools/ticker-logos/" target="_blank" rel="noreferrer" style={{color:C.accent}}>AllInvestView Ticker Logos</a> · Crypto data by CoinGecko · Market data by Finnhub
      </div>
    </div>
  );
}
