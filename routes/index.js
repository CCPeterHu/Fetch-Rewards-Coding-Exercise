const { response } = require('express');
var express = require('express');
var router = express.Router();


// var arr = []; //globle 
// change the sudoDB name to arr if you want to test.
var arr = [{ "payer": "DANNON", "points": 1000, "timestamp": "2020-11-02T14:00:00Z" },
{ "payer": "UNILEVER", "points": 200, "timestamp": "2020-10-31T11:00:00Z" },
{ "payer": "DANNON", "points": -200, "timestamp": "2020-10-31T15:00:00Z" },
{ "payer": "MILLER COORS", "points": 10000, "timestamp": "2020-11-01T14:00:00Z" },
{ "payer": "DANNON", "points": 300, "timestamp": "2020-10-31T10:00:00Z" }
]

var arr1 = [{ "payer": "DANNON", "points": 1000, "timestamp": "2020-11-02T14:00:00Z" },
{ "payer": "UNILEVER", "points": 200, "timestamp": "2020-10-31T11:00:00Z" },
{ "payer": "UNILEVER", "points": 200, "timestamp": "2020-10-31T11:30:00Z" },
{ "payer": "DANNON", "points": -200, "timestamp": "2020-10-31T15:00:00Z" },
{ "payer": "MILLER COORS", "points": 10000, "timestamp": "2020-11-01T14:00:00Z" },
{ "payer": "DANNON", "points": 300, "timestamp": "2020-10-31T10:00:00Z" }
]

var arr3 = [{ "payer": "DANNON", "points": 1000, "timestamp": "2020-11-02T14:00:00Z" },
{ "payer": "UNILEVER", "points": 200, "timestamp": "2020-10-31T11:00:00Z" },
{ "payer": "UNILEVER", "points": 200, "timestamp": "2020-10-31T11:30:00Z" },
{ "payer": "DANNON", "points": -200, "timestamp": "2020-10-31T15:00:00Z" },
{ "payer": "MILLER COORS", "points": 10000, "timestamp": "2020-11-01T14:00:00Z" },
{ "payer": "DANNON", "points": 300, "timestamp": "2020-10-31T10:00:00Z" },
{ "payer": "DANNON", "points": 100, "timestamp": "2020-10-31T10:30:00Z" }
]

var balance = [];

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: '~~Fetch Rewards~~' });
});

router.post('/add', function (request, response) {

  var lock = false; //lock after insert new entry! 
  // since I did authetification from HTML, no checking for data legality 
  dt = {
    payer: request.body.userName,
    points: request.body.points, // an int
    timestamp: new Date()
  };

  // I am thinking about sync but for simplicity, just save my time
  arr.push(dt);// simply push new entry to sudoDB
  console.log(arr);
  response.send(JSON.stringify(arr));
});

router.post('/data', function (req, res) {
  const pointsToSpend = req.body.spend;
  if (pointsToSpend < 0) {
    console.error("illegal: spending points is less than 0");
    res.send("spending points cannot be negative.");
  }
  console.log("points to spend:" + JSON.stringify({ points: pointsToSpend }));
  var sorted = []; // a sorted responseToPoints for ordered arr by timestamp
  var remainingPointsFromSpend = pointsToSpend;
  var responseToPoints = [];

  if (arr.length > 1) {
    sorted = arr.slice().sort((x, y) => { // sort responseToPoints to ascending order from timestamp
      return new Date(x.timestamp).getTime() - new Date(y.timestamp).getTime();
    });
  }
  // console.log("sorted data:" + JSON.stringify(sorted));
  // critical section of data, must async!
  async function getResponseToPoints(sorted) {  
    
    for (let index = 0; index < sorted.length; index++) {
      const element = sorted[index]; // save space 
      if (remainingPointsFromSpend === 0) {
        break;
      }
      if (remainingPointsFromSpend > element.points) {
        remainingPointsFromSpend -= element.points;
        responseToPoints.push({ payer: element.payer, points: -element.points });
      } 
      if (remainingPointsFromSpend === element.points) {
        remainingPointsFromSpend -= element.points;
        responseToPoints.push({ payer: element.payer, points: -element.points });
        break;
      }
      if(remainingPointsFromSpend < element.points) { // remain < points,do spanning
        responseToPoints.push({ payer: element.payer, points: -remainingPointsFromSpend });
        remainingPointsFromSpend = 0;
        break;
      }
    }
  }
  getResponseToPoints(sorted);

  console.log("response to points: " + JSON.stringify(responseToPoints));

  function dedupeObjArrayByName(array){
    var acumulativePoints = 0;
    // var visitedIndices = [];

    for (let i = 0; i < array.length; i++) {
      const firstOccurance = array[i];
      acumulativePoints = firstOccurance.points;
      // if (visitedIndices.includes(i) ) {
      //   continue;
      // }
      for (let j = i + 1; j < array.length; j++) {
        const restOccurance = array[j];
        if (firstOccurance.payer === restOccurance.payer) {
          // visitedIndices.push(j + 1);
          acumulativePoints += restOccurance.points;
          array.splice(j, 1);
          j -= 1; // magic don't move plz
          console.log("cumulative points:" + restOccurance.payer + ": " + acumulativePoints);
          firstOccurance.points = acumulativePoints;
        }
      }
    }
    // console.log("sorted data:" + JSON.stringify([...new Set(array)]) );
    return array;
  }
  
  responseToPoints = dedupeObjArrayByName(responseToPoints);

  // sync points to balance 
  var tempArr = [];
  tempArr = arr;
  tempArr = dedupeObjArrayByName(tempArr);

  // console.log("temp array data:" + JSON.stringify(tempArr) );

  for (let i = 0; i < tempArr.length; i++) {
    const itemToSpend = tempArr[i];
    for (let j = 0; j < responseToPoints.length; j++) {
      const spendingObj = responseToPoints[j];
      if (itemToSpend.payer === spendingObj.payer) {
        var points = itemToSpend.points + spendingObj.points;
        balance.push({[itemToSpend.payer]: points});
      }
    }
  }
  // console.log("balanced data:" + JSON.stringify(balance));

  res.send(JSON.stringify(responseToPoints ) );
});

router.get('/balance', function (request, response){
  console.log("balnce has been called");
  response.send(JSON.stringify(balance));
});

module.exports = router;
