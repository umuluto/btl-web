const express = require("express");
const uniqid = require("uniqid");

const db = require("../database").db;
const authorize = require("../middleware/auth");
const router = express.Router();

router.use(authorize);

router.post("/", (req, res, next) => {
	const owner = req.claim.userid;
	const info = req.body;

	const roomInfo = { owner, info };
	const data = JSON.stringify(roomInfo);

	const postid = uniqid();

	db.MULTI()
		.HSET("pending:rooms", postid, data)
		.SADD(`users:${owner}:pending-rooms`, postid)
		.EXEC((err, _) => {
			if (err) return next(err);

			res.sendStatus(202);
		});
});

router.get("/pending", (req, res, next) => {
	const userid = req.claim.userid;

	db.SMEMBERS(`users:${userid}:pending-rooms`, (err, rooms) => {
		if (err) return next(err);

		res.json(rooms);
	});
});

router.put("/pending/:postid", (req, res, next) => {
	const owner = req.claim.userid;
	const postid = req.params.postid;
	const info = req.body;

	const roomInfo = { owner, info };
	const data = JSON.stringify(roomInfo);

	db.HEXISTS("pending:rooms", postid, (err, exist) => {
		if (err) return next(err);
		if (!exist) return res.sendStatus(404);

		db.HSET("pending:rooms", postid, data, (err, _) => {
			if (err) return next(err);

			res.sendStatus(200);
		});
	});
});

router.get("/fav", (req, res, next) => {
	const userid = req.claim.userid;

	db.SMEMBERS(`users:${userid}:favs`, (err, rooms) => {
		if (err) return next(err);

		res.json(rooms);
	});
});

router.put("/fav/:roomid", (req, res, next) => {
	const userid = req.claim.userid;
	const roomid = req.params.roomid;

	db.SADD(`users:${userid}:favs`, roomid, (err, success) => {
		if (err) return next(err);
		if (!success) return res.sendStatus(409);

		res.sendStatus(200);
	});
});

router.delete("/fav/:roomid", (req, res, next) => {
	const userid = req.claim.userid;
	const roomid = req.params.roomid;

	db.SREM(`users:${userid}:favs`, roomid, (err, success) => {
		if (err) return next(err);
		if (!success) return res.sendStatus(404);

		res.sendStatus(200);
	});
});

router.get("/:roomid", (req, res, next) => {
	const roomid = req.params.roomid;

	db.HMGET(`rooms:${roomid}`, "info", "likes", (err, arr) => {
		if (err) return next(err);
		if (!arr) return res.sendStatus(404);

		const [info, likes] = arr;
		const ret = { info, likes };
		res.json(ret);
	});
});

router.get("/:roomid/review", (req, res, next) => {
	const roomid = req.params.roomid;

	db.HGETALL(`rooms:${roomid}:reviews`, (err, reviews) => {
		if (err) return next(err);
		if (!review) return res.sendStatus(404);

		res.json(reviews);
	});
});

router.post("/:roomid/review", (req, res, next) => {
	const userid = req.claim.userid;
	const roomid = req.params.roomid;
	const review = req.body;

	const reviewid = uniqid();
	const payload = { userid, review };
	const data = JSON.stringify(payload);

	db.EXISTS(`rooms:${roomid}`, (err, exist) => {
		if (err) return next(err);
		if (!exist) return res.sendStatus(404);

		db.HSET("pending:reviews", reviewid, data, (err, _) => {
			if (err) return next(err);

			res.sendStatus(200);
		});
	});
});

module.exports = router;
