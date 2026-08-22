const jwt = require('jsonwebtoken');

function protect(req, res, next) {
  try {
    const authorization = req.headers.authorization || '';
    const [scheme, token] = authorization.split(' ');

    if (scheme !== 'Bearer' || !token) {
      const error = new Error('Authorization token required');
      error.status = 401;
      throw error;
    }

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