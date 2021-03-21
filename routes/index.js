var express = require('express');
var router = express.Router();


var arr = []; //globle 

function findFirstOccurance(entry) {
  for (let i = 0; i < arr.length; i++) {  
    return entry === arr[i].userName;      
  }
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/add', function(request, response){

  var lock = false; //lock after insert new entry! 
  dt = {
    userName: request.body.userName,
    points: request.body.points, // an int
    timestamp: new Date()
  };
  //TODO: got to think atomic
    if(arr.length === 0){
      arr.push(dt);
    }else{
        for (let i = 0; i < arr.length; i++) {  
            if(arr[i].userName === dt.userName && lock === false){ //update
              console.log("updating.....")
              arr[i].points = parseInt(arr[i].points) + parseInt(dt.points);
              arr[i].timestamp = new Date(); //update time
              break;
            }
            if( i === arr.length -1 && lock === false){// if loop through array means that there is no duplicate
              console.log("add new entry");
              arr.push(dt);
              lock = true;
            }
            //TODO: error handling
        }
    }   // else
  // console.log(arr);
  response.send(JSON.stringify(arr));
});
 
router.post('/data', function(req, res) {
  console.log("money to spend:" +req.body.spend);
  var extravagant = req.body.spend;

  if (arr.length > 1) { 
    arr.sort((x, y)=>{ // sort array to ascending order from timestamp
      return x.timestamp - y.timestamp;  //build-in filter works like magic~
    });
    console.log(arr);
    for (let i = 0; i < arr.length; i++) {
        var points = arr[i].points;
        if (extravagant >= points) {
          extravagant -= points;
          arr[i].points = 0; // no negative points
        }
        if (extravagant < points) {
          arr[i].points -= extravagant;
          extravagant = 0;
        }
    }
    res.send(JSON.stringify(arr));
  }else{
    res.send(JSON.stringify(arr));
  }
});

module.exports = router;
