require('dotenv').config();

const express = require('express');
const cors = require('cors');
const pino = require('pino');
const pinoHttp = require('pino-http');
const { Server } = require('socket.io');
const authRoutes = require('./routes/authRoutes');
const noteRoutes = require('./routes/noteRoutes');

const app = express();
const logger = pino({ redact: ['req.headers.authorization', 'req.headers.cookie'] });

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(pinoHttp({ logger }));
app.use(express.json());

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);

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

const io = new Server(server, {
  cors: { origin: 'http://localhost:5173', credentials: true },
});

io.on('connection', (socket) => {
  logger.info({ socketId: socket.id }, 'Client connected via Socket.IO');
  socket.on('disconnect', () => {
    logger.info({ socketId: socket.id }, 'Client disconnected');
  });
});

module.exports = { app, server, io };