const authService = require('../services/authService');

/**
 * @typedef {Object} RegisterBody
 * @property {string} username
 * @property {string} email
 * @property {string} password
 */

/**
 * @typedef {Object} LoginBody
 * @property {string} email
 * @property {string} password
 */

/**
 * Handles user registration.
 * @param {import('express').Request<{}, {}, RegisterBody>} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>}
 */
async function register(req, res, next) {
  try {
    const body = req.body || {};
    const { username, email, password } = body;

    if (!username || !email || !password) {
      return res.status(400).json({
        error: 'Username, email, and password are required',
      });
    }

    if (typeof username !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        error: 'Username, email, and password must be strings',
      });
    }

    const result = await authService.register(username, email, password);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Handles user login.
 * @param {import('express').Request<{}, {}, LoginBody>} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>}
 */
async function login(req, res, next) {
  try {
    const body = req.body || {};
    const { email, password } = body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
      });
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        error: 'Email and password must be strings',
      });
    }

    const result = await authService.login(email, password);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
};