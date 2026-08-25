const authService = require('../services/authService');

async function register(req, res, next) {
  try {
    const body = req.body || {};
    const { username, email, password } = body;

    if (!username || !email || !password) {
      return res.status(400).json({
        error: 'Username, email, and password are required',
      });
    }

    const result = await authService.register(username, email, password);

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const body = req.body || {};
    const { email, password } = body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
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