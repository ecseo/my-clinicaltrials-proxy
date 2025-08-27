// api/ctg.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  const { searchParams } = new URL(req.url, 'http://localhost');
  const term = searchParams.get('query.term') || '';
  const pageSize = searchParams.get('pageSize') || '20';
  const pageToken = searchParams.get('pageToken') || '';

  // 필수: query.term 비어있으면 400
  if (!term.trim()) return res.status(400).json({ error: "query.term is required" });

  const upstream = new URL('https://clinicaltrials.gov/api/v2/studies');
  upstream.searchParams.set('format', 'json');
  upstream.searchParams.set('query.term', term);
  upstream.searchParams.set('pageSize', pageSize);
  if (pageToken) upstream.searchParams.set('pageToken', pageToken);

  try {
    const r = await fetch(upstream.toString(), {
      method: 'GET',
      headers: {
        // UA/Accept을 명시해 403 회피
        'User-Agent': 'JOY-CRIS-CTG-Proxy/1.0 (+contact: your-email@example.com)',
        'Accept': 'application/json'
      }
    });
    const b = await r.arrayBuffer();
    res.setHeader('Content-Type', r.headers.get('content-type') || 'application/json');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(r.status).send(Buffer.from(b));
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Proxy error' });
  }
}
