const pool = require('../config/db');

async function createNote(userId, title, content) {
  try {
    const [result] = await pool.execute(
      'INSERT INTO notes (user_id, title, content) VALUES (?, ?, ?)',
      [userId, title, content]
    );
    return result;
  } catch (err) {
    const error = new Error('Failed to create note');
    error.status = 500;
    error.cause = err;
    throw error;
  }
}

async function getNotesByUserId(userId) {
  try {
    const [rows] = await pool.execute(
      'SELECT id, user_id, title, content FROM notes WHERE user_id = ? ORDER BY id DESC',
      [userId]
    );
    return rows;
  } catch (err) {
    const error = new Error('Failed to fetch notes');
    error.status = 500;
    error.cause = err;
    throw error;
  }
}

async function getNoteById(id, userId) {
  try {
    const [rows] = await pool.execute(
      'SELECT id, user_id, title, content FROM notes WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return rows[0] || null;
  } catch (err) {
    const error = new Error('Failed to fetch note');
    error.status = 500;
    error.cause = err;
    throw error;
  }
}

async function updateNote(id, userId, title, content) {
  try {
    const [result] = await pool.execute(
      'UPDATE notes SET title = ?, content = ? WHERE id = ? AND user_id = ?',
      [title, content, id, userId]
    );
    return result;
  } catch (err) {
    const error = new Error('Failed to update note');
    error.status = 500;
    error.cause = err;
    throw error;
  }
}

async function deleteNote(id, userId) {
  try {
    const [result] = await pool.execute(
      'DELETE FROM notes WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result;
  } catch (err) {
    const error = new Error('Failed to delete note');
    error.status = 500;
    error.cause = err;
    throw error;
  }
}

module.exports = {
  createNote,
  getNotesByUserId,
  getNoteById,
  updateNote,
  deleteNote,
};