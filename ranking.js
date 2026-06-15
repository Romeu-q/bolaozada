/* =============================================
   RANKING.JS — Leaderboard do Supabase
   ============================================= */

async function loadRanking() {
  const el = document.getElementById('rankingList');
  if (!el) return;
  el.innerHTML = '<div class="loading-state"><div class="spinner"></div> Carregando ranking...</div>';

  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, score, correct_picks, avatar_url')
    .order('score', { ascending: false })
    .limit(50);

  if (error || !data?.length) {
    // Fallback para demo
    renderRankingFallback(el);
    return;
  }

  renderRankingData(el, data);
}

function renderRankingData(el, users) {
  const medals = ['🥇','🥈','🥉'];
  let html = '<div class="ranking-card">';

  users.forEach((u, i) => {
    const isMe = currentUser && u.id === currentUser.id;
    const pts = u.score || 0;
    const correct = u.correct_picks || 0;
    const av = initials(u.name || u.email || '?');
    const pos = medals[i] || (i + 1);

    html += `<div class="ranking-row${isMe ? ' is-me' : ''}">
      <div class="rank-pos">${pos}</div>
      <div class="rank-avatar">${av}</div>
      <div class="rank-info">
        <div class="rank-name">
          ${u.name || u.email?.split('@')[0] || 'Usuário'}
          ${isMe ? '<span class="rank-you">Você</span>' : ''}
        </div>
        <div class="rank-sub">${correct} acerto${correct !== 1 ? 's' : ''}</div>
      </div>
      <div class="rank-pts">${pts}<span class="rank-pts-label">pts</span></div>
    </div>`;
  });

  html += '</div>';
  el.innerHTML = html;
}

function renderRankingFallback(el) {
  const demo = [
    {id:'1',name:'Pedro Alves',score:120,correct_picks:12},
    {id:'2',name:'Maria Costa',score:100,correct_picks:10},
    {id:'3',name:'João Silva',score:90,correct_picks:9},
    {id:'4',name:'Lucas Mendes',score:80,correct_picks:8},
    {id:'5',name:'Ana Ferreira',score:70,correct_picks:7},
    {id:'6',name:'Carlos Souza',score:60,correct_picks:6},
    {id:'7',name:'Beatriz Lima',score:50,correct_picks:5},
    {id:'8',name:'Rafael Santos',score:40,correct_picks:4},
    {id:'9',name:'Camila Oliveira',score:30,correct_picks:3},
    {id:'10',name:'Diego Rocha',score:20,correct_picks:2},
  ];
  // Injeta o usuário atual
  if (currentUser && currentProfile) {
    const myScore = parseInt(document.getElementById('statPts')?.textContent || '0');
    demo.splice(2, 0, {
      id: currentUser.id,
      name: currentProfile.name || 'Você',
      score: myScore,
      correct_picks: Math.floor(myScore / 10)
    });
    demo.sort((a, b) => b.score - a.score);
  }
  renderRankingData(el, demo);
}
