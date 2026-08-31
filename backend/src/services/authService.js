require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret || jwtSecret === 'your_super_secret_jwt_key_change_this') {
  throw new Error('JWT_SECRET must be set to a secure value');
}

/**
 * @typedef {Object} RegisterResult
 * @property {number} id
 * @property {string} username
 * @property {string} email
 */

/**
 * Registers a new user.
 * @param {string} username
 * @param {string} email
 * @param {string} password
 * @returns {Promise<RegisterResult>}
 */
async function register(username, email, password) {
  const existingUser = await userModel.findUserByEmail(email);
  if (existingUser) {
    const error = new Error('Email already in use');
    error.status = 409;
    throw error;
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  return userModel.createUser(username, email, hashedPassword);
}

/**
 * Logs in a user and returns a signed JWT token.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<string>} JWT token
 */
async function login(email, password) {
  const user = await userModel.findUserByEmail(email);
  const isValidPassword = user ? await bcrypt.compare(password, user.password) : false;

  if (!user || !isValidPassword) {
    const error = new Error('Invalid credentials');
    error.status = 401;
    throw error;
  }

  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
}

module.exports = {
  register,
  login,
};