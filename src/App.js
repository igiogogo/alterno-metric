import { useState, useEffect, useCallback, useRef } from "react";

const FINNHUB_KEY    = process.env.REACT_APP_FINNHUB_KEY || "";
const FINNHUB        = "https://finnhub.io/api/v1";
const COINGECKO      = "https://api.coingecko.com/api/v3";
const POLYMARKET_API = "https://gamma-api.polymarket.com";

const COINGECKO_IDS={BTC:"bitcoin",ETH:"ethereum",SOL:"solana",BNB:"binancecoin",XRP:"ripple",ADA:"cardano",DOGE:"dogecoin",AVAX:"avalanche-2"};
const CG_DAYS={"1W":"7","1M":"30","3M":"90","1Y":"365","5Y":"max"};

// Stock logos via multiple CDN sources for reliability
const STOCK_LOGOS={
  SPY:  "https://logo.clearbit.com/ssga.com",
  QQQ:  "https://logo.clearbit.com/invesco.com",
  NVDA: "https://logo.clearbit.com/nvidia.com",
  AAPL: "https://logo.clearbit.com/apple.com",
  TSLA: "https://logo.clearbit.com/tesla.com",
  META: "https://logo.clearbit.com/meta.com",
  MSFT: "https://logo.clearbit.com/microsoft.com",
  AMZN: "https://logo.clearbit.com/amazon.com",
  GOOGL:"https://logo.clearbit.com/google.com",
  GOOG: "https://logo.clearbit.com/google.com",
  NFLX: "https://logo.clearbit.com/netflix.com",
  AMD:  "https://logo.clearbit.com/amd.com",
  INTC: "https://logo.clearbit.com/intel.com",
  COIN: "https://logo.clearbit.com/coinbase.com",
  JPM:  "https://logo.clearbit.com/jpmorganchase.com",
  GS:   "https://logo.clearbit.com/goldmansachs.com",
  UBER: "https://logo.clearbit.com/uber.com",
  ABNB: "https://logo.clearbit.com/airbnb.com",
  DIS:  "https://logo.clearbit.com/disney.com",
  WMT:  "https://logo.clearbit.com/walmart.com",
  BAC:  "https://logo.clearbit.com/bankofamerica.com",
  V:    "https://logo.clearbit.com/visa.com",
  MA:   "https://logo.clearbit.com/mastercard.com",
  PYPL: "https://logo.clearbit.com/paypal.com",
  SQ:   "https://logo.clearbit.com/block.xyz",
  SNAP: "https://logo.clearbit.com/snap.com",
  TWTR: "https://logo.clearbit.com/twitter.com",
  HOOD: "https://logo.clearbit.com/robinhood.com",
};

const CRYPTO_LOGOS={
  BTC: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
  ETH: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  SOL: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
  BNB: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
  XRP: "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png",
  ADA: "https://assets.coingecko.com/coins/images/975/small/cardano.png",
  DOGE:"https://assets.coingecko.com/coins/images/5/small/dogecoin.png",
  AVAX:"https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png",
};

const CRYPTO_COLORS={BTC:"#f7931a",ETH:"#627eea",SOL:"#9945ff",BNB:"#f3ba2f",XRP:"#00aae4",ADA:"#0033ad",DOGE:"#c2a633",AVAX:"#e84142"};

const STOCK_WATCHLIST=[
  {ticker:"SPY",name:"S&P 500 ETF",type:"etf"},{ticker:"QQQ",name:"Nasdaq 100",type:"etf"},
  {ticker:"NVDA",name:"Nvidia",type:"stock"},{ticker:"AAPL",name:"Apple",type:"stock"},
  {ticker:"TSLA",name:"Tesla",type:"stock"},{ticker:"META",name:"Meta",type:"stock"},
  {ticker:"MSFT",name:"Microsoft",type:"stock"},{ticker:"AMZN",name:"Amazon",type:"stock"},
  {ticker:"GOOGL",name:"Alphabet",type:"stock"},
];
const CRYPTO_WATCHLIST=[
  {ticker:"BINANCE:BTCUSDT",name:"Bitcoin",symbol:"BTC"},
  {ticker:"BINANCE:ETHUSDT",name:"Ethereum",symbol:"ETH"},
  {ticker:"BINANCE:SOLUSDT",name:"Solana",symbol:"SOL"},
  {ticker:"BINANCE:BNBUSDT",name:"BNB",symbol:"BNB"},
  {ticker:"BINANCE:XRPUSDT",name:"XRP",symbol:"XRP"},
  {ticker:"BINANCE:ADAUSDT",name:"Cardano",symbol:"ADA"},
  {ticker:"BINANCE:DOGEUSDT",name:"Dogecoin",symbol:"DOGE"},
  {ticker:"BINANCE:AVAXUSDT",name:"Avalanche",symbol:"AVAX"},
];
const POLY_KEYWORDS=["fed","rate","recession","bitcoin","inflation","oil","iran","ukraine","china","tariff","gdp","crypto"];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmtPrice=(n)=>{if(!n&&n!==0)return"—";if(n>=10000)return n.toLocaleString("en-US",{maximumFractionDigits:0});if(n>=100)return n.toFixed(2);if(n>=1)return n.toFixed(3);return n.toFixed(5);};
const fmtPct=(n)=>(!n&&n!==0)?"—":(n>=0?"+":"")+n.toFixed(2)+"%";
const fmtLarge=(n)=>{if(!n)return"—";if(n>=1e12)return"$"+(n/1e12).toFixed(2)+"T";if(n>=1e9)return"$"+(n/1e9).toFixed(2)+"B";if(n>=1e6)return"$"+(n/1e6).toFixed(2)+"M";return"$"+n.toLocaleString();};
const timeAgo=(ts)=>{if(!ts)return"";const s=Math.floor(Date.now()/1000-ts);if(s<60)return s+"s ago";if(s<3600)return Math.floor(s/60)+"m ago";if(s<86400)return Math.floor(s/3600)+"h ago";return Math.floor(s/86400)+"d ago";};
const isCryptoTicker=(t)=>t?.startsWith("BINANCE:");
const symFromTicker=(t)=>t?.replace("BINANCE:","").replace("USDT","");

// ─── LOGO COMPONENTS ──────────────────────────────────────────────────────────
function StockLogo({ticker,size=34}){
  const [err,setErr]=useState(false);
  const logoUrl=STOCK_LOGOS[ticker];
  if(logoUrl&&!err){
    return(
      <div style={{width:size,height:size,borderRadius:size/3.5,overflow:"hidden",flexShrink:0,background:"#f8fafc",border:"1px solid #e2e8f0",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <img src={logoUrl} alt={ticker} style={{width:size*0.75,height:size*0.75,objectFit:"contain"}}
          onError={()=>setErr(true)}
          crossOrigin="anonymous"/>
      </div>
    );
  }
  // Fallback: colored badge with ticker initials
  return(
    <div style={{width:size,height:size,borderRadius:size/3.5,background:"linear-gradient(135deg,#eff6ff,#dbeafe)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,border:"1px solid #bfdbfe"}}>
      <span style={{fontSize:Math.max(8,size*0.27),fontWeight:700,color:"#1d4ed8",letterSpacing:"-0.02em"}}>{ticker?.slice(0,4)}</span>
    </div>
  );
}

function CryptoLogo({sym,size=34}){
  const [err,setErr]=useState(false);
  const col=CRYPTO_COLORS[sym]||"#7c3aed";
  const logo=CRYPTO_LOGOS[sym];
  if(logo&&!err){
    return(
      <div style={{width:size,height:size,borderRadius:size/2.8,overflow:"hidden",flexShrink:0,background:`${col}12`,border:`1px solid ${col}25`,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <img src={logo} alt={sym} style={{width:size*0.72,height:size*0.72,objectFit:"contain"}} onError={()=>setErr(true)}/>
      </div>
    );
  }
  return(
    <div style={{width:size,height:size,borderRadius:size/2.8,background:`${col}15`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,border:`1px solid ${col}25`}}>
      <span style={{fontSize:size*0.28,fontWeight:800,color:col}}>{sym?.slice(0,3)}</span>
    </div>
  );
}

function AssetLogo({ticker,size=34}){
  const sym=symFromTicker(ticker);
  return isCryptoTicker(ticker)?<CryptoLogo sym={sym} size={size}/>:<StockLogo ticker={ticker} size={size}/>;
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

function PriceChart({ticker,isCrypto}){
  const RANGES=["1W","1M","3M","1Y","5Y"];
  const [data,setData]=useState([]);
  const [range,setRange]=useState("1M");
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(false);
  const canvasRef=useRef(null);
  const sym=symFromTicker(ticker);

  useEffect(()=>{
    setLoading(true);setData([]);setError(false);
    let cancelled=false;
    const load=async()=>{
      try{
        let chartData=[];
        if(isCrypto){
          const cgId=COINGECKO_IDS[sym];
          if(!cgId){setError(true);setLoading(false);return;}
          await new Promise(r=>setTimeout(r,300));
          const res=await fetch(`${COINGECKO}/coins/${cgId}/market_chart?vs_currency=usd&days=${CG_DAYS[range]||"30"}&precision=4`);
          if(!res.ok){setError(true);setLoading(false);return;}
          const d=await res.json();
          if(d.prices?.length>1){const step=Math.max(1,Math.floor(d.prices.length/200));chartData=d.prices.filter((_,i)=>i%step===0).map(([t,c])=>({t,c}));}
        } else {
          const now=Math.floor(Date.now()/1000);
          const fromMap={"1W":now-604800,"1M":now-2592000,"3M":now-7776000,"1Y":now-31536000,"5Y":now-157680000};
          const resMap={"1W":"60","1M":"D","3M":"D","1Y":"W","5Y":"M"};
          if(!FINNHUB_KEY){
            const from=fromMap[range];let val=100;
            chartData=Array.from({length:60},(_,i)=>{val+=(Math.random()-0.48)*3;return{t:(from+(i/59)*(now-from))*1000,c:Math.max(10,val)};});
          } else {
            const res=await fetch(`${FINNHUB}/stock/candle?symbol=${ticker}&resolution=${resMap[range]}&from=${fromMap[range]}&to=${now}&token=${FINNHUB_KEY}`);
            const d=await res.json();
            if(d.s==="ok"&&d.c?.length>1)chartData=d.t.map((t,i)=>({t:t*1000,c:d.c[i]}));
          }
        }
        if(!cancelled){if(chartData.length>1)setData(chartData);else setError(true);setLoading(false);}
      }catch{if(!cancelled){setError(true);setLoading(false);}}
    };
    load();return()=>{cancelled=true;};
  },[ticker,range,isCrypto,sym]); // eslint-disable-line

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
function PinBtn({ticker,pinned,onToggle,size="sm"}){
  const isPinned=pinned.has(ticker);
  const sz=size==="lg"?34:26;
  return(
    <button onClick={e=>{e.stopPropagation();onToggle(ticker);}}
      title={isPinned?"Remove from watchlist":"Add to watchlist"}
      style={{width:sz,height:sz,borderRadius:8,border:isPinned?"1px solid #fde68a":"1px solid #e2e8f0",cursor:"pointer",background:isPinned?"#fef9c3":"transparent",color:isPinned?"#ca8a04":"#d1d5db",fontSize:size==="lg"?18:14,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.15s"}}
      onMouseEnter={e=>{if(!isPinned){e.currentTarget.style.borderColor="#fde68a";e.currentTarget.style.color="#f59e0b";}}}
      onMouseLeave={e=>{if(!isPinned){e.currentTarget.style.borderColor="#e2e8f0";e.currentTarget.style.color="#d1d5db";}}}
    >★</button>
  );
}

// ─── ASSET MODAL ──────────────────────────────────────────────────────────────
function AssetModal({ticker,name,onClose,C,pinned,onToggle}){
  const [quote,setQuote]=useState(null);
  const [details,setDetails]=useState(null);
  const [loading,setLoading]=useState(true);
  const crypto=isCryptoTicker(ticker);
  const sym=symFromTicker(ticker);
  const isPinned=pinned.has(ticker);

  useEffect(()=>{
    const load=async()=>{
      try{
        if(crypto){
          const cgId=COINGECKO_IDS[sym];
          if(!cgId){setLoading(false);return;}
          const res=await fetch(`${COINGECKO}/coins/${cgId}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false`);
          const d=await res.json();const md=d.market_data;
          setQuote({c:md.current_price?.usd,d:md.price_change_24h,dp:md.price_change_percentage_24h,h:md.high_24h?.usd,l:md.low_24h?.usd});
          setDetails({name:d.name,marketCap:md.market_cap?.usd,volume24h:md.total_volume?.usd,ath:md.ath?.usd,athDate:md.ath_date?.usd?.slice(0,10),atl:md.atl?.usd,circulatingSupply:md.circulating_supply,totalSupply:md.total_supply,rank:d.market_cap_rank,description:d.description?.en?.replace(/<[^>]*>/g,"").split(".")[0]});
        } else {
          if(!FINNHUB_KEY){
            setQuote({c:189.30,d:-1.2,dp:-0.63,h:192.1,l:187.4,pc:190.5});
            setDetails({name:name||sym,exchange:"NASDAQ",industry:"Technology",marketCap:2.94e12,pe:29.4,eps:6.43,high52w:237.23,low52w:164.08,beta:1.24});
            setLoading(false);return;
          }
          const [q,p,m]=await Promise.all([
            fetch(`${FINNHUB}/quote?symbol=${ticker}&token=${FINNHUB_KEY}`).then(r=>r.json()),
            fetch(`${FINNHUB}/stock/profile2?symbol=${ticker}&token=${FINNHUB_KEY}`).then(r=>r.json()),
            fetch(`${FINNHUB}/stock/metric?symbol=${ticker}&metric=all&token=${FINNHUB_KEY}`).then(r=>r.json()),
          ]);
          setQuote(q);
          setDetails({name:p.name||name||sym,logo:p.logo,exchange:p.exchange,industry:p.finnhubIndustry,marketCap:(p.marketCapitalization||0)*1e6,pe:m?.metric?.peNormalizedAnnual,eps:m?.metric?.epsNormalizedAnnual,high52w:m?.metric?.["52WeekHigh"],low52w:m?.metric?.["52WeekLow"],beta:m?.metric?.beta});
        }
      }catch(e){console.error(e);}
      setLoading(false);
    };
    load();
  },[ticker]); // eslint-disable-line

  const up=(quote?.dp||0)>=0;
  const col=crypto?(CRYPTO_COLORS[sym]||"#7c3aed"):null;
  const Stat=({label,value,sub})=>(
    <div style={{background:C.bg,borderRadius:10,padding:"11px 13px"}}>
      <div style={{fontSize:10,fontWeight:700,color:C.faint,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:3}}>{label}</div>
      <div style={{fontSize:14,fontWeight:700,color:C.text,fontFamily:"'JetBrains Mono',monospace",wordBreak:"break-all"}}>{value||"—"}</div>
      {sub&&<div style={{fontSize:10,color:C.faint,marginTop:2}}>{sub}</div>}
    </div>
  );

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20,backdropFilter:"blur(6px)"}}
         onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:C.surface,borderRadius:20,width:"100%",maxWidth:660,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 24px 64px rgba(0,0,0,0.22)"}}>
        <div style={{padding:"16px 22px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,background:C.surface,zIndex:1,borderRadius:"20px 20px 0 0"}}>
          <AssetLogo ticker={ticker} size={42}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              <span style={{fontSize:17,fontWeight:800,color:C.text,letterSpacing:"-0.02em"}}>{details?.name||name||sym}</span>
              <span style={{fontSize:11,fontWeight:700,color:C.muted,background:C.bg,padding:"2px 8px",borderRadius:6}}>{crypto?sym:ticker}</span>
              {crypto&&details?.rank&&<span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:6,background:`${col}15`,color:col}}>#{details.rank}</span>}
              {!crypto&&details?.exchange&&<span style={{fontSize:11,color:C.faint}}>{details.exchange}</span>}
            </div>
            {(details?.description||details?.industry)&&<div style={{fontSize:11,color:C.faint,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:360}}>{details.description||details.industry}</div>}
          </div>
          {/* BIG PIN BUTTON IN MODAL */}
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,flexShrink:0}}>
            <PinBtn ticker={ticker} pinned={pinned} onToggle={onToggle} size="lg"/>
            <span style={{fontSize:9,fontWeight:700,letterSpacing:"0.06em",color:isPinned?C.amber:C.faint}}>{isPinned?"PINNED":"PIN"}</span>
          </div>
          <button onClick={onClose} style={{width:30,height:30,borderRadius:8,border:`1px solid ${C.border}`,background:"transparent",cursor:"pointer",color:C.muted,fontSize:16,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
        <div style={{padding:"18px 22px"}}>
          {loading
            ?<div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:56,gap:10,color:C.muted,fontSize:13}}><span style={{display:"inline-block",width:20,height:20,border:`2.5px solid ${C.border}`,borderTopColor:C.accent,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>Loading…</div>
            :<>
              <div style={{display:"flex",alignItems:"flex-end",gap:12,marginBottom:16}}>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:34,fontWeight:800,color:C.text,letterSpacing:"-0.03em"}}>${fmtPrice(quote?.c)}</span>
                <div style={{paddingBottom:4}}>
                  <span style={{fontSize:14,fontWeight:700,color:up?C.green:C.red}}>{up?"↑":"↓"} ${fmtPrice(Math.abs(quote?.d||0))} ({fmtPct(quote?.dp)})</span>
                  <div style={{fontSize:11,color:C.faint}}>24h · USD</div>
                </div>
              </div>
              <PriceChart ticker={ticker} isCrypto={crypto}/>
              <div style={{marginTop:16}}>
                <div style={{fontSize:11,fontWeight:700,color:C.faint,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10}}>{crypto?"Market Data":"Fundamentals"}</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                  <Stat label="Market Cap" value={fmtLarge(details?.marketCap)}/>
                  {crypto?<>
                    <Stat label="24h Volume" value={fmtLarge(details?.volume24h)}/>
                    <Stat label="Rank" value={details?.rank?"#"+details.rank:"—"}/>
                    <Stat label="24h High" value={quote?.h?"$"+fmtPrice(quote.h):"—"}/>
                    <Stat label="24h Low" value={quote?.l?"$"+fmtPrice(quote.l):"—"}/>
                    <Stat label="All-Time High" value={details?.ath?"$"+fmtPrice(details.ath):"—"} sub={details?.athDate}/>
                    <Stat label="All-Time Low" value={details?.atl?"$"+fmtPrice(details.atl):"—"}/>
                    <Stat label="Circulating" value={details?.circulatingSupply?Number(details.circulatingSupply.toFixed(0)).toLocaleString()+" "+sym:"—"}/>
                    <Stat label="Total Supply" value={details?.totalSupply?Number(details.totalSupply.toFixed(0)).toLocaleString()+" "+sym:"Unlimited"}/>
                  </>:<>
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
            </>
          }
        </div>
      </div>
    </div>
  );
}

// ─── TICKER TAPE ──────────────────────────────────────────────────────────────
function TickerTape({allQuotes,onSelect}){
  const items=Object.values(allQuotes).filter(q=>q.c);
  return(
    <div style={{background:"#f0f4ff",borderBottom:"1px solid #e2e8f0",overflow:"hidden",height:32,display:"flex",alignItems:"center"}}>
      <style>{`@keyframes scrolltape{0%{transform:translateX(0)}100%{transform:translateX(-50%)}} .tapew{display:flex;animation:scrolltape 70s linear infinite;white-space:nowrap;}`}</style>
      {items.length===0?<span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,color:"#94a3b8",paddingLeft:16}}>Loading…</span>
      :<div className="tapew">{[...items,...items].map((q,i)=>{
        const sym=q.symbol||symFromTicker(q.ticker)||q.ticker;
        return(
          <span key={i} onClick={()=>onSelect(q.ticker,q.name)} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"0 14px",fontSize:11,fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:500,cursor:"pointer"}}>
            {CRYPTO_LOGOS[sym]?<img src={CRYPTO_LOGOS[sym]} alt={sym} style={{width:13,height:13,borderRadius:"50%"}}/>:null}
            <span style={{color:"#64748b"}}>{sym?.slice(0,6)}</span>
            <span style={{color:"#1e293b"}}>{fmtPrice(q.c)}</span>
            <span style={{color:(q.dp||0)>=0?"#0ea569":"#e53e3e",fontWeight:600}}>{(q.dp||0)>=0?"↑":"↓"}{Math.abs(q.dp||0).toFixed(2)}%</span>
          </span>
        );
      })}</div>}
    </div>
  );
}

// ─── WATCHLIST STRIP (under ticker tape) ─────────────────────────────────────
function WatchlistStrip({pinned,allQuotes,onSelect,onUnpin,C}){
  const items=[...pinned].map(id=>allQuotes[id]).filter(Boolean);
  return(
    <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"8px 22px",display:"flex",alignItems:"center",gap:8,overflowX:"auto",minHeight:44}}>
      <span style={{fontSize:10,fontWeight:700,color:C.faint,letterSpacing:"0.1em",textTransform:"uppercase",flexShrink:0}}>Watchlist</span>
      {items.length===0
        ?<span style={{fontSize:12,color:C.faint}}>— click ★ on any asset or in the modal to pin it here</span>
        :items.map(q=>{
          const crypto=isCryptoTicker(q.ticker);
          const sym=q.symbol||symFromTicker(q.ticker)||q.ticker;
          const up=(q.dp||0)>=0;
          return(
            <div key={q.ticker} onClick={()=>onSelect(q.ticker,q.name)}
              style={{display:"inline-flex",alignItems:"center",gap:7,padding:"5px 10px",borderRadius:10,background:C.bg,border:`1px solid ${C.border}`,cursor:"pointer",flexShrink:0,transition:"all 0.15s",position:"relative"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor="#bfdbfe"}
              onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
              {crypto?<CryptoLogo sym={sym} size={22}/>:<StockLogo ticker={q.ticker} size={22}/>}
              <div>
                <div style={{fontSize:11,fontWeight:700,color:C.text,fontFamily:"'JetBrains Mono',monospace"}}>{crypto?"$":""}{fmtPrice(q.c)}</div>
                <div style={{fontSize:10,color:up?C.green:C.red,fontWeight:600}}>{fmtPct(q.dp)}</div>
              </div>
              <span style={{fontSize:10,fontWeight:700,color:C.muted}}>{sym.slice(0,5)}</span>
              <button onClick={e=>{e.stopPropagation();onUnpin(q.ticker);}}
                style={{position:"absolute",top:-5,right:-5,width:16,height:16,borderRadius:"50%",background:"#e2e8f0",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:C.muted,fontWeight:700}}>✕</button>
            </div>
          );
        })
      }
    </div>
  );
}

// ─── DEMO DATA ────────────────────────────────────────────────────────────────
const DEMO_SQ={SPY:{ticker:"SPY",name:"S&P 500 ETF",c:524.38,dp:0.24,type:"etf"},QQQ:{ticker:"QQQ",name:"Nasdaq 100",c:447.92,dp:0.64,type:"etf"},NVDA:{ticker:"NVDA",name:"Nvidia",c:887.24,dp:2.47,type:"stock"},AAPL:{ticker:"AAPL",name:"Apple",c:189.30,dp:-0.63,type:"stock"},TSLA:{ticker:"TSLA",name:"Tesla",c:174.48,dp:2.84,type:"stock"},META:{ticker:"META",name:"Meta",c:512.63,dp:1.45,type:"stock"},MSFT:{ticker:"MSFT",name:"Microsoft",c:415.60,dp:0.82,type:"stock"},AMZN:{ticker:"AMZN",name:"Amazon",c:182.40,dp:1.10,type:"stock"},GOOGL:{ticker:"GOOGL",name:"Alphabet",c:162.30,dp:0.55,type:"stock"}};
const DEMO_CQ={"BINANCE:BTCUSDT":{ticker:"BINANCE:BTCUSDT",name:"Bitcoin",symbol:"BTC",c:68420,dp:1.85,type:"crypto"},"BINANCE:ETHUSDT":{ticker:"BINANCE:ETHUSDT",name:"Ethereum",symbol:"ETH",c:3280,dp:1.12,type:"crypto"},"BINANCE:SOLUSDT":{ticker:"BINANCE:SOLUSDT",name:"Solana",symbol:"SOL",c:142.50,dp:3.21,type:"crypto"},"BINANCE:BNBUSDT":{ticker:"BINANCE:BNBUSDT",name:"BNB",symbol:"BNB",c:412.80,dp:0.94,type:"crypto"},"BINANCE:XRPUSDT":{ticker:"BINANCE:XRPUSDT",name:"XRP",symbol:"XRP",c:0.5821,dp:-0.43,type:"crypto"},"BINANCE:ADAUSDT":{ticker:"BINANCE:ADAUSDT",name:"Cardano",symbol:"ADA",c:0.4432,dp:1.23,type:"crypto"},"BINANCE:DOGEUSDT":{ticker:"BINANCE:DOGEUSDT",name:"Dogecoin",symbol:"DOGE",c:0.1621,dp:2.10,type:"crypto"},"BINANCE:AVAXUSDT":{ticker:"BINANCE:AVAXUSDT",name:"Avalanche",symbol:"AVAX",c:34.82,dp:-1.20,type:"crypto"}};
const DEMO_NEWS=[{id:1,source:"Reuters",headline:"Fed officials signal caution on rate cuts as inflation stays sticky",datetime:Math.floor(Date.now()/1000)-1800,url:"#"},{id:2,source:"Bloomberg",headline:"Nvidia surges as data centre demand exceeds Wall Street estimates",datetime:Math.floor(Date.now()/1000)-3600,url:"#"},{id:3,source:"WSJ",headline:"Treasury yields climb as investors reassess Fed cut timeline",datetime:Math.floor(Date.now()/1000)-5400,url:"#"},{id:4,source:"FT",headline:"Private equity dry powder hits $2.6 trillion record high",datetime:Math.floor(Date.now()/1000)-7200,url:"#"},{id:5,source:"Bloomberg",headline:"Goldman raises S&P 500 year-end target to 5,600",datetime:Math.floor(Date.now()/1000)-9000,url:"#"},{id:6,source:"Reuters",headline:"Oil falls on demand concerns despite Middle East tensions",datetime:Math.floor(Date.now()/1000)-10800,url:"#"},{id:7,source:"CoinDesk",headline:"Bitcoin ETF inflows reach $500M in a single day for first time",datetime:Math.floor(Date.now()/1000)-14400,url:"#"}];
const DEMO_CONGRESS=[{name:"Nancy Pelosi",party:"D",state:"CA",symbol:"NVDA",transactionType:"Buy",amount:"$1M–$5M",transactionDate:"2025-04-07"},{name:"Dan Crenshaw",party:"R",state:"TX",symbol:"LMT",transactionType:"Buy",amount:"$50K–$100K",transactionDate:"2025-04-05"},{name:"Josh Gottheimer",party:"D",state:"NJ",symbol:"MSFT",transactionType:"Sale",amount:"$500K–$1M",transactionDate:"2025-04-04"},{name:"Tommy Tuberville",party:"R",state:"AL",symbol:"XOM",transactionType:"Buy",amount:"$100K–$250K",transactionDate:"2025-04-03"},{name:"Ro Khanna",party:"D",state:"CA",symbol:"AMZN",transactionType:"Buy",amount:"$50K–$100K",transactionDate:"2025-04-02"}];
const DEMO_TWEETS=[{handle:"RaoulGMI",name:"Raoul Pal",text:"The Everything Code keeps playing out. Liquidity drives all assets. Watch the Fed balance sheet, not the rate.",likes:"12.8K",time:"2h"},{handle:"elerianm",name:"Mohamed El-Erian",text:"Today's CPI print will be closely watched. Any upside surprise risks a sharp repricing in rate expectations.",likes:"7.1K",time:"3h"},{handle:"LukeGromen",name:"Luke Gromen",text:"The bond market is telling you something equities haven't priced yet. Fiscal dominance is here.",likes:"5.9K",time:"4h"},{handle:"naval",name:"Naval Ravikant",text:"Inflation is a hidden tax on savers. The monetary system redistributes from the cautious to the leveraged.",likes:"31.4K",time:"1h"},{handle:"APompliano",name:"Anthony Pompliano",text:"Bitcoin is up on the day while the dollar weakens. This is the trade of the decade.",likes:"9.3K",time:"2h"},{handle:"zerohedge",name:"ZeroHedge",text:"JPMorgan cuts GDP forecast — stagflation risks rising, strategists warn.",likes:"6.4K",time:"3h"}];

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App(){
  const [tab,setTab]=useState("overview");
  const [clock,setClock]=useState(new Date());
  const [stockQ,setStockQ]=useState({});
  const [cryptoQ,setCryptoQ]=useState({});
  const [searchedQ,setSearchedQ]=useState({});
  const [news,setNews]=useState([]);
  const [congress,setCongress]=useState([]);
  const [poly,setPoly]=useState([]);
  const [brief,setBrief]=useState("");
  const [briefing,setBriefing]=useState(false);
  const [briefDone,setBriefDone]=useState(false);
  const [modal,setModal]=useState(null);
  const [search,setSearch]=useState("");
  const [searching,setSearching]=useState(false);
  const [pinned,setPinned]=useState(()=>{try{return new Set(JSON.parse(localStorage.getItem("am_pinned")||"[]"));}catch{return new Set();}});
  const searchRef=useRef(null);
  const isDemo=!FINNHUB_KEY;

  const allQuotes={...stockQ,...cryptoQ,...searchedQ};

  useEffect(()=>{try{localStorage.setItem("am_pinned",JSON.stringify([...pinned]));}catch{};},[pinned]);
  const togglePin=useCallback((ticker)=>{setPinned(prev=>{const next=new Set(prev);if(next.has(ticker))next.delete(ticker);else next.add(ticker);return next;});},[]);

  useEffect(()=>{const t=setInterval(()=>setClock(new Date()),1000);return()=>clearInterval(t);},[]);

  const handleSearch=async(e)=>{
    if(e.key!=="Enter"||!search.trim())return;
    const raw=search.trim().toUpperCase();
    setSearching(true);
    const cgId=COINGECKO_IDS[raw];
    if(cgId){
      const match=CRYPTO_WATCHLIST.find(w=>w.symbol===raw);
      const t=match?.ticker||`BINANCE:${raw}USDT`;
      try{
        const r=await fetch(`${COINGECKO}/simple/price?ids=${cgId}&vs_currencies=usd&include_24hr_change=true`);
        const d=await r.json();
        if(d[cgId])setSearchedQ(prev=>({...prev,[t]:{ticker:t,name:raw,symbol:raw,type:"crypto",c:d[cgId].usd,dp:d[cgId].usd_24h_change||0}}));
      }catch{}
      setModal({ticker:t,name:raw});setSearch("");setSearching(false);return;
    }
    if(!FINNHUB_KEY){
      setSearchedQ(prev=>({...prev,[raw]:{ticker:raw,name:raw,c:150,dp:0.5,type:"stock"}}));
      setModal({ticker:raw,name:raw});setSearch("");setSearching(false);return;
    }
    try{
      const r=await fetch(`${FINNHUB}/quote?symbol=${raw}&token=${FINNHUB_KEY}`);
      const d=await r.json();
      if(d.c&&d.c>0){
        setSearchedQ(prev=>({...prev,[raw]:{ticker:raw,name:raw,c:d.c,dp:d.dp||0,type:"stock"}}));
        setModal({ticker:raw,name:raw});setSearch("");
      } else alert(`"${raw}" not found. Try AAPL, NFLX, BTC, SOL…`);
    }catch{setSearchedQ(prev=>({...prev,[raw]:{ticker:raw,name:raw,c:0,dp:0,type:"stock"}}));setModal({ticker:raw,name:raw});setSearch("");}
    setSearching(false);
  };

  const fetchStocks=useCallback(async()=>{
    if(isDemo){setStockQ(DEMO_SQ);return;}
    try{
      const res=await Promise.all(STOCK_WATCHLIST.map(async w=>{const r=await fetch(`${FINNHUB}/quote?symbol=${w.ticker}&token=${FINNHUB_KEY}`);const d=await r.json();return{ticker:w.ticker,name:w.name,type:w.type,...d};}));
      const m={};res.forEach(r=>{m[r.ticker]=r;});setStockQ(m);
    }catch{setStockQ(DEMO_SQ);}
  },[isDemo]);

  const fetchCrypto=useCallback(async()=>{
    if(isDemo){setCryptoQ(DEMO_CQ);return;}
    try{
      const ids=Object.values(COINGECKO_IDS).join(",");
      const r=await fetch(`${COINGECKO}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`);
      const d=await r.json();const m={};
      CRYPTO_WATCHLIST.forEach(w=>{const cgId=COINGECKO_IDS[w.symbol];if(cgId&&d[cgId])m[w.ticker]={ticker:w.ticker,name:w.name,symbol:w.symbol,type:"crypto",c:d[cgId].usd,dp:d[cgId].usd_24h_change||0};});
      if(Object.keys(m).length>0)setCryptoQ(m);else setCryptoQ(DEMO_CQ);
    }catch{setCryptoQ(DEMO_CQ);}
  },[isDemo]);

  const refreshSearched=useCallback(async()=>{
    if(Object.keys(searchedQ).length===0)return;
    for(const ticker of Object.keys(searchedQ)){
      try{
        if(isCryptoTicker(ticker)){
          const sym=symFromTicker(ticker);const cgId=COINGECKO_IDS[sym];if(!cgId)continue;
          const r=await fetch(`${COINGECKO}/simple/price?ids=${cgId}&vs_currencies=usd&include_24hr_change=true`);
          const d=await r.json();if(d[cgId])setSearchedQ(prev=>({...prev,[ticker]:{...prev[ticker],c:d[cgId].usd,dp:d[cgId].usd_24h_change||0}}));
        } else if(FINNHUB_KEY){
          const r=await fetch(`${FINNHUB}/quote?symbol=${ticker}&token=${FINNHUB_KEY}`);const d=await r.json();
          if(d.c)setSearchedQ(prev=>({...prev,[ticker]:{...prev[ticker],c:d.c,dp:d.dp||0}}));
        }
      }catch{}
    }
  },[searchedQ]);

  const fetchNews=useCallback(async()=>{
    if(isDemo){setNews(DEMO_NEWS);return;}
    try{const r=await fetch(`${FINNHUB}/news?category=general&token=${FINNHUB_KEY}`);const d=await r.json();setNews((d||[]).slice(0,20));}
    catch{setNews(DEMO_NEWS);}
  },[isDemo]);

  const fetchCongress=useCallback(async()=>{
    if(isDemo){setCongress(DEMO_CONGRESS);return;}
    try{const r=await fetch(`${FINNHUB}/stock/congressional-trading?symbol=&token=${FINNHUB_KEY}`);const d=await r.json();setCongress((d?.data||[]).slice(0,20));}
    catch{setCongress(DEMO_CONGRESS);}
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
    fetchStocks();fetchCrypto();fetchNews();fetchCongress();fetchPoly();
    const iv=[setInterval(fetchStocks,30000),setInterval(fetchCrypto,60000),setInterval(refreshSearched,60000),setInterval(fetchNews,300000),setInterval(fetchCongress,900000),setInterval(fetchPoly,120000)];
    return()=>iv.forEach(clearInterval);
  },[fetchStocks,fetchCrypto,fetchNews,fetchCongress,fetchPoly,refreshSearched]);

  async function generateBriefing(){
    setBriefing(true);setBrief("");setBriefDone(false);
    const qStr=[...Object.values(stockQ).slice(0,4),...Object.values(cryptoQ).slice(0,3)].map(q=>`${q.symbol||q.ticker} ${fmtPrice(q.c)} (${fmtPct(q.dp)})`).join(", ");
    const nStr=news.slice(0,5).map(n=>`• ${n.headline}`).join("\n");
    const pStr=poly.slice(0,4).map(p=>`• "${p.question}" YES ${p.yes}%`).join("\n");
    const cStr=congress.slice(0,3).map(t=>`• ${t.name} ${(t.transactionType||"").toUpperCase()} ${t.symbol}`).join("\n");
    const prompt=`You are a senior market strategist. Write a 4-5 sentence intelligence briefing for sophisticated investors covering: the dominant market/crypto theme today, what congressional trades may signal, what prediction markets are pricing in, and one key risk. Be direct — no filler.\n\nMarkets: ${qStr}\n\nNews:\n${nStr}\n\nPolymarket:\n${pStr}\n\nCongress:\n${cStr}`;
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:prompt}]})});
      const data=await res.json();setBrief(data.content?.map(b=>b.text||"").join("")||"Unable to generate.");
    }catch{setBrief("AI briefing unavailable.");}
    setBriefing(false);setBriefDone(true);
  }

  const isBuy=(t)=>(t.transactionType||"").toLowerCase().match(/buy|purchase/);
  // ── TABS: added "watchlist" ──
  const TABS=["overview","markets","crypto","watchlist","congress","polymarket","signals"];

  const C={bg:"#f8fafc",surface:"#ffffff",border:"#e2e8f0",text:"#1e293b",muted:"#64748b",faint:"#94a3b8",accent:"#2563eb",accentBg:"#eff6ff",green:"#0ea569",greenBg:"#f0fdf4",red:"#e53e3e",redBg:"#fff5f5",amber:"#d97706",amberBg:"#fffbeb",sans:"'Plus Jakarta Sans',sans-serif",mono:"'JetBrains Mono',monospace"};
  const card={background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:20};
  const secTitle={fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:C.faint,marginBottom:14,fontFamily:C.sans};

  // ── Shared row components ──
  const StockRow=({q,showPin=true})=>(
    <div className="rh" style={{display:"flex",alignItems:"center",gap:9,padding:"8px",borderRadius:8,marginBottom:2}} onClick={()=>setModal({ticker:q.ticker,name:q.name})}>
      <StockLogo ticker={q.ticker} size={34}/>
      <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:600,color:C.text}}>{q.name}</div><div style={{fontSize:11,color:C.faint}}>{q.ticker}</div></div>
      <Spark up={(q.dp||0)>=0} w={50} h={24}/>
      <div style={{textAlign:"right",minWidth:76}}><div style={{fontSize:13,fontWeight:700,color:C.text,fontFamily:C.mono}}>{fmtPrice(q.c)}</div><div style={{fontSize:11,fontWeight:600,color:(q.dp||0)>=0?C.green:C.red,fontFamily:C.mono}}>{fmtPct(q.dp)}</div></div>
      {showPin&&<PinBtn ticker={q.ticker} pinned={pinned} onToggle={togglePin}/>}
    </div>
  );

  const CryptoRow=({q,showPin=true})=>{
    const sym=q.symbol||symFromTicker(q.ticker);const up=(q.dp||0)>=0;
    return(
      <div className="rh" style={{display:"flex",alignItems:"center",gap:9,padding:"8px",borderRadius:8,marginBottom:2}} onClick={()=>setModal({ticker:q.ticker,name:q.name})}>
        <CryptoLogo sym={sym} size={34}/>
        <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:600,color:C.text}}>{q.name}</div><div style={{fontSize:11,color:C.faint}}>{sym}</div></div>
        <Spark up={up} w={50} h={24}/>
        <div style={{textAlign:"right",minWidth:84}}><div style={{fontSize:13,fontWeight:700,color:C.text,fontFamily:C.mono}}>${fmtPrice(q.c)}</div><div style={{fontSize:11,fontWeight:600,color:up?C.green:C.red,fontFamily:C.mono}}>{fmtPct(q.dp)}</div></div>
        {showPin&&<PinBtn ticker={q.ticker} pinned={pinned} onToggle={togglePin}/>}
      </div>
    );
  };

  const pinnedItems=[...pinned].map(id=>allQuotes[id]).filter(Boolean);
  const pinnedStocks=pinnedItems.filter(q=>!isCryptoTicker(q.ticker));
  const pinnedCrypto=pinnedItems.filter(q=>isCryptoTicker(q.ticker));

  return(
    <div style={{background:C.bg,minHeight:"100vh",color:C.text,fontFamily:C.sans}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px;height:4px;background:#f1f5f9}
        ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:4px}
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

        {/* Nav tabs */}
        <div style={{display:"flex",gap:1}}>
          {TABS.map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{padding:"5px 10px",borderRadius:7,fontSize:12,fontWeight:600,fontFamily:C.sans,cursor:"pointer",border:"none",transition:"all 0.15s",
              background:tab===t?(t==="watchlist"?"#fef9c3":C.accentBg):"transparent",
              color:tab===t?(t==="watchlist"?C.amber:C.accent):C.muted,
              textTransform:"capitalize",
              display:"flex",alignItems:"center",gap:4,
            }}>
              {t==="watchlist"&&<span style={{fontSize:11}}>★</span>}
              {t}
              {t==="watchlist"&&pinned.size>0&&<span style={{background:C.amber,color:"white",borderRadius:10,padding:"1px 5px",fontSize:9,fontWeight:700}}>{pinned.size}</span>}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{flex:1,maxWidth:260,position:"relative"}}>
          <svg style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.faint} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input ref={searchRef} value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={handleSearch}
            placeholder="Search AAPL, NFLX, BTC… then ★ to pin"
            style={{width:"100%",padding:"7px 10px 7px 26px",borderRadius:9,border:`1px solid ${C.border}`,background:C.bg,fontSize:12,color:C.text,fontFamily:C.sans,outline:"none",transition:"border-color 0.15s"}}
            onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
          {searching&&<span style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",display:"inline-block",width:11,height:11,border:`2px solid ${C.border}`,borderTopColor:C.accent,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>}
        </div>

        {/* Clock */}
        <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0,marginLeft:"auto"}}>
          {isDemo&&<span style={{fontSize:11,fontWeight:600,padding:"3px 9px",background:C.amberBg,color:C.amber,borderRadius:20,border:"1px solid #fde68a"}}>Demo</span>}
          <div style={{textAlign:"right"}}><div style={{fontSize:12,fontWeight:600,color:C.text,fontFamily:C.mono}}>{clock.toLocaleTimeString("en-GB")}</div><div style={{fontSize:10,color:C.faint}}>{clock.toLocaleDateString("en-GB",{weekday:"short",day:"2-digit",month:"short"})}</div></div>
          <div style={{width:7,height:7,borderRadius:"50%",background:C.green,boxShadow:"0 0 0 3px #dcfce7",animation:"shimmer 2s infinite"}}/>
        </div>
      </div>

      <TickerTape allQuotes={allQuotes} onSelect={(ticker,name)=>setModal({ticker,name})}/>
      <WatchlistStrip pinned={pinned} allQuotes={allQuotes} onSelect={(ticker,name)=>setModal({ticker,name})} onUnpin={togglePin} C={C}/>
      {modal&&<AssetModal ticker={modal.ticker} name={modal.name} onClose={()=>setModal(null)} C={C} pinned={pinned} onToggle={togglePin}/>}

      <div style={{maxWidth:1200,margin:"0 auto",padding:"20px"}}>

        {/* ══ OVERVIEW ══ */}
        {tab==="overview"&&<div style={{animation:"fadeUp 0.25s ease"}}>
          <div style={{...card,marginBottom:16,background:briefDone?"linear-gradient(135deg,#eff6ff,#f5f3ff)":C.surface,borderColor:briefDone?"#bfdbfe":C.border}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:brief||briefing?14:0}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:30,height:30,borderRadius:9,background:"linear-gradient(135deg,#2563eb,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg></div>
                <div><div style={{fontSize:13,fontWeight:700,color:C.text}}>AI Morning Briefing</div><div style={{fontSize:11,color:C.faint}}>Powered by Claude</div></div>
              </div>
              <button onClick={generateBriefing} disabled={briefing} style={{padding:"7px 16px",borderRadius:9,fontSize:13,fontWeight:600,fontFamily:C.sans,cursor:briefing?"default":"pointer",border:"none",background:briefing?"#e2e8f0":"linear-gradient(135deg,#2563eb,#7c3aed)",color:briefing?C.muted:"white",boxShadow:briefing?"none":"0 2px 8px rgba(37,99,235,0.3)"}}>{briefing?"Generating…":"Generate briefing"}</button>
            </div>
            {briefing&&<div style={{display:"flex",alignItems:"center",gap:8,color:C.muted,fontSize:13}}><span style={{display:"inline-block",width:14,height:14,border:"2px solid #e2e8f0",borderTopColor:C.accent,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>Analysing…</div>}
            {brief&&<p style={{fontSize:14,lineHeight:1.75,color:C.text}}>{brief}</p>}
            {!brief&&!briefing&&<p style={{fontSize:13,color:C.faint}}>AI-powered intelligence summary synthesising today's markets, crypto, news, congressional trades and prediction markets.</p>}
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
            <div style={card}>
              <div style={secTitle}>Key Markets <span style={{fontSize:10,background:C.accentBg,color:C.accent,padding:"1px 6px",borderRadius:4,marginLeft:4,fontWeight:600,letterSpacing:0}}>★ to pin · click to expand</span></div>
              {Object.values(stockQ).slice(0,6).map(q=><StockRow key={q.ticker} q={q}/>)}
            </div>
            <div style={card}>
              <div style={secTitle}>Crypto <span style={{fontSize:10,background:"#f5f3ff",color:"#7c3aed",padding:"1px 6px",borderRadius:4,marginLeft:4,fontWeight:600,letterSpacing:0}}>★ to pin · click to expand</span></div>
              {Object.values(cryptoQ).slice(0,6).map(q=><CryptoRow key={q.ticker} q={q}/>)}
            </div>
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
            <div style={{display:"grid",gridTemplateRows:"auto auto",gap:14}}>
              <div style={card}>
                <div style={secTitle}>Polymarket Odds</div>
                {poly.slice(0,3).map(p=>(
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
              <div style={card}>
                <div style={secTitle}>Congress Trades</div>
                {congress.slice(0,4).map((t,i)=>{const buy=isBuy(t);const p=t.party||(i%2===0?"D":"R");return(
                  <div key={i} className="rh" onClick={()=>setModal({ticker:t.symbol,name:t.symbol})} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 8px",borderRadius:8,marginBottom:2}}>
                    <span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:6,background:p==="D"?"#eff6ff":"#fff5f5",color:p==="D"?"#2563eb":"#e53e3e",flexShrink:0}}>{p}</span>
                    <span style={{flex:1,fontSize:12,color:C.text,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.name}</span>
                    <span style={{fontFamily:C.mono,fontSize:12,fontWeight:700,color:C.accent,flexShrink:0}}>{t.symbol||t.ticker}</span>
                    <span style={{fontSize:11,fontWeight:700,padding:"2px 7px",borderRadius:6,background:buy?C.greenBg:C.redBg,color:buy?C.green:C.red,flexShrink:0}}>{buy?"BUY":"SELL"}</span>
                  </div>
                );})}
              </div>
            </div>
          </div>
        </div>}

        {/* ══ MARKETS ══ */}
        {tab==="markets"&&<div style={{animation:"fadeUp 0.25s ease"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
            {Object.values(stockQ).slice(0,4).map(q=>{const up=(q.dp||0)>=0;return(
              <div key={q.ticker} style={{...card,padding:16,cursor:"pointer",position:"relative"}} className="ch" onClick={()=>setModal({ticker:q.ticker,name:q.name})}>
                <div style={{position:"absolute",top:12,right:12}} onClick={e=>e.stopPropagation()}><PinBtn ticker={q.ticker} pinned={pinned} onToggle={togglePin}/></div>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><StockLogo ticker={q.ticker} size={28}/><div><div style={{fontSize:11,fontWeight:700,color:C.text}}>{q.ticker}</div><div style={{fontSize:10,color:C.faint}}>{q.name}</div></div></div>
                <div style={{fontFamily:C.mono,fontSize:20,fontWeight:700,color:C.text,marginBottom:4}}>{fmtPrice(q.c)}</div>
                <span style={{fontSize:11,fontWeight:700,padding:"2px 7px",borderRadius:6,background:up?C.greenBg:C.redBg,color:up?C.green:C.red,display:"inline-block",marginBottom:8}}>{fmtPct(q.dp)}</span>
                <Spark up={up} w={130} h={34}/>
              </div>
            );})}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div style={card}><div style={secTitle}>All Stocks & ETFs</div>{Object.values(stockQ).map(q=><StockRow key={q.ticker} q={q}/>)}</div>
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
            {Object.values(cryptoQ).slice(0,4).map(q=>{const sym=q.symbol||symFromTicker(q.ticker);const up=(q.dp||0)>=0;return(
              <div key={q.ticker} style={{...card,padding:16,cursor:"pointer",position:"relative"}} className="ch" onClick={()=>setModal({ticker:q.ticker,name:q.name})}>
                <div style={{position:"absolute",top:12,right:12}} onClick={e=>e.stopPropagation()}><PinBtn ticker={q.ticker} pinned={pinned} onToggle={togglePin}/></div>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><CryptoLogo sym={sym} size={28}/><div><div style={{fontSize:11,fontWeight:700,color:C.text}}>{sym}</div><div style={{fontSize:10,color:C.faint}}>{q.name}</div></div></div>
                <div style={{fontFamily:C.mono,fontSize:20,fontWeight:700,color:C.text,marginBottom:4}}>${fmtPrice(q.c)}</div>
                <span style={{fontSize:11,fontWeight:700,padding:"2px 7px",borderRadius:6,background:up?C.greenBg:C.redBg,color:up?C.green:C.red,display:"inline-block",marginBottom:8}}>{fmtPct(q.dp)}</span>
                <Spark up={up} w={130} h={34}/>
              </div>
            );})}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div style={card}><div style={secTitle}>All Crypto</div>{Object.values(cryptoQ).map(q=><CryptoRow key={q.ticker} q={q}/>)}</div>
            <div style={card}>
              <div style={secTitle}>Polymarket — Crypto & Macro</div>
              {poly.slice(0,7).map((p,i)=>(
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
        </div>}

        {/* ══ WATCHLIST TAB ══ */}
        {tab==="watchlist"&&<div style={{animation:"fadeUp 0.25s ease"}}>
          {pinnedItems.length===0?(
            <div style={{...card,textAlign:"center",padding:60}}>
              <div style={{fontSize:40,marginBottom:16}}>★</div>
              <div style={{fontSize:18,fontWeight:700,color:C.text,marginBottom:8}}>Your watchlist is empty</div>
              <div style={{fontSize:14,color:C.faint,maxWidth:400,margin:"0 auto",lineHeight:1.6}}>
                Pin any stock or crypto by clicking the ★ button on a row, on a card, or inside the detail modal after searching a ticker.
              </div>
              <div style={{display:"flex",gap:10,justifyContent:"center",marginTop:20}}>
                <button onClick={()=>setTab("markets")} style={{padding:"8px 18px",borderRadius:10,background:C.accentBg,color:C.accent,border:`1px solid #bfdbfe`,fontFamily:C.sans,fontSize:13,fontWeight:600,cursor:"pointer"}}>Browse Markets</button>
                <button onClick={()=>setTab("crypto")} style={{padding:"8px 18px",borderRadius:10,background:"#f5f3ff",color:"#7c3aed",border:"1px solid #ddd6fe",fontFamily:C.sans,fontSize:13,fontWeight:600,cursor:"pointer"}}>Browse Crypto</button>
              </div>
            </div>
          ):(
            <>
              {/* Summary row */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10,marginBottom:16}}>
                {pinnedItems.map(q=>{
                  const crypto=isCryptoTicker(q.ticker);
                  const sym=q.symbol||symFromTicker(q.ticker)||q.ticker;
                  const up=(q.dp||0)>=0;
                  return(
                    <div key={q.ticker} style={{...card,padding:14,cursor:"pointer",position:"relative"}} className="ch" onClick={()=>setModal({ticker:q.ticker,name:q.name})}>
                      <div style={{position:"absolute",top:10,right:10}} onClick={e=>e.stopPropagation()}><PinBtn ticker={q.ticker} pinned={pinned} onToggle={togglePin}/></div>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                        {crypto?<CryptoLogo sym={sym} size={26}/>:<StockLogo ticker={q.ticker} size={26}/>}
                        <div><div style={{fontSize:11,fontWeight:700,color:C.text}}>{sym}</div><div style={{fontSize:9,color:C.faint}}>{q.name}</div></div>
                      </div>
                      <div style={{fontFamily:C.mono,fontSize:17,fontWeight:700,color:C.text,marginBottom:2}}>{crypto?"$":""}{fmtPrice(q.c)}</div>
                      <span style={{fontSize:11,fontWeight:700,color:up?C.green:C.red}}>{fmtPct(q.dp)}</span>
                      <div style={{marginTop:6}}><Spark up={up} w={100} h={28}/></div>
                    </div>
                  );
                })}
              </div>

              {/* Stocks section */}
              {pinnedStocks.length>0&&(
                <div style={{...card,marginBottom:14}}>
                  <div style={secTitle}>
                    <span style={{display:"inline-flex",alignItems:"center",gap:6}}>
                      <StockLogo ticker="AAPL" size={16}/>
                      Pinned Stocks & ETFs
                      <span style={{background:C.accentBg,color:C.accent,borderRadius:10,padding:"1px 6px",fontSize:10}}>{pinnedStocks.length}</span>
                    </span>
                  </div>
                  {pinnedStocks.map(q=><StockRow key={q.ticker} q={q}/>)}
                </div>
              )}

              {/* Crypto section */}
              {pinnedCrypto.length>0&&(
                <div style={card}>
                  <div style={secTitle}>
                    <span style={{display:"inline-flex",alignItems:"center",gap:6}}>
                      <CryptoLogo sym="BTC" size={16}/>
                      Pinned Crypto
                      <span style={{background:"#f5f3ff",color:"#7c3aed",borderRadius:10,padding:"1px 6px",fontSize:10}}>{pinnedCrypto.length}</span>
                    </span>
                  </div>
                  {pinnedCrypto.map(q=><CryptoRow key={q.ticker} q={q}/>)}
                </div>
              )}
            </>
          )}
        </div>}

        {/* ══ CONGRESS ══ */}
        {tab==="congress"&&<div style={{animation:"fadeUp 0.25s ease"}}>
          <div style={{...card,marginBottom:14,background:C.amberBg,borderColor:"#fde68a"}}><p style={{fontSize:13,color:C.amber,lineHeight:1.6}}>Disclosures required within 45 days under STOCK Act (2012). {isDemo?`Demo data.`:`${congress.length} trades loaded.`} Click any row to open the stock.</p></div>
          <div style={card}>
            <div style={secTitle}>Recent Disclosures</div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr>{["Member","Party","Ticker","Action","Amount","Date"].map(h=><th key={h} style={{textAlign:"left",padding:"8px 12px",fontSize:11,fontWeight:700,color:C.faint,letterSpacing:"0.06em",textTransform:"uppercase",borderBottom:`1px solid ${C.border}`}}>{h}</th>)}</tr></thead>
                <tbody>{congress.map((t,i)=>{const buy=isBuy(t);const p=t.party||(i%2===0?"D":"R");return(
                  <tr key={i} className="rh" onClick={()=>setModal({ticker:t.symbol||t.ticker,name:t.symbol||t.ticker})} style={{borderBottom:`1px solid ${C.border}`,cursor:"pointer"}}>
                    <td style={{padding:"11px 12px",fontSize:13,fontWeight:600,color:C.text}}>{t.name}</td>
                    <td style={{padding:"11px 12px"}}><span style={{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:6,background:p==="D"?"#eff6ff":"#fff5f5",color:p==="D"?"#2563eb":"#e53e3e"}}>{p}</span></td>
                    <td style={{padding:"11px 12px",fontFamily:C.mono,fontSize:13,fontWeight:700,color:C.accent}}>{t.symbol||t.ticker}</td>
                    <td style={{padding:"11px 12px"}}><span style={{fontSize:12,fontWeight:700,padding:"2px 9px",borderRadius:6,background:buy?C.greenBg:C.redBg,color:buy?C.green:C.red}}>{buy?"BUY":"SELL"}</span></td>
                    <td style={{padding:"11px 12px",fontSize:13,color:C.muted,fontFamily:C.mono}}>{t.amount||"—"}</td>
                    <td style={{padding:"11px 12px",fontSize:12,color:C.faint,fontFamily:C.mono}}>{(t.transactionDate||"").slice(0,10)}</td>
                  </tr>
                );})}</tbody>
              </table>
            </div>
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
        {tab==="signals"&&<div style={{animation:"fadeUp 0.25s ease"}}>
          <div style={{...card,marginBottom:14,background:C.accentBg,borderColor:"#bfdbfe"}}><p style={{fontSize:13,color:C.accent,lineHeight:1.6}}>Signal feed — curated finance & crypto accounts. Connect the Twitter/X API ($100/mo Basic tier) for a live feed.</p></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            {DEMO_TWEETS.map((t,i)=>(
              <div key={i} style={{...card}} className="ch">
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,paddingBottom:10,borderBottom:`1px solid ${C.border}`}}>
                  <div style={{width:36,height:36,borderRadius:11,background:"linear-gradient(135deg,#2563eb,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"white",flexShrink:0}}>{t.handle[0].toUpperCase()}</div>
                  <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:C.text}}>{t.name}</div><div style={{fontSize:11,color:C.faint}}>@{t.handle}</div></div>
                  <span style={{fontSize:11,color:C.faint}}>{t.time} ago</span>
                </div>
                <p style={{fontSize:13,lineHeight:1.65,color:C.text,marginBottom:10}}>{t.text}</p>
                <div style={{fontSize:12,color:C.faint,display:"flex",alignItems:"center",gap:4}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>{t.likes}</div>
              </div>
            ))}
          </div>
        </div>}

      </div>
    </div>
  );
}
