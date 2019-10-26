require('dotenv').config();
const redis = require("redis");
const REDIS_URL = process.env.REDIS_URL || "//0.0.0.0:6379";
const redisClient = redis.createClient(REDIS_URL,{password:process.env.REDIS_PASS}); // replace for production deploy
const bluebird = require("bluebird");
const loggerUtil = require("./logger.js");

// add async to all node redis functions
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

async function getHashData(key) {
    return new Promise(function (resolve, reject) {
        redisClient.hgetall(key, function (err, result) {
            if (err) {
                reject(err)
            } else {
                resolve(result)
            }
        });
    });
}

async function setHashData(key, field, value) {
    return new Promise(function (resolve, reject) {
        redisClient.hset(key, field, value, function (err, result) {
            if (err) {
                reject(err)
            } else {
                resolve(result)
            }
        });
    });
}

async function scanAsync(cursor, pattern, results) {
    return redisClient.scanAsync(cursor, 'MATCH', pattern, 'COUNT', '5')
        .then(function (res) {
            let keys = res[1];
            keys.forEach(function (key) {
                results.push(key);
            })
            cursor = res[0];
            if (!cursor === '0') {
                return scanAsync(cursor, pattern, results);
            }
        });
}

redisClient.on('connect', () => {
    loggerUtil.log("Established connection to Redis.");
  });
  
  redisClient.on('error', err => {
    loggerUtil.error("Unable to connect to Redis, terminating.")
    loggerUtil.error(`${err}`);
    process.exit(1);
  });

module.exports = {
    getHashData: getHashData,
    setHashData: setHashData,
    scanAsync: scanAsync
};