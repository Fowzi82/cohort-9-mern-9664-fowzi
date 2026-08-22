require('dotenv').config();

const express = require('express');
const pino = require('pino');
const pinoHttp = require('pino-http');
const authRoutes = require('./routes/authRoutes');

const app = express();
const logger = pino();
const notesRoutes = express.Router();

app.use(express.json());
app.use(pinoHttp({ logger }));

app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);

app.use((err, req, res, next) => {
	req.log.error({ err }, 'Unhandled application error');

	res.status(err.status || 500).json({
		error: err.message || 'Internal server error',
	});
});

const port = process.env.PORT || 5000;
const server = app.listen(port, () => {
	logger.info({ port }, 'Server started');
});

module.exports = { app, server };
