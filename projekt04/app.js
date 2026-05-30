const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const argon2 = require('argon2');
const db = require('./database');


const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cookieParser());

app.use(
  session({
    secret: 'zmien_to_na_env',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 600000 }
  })
);

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
      <div id="cookie-banner" style="position:fixed; bottom:0; width:100%; background:#333; color:white; padding:10px; text-align:center; font-size:12px;">
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

// glowna
app.get('/', (req, res) => {
  const theme = req.cookies.theme || 'light-mode';

  let html = `<h1>Strona główna</h1><nav>`;

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

// rejestracja
app.get('/register', (req, res) => {
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

app.post('/register', async (req, res) => {
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
        `));
      }

      req.session.regenerate(() => {
        req.session.userId = this.lastID;
        req.session.userLogin = login;
        req.session.isAdmin = 0;

        res.redirect('/profile');
      });
    }
  );
});

//zaloguj
app.get('/login', (req, res) => {
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

app.post('/login', (req, res) => {
  const { login, password } = req.body;

  db.get(`SELECT * FROM users WHERE login = ?`, [login], async (err, user) => {
    if (!user) {
      return res.send(layout(`
        <h2>Ten użytkownik nie istnieje.</h2>
        <p>Nie masz konta?</p>
        <a href="/register">Zarejestruj się tutaj</a>
      `, 'light-mode', req.cookies.cookies === 'ok'));
    }

    const ok = await argon2.verify(user.password, password);

    if (!ok) return res.send("Błędne hasło");

    req.session.regenerate(() => {
      req.session.userId = user.id;
      req.session.userLogin = user.login;
      req.session.isAdmin = user.isAdmin;

      res.redirect('/profile');
    });
  });
});

// konto
app.get('/profile', (req, res) => {
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

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

//dodaj ogloszenei
app.get('/add', (req, res) => {
  if (!req.session.userId) return res.redirect('/login');

  const theme = req.cookies.theme || 'light-mode';

  res.send(layout(`
    <h2>Dodaj ogłoszenie</h2>

    <form method="POST">
      <textarea name="content" required placeholder="Treść ogłoszenia..."></textarea><br>
      <button>Dodaj</button>
    </form>

    <br>
    <a href="/all">Wróć do ogłoszeń</a>
  `, theme, req.cookies.cookies === 'ok'));
});

app.post('/add', (req, res) => {
  if (!req.session.userId) return res.redirect('/login');

  db.run(
    `INSERT INTO posts (content, userId) VALUES (?, ?)`,
    [req.body.content, req.session.userId],
    () => {
      res.send(layout(`
        <h2>Ogłoszenie dodane</h2>

        <p>Twój post został opublikowany.</p>

        <a href="/all">Zobacz ogłoszenia</a><br>
        <a href="/add">Dodaj kolejne</a><br>
        <a href="/">Strona główna</a>
      `, req.cookies.theme || 'light-mode', req.cookies.cookies === 'ok'));
    }
  );
});



// posty
app.get('/all', (req, res) => {
  const theme = req.cookies.theme || 'light-mode';

  db.all(
    `SELECT posts.*, users.login
     FROM posts JOIN users ON posts.userId = users.id`,
    [],
    (err, rows) => {
      let html = `<h1>Tablica ogłoszeń</h1>
        <a href="/">Strona główna</a>
        <a href="/add">Dodaj</a>
        <hr>`;

      rows.forEach(p => {
        html += `
          <div class="post">
            <b>${escapeHtml(p.login)}</b>: ${escapeHtml(p.content)}
        `;

        if (req.session.userId === p.userId || req.session.isAdmin) {
          html += `
            <a href="/delete/${p.id}">Usuń</a>
            <a href="/edit/${p.id}">Edytuj</a>
          `;
        }

        html += `</div><hr>`;
      });

      res.send(layout(html, theme, req.cookies.cookies === 'ok'));
    }
  );
});

//usun
app.get('/delete/:id', (req, res) => {
  const id = req.params.id;

  db.run(
    `DELETE FROM posts WHERE id = ? AND (userId = ? OR ? = 1)`,
    [id, req.session.userId, req.session.isAdmin],
    () => res.redirect('/all')
  );
});

//edycja
app.get('/edit/:id', (req, res) => {
  const theme = req.cookies.theme || 'light-mode';

  db.get(
    `SELECT * FROM posts WHERE id = ?`,
    [req.params.id],
    (err, post) => {
      if (!post) return res.send("Brak posta");

      if (post.userId !== req.session.userId && !req.session.isAdmin) {
        return res.send(layout(`
          <h2>Brak uprawnień</h2>
          <a href="/all">Wróć</a>
        `, theme, req.cookies.cookies === 'ok'));
      }

      res.send(layout(`
        <h2>Edytuj ogłoszenie</h2>

        <form method="POST">
          <textarea name="content" required>${escapeHtml(post.content)}</textarea><br>
          <button>Zapisz zmiany</button>
        </form>

        <br>
        <a href="/all">Wróć</a>
      `, theme, req.cookies.cookies === 'ok'));
    }
  );
});
//admin szpont
app.post('/edit/:id', (req, res) => {
  if (!req.session.userId) return res.redirect('/login');

  db.run(
    `UPDATE posts SET content = ? WHERE id = ?`,
    [req.body.content, req.params.id],
    () => {
      res.send(layout(`
        <h2 style="color:green">Post zmieniony</h2>

        <p>
          ${req.session.isAdmin
            ? "Admin ingerował w treść posta"
            : "Twoje zmiany zostały zapisane"}
        </p>

        <a href="/all">Wróć do ogłoszeń</a>
      `, req.cookies.theme || 'light-mode', req.cookies.cookies === 'ok'));
    }
  );
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