const jwt = require('jsonwebtoken');

/**
 * @typedef {Object} JwtPayload
 * @property {number} id
 * @property {string} username
 * @property {string} email
 */

/**
 * @typedef {import('express').Request & { user?: JwtPayload }} AuthenticatedRequest
 */

/**
 * Express middleware that protects routes by verifying a Bearer JWT token.
 * @param {AuthenticatedRequest} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {void}
 */
function protect(req, res, next) {
  try {
    const authorization = req.headers.authorization || '';
    const [scheme, token] = authorization.split(' ');

    if (scheme !== 'Bearer' || !token) {
      const error = new Error('Authorization token required');
      error.status = 401;
      throw error;
    }

    /** @type {JwtPayload} */
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    if (!error.status) {
      error.status = 401;
    }
    next(error);
  }
}

module.exports = { protect };