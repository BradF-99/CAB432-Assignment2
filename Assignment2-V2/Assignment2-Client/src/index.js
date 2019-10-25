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

      //Track the number of positive, negative and neutral tweets.
      var numPositiveTweets = 0;
      var numNeutralTweets = 0;
      var numNegativeTweets = 0;

      //twitterText.innerHTML = result[0][0];
      for (let i = 0; i < 100; i++) {

        //Count the connotations for tweets.
        switch(result[i][2]) {
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

        createTweetElement(result[i][0], result[i][2]);
      }

      drawChart(numPositiveTweets, numNeutralTweets, numNegativeTweets);
    })
    .catch(function(error) {
      console.log('There has been a problem with your fetch operation: ', error.message);
    });
}

function createTweetElement(tweetInfo, connotation) {
  //Create new elements.
  var newDiv = document.createElement("div");
  var para1 = document.createElement("p");
  var para2 = document.createElement("p");

  //Add the text to the paragraphs.
  para1.innerHTML = tweetInfo + " ";
  para2.innerHTML = connotation;

  //Change colour of connotation based on the connotation.
  switch(connotation) {
    case "positive":
      para2.style.color = "green";
      break;
    case "neutral":
      para2.style.color = "orange";
      break;
    case "negative":
      para2.style.color = "red";
      break;
  }


  newDiv.className = "tweet";

  newDiv.appendChild(para1);

  newDiv.appendChild(para2);

  document.getElementById("mainSection").appendChild(newDiv);
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
