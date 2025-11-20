const express = require('express');
const router = express.Router();
const { popularity } = require('../utils/popularity');

router.get('/:id', popularity);

module.exports = router;
