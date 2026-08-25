require('dotenv').config();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret || jwtSecret === 'your_super_secret_jwt_key_change_this') {
  throw new Error('JWT_SECRET must be set to a secure value');
}

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

async function login(email, password) {
  const user = await userModel.findUserByEmail(email);

  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }

  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
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