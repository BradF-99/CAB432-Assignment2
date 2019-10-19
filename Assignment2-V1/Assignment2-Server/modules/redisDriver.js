const redis = require("redis");
const REDIS_URL = process.env.REDIS_URL || "//0.0.0.0:6379";
const redisClient = redis.createClient(REDIS_URL);
const bluebird = require("bluebird");

// add async to all node redis functions
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

module.exports = redisClient;