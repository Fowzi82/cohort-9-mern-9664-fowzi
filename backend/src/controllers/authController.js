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
 * @typedef {import('../services/authService').RegisterResult} RegisterResult
 */

/**
 * Handles user registration.
 * @param {import('express').Request<{}, RegisterResult, RegisterBody>} req
 * @param {import('express').Response<RegisterResult | { error: string }>} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>}
 */
async function register(req, res, next) {
  try {
    /** @type {Partial<RegisterBody>} */
    const body = req.body || {};
    const { username, email, password } = body;

    if (!username || !email || !password) {
      res.status(400).json({ error: 'Username, email, and password are required' });
      return;
    }

    if (
      typeof username !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string'
    ) {
      res.status(400).json({ error: 'Username, email, and password must be strings' });
      return;
    }

    /** @type {RegisterResult} */
    const result = await authService.register(username, email, password);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Handles user login.
 * @param {import('express').Request<{}, { token: string } | { error: string }, LoginBody>} req
 * @param {import('express').Response<{ token: string } | { error: string }>} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>}
 */
async function login(req, res, next) {
  try {
    /** @type {Partial<LoginBody>} */
    const body = req.body || {};
    const { email, password } = body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      res.status(400).json({ error: 'Email and password must be strings' });
      return;
    }

    /** @type {string} */
    const token = await authService.login(email, password);
    res.json({ token });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
};