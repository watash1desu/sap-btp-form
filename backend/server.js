const express = require("express");
const path = require("path");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const Database = require("better-sqlite3");

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "..")));

// opens (or creates) a file called users.db in this same folder
const db = new Database("users.db");

// creates the users table, only if it doesn't already exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
  )
`);

// POST /signup
app.post("/signup", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
  if (existing) {
    return res.status(409).json({ error: "Username already taken." });
  }

  //hashing using bcrypt
  const passwordHash = bcrypt.hashSync(password, 10);

  db.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)").run(username, passwordHash);

  res.status(201).json({ message: "Account created", username });
});

// POST /login
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
  if (!user) {
    return res.status(401).json({ error: "Invalid username or password." });
  }

  // compare
  const passwordMatches = bcrypt.compareSync(password, user.password_hash);
  if (!passwordMatches) {
    return res.status(401).json({ error: "Invalid username or password." });
  }

  res.status(200).json({ message: "Login successful", username: user.username });
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
  console.log(`Frontend available at http://localhost:${PORT}/requestor.html`);
});
