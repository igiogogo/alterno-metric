import { useState, useEffect, useCallback, useRef } from "react";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const FINNHUB_KEY = process.env.REACT_APP_FINNHUB_KEY || "";
const FINNHUB = "https://finnhub.io/api/v1";
const POLYMARKET_API = "https://gamma-api.polymarket.com";

const WATCHLIST = [
  { ticker: "SPY",            name: "S&P 500 ETF",   type: "etf"    },
  { ticker: "QQQ",            name: "Nasdaq 100",    type: "etf"    },
  { ticker: "NVDA",           name: "Nvidia",        type: "stock"  },
  { ticker: "AAPL",           name: "Apple",         type: "stock"  },
  { ticker: "TSLA",           name: "Tesla",         type: "stock"  },
  { ticker: "META",           name: "Meta",          type: "stock"  },
  { ticker: "MSFT",           name: "Microsoft",     type: "stock"  },
  { ticker: "AMZN",           name: "Amazon",        type: "stock"  },
  { ticker: "GOOGL",          name: "Alphabet",      type: "stock"  },
  { ticker: "BTC-USD",        name: "Bitcoin",       type: "crypto" },
  { ticker: "BINANCE:ETHUSD", name: "Ethereum",      type: "crypto" },
];

const POLY_KEYWORDS = ["fed","rate","recession","bitcoin","inflation","oil","iran","ukraine","china","tariff","gdp"];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmtPrice  = (n) => { if (!n && n !== 0) return "—"; if (n >= 10000) return n.toLocaleString("en-US",{maximumFractionDigits:0}); if (n >= 100) return n.toFixed(2); return n.toFixed(3); };
const fmtPct    = (n) => (!n && n !== 0) ? "—" : (n >= 0 ? "+" : "") + n.toFixed(2) + "%";
const fmtLarge  = (n) => { if (!n) return "—"; if (n >= 1e12) return "$" + (n/1e12).toFixed(2) + "T"; if (n >= 1e9) return "$" + (n/1e9).toFixed(2) + "B"; if (n >= 1e6) return "$" + (n/1e6).toFixed(2) + "M"; return "$" + n.toLocaleString(); };
const timeAgo   = (ts) => { if (!ts) return ""; const s = Math.floor(Date.now()/1000-ts); if (s<60) return s+"s ago"; if (s<3600) return Math.floor(s/60)+"m ago"; if (s<86400) return Math.floor(s/3600)+"h ago"; return Math.floor(s/86400)+"d ago"; };

// ─── DEMO DATA ────────────────────────────────────────────────────────────────
const DEMO_QUOTES = {
  "SPY":{"ticker":"SPY","name":"S&P 500 ETF","c":524.38,"dp":0.24,"type":"etf"},
  "QQQ":{"ticker":"QQQ","name":"Nasdaq 100","c":447.92,"dp":0.64,"type":"etf"},
  "NVDA":{"ticker":"NVDA","name":"Nvidia","c":887.24,"dp":2.47,"type":"stock"},
  "AAPL":{"ticker":"AAPL","name":"Apple","c":189.30,"dp":-0.63,"type":"stock"},
  "TSLA":{"ticker":"TSLA","name":"Tesla","c":174.48,"dp":2.84,"type":"stock"},
  "META":{"ticker":"META","name":"Meta","c":512.63,"dp":1.45,"type":"stock"},
  "MSFT":{"ticker":"MSFT","name":"Microsoft","c":415.60,"dp":0.82,"type":"stock"},
  "AMZN":{"ticker":"AMZN","name":"Amazon","c":182.40,"dp":1.10,"type":"stock"},
  "GOOGL":{"ticker":"GOOGL","name":"Alphabet","c":162.30,"dp":0.55,"type":"stock"},
  "BTC-USD":{"ticker":"BTC-USD","name":"Bitcoin","c":68420,"dp":1.85,"type":"crypto"},
  "BINANCE:ETHUSD":{"ticker":"BINANCE:ETHUSD","name":"Ethereum","c":3280,"dp":1.12,"type":"crypto"},
};
const DEMO_NEWS = [
  {id:1,source:"Reuters",headline:"Fed officials signal caution on rate cuts as inflation stays sticky",datetime:Math.floor(Date.now()/1000)-1800,url:"#"},
  {id:2,source:"Bloomberg",headline:"Nvidia surges as data centre demand exceeds Wall Street estimates",datetime:Math.floor(Date.now()/1000)-3600,url:"#"},
  {id:3,source:"WSJ",headline:"Treasury yields climb as investors reassess Fed cut timeline",datetime:Math.floor(Date.now()/1000)-5400,url:"#"},
  {id:4,source:"FT",headline:"Private equity dry powder hits $2.6 trillion record high",datetime:Math.floor(Date.now()/1000)-7200,url:"#"},
  {id:5,source:"Bloomberg",headline:"Goldman raises S&P 500 year-end target to 5,600",datetime:Math.floor(Date.now()/1000)-9000,url:"#"},
  {id:6,source:"Reuters",headline:"Oil falls on demand concerns despite Middle East tensions",datetime:Math.floor(Date.now()/1000)-10800,url:"#"},
  {id:7,source:"FT",headline:"Warren Buffett's cash pile hits $189bn — a record for Berkshire",datetime:Math.floor(Date.now()/1000)-14400,url:"#"},
];
const DEMO_CONGRESS = [
  {name:"Nancy Pelosi",party:"D",state:"CA",symbol:"NVDA",transactionType:"Buy",amount:"$1M–$5M",transactionDate:"2025-04-07"},
  {name:"Dan Crenshaw",party:"R",state:"TX",symbol:"LMT",transactionType:"Buy",amount:"$50K–$100K",transactionDate:"2025-04-05"},
  {name:"Josh Gottheimer",party:"D",state:"NJ",symbol:"MSFT",transactionType:"Sale",amount:"$500K–$1M",transactionDate:"2025-04-04"},
  {name:"Tommy Tuberville",party:"R",state:"AL",symbol:"XOM",transactionType:"Buy",amount:"$100K–$250K",transactionDate:"2025-04-03"},
  {name:"Ro Khanna",party:"D",state:"CA",symbol:"AMZN",transactionType:"Buy",amount:"$50K–$100K",transactionDate:"2025-04-02"},
];
const DEMO_TWEETS = [
  {handle:"RaoulGMI",name:"Raoul Pal",text:"The Everything Code keeps playing out. Liquidity drives all assets. Watch the Fed balance sheet, not the rate.",likes:"12.8K",time:"2h"},
  {handle:"elerianm",name:"Mohamed El-Erian",text:"Today's CPI print will be closely watched. Any upside surprise risks a sharp repricing in rate expectations.",likes:"7.1K",time:"3h"},
  {handle:"LukeGromen",name:"Luke Gromen",text:"The bond market is telling you something equities haven't priced yet. Fiscal dominance is here.",likes:"5.9K",time:"4h"},
  {handle:"naval",name:"Naval Ravikant",text:"Inflation is a hidden tax on savers. The monetary system redistributes from the cautious to the leveraged.",likes:"31.4K",time:"1h"},
  {handle:"APompliano",name:"Anthony Pompliano",text:"Bitcoin is up on the day while the dollar weakens. This is the trade of the decade.",likes:"9.3K",time:"2h"},
  {handle:"zerohedge",name:"ZeroHedge",text:"JPMorgan cuts GDP forecast — stagflation risks rising, strategists warn.",likes:"6.4K",time:"3h"},
];

// ─── SPARKLINE (mini) ─────────────────────────────────────────────────────────
function Spark({ up, w=80, h=32 }) {
  const seed = up ? 1 : -1;
  const raw = Array.from({length:16},(_,i)=>(Math.sin(i*2.1+seed*0.9)+Math.cos(i*1.3)*0.4)*3);
  let acc=0; const cum=raw.map(v=>{acc+=v;return acc;});
  const mn=Math.min(...cum),mx=Math.max(...cum);
  const norm=cum.map(v=>((v-mn)/(mx-mn||1))*(h-4)+2);
  const pts=norm.map((y,i)=>`${(i/15)*w},${h-y}`).join(" ");
  const color=up?"#0ea569":"#e53e3e";
  const fid=`sf_${up?"u":"d"}_${w}`;
  return (
    <svg width={w} height={h} style={{display:"block"}}>
      <defs><linearGradient id={fid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.15"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#${fid})`}/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}

// ─── PRICE CHART (real data via Finnhub candles) ──────────────────────────────
function PriceChart({ ticker, color }) {
  const [data, setData]       = useState([]);
  const [range, setRange]     = useState("1M");
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef(null);

  const RANGES = ["1D","1W","1M","3M","1Y","5Y"];

  const getRangeParams = (r) => {
    const now = Math.floor(Date.now()/1000);
    const map = { "1D":{from:now-86400,res:"15"},  "1W":{from:now-604800,res:"60"}, "1M":{from:now-2592000,res:"D"}, "3M":{from:now-7776000,res:"D"}, "1Y":{from:now-31536000,res:"W"}, "5Y":{from:now-157680000,res:"M"} };
    return { ...map[r], to: now };
  };

  useEffect(() => {
    setLoading(true);
    setData([]);
    const sym = ticker.replace("BINANCE:","");
    const { from, to, res } = getRangeParams(range);
    if (!FINNHUB_KEY) {
      // Generate demo chart data
      const pts = 60;
      const base = 100;
      let val = base;
      const demo = Array.from({length:pts},(_,i)=>{ val += (Math.random()-0.48)*3; return { t:(from+(i/pts)*(to-from))*1000, c:Math.max(50,val) }; });
      setData(demo); setLoading(false); return;
    }
    fetch(`${FINNHUB}/stock/candle?symbol=${sym}&resolution=${res}&from=${from}&to=${to}&token=${FINNHUB_KEY}`)
      .then(r=>r.json())
      .then(d=>{
        if (d.s==="ok" && d.c) {
          setData(d.t.map((t,i)=>({t:t*1000,c:d.c[i],o:d.o?.[i],h:d.h?.[i],l:d.l?.[i]})));
        } else { setData([]); }
        setLoading(false);
      })
      .catch(()=>setLoading(false));
  }, [ticker, range]); // eslint-disable-line

  useEffect(() => {
    if (!canvasRef.current || data.length < 2) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0,0,W,H);

    const prices = data.map(d=>d.c);
    const mn = Math.min(...prices), mx = Math.max(...prices);
    const pad = { t:20, b:30, l:10, r:50 };
    const cw = W-pad.l-pad.r, ch = H-pad.t-pad.b;

    const px = (i) => pad.l + (i/(data.length-1))*cw;
    const py = (v) => pad.t + (1-(v-mn)/(mx-mn||1))*ch;

    // Grid lines
    ctx.strokeStyle = "#f1f5f9";
    ctx.lineWidth = 1;
    for (let i=0;i<4;i++) {
      const y = pad.t + (i/3)*ch;
      ctx.beginPath(); ctx.moveTo(pad.l,y); ctx.lineTo(W-pad.r,y); ctx.stroke();
      const val = mx - (i/3)*(mx-mn);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "10px JetBrains Mono, monospace";
      ctx.textAlign = "left";
      ctx.fillText(val >= 100 ? val.toFixed(0) : val.toFixed(2), W-pad.r+6, y+4);
    }

    // Gradient fill
    const up = prices[prices.length-1] >= prices[0];
    const grad = ctx.createLinearGradient(0,pad.t,0,H-pad.b);
    grad.addColorStop(0, up ? "rgba(14,165,105,0.15)" : "rgba(229,62,62,0.15)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.beginPath();
    ctx.moveTo(px(0), H-pad.b);
    data.forEach((d,i) => ctx.lineTo(px(i), py(d.c)));
    ctx.lineTo(px(data.length-1), H-pad.b);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.strokeStyle = up ? "#0ea569" : "#e53e3e";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    data.forEach((d,i) => i===0 ? ctx.moveTo(px(i),py(d.c)) : ctx.lineTo(px(i),py(d.c)));
    ctx.stroke();

    // X-axis labels
    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px Plus Jakarta Sans, sans-serif";
    ctx.textAlign = "center";
    const labelCount = 5;
    for (let i=0;i<labelCount;i++) {
      const idx = Math.floor((i/(labelCount-1))*(data.length-1));
      const d = new Date(data[idx].t);
      const label = range==="1D" ? d.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"}) : d.toLocaleDateString("en-GB",{day:"2-digit",month:"short"});
      ctx.fillText(label, px(idx), H-8);
    }
  }, [data, range]);

  const isUp = data.length > 1 && data[data.length-1].c >= data[0].c;
  const pctChange = data.length > 1 ? ((data[data.length-1].c - data[0].c)/data[0].c*100).toFixed(2) : null;

  return (
    <div>
      {/* Range selector */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <div style={{display:"flex",gap:4}}>
          {RANGES.map(r=>(
            <button key={r} onClick={()=>setRange(r)} style={{
              padding:"5px 12px", borderRadius:8, fontSize:12, fontWeight:600,
              border:"none", cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif",
              background: range===r ? (isUp?"#f0fdf4":"#fff5f5") : "transparent",
              color: range===r ? (isUp?"#0ea569":"#e53e3e") : "#94a3b8",
              transition:"all 0.15s",
            }}>{r}</button>
          ))}
        </div>
        {pctChange && (
          <span style={{fontSize:13,fontWeight:700,color:isUp?"#0ea569":"#e53e3e"}}>
            {isUp?"↑":"↓"} {Math.abs(pctChange)}% this period
          </span>
        )}
      </div>

      {/* Chart canvas */}
      <div style={{position:"relative",height:200}}>
        {loading && (
          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{display:"inline-block",width:20,height:20,border:"2px solid #e2e8f0",borderTopColor:"#2563eb",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
          </div>
        )}
        {!loading && data.length === 0 && (
          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",color:"#94a3b8",fontSize:13}}>
            No chart data available for this range
          </div>
        )}
        <canvas ref={canvasRef} width={560} height={200} style={{width:"100%",height:200,display:loading||data.length===0?"none":"block"}}/>
      </div>
    </div>
  );
}

// ─── STOCK MODAL ──────────────────────────────────────────────────────────────
function StockModal({ ticker, name, onClose, C }) {
  const [quote,    setQuote]    = useState(null);
  const [profile,  setProfile]  = useState(null);
  const [metrics,  setMetrics]  = useState(null);
  const [loading,  setLoading]  = useState(true);

  const sym = ticker.replace("BINANCE:","");

  useEffect(() => {
    if (!FINNHUB_KEY) {
      // Demo fundamentals
      setQuote({c:887.24,d:21.4,dp:2.47,h:901.0,l:862.1,o:866.0,pc:865.84});
      setProfile({name:name||sym,exchange:"NASDAQ",finnhubIndustry:"Technology",marketCapitalization:2200000,logo:""});
      setMetrics({metric:{peNormalizedAnnual:42.3,epsNormalizedAnnual:21.0,"52WeekHigh":974.0,"52WeekLow":402.0,dividendYieldIndicatedAnnual:0.03,beta:1.72,revenueGrowthTTMYoy:122.4}});
      setLoading(false); return;
    }
    Promise.all([
      fetch(`${FINNHUB}/quote?symbol=${sym}&token=${FINNHUB_KEY}`).then(r=>r.json()),
      fetch(`${FINNHUB}/stock/profile2?symbol=${sym}&token=${FINNHUB_KEY}`).then(r=>r.json()),
      fetch(`${FINNHUB}/stock/metric?symbol=${sym}&metric=all&token=${FINNHUB_KEY}`).then(r=>r.json()),
    ]).then(([q,p,m])=>{ setQuote(q); setProfile(p); setMetrics(m); setLoading(false); })
      .catch(()=>setLoading(false));
  }, [ticker]); // eslint-disable-line

  const up = (quote?.dp||0) >= 0;

  const StatBox = ({label, value}) => (
    <div style={{background:C.bg,borderRadius:10,padding:"12px 14px"}}>
      <div style={{fontSize:10,fontWeight:700,color:C.faint,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>{label}</div>
      <div style={{fontSize:15,fontWeight:700,color:C.text,fontFamily:"'JetBrains Mono',monospace"}}>{value}</div>
    </div>
  );

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:24,backdropFilter:"blur(4px)"}}
         onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:C.surface,borderRadius:20,width:"100%",maxWidth:640,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 24px 60px rgba(0,0,0,0.2)"}}>

        {/* Modal header */}
        <div style={{padding:"20px 24px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:14}}>
          {profile?.logo && <img src={profile.logo} alt="" style={{width:36,height:36,borderRadius:8,objectFit:"contain",border:`1px solid ${C.border}`}} onError={e=>e.target.style.display="none"}/>}
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:18,fontWeight:800,color:C.text,letterSpacing:"-0.02em"}}>{profile?.name||name||sym}</span>
              <span style={{fontSize:12,fontWeight:700,color:C.muted,background:C.bg,padding:"2px 8px",borderRadius:6}}>{sym}</span>
              {profile?.exchange && <span style={{fontSize:11,color:C.faint}}>{profile.exchange}</span>}
            </div>
            {profile?.finnhubIndustry && <div style={{fontSize:12,color:C.faint,marginTop:2}}>{profile.finnhubIndustry}</div>}
          </div>
          <button onClick={onClose} style={{width:32,height:32,borderRadius:8,border:`1px solid ${C.border}`,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.muted,fontSize:16}}>✕</button>
        </div>

        <div style={{padding:"20px 24px"}}>
          {loading ? (
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:60,gap:10,color:C.muted,fontSize:13}}>
              <span style={{display:"inline-block",width:18,height:18,border:`2px solid ${C.border}`,borderTopColor:C.accent,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
              Loading market data…
            </div>
          ) : (
            <>
              {/* Price */}
              <div style={{display:"flex",alignItems:"flex-end",gap:12,marginBottom:20}}>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:36,fontWeight:800,color:C.text,letterSpacing:"-0.03em"}}>{fmtPrice(quote?.c)}</span>
                <div style={{paddingBottom:4}}>
                  <span style={{fontSize:15,fontWeight:700,color:up?C.green:C.red}}>{up?"↑":"↓"} {fmtPrice(Math.abs(quote?.d||0))} ({fmtPct(quote?.dp)})</span>
                  <div style={{fontSize:11,color:C.faint}}>today</div>
                </div>
              </div>

              {/* Chart */}
              <PriceChart ticker={ticker} color={up?C.green:C.red} />

              {/* Fundamentals grid */}
              <div style={{marginTop:20}}>
                <div style={{fontSize:11,fontWeight:700,color:C.faint,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:12}}>Fundamentals</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                  <StatBox label="Market Cap"    value={fmtLarge((profile?.marketCapitalization||0)*1e6)}/>
                  <StatBox label="P/E Ratio"     value={metrics?.metric?.peNormalizedAnnual ? metrics.metric.peNormalizedAnnual.toFixed(1) : "—"}/>
                  <StatBox label="EPS"           value={metrics?.metric?.epsNormalizedAnnual ? "$"+metrics.metric.epsNormalizedAnnual.toFixed(2) : "—"}/>
                  <StatBox label="52W High"      value={metrics?.metric?.["52WeekHigh"] ? "$"+metrics.metric["52WeekHigh"].toFixed(2) : "—"}/>
                  <StatBox label="52W Low"       value={metrics?.metric?.["52WeekLow"]  ? "$"+metrics.metric["52WeekLow"].toFixed(2)  : "—"}/>
                  <StatBox label="Beta"          value={metrics?.metric?.beta ? metrics.metric.beta.toFixed(2) : "—"}/>
                  <StatBox label="Day High"      value={quote?.h ? "$"+fmtPrice(quote.h) : "—"}/>
                  <StatBox label="Day Low"       value={quote?.l ? "$"+fmtPrice(quote.l) : "—"}/>
                  <StatBox label="Prev Close"    value={quote?.pc ? "$"+fmtPrice(quote.pc) : "—"}/>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── TICKER TAPE ──────────────────────────────────────────────────────────────
function TickerTape({ quotes, onSelect }) {
  const items = Object.values(quotes).filter(q=>q.c);
  return (
    <div style={{background:"#f0f4ff",borderBottom:"1px solid #e2e8f0",overflow:"hidden",height:32,display:"flex",alignItems:"center"}}>
      <style>{`@keyframes scrolltape{0%{transform:translateX(0)}100%{transform:translateX(-50%)}} .tapew{display:flex;animation:scrolltape 60s linear infinite;white-space:nowrap;}`}</style>
      {items.length===0
        ? <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,color:"#94a3b8",paddingLeft:16}}>Loading market data…</span>
        : <div className="tapew">
            {[...items,...items].map((q,i)=>(
              <span key={i} onClick={()=>onSelect(q.ticker,q.name)} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"0 20px",fontSize:11,fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:500,cursor:"pointer"}}>
                <span style={{color:"#64748b"}}>{q.ticker?.replace("BINANCE:","")}</span>
                <span style={{color:"#1e293b"}}>{fmtPrice(q.c)}</span>
                <span style={{color:(q.dp||0)>=0?"#0ea569":"#e53e3e",fontWeight:600}}>{(q.dp||0)>=0?"↑":"↓"} {Math.abs(q.dp||0).toFixed(2)}%</span>
              </span>
            ))}
          </div>
      }
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,      setTab]      = useState("overview");
  const [clock,    setClock]    = useState(new Date());
  const [quotes,   setQuotes]   = useState({});
  const [news,     setNews]     = useState([]);
  const [congress, setCongress] = useState([]);
  const [poly,     setPoly]     = useState([]);
  const [loading,  setLoading]  = useState({quotes:true,news:true,congress:true,poly:true});
  const [brief,    setBrief]    = useState("");
  const [briefing, setBriefing] = useState(false);
  const [briefDone,setBriefDone]= useState(false);
  const [modal,    setModal]    = useState(null); // {ticker, name}
  const [search,   setSearch]   = useState("");
  const [searching,setSearching]= useState(false);
  const searchRef = useRef(null);

  const isDemo = !FINNHUB_KEY;
  useEffect(()=>{const t=setInterval(()=>setClock(new Date()),1000);return()=>clearInterval(t);},[]);

  // ── Search ──
  const handleSearch = async (e) => {
    if (e.key !== "Enter" || !search.trim()) return;
    const sym = search.trim().toUpperCase();
    setSearching(true);
    // Validate ticker exists via quote endpoint
    if (!FINNHUB_KEY) { setModal({ticker:sym,name:sym}); setSearch(""); setSearching(false); return; }
    try {
      const r = await fetch(`${FINNHUB}/quote?symbol=${sym}&token=${FINNHUB_KEY}`);
      const d = await r.json();
      if (d.c && d.c > 0) { setModal({ticker:sym,name:sym}); setSearch(""); }
      else { alert(`"${sym}" not found. Try a valid ticker like AAPL, MSFT, AMZN.`); }
    } catch { setModal({ticker:sym,name:sym}); setSearch(""); }
    setSearching(false);
  };

  // ── Data fetching ──
  const fetchQuotes = useCallback(async () => {
    if (isDemo) { setQuotes(DEMO_QUOTES); setLoading(l=>({...l,quotes:false})); return; }
    try {
      const res = await Promise.all(WATCHLIST.map(async w => {
        const r = await fetch(`${FINNHUB}/quote?symbol=${w.ticker}&token=${FINNHUB_KEY}`);
        const d = await r.json();
        return {ticker:w.ticker,name:w.name,type:w.type,...d};
      }));
      const m={}; res.forEach(r=>{m[r.ticker]=r;}); setQuotes(m);
    } catch { setQuotes(DEMO_QUOTES); }
    setLoading(l=>({...l,quotes:false}));
  },[isDemo]);

  const fetchNews = useCallback(async () => {
    if (isDemo) { setNews(DEMO_NEWS); setLoading(l=>({...l,news:false})); return; }
    try { const r=await fetch(`${FINNHUB}/news?category=general&token=${FINNHUB_KEY}`); const d=await r.json(); setNews((d||[]).slice(0,20)); }
    catch { setNews(DEMO_NEWS); }
    setLoading(l=>({...l,news:false}));
  },[isDemo]);

  const fetchCongress = useCallback(async () => {
    if (isDemo) { setCongress(DEMO_CONGRESS); setLoading(l=>({...l,congress:false})); return; }
    try { const r=await fetch(`${FINNHUB}/stock/congressional-trading?symbol=&token=${FINNHUB_KEY}`); const d=await r.json(); setCongress((d?.data||[]).slice(0,20)); }
    catch { setCongress(DEMO_CONGRESS); }
    setLoading(l=>({...l,congress:false}));
  },[isDemo]);

  const fetchPoly = useCallback(async () => {
    try {
      const r=await fetch(`${POLYMARKET_API}/markets?active=true&order=volumeNum&ascending=false&limit=50`);
      const d=await r.json();
      const raw=Array.isArray(d)?d:(d.data||[]);
      const filtered=raw.filter(m=>POLY_KEYWORDS.some(k=>(m.question||"").toLowerCase().includes(k))).slice(0,12).map(m=>{
        let yes=null; try{const op=JSON.parse(m.outcomePrices||"[]");yes=Math.round(parseFloat(op[0])*100);}catch{}
        return{id:m.id,question:m.question,yes,no:yes!==null?100-yes:null,volume:m.volumeNum?"$"+(m.volumeNum>=1e6?(m.volumeNum/1e6).toFixed(1)+"M":(m.volumeNum/1e3).toFixed(0)+"K"):"—",endDate:(m.endDate||"").slice(0,10)};
      }).filter(m=>m.yes!==null);
      setPoly(filtered.length?filtered:getDemoPoly());
    } catch { setPoly(getDemoPoly()); }
    setLoading(l=>({...l,poly:false}));
  },[]);

  function getDemoPoly() { return [{id:1,question:"Fed cuts rates at June 2025 FOMC",yes:31,no:69,volume:"$18.7M",endDate:"2025-06-18"},{id:2,question:"Bitcoin reaches $100K by end of 2025",yes:54,no:46,volume:"$22.3M",endDate:"2025-12-31"},{id:3,question:"US enters recession by Q3 2025",yes:22,no:78,volume:"$9.1M",endDate:"2025-10-01"},{id:4,question:"Russia-Ukraine ceasefire signed in 2025",yes:38,no:62,volume:"$11.4M",endDate:"2025-12-31"},{id:5,question:"Iranian regime falls by end of 2025",yes:12,no:88,volume:"$4.2M",endDate:"2025-12-31"},{id:6,question:"Oil price exceeds $100/barrel in 2025",yes:18,no:82,volume:"$3.9M",endDate:"2025-12-31"}]; }

  useEffect(()=>{ fetchQuotes();fetchNews();fetchCongress();fetchPoly(); const iv=[setInterval(fetchQuotes,30000),setInterval(fetchNews,300000),setInterval(fetchCongress,900000),setInterval(fetchPoly,120000)]; return()=>iv.forEach(clearInterval); },[fetchQuotes,fetchNews,fetchCongress,fetchPoly]);

  async function generateBriefing() {
    setBriefing(true); setBrief(""); setBriefDone(false);
    const qStr=Object.values(quotes).slice(0,5).map(q=>`${q.ticker} ${fmtPrice(q.c)} (${fmtPct(q.dp)})`).join(", ");
    const nStr=news.slice(0,5).map(n=>`• ${n.headline}`).join("\n");
    const pStr=poly.slice(0,4).map(p=>`• "${p.question}" — YES ${p.yes}% (vol ${p.volume})`).join("\n");
    const cStr=congress.slice(0,3).map(t=>`• ${t.name} ${(t.transactionType||"").toUpperCase()} ${t.symbol}`).join("\n");
    const prompt=`You are a senior market strategist. Write a 4-5 sentence intelligence briefing for sophisticated investors covering: the dominant market theme, what the congressional trades may signal, what prediction markets are pricing in, and one key risk to watch. Be direct and analytical — no filler.\n\nMarkets: ${qStr}\n\nNews:\n${nStr}\n\nPolymarket:\n${pStr}\n\nCongress:\n${cStr}`;
    try {
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:prompt}]})});
      const data=await res.json(); setBrief(data.content?.map(b=>b.text||"").join("")||"Unable to generate briefing.");
    } catch { setBrief("AI briefing unavailable."); }
    setBriefing(false); setBriefDone(true);
  }

  const isBuy = (t) => (t.transactionType||"").toLowerCase().match(/buy|purchase/);
  const TABS = ["overview","markets","congress","polymarket","signals"];

  const C = {
    bg:"#f8fafc", surface:"#ffffff", border:"#e2e8f0", border2:"#cbd5e1",
    text:"#1e293b", muted:"#64748b", faint:"#94a3b8",
    accent:"#2563eb", accentBg:"#eff6ff",
    green:"#0ea569", greenBg:"#f0fdf4",
    red:"#e53e3e", redBg:"#fff5f5",
    amber:"#d97706", amberBg:"#fffbeb",
    sans:"'Plus Jakarta Sans',sans-serif",
    display:"'Plus Jakarta Sans',sans-serif",
    mono:"'JetBrains Mono',monospace",
  };

  const card = {background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:20};
  const secTitle = {fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:C.faint,marginBottom:16,fontFamily:C.sans};

  return (
    <div style={{background:C.bg,minHeight:"100vh",color:C.text,fontFamily:C.sans}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px;height:4px;background:#f1f5f9}
        ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:4px}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .rh:hover{background:#f8fafc!important;cursor:pointer}
        .ch:hover{box-shadow:0 4px 24px rgba(37,99,235,0.08)!important;border-color:#bfdbfe!important}
        a{color:inherit;text-decoration:none}
        a:hover{color:#2563eb}
      `}</style>

      {/* HEADER */}
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"0 28px",display:"flex",alignItems:"center",height:60,gap:24,position:"sticky",top:0,zIndex:100,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
          <div style={{width:28,height:28,background:"linear-gradient(135deg,#2563eb,#7c3aed)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
          </div>
          <span style={{fontFamily:C.display,fontSize:16,fontWeight:800,color:C.text,letterSpacing:"-0.03em"}}>AlternoMetric</span>
        </div>

        {/* Nav */}
        <div style={{display:"flex",gap:2}}>
          {TABS.map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{padding:"6px 14px",borderRadius:8,fontSize:13,fontWeight:500,fontFamily:C.sans,cursor:"pointer",border:"none",transition:"all 0.15s",background:tab===t?C.accentBg:"transparent",color:tab===t?C.accent:C.muted,textTransform:"capitalize"}}>{t}</button>
          ))}
        </div>

        {/* Search */}
        <div style={{flex:1,maxWidth:280,position:"relative"}}>
          <svg style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.faint} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            ref={searchRef}
            value={search}
            onChange={e=>setSearch(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Search ticker… (e.g. AAPL)"
            style={{width:"100%",padding:"8px 12px 8px 30px",borderRadius:10,border:`1px solid ${C.border}`,background:C.bg,fontSize:13,color:C.text,fontFamily:C.sans,outline:"none",transition:"border-color 0.15s"}}
            onFocus={e=>e.target.style.borderColor=C.accent}
            onBlur={e=>e.target.style.borderColor=C.border}
          />
          {searching && <span style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",display:"inline-block",width:12,height:12,border:`2px solid ${C.border}`,borderTopColor:C.accent,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>}
        </div>

        {/* Clock */}
        <div style={{display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
          {isDemo && <span style={{fontSize:11,fontWeight:600,padding:"4px 10px",background:C.amberBg,color:C.amber,borderRadius:20,border:"1px solid #fde68a"}}>Demo mode</span>}
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:13,fontWeight:600,color:C.text,fontFamily:C.mono}}>{clock.toLocaleTimeString("en-GB")}</div>
            <div style={{fontSize:10,color:C.faint}}>{clock.toLocaleDateString("en-GB",{weekday:"short",day:"2-digit",month:"short"})}</div>
          </div>
          <div style={{width:8,height:8,borderRadius:"50%",background:C.green,boxShadow:"0 0 0 3px #dcfce7",animation:"shimmer 2s infinite"}}/>
        </div>
      </div>

      <TickerTape quotes={quotes} onSelect={(ticker,name)=>setModal({ticker,name})}/>

      {/* MODAL */}
      {modal && <StockModal ticker={modal.ticker} name={modal.name} onClose={()=>setModal(null)} C={C}/>}

      <div style={{maxWidth:1200,margin:"0 auto",padding:"24px"}}>

        {/* ══ OVERVIEW ══ */}
        {tab==="overview" && <div style={{animation:"fadeUp 0.25s ease"}}>
          {/* AI Briefing */}
          <div style={{...card,marginBottom:20,background:briefDone?"linear-gradient(135deg,#eff6ff,#f5f3ff)":C.surface,borderColor:briefDone?"#bfdbfe":C.border}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:brief||briefing?16:0}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:32,height:32,borderRadius:10,background:"linear-gradient(135deg,#2563eb,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                </div>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:C.text}}>AI Morning Briefing</div>
                  <div style={{fontSize:11,color:C.faint}}>Powered by Claude</div>
                </div>
              </div>
              <button onClick={generateBriefing} disabled={briefing} style={{padding:"8px 18px",borderRadius:10,fontSize:13,fontWeight:600,fontFamily:C.sans,cursor:briefing?"default":"pointer",border:"none",background:briefing?"#e2e8f0":"linear-gradient(135deg,#2563eb,#7c3aed)",color:briefing?C.muted:"white",boxShadow:briefing?"none":"0 2px 8px rgba(37,99,235,0.3)"}}>
                {briefing?"Generating…":"Generate briefing"}
              </button>
            </div>
            {briefing&&<div style={{display:"flex",alignItems:"center",gap:10,color:C.muted,fontSize:13,padding:"8px 0"}}><span style={{display:"inline-block",width:16,height:16,border:"2px solid #e2e8f0",borderTopColor:C.accent,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/> Analysing live market data…</div>}
            {brief&&<p style={{fontSize:14,lineHeight:1.75,color:C.text}}>{brief}</p>}
            {!brief&&!briefing&&<p style={{fontSize:13,color:C.faint}}>Generate an AI-powered intelligence summary synthesising today's markets, news, congressional trades and Polymarket odds.</p>}
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
            {/* Markets */}
            <div style={card}>
              <div style={secTitle}>Key Markets <span style={{color:C.accentBg,fontSize:10,background:C.accentBg,color:C.accent,padding:"1px 6px",borderRadius:4,marginLeft:4}}>click to expand</span></div>
              {Object.values(quotes).slice(0,7).map(q=>(
                <div key={q.ticker} className="rh" onClick={()=>setModal({ticker:q.ticker,name:q.name})} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 8px",borderRadius:8,marginBottom:2}}>
                  <div style={{width:36,height:36,borderRadius:10,background:C.accentBg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <span style={{fontSize:9,fontWeight:700,color:C.accent}}>{q.ticker?.replace("BINANCE:","").slice(0,4)}</span>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,color:C.text}}>{q.name}</div>
                    <div style={{fontSize:11,color:C.faint}}>{q.ticker?.replace("BINANCE:","")}</div>
                  </div>
                  <Spark up={(q.dp||0)>=0} w={60} h={28}/>
                  <div style={{textAlign:"right",minWidth:80}}>
                    <div style={{fontSize:13,fontWeight:700,color:C.text,fontFamily:C.mono}}>{fmtPrice(q.c)}</div>
                    <div style={{fontSize:11,fontWeight:600,color:(q.dp||0)>=0?C.green:C.red,fontFamily:C.mono}}>{fmtPct(q.dp)}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* News */}
            <div style={card}>
              <div style={secTitle}>Latest Headlines</div>
              {news.slice(0,7).map((n,i)=>(
                <div key={i} className="rh" style={{display:"flex",gap:12,padding:"9px 8px",borderRadius:8,marginBottom:2,alignItems:"flex-start"}}>
                  <span style={{fontSize:10,fontWeight:700,color:C.accent,background:C.accentBg,padding:"2px 7px",borderRadius:6,flexShrink:0,marginTop:2}}>{(n.source||"NEWS").slice(0,6)}</span>
                  <a href={n.url||"#"} target="_blank" rel="noreferrer" style={{flex:1,fontSize:13,lineHeight:1.45,color:C.text,fontWeight:500}}>{n.headline}</a>
                  <span style={{fontSize:11,color:C.faint,flexShrink:0,marginTop:2}}>{timeAgo(n.datetime)}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            {/* Polymarket */}
            <div style={card}>
              <div style={secTitle}>Polymarket — Macro Odds</div>
              {poly.slice(0,5).map(p=>(
                <div key={p.id} style={{padding:"12px 0",borderBottom:`1px solid ${C.border}`}}>
                  <div style={{fontSize:13,color:C.text,fontWeight:500,marginBottom:10,lineHeight:1.4}}>{p.question}</div>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{flex:1,height:6,background:"#f1f5f9",borderRadius:99,overflow:"hidden"}}>
                      <div style={{width:`${p.yes}%`,height:"100%",borderRadius:99,background:p.yes>60?C.green:p.yes>35?"#f59e0b":C.red,transition:"width 0.5s"}}/>
                    </div>
                    <span style={{fontFamily:C.mono,fontSize:13,fontWeight:700,color:p.yes>50?C.green:C.amber,minWidth:36,textAlign:"right"}}>{p.yes}%</span>
                    <span style={{fontSize:11,color:C.faint,minWidth:50,textAlign:"right"}}>{p.volume}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Congress */}
            <div style={card}>
              <div style={secTitle}>Congress Trades</div>
              {congress.slice(0,5).map((t,i)=>{
                const buy=isBuy(t); const p=t.party||(i%2===0?"D":"R");
                return (
                  <div key={i} className="rh" onClick={()=>setModal({ticker:t.symbol||t.ticker,name:t.symbol||t.ticker})} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 8px",borderRadius:8,marginBottom:2}}>
                    <span style={{fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:6,background:p==="D"?"#eff6ff":"#fff5f5",color:p==="D"?"#2563eb":"#e53e3e",flexShrink:0}}>{p}</span>
                    <span style={{flex:1,fontSize:13,color:C.text,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.name}</span>
                    <span style={{fontFamily:C.mono,fontSize:12,fontWeight:700,color:C.accent}}>{t.symbol||t.ticker}</span>
                    <span style={{fontSize:11,fontWeight:700,padding:"3px 8px",borderRadius:6,background:buy?C.greenBg:C.redBg,color:buy?C.green:C.red,flexShrink:0}}>{buy?"BUY":"SELL"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>}

        {/* ══ MARKETS ══ */}
        {tab==="markets" && <div style={{animation:"fadeUp 0.25s ease"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
            {Object.values(quotes).slice(0,4).map(q=>(
              <div key={q.ticker} style={{...card,padding:18,cursor:"pointer"}} className="ch" onClick={()=>setModal({ticker:q.ticker,name:q.name})}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                  <div>
                    <div style={{fontSize:11,fontWeight:700,color:C.faint,letterSpacing:"0.06em",textTransform:"uppercase"}}>{q.ticker?.replace("BINANCE:","")}</div>
                    <div style={{fontSize:13,color:C.muted,marginTop:2}}>{q.name}</div>
                  </div>
                  <span style={{fontSize:11,fontWeight:700,padding:"3px 8px",borderRadius:6,background:(q.dp||0)>=0?C.greenBg:C.redBg,color:(q.dp||0)>=0?C.green:C.red}}>{fmtPct(q.dp)}</span>
                </div>
                <div style={{fontFamily:C.mono,fontSize:22,fontWeight:700,color:C.text,marginBottom:10}}>{fmtPrice(q.c)}</div>
                <Spark up={(q.dp||0)>=0} w={140} h={40}/>
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <div style={card}>
              <div style={secTitle}>All Instruments <span style={{fontSize:10,background:C.accentBg,color:C.accent,padding:"1px 6px",borderRadius:4,marginLeft:4}}>click any row</span></div>
              {Object.values(quotes).map(q=>(
                <div key={q.ticker} className="rh" onClick={()=>setModal({ticker:q.ticker,name:q.name})} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 8px",borderRadius:8,marginBottom:2}}>
                  <div style={{width:32,height:32,borderRadius:8,background:C.accentBg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <span style={{fontSize:9,fontWeight:700,color:C.accent}}>{q.ticker?.replace("BINANCE:","").slice(0,4)}</span>
                  </div>
                  <div style={{flex:1}}><div style={{fontSize:12,fontWeight:600,color:C.text}}>{q.name}</div></div>
                  <Spark up={(q.dp||0)>=0} w={50} h={22}/>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontFamily:C.mono,fontSize:13,fontWeight:700,color:C.text}}>{fmtPrice(q.c)}</div>
                    <div style={{fontFamily:C.mono,fontSize:11,fontWeight:600,color:(q.dp||0)>=0?C.green:C.red}}>{fmtPct(q.dp)}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={card}>
              <div style={secTitle}>Market News</div>
              {news.map((n,i)=>(
                <div key={i} className="rh" style={{display:"flex",gap:10,padding:"9px 8px",borderRadius:8,marginBottom:2,alignItems:"flex-start"}}>
                  <span style={{fontSize:10,fontWeight:700,color:C.accent,background:C.accentBg,padding:"2px 7px",borderRadius:6,flexShrink:0,marginTop:2}}>{(n.source||"").slice(0,6)}</span>
                  <a href={n.url||"#"} target="_blank" rel="noreferrer" style={{flex:1,fontSize:13,lineHeight:1.45,color:C.text,fontWeight:500}}>{n.headline}</a>
                  <span style={{fontSize:11,color:C.faint,flexShrink:0}}>{timeAgo(n.datetime)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>}

        {/* ══ CONGRESS ══ */}
        {tab==="congress" && <div style={{animation:"fadeUp 0.25s ease"}}>
          <div style={{...card,marginBottom:16,background:C.amberBg,borderColor:"#fde68a"}}>
            <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.amber} strokeWidth="2" strokeLinecap="round" style={{marginTop:2,flexShrink:0}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <p style={{fontSize:13,color:C.amber,lineHeight:1.6}}>Congressional trades required within 45 days under STOCK Act (2012). {isDemo?`Demo data shown.`:`${congress.length} trades loaded.`} Click any row to view the stock.</p>
            </div>
          </div>
          <div style={card}>
            <div style={secTitle}>Recent Disclosures</div>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead>
                <tr>{["Member","Party","Ticker","Action","Amount","Trade Date"].map(h=><th key={h} style={{textAlign:"left",padding:"8px 12px",fontSize:11,fontWeight:700,color:C.faint,letterSpacing:"0.06em",textTransform:"uppercase",borderBottom:`1px solid ${C.border}`}}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {congress.map((t,i)=>{
                  const buy=isBuy(t); const p=t.party||(i%2===0?"D":"R");
                  return (
                    <tr key={i} className="rh" onClick={()=>setModal({ticker:t.symbol||t.ticker,name:t.symbol||t.ticker})} style={{borderBottom:`1px solid ${C.border}`,cursor:"pointer"}}>
                      <td style={{padding:"12px 12px",fontSize:13,fontWeight:600,color:C.text}}>{t.name}</td>
                      <td style={{padding:"12px 12px"}}><span style={{fontSize:11,fontWeight:700,padding:"3px 8px",borderRadius:6,background:p==="D"?"#eff6ff":"#fff5f5",color:p==="D"?"#2563eb":"#e53e3e"}}>{p}</span></td>
                      <td style={{padding:"12px 12px",fontFamily:C.mono,fontSize:13,fontWeight:700,color:C.accent}}>{t.symbol||t.ticker}</td>
                      <td style={{padding:"12px 12px"}}><span style={{fontSize:12,fontWeight:700,padding:"3px 10px",borderRadius:6,background:buy?C.greenBg:C.redBg,color:buy?C.green:C.red}}>{buy?"BUY":"SELL"}</span></td>
                      <td style={{padding:"12px 12px",fontSize:13,color:C.muted,fontFamily:C.mono}}>{t.amount||t.size||"—"}</td>
                      <td style={{padding:"12px 12px",fontSize:12,color:C.faint,fontFamily:C.mono}}>{(t.transactionDate||"").slice(0,10)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>}

        {/* ══ POLYMARKET ══ */}
        {tab==="polymarket" && <div style={{animation:"fadeUp 0.25s ease"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            {poly.map(p=>(
              <div key={p.id} style={{...card,padding:20}} className="ch">
                <div style={{fontSize:14,fontWeight:600,color:C.text,lineHeight:1.5,marginBottom:16}}>{p.question}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                  {[["YES",p.yes,C.green,C.greenBg],["NO",p.no,C.red,C.redBg]].map(([label,val,col,bg])=>(
                    <div key={label} style={{background:bg,borderRadius:12,padding:"12px 14px"}}>
                      <div style={{fontSize:11,fontWeight:700,color:col,letterSpacing:"0.06em",marginBottom:4}}>{label}</div>
                      <div style={{fontFamily:C.mono,fontSize:24,fontWeight:700,color:col}}>{val}¢</div>
                      <div style={{height:4,background:"rgba(0,0,0,0.06)",borderRadius:99,marginTop:8,overflow:"hidden"}}>
                        <div style={{width:`${val}%`,height:"100%",background:col,borderRadius:99}}/>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.faint}}>
                  <span>Volume {p.volume}</span>
                  {p.endDate&&<span>Ends {p.endDate}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>}

        {/* ══ SIGNALS ══ */}
        {tab==="signals" && <div style={{animation:"fadeUp 0.25s ease"}}>
          <div style={{...card,marginBottom:16,background:C.accentBg,borderColor:"#bfdbfe"}}>
            <p style={{fontSize:13,color:C.accent,lineHeight:1.6}}>Signal feed — curated finance accounts. Connect the Twitter/X API ($100/mo Basic tier) to replace this with a live feed.</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            {DEMO_TWEETS.map((t,i)=>(
              <div key={i} style={{...card}} className="ch">
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12,paddingBottom:12,borderBottom:`1px solid ${C.border}`}}>
                  <div style={{width:38,height:38,borderRadius:12,background:"linear-gradient(135deg,#2563eb,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"white",flexShrink:0}}>{t.handle[0].toUpperCase()}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:C.text}}>{t.name}</div>
                    <div style={{fontSize:11,color:C.faint}}>@{t.handle}</div>
                  </div>
                  <span style={{fontSize:11,color:C.faint}}>{t.time} ago</span>
                </div>
                <p style={{fontSize:13,lineHeight:1.65,color:C.text,marginBottom:12}}>{t.text}</p>
                <div style={{fontSize:12,color:C.faint,display:"flex",alignItems:"center",gap:4}}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  {t.likes}
                </div>
              </div>
            ))}
          </div>
        </div>}

      </div>
    </div>
  );
}
