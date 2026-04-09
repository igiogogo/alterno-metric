import { useState, useEffect, useCallback } from "react";

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const STOCKS = [
  { ticker: "SPY",  name: "S&P 500 ETF",      price: 524.38, change: +1.24, pct: +0.24 },
  { ticker: "QQQ",  name: "Nasdaq 100 ETF",    price: 447.92, change: +2.87, pct: +0.64 },
  { ticker: "DXY",  name: "US Dollar Index",   price: 104.21, change: -0.34, pct: -0.33 },
  { ticker: "GC=F", name: "Gold Futures",      price: 2341.5, change: +8.20, pct: +0.35 },
  { ticker: "CL=F", name: "Crude Oil WTI",     price: 83.47,  change: -0.92, pct: -1.09 },
  { ticker: "BTC",  name: "Bitcoin USD",       price: 68420,  change: +1240, pct: +1.85 },
  { ticker: "TNX",  name: "10Y Treasury Yld",  price: 4.482,  change: +0.031,pct: +0.70 },
  { ticker: "VIX",  name: "Volatility Index",  price: 14.82,  change: -0.63, pct: -4.08 },
  { ticker: "NVDA", name: "Nvidia Corp",        price: 887.24, change: +21.4, pct: +2.47 },
  { ticker: "AAPL", name: "Apple Inc",          price: 189.30, change: -1.20, pct: -0.63 },
  { ticker: "TSLA", name: "Tesla Inc",          price: 174.48, change: +4.82, pct: +2.84 },
  { ticker: "META", name: "Meta Platforms",     price: 512.63, change: +7.34, pct: +1.45 },
];

const POLYMARKET = [
  { id: 1, question: "Iranian regime falls or loses power by end of 2025", yes: 12,  no: 88,  volume: "$4.2M",  trending: true  },
  { id: 2, question: "Fed cuts rates in June 2025 FOMC meeting",           yes: 31,  no: 69,  volume: "$18.7M", trending: true  },
  { id: 3, question: "US enters recession by Q3 2025",                    yes: 22,  no: 78,  volume: "$9.1M",  trending: false },
  { id: 4, question: "Russia-Ukraine ceasefire agreement signed in 2025",  yes: 38,  no: 62,  volume: "$11.4M", trending: true  },
  { id: 5, question: "Bitcoin reaches $100K before end of 2025",           yes: 54,  no: 46,  volume: "$22.3M", trending: true  },
  { id: 6, question: "China invades Taiwan in 2025",                       yes: 5,   no: 95,  volume: "$6.8M",  trending: false },
  { id: 7, question: "Oil price exceeds $100/barrel in 2025",              yes: 18,  no: 82,  volume: "$3.9M",  trending: false },
  { id: 8, question: "UK general election called before Sept 2025",        yes: 8,   no: 92,  volume: "$1.2M",  trending: false },
];

const CONGRESS_TRADES = [
  { member: "Nancy Pelosi", party: "D", state: "CA", ticker: "NVDA", action: "BUY",  shares: "1,000–5,000", amount: "$1M–$5M",   date: "Apr 07", filed: "Apr 08" },
  { member: "Dan Crenshaw", party: "R", state: "TX", ticker: "LMT",  action: "BUY",  shares: "500–1,000",   amount: "$50K–$100K",date: "Apr 05", filed: "Apr 08" },
  { member: "Josh Gottheimer",party:"D",state: "NJ", ticker: "MSFT", action: "SELL", shares: "1,000–5,000", amount: "$500K–$1M", date: "Apr 04", filed: "Apr 07" },
  { member: "Tommy Tuberville",party:"R",state:"AL", ticker: "XOM",  action: "BUY",  shares: "500–1,000",   amount: "$100K–$250K",date:"Apr 03",filed: "Apr 06" },
  { member: "Ro Khanna",    party: "D", state: "CA", ticker: "AMZN", action: "BUY",  shares: "100–500",     amount: "$50K–$100K", date: "Apr 02", filed: "Apr 05" },
  { member: "Mark Green",   party: "R", state: "TN", ticker: "RTX",  action: "BUY",  shares: "500–1,000",   amount: "$50K–$100K", date: "Apr 01", filed: "Apr 04" },
];

const TWEETS = [
  { handle: "elonmusk",    name: "Elon Musk",         text: "Interest rates are the fundamental problem. Everything else is downstream of this.", likes: "48.2K", time: "34m" },
  { handle: "naval",       name: "Naval Ravikant",     text: "Inflation is a hidden tax on savers. The monetary system redistributes from the cautious to the leveraged.", likes: "31.4K", time: "1h" },
  { handle: "RaoulGMI",    name: "Raoul Pal",          text: "The Everything Code keeps playing out. Liquidity drives all assets. Watch the Fed balance sheet not the Fed funds rate.", likes: "12.8K", time: "2h" },
  { handle: "APompliano",  name: "Anthony Pompliano",  text: "Bitcoin is up 1.8% today while the dollar weakens. This is the trade of the decade and most people are still sleeping.", likes: "9.3K",  time: "2h" },
  { handle: "elerianm",    name: "Mohamed El-Erian",   text: "Today's CPI print will be closely watched. Markets have priced in a benign outcome — any upside surprise risks a sharp repricing.", likes: "7.1K",  time: "3h" },
  { handle: "LukeGromen", name: "Luke Gromen",        text: "The bond market is telling you something the equity market hasn't fully priced yet. Fiscal dominance is here.", likes: "5.9K",  time: "4h" },
  { handle: "stoolpresidente", name: "Dave Portnoy",   text: "NVDA ripping again. Told you. Stocks only go up.", likes: "22.1K", time: "1h" },
  { handle: "zerohedge",   name: "ZeroHedge",          text: "JPMorgan cuts GDP forecast to 0.3% for Q2. Stagflation risks rising, strategists warn.", likes: "6.4K",  time: "3h" },
];

const HEADLINES = [
  { source: "FT",      title: "Fed officials signal caution on rate cuts as inflation stays sticky", time: "28m",  hot: true  },
  { source: "WSJ",     title: "Nvidia surges as data centre demand exceeds Wall Street estimates",    time: "1h",   hot: true  },
  { source: "Reuters", title: "Oil falls on demand concerns despite Middle East tensions",            time: "1h",   hot: false },
  { source: "BBG",     title: "China's exports rise 7.4% in March, beating forecasts",               time: "2h",   hot: false },
  { source: "FT",      title: "Private equity dry powder hits $2.6 trillion record high",            time: "2h",   hot: false },
  { source: "WSJ",     title: "Treasury yields climb as investors reassess Fed cut timeline",         time: "3h",   hot: true  },
  { source: "BBG",     title: "Goldman raises S&P 500 year-end target to 5,600",                     time: "3h",   hot: false },
  { source: "Reuters", title: "EU considers new tariffs on Chinese electric vehicles",                time: "4h",   hot: false },
  { source: "FT",      title: "Warren Buffett's cash pile hits $189bn — a record for Berkshire",     time: "5h",   hot: true  },
  { source: "BBG",     title: "Bitcoin ETF inflows reach $500M in a single day for first time",      time: "5h",   hot: false },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function fmt(n) {
  if (Math.abs(n) >= 1000) return (n > 0 ? "+" : "") + n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return (n > 0 ? "+" : "") + n.toFixed(2);
}
function fmtPrice(n) {
  if (n >= 10000) return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  if (n >= 100)   return n.toFixed(2);
  return n.toFixed(3);
}

// ─── SPARKLINE (fake) ─────────────────────────────────────────────────────────
function Spark({ up, w = 60, h = 20 }) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const rand = (Math.random() - 0.48) * 6;
    return rand;
  });
  let acc = 0;
  const vals = pts.map(p => { acc += p; return acc; });
  const min = Math.min(...vals), max = Math.max(...vals);
  const norm = vals.map(v => ((v - min) / (max - min || 1)) * (h - 2) + 1);
  const coords = norm.map((y, i) => `${(i / 9) * w},${h - y}`).join(" ");
  const color = up ? "#00d4aa" : "#ff4d4d";
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <polyline points={coords} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" opacity="0.8" />
    </svg>
  );
}

// ─── TICKER TAPE ──────────────────────────────────────────────────────────────
function TickerTape() {
  return (
    <div style={{ background: "#0a0c0e", borderBottom: "1px solid #1a2030", overflow: "hidden", height: 28, display: "flex", alignItems: "center" }}>
      <style>{`
        @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .tape { display: flex; animation: scroll 40s linear infinite; white-space: nowrap; }
      `}</style>
      <div className="tape">
        {[...STOCKS, ...STOCKS].map((s, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "0 20px", fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}>
            <span style={{ color: "#8899aa", letterSpacing: "0.05em" }}>{s.ticker}</span>
            <span style={{ color: "#dde4ef" }}>{fmtPrice(s.price)}</span>
            <span style={{ color: s.pct >= 0 ? "#00d4aa" : "#ff4d4d" }}>
              {s.pct >= 0 ? "▲" : "▼"} {Math.abs(s.pct).toFixed(2)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState("overview");
  const [time, setTime] = useState(new Date());
  const [aiSummary, setAiSummary] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDone, setAiDone] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  async function generateBriefing() {
    setAiLoading(true);
    setAiSummary("");
    setAiDone(false);
    const context = `
Market snapshot: SPY +0.24%, QQQ +0.64%, BTC +1.85%, VIX -4.08%, 10Y yield 4.482%.
Top headlines: Fed officials signal caution on rate cuts. Nvidia surges on data centre demand. Treasury yields climb as investors reassess Fed cut timeline.
Congress trades today: Nancy Pelosi bought NVDA, Josh Gottheimer sold MSFT.
Polymarket: Fed June cut at 31%, BTC $100K at 54%, US recession Q3 at 22%.
Key tweets: Raoul Pal on liquidity driving all assets. El-Erian warns on CPI print. Luke Gromen on fiscal dominance.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `You are a senior market strategist writing a morning briefing for a small team of sophisticated investors. Based on this data, write a tight 4-5 sentence intelligence summary covering: the dominant market theme today, what the congressional trades might signal, what the Polymarket odds are telling us, and one risk to watch. Be direct, specific, and analytical — no filler.\n\n${context}`
          }]
        })
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("") || "Unable to generate briefing.";
      setAiSummary(text);
    } catch {
      setAiSummary("AI briefing unavailable. Check API connection.");
    }
    setAiLoading(false);
    setAiDone(true);
  }

  const tabs = ["overview", "markets", "congress", "polymarket", "signals"];

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    ::-webkit-scrollbar { width: 4px; height: 4px; background: #080a0d; }
    ::-webkit-scrollbar-thumb { background: #1e2a38; border-radius: 2px; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
    .row-hover:hover { background: #0f1520 !important; }
    .tab-btn:hover { color: #c8d8e8 !important; }
    .card-hover:hover { border-color: #2a3a4a !important; }
  `;

  const C = {
    bg:      "#070a0e",
    surface: "#0c0f14",
    border:  "#141c28",
    border2: "#1e2a38",
    text:    "#c4d0e0",
    muted:   "#5a6a7a",
    accent:  "#00d4aa",
    red:     "#ff4d4d",
    amber:   "#f0b050",
    blue:    "#4090d0",
    mono:    "'IBM Plex Mono', monospace",
    sans:    "'DM Sans', sans-serif",
    display: "'Syne', sans-serif",
  };

  const panel = {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 4,
  };

  const sectionLabel = {
    fontFamily: C.mono,
    fontSize: 9,
    letterSpacing: "0.15em",
    color: C.muted,
    textTransform: "uppercase",
    marginBottom: 10,
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: C.sans, fontSize: 13 }}>
      <style>{css}</style>

      {/* ── HEADER ── */}
      <div style={{ background: "#06080c", borderBottom: `1px solid ${C.border}`, padding: "10px 20px", display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ fontFamily: C.display, fontSize: 17, fontWeight: 800, color: "#e8f0f8", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: C.accent }}>▸</span> SIGNAL
        </div>
        <div style={{ width: 1, height: 20, background: C.border }} />
        <div style={{ fontFamily: C.mono, fontSize: 10, color: C.muted, letterSpacing: "0.08em" }}>
          MARKET INTELLIGENCE TERMINAL
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontFamily: C.mono, fontSize: 10, color: C.muted }}>
            {time.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }).toUpperCase()}
          </span>
          <span style={{ fontFamily: C.mono, fontSize: 11, color: C.accent, letterSpacing: "0.1em" }}>
            {time.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
          <span style={{ fontFamily: C.mono, fontSize: 9, padding: "3px 8px", background: "#0a2018", border: `1px solid #0d4030`, color: C.accent, borderRadius: 2, letterSpacing: "0.08em" }}>
            ● LIVE
          </span>
        </div>
      </div>

      {/* ── TICKER TAPE ── */}
      <TickerTape />

      {/* ── TABS ── */}
      <div style={{ background: "#080b10", borderBottom: `1px solid ${C.border}`, padding: "0 20px", display: "flex", gap: 0 }}>
        {tabs.map(t => (
          <button key={t} className="tab-btn" onClick={() => setActiveTab(t)} style={{
            padding: "11px 18px",
            fontFamily: C.mono, fontSize: 10, letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: activeTab === t ? C.accent : C.muted,
            background: "none", border: "none",
            borderBottom: activeTab === t ? `2px solid ${C.accent}` : "2px solid transparent",
            cursor: "pointer", transition: "color 0.15s",
          }}>{t}</button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <div style={{ padding: "16px 20px" }}>

        {/* ══ OVERVIEW ══ */}
        {activeTab === "overview" && (
          <div style={{ animation: "fadeIn 0.2s ease" }}>
            {/* AI Briefing */}
            <div style={{ ...panel, padding: 16, marginBottom: 14, borderColor: aiDone ? "#0d3028" : C.border }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: aiSummary || aiLoading ? 12 : 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: C.mono, fontSize: 9, letterSpacing: "0.15em", color: aiDone ? C.accent : C.muted, textTransform: "uppercase" }}>
                    ◈ AI MORNING BRIEFING
                  </span>
                </div>
                <button onClick={generateBriefing} disabled={aiLoading} style={{
                  fontFamily: C.mono, fontSize: 9, letterSpacing: "0.1em",
                  padding: "5px 12px", background: aiLoading ? "#0a1a14" : "#0d2a20",
                  border: `1px solid ${aiLoading ? "#1a3a28" : "#1a5038"}`,
                  color: aiLoading ? C.muted : C.accent,
                  borderRadius: 2, cursor: aiLoading ? "default" : "pointer",
                  textTransform: "uppercase",
                }}>
                  {aiLoading ? "GENERATING..." : "GENERATE BRIEFING"}
                </button>
              </div>
              {aiLoading && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.muted, fontSize: 12 }}>
                  <span style={{ animation: "pulse 1s infinite", color: C.accent }}>◈</span>
                  Analysing market data…
                </div>
              )}
              {aiSummary && (
                <p style={{ fontSize: 13, lineHeight: 1.7, color: "#d0dcea", fontFamily: C.sans }}>{aiSummary}</p>
              )}
              {!aiSummary && !aiLoading && (
                <p style={{ fontSize: 12, color: C.muted, fontFamily: C.mono }}>Click to generate today's AI-powered market intelligence briefing.</p>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              {/* Key markets */}
              <div style={{ ...panel, padding: 14 }}>
                <div style={sectionLabel}>KEY MARKETS</div>
                {STOCKS.slice(0, 6).map(s => (
                  <div key={s.ticker} className="row-hover" style={{ display: "flex", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ fontFamily: C.mono, fontSize: 11, color: C.blue, width: 52, flexShrink: 0 }}>{s.ticker}</span>
                    <span style={{ flex: 1, fontSize: 11, color: C.muted }}>{s.name}</span>
                    <Spark up={s.pct >= 0} w={50} h={18} />
                    <span style={{ fontFamily: C.mono, fontSize: 11, color: "#dde4ef", width: 72, textAlign: "right" }}>{fmtPrice(s.price)}</span>
                    <span style={{ fontFamily: C.mono, fontSize: 11, color: s.pct >= 0 ? C.accent : C.red, width: 60, textAlign: "right" }}>
                      {s.pct >= 0 ? "+" : ""}{s.pct.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>

              {/* Headlines */}
              <div style={{ ...panel, padding: 14 }}>
                <div style={sectionLabel}>LATEST HEADLINES</div>
                {HEADLINES.slice(0, 6).map((h, i) => (
                  <div key={i} className="row-hover" style={{ display: "flex", gap: 8, padding: "6px 0", borderBottom: `1px solid ${C.border}`, alignItems: "flex-start" }}>
                    <span style={{ fontFamily: C.mono, fontSize: 9, color: C.muted, width: 30, flexShrink: 0, paddingTop: 2 }}>{h.source}</span>
                    <span style={{ flex: 1, fontSize: 12, lineHeight: 1.4, color: h.hot ? "#e0eaf8" : C.text }}>{h.title}</span>
                    <span style={{ fontFamily: C.mono, fontSize: 9, color: C.muted, flexShrink: 0, paddingTop: 2 }}>{h.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {/* Polymarket top */}
              <div style={{ ...panel, padding: 14 }}>
                <div style={sectionLabel}>POLYMARKET — TOP ODDS</div>
                {POLYMARKET.filter(p => p.trending).slice(0, 4).map(p => (
                  <div key={p.id} className="row-hover" style={{ padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 11, color: C.text, marginBottom: 5, lineHeight: 1.3 }}>{p.question}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, height: 4, background: "#1a2030", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ width: `${p.yes}%`, height: "100%", background: p.yes > 50 ? C.accent : p.yes > 30 ? C.amber : C.muted, borderRadius: 2, transition: "width 0.5s" }} />
                      </div>
                      <span style={{ fontFamily: C.mono, fontSize: 10, color: p.yes > 50 ? C.accent : C.amber, width: 30, textAlign: "right" }}>{p.yes}%</span>
                      <span style={{ fontFamily: C.mono, fontSize: 9, color: C.muted }}>{p.volume}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Congress trades */}
              <div style={{ ...panel, padding: 14 }}>
                <div style={sectionLabel}>CONGRESS TRADES — RECENT</div>
                {CONGRESS_TRADES.slice(0, 4).map((t, i) => (
                  <div key={i} className="row-hover" style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: `1px solid ${C.border}` }}>
                    <span style={{
                      fontFamily: C.mono, fontSize: 9, padding: "2px 5px",
                      background: t.party === "D" ? "#0a1830" : "#1a0808",
                      color: t.party === "D" ? "#4090d0" : "#d04040",
                      border: `1px solid ${t.party === "D" ? "#1a3050" : "#3a1010"}`,
                      borderRadius: 2, flexShrink: 0,
                    }}>{t.party}</span>
                    <span style={{ flex: 1, fontSize: 11, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.member}</span>
                    <span style={{ fontFamily: C.mono, fontSize: 11, color: C.blue }}>{t.ticker}</span>
                    <span style={{ fontFamily: C.mono, fontSize: 10, color: t.action === "BUY" ? C.accent : C.red, width: 32, textAlign: "right" }}>{t.action}</span>
                    <span style={{ fontFamily: C.mono, fontSize: 9, color: C.muted }}>{t.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ MARKETS ══ */}
        {activeTab === "markets" && (
          <div style={{ animation: "fadeIn 0.2s ease" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
              {STOCKS.slice(0, 4).map(s => (
                <div key={s.ticker} style={{ ...panel, padding: 14 }} className="card-hover">
                  <div style={{ fontFamily: C.mono, fontSize: 10, color: C.muted, marginBottom: 4 }}>{s.ticker}</div>
                  <div style={{ fontFamily: C.mono, fontSize: 20, color: "#e8f0f8", fontWeight: 500, letterSpacing: "-0.02em", marginBottom: 2 }}>{fmtPrice(s.price)}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <span style={{ fontFamily: C.mono, fontSize: 11, color: s.pct >= 0 ? C.accent : C.red }}>
                      {s.pct >= 0 ? "▲" : "▼"} {Math.abs(s.pct).toFixed(2)}%
                    </span>
                    <span style={{ fontFamily: C.mono, fontSize: 10, color: C.muted }}>{fmt(s.change)}</span>
                  </div>
                  <Spark up={s.pct >= 0} w={120} h={30} />
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 6 }}>{s.name}</div>
                </div>
              ))}
            </div>
            <div style={{ ...panel, padding: 14 }}>
              <div style={sectionLabel}>ALL INSTRUMENTS</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
                {STOCKS.map(s => (
                  <div key={s.ticker} className="row-hover" style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 6px", borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ fontFamily: C.mono, fontSize: 11, color: C.blue, width: 54 }}>{s.ticker}</span>
                    <span style={{ flex: 1, fontSize: 11, color: C.muted }}>{s.name}</span>
                    <Spark up={s.pct >= 0} w={60} h={20} />
                    <span style={{ fontFamily: C.mono, fontSize: 12, color: "#dde4ef", width: 80, textAlign: "right" }}>{fmtPrice(s.price)}</span>
                    <span style={{ fontFamily: C.mono, fontSize: 11, color: s.pct >= 0 ? C.accent : C.red, width: 56, textAlign: "right" }}>
                      {s.pct >= 0 ? "+" : ""}{s.pct.toFixed(2)}%
                    </span>
                    <span style={{ fontFamily: C.mono, fontSize: 10, color: C.muted, width: 60, textAlign: "right" }}>{fmt(s.change)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ ...panel, padding: 14, marginTop: 14 }}>
              <div style={sectionLabel}>TODAY'S HEADLINES</div>
              {HEADLINES.map((h, i) => (
                <div key={i} className="row-hover" style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}`, alignItems: "flex-start" }}>
                  <span style={{ fontFamily: C.mono, fontSize: 9, color: C.blue, width: 40, flexShrink: 0, paddingTop: 2 }}>{h.source}</span>
                  <span style={{ flex: 1, fontSize: 13, lineHeight: 1.45, color: h.hot ? "#e8f2ff" : C.text }}>
                    {h.hot && <span style={{ color: C.amber, marginRight: 6, fontSize: 10 }}>◆</span>}
                    {h.title}
                  </span>
                  <span style={{ fontFamily: C.mono, fontSize: 9, color: C.muted, flexShrink: 0, paddingTop: 2 }}>{h.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ CONGRESS ══ */}
        {activeTab === "congress" && (
          <div style={{ animation: "fadeIn 0.2s ease" }}>
            <div style={{ ...panel, padding: 14, marginBottom: 10 }}>
              <div style={{ fontFamily: C.mono, fontSize: 9, color: C.muted, lineHeight: 1.6, letterSpacing: "0.04em" }}>
                Congressional stock trades are required to be disclosed within 45 days under the STOCK Act (2012). This feed shows recently filed disclosures. Data shown is simulated — live data available via <span style={{ color: C.blue }}>quiverquant.com</span> or <span style={{ color: C.blue }}>capitoltrades.com</span> APIs.
              </div>
            </div>
            <div style={{ ...panel, padding: 14 }}>
              <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                {["ALL", "BUY", "SELL"].map(f => (
                  <button key={f} style={{
                    fontFamily: C.mono, fontSize: 9, letterSpacing: "0.1em", padding: "4px 10px",
                    background: f === "ALL" ? "#0d2a20" : "#0c0f14",
                    border: `1px solid ${f === "ALL" ? "#1a5038" : C.border}`,
                    color: f === "ALL" ? C.accent : C.muted,
                    borderRadius: 2, cursor: "pointer",
                  }}>{f}</button>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "auto auto 1fr auto auto auto auto", gap: 0, alignItems: "center" }}>
                {["", "MEMBER", "TICKER / ACTION", "SHARES", "AMOUNT", "TRADE DATE", "FILED"].map((h, i) => (
                  <div key={i} style={{ fontFamily: C.mono, fontSize: 9, color: C.muted, padding: "0 10px 8px", letterSpacing: "0.1em", borderBottom: `1px solid ${C.border2}` }}>{h}</div>
                ))}
                {CONGRESS_TRADES.map((t, i) => [
                  <div key={`p${i}`} style={{ padding: "10px 10px", borderBottom: `1px solid ${C.border}` }}>
                    <span style={{
                      fontFamily: C.mono, fontSize: 9, padding: "2px 6px",
                      background: t.party === "D" ? "#0a1830" : "#1a0808",
                      color: t.party === "D" ? "#4090d0" : "#d04040",
                      border: `1px solid ${t.party === "D" ? "#1a3050" : "#3a1010"}`,
                      borderRadius: 2,
                    }}>{t.party} · {t.state}</span>
                  </div>,
                  <div key={`m${i}`} style={{ padding: "10px 10px", borderBottom: `1px solid ${C.border}`, fontSize: 12, color: "#dde4ef" }}>{t.member}</div>,
                  <div key={`ta${i}`} style={{ padding: "10px 10px", borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ fontFamily: C.mono, fontSize: 11, color: C.blue }}>{t.ticker}</span>
                    <span style={{ fontFamily: C.mono, fontSize: 10, color: t.action === "BUY" ? C.accent : C.red, marginLeft: 10 }}>{t.action}</span>
                  </div>,
                  <div key={`sh${i}`} style={{ padding: "10px 10px", borderBottom: `1px solid ${C.border}`, fontFamily: C.mono, fontSize: 10, color: C.muted }}>{t.shares}</div>,
                  <div key={`am${i}`} style={{ padding: "10px 10px", borderBottom: `1px solid ${C.border}`, fontFamily: C.mono, fontSize: 11, color: C.text }}>{t.amount}</div>,
                  <div key={`dt${i}`} style={{ padding: "10px 10px", borderBottom: `1px solid ${C.border}`, fontFamily: C.mono, fontSize: 10, color: C.muted }}>{t.date}</div>,
                  <div key={`fi${i}`} style={{ padding: "10px 10px", borderBottom: `1px solid ${C.border}`, fontFamily: C.mono, fontSize: 10, color: C.muted }}>{t.filed}</div>,
                ])}
              </div>
            </div>
          </div>
        )}

        {/* ══ POLYMARKET ══ */}
        {activeTab === "polymarket" && (
          <div style={{ animation: "fadeIn 0.2s ease" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {POLYMARKET.map(p => (
                <div key={p.id} style={{ ...panel, padding: 16 }} className="card-hover">
                  {p.trending && (
                    <span style={{ fontFamily: C.mono, fontSize: 8, color: C.amber, letterSpacing: "0.1em", marginBottom: 8, display: "block" }}>◆ TRENDING</span>
                  )}
                  <div style={{ fontSize: 13, color: "#dde4ef", lineHeight: 1.5, marginBottom: 14 }}>{p.question}</div>
                  <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontFamily: C.mono, fontSize: 9, color: C.accent, letterSpacing: "0.08em" }}>YES</span>
                        <span style={{ fontFamily: C.mono, fontSize: 14, color: C.accent, fontWeight: 500 }}>{p.yes}¢</span>
                      </div>
                      <div style={{ height: 6, background: "#1a2030", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ width: `${p.yes}%`, height: "100%", background: C.accent, borderRadius: 3 }} />
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontFamily: C.mono, fontSize: 9, color: C.red, letterSpacing: "0.08em" }}>NO</span>
                        <span style={{ fontFamily: C.mono, fontSize: 14, color: C.red, fontWeight: 500 }}>{p.no}¢</span>
                      </div>
                      <div style={{ height: 6, background: "#1a2030", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ width: `${p.no}%`, height: "100%", background: C.red, borderRadius: 3 }} />
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: C.mono, fontSize: 9, color: C.muted }}>VOL {p.volume}</span>
                    <span style={{ fontFamily: C.mono, fontSize: 9, padding: "2px 8px", background: "#0a1a10", border: `1px solid #1a3020`, color: C.accent, borderRadius: 2 }}>
                      {p.yes > p.no ? "LEANS YES" : "LEANS NO"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ SIGNALS (tweets) ══ */}
        {activeTab === "signals" && (
          <div style={{ animation: "fadeIn 0.2s ease" }}>
            <div style={{ ...panel, padding: 10, marginBottom: 14, fontFamily: C.mono, fontSize: 9, color: C.muted, letterSpacing: "0.04em" }}>
              SIGNAL FEED — curated accounts monitored for market-relevant commentary · simulated data · connect Twitter/X API for live feed
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {TWEETS.map((t, i) => (
                <div key={i} style={{ ...panel, padding: 14 }} className="card-hover">
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, paddingBottom: 10, borderBottom: `1px solid ${C.border}` }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: "50%", background: "#1a2030",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: C.mono, fontSize: 12, color: C.blue, fontWeight: 500, flexShrink: 0,
                    }}>{t.handle[0].toUpperCase()}</div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: "#dde4ef" }}>{t.name}</div>
                      <div style={{ fontFamily: C.mono, fontSize: 10, color: C.muted }}>@{t.handle}</div>
                    </div>
                    <span style={{ marginLeft: "auto", fontFamily: C.mono, fontSize: 9, color: C.muted }}>{t.time}</span>
                  </div>
                  <p style={{ fontSize: 13, lineHeight: 1.6, color: C.text, marginBottom: 10 }}>{t.text}</p>
                  <div style={{ fontFamily: C.mono, fontSize: 9, color: C.muted }}>
                    ♥ {t.likes}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
