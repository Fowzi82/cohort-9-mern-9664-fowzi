const noteModel = require('../models/noteModel');

async function createNote(userId, title, content) {
  return noteModel.createNote(userId, title, content);
}

async function getNotes(userId) {
  return noteModel.getNotesByUserId(userId);
}

async function getNoteById(id, userId) {
  const note = await noteModel.getNoteById(id, userId);

  if (!note) {
    const error = new Error('Note not found');
    error.status = 404;
    throw error;
  }

  return note;
}

async function updateNote(id, userId, title, content) {
  const result = await noteModel.updateNote(id, userId, title, content);

  if (!result.affectedRows) {
    const error = new Error('Note not found');
    error.status = 404;
    throw error;
  }

  return noteModel.getNoteById(id, userId);
}

async function deleteNote(id, userId) {
  const result = await noteModel.deleteNote(id, userId);

  if (!result.affectedRows) {
    const error = new Error('Note not found');
    error.status = 404;
    throw error;
  }

  return result;
}

module.exports = {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
};