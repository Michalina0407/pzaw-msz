const express = require('express');
const router = express.Router();
const db = require('../database');
const argon2 = require('argon2');

router.use((req, res, next) => {
  if (!req.session) return next();

  if (!req.session.csrf) {
    req.session.csrf = Math.random().toString(36).substring(2);
  }

  next();
});

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function layout(content, theme = 'light-mode', cookiesOk = false) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <link rel="stylesheet" href="/style.css">
    <title>Tablica Ogłoszeń</title>
  </head>
  <body class="${theme}">
    <div class="container">
      ${content}
    </div>

    ${cookiesOk ? '' : `
      <div id="cookie-banner" style="position:fixed; bottom:0; width:100%; background:#333; color:white; padding:10px; text-align:center; font-size:12px;">
        Ta strona używa ciasteczek do zapamiętywania Twojego motywu.

        <button onclick="
          document.getElementById('cookie-banner').style.display='none';
          document.cookie='cookies=ok; path=/';
        ">
          Rozumiem
        </button>
      </div>
    `}
  </body>
  </html>
  `;
}

// rejestracja
router.get('/register', (req, res) => {
  const theme = req.cookies.theme || 'light-mode';

  res.send(layout(`
    <h2>Rejestracja</h2>

    <form method="POST">
      <input name="login" placeholder="Login" required><br>
      <input name="password" type="password" placeholder="Hasło" required><br>
      <input name="confirm" type="password" placeholder="Powtórz hasło" required><br>
      <button>Rejestruj</button>
    </form>
  `, theme, req.cookies.cookies === 'ok'));
});

router.post('/register', async (req, res) => {
  const { login, password, confirm } = req.body;

  if (password !== confirm) {
    return res.send("Hasła nie są identyczne");
  }

  const hash = await argon2.hash(password);

  db.run(
    `INSERT INTO users (login, password) VALUES (?, ?)`,
    [login, hash],
    function (err) {
      if (err) {
        return res.send(layout(`
          <div class="error">
            Login jest już zajęty
          </div>
          <a href="/register">Wróć</a>
        `, req.cookies.theme || 'light-mode', req.cookies.cookies === 'ok'));
      }

        req.session.userId = this.lastID;
        req.session.userLogin = login;
        req.session.isAdmin = 0;

        res.redirect('/profile');
    }
  );
});


//zaloguj
router.get('/login', (req, res) => {
  const theme = req.cookies.theme || 'light-mode';

  res.send(layout(`
    <h2>Login</h2>

    <form method="POST">
      <input name="login" required placeholder="Login">
      <input name="password" type="password" required placeholder="Hasło">
      <button>Zaloguj</button>
    </form>

    <p>
      Nie masz konta?
      <a href="/register">Zarejestruj się tutaj</a>
    </p>
  `, theme, req.cookies.cookies === 'ok'));
});

router.post('/login', (req, res) => {
  const { login, password } = req.body;

  db.get(`SELECT * FROM users WHERE login = ?`, [login], async (err, user) => {
    if (err) return res.send("DB error");

    if (!user) {
      return res.send(layout(`
        <h2>Nie ma takiego użytkownika</h2>
        <a href="/login">Wróć</a>
      `));
    }

    const ok = await argon2.verify(user.password, password);

    if (!ok) {
      return res.send(layout(`
        <h2>Błędne hasło</h2>
        <a href="/login">Wróć</a>
      `));
    }

    // 🔥 SESJA
    req.session.userId = user.id;
    req.session.userLogin = user.login;
    req.session.isAdmin = user.isAdmin || 0;

    console.log("LOGGED IN SESSION:", req.session);

    return res.redirect('/profile');
  });
});

// konto
router.get('/profile', (req, res) => {
  if (!req.session.userId) return res.redirect('/login');

  const theme = req.cookies.theme || 'light-mode';

  db.get(
    `SELECT * FROM users WHERE id = ?`,
    [req.session.userId],
    (err, user) => {
      if (!user) return res.redirect('/login');

      res.send(layout(`
        <h2>Profil</h2>

        <p>Login: <b>${escapeHtml(user.login)}</b></p>
        <p>ID: ${user.id}</p>
        <p>Rola: ${user.isAdmin ? 'Admin' : 'Użytkownik'}</p>

        <hr>
        <a href="/all">Ogłoszenia</a> |
        <a href="/">Strona główna</a>
      `, theme, req.cookies.cookies === 'ok'));
    }
  );
});


//wylog
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

module.exports = router;