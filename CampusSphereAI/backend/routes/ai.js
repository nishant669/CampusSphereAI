const express = require('express');
const rateLimit = require('express-rate-limit');
const { protect } = require('../middleware/auth');
const { chat } = require('../controllers/aiController');
const router = express.Router();
router.use(protect);
router.post('/chat', rateLimit({ windowMs: 60 * 1000, limit: 12, standardHeaders: true, legacyHeaders: false }), chat);
module.exports = router;
