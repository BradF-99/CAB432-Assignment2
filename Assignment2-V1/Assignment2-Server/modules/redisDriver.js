const redis = require("redis");
const REDIS_URL = process.env.REDIS_URL || "//149.28.165.104:4320";
const redisClient = redis.createClient(REDIS_URL,{password:"CAB4322019"}); // replace for production deploy
const bluebird = require("bluebird");

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
    return redisClient.scanAsync(cursor, 'MATCH', pattern, 'COUNT', '1000')
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

module.exports = {
    redisClient: redisClient,
    getHashData: getHashData,
    setHashData: setHashData,
    scanAsync: scanAsync
};