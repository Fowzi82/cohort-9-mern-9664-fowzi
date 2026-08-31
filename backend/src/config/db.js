const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const mysql = require('mysql2');

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

if (!DB_HOST || !DB_USER || !DB_NAME) {
  console.error('FATAL: Missing required database environment variables.');
  process.exit(1);
}

/**
 * @type {mysql.PoolOptions}
 */
const poolConfig = {
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
};

/**
 * MySQL connection pool with promise support.
 * @type {import('mysql2/promise').Pool}
 */
const pool = mysql.createPool(poolConfig);

module.exports = pool.promise();