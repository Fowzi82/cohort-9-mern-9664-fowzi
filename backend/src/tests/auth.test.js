const { expect } = require('chai');
const assert = require('node:assert/strict');
const sinon = require('sinon');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '1h';

const userModel = require('../models/userModel');
const authService = require('../services/authService');
const { DUMMY_HASH } = require('../services/authService');

/**
 * @typedef {Object} UserFixture
 * @property {number} id
 * @property {string} username
 * @property {string} email
 * @property {string} password
 */

/**
 * @typedef {Object} RegisterResult
 * @property {number} id
 * @property {string} username
 * @property {string} email
 */

describe('authService', function () {
  /** @type {sinon.SinonSandbox} */
  let sandbox;

  beforeEach(function () {
    sandbox = sinon.createSandbox();
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('register', function () {
    it('successfully creates a user and returns the user object without password', async function () {
      /** @type {UserFixture} */
      const createdUser = {
        id: 1,
        username: 'alice',
        email: 'alice@example.com',
        password: 'hashed-password',
      };

      /** @type {RegisterResult} */
      const expectedResult = { id: 1, username: 'alice', email: 'alice@example.com' };

      sandbox.stub(userModel, 'findUserByEmail').resolves(null);
      sandbox.stub(bcrypt, 'hash').resolves('hashed-password');
      sandbox.stub(userModel, 'createUser').resolves(createdUser);

      /** @type {RegisterResult} */
      let result;
      try {
        result = await authService.register('alice', 'alice@example.com', 'secret123');
      } catch (err) {
        assert.fail(`register threw unexpectedly: ${err.message}`);
      }

      expect(result).to.deep.equal(expectedResult);
      expect(result).to.not.have.property('password');
      expect(userModel.findUserByEmail.calledOnceWithExactly('alice@example.com')).to.equal(true);
      expect(bcrypt.hash.calledOnceWithExactly('secret123', 10)).to.equal(true);
      expect(
        userModel.createUser.calledOnceWithExactly('alice', 'alice@example.com', 'hashed-password')
      ).to.equal(true);
    });

    it("throws error with status 409 and message 'Email already in use' if duplicate", async function () {
      /** @type {Pick<UserFixture, 'id' | 'email'>} */
      const existingUser = { id: 2, email: 'alice@example.com' };
      sandbox.stub(userModel, 'findUserByEmail').resolves(existingUser);

      /** @type {Error & { status?: number }} */
      let thrown;
      await assert.rejects(
        () => authService.register('alice', 'alice@example.com', 'secret123'),
        (/** @type {Error & { status?: number }} */ err) => {
          thrown = err;
          return /Email already in use/.test(err.message);
        }
      );
      expect(thrown.status).to.equal(409);
    });
  });

  describe('login', function () {
    it('returns a JWT token string on valid credentials', async function () {
      /** @type {UserFixture} */
      const user = {
        id: 1,
        username: 'alice',
        email: 'alice@example.com',
        password: 'hashed-password',
      };

      sandbox.stub(userModel, 'findUserByEmail').resolves(user);
      sandbox.stub(bcrypt, 'compare').resolves(true);
      sandbox.stub(jwt, 'sign').returns('jwt-token');

      /** @type {string} */
      let result;
      try {
        result = await authService.login('alice@example.com', 'secret123');
      } catch (err) {
        assert.fail(`login threw unexpectedly: ${err.message}`);
      }

      expect(result).to.equal('jwt-token');
      expect(userModel.findUserByEmail.calledOnceWithExactly('alice@example.com')).to.equal(true);
      expect(bcrypt.compare.calledOnceWithExactly('secret123', 'hashed-password')).to.equal(true);
      expect(jwt.sign.calledOnce).to.equal(true);
    });

    it("throws error with status 401 and message 'Invalid credentials' if user does not exist", async function () {
      sandbox.stub(userModel, 'findUserByEmail').resolves(null);
      sandbox.stub(bcrypt, 'compare').resolves(false);

      /** @type {Error & { status?: number }} */
      let thrown;
      await assert.rejects(
        () => authService.login('missing@example.com', 'secret123'),
        (/** @type {Error & { status?: number }} */ err) => {
          thrown = err;
          return /Invalid credentials/.test(err.message);
        }
      );
      expect(thrown.status).to.equal(401);
      expect(bcrypt.compare.calledOnce).to.equal(true);
      // Assert that the dummy hash was passed, not undefined or user password
      expect(bcrypt.compare.calledOnceWithExactly('secret123', DUMMY_HASH)).to.equal(true);
    });

    it("throws error with status 401 and message 'Invalid credentials' if password is wrong", async function () {
      /** @type {UserFixture} */
      const user = {
        id: 1,
        username: 'alice',
        email: 'alice@example.com',
        password: 'hashed-password',
      };

      sandbox.stub(userModel, 'findUserByEmail').resolves(user);
      sandbox.stub(bcrypt, 'compare').resolves(false);

      /** @type {Error & { status?: number }} */
      let thrown;
      await assert.rejects(
        () => authService.login('alice@example.com', 'wrong-password'),
        (/** @type {Error & { status?: number }} */ err) => {
          thrown = err;
          return /Invalid credentials/.test(err.message);
        }
      );
      expect(thrown.status).to.equal(401);
    });
  });
});