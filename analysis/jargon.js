var firebase = require('firebase');
var config = require('../public/fb-config.js').fb_configRef();
var storiesCache = [];
var fbConnection;
var firebaseStoriesRef;
var firebaseBoardRef;
var isActive = false;
var activeBoard;
var blacklist;

process.on('message', function(message) {
  process.send('starting analysis');
	switch(message.head){
		case 'initialize':{
      //console.log('[jargon] Recieved message',message.data)
      activeBoard = message.data;
      firebase.initializeApp(config)
      fbConnection = firebase.database().ref();
			firebaseBoardRef = fbConnection.child('boards').child(message.data);
      firebaseStoriesRef = firebaseBoardRef.child('stories');
      //Retrieve list of words to look for from firebase
      firebaseBoardRef.child('blackList').on('value',function(snap){
        blacklist = snap.val();
      });
      if(blacklist != " "){
			  beginAnalysis();
      }
      break;
		}
}
});

var beginAnalysis = function() {
  firebaseBoardRef.child('edited').child('jargon').on('value',function(snap){
    //Prevents multiple instances of analysis from running simaltaneously
		if(!isActive && snap.val()){
      storiesCache = [];
			isActive = true;
      //flips flag to indicate this batch of stories has been analyzed
      firebaseBoardRef.child('edited').child('jargon').set(false);
			firebaseStoriesRef.once('value',function(stories){
			stories.forEach(function(story){
			var tempStory = {
				id: story.key,
				data: story.val()
			};
			storiesCache.push(tempStory);
    });
      storiesCache.forEach(function(story){
        jargonChecker(story);
      })
			isActive = false;
		});
    }
  });
}

function jargonChecker(story){
  var storyBody = story.data.body.split(" ");
  var jargonTerms = blacklist;
  var counter = 0;
  var counter2 = 0;
  var detectedJargon = [];
  //Iterate through each word from the story and look for black listed words
  while(storyBody[counter] != null){
   while(jargonTerms[counter2] != null){
    if(storyBody[counter] == jargonTerms[counter2]){
     detectedJargon.push(storyBody[counter]);
    }
    counter2++;
   }
   counter++;
   counter2=0;
  }
  //Adds list of words caught by analysis to the story
  if(detectedJargon){
    firebaseStoriesRef.child(story.id).child('analysisLog').child('jargon').set(detectedJargon);
  }
 }
