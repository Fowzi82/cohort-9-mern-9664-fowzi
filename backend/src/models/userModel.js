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

async function findUserWithPasswordById(id) {
  const [rows] = await pool.execute(
    'SELECT id, username, email, password FROM users WHERE id = ?',
    [id]
  );

  return rows[0] || null;
}

async function updateUsername(id, username) {
  const [result] = await pool.execute(
    'UPDATE users SET username = ? WHERE id = ?',
    [username, id]
  );

  return result;
}

async function updatePassword(id, hashedPassword) {
  const [result] = await pool.execute(
    'UPDATE users SET password = ? WHERE id = ?',
    [hashedPassword, id]
  );

  return result;
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  findUserWithPasswordById,
  updateUsername,
  updatePassword,
};
