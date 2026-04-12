// api/yahoo-history.js — historical price data for commodities & bonds
export default async function handler(req, res) {
  const symbol   = (req.query.symbol   || "").trim();
  const range    = req.query.range    || "1mo";
  const interval = req.query.interval || "1d";

  if(!symbol){
    return res.status(400).json({error:"Missing symbol"});
  }

  const validRanges    = ["5d","1mo","3mo","1y","5y"];
  const validIntervals = ["1d","1wk","1mo"];

  if(!validRanges.includes(range)||!validIntervals.includes(interval)){
    return res.status(400).json({error:"Invalid range or interval"});
  }

  try{
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;
    const upstream = await fetch(url,{
      headers:{
        "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept":"application/json",
        "Referer":"https://finance.yahoo.com",
      },
    });

    if(!upstream.ok){
      return res.status(upstream.status).json({error:`Yahoo returned ${upstream.status}`});
    }

    const data = await upstream.json();
    const result = data?.chart?.result?.[0];

    if(!result){
      return res.status(404).json({error:"No data"});
    }

    const timestamps = result.timestamp || [];
    const closes     = result.indicators?.quote?.[0]?.close || [];

    // Filter out null values
    const clean = timestamps
      .map((t,i)=>({t, c: closes[i]}))
      .filter(p=>p.c!=null && p.c > 0);

    res.setHeader("Cache-Control","s-maxage=3600, stale-while-revalidate=300");
    res.setHeader("Access-Control-Allow-Origin","*");
    res.status(200).json({
      symbol,
      timestamps: clean.map(p=>p.t),
      closes:     clean.map(p=>p.c),
    });
  }catch(e){
    res.status(502).json({error:"Failed to fetch history",detail:e.message});
  }
}
