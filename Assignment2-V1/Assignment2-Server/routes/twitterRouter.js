const express = require('express');
const router = express.Router();

// to do replace keys with env vars or config file
const Twitter = require('twitter');
const client = new Twitter({
  consumer_key: 'oKVH5nvDsrg80ukJ8LdjUKUg3',
  consumer_secret: 'FS3FlUCmgUtc9TUJ29M3SM6FyFyZ28bGAipjK67N0GsB5Gdpa8',
  access_token_key: '1181039439675412481-zXRgkfl5Sr30GlHm77xBihP4TNfgDV',
  access_token_secret: 'Otk1RnnFfZksxLpDe9cDtf0Olxr3BxCRvgYcOHee2lfNB'
});

const { SentimentManager } = require('node-nlp');
const sentiment = new SentimentManager();

router.get('/:query', async (req, res) => {
  if (req.params.query) {
    try {
      const tweetQueue = await getTwitterData(req.params.query);
      const data = await processTweets(tweetQueue);
      return res.json(data);
    } catch (e) {
      next(e); // this will end up in the error handler
    }
  } else {
    res.send('respond with a resource');
  }
});

async function getTwitterData(query){
  return new Promise(function(resolve,reject){
    let fetchQueue = [];
    let data = [];

    client.get('search/tweets', {q:"#"+query, count:100}, function(error, tweets, response) {
      if (!error) {
        for(i = 0; i < tweets.statuses.length; i++){
            fetchQueue.push(getSentiment(tweets["statuses"][i]["text"]));
        }
        resolve(fetchQueue)
      } else {
        reject(error);
      }
    });
  })
}

async function processTweets(fetchQueue){
  let data = [];

  const results = await Promise.all(fetchQueue);
  for (const result of results) {
    data.push(result)
  }
  return data;
}

async function getSentiment(tweet){
  return new Promise(function(resolve,reject){
    sentiment
      .process('en',tweet)
      .then(function(result){
        resolve([tweet,result]);
      })
      .catch(function(e){
        reject(e);
      });
  });
}

async function guessLanguage(tweet){
  // actually write something here 
}

module.exports = router;
