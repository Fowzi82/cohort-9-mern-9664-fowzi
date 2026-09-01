const pool = require('../config/db');

/**
 * @typedef {Object} NoteRow
 * @property {number} id
 * @property {number} user_id
 * @property {string} title
 * @property {string} content
 */

/**
 * @typedef {Object} DbResult
 * @property {number} insertId
 * @property {number} affectedRows
 */

/**
 * Creates a new note.
 * @param {number} userId
 * @param {string} title
 * @param {string} content
 * @returns {Promise<DbResult>}
 */
async function createNote(userId, title, content) {
  try {
    /** @type {[DbResult, unknown]} */
    const [result] = await pool.execute(
      'INSERT INTO notes (user_id, title, content) VALUES (?, ?, ?)',
      [userId, title, content]
    );
    return result;
  } catch (err) {
    /** @type {Error & { status?: number, cause?: unknown }} */
    const error = new Error('Failed to create note');
    error.status = 500;
    error.cause = err;
    throw error;
  }
}

/**
 * Retrieves all notes for a user.
 * @param {number} userId
 * @returns {Promise<NoteRow[]>}
 */
async function getNotesByUserId(userId) {
  try {
    /** @type {[NoteRow[], unknown]} */
    const [rows] = await pool.execute(
      'SELECT id, user_id, title, content FROM notes WHERE user_id = ? ORDER BY id DESC',
      [userId]
    );
    return rows;
  } catch (err) {
    /** @type {Error & { status?: number, cause?: unknown }} */
    const error = new Error('Failed to fetch notes');
    error.status = 500;
    error.cause = err;
    throw error;
  }
}

/**
 * Retrieves a single note by id scoped to a user.
 * @param {number} id
 * @param {number} userId
 * @returns {Promise<NoteRow|null>}
 */
async function getNoteById(id, userId) {
  try {
    /** @type {[NoteRow[], unknown]} */
    const [rows] = await pool.execute(
      'SELECT id, user_id, title, content FROM notes WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return rows[0] || null;
  } catch (err) {
    /** @type {Error & { status?: number, cause?: unknown }} */
    const error = new Error('Failed to fetch note');
    error.status = 500;
    error.cause = err;
    throw error;
  }
}

/**
 * Updates a note scoped to a user.
 * @param {number} id
 * @param {number} userId
 * @param {string} title
 * @param {string} content
 * @returns {Promise<DbResult>}
 */
async function updateNote(id, userId, title, content) {
  try {
    /** @type {[DbResult, unknown]} */
    const [result] = await pool.execute(
      'UPDATE notes SET title = ?, content = ? WHERE id = ? AND user_id = ?',
      [title, content, id, userId]
    );
    return result;
  } catch (err) {
    /** @type {Error & { status?: number, cause?: unknown }} */
    const error = new Error('Failed to update note');
    error.status = 500;
    error.cause = err;
    throw error;
  }
}

/**
 * Deletes a note scoped to a user.
 * @param {number} id
 * @param {number} userId
 * @returns {Promise<DbResult>}
 */
async function deleteNote(id, userId) {
  try {
    /** @type {[DbResult, unknown]} */
    const [result] = await pool.execute(
      'DELETE FROM notes WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result;
  } catch (err) {
    /** @type {Error & { status?: number, cause?: unknown }} */
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