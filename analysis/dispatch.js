var firebase = require('firebase');
var child_process = require('child_process');
var config = require('../public/fb-config.js').fb_configRef();

var flags = {
  isJargonActive: false,
  isDuplicateActive: false
}
var initializeMessage;
var storiesCache = [];

var killMessage = {
  head:'disconnect'
}

var interpretMessageFromChild = function(flag,message){
    switch(message){
      case 'starting analysis':{
        flags[flag] = true;
        console.log(flags.isJargonActive);
      }
      case 'analysis complete':{
        flags[flag] = false;
      }
    }
  };

var analysisManager = function(){
  firebase.initializeApp(config)
  var boardRef = firebase.database().ref().child('boards');
  boardRef = boardRef.child(initializeMessage.data);
  var duplicateAnalysis = {};
  var jargonAnalysis = {};
  //Watch for chnge to Duplicate analysis configuration and react accordingly
  boardRef.child('duplicateEnabled').on('value',function(snap){
    if(snap.val() && !flags.isDuplicateActive){
        duplicateAnalysis = child_process.fork('./analysis/duplicates');
        duplicateAnalysis.send(initializeMessage);
        flags.isDuplicateActive = true;
    }
    if(!snap.val() && flags.isDuplicateActive){
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
      jargonAnalysis.kill('SIGINT');
      flags.isJargonActive = false;
    }
  });
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
