const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const noteController = require('../controllers/noteController');

const router = express.Router();

router.use(protect);
router.get('/', noteController.getNotes);
router.post('/', noteController.createNote);
router.get('/:id', noteController.getNoteById);
router.put('/:id', noteController.updateNote);
router.delete('/:id', noteController.deleteNote);

module.exports = router;