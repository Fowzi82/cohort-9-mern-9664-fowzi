const { expect } = require('chai');
const assert = require('node:assert/strict');
const sinon = require('sinon');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '1h';

const userModel = require('../models/userModel');
const authService = require('../services/authService');

describe('authService', function () {
  let sandbox;

  beforeEach(function () {
    sandbox = sinon.createSandbox();
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('register', function () {
    it('successfully creates a user and returns the user object', async function () {
      const createdUser = { id: 1, username: 'alice', email: 'alice@example.com' };
      sandbox.stub(userModel, 'findUserByEmail').resolves(null);
      sandbox.stub(bcrypt, 'hash').resolves('hashed-password');
      sandbox.stub(userModel, 'createUser').resolves(createdUser);

      const result = await authService.register('alice', 'alice@example.com', 'secret123');

      expect(result).to.deep.equal(createdUser);
      expect(userModel.findUserByEmail.calledOnceWithExactly('alice@example.com')).to.equal(true);
      expect(bcrypt.hash.calledOnceWithExactly('secret123', 10)).to.equal(true);
      expect(userModel.createUser.calledOnceWithExactly('alice', 'alice@example.com', 'hashed-password')).to.equal(true);
    });

    it("throws error with message 'Email already in use' if duplicate", async function () {
      sandbox.stub(userModel, 'findUserByEmail').resolves({ id: 2, email: 'alice@example.com' });

      await assert.rejects(
        () => authService.register('alice', 'alice@example.com', 'secret123'),
        /Email already in use/
      );
    });
  });

  describe('login', function () {
    it('returns a JWT token string on valid credentials', async function () {
      const user = {
        id: 1,
        username: 'alice',
        email: 'alice@example.com',
        password: 'hashed-password',
      };
      sandbox.stub(userModel, 'findUserByEmail').resolves(user);
      sandbox.stub(bcrypt, 'compare').resolves(true);
      sandbox.stub(jwt, 'sign').returns('jwt-token');

      const result = await authService.login('alice@example.com', 'secret123');

      expect(result).to.equal('jwt-token');
      expect(userModel.findUserByEmail.calledOnceWithExactly('alice@example.com')).to.equal(true);
      expect(bcrypt.compare.calledOnceWithExactly('secret123', 'hashed-password')).to.equal(true);
      expect(jwt.sign.calledOnce).to.equal(true);
    });

    it("throws error with message 'User not found' if user does not exist", async function () {
      sandbox.stub(userModel, 'findUserByEmail').resolves(null);

      await assert.rejects(
        () => authService.login('missing@example.com', 'secret123'),
        /User not found/
      );
    });

    it("throws error with message 'Invalid credentials' if password is wrong", async function () {
      const user = {
        id: 1,
        username: 'alice',
        email: 'alice@example.com',
        password: 'hashed-password',
      };
      sandbox.stub(userModel, 'findUserByEmail').resolves(user);
      sandbox.stub(bcrypt, 'compare').resolves(false);

      await assert.rejects(
        () => authService.login('alice@example.com', 'wrong-password'),
        /Invalid credentials/
      );
    });
  });
});
