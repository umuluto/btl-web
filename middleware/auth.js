const jwt = require("jsonwebtoken");

function authorize(req, res, next) {
	const auth = req.get("Authorization");

	if (!auth) return res.sendStatus(403);

	const atoken = auth.split(" ")[1];
	const secret = process.env.JWT_SECRET;

	jwt.verify(atoken, secret, (err, claim) => {
		if (err || typeof claim !== "object") return res.sendStatus(403);

		req.claim = claim;
		next();
	});
}

module.exports = authorize;
