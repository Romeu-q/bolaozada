/* =============================================
   BRACKETS.JS — Grupos e Mata-Mata
   Consome football-data.org com fallback
   ============================================= */

// Fallback: dados da Copa 2022 como exemplo
const FALLBACK_GROUPS = [
  {id:'A',teams:[{n:'Qatar',p:0,pj:3,v:0,e:0,d:3,gf:1,gc:7},{n:'Ecuador',p:4,pj:3,v:1,e:1,d:1,gf:4,gc:3},{n:'Senegal',p:6,pj:3,v:2,e:0,d:1,gf:5,gc:4},{n:'Netherlands',p:9,pj:3,v:3,e:0,d:0,gf:5,gc:1}]},
  {id:'B',teams:[{n:'England',p:5,pj:3,v:1,e:2,d:0,gf:9,gc:2},{n:'Iran',p:3,pj:3,v:1,e:0,d:2,gf:4,gc:7},{n:'USA',p:5,pj:3,v:1,e:2,d:0,gf:2,gc:1},{n:'Wales',p:1,pj:3,v:0,e:1,d:2,gf:1,gc:6}]},
  {id:'C',teams:[{n:'Argentina',p:6,pj:3,v:2,e:0,d:1,gf:5,gc:2},{n:'Poland',p:4,pj:3,v:1,e:1,d:1,gf:2,gc:2},{n:'Mexico',p:4,pj:3,v:1,e:1,d:1,gf:2,gc:3},{n:'Saudi Arabia',p:4,pj:3,v:1,e:1,d:1,gf:3,gc:5}]},
  {id:'D',teams:[{n:'France',p:6,pj:3,v:2,e:0,d:1,gf:6,gc:3},{n:'Australia',p:6,pj:3,v:2,e:0,d:1,gf:5,gc:4},{n:'Tunisia',p:4,pj:3,v:1,e:1,d:1,gf:1,gc:1},{n:'Denmark',p:1,pj:3,v:0,e:1,d:2,gf:1,gc:5}]},
  {id:'E',teams:[{n:'Japan',p:6,pj:3,v:2,e:0,d:1,gf:4,gc:3},{n:'Spain',p:4,pj:3,v:1,e:1,d:1,gf:9,gc:3},{n:'Germany',p:4,pj:3,v:1,e:1,d:1,gf:6,gc:5},{n:'Costa Rica',p:3,pj:3,v:1,e:0,d:2,gf:3,gc:11}]},
  {id:'F',teams:[{n:'Morocco',p:7,pj:3,v:2,e:1,d:0,gf:4,gc:1},{n:'Croatia',p:5,pj:3,v:1,e:2,d:0,gf:4,gc:1},{n:'Belgium',p:3,pj:3,v:1,e:0,d:2,gf:1,gc:2},{n:'Canada',p:0,pj:3,v:0,e:0,d:3,gf:2,gc:7}]},
  {id:'G',teams:[{n:'Brazil',p:6,pj:3,v:2,e:0,d:1,gf:3,gc:1},{n:'Switzerland',p:6,pj:3,v:2,e:0,d:1,gf:4,gc:3},{n:'Cameroon',p:4,pj:3,v:1,e:1,d:1,gf:4,gc:4},{n:'Serbia',p:1,pj:3,v:0,e:1,d:2,gf:5,gc:8}]},
  {id:'H',teams:[{n:'Portugal',p:6,pj:3,v:2,e:0,d:1,gf:8,gc:4},{n:'South Korea',p:4,pj:3,v:1,e:1,d:1,gf:4,gc:4},{n:'Uruguay',p:4,pj:3,v:1,e:1,d:1,gf:2,gc:3},{n:'Ghana',p:3,pj:3,v:1,e:0,d:2,gf:5,gc:7}]},
];

const FALLBACK_KO = {
  r16: [
    {h:'Netherlands',a:'USA',hs:3,as:1,done:true},
    {h:'Argentina',a:'Australia',hs:2,as:1,done:true},
    {h:'France',a:'Poland',hs:3,as:1,done:true},
    {h:'England',a:'Senegal',hs:3,as:0,done:true},
    {h:'Japan',a:'Croatia',hs:1,as:1,pen:'Croatia',done:true},
    {h:'Brazil',a:'South Korea',hs:4,as:1,done:true},
    {h:'Morocco',a:'Spain',hs:0,as:0,pen:'Morocco',done:true},
    {h:'Portugal',a:'Switzerland',hs:6,as:1,done:true},
  ],
  qf: [
    {h:'Netherlands',a:'Argentina',hs:2,as:2,pen:'Argentina',done:true},
    {h:'France',a:'England',hs:2,as:1,done:true},
    {h:'Croatia',a:'Brazil',hs:1,as:1,pen:'Croatia',done:true},
    {h:'Morocco',a:'Portugal',hs:1,as:0,done:true},
  ],
  sf: [
    {h:'Argentina',a:'Croatia',hs:3,as:0,done:true},
    {h:'France',a:'Morocco',hs:2,as:0,done:true},
  ],
  final: [
    {h:'Argentina',a:'France',hs:3,as:3,pen:'Argentina',done:true}
  ],
  champion: 'Argentina'
};

async function loadBrackets() {
  const el = document.getElementById('brackets-content') || document.getElementById('groupsGrid');
  if (!el) {
    renderGroups(FALLBACK_GROUPS);
    renderKnockout(FALLBACK_KO);
    return;
  }

  // Tenta buscar da API
  const standing = await cachedFD(`/competitions/${WC_COMPETITION_ID}/standings`);
  const matchesR16 = await cachedFD(`/competitions/${WC_COMPETITION_ID}/matches?stage=LAST_16`);
  const matchesQF = await cachedFD(`/competitions/${WC_COMPETITION_ID}/matches?stage=QUARTER_FINALS`);
  const matchesSF = await cachedFD(`/competitions/${WC_COMPETITION_ID}/matches?stage=SEMI_FINALS`);
  const matchesFinal = await cachedFD(`/competitions/${WC_COMPETITION_ID}/matches?stage=FINAL`);

  // Grupos
  if (standing && standing.standings) {
    const groups = parseAPIGroups(standing.standings);
    renderGroups(groups);
  } else {
    renderGroups(FALLBACK_GROUPS);
  }

  // Mata-mata
  if (matchesFinal) {
    const ko = parseAPIKO(matchesR16, matchesQF, matchesSF, matchesFinal);
    renderKnockout(ko);
  } else {
    renderKnockout(FALLBACK_KO);
  }
}

function parseAPIGroups(standings) {
  return standings
    .filter(s => s.type === 'TOTAL')
    .map(s => ({
      id: s.group?.replace('GROUP_', '') || '?',
      teams: s.table.map(row => ({
        n: row.team.name,
        p: row.points,
        pj: row.playedGames,
        v: row.won,
        e: row.draw,
        d: row.lost,
        gf: row.goalsFor,
        gc: row.goalsAgainst
      }))
    }));
}

function parseAPIKO(r16Data, qfData, sfData, finalData) {
  function parseMatches(data) {
    if (!data?.matches) return [];
    return data.matches.map(m => {
      const done = m.status === 'FINISHED';
      const hs = m.score?.fullTime?.home ?? m.score?.halfTime?.home ?? 0;
      const as = m.score?.fullTime?.away ?? m.score?.halfTime?.away ?? 0;
      const pen = m.score?.penalties?.home > m.score?.penalties?.away
        ? m.homeTeam?.name
        : m.score?.penalties?.away > m.score?.penalties?.home
          ? m.awayTeam?.name
          : null;
      return {
        h: m.homeTeam?.name || 'TBD',
        a: m.awayTeam?.name || 'TBD',
        hs: done ? hs : null,
        as: done ? as : null,
        pen,
        done
      };
    });
  }

  const finals = parseMatches(finalData);
  const champion = finals[0]?.done
    ? (finals[0].pen || (finals[0].hs > finals[0].as ? finals[0].h : finals[0].a))
    : '?';

  return {
    r16: parseMatches(r16Data),
    qf: parseMatches(qfData),
    sf: parseMatches(sfData),
    final: finals,
    champion
  };
}

// ---- RENDER GROUPS ----
function renderGroups(groups) {
  const el = document.getElementById('groupsGrid');
  if (!el) return;
  el.innerHTML = groups.map(g => `
    <div class="group-card">
      <div class="group-card-head">
        <h3>Grupo ${g.id}</h3>
        <span>${g.teams[0]?.pj || 3} jogos</span>
      </div>
      <table class="group-table">
        <thead>
          <tr>
            <th>Time</th>
            <th title="Pontos">P</th>
            <th title="Saldo">SG</th>
            <th title="Pontos">Pts</th>
          </tr>
        </thead>
        <tbody>
          ${g.teams.sort((a,b) => b.p - a.p || (b.gf-b.gc) - (a.gf-a.gc)).map((t,i) => `
            <tr>
              <td>
                <div class="team-cell">
                  <div class="${i < 2 ? 'qualified-marker' : 'eliminated-marker'}"></div>
                  <span class="flag">${getFlag(t.n)}</span>
                  <span class="team-name">${t.n}</span>
                </div>
              </td>
              <td>${t.pj}</td>
              <td>${(t.gf - t.gc) >= 0 ? '+' : ''}${t.gf - t.gc}</td>
              <td><strong>${t.p}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `).join('');
}

// ---- RENDER KNOCKOUT ----
function renderKnockout(ko) {
  const el = document.getElementById('knockoutTree');
  if (!el) return;

  const rounds = [
    { label: 'Oitavas de Final', matches: ko.r16 },
    { label: 'Quartas de Final', matches: ko.qf },
    { label: 'Semifinal', matches: ko.sf },
    { label: 'Final', matches: ko.final },
  ];

  let html = '<div class="knockout-tree">';

  rounds.forEach((round, ri) => {
    html += `<div class="ko-round">
      <div class="ko-round-label">${round.label}</div>
      <div class="ko-matches">`;

    round.matches.forEach(m => {
      const hWin = m.done && (m.pen ? m.pen === m.h : m.hs > m.as);
      const aWin = m.done && (m.pen ? m.pen === m.a : m.as > m.hs);
      const isFinal = ri === 3;

      html += `<div class="ko-match${isFinal ? ' final-match' : ''}">
        <div class="ko-team ${hWin ? 'winner' : m.done ? 'loser' : ''}">
          <div class="ko-team-info">
            <span>${getFlag(m.h)}</span>
            <span class="ko-team-name">${m.h}</span>
          </div>
          ${m.done ? `<span class="ko-score">${m.hs}${m.pen === m.h ? '<span class="ko-pen">P</span>' : ''}</span>` : ''}
        </div>
        <div class="ko-team ${aWin ? 'winner' : m.done ? 'loser' : ''}">
          <div class="ko-team-info">
            <span>${getFlag(m.a)}</span>
            <span class="ko-team-name">${m.a}</span>
          </div>
          ${m.done ? `<span class="ko-score">${m.as}${m.pen === m.a ? '<span class="ko-pen">P</span>' : ''}</span>` : ''}
        </div>
      </div>`;
    });

    html += '</div></div>';
  });

  // Campeão
  html += `<div class="ko-round champion-col">
    <div class="ko-round-label">Campeão</div>
    <div class="ko-matches">
      <div class="champion-box">
        <span class="champion-trophy">🏆</span>
        <div class="champion-label">Campeão</div>
        <div class="champion-name">${getFlag(ko.champion)} ${ko.champion}</div>
      </div>
    </div>
  </div>`;

  html += '</div>';
  el.innerHTML = html;
}
