const noteService = require('../services/noteService');
const tagService = require('../services/tagService');
const logger = require('../config/logger');

async function createNote(req, res, next) {
  try {
    const body = req.body || {};
    const { title, content } = body;

    if (!title) {
      return res.status(400).json({
        error: 'Title is required',
      });
    }

    const result = await noteService.createNote(req.user.id, title, content);

    if (req.io) {
      req.io.emit('note:created', result);
    }

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function getNotes(req, res, next) {
  try {
    const notes = await noteService.getNotes(req.user.id, {
      archived: req.query.archived === 'true',
      tag: req.query.tag,
    });

    res.json(notes);
  } catch (error) {
    next(error);
  }
}

async function getNoteById(req, res, next) {
  try {
    const note = await noteService.getNoteById(req.params.id, req.user.id);

    res.json(note);
  } catch (error) {
    next(error);
  }
}

async function updateNote(req, res, next) {
  try {
    const body = req.body || {};
    const fields = {};

    if (Object.prototype.hasOwnProperty.call(body, 'title')) {
      fields.title = body.title;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'content')) {
      fields.content = body.content;
    }

    if (Object.prototype.hasOwnProperty.call(fields, 'title') && !String(fields.title).trim()) {
      return res.status(400).json({
        error: 'Title is required',
      });
    }

    const note = await noteService.updateNote(req.params.id, req.user.id, fields);

    if (req.io) {
      req.io.emit('note:updated', note);
    }

    res.json(note);
  } catch (error) {
    next(error);
  }
}

async function updatePin(req, res, next) {
  try {
    const note = await noteService.getNoteById(req.params.id, req.user.id);
    const updatedNote = await noteService.updatePin(req.params.id, req.user.id, !note.is_pinned);

    logger.info({ userId: req.user.id, noteId: req.params.id, isPinned: updatedNote.is_pinned }, 'Note pin toggled');

    if (req.io) {
      req.io.emit('note:updated', updatedNote);
    }

    res.json(updatedNote);
  } catch (error) {
    next(error);
  }
}

async function updateColor(req, res, next) {
  try {
    const updatedNote = await noteService.updateColor(req.params.id, req.user.id, req.body?.color);

    logger.info({ userId: req.user.id, noteId: req.params.id, color: updatedNote.color }, 'Note color changed');

    if (req.io) {
      req.io.emit('note:updated', updatedNote);
    }

    res.json(updatedNote);
  } catch (error) {
    next(error);
  }
}

async function updateArchive(req, res, next) {
  try {
    const note = await noteService.getNoteById(req.params.id, req.user.id);
    const updatedNote = await noteService.updateArchive(req.params.id, req.user.id, !note.is_archived);

    logger.info({ userId: req.user.id, noteId: req.params.id, isArchived: updatedNote.is_archived }, 'Note archive toggled');

    if (req.io) {
      req.io.emit('note:updated', updatedNote);
    }

    res.json(updatedNote);
  } catch (error) {
    next(error);
  }
}

async function attachTag(req, res, next) {
  try {
    const note = await tagService.attachTagToNote(req.user.id, req.params.id, req.body?.name);
    logger.info({ userId: req.user.id, noteId: req.params.id, tagName: req.body?.name }, 'Tag attached to note');

    if (req.io) {
      req.io.emit('note:updated', note);
    }

    res.status(201).json(note);
  } catch (error) {
    next(error);
  }
}

async function removeTag(req, res, next) {
  try {
    const note = await tagService.removeTagFromNote(req.user.id, req.params.id, req.params.tagId);
    logger.info({ userId: req.user.id, noteId: req.params.id, tagId: req.params.tagId }, 'Tag removed from note');

    if (req.io) {
      req.io.emit('note:updated', note);
    }

    res.json(note);
  } catch (error) {
    next(error);
  }
}

async function deleteNote(req, res, next) {
  try {
    const result = await noteService.deleteNote(req.params.id, req.user.id);

    if (req.io) {
      req.io.emit('note:deleted', { id: req.params.id });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  updatePin,
  updateColor,
  updateArchive,
  attachTag,
  removeTag,
  deleteNote,
};
