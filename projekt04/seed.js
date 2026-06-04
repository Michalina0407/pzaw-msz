const db = require('./database');
const argon2 = require('argon2');

async function seed() {
  const hash = await argon2.hash('haslo123');

  db.serialize(() => {

    db.run(`DROP TABLE IF EXISTS posts`);
    db.run(`DROP TABLE IF EXISTS users`);

    db.run(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        login TEXT UNIQUE,
        password TEXT,
        isAdmin INTEGER DEFAULT 0
      )
    `);

    db.run(`
      CREATE TABLE posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT,
        userId INTEGER
      )
    `);

    db.run(
      `INSERT INTO users (login, password, isAdmin) VALUES (?, ?, ?)`,
      ['admin', hash, 1],
      function () {
        const adminId = this.lastID;

        db.run(
          `INSERT INTO users (login, password, isAdmin) VALUES (?, ?, ?)`,
          ['user1', hash, 0],
          function () {
            const userId = this.lastID;

            db.run(
              `INSERT INTO posts (content, userId) VALUES (?, ?)`,
              ['Co ja tu robie!', adminId]
            );

            db.run(
              `INSERT INTO posts (content, userId) VALUES (?, ?)`,
              ['Zgubił mi się dziadek.', userId]
            );

            console.log("Baza gotowa");
          }
        );
      }
    );
  });
}

seed();