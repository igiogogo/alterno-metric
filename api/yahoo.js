// api/yahoo.js — proxies Yahoo Finance v8 quote endpoint (no API key needed)
// Handles CORS since Yahoo blocks direct browser requests

const ALLOWED_SYMBOLS = new Set([
  // Commodities futures
  "GC=F","SI=F","CL=F","BZ=F","NG=F","HG=F","ZW=F","ZC=F","ZS=F","PL=F","PA=F","KC=F","CT=F",
  // Bond yields (CBOE indices)
  "^TNX","^IRX","^TYX","^FVX",
  // Also allow regular stock tickers for chart data
  "AAPL","NVDA","TSLA","META","MSFT","AMZN","GOOGL","GOOG","SPY","QQQ",
  "NFLX","AMD","INTC","COIN","JPM","GS","BAC","WMT","DIS","UBER","ABNB",
  "V","MA","PYPL","SQ","CRM","BA","KO","PEP","NKE","SBUX","MCD","SHOP",
  "SPOT","SNAP","HOOD","PLTR","ARM","SMCI",
]);

export default async function handler(req, res) {
  const symbol = (req.query.symbol || "").toUpperCase().trim();

  if (!symbol) {
    return res.status(400).json({ error: "Missing symbol parameter" });
  }

  // Allow any symbol that starts with known patterns, or is in the whitelist
  const isKnown =
    ALLOWED_SYMBOLS.has(symbol) ||
    symbol.endsWith("=F") ||          // futures
    symbol.startsWith("^");           // indices / yields

  if (!isKnown) {
    return res.status(400).json({ error: `Symbol ${symbol} not allowed` });
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;

    const upstream = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
        "Referer": "https://finance.yahoo.com",
      },
    });

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: `Yahoo returned ${upstream.status}` });
    }

    const data = await upstream.json();
    const result = data?.chart?.result?.[0];

    if (!result) {
      return res.status(404).json({ error: "No data for symbol" });
    }

    const meta = result.meta || {};
    const prevClose = meta.chartPreviousClose || meta.previousClose || 0;
    const price = meta.regularMarketPrice || meta.previousClose || 0;
    const change = price - prevClose;
    const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0;

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=30");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json({
      symbol,
      price,
      change,
      changePct,
      prevClose,
      high: meta.regularMarketDayHigh || 0,
      low:  meta.regularMarketDayLow  || 0,
      open: meta.regularMarketOpen    || 0,
      currency: meta.currency || "USD",
      marketState: meta.marketState || "CLOSED",
      longName: meta.longName || meta.shortName || symbol,
    });

  } catch (e) {
    res.status(502).json({ error: "Failed to reach Yahoo Finance", detail: e.message });
  }
}
