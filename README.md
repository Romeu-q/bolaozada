# 🏆 Bolão Copa 2026

App de Pick'em da Copa do Mundo — pronto para deploy no Vercel.

## Stack
- **Frontend**: HTML + CSS + JS vanilla (zero build step)
- **Auth + DB**: Supabase (auth, RLS, realtime)
- **API de Jogos**: football-data.org
- **Deploy**: Vercel (arrastar a pasta = pronto)

---

## Deploy em 5 passos

### 1. Crie o banco no Supabase
1. Acesse [supabase.com](https://supabase.com) → New Project
2. Vá em **SQL Editor** e cole o conteúdo de `supabase/schema.sql`
3. Execute (▶ Run)
4. Copie sua **Project URL** e **anon public key** em Settings > API

### 2. Configure as chaves
Abra `js/config.js` e substitua:
```js
const SUPABASE_URL = 'https://SEU_PROJETO.supabase.co';
const SUPABASE_ANON_KEY = 'SUA_CHAVE_ANON_AQUI';
```

### 3. (Opcional) Configure login com Google
No Supabase:
- Authentication > Providers > Google > Enable
- Crie um projeto no [Google Cloud Console](https://console.cloud.google.com)
- Authorized redirect URI: `https://SEU_PROJETO.supabase.co/auth/v1/callback`
- Cole Client ID e Secret no Supabase

### 4. Deploy no Vercel
**Opção A — Arrastar e soltar:**
1. Acesse [vercel.com](https://vercel.com) → New Project
2. Arraste a pasta `bolao-copa` inteira
3. Clique Deploy → Pronto! ✅

**Opção B — GitHub (recomendado para updates):**
```bash
git init
git add .
git commit -m "Bolão Copa 2026"
git remote add origin https://github.com/SEU_USER/bolao-copa.git
git push -u origin main
```
Depois conecte o repo no Vercel.

### 5. Configure redirect URL no Supabase
- Authentication > URL Configuration
- Site URL: `https://seu-projeto.vercel.app`
- Redirect URLs: `https://seu-projeto.vercel.app/app.html`

---

## Estrutura de arquivos
```
bolao-copa/
├── index.html          # Tela de login/cadastro
├── app.html            # App principal (brackets, pick'em, ranking)
├── vercel.json         # Config de rotas do Vercel
├── css/
│   ├── global.css      # Design tokens, reset, componentes globais
│   ├── auth.css        # Estilos da tela de auth
│   └── app.css         # Estilos do app (topbar, nav, páginas)
├── js/
│   ├── config.js       # Chaves de API, helpers, flags
│   ├── auth.js         # Login, cadastro, Google, CPF
│   ├── app.js          # Sessão, modo escuro, navegação
│   ├── brackets.js     # Grupos + mata-mata (API football-data)
│   ├── pickem.js       # Palpites (salva no Supabase)
│   └── ranking.js      # Leaderboard (lê do Supabase)
└── supabase/
    └── schema.sql      # SQL para criar as tabelas
```

## Sistema de pontuação
| Evento | Pontos |
|--------|--------|
| Acertar vencedor de jogo | 10 pts |

A pontuação é calculada automaticamente ao salvar palpites e após jogos encerrarem.

## APIs usadas
- **football-data.org** — jogos, grupos, resultados (token no `config.js`)
- **footballdata.io** — dados complementares (usar com moderação)
- **Supabase** — autenticação + banco de dados dos palpites

---

## Modo escuro
Ativado via botão na topbar. Preferência salva no localStorage.

## Responsivo
Funciona em mobile, tablet e desktop.
