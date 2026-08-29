let expect;

const noteModel = require('../models/noteModel');
const noteService = require('../services/noteService');

describe('note feature services', () => {
  const originals = {};

  before(async () => {
    ({ expect } = await import('chai'));
  });

  beforeEach(() => {
    originals.updatePin = noteModel.updatePin;
    originals.updateColor = noteModel.updateColor;
    originals.updateArchive = noteModel.updateArchive;
    originals.getNoteById = noteModel.getNoteById;
  });

  afterEach(() => {
    noteModel.updatePin = originals.updatePin;
    noteModel.updateColor = originals.updateColor;
    noteModel.updateArchive = originals.updateArchive;
    noteModel.getNoteById = originals.getNoteById;
  });

  it('toggles pin state through the pin service', async () => {
    noteModel.updatePin = async (id, userId, isPinned) => {
      expect(id).to.equal('note-1');
      expect(userId).to.equal('user-1');
      expect(isPinned).to.equal(true);
      return { affectedRows: 1 };
    };
    noteModel.getNoteById = async () => ({ id: 'note-1', is_pinned: true });

    const note = await noteService.updatePin('note-1', 'user-1', true);

    expect(note).to.deep.equal({ id: 'note-1', is_pinned: true });
  });

  it('rejects invalid note colors', async () => {
    try {
      await noteService.updateColor('note-1', 'user-1', 'orange');
      throw new Error('Expected updateColor to throw');
    } catch (error) {
      expect(error.status).to.equal(400);
      expect(error.message).to.equal('Invalid note color');
    }
  });

  it('updates allowed note colors', async () => {
    noteModel.updateColor = async (id, userId, color) => {
      expect(id).to.equal('note-1');
      expect(userId).to.equal('user-1');
      expect(color).to.equal('purple');
      return { affectedRows: 1 };
    };
    noteModel.getNoteById = async () => ({ id: 'note-1', color: 'purple' });

    const note = await noteService.updateColor('note-1', 'user-1', 'purple');

    expect(note).to.deep.equal({ id: 'note-1', color: 'purple' });
  });

  it('toggles archive state through the archive service', async () => {
    noteModel.updateArchive = async (id, userId, isArchived) => {
      expect(id).to.equal('note-1');
      expect(userId).to.equal('user-1');
      expect(isArchived).to.equal(true);
      return { affectedRows: 1 };
    };
    noteModel.getNoteById = async () => ({ id: 'note-1', is_archived: true });

    const note = await noteService.updateArchive('note-1', 'user-1', true);

    expect(note).to.deep.equal({ id: 'note-1', is_archived: true });
  });
});
