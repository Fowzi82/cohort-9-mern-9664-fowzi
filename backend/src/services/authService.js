require('dotenv').config();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
}

async function register(username, email, password) {
  const hashedPassword = await bcrypt.hash(password, 10);

  return userModel.createUser(username, email, hashedPassword);
}

async function login(email, password) {
  const user = await userModel.findUserByEmail(email);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    const error = new Error('Invalid email or password');
    error.status = 401;
    throw error;
  }

  const token = signToken(user);

  return { token };
}

async function updateProfile(userId, username) {
  const trimmedUsername = (username || '').trim();

  if (!trimmedUsername) {
    const error = new Error('Username is required');
    error.status = 400;
    throw error;
  }

  const result = await userModel.updateUsername(userId, trimmedUsername);

  if (!result.affectedRows) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }

  const user = await userModel.findUserById(userId);

  return {
    user,
    token: signToken(user),
  };
}

async function changePassword(userId, currentPassword, newPassword) {
  if (!currentPassword || !newPassword) {
    const error = new Error('Password is required');
    error.status = 400;
    throw error;
  }

  const user = await userModel.findUserWithPasswordById(userId);

  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }

  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

  if (!isCurrentPasswordValid) {
    const error = new Error('Current password is incorrect');
    error.status = 401;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const result = await userModel.updatePassword(userId, hashedPassword);

  if (!result.affectedRows) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }

  return { message: 'Password updated' };
}

module.exports = {
  register,
  login,
  updateProfile,
  changePassword,
};
