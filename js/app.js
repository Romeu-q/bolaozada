/* =============================================
   APP.JS — Session, Dark Mode, Navigation
   ============================================= */

let currentUser = null;
let currentProfile = null;

// ---- INIT ----
(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = 'index.html';
    return;
  }
  currentUser = session.user;
  await loadProfile();
  initDarkMode();
  initUserMenu();

  // Carrega a página inicial
  loadBrackets();
})();

supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') window.location.href = 'index.html';
  if (event === 'SIGNED_IN' && session) {
    currentUser = session.user;
  }
});

// ---- PROFILE ----
async function loadProfile() {
  if (!currentUser) return;

  // Tenta pegar da tabela profiles
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', currentUser.id)
    .single();

  if (data) {
    currentProfile = data;
  } else {
    // Cria perfil se não existe (login Google, etc.)
    const name = currentUser.user_metadata?.name
      || currentUser.user_metadata?.full_name
      || currentUser.email?.split('@')[0]
      || 'Usuário';
    const newProfile = {
      id: currentUser.id,
      name,
      email: currentUser.email,
      avatar_url: currentUser.user_metadata?.avatar_url || null,
      created_at: new Date().toISOString()
    };
    await supabase.from('profiles').upsert(newProfile);
    currentProfile = newProfile;
  }
}

// ---- USER MENU ----
function initUserMenu() {
  const name = currentProfile?.name || 'Usuário';
  const email = currentProfile?.email || currentUser?.email || '';

  document.getElementById('userAvatar').textContent = initials(name);
  document.getElementById('dropdownName').textContent = name;
  document.getElementById('dropdownEmail').textContent = email;

  document.getElementById('userAvatar').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('userDropdown').classList.toggle('open');
  });
  document.addEventListener('click', () => {
    document.getElementById('userDropdown').classList.remove('open');
  });
}

async function doLogout() {
  await supabase.auth.signOut();
  window.location.href = 'index.html';
}

// ---- DARK MODE ----
function initDarkMode() {
  const saved = localStorage.getItem('bolao_dark');
  if (saved === 'true') applyDark(true);
}

function toggleDarkMode() {
  const isDark = document.body.classList.contains('dark');
  applyDark(!isDark);
}

function applyDark(on) {
  document.body.classList.toggle('dark', on);
  localStorage.setItem('bolao_dark', on);
  document.getElementById('darkIcon').textContent = on ? '☀️' : '🌙';
  document.getElementById('darkLabel').textContent = on ? 'Claro' : 'Escuro';
}

// ---- NAVIGATION ----
function switchPage(id, btn) {
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('page-' + id).classList.add('active');

  // Carrega sob demanda
  if (id === 'pickem') loadPickem();
  if (id === 'ranking') loadRanking();
}
