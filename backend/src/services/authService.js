require('dotenv').config();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

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

  const token = jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  return { token };
}

module.exports = {
  register,
  login,
};