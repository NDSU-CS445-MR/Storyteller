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
  //console.log('[jargon] received message from dispatch:', message);
  process.send('starting analysis');
	switch(message.head){
		case 'initialize':{
      console.log('[jargon] Recieved message',message.data)
      activeBoard = message.data;
      firebase.initializeApp(config)
      fbConnection = firebase.database().ref();
			firebaseBoardRef = fbConnection.child('boards').child(message.data);
      firebaseStoriesRef = firebaseBoardRef.child('stories');
      firebaseBoardRef.child('blackList').on('value',function(snap){
        blacklist = snap.val();
        console.log(snap.val());
      });
      if(blacklist != " "){
			  beginAnalysis();
      }
      break;
		}
		case 'disconnect':{
      console.log('[jargon] Recieved kill message');
			process.disconnect();
      break;
		}
}
});

var beginAnalysis = function() {
  firebaseBoardRef.child('edited').child('jargon').on('value',function(snap){
		if(!isActive && snap.val()){
      storiesCache = [];
			isActive = true;
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
  var jargonTerms = blacklist; //this will be repaced by firebase list
  var counter = 0;
  var counter2 = 0;
  var detectedJargon = [];
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
  var firebaseJargonRef = firebaseStoriesRef.child(story.id).child('analysisLog').child('jargon').set(detectedJargon);
 }
