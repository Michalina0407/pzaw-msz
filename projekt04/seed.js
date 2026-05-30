const db = require('./database');
const argon2 = require('argon2');

async function seed() {
  const hash = await argon2.hash('haslo123');

  db.run(
    `INSERT OR IGNORE INTO users (login, password, isAdmin)
     VALUES ('admin', ?, 1)`,
    [hash]
  );

  db.run(
    `INSERT OR IGNORE INTO users (login, password, isAdmin)
     VALUES ('user1', ?, 0)`,
    [hash]
  );

  db.serialize(() => {
    db.run(`INSERT INTO posts (content, userId) VALUES ('Co ja tu robie!', 1)`);
    db.run(`INSERT INTO posts (content, userId) VALUES ('Zgubił mi się dziadek.', 2)`);
  });

  console.log("Baza gotowa");
}

seed();