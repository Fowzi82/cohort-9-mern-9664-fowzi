const tagModel = require('../models/tagModel');
const noteModel = require('../models/noteModel');

function normalizeTagName(name) {
  return (name || '').trim().replace(/\s+/g, ' ').slice(0, 50);
}

async function getTags(userId) {
  return tagModel.getTagsByUserId(userId);
}

async function createTag(userId, name) {
  const normalizedName = normalizeTagName(name);

  if (!normalizedName) {
    const error = new Error('Tag name is required');
    error.status = 400;
    throw error;
  }

  const existingTag = await tagModel.findTagByName(userId, normalizedName);
  if (existingTag) return existingTag;

  return tagModel.createTag(userId, normalizedName);
}

async function attachTagToNote(userId, noteId, name) {
  const note = await noteModel.getNoteById(noteId, userId);
  if (!note) {
    const error = new Error('Note not found');
    error.status = 404;
    throw error;
  }

  const tag = await createTag(userId, name);
  await tagModel.attachTag(noteId, tag.id);

  return noteModel.getNoteById(noteId, userId);
}

async function removeTagFromNote(userId, noteId, tagId) {
  const note = await noteModel.getNoteById(noteId, userId);
  if (!note) {
    const error = new Error('Note not found');
    error.status = 404;
    throw error;
  }

  await tagModel.removeTag(noteId, tagId);
  return noteModel.getNoteById(noteId, userId);
}

module.exports = {
  getTags,
  createTag,
  attachTagToNote,
  removeTagFromNote,
};
