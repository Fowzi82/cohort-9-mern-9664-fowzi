const pool = require('../config/db');

async function createUser(username, email, hashedPassword) {
  const [result] = await pool.execute(
    'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
    [username, email, hashedPassword]
  );

  return result;
}

async function findUserByEmail(email) {
  const [rows] = await pool.execute(
    'SELECT id, username, email, password FROM users WHERE email = ?',
    [email]
  );

  return rows[0] || null;
}

async function findUserById(id) {
  const [rows] = await pool.execute(
    'SELECT id, username, email FROM users WHERE id = ?',
    [id]
  );

  return rows[0] || null;
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
};