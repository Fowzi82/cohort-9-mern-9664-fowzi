require('dotenv').config();

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === '') {
  console.error('FATAL: JWT_SECRET is not set. Refusing to start.');
  process.exit(1);
}

const express = require('express');
const pino = require('pino');
const pinoHttp = require('pino-http');
const authRoutes = require('./routes/authRoutes');
const noteRoutes = require('./routes/noteRoutes');

/** @type {import('express').Application} */
const app = express();

/** @type {import('pino').Logger} */
const logger = pino({ redact: ['req.headers.authorization', 'req.headers.cookie'] });

app.use(express.json());
app.use(pinoHttp({ logger }));
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);

/**
 * Global error handling middleware.
 * @param {Error & { status?: number }} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {void}
 */
app.use((err, req, res, next) => {
  req.log.error({ err }, 'Unhandled application error');
  const status = err.status || 500;
  const message = status >= 400 && status < 500 ? err.message : 'Internal server error';
  res.status(status).json({
    error: message,
  });
});

const port = process.env.PORT || 5000;

/** @type {import('http').Server} */
const server = app.listen(port, () => {
  logger.info({ port }, 'Server started');
});

module.exports = { app, server };