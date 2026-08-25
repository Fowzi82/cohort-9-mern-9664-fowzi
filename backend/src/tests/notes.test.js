const { expect } = require('chai');
const assert = require('node:assert/strict');
const sinon = require('sinon');
const noteModel = require('../models/noteModel');
const noteService = require('../services/noteService');

describe('noteService', function () {
  let sandbox;

  beforeEach(function () {
    sandbox = sinon.createSandbox();
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('createNote', function () {
    it('returns a new note object with id, title, and content', async function () {
      const createdNote = { id: 1, user_id: 2, title: 'Test note', content: 'Example content' };
      sandbox.stub(noteModel, 'createNote').resolves(createdNote);

      const result = await noteService.createNote(2, 'Test note', 'Example content');

      expect(result).to.deep.equal(createdNote);
      expect(noteModel.createNote.calledOnceWithExactly(2, 'Test note', 'Example content')).to.equal(true);
    });
  });

  describe('getNotes', function () {
    it('returns an array of notes for a user', async function () {
      const notes = [
        { id: 1, user_id: 2, title: 'First', content: 'One' },
        { id: 2, user_id: 2, title: 'Second', content: 'Two' },
      ];
      sandbox.stub(noteModel, 'getNotesByUserId').resolves(notes);

      const result = await noteService.getNotes(2);

      expect(result).to.deep.equal(notes);
      expect(noteModel.getNotesByUserId.calledOnceWithExactly(2)).to.equal(true);
    });
  });

  describe('getNoteById', function () {
    it('returns a note when found', async function () {
      const note = { id: 5, user_id: 2, title: 'Existing', content: 'Body' };
      sandbox.stub(noteModel, 'getNoteById').resolves(note);

      const result = await noteService.getNoteById(5, 2);

      expect(result).to.deep.equal(note);
      expect(noteModel.getNoteById.calledOnceWithExactly(5, 2)).to.equal(true);
    });

    it("throws error with message 'Note not found' when not found", async function () {
      sandbox.stub(noteModel, 'getNoteById').resolves(null);

      await assert.rejects(
        () => noteService.getNoteById(99, 2),
        /Note not found/
      );
    });
  });

  describe('updateNote', function () {
    it('returns the updated note object', async function () {
      const updatedNote = { id: 7, user_id: 2, title: 'Updated', content: 'New body' };
      sandbox.stub(noteModel, 'updateNote').resolves({ affectedRows: 1 });
      sandbox.stub(noteModel, 'getNoteById').resolves(updatedNote);

      const result = await noteService.updateNote(7, 2, 'Updated', 'New body');

      expect(result).to.deep.equal(updatedNote);
      expect(noteModel.updateNote.calledOnceWithExactly(7, 2, 'Updated', 'New body')).to.equal(true);
      expect(noteModel.getNoteById.calledOnceWithExactly(7, 2)).to.equal(true);
    });
  });

  describe('deleteNote', function () {
    it('returns the success result', async function () {
      const successResult = { affectedRows: 1 };
      sandbox.stub(noteModel, 'deleteNote').resolves(successResult);

      const result = await noteService.deleteNote(3, 2);

      expect(result).to.deep.equal(successResult);
      expect(noteModel.deleteNote.calledOnceWithExactly(3, 2)).to.equal(true);
    });
  });
});
