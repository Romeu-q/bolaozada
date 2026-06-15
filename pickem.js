/* =============================================
   PICKEM.JS — Palpites salvos no Supabase
   ============================================= */

let pickemMatches = [];
let userPicks = {}; // { match_api_id: 'Argentina' }
let pickemLoaded = false;

async function loadPickem() {
  if (pickemLoaded) { renderPickemStats(); return; }

  const el = document.getElementById('pickemGrid');
  if (!el) return;
  el.innerHTML = '<div class="loading-state"><div class="spinner"></div> Carregando jogos...</div>';

  // Busca jogos das fases decisivas
  const [r16, qf, sf, fin] = await Promise.all([
    cachedFD(`/competitions/${WC_COMPETITION_ID}/matches?stage=LAST_16`),
    cachedFD(`/competitions/${WC_COMPETITION_ID}/matches?stage=QUARTER_FINALS`),
    cachedFD(`/competitions/${WC_COMPETITION_ID}/matches?stage=SEMI_FINALS`),
    cachedFD(`/competitions/${WC_COMPETITION_ID}/matches?stage=FINAL`),
  ]);

  if (fin?.matches?.length) {
    pickemMatches = buildPickemMatches(r16, qf, sf, fin);
  } else {
    pickemMatches = FALLBACK_PICKEM;
  }

  // Busca palpites salvos do usuário no Supabase
  if (currentUser) {
    const { data } = await supabase
      .from('picks')
      .select('*')
      .eq('user_id', currentUser.id);
    if (data) {
      data.forEach(p => { userPicks[p.match_id] = p.picked_team; });
    }
  }

  pickemLoaded = true;
  renderPickem();
}

function buildPickemMatches(r16Data, qfData, sfData, finalData) {
  const labelMap = {
    LAST_16: 'Oitavas de Final',
    QUARTER_FINALS: 'Quartas de Final',
    SEMI_FINALS: 'Semifinal',
    FINAL: 'Final'
  };
  const all = [
    ...(r16Data?.matches || []),
    ...(qfData?.matches || []),
    ...(sfData?.matches || []),
    ...(finalData?.matches || [])
  ];
  return all.map(m => {
    const done = m.status === 'FINISHED';
    const live = m.status === 'IN_PLAY' || m.status === 'PAUSED';
    const hs = m.score?.fullTime?.home;
    const as = m.score?.fullTime?.away;
    const pen = m.score?.penalties?.home > m.score?.penalties?.away
      ? m.homeTeam?.name : m.score?.penalties?.away > m.score?.penalties?.home
        ? m.awayTeam?.name : null;
    let winner = null;
    if (done) winner = pen || (hs > as ? m.homeTeam?.name : m.awayTeam?.name);
    return {
      id: String(m.id),
      label: labelMap[m.stage] || m.stage,
      matchday: m.matchday,
      home: m.homeTeam?.name || 'TBD',
      away: m.awayTeam?.name || 'TBD',
      date: m.utcDate,
      status: done ? 'done' : live ? 'live' : 'pending',
      winner,
      homeScore: hs,
      awayScore: as,
    };
  });
}

// Fallback pick'em
const FALLBACK_PICKEM = [
  {id:'f_sf1',label:'Semifinal',home:'Argentina',away:'Croatia',status:'done',winner:'Argentina',homeScore:3,awayScore:0},
  {id:'f_sf2',label:'Semifinal',home:'France',away:'Morocco',status:'done',winner:'France',homeScore:2,awayScore:0},
  {id:'f_final',label:'Final',home:'Argentina',away:'France',status:'done',winner:'Argentina',homeScore:3,awayScore:3},
  {id:'f_qf1',label:'Quartas de Final',home:'Netherlands',away:'Argentina',status:'done',winner:'Argentina',homeScore:2,awayScore:2},
  {id:'f_qf2',label:'Quartas de Final',home:'France',away:'England',status:'done',winner:'France',homeScore:2,awayScore:1},
  {id:'f_qf3',label:'Quartas de Final',home:'Croatia',away:'Brazil',status:'done',winner:'Croatia',homeScore:1,awayScore:1},
  {id:'f_qf4',label:'Quartas de Final',home:'Morocco',away:'Portugal',status:'done',winner:'Morocco',homeScore:1,awayScore:0},
  {id:'f_r1',label:'Oitavas de Final',home:'Brazil',away:'South Korea',status:'done',winner:'Brazil',homeScore:4,awayScore:1},
  {id:'f_r2',label:'Oitavas de Final',home:'Morocco',away:'Spain',status:'done',winner:'Morocco',homeScore:0,awayScore:0},
  {id:'f_r3',label:'Oitavas de Final',home:'Portugal',away:'Switzerland',status:'done',winner:'Portugal',homeScore:6,awayScore:1},
  {id:'f_r4',label:'Oitavas de Final',home:'England',away:'Senegal',status:'done',winner:'England',homeScore:3,awayScore:0},
  {id:'f_r5',label:'Oitavas de Final',home:'Argentina',away:'Australia',status:'done',winner:'Argentina',homeScore:2,awayScore:1},
  {id:'f_r6',label:'Oitavas de Final',home:'France',away:'Poland',status:'done',winner:'France',homeScore:3,awayScore:1},
  {id:'f_r7',label:'Oitavas de Final',home:'Netherlands',away:'USA',status:'done',winner:'Netherlands',homeScore:3,awayScore:1},
  {id:'f_r8',label:'Oitavas de Final',home:'Japan',away:'Croatia',status:'pending',winner:null},
];

// ---- RENDER ----
function renderPickem() {
  renderPickemStats();
  const el = document.getElementById('pickemGrid');
  if (!el) return;

  // Agrupa por fase
  const order = ['Final', 'Semifinal', 'Quartas de Final', 'Oitavas de Final'];
  const grouped = {};
  pickemMatches.forEach(m => {
    if (!grouped[m.label]) grouped[m.label] = [];
    grouped[m.label].push(m);
  });

  let html = '';
  order.forEach(phase => {
    if (!grouped[phase]) return;
    html += `<div class="section-label" style="grid-column:1/-1">${phase}</div>`;
    grouped[phase].forEach(m => {
      html += renderPickCard(m);
    });
  });

  el.innerHTML = html;
}

function renderPickCard(m) {
  const pick = userPicks[m.id];
  const isDone = m.status === 'done';
  const isLive = m.status === 'live';
  const isCorrect = isDone && pick && pick === m.winner;
  const isWrong = isDone && pick && pick !== m.winner;
  const canPick = !isDone && !isLive && m.home !== 'TBD';

  let badgeClass = 'badge-pending', badgeText = 'Aguardando';
  if (isCorrect) { badgeClass = 'badge-correct'; badgeText = '✓ Acertou!'; }
  else if (isWrong) { badgeClass = 'badge-wrong'; badgeText = '✗ Errou'; }
  else if (isLive) { badgeClass = 'badge-live'; badgeText = '● Ao Vivo'; }
  else if (pick && !isDone) { badgeClass = 'badge-pending'; badgeText = '💾 Palpite salvo'; }

  let cardClass = 'pick-card';
  if (isCorrect) cardClass += ' correct';
  if (isWrong) cardClass += ' wrong';

  let resultHtml = '';
  if (isDone && pick) {
    resultHtml = `
      <div class="pick-result-row">
        <span class="pick-result-label">Resultado real</span>
        <span class="pick-result-neutral">${getFlag(m.winner)} ${m.winner}</span>
      </div>
      <div class="pick-result-row">
        <span class="pick-result-label">Seu palpite</span>
        <span class="${isCorrect ? 'pick-result-correct' : 'pick-result-wrong'}">${getFlag(pick)} ${pick}</span>
      </div>`;
  } else if (isDone && !pick) {
    resultHtml = `<div class="pick-result-row"><span class="pick-result-label">Resultado</span><span class="pick-result-neutral">${getFlag(m.winner)} ${m.winner}</span></div>
      <div class="pick-result-row"><span class="pick-result-label">Palpite</span><span style="color:var(--text-3);font-style:italic">Não apostou</span></div>`;
  }

  let actionHtml = '';
  if (canPick && !pick) {
    actionHtml = `<div class="pick-action">
      <select id="sel-${m.id}">
        <option value="">Escolha o vencedor</option>
        <option value="${m.home}">${getFlag(m.home)} ${m.home}</option>
        <option value="${m.away}">${getFlag(m.away)} ${m.away}</option>
      </select>
      <button class="btn-pick-save" onclick="savePick('${m.id}')">Salvar</button>
    </div>`;
  } else if (pick && !isDone) {
    actionHtml = `<div class="pick-saved-pick">Palpite: ${getFlag(pick)} <strong>${pick}</strong></div>`;
  } else if (m.home === 'TBD') {
    actionHtml = `<div class="pick-saved-pick" style="color:var(--text-3)">Aguardando definição dos times</div>`;
  }

  let scoreHtml = '';
  if (isDone && m.homeScore !== undefined && m.homeScore !== null) {
    scoreHtml = `<span style="font-size:0.75rem;font-weight:700;color:var(--gold)">${m.homeScore} × ${m.awayScore}</span>`;
  }

  return `<div class="${cardClass}">
    <div class="pick-card-header">
      <h4>${m.label}</h4>
      <span class="badge ${badgeClass}">${badgeText}</span>
    </div>
    <div class="pick-matchup">
      <div class="pick-team-side">
        <span>${getFlag(m.home)}</span>
        <span class="pick-team-name">${m.home}</span>
      </div>
      ${scoreHtml || '<span class="pick-vs">VS</span>'}
      <div class="pick-team-side right">
        <span class="pick-team-name">${m.away}</span>
        <span>${getFlag(m.away)}</span>
      </div>
    </div>
    ${resultHtml}
    ${actionHtml}
  </div>`;
}

function renderPickemStats() {
  let correct = 0, wrong = 0, pending = 0;
  pickemMatches.forEach(m => {
    const p = userPicks[m.id];
    if (m.status === 'done') {
      if (!p) pending++;
      else if (p === m.winner) correct++;
      else wrong++;
    } else {
      pending++;
    }
  });
  const pts = correct * 10;
  document.getElementById('statPts').textContent = pts;
  document.getElementById('statCorrect').textContent = correct;
  document.getElementById('statWrong').textContent = wrong;
  document.getElementById('statPending').textContent = pending;
}

// ---- SAVE PICK ----
async function savePick(matchId) {
  const sel = document.getElementById('sel-' + matchId);
  if (!sel || !sel.value) { showToast('Escolha um vencedor primeiro!', 'warning'); return; }
  const team = sel.value;

  if (!currentUser) { showToast('Faça login para salvar palpites.', 'error'); return; }

  const { error } = await supabase.from('picks').upsert({
    user_id: currentUser.id,
    match_id: matchId,
    picked_team: team,
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id,match_id' });

  if (error) {
    showToast('Erro ao salvar: ' + error.message, 'error');
    return;
  }

  userPicks[matchId] = team;
  showToast(`Palpite salvo: ${getFlag(team)} ${team} ✓`, 'success');

  // Atualiza pontuação no profile
  await updateUserScore();
  renderPickem();
}

async function saveAllPicks() {
  const selects = document.querySelectorAll('[id^="sel-"]');
  if (!selects.length) { showToast('Nenhum palpite pendente.', 'info'); return; }

  let saved = 0;
  const upserts = [];

  selects.forEach(sel => {
    if (!sel.value) return;
    const matchId = sel.id.replace('sel-', '');
    if (userPicks[matchId]) return; // já salvo
    userPicks[matchId] = sel.value;
    upserts.push({
      user_id: currentUser.id,
      match_id: matchId,
      picked_team: sel.value,
      updated_at: new Date().toISOString()
    });
    saved++;
  });

  if (!upserts.length) { showToast('Sem palpites novos para salvar.', 'info'); return; }

  const { error } = await supabase.from('picks')
    .upsert(upserts, { onConflict: 'user_id,match_id' });

  if (error) { showToast('Erro ao salvar: ' + error.message, 'error'); return; }

  await updateUserScore();
  showToast(`${saved} palpite${saved > 1 ? 's' : ''} salvo${saved > 1 ? 's' : ''}! ✓`, 'success');
  renderPickem();
}

async function updateUserScore() {
  if (!currentUser) return;
  let correct = 0;
  pickemMatches.forEach(m => {
    if (m.status === 'done' && userPicks[m.id] === m.winner) correct++;
  });
  await supabase.from('profiles').update({
    score: correct * 10,
    correct_picks: correct
  }).eq('id', currentUser.id);
}
