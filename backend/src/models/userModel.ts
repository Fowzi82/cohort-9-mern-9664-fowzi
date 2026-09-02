import { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
const pool: Pool = require('../config/db');

export interface UserRow extends RowDataPacket {
  id: number;
  username: string;
  email: string;
  password?: string;
}

export interface CreateUserResult {
  id: number;
  username: string;
  email: string;
}

export async function createUser(
  username: string,
  email: string,
  hashedPassword: string
): Promise<CreateUserResult> {
  try {
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );
    return { id: result.insertId, username, email };
  } catch (err: unknown) {
    const error = new Error('Failed to create user') as Error & { status?: number; cause?: unknown };
    error.status = 500;
    error.cause = err;
    throw error;
  }
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  try {
    const [rows] = await pool.execute<UserRow[]>(
      'SELECT id, username, email, password FROM users WHERE email = ?',
      [email]
    );
    return rows[0] ?? null;
  } catch (err: unknown) {
    const error = new Error('Failed to look up user by email') as Error & { status?: number; cause?: unknown };
    error.status = 500;
    error.cause = err;
    throw error;
  }
}

export async function findUserById(id: number): Promise<UserRow | null> {
  try {
    const [rows] = await pool.execute<UserRow[]>(
      'SELECT id, username, email FROM users WHERE id = ?',
      [id]
    );
    return rows[0] ?? null;
  } catch (err: unknown) {
    const error = new Error('Failed to look up user by id') as Error & { status?: number; cause?: unknown };
    error.status = 500;
    error.cause = err;
    throw error;
  }
}