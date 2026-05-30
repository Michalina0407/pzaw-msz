const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./baza.db');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      login TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      isAdmin INTEGER DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      userId INTEGER NOT NULL,
      FOREIGN KEY(userId) REFERENCES users(id)
    )
  `);
});

module.exports = db;