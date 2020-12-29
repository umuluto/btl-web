var express = require("express");
const db = require("../database").db;

var router = express.Router();

router.get("/:userid", (req, res, next) => {
	const userid = req.params.userid;
	console.log(userid);

	db.HMGET(`users:${userid}`, "username", "info", (err, user) => {
		if (err) return next(err);

		const [username, info] = user;
		res.json({ username, info });
	});
});

module.exports = router;
