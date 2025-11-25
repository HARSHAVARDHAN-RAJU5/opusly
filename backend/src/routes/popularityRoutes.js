const express = require("express");
const router = express.Router();
const { getPopularity } = require("../utils/popularity");

router.get("/:id", getPopularity);

module.exports = router;
