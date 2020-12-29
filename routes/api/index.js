var express = require("express");
var router = express.Router();

const authRouter = require("./auth");
const userRouter = require("./user");
const roomRouter = require("./room");

router.use("/", authRouter);
router.use("/user", userRouter);
router.use("/room", roomRouter);

module.exports = router;
