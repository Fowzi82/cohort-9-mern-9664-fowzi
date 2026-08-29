const noteService = require('../services/noteService');

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
    const notes = await noteService.getNotes(req.user.id);

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
    const { title, content } = body;

    if (!title) {
      return res.status(400).json({
        error: 'Title is required',
      });
    }

    const note = await noteService.updateNote(
      req.params.id,
      req.user.id,
      title,
      content
    );

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
  deleteNote,
};