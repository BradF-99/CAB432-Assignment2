const searchButton = document.getElementById("searchBtn");
const searchBar = document.getElementById("searchBar");
const twitterText = document.getElementById("twitterText");

google.load("visualization", "1", {packages:["corechart"]});

searchBar.addEventListener("keyup", () => {
  if (event.keyCode === 13) {
    event.preventDefault();
    var hashtagSearch = searchBar.value;

    retrieveTweets(hashtagSearch);

    searchBar.value = '';
  }
});

function retrieveTweets(hashtag) {
  fetch("http://127.0.0.1:3000/twitter/" + hashtag)
    .then(function(response) {
      if (response.ok) {
        return response.json();
      }
      throw new Error('Network response was not ok.');
    })
    .then(function(result) {
      //Clear previous tweets.
      document.getElementById("mainSection").innerHTML = '';
      document.getElementById("pieChart").innerHTML = '';

      //Check if any tweets were found with the users provided hashtag.
      if (result.length === 0) {
        const errorDiv = document.createElement("div");
        const errorMessageP = document.createElement("p");

        errorDiv.className = "error";

        errorMessageP.innerHTML = "No tweets could be found with the hashtag " + hashtag + ".";

        errorDiv.appendChild(errorMessageP);
        document.getElementById("mainSection").appendChild(errorDiv);

        console.log("Could not find tweets with the hashtag " + hashtag + ".");
      } else if (result.length > 0) {

        //Track the number of positive, negative and neutral tweets.
        var numPositiveTweets = 0;
        var numNeutralTweets = 0;
        var numNegativeTweets = 0;

        //twitterText.innerHTML = result[0][0];
        for (let i = 0; i < result.length; i++) {

          //Count the connotations for tweets.
          switch(result[i].sentiment) {
            case "positive":
              numPositiveTweets++;
              break;
            case "neutral":
              numNeutralTweets++;
              break;
            case "negative":
              numNegativeTweets++;
              break;
          }

          createTweetHTMLElements(result[i].userInfo, result[i].text, result[i].sentiment, result[i].date);
        }

        drawChart(numPositiveTweets, numNeutralTweets, numNegativeTweets);
      }
    })
    .catch(function(error) {
      console.log('There has been a problem with your fetch operation: ', error.message);
    });
}

function createTweetHTMLElements(userInfo, tweetText, sentiment, timeStamp) {
  //Create new elements.
  const tweetDiv = document.createElement("div");
  const userNameP = document.createElement("p");
  const userScreenNameP = document.createElement("p");
  const timeStampP = document.createElement("p");
  const textP = document.createElement("p");
  const sentimentP = document.createElement("p");

  //Add the text to the html elements.
  userNameP.innerHTML = userInfo.name;
  userScreenNameP.innerHTML = "@" + userInfo.screenName;
  timeStampP.innerHTML = timeStamp;
  textP.innerHTML = tweetText;
  sentimentP.innerHTML = sentiment;

  //Change HTML element's style.
  userNameP.style.display = "inline-block";
  userNameP.style.marginRight = "10px";
  userNameP.style.fontWeight = "900";

  userScreenNameP.style.display = "inline-block";
  userScreenNameP.style.color = "#66b5ff";

  timeStampP.style.float = "right";

  //Change colour of connotation based on the connotation.
  switch(sentiment) {
    case "positive":
      sentimentP.style.color = "green";
      break;
    case "neutral":
      sentimentP.style.color = "orange";
      break;
    case "negative":
      sentimentP.style.color = "red";
      break;
  }


  tweetDiv.className = "tweet";

  tweetDiv.appendChild(userNameP);
  tweetDiv.appendChild(userScreenNameP);
  tweetDiv.appendChild(timeStampP);
  tweetDiv.appendChild(textP);
  tweetDiv.appendChild(sentimentP);

  document.getElementById("mainSection").appendChild(tweetDiv);
  //document.body.insertBefore(newDiv, currentDiv);
}

// Draw the chart and set the chart values
function drawChart(numPositiveTweets, numNeutralTweets, numNegativeTweets) {

  var data = google.visualization.arrayToDataTable([
    ['Task', 'Connotation of Tweets'],
    ['Positive Tweets', numPositiveTweets],
    ['Neutral Tweets', numNeutralTweets],
    ['Negative Tweets', numNegativeTweets]
  ]);

  // Optional; add a title and set the width and height of the chart
  var options = {'title':'Connotation of Tweets', 'width':528, 'height':400,
   'backgroundColor':'grey', 'colors':['green','orange', 'red']};

  // Display the chart inside the <div> element with id="piechart"
  var chart = new google.visualization.PieChart(document.getElementById('pieChart'));
  chart.draw(data, options);
}
