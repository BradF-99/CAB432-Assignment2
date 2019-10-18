var express = require('express');
var router = express.Router();

const Twitter = require('twitter');
const client = new Twitter({
  consumer_key: 'oKVH5nvDsrg80ukJ8LdjUKUg3',
  consumer_secret: 'FS3FlUCmgUtc9TUJ29M3SM6FyFyZ28bGAipjK67N0GsB5Gdpa8',
  access_token_key: '1181039439675412481-zXRgkfl5Sr30GlHm77xBihP4TNfgDV',
  access_token_secret: 'Otk1RnnFfZksxLpDe9cDtf0Olxr3BxCRvgYcOHee2lfNB'
});

/* GET users listing. */
router.get('/:query', function(req, res, next) {
  if(req.params.query){
    returnTwitterData(res,req.params.query) 
  } else {
    res.send('respond with a resource');
  }
});

async function returnTwitterData(res,query){
  const data = await getTwitterData(query)
  return res.json(data);
}

async function getTwitterData(query){
  return new Promise(function(resolve,reject){
    data = [];
    client.get('search/tweets', {q:"#"+query, count:100}, function(error, tweets, response) {
      if (!error) {
        for(i = 0; i < tweets.statuses.length; i++){
            tweet = tweets["statuses"][i]["text"];
            data.push(tweet)
        }
        resolve(data)
      } else {
          reject(error)
      }
    });
  })
}

module.exports = router;
