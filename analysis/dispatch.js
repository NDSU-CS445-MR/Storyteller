var firebase = require('firebase');
var child_process = require('child_process');
var config = require('../public/fb-config.js').fb_configRef();

var flags = {
  isJargonActive: false,
  isDuplicateActive: false
}
var initializeMessage;
var storiesCache = [];

var analysisManager = function(){
  firebase.initializeApp(config)
  var boardRef = firebase.database().ref().child('boards');
  boardRef = boardRef.child(initializeMessage.data);
  var duplicateAnalysis = {};
  var jargonAnalysis = {};

  //Watch for change in Duplicate analysis configuration and react accordingly
  boardRef.child('duplicateEnabled').on('value',function(snap){
    if(snap.val() && !flags.isDuplicateActive){
        duplicateAnalysis = child_process.fork('./analysis/duplicates');
        duplicateAnalysis.send(initializeMessage);
        flags.isDuplicateActive = true;
    }
    if(!snap.val() && flags.isDuplicateActive){
      //Termintates child process
      duplicateAnalysis.kill('SIGINT');
      flags.isDuplicateActive = false;
    }
  });
  
  //Watch for change in Jargon analysis configuration and react accordingly
   boardRef.child('jargonEnabled').on('value',function(snap){
    if(snap.val() && !flags.isJargonActive){
        jargonAnalysis = child_process.fork('./analysis/jargon');
        jargonAnalysis.send(initializeMessage);
        flags.isJargonActive = true;
    }
    if(!snap.val() && flags.isJargonActive){
      //Terminate child process
      jargonAnalysis.kill('SIGINT');
      flags.isJargonActive = false;
    }
  });
  //Watch for change in board active state and react accordingly
  boardRef.child('active').on('value',function(snap){
    if(!snap.val()){
      if(flags.isDuplicateActive){
        duplicateAnalysis.kill('SIGINT');
      }
      if(flags.isJargonActive){
      jargonAnalysis.kill('SIGINT');
    }
    }
  });
}

//Interprets message from parent and starts analysis child management for the board
process.on('message', function(message) {
  console.log('[DISPATCH] received message from server:', message);
  switch(message.head){
    case 'fbRef':{
      initializeMessage = {
        head: 'initialize',
        data: message.data
      };
      analysisManager()
    }
  }
});
