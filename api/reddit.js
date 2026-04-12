export default async function handler(req, res) {
  const filter = req.query.filter || "all-stocks";

  // Whitelist valid filters to prevent abuse
  const allowed = [
    "all-stocks", "all-crypto", "wallstreetbets", "stocks",
    "investing", "CryptoCurrency", "SatoshiStreetBets",
    "options", "Daytrading", "4chan",
  ];

  if (!allowed.includes(filter)) {
    return res.status(400).json({ error: "Invalid filter" });
  }

  try {
    const upstream = await fetch(
      `https://apewisdom.io/api/v1.0/filter/${filter}`
    );

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: "Upstream error" });
    }

    const data = await upstream.json();

    // Cache on Vercel's CDN for 15 minutes so we don't hammer ApeWisdom
    res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=60");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json(data);
  } catch (e) {
    res.status(502).json({ error: "Failed to reach upstream API" });
  }
}
