require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret === 'your_super_secret_jwt_key_change_this') {
  throw new Error('JWT_SECRET must be set to a secure value');
}

// Pre-computed dummy hash used to equalise bcrypt timing for unknown emails.
const DUMMY_HASH = '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345';

// bcrypt silently truncates passwords longer than 72 UTF-8 bytes.
const BCRYPT_MAX_BYTES = 72;

/**
 * @typedef {Object} RegisterResult
 * @property {number} id
 * @property {string} username
 * @property {string} email
 */

/**
 * @typedef {Object} DbUser
 * @property {number} id
 * @property {string} username
 * @property {string} email
 * @property {string} password
 */

/**
 * @typedef {{ message: string, status: number }} ServiceError
 */

/**
 * Registers a new user.
 * @param {string} username
 * @param {string} email
 * @param {string} password
 * @returns {Promise<RegisterResult>}
 */
async function register(username, email, password) {
  try {
    if (Buffer.byteLength(password, 'utf8') > BCRYPT_MAX_BYTES) {
      /** @type {Error & { status?: number }} */
      const error = new Error('Password must not exceed 72 bytes');
      error.status = 400;
      throw error;
    }

    /** @type {DbUser|null} */
    const existingUser = await userModel.findUserByEmail(email);
    if (existingUser) {
      /** @type {Error & { status?: number }} */
      const error = new Error('Email already in use');
      error.status = 409;
      throw error;
    }

    /** @type {string} */
    const hashedPassword = await bcrypt.hash(password, 10);

    /** @type {DbUser} */
    const created = await userModel.createUser(username, email, hashedPassword);

    return { id: created.id, username: created.username, email: created.email };
  } catch (err) {
    /** @type {Error & { status?: number }} */
    const error = /** @type {any} */ (err);
    if (!error.status) error.status = 500;
    throw error;
  }
}

/**
 * Logs in a user and returns a signed JWT token.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<string>} JWT token
 */
async function login(email, password) {
  try {
    /** @type {DbUser|null} */
    const user = await userModel.findUserByEmail(email);

    // Always run bcrypt.compare to prevent timing-based email enumeration.
    /** @type {boolean} */
    const isValidPassword = await bcrypt.compare(
      password,
      user ? user.password : DUMMY_HASH
    );

    if (!user || !isValidPassword) {
      /** @type {Error & { status?: number }} */
      const error = new Error('Invalid credentials');
      error.status = 401;
      throw error;
    }

    /** @type {string} */
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return token;
  } catch (err) {
    /** @type {Error & { status?: number }} */
    const error = /** @type {any} */ (err);
    if (!error.status) error.status = 500;
    throw error;
  }
}

module.exports = {
  register,
  login,
  DUMMY_HASH,
};