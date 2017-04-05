var firebase = require('firebase');
var child_process = require('child_process');
var flags = {
  isJargonActive: false,
  isDuplicateActive: false
}
var initializeMessage;
var storiesCache = [];

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

var spawnAnalysis = function(){
  var duplicateAnalysis = child_process.fork('./analysis/duplicates');
  var jargonAnalysis = child_process.fork('./analysis/jargon');
  
  duplicateAnalysis.send(initializeMessage);
  jargonAnalysis.send(initializeMessage);
  
  duplicateAnalysis.on('message',function(message){
    console.log(message);
    interpretMessageFromChild('isDuplicateActive',message)
  });
  jargonAnalysis.on('message',function(message){
    interpretMessageFromChild('isJargonActive',message)
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
      spawnAnalysis()
        
    }
  }
});



// ***Please leave this, I many need it in the future to support multiple boards. <3 Scott***

  //var syncTasks = function(boardsList){
  //   var tasksToSpawn;
  //   var tasksToKill;
  //   var compositeList = boardsList;
  //   activeBoards.forEach(function(board){
  //     if(!compositeList.filter(containsBoard(board.id)){
  //       compositeList.push(board.id);
  //     }
  //   });
  //   compositeList.forEach(function(board){
  //     if(!activeBoards.indexOf(board) && boardsList.indexOf()){
        
  //     }
  //   });
  // }
  // var containsBoard = function(boardId,)
  // {

  // }
  

// child.js
