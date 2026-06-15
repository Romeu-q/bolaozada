/* =============================================
   CONFIG — Substitua pelos seus valores reais
   ============================================= */

// ⚠️  CONFIGURE ANTES DE FAZER DEPLOY:
//    1. Crie um projeto em https://supabase.com
//    2. Copie a URL e a chave anon do projeto
//    3. Cole abaixo (substitua os placeholders)
//    4. Execute o SQL em supabase/schema.sql no SQL Editor do Supabase

const SUPABASE_URL = 'https://olzcsczypoaqpntzfbsv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_GD9R_nDQNxlZY5F0lNaCnw_CUAKm6eX';

// Football-Data.org (jogos, grupos, mata-mata)
const FD_BASE = 'https://api.football-data.org/v4';
const FD_TOKEN = '06f91a53d7ff4718a498803703571a46';
const WC_COMPETITION_ID = 2000; // Copa do Mundo FIFA

// footballdata.io (dados complementares — usar com moderação)
const FDio_TOKEN = 'fd_d64a57595b3be27e3dd55085f9828a84b7eaf94b6ec58577';
const FDio_BASE = 'https://api.footballdata.io/v1';

// Inicializa cliente Supabase (disponível globalmente)
const _supabaseLib = window.supabase; const supabase = _supabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---- HELPERS ----

async function apiFD(path) {
  try {
    const res = await fetch(FD_BASE + path, {
      headers: { 'X-Auth-Token': FD_TOKEN }
    });
    if (!res.ok) {
      console.warn('Football-Data API error:', res.status, path);
      return null;
    }
    return res.json();
  } catch (e) {
    console.error('apiFD fetch error:', e);
    return null;
  }
}

// Usar com cautela (tier pago / menos chamadas)
async function apiFDio(path) {
  try {
    const res = await fetch(FDio_BASE + path, {
      headers: { 'X-Auth-Token': FDio_TOKEN }
    });
    if (!res.ok) return null;
    return res.json();
  } catch (e) {
    console.error('apiFDio fetch error:', e);
    return null;
  }
}

// Toast global
function showToast(msg, type = 'info') {
  const el = document.getElementById('toast');
  if (!el) return;
  const icons = { info: 'ℹ️', success: '✅', error: '❌', warning: '⚠️' };
  el.textContent = (icons[type] || '') + ' ' + msg;
  el.classList.add('show');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('show'), 3500);
}

// Cache simples em memória (evita re-fetch na mesma sessão)
const _cache = {};
async function cachedFD(path, ttlMs = 5 * 60 * 1000) {
  const key = 'fd:' + path;
  const now = Date.now();
  if (_cache[key] && now - _cache[key].ts < ttlMs) return _cache[key].data;
  const data = await apiFD(path);
  if (data) _cache[key] = { data, ts: now };
  return data;
}

// Emojis de bandeira por nome do time
const FLAGS = {
  'Brazil':'🇧🇷','Germany':'🇩🇪','France':'🇫🇷','Argentina':'🇦🇷','Spain':'🇪🇸',
  'England':'🏴󠁧󠁢󠁥󠁮󠁧󠁿','Portugal':'🇵🇹','Netherlands':'🇳🇱','Belgium':'🇧🇪',
  'Italy':'🇮🇹','Uruguay':'🇺🇾','Mexico':'🇲🇽','United States':'🇺🇸','USA':'🇺🇸',
  'Canada':'🇨🇦','Japan':'🇯🇵','South Korea':'🇰🇷','Korea Republic':'🇰🇷',
  'Australia':'🇦🇺','Morocco':'🇲🇦','Senegal':'🇸🇳','Ghana':'🇬🇭',
  'Ecuador':'🇪🇨','Croatia':'🇭🇷','Switzerland':'🇨🇭','Poland':'🇵🇱',
  'Denmark':'🇩🇰','Serbia':'🇷🇸','Colombia':'🇨🇴','Peru':'🇵🇪',
  'Chile':'🇨🇱','Saudi Arabia':'🇸🇦','Iran':'🇮🇷','Cameroon':'🇨🇲',
  'Tunisia':'🇹🇳','Qatar':'🇶🇦','Wales':'🏴󠁧󠁢󠁷󠁬󠁳󠁿','Costa Rica':'🇨🇷',
  'Ghana':'🇬🇭','Côte d\'Ivoire':'🇨🇮','Nigeria':'🇳🇬','Egypt':'🇪🇬',
  'Algeria':'🇩🇿','South Africa':'🇿🇦','New Zealand':'🇳🇿','Panama':'🇵🇦',
  'Honduras':'🇭🇳','El Salvador':'🇸🇻','Jamaica':'🇯🇲','Trinidad and Tobago':'🇹🇹',
  'Venezuela':'🇻🇪','Paraguay':'🇵🇾','Bolivia':'🇧🇴','Guatemala':'🇬🇹',
  'Cuba':'🇨🇺','Haiti':'🇭🇹','Turkey':'🇹🇷','Greece':'🇬🇷',
  'Austria':'🇦🇹','Czech Republic':'🇨🇿','Hungary':'🇭🇺','Slovakia':'🇸🇰',
  'Romania':'🇷🇴','Ukraine':'🇺🇦','Russia':'🇷🇺','Sweden':'🇸🇪',
  'Norway':'🇳🇴','Finland':'🇫🇮','Iceland':'🇮🇸','Scotland':'🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'Ireland':'🇮🇪','North Macedonia':'🇲🇰','Albania':'🇦🇱','Kosovo':'🇽🇰',
  'Bosnia and Herzegovina':'🇧🇦','Montenegro':'🇲🇪','Slovenia':'🇸🇮',
  'Israel':'🇮🇱','Georgia':'🇬🇪','Armenia':'🇦🇲','Azerbaijan':'🇦🇿',
  'Iraq':'🇮🇶','Syria':'🇸🇾','Lebanon':'🇱🇧','Jordan':'🇯🇴',
  'UAE':'🇦🇪','Kuwait':'🇰🇼','Oman':'🇴🇲','Bahrain':'🇧🇭',
  'Thailand':'🇹🇭','Vietnam':'🇻🇳','Indonesia':'🇮🇩','Malaysia':'🇲🇾',
  'China PR':'🇨🇳','China':'🇨🇳','India':'🇮🇳','Pakistan':'🇵🇰',
};
function getFlag(name) {
  return FLAGS[name] || '🏳️';
}
function initials(name) {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
