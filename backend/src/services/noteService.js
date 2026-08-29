const noteModel = require('../models/noteModel');

async function createNote(userId, title, content) {
  return noteModel.createNote(userId, title, content);
}

async function getNotes(userId, options = {}) {
  return noteModel.getNotesByUserId(userId, options);
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

async function updateNote(id, userId, fields) {
  const result = await noteModel.updateNote(id, userId, fields);

  if (!result.affectedRows) {
    const error = new Error('Note not found');
    error.status = 404;
    throw error;
  }

  return noteModel.getNoteById(id, userId);
}

async function updatePin(id, userId, isPinned) {
  const result = await noteModel.updatePin(id, userId, Boolean(isPinned));

  if (!result.affectedRows) {
    const error = new Error('Note not found');
    error.status = 404;
    throw error;
  }

  return noteModel.getNoteById(id, userId);
}

async function updateColor(id, userId, color) {
  const allowedColors = ['default', 'red', 'yellow', 'green', 'blue', 'purple'];

  if (!allowedColors.includes(color)) {
    const error = new Error('Invalid note color');
    error.status = 400;
    throw error;
  }

  const result = await noteModel.updateColor(id, userId, color);

  if (!result.affectedRows) {
    const error = new Error('Note not found');
    error.status = 404;
    throw error;
  }

  return noteModel.getNoteById(id, userId);
}

async function updateArchive(id, userId, isArchived) {
  const result = await noteModel.updateArchive(id, userId, Boolean(isArchived));

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
  updatePin,
  updateColor,
  updateArchive,
  deleteNote,
};
