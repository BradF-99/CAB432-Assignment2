const redis = require("redis");
const REDIS_URL = process.env.REDIS_URL || "//149.28.165.104:4320";
const redisClient = redis.createClient(REDIS_URL,{password:"CAB4322019"}); // replace for production deploy
const bluebird = require("bluebird");

// add async to all node redis functions
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

module.exports = redisClient;