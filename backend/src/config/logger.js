const pino = require('pino');

const logger = pino({
  redact: ['req.headers.authorization', 'req.headers.cookie'],
  transport: process.env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    }
  } : undefined,
});

module.exports = logger;