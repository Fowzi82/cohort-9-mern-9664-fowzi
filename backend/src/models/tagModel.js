const pool = require('../config/db');

async function getTagsByUserId(userId) {
  const [rows] = await pool.execute(
    'SELECT id, user_id, name, created_at FROM tags WHERE user_id = ? ORDER BY name ASC',
    [userId]
  );

  return rows;
}

async function findTagByName(userId, name) {
  const [rows] = await pool.execute(
    'SELECT id, user_id, name, created_at FROM tags WHERE user_id = ? AND name = ?',
    [userId, name]
  );

  return rows[0] || null;
}

async function createTag(userId, name) {
  const [result] = await pool.execute(
    'INSERT INTO tags (user_id, name) VALUES (?, ?)',
    [userId, name]
  );

  return {
    id: result.insertId,
    user_id: userId,
    name,
  };
}

async function attachTag(noteId, tagId) {
  await pool.execute(
    'INSERT IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)',
    [noteId, tagId]
  );
}

async function removeTag(noteId, tagId) {
  const [result] = await pool.execute(
    'DELETE FROM note_tags WHERE note_id = ? AND tag_id = ?',
    [noteId, tagId]
  );

  return result;
}

module.exports = {
  getTagsByUserId,
  findTagByName,
  createTag,
  attachTag,
  removeTag,
};
