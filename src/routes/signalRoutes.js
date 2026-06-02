'use strict';

const express = require('express');
const controller = require('../controllers/signalController');

const router = express.Router();

// POST   /api/signals          -> create
// GET    /api/signals          -> list all (live status refresh)
// GET    /api/signals/:id      -> get one (live status refresh)
// GET    /api/signals/:id/status -> lightweight live status
// DELETE /api/signals/:id      -> delete
router.post('/', controller.create);
router.get('/', controller.list);
router.get('/:id/status', controller.getStatus);
router.get('/:id', controller.getById);
router.delete('/:id', controller.remove);

module.exports = router;
