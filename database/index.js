const redis = require("redis");
const path = require("path");
const fs = require("fs");

// connect to redis, use environment variable (dotenv)
const client = redis.createClient({
	host: process.env.REDIS_HOST,
	port: parseInt(process.env.REDIS_PORT),
	password: process.env.REDIS_PASS,
	detect_buffers: true,
});

module.exports.db = client;
module.exports.scripts = fs.readdirSync(__dirname).reduce((accu, cur) => {
	const f = path.parse(cur);
	const fullpath = path.join(__dirname, cur);
	if (f.ext != ".lua") return accu;

	accu[f.name] = fs.readFileSync(fullpath, "utf-8");
	return accu;
}, {});
