const router = require("express").Router();
const { userSignup, userLoginin } = require("../controller/authController");

router.post("/register", userSignup);
router.post("/login", userLoginin);

module.exports = router;
