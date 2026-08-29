const authService = require('../services/authService');

async function register(req, res, next) {
  try {
    const { username, email, password } = req.body;
    const result = await authService.register(username, email, password);

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { username } = req.body || {};
    const result = await authService.updateProfile(req.user.id, username);

    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body || {};
    const result = await authService.changePassword(req.user.id, currentPassword, newPassword);

    res.json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  updateProfile,
  changePassword,
};
