const pool = require('../config/db');

async function createNote(userId, title, content) {
  const [result] = await pool.execute(
    'INSERT INTO notes (user_id, title, content) VALUES (?, ?, ?)',
    [userId, title, content]
  );

  return getNoteById(result.insertId, userId);
}

function parseTags(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter((tag) => tag && tag.id);

  try {
    return JSON.parse(value).filter((tag) => tag && tag.id);
  } catch (error) {
    return [];
  }
}

function mapNotesWithTags(rows) {
  return rows.map((row) => ({
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    content: row.content,
    is_pinned: Boolean(row.is_pinned),
    color: row.color || 'default',
    is_archived: Boolean(row.is_archived),
    created_at: row.created_at,
    updated_at: row.updated_at,
    tags: parseTags(row.tags),
  }));
}

async function getNotesByUserId(userId, options = {}) {
  const values = [userId];
  const conditions = ['n.user_id = ?'];

  if (options.archived) {
    conditions.push('n.is_archived = 1');
  } else {
    conditions.push('(n.is_archived = 0 OR n.is_archived IS NULL)');
  }

  if (options.tag) {
    conditions.push('EXISTS (SELECT 1 FROM note_tags ntf JOIN tags tf ON tf.id = ntf.tag_id WHERE ntf.note_id = n.id AND tf.user_id = ? AND tf.name = ?)');
    values.push(userId, options.tag);
  }

  const [rows] = await pool.execute(
    `SELECT
      n.id,
      n.user_id,
      n.title,
      n.content,
      COALESCE(n.is_pinned, 0) AS is_pinned,
      COALESCE(n.color, 'default') AS color,
      COALESCE(n.is_archived, 0) AS is_archived,
      n.created_at,
      n.updated_at,
      COALESCE(
        JSON_ARRAYAGG(
          CASE
            WHEN t.id IS NULL THEN NULL
            ELSE JSON_OBJECT('id', t.id, 'name', t.name)
          END
        ),
        JSON_ARRAY()
      ) AS tags
    FROM notes n
    LEFT JOIN note_tags nt ON nt.note_id = n.id
    LEFT JOIN tags t ON t.id = nt.tag_id
    WHERE ${conditions.join(' AND ')}
    GROUP BY n.id
    ORDER BY COALESCE(n.is_pinned, 0) DESC, n.updated_at DESC, n.id DESC`,
    values
  );

  return mapNotesWithTags(rows);
}

async function getNoteById(id, userId) {
  const [rows] = await pool.execute(
    `SELECT
      n.id,
      n.user_id,
      n.title,
      n.content,
      COALESCE(n.is_pinned, 0) AS is_pinned,
      COALESCE(n.color, 'default') AS color,
      COALESCE(n.is_archived, 0) AS is_archived,
      n.created_at,
      n.updated_at,
      COALESCE(
        JSON_ARRAYAGG(
          CASE
            WHEN t.id IS NULL THEN NULL
            ELSE JSON_OBJECT('id', t.id, 'name', t.name)
          END
        ),
        JSON_ARRAY()
      ) AS tags
    FROM notes n
    LEFT JOIN note_tags nt ON nt.note_id = n.id
    LEFT JOIN tags t ON t.id = nt.tag_id
    WHERE n.id = ? AND n.user_id = ?
    GROUP BY n.id`,
    [id, userId]
  );

  return rows[0] ? mapNotesWithTags(rows)[0] : null;
}

async function updateNote(id, userId, fields) {
  const updates = [];
  const values = [];

  if (Object.prototype.hasOwnProperty.call(fields, 'title')) {
    updates.push('title = ?');
    values.push(fields.title);
  }

  if (Object.prototype.hasOwnProperty.call(fields, 'content')) {
    updates.push('content = ?');
    values.push(fields.content);
  }

  if (!updates.length) {
    return { affectedRows: 0 };
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id, userId);

  const [result] = await pool.execute(
    `UPDATE notes SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
    values
  );

  return result;
}

async function updatePin(id, userId, isPinned) {
  const [result] = await pool.execute(
    'UPDATE notes SET is_pinned = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
    [isPinned ? 1 : 0, id, userId]
  );

  return result;
}

async function updateColor(id, userId, color) {
  const [result] = await pool.execute(
    'UPDATE notes SET color = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
    [color, id, userId]
  );

  return result;
}

async function updateArchive(id, userId, isArchived) {
  const [result] = await pool.execute(
    'UPDATE notes SET is_archived = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
    [isArchived ? 1 : 0, id, userId]
  );

  return result;
}

async function deleteNote(id, userId) {
  const [result] = await pool.execute(
    'DELETE FROM notes WHERE id = ? AND user_id = ?',
    [id, userId]
  );

  return result;
}

module.exports = {
  createNote,
  getNotesByUserId,
  getNoteById,
  updateNote,
  updatePin,
  updateColor,
  updateArchive,
  deleteNote,
};
