
const express = require('express');
const router = express.Router();
const db = require('../database');

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

//dodaj ogloszenei
router.get('/add', (req, res) => {
  if (!req.session.userId) return res.redirect('/login');

  const theme = req.cookies.theme || 'light-mode';

  res.send(layout(`
    <h2>Dodaj ogłoszenie</h2>

    <form method="POST">
      <textarea name="content" required placeholder="Treść ogłoszenia..."></textarea><br>
      <input type="hidden" name="csrf" value="${req.session.csrf}">
      <button>Dodaj</button>
    </form>

    <br>
    <a href="/all">Wróć do ogłoszeń</a>
  `, theme, req.cookies.cookies === 'ok'));
});

router.post('/add', (req, res) => {
  if (!req.session.userId) return res.redirect('/login');

  if (req.body.csrf !== req.session.csrf) {
  return res.status(403).send("CSRF blocked");
}

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


// wszystkie posty
router.get('/all', (req, res) => {
  const theme = req.cookies.theme || 'light-mode';

  const userId = req.session?.userId;
  const isAdmin = req.session?.isAdmin;

  db.all(
    `SELECT posts.*, users.login FROM posts JOIN users ON posts.userId = users.id`,
    [],
    (err, rows) => {

      let html = `<h1>Tablica ogłoszeń</h1>
        <a href="/">Strona główna</a>
        <a href="/add">Dodaj</a><hr>`;

      rows.forEach(p => {

        const canEdit = userId === p.userId || isAdmin;

        html += `
          <div class="post">
            <b>${escapeHtml(p.login)}</b>: ${escapeHtml(p.content)}
        `;

        if (canEdit) {
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
router.get('/delete/:id', (req, res) => {
  const id = req.params.id;

  db.run(
    `DELETE FROM posts WHERE id = ? AND (userId = ? OR ? = 1)`,
    [id, req.session.userId, req.session.isAdmin],
    () => res.redirect('/all')
  );
});



//edycja
router.get('/edit/:id', (req, res) => {
  const theme = req.cookies.theme || 'light-mode';

  db.get(
    `SELECT * FROM posts WHERE id = ?`,
    [req.params.id],
    (err, post) => {
      if (!post) return res.send("Brak posta");

      if (post.userId !== req.session.userId && !req.session.isAdmin) {
        return res.send(layout(`<h2>Brak uprawnień</h2>
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
router.post('/edit/:id', (req, res) => {
  if (!req.session.userId) return res.redirect('/login');

  db.run(
    `UPDATE posts SET content = ? WHERE id = ? AND (userId = ? OR ? = 1)`,
    [
      req.body.content,
      req.params.id,
      req.session.userId,
      req.session.isAdmin ? 1 : 0
    ],
    function () {
      console.log("CHANGED ROWS:", this.changes);

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

module.exports = router;