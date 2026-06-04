const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const argon2 = require('argon2');
const db = require('./database');
const crypto = require('crypto');
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');


const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cookieParser());

app.use(
  session({
    secret: 'zmien_to_na_env',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 600000,
      httpOnly: true,
      sameSite: 'strict'
    }
  })
);

app.use(generateCsrf);

app.use('/', authRoutes);
app.use('/', postRoutes);



// xss
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

//ciastka
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
      <div id="cookie-banner" class="cookie-banner">
        Ta strona używa ciasteczek do zapamiętywania Twojego motywu.

        <button onclick="
          document.getElementById('cookie-banner').style.display='none';
          document.cookie='cookies=ok; path=/';
        " style="cursor:pointer">
          Rozumiem
        </button>
      </div>
    `}
  </body>
  </html>
  `;
}

//zabezpieczenie
function generateCsrf(req, res, next) {
  if (!req.session.csrf) {
    req.session.csrf = crypto.randomBytes(24).toString('hex');
  }
  next();
}

// glowna
app.get('/', (req, res) => {
  const theme = req.cookies.theme || 'light-mode';

  let html = `<h1>Tablica ogłoszeń</h1><nav>`;

  html += `<a href="/all">Ogłoszenia</a> | `;
  html += `<a href="/toggle-theme">Zmień tryb</a><br><br>`;

  if (req.session.userId) {
    html += `Witaj <b>${escapeHtml(req.session.userLogin)}</b><br>`;
    html += `<a href="/profile">Profil</a> | <a href="/logout">Wyloguj</a>`;
  } else {
    html += `<a href="/login">Login</a> | <a href="/register">Rejestracja</a>`;
  }

  html += `</nav>`;

  res.send(layout(html, theme, req.cookies.cookies === 'ok'));
});
 

//czarne biale
app.get('/toggle-theme', (req, res) => {
  const current = req.cookies.theme || 'light-mode';
  const next = current === 'light-mode' ? 'dark-mode' : 'light-mode';

  res.cookie('theme', next, { maxAge: 365 * 24 * 60 * 60 * 1000 });

  res.redirect('/');
});

app.listen(8000, () =>
  console.log('Serwer stoi http://localhost:8000')
);