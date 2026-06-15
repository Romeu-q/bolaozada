/* =============================================
   AUTH.JS — Login, Register, Google, CPF
   ============================================= */

// Redireciona se já logado
supabase.auth.getSession().then(({ data }) => {
  if (data.session) {
    window.location.href = 'app.html';
  }
});

// Escuta mudança de sessão (callback do Google)
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session) {
    window.location.href = 'app.html';
  }
});

// ---- TABS ----
function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.getElementById('formLogin').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('formRegister').style.display = tab === 'register' ? 'block' : 'none';
}

// ---- LOGIN com email ----
async function doEmailLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPass').value;
  const errEl = document.getElementById('loginError');
  const btn = document.getElementById('btnLogin');

  clearError('loginError');
  if (!email || !pass) { showError('loginError', 'Preencha e-mail e senha.'); return; }

  btn.disabled = true;
  btn.querySelector('span').textContent = 'Entrando...';

  const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
  if (error) {
    showError('loginError', traduceErro(error.message));
    btn.disabled = false;
    btn.querySelector('span').textContent = 'Entrar';
  }
  // Se ok, onAuthStateChange cuida do redirect
}

// ---- CADASTRO com email ----
async function doEmailRegister() {
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const pass = document.getElementById('regPass').value;
  const errEl = document.getElementById('registerError');
  const btn = document.getElementById('btnRegister');

  clearError('registerError');
  if (!name || !email || !pass) { showError('registerError', 'Preencha todos os campos.'); return; }
  if (pass.length < 8) { showError('registerError', 'Senha deve ter pelo menos 8 caracteres.'); return; }

  btn.disabled = true;
  btn.querySelector('span').textContent = 'Criando conta...';

  const { data, error } = await supabase.auth.signUp({
    email,
    password: pass,
    options: { data: { name } }
  });

  if (error) {
    showError('registerError', traduceErro(error.message));
    btn.disabled = false;
    btn.querySelector('span').textContent = 'Criar conta';
    return;
  }

  // Salva perfil na tabela 'profiles'
  if (data.user) {
    await supabase.from('profiles').upsert({
      id: data.user.id,
      name,
      email,
      created_at: new Date().toISOString()
    });
  }

  // Se email confirmation está ativa no Supabase, avisamos
  if (data.session) {
    window.location.href = 'app.html';
  } else {
    showToast('Verifique seu e-mail para confirmar a conta! 📧', 'info');
    btn.disabled = false;
    btn.querySelector('span').textContent = 'Criar conta';
  }
}

// ---- GOOGLE ----
async function doGoogleLogin() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + '/app.html'
    }
  });
  if (error) showToast('Erro ao entrar com Google: ' + error.message, 'error');
}

// ---- CPF MODAL ----
function showCpfModal() {
  document.getElementById('cpfModal').classList.add('open');
  document.getElementById('cpfInput').focus();
}
function hideCpfModal(e) {
  if (!e || e.target === document.getElementById('cpfModal')) {
    document.getElementById('cpfModal').classList.remove('open');
  }
}

function maskCPF(el) {
  let v = el.value.replace(/\D/g, '').slice(0, 11);
  if (v.length > 9) v = v.slice(0,3)+'.'+v.slice(3,6)+'.'+v.slice(6,9)+'-'+v.slice(9);
  else if (v.length > 6) v = v.slice(0,3)+'.'+v.slice(3,6)+'.'+v.slice(6);
  else if (v.length > 3) v = v.slice(0,3)+'.'+v.slice(3);
  el.value = v;
}

async function doCpfLogin() {
  const cpf = document.getElementById('cpfInput').value.replace(/\D/g, '');
  const pass = document.getElementById('cpfPass').value;
  clearError('cpfError');

  if (cpf.length !== 11) { showError('cpfError', 'CPF inválido.'); return; }
  if (!pass) { showError('cpfError', 'Informe a senha.'); return; }

  // CPF login: usamos CPF como prefixo de email (convenção interna)
  const email = cpf + '@cpf.bolao2026.app';
  const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
  if (error) {
    // Tenta criar conta com CPF se não existir
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email,
      password: pass,
      options: { data: { name: 'Usuário ' + cpf.slice(0,3) + '***', cpf } }
    });
    if (signUpErr) {
      showError('cpfError', 'CPF ou senha incorretos.');
    } else if (signUpData?.session) {
      window.location.href = 'app.html';
    }
  }
  // Se ok, onAuthStateChange cuida do redirect
}

// ---- HELPERS ----
function showError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
}
function clearError(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

function traduceErro(msg) {
  const map = {
    'Invalid login credentials': 'E-mail ou senha incorretos.',
    'Email not confirmed': 'Confirme seu e-mail antes de entrar.',
    'User already registered': 'Este e-mail já está cadastrado.',
    'Password should be at least 6 characters': 'Senha muito curta.',
  };
  return map[msg] || msg;
}

// Pressionar Enter nos inputs
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const active = document.querySelector('.auth-form:not([style*="none"])');
  if (!active) return;
  if (document.getElementById('formLogin') === active) doEmailLogin();
  else doEmailRegister();
});
