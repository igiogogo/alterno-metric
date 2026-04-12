export default async function handler(req, res) {
  const sources = {
    reuters:   "https://feeds.reuters.com/reuters/businessNews",
    ft:        "https://www.ft.com/rss/home",
    wsj:       "https://feeds.a.dj.com/rss/RSSMarketsMain.xml",
    coindesk:  "https://www.coindesk.com/arc/outboundfeeds/rss/",
    bloomberg: "https://feeds.bloomberg.com/markets/news.rss",
    cointelegraph: "https://cointelegraph.com/rss",
    seekingalpha:  "https://seekingalpha.com/market_currents.xml",
    investing:     "https://www.investing.com/rss/news.rss",
  };

  const source = req.query.source;
  if (!source || !sources[source]) {
    return res.status(400).json({ error: "Invalid source. Valid: " + Object.keys(sources).join(", ") });
  }

  try {
    const upstream = await fetch(sources[source], {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AlternoMetric/1.0; +https://alterno-metric.vercel.app)",
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
      },
    });

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: `Upstream returned ${upstream.status}` });
    }

    const xml = await upstream.text();

    // Parse XML into clean JSON — no external dependencies needed
    const items = [];
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
    let match;

    while ((match = itemRegex.exec(xml)) !== null && items.length < 20) {
      const block = match[1];

      const get = (tag) => {
        // Try CDATA first, then plain text
        const cdata = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, "i").exec(block);
        if (cdata) return cdata[1].trim();
        const plain = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i").exec(block);
        if (plain) return plain[1].replace(/<[^>]+>/g, "").trim();
        return "";
      };

      const getAttr = (tag, attr) => {
        const r = new RegExp(`<${tag}[^>]+${attr}="([^"]*)"`, "i").exec(block);
        return r ? r[1] : "";
      };

      const title = get("title");
      const link  = get("link") || getAttr("link", "href");
      const pubDate = get("pubDate") || get("dc:date") || get("published");
      const description = get("description") || get("summary") || "";

      // Parse date to unix timestamp
      let timestamp = 0;
      try { timestamp = pubDate ? Math.floor(new Date(pubDate).getTime() / 1000) : 0; } catch {}

      if (title && link) {
        items.push({
          title: title.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'"),
          link,
          description: description.slice(0, 200),
          timestamp,
          source,
        });
      }
    }

    // Sort newest first
    items.sort((a, b) => b.timestamp - a.timestamp);

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60"); // 5 min cache
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json({ source, items });

  } catch (e) {
    res.status(502).json({ error: "Failed to fetch feed", detail: e.message });
  }
}
