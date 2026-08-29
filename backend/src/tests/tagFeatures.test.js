let expect;

const tagModel = require('../models/tagModel');
const noteModel = require('../models/noteModel');
const tagService = require('../services/tagService');

describe('tag feature services', () => {
  const originals = {};

  before(async () => {
    ({ expect } = await import('chai'));
  });

  beforeEach(() => {
    originals.findTagByName = tagModel.findTagByName;
    originals.createTag = tagModel.createTag;
    originals.attachTag = tagModel.attachTag;
    originals.removeTag = tagModel.removeTag;
    originals.getNoteById = noteModel.getNoteById;
  });

  afterEach(() => {
    tagModel.findTagByName = originals.findTagByName;
    tagModel.createTag = originals.createTag;
    tagModel.attachTag = originals.attachTag;
    tagModel.removeTag = originals.removeTag;
    noteModel.getNoteById = originals.getNoteById;
  });

  it('creates a trimmed tag when it does not exist', async () => {
    tagModel.findTagByName = async () => null;
    tagModel.createTag = async (userId, name) => ({ id: 7, user_id: userId, name });

    const tag = await tagService.createTag('user-1', '  project   alpha  ');

    expect(tag).to.deep.equal({ id: 7, user_id: 'user-1', name: 'project alpha' });
  });

  it('attaches a tag to an existing note', async () => {
    noteModel.getNoteById = async () => ({
      id: 'note-1',
      tags: [{ id: 5, name: 'work' }],
    });
    tagModel.findTagByName = async () => ({ id: 5, name: 'work' });
    tagModel.attachTag = async (noteId, tagId) => {
      expect(noteId).to.equal('note-1');
      expect(tagId).to.equal(5);
    };

    const note = await tagService.attachTagToNote('user-1', 'note-1', 'work');

    expect(note.tags).to.deep.equal([{ id: 5, name: 'work' }]);
  });

  it('removes a tag from an existing note', async () => {
    noteModel.getNoteById = async () => ({ id: 'note-1', tags: [] });
    tagModel.removeTag = async (noteId, tagId) => {
      expect(noteId).to.equal('note-1');
      expect(tagId).to.equal('5');
      return { affectedRows: 1 };
    };

    const note = await tagService.removeTagFromNote('user-1', 'note-1', '5');

    expect(note).to.deep.equal({ id: 'note-1', tags: [] });
  });
});
