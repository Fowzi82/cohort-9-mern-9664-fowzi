const express = require('express');
const authController = require('../controllers/authController');

/** @type {import('express').Router} */
const router = express.Router();

/**
 * @route POST /api/auth/register
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
router.post('/register', authController.register);

/**
 * @route POST /api/auth/login
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
router.post('/login', authController.login);

module.exports = router;