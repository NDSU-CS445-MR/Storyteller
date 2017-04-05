var firebase = require('firebase');
var storiesCache = [];
var fbConnection;
var firebaseStoriesRef;
var firebaseBoardRef;
var isActive = false;

process.on('message', function(message) {
  //console.log('[jargon] received message from dispatch:', message);
  process.send('starting analysis');
	switch(message.head){
		case 'initialize':{
      fbConnection = firebase.initializeApp(message.data).database().ref();
			firebaseBoardRef = fbConnection.child('boards').child('-KdwTvkimpR2Rq9YB38L');
      firebaseStoriesRef = firebaseBoardRef.child('stories');
			beginAnalysis();
		}
		case 'disconnect':{
			process.disconnect();
		}
}
});

var beginAnalysis = function() {
  firebaseBoardRef.child('edited').on('value',function(snap){
		if(!isActive && snap.val()){
      console.log(!isActive, snap.val());
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
  console.log(story.id);
  var storyBody = story.data.body.split(" ");
  var jargonTerms = ['test','java','batch']; //this will be repaced by firebase list
  var counter = 0;
  var counter2 = 0;
  var detectedJargon = [];
  while(storyBody[counter] != null){
   while(jargonTerms[counter2] != null){
    if(storyBody[counter] == jargonTerms[counter2]){
     console.log('[jargon] jargon detected on story: ',story.id);
     console.log('DETAILS: ',story.data.body);
     detectedJargon.push(storyBody[counter]);
    }
    counter2++;
   }
   counter++;
   counter2=0;
  }
  var firebaseJargonRef = firebaseStoriesRef.child(story.id).child('analysisLog').child('jargon');
  firebaseJargonRef.once('value',function(snap){
    if(snap.val() != detectedJargon){
      firebaseJargonRef.set(detectedJargon);
    }
  });
 }
