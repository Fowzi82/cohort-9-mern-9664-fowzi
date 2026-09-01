const pool = require('../config/db');

async function createNote(userId, title, content) {
  const [result] = await pool.execute(
    'INSERT INTO notes (user_id, title, content) VALUES (?, ?, ?)',
    [userId, title, content]
  );

  return result;
}

async function getNotesByUserId(userId) {
  const [rows] = await pool.execute(
    'SELECT id, user_id, title, content FROM notes WHERE user_id = ? ORDER BY id DESC',
    [userId]
  );

  return rows;
}

async function getNoteById(id, userId) {
  const [rows] = await pool.execute(
    'SELECT id, user_id, title, content FROM notes WHERE id = ? AND user_id = ?',
    [id, userId]
  );

  return rows[0] || null;
}

async function updateNote(id, userId, title, content) {
  const [result] = await pool.execute(
    'UPDATE notes SET title = ?, content = ? WHERE id = ? AND user_id = ?',
    [title, content, id, userId]
  );

  return result;
}

async function deleteNote(id, userId) {
  const [result] = await pool.execute(
    'DELETE FROM notes WHERE id = ? AND user_id = ?',
    [id, userId]
  );

  return result;
}

module.exports = {
  createNote,
  getNotesByUserId,
  getNoteById,
  updateNote,
  deleteNote,
};