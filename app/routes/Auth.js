const express = require("express");
const router = express.Router();
const controller = require("../controllers/AuthController");
const loginLimiter = require("../middleware/rateLimit");

router.post("/login", loginLimiter, controller.login);
router.post("/register", controller.register);
router.get("/logout", controller.logout);

module.exports = router;
