require('dotenv').config();

const express = require('express');
const pino = require('pino');
const pinoHttp = require('pino-http');
const authRoutes = require('./routes/authRoutes');

const app = express();
const logger = pino({ redact: ['req.headers.authorization', 'req.headers.cookie'] });
const notesRoutes = express.Router();

app.use(pinoHttp({ logger }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);

app.use((err, req, res, next) => {
  req.log.error({ err }, 'Unhandled application error');

  const status = err.status || 500;
  const message = status >= 400 && status < 500 ? err.message : 'Internal server error';

  res.status(status).json({
    error: message,
  });
});

const port = process.env.PORT || 5000;
const server = app.listen(port, () => {
	logger.info({ port }, 'Server started');
});

module.exports = { app, server };
