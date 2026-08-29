const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const tagController = require('../controllers/tagController');

const router = express.Router();

router.use(protect);
router.get('/', tagController.getTags);
router.post('/', tagController.createTag);

module.exports = router;
