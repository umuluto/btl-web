var express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { db, scripts } = require("../database");

var router = express.Router();
const authorize = require("../middleware/auth");

router.post("/signup", (req, res, next) => {
	const { username, password } = req.query;
	const salt = crypto.randomBytes(16).toString("base64");

	crypto.scrypt(password, salt, 32, (err, hashed_pass) => {
		if (err) return next(err);
		hashed_pass = hashed_pass.toString("base64");
		const payload = { password: hashed_pass, salt };
		const auth = JSON.stringify(payload);

		db.EVAL(scripts.adduser, 0, username, auth, (err, userid) => {
			if (err) return next(err);
			if (!userid) return res.status(409).send("Username taken");

			res.json({ userid });
		});
	});
});

router.get("/login", (req, res, next) => {
	const { username, password } = req.query;

	db.HGET("auth:username", username, (err, userid) => {
		if (err) return next(err);
		if (!userid) return res.status(401).send("Wrong username");

		db.HGET(`users:${userid}`, "auth", (err, auth) => {
			if (err) return next(err);

			auth = JSON.parse(auth);
			crypto.scrypt(password, auth.salt, 32, (err, hashed_pass) => {
				if (err) return next(err);

				hashed_pass = hashed_pass.toString("base64");
				const valid = hashed_pass === auth.password;
				if (!valid) return res.status(401).send("Wrong password");

				const random = crypto.randomBytes(16).toString("base64");
				const payload = { userid, role: auth.role, random };
				const secret = process.env.JWT_SECRET;

				jwt.sign(payload, secret, (err, rtoken) => {
					if (err) return next(err);

					db.SET(`user:${userid}:random`, random, "EX", 86400, (err, _) => {
						if (err) return next(err);

						res.json({ rtoken });
					});
				});
			});
		});
	});
});

router.get("/refresh", (req, res, next) => {
	const rtoken = req.query.rtoken;
	const secret = process.env.JWT_SECRET;

	jwt.verify(rtoken, secret, (err, claim) => {
		if (err) return next(err);

		db.GET(`users:${claim.userid}:random`, (err, db_random) => {
			if (err) return next(err);
			if (claim.random == db_random) return res.sendStatus(403);

			const payload = {
				userid: claim.userid,
				role: claim.role,
			};

			const options = { expiresIn: "20m" };

			jwt.sign(payload, secret, options, (err, atoken) => {
				if (err) return next(err);

				res.json({ atoken });
			});
		});
	});
});

router.get("/logout", authorize, (req, res, next) => {
	const userid = req.claim.userid;

	db.DEL(`users:${userid}`, (err, _) => {
		if (err) return next(err);

		res.sendStatus(200);
	});
});

router.post("/request_ownership", authorize, (req, res, next) => {
	const userid = req.claim.userid;
	const info = req.body;

	const data = JSON.stringify(info);
	db.HSET(`pending:owners`, userid, data, (err, _) => {
		if (err) return next(err);

		res.sendStatus(200);
	});
});

module.exports = router;
