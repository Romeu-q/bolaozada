export default async function handler(req, res) {
  const path = req.query.path || '';
  const url = 'https://api.football-data.org/v4/' + path;
  
  try {
    const r = await fetch(url, {
      headers: { 'X-Auth-Token': '06f91a53d7ff4718a498803703571a46' }
    });
    const data = await r.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(r.status).json(data);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
