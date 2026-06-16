export default async function handler(req, res) {
  const path = req.query.path || '';
  const url = 'https://free-api-live-football-data.p.rapidapi.com/' + path;
  
  try {
    const r = await fetch(url, {
      headers: {
        'x-rapidapi-host': 'free-api-live-football-data.p.rapidapi.com',
        'x-rapidapi-key': '0b86e6e407msh87dbc20a42baff8p158ad1jsn9bf9d8b8231d',
        'Content-Type': 'application/json'
      }
    });
    const data = await r.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(r.status).json(data);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
