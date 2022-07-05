var express = require("express");
var router = express.Router();

const controllers = require("@seawolf/controllers/api");

router.get("/", controllers.main);

module.exports = router;