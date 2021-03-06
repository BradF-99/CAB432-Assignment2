require('dotenv').config();

const express = require('express');
const router = express.Router();

const Twitter = require('twitter');
const client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

const {
  SentimentManager
} = require('node-nlp');

const sentiment = new SentimentManager();

const redisClient = require("../modules/redisDriver");
const azureClient = require("../modules/azureDriver");
const loggerUtil = require("../modules/logger.js");

router.get('/',  async (req, res, next) => {
  try {
    res.send('No hashtag specified');
  } catch (e) {
    next(e);
  }
});

router.get('/:query', async (req, res, next) => {
  if (req.params.query !== "") {
    try {
      const tweets = await getTwitterData(req.params.query);
      const data = await processTweets(tweets[0]);
      res.append('X-DataSource', tweets[1]);
      return res.json(data);
    } catch (e) {
      loggerUtil.error(e);
      next(e); // this should end up in the error handler
    }
  } else {
    res.send('No hashtag specified');
  }
});

async function getTwitterData(query) {
  let data = [];
  let redisResult = [];
  let key = "twitter:" + query;
  let source = "";

  return new Promise(function (resolve, reject) {
    try {
      // check redis first
      redisClient.scanAsync(0, key, redisResult,2).then(async function () {
        if (redisResult.length == 0) { // if it isn't in redis
          const azureResults = await azureClient.returnBlobNames(); // pull all blob names from azure
          // if it is in azure pull blob, cache in redis and serve
          if (azureResults.includes(query)) {
            const azureBlob = await azureClient.downloadBlob(query);
            data = JSON.parse(azureBlob);
            await addToRedis(query, data);
            source = "Azure";
            resolve([data,source]);
          } else { // not in either so grab from twitter
            const data = await downloadTwitterData(query);
            await addToAzure(query, data);
            await addToRedis(query, data);
            source = "Twitter";
            resolve([data,source]);
          }
        } else {
          // serve from redis
          const redisHash = await redisClient.getHashData(key);
          const values = Object.values(redisHash);
          values.forEach(function (value) {
            data.push(JSON.parse(value));
          });
          source = "Redis";
          resolve([data,source]);
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

async function downloadTwitterData(query) {
  return new Promise(function (resolve, reject) {
    let data = [];

    client.get('search/tweets', {
      q: "#" + query + " -filter:retweets lang:en",
      count: 100
    }, function (error, tweets) {
      if (!error) {
        for (i = 0; i < tweets.statuses.length; i++) {
          tweet = tweets["statuses"][i];

          let processedTweet = {};
          processedTweet["id"] = tweet["id_str"];
          processedTweet["text"] = tweet["text"];
          processedTweet["date"] = tweet["created_at"];
          processedTweet["userInfo"] = {};
          processedTweet["userInfo"]["name"] = tweet["user"]["name"];
          processedTweet["userInfo"]["screenName"] = tweet["user"]["screen_name"];

          data.push(processedTweet);
        }
        resolve(data);
      } else {
        reject(error);
      }
    });
  });
}

async function processTweets(tweets) { // guess lang and check sentiment
  let data = [];
  let sentimentQueue = [];

  tweets.forEach(function (tweet) {
    sentimentQueue.push(getSentiment(tweet));
  });

  const sentimentResults = await Promise.all(sentimentQueue);
  for (const sentimentResult of sentimentResults) {
    data.push(sentimentResult);
  }

  return data;
}

async function getSentiment(tweet) {
  return new Promise(function (resolve, reject) {
    sentiment
      .process(tweet["language"], tweet["text"]) // language, tweet body
      .then(function (result) {
        const data = tweet;
        data["sentiment"] = result["vote"];
        resolve(data); // tweet data + lang + sentiment
      })
      .catch(function (e) {
        reject(e);
      });
  });
}

async function addToRedis(query, data) {
  let hashQueue = [];
  try {
    data.forEach(function (tweet) {
      // Key is hashtag, field is the tweet ID and value is the tweet body
      const key = "twitter:" + query
      hashQueue.push(redisClient.setHashData(key, tweet["id"], JSON.stringify(tweet)))
      hashQueue.push(redisClient.expireKey(key, 300)) // expire in 5 mins
    });
    await Promise.all(hashQueue);
  } catch (e) {
    throw (e);
  }
}

async function addToAzure(query, data) {
  return new Promise(function (resolve, reject) {
    try {
      // Data is value, query is "key" or blob name
      azureClient.uploadBlob(JSON.stringify(data), query)
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}

module.exports = router;