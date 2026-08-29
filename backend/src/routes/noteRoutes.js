const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const noteController = require('../controllers/noteController');

const router = express.Router();

router.use(protect);
router.get('/', noteController.getNotes);
router.post('/', noteController.createNote);
router.get('/:id', noteController.getNoteById);
router.patch('/:id', noteController.updateNote);
router.patch('/:id/pin', noteController.updatePin);
router.patch('/:id/color', noteController.updateColor);
router.patch('/:id/archive', noteController.updateArchive);
router.post('/:id/tags', noteController.attachTag);
router.delete('/:id/tags/:tagId', noteController.removeTag);
router.put('/:id', noteController.updateNote);
router.delete('/:id', noteController.deleteNote);

module.exports = router;
