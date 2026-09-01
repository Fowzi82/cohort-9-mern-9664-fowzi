const pool = require('../config/db');

/**
 * @typedef {Object} UserRow
 * @property {number} id
 * @property {string} username
 * @property {string} email
 * @property {string} [password]
 */

/**
 * Creates a new user in the database.
 * @param {string} username
 * @param {string} email
 * @param {string} hashedPassword
 * @returns {Promise<UserRow>}
 */
async function createUser(username, email, hashedPassword) {
  try {
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );
    /** @type {import('mysql2').ResultSetHeader} */
    const header = result;
    return { id: header.insertId, username, email };
  } catch (err) {
    /** @type {Error & { status?: number, cause?: unknown }} */
    const error = new Error('Failed to create user');
    error.status = 500;
    error.cause = err;
    throw error;
  }
}

/**
 * Finds a user by email address.
 * @param {string} email
 * @returns {Promise<UserRow|null>}
 */
async function findUserByEmail(email) {
  try {
    /** @type {[UserRow[], unknown]} */
    const [rows] = await pool.execute(
      'SELECT id, username, email, password FROM users WHERE email = ?',
      [email]
    );
    return rows[0] || null;
  } catch (err) {
    /** @type {Error & { status?: number, cause?: unknown }} */
    const error = new Error('Failed to look up user by email');
    error.status = 500;
    error.cause = err;
    throw error;
  }
}

/**
 * Finds a user by their ID.
 * @param {number} id
 * @returns {Promise<UserRow|null>}
 */
async function findUserById(id) {
  try {
    /** @type {[UserRow[], unknown]} */
    const [rows] = await pool.execute(
      'SELECT id, username, email FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  } catch (err) {
    /** @type {Error & { status?: number, cause?: unknown }} */
    const error = new Error('Failed to look up user by id');
    error.status = 500;
    error.cause = err;
    throw error;
  }
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
};