const express = require('express');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const db = require('./database'); 
const cookieParser = require('cookie-parser');

const app = express();

app.use(cookieParser());
app.use(express.urlencoded({ extended: true })); //przyjmuje dane z form
app.use(express.static('public')); //ufa publikowi

//pamieta uzytkownika
app.use(session({
  secret: 'tajne_haslo',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 600000 } //10min
}));

//ekspres dziala z formularzem
app.use(express.urlencoded({ extended: true }));

function layout(content, theme = 'light-mode') { //szablon css
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

        <div id="cookie-banner" style="position:fixed; bottom:0; width:100%; background:#333; color:white; padding:10px; text-align:center; font-size:12px;">
            Ta strona używa ciasteczek do zapamiętywania Twojego motywu. 
            <button onclick="document.getElementById('cookie-banner').style.display='none'" style="cursor:pointer">Rozumiem</button>
        </div>


    </body>
    </html>`;
}

//glowna
app.get('/', (req, res) => {
    const theme = req.cookies.theme || 'light-mode';

  let nawigacja = '<h1>Strona Główna</h1>';
  nawigacja += '<nav>'; //zacznij nawigacje

  nawigacja += '<a href="/all">NAJNOWSZE OGŁOSZENIA</a> <br>';
  nawigacja += '<a href="/toggle-theme">Zmień tryb</a><br><br>';

  if (req.session.userId) {
    nawigacja += `| Witaj <b>${req.session.userLogin}</b>! |<br> `;
    nawigacja += '<a href="/all">Tablica ogłoszeń</a> | ';
    nawigacja += '<a href="/profile">Mój Profil</a> | ';
    nawigacja += '<a href="/add">Dodaj post</a> | ';
    nawigacja += '<a href="/logout">Wyloguj</a>';
  } else {
    nawigacja += '<a href="/login">Logowanie</a> | ';
    nawigacja += '<a href="/register">Rejestracja</a>';
  }

  //zamknij nawigacje
  nawigacja += '</nav>';
  nawigacja += '<p>Witaj w aplikacji! Skorzystaj z menu</p>';


  res.send(layout(nawigacja, theme));
});


//rejestracja wizualnie
app.get('/register', (req, res) => {
    const theme = req.cookies.theme || 'light-mode';
  const nawigacja = `
    <h2>Rejestracja</h2>
    <form action="/register" method="POST">
      <input type="text" name="login" placeholder="Login" required><br>
      <input type="password" name="password" placeholder="Hasło" required><br>
      <button type="submit">Załóż konto</button>
    </form>
    <a href="/">Wróć</a>`;
    res.send(layout(nawigacja, theme));
});

//rejestracja haslo
app.post('/register', async (req, res) => { //async pozwala robicf inne rzeczy
  const { login, password } = req.body;
  const theme = req.cookies.theme || 'light-mode';
  
  //bcrypt dodaje znaki do hasla
  const salt = await bcrypt.genSalt(10);  //await czeka na wynik
  const hashedPassword = await bcrypt.hash(password, salt);

  db.run(`INSERT INTO users (login, password) VALUES (?, ?)`, [login, hashedPassword], function(err) {
    if (err) return res.send("Błąd: Login zajęty!");

    req.session.userId = this.lastID; 
    req.session.userLogin = login;
    req.session.isAdmin = 0;

    const sukcesHtml = `
      <h1>Konto założone!</h1>
      <p>Witaj <b>${login}</b>, od razu Cię zalogowaliśmy.</p>
      <hr>
      <a href="/">Przejdź do strony głównej</a>
    `;
    
    res.send(layout(sukcesHtml, theme));
  });
});

//logowanie wizualne
app.get('/login', (req, res) => {
    const theme = req.cookies.theme || 'light-mode';
  res.send(`
    <html>
    <head><link rel="stylesheet" href="/style.css"></head>
    <body class="${theme}">
        <div class="container">
            <h2>Logowanie</h2>
            <form action="/login" method="POST">
                <input name="login" placeholder="Login" required><br>
                <input name="password" type="password" placeholder="Hasło" required><br>
                <button type="submit">Zaloguj</button>
            </form>
            <p><a href="/">Wróć do strony głównej</a></p>
        </div>
    </body>
    </html>`);
});

//sprawdza haslo
app.post('/login', (req, res) => {
  const { login, password } = req.body;

  //szuka nas w bazie
  db.get(`SELECT * FROM users WHERE login = ?`, [login], async (err, user) => {
    if (err || !user) {
      return res.send("Nie znaleziono użytkownika lub błąd bazy.");
    }

    const match = await bcrypt.compare(password, user.password);

    if (match) {
      //zpisuje dane do sesji
      req.session.userId = user.id;
      req.session.userLogin = user.login;
      req.session.isAdmin = user.isAdmin;
      res.redirect('/profile'); //przekierowywanie
    } else {
      res.send("Błędne hasło");
    }
    });
});

//profil
app.get('/profile', (req, res) => {
    const theme = req.cookies.theme || 'light-mode';
  if (req.session.userId) {
    let html = `<h1>Profil użytkownika</h1>`;
        html += `<p>Jesteś zalogowany jako: <b>${req.session.userLogin}</b></p>`;
        html += `<p>Ranga: ${req.session.isAdmin ? '<span style="color:gold">Admin</span>' : 'Użytkownik'}</p>`;
        html += `<hr>`;
        html += `<nav>
        <a href="/">Strona Główna</a> | 
        <a href="/all">Tablica Ogłoszeń</a> | 
        <a href="/add">Dodaj Post</a> | 
        <a href="/logout" style="color:red">Wyloguj się</a>
      </nav>`;
      res.send(layout(html, theme));
  } else {
    res.send('Musisz się najpierw <a href="/login">zalogować</a>');
  }
});

//wylog
app.get('/logout', (req, res) => {
    const theme = req.cookies.theme || 'light-mode';
  req.session.destroy((err) => {
        if (err) {
            console.log("Błąd przy wylogowywaniu:", err);
        }
        res.clearCookie('connect.sid');
  res.redirect('/');     //powrot na glowna
  res.send(layout(html, theme));
}); 
});


//dodaj
app.get('/add', (req, res) => {
    const theme = req.cookies.theme || 'light-mode';
  if (!req.session.userId) return res.redirect('/login');
  
  res.send(`
    <h2>Dodaj nowe ogłoszenie</h2>
    <form action="/add" method="POST">
      <textarea name="content" placeholder="Treść ogłoszenia..." required></textarea><br>
      <button type="submit">Opublikuj</button>
    </form>
  `, req.cookies.theme);
  res.send(layout(html, theme));
});

//dodaj 
app.post('/add', (req, res) => {
  if (!req.session.userId) return res.status(401).send("Zaloguj się!");

  const content = req.body.content;
  const userId = req.session.userId;

  db.run(`INSERT INTO posts (content, userId) VALUES (?, ?)`, [content, userId], (err) => {
    if (err) return res.send("Błąd bazy");
    res.send("Dodano ogłoszenie! <a href='/profile'>Wróć do profilu</a><a href='/all'>Zobacz ogłoszenia</a>");
  });
});

//alles
app.get('/all', (req, res) => {
    const theme = req.cookies.theme || 'light-mode';
  //wyciaga ogloszenie i laczy z loginem
  const sql = `SELECT posts.id, posts.content, posts.userId, users.login 
    FROM posts JOIN users ON posts.userId = users.id`;

  db.all(sql, [], (err, rows) => {
    if (err) return res.send("Błąd pobierania");

    let html = "<h1>Tablica ogłoszeń</h1>";
      if (req.session.userId) {
      html += "<a href='/add'>+ Dodaj nowe ogłoszenie</a>";
    } else {
      html += "<p><i>Zaloguj się, aby dodać własne ogłoszenie.</i></p>";
    } //+= dokleja tresc
    
    html += "<hr>";
  
        html += "<nav><a href='/'>Strona główna</a> </nav><hr>";
        
        rows.forEach(post => {
            html += `<div class="post">
                <strong>${post.login}:</strong> ${post.content}`;
      //uprawnienia
      if (req.session.userId) {
        const czyToMoje = req.session.userId === post.userId;
        const czyJestemAdminem = req.session.isAdmin === 1;

        if (czyToMoje || czyJestemAdminem) {
          html += `<a href="/edit/${post.id}">[Edytuj]</a> `;
          html += `<a href="/delete/${post.id}" style="color:red">[Usuń]</a>`;
        }
      }
      html += `</div><hr>`;
    });

    html += '<br><a href="/profile">Powrót na profil</a>';
    html += '<br><a href="/">Wróć do strony głównej</a>';
    res.send(`
        <html>
        <head><link rel="stylesheet" href="/style.css"></head>
        <body class="${theme}">
            <div class="container">
                ${html}
            </div>
        </body>
        </html>`);
  });
});

//usuwanie
app.get('/delete/:id', (req, res) => {
    const theme = req.cookies.theme || 'light-mode';
  if (!userId) return res.send("Zaloguj się!");
    
  const postId = req.params.id;//params przyjmuje id(?)
  //zeby nie usuwac cudzych postow chb ze admin
  db.run(`DELETE FROM posts WHERE id = ? AND (userId = ? OR ?)`, [postId, userId, isAdmin], (err) => {
    if (err) return res.send("Błąd usuwania");
    res.redirect('/all');
    res.send(layout(html, theme));
  });
});


//edycja na stronie
app.get('/edit/:id', (req, res) => {
    const theme = req.cookies.theme || 'light-mode';
  const postId = req.params.id;
  db.get(`SELECT * FROM posts WHERE id = ?`, [postId], (err, post) => {
    if (!post) return res.send("Nie ma takiego posta");
    
    //czy moze
    if (post.userId !== req.session.userId && !req.session.isAdmin) {
      return res.send("Nie masz uprawnień!");
    }

    res.send(`
      <h2>Edytuj ogłoszenie</h2>
      <form action="/edit/${post.id}" method="POST">
        <textarea name="content">${post.content}</textarea><br>
        <button type="submit">Zapisz zmiany</button>
      </form>
    `);
    res.send(layout(html, theme));
  });
});


//edycja w bazie
app.post('/edit/:id', (req, res) => {
  const postId = req.params.id;
  const newContent = req.body.content;
  const userId = req.session.userId;
  const isAdmin = req.session.isAdmin;

  db.run(`UPDATE posts SET content = ? WHERE id = ? AND (userId = ? OR ?)`, 
    [newContent, postId, userId, isAdmin], (err) => {
    if (err) return res.send("Błąd zapisu");
    res.redirect('/all');
  });
});


//kolorki
app.get('/toggle-theme', (req, res) => {
    const current = req.cookies.theme || 'light-mode';
    const next = current === 'light-mode' ? 'dark-mode' : 'light-mode';
    res.cookie('theme', next, { maxAge: 365 * 24 * 60 * 60 * 1000, httpOnly: true }); //rok

    //wroc skad przyszedles
    const backURL = req.header('Referer') || '/';
    res.redirect(backURL); 
});


//testowe
app.get('/populate', async (req, res) => {
  const salt = await bcrypt.hash('haslo123', 10);
  db.run(`INSERT OR IGNORE INTO users (login, password, isAdmin) VALUES ('admin', '${salt}', 1)`);
  db.run(`INSERT OR IGNORE INTO users (login, password, isAdmin) VALUES ('user1', '${salt}', 0)`, function() {
      db.run(`INSERT INTO posts (content, userId) VALUES ('Co ja tu robie!', 1)`);
      db.run(`INSERT INTO posts (content, userId) VALUES ('Zgubił mi się dziadek.', 2)`);
      res.send("<h1>Baza wypełniona!</h1><p>Admin: admin / haslo123</p><p>User: user1 / haslo123</p><a href='/'>Wróć</a>");
  });
});



app.listen(8000, () => console.log('Działa na http://localhost:8000'));