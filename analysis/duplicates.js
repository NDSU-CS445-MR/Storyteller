var firebase = require('firebase');
var config = require('../public/fb-config.js').fb_configRef();
var firebaseStoriesRef;
var firebaseBoardRef;
var isEdited = true;
var isActive = false;
var storiesCache = [];
var boardKey;

//Listens and responds to messages from the board's dispatcher
process.on('message', function(message) {
	switch(message.head){
		case 'initialize':{
			//console.log('[duplicate] Recieved message: ',message.data);
			boardKey = message.data;
			firebase.initializeApp(config)
			firebaseBoardRef = firebase.database().ref().child('boards').child(message.data);
			firebaseStoriesRef = firebaseBoardRef.child('stories');
		    beginAnalysis();
			break;
		}
		case 'disconnect':{
			process.disconnect();
			break;
		}
	}
});
//retrieves a list of all stories and begins analysis
var beginAnalysis = function(){
	firebaseBoardRef.child('edited').child('duplicate').on('value',function(snap){
		//Prevents multiple instances of analysis executing at once
		if(!isActive && snap.val()){
			storiesCache = [];
			//console.log('Starting duplicate analysis');
			isActive = true;
			firebaseBoardRef.child('edited').child('duplicate').set(false);
			//Listens to story object, if a story is changed analysis is initiated
			firebaseStoriesRef.once('value',function(stories){
			stories.forEach(function(story){
			var tempStory = {
				id: story.key,
				data: story.val()
			};
			storiesCache.push(tempStory);
		});
		storiesCache.forEach(function(story){
			findDuplicates(story);
		});
			isActive = false;
		});
		}
	});
}

//Updates the current log for the story being analized
var logResults = function(story,updatedLog){
	var currentLog =[];
	firebaseStoriesRef.child(story.id).child('analysisLog').child('duplicates').remove().then(function(){
		updatedLog.forEach(function(log){
			firebaseStoriesRef.child(story.id).child('analysisLog').child('duplicates').push(log);
		});
	});
	return
}

var findDuplicates = function(storyCheck) {

  var storyCheckBody = storyCheck.data.body;
  storyCheckBody= storyCheckBody.toLowerCase(); //converting to lowercase for comparison
  //Trimming required words, punctuation, and articles
  storyCheckBody = storyCheckBody.replace(/as a /g, ''); 
  storyCheckBody = storyCheckBody.replace(/i want /g, '');
  storyCheckBody = storyCheckBody.replace(/ so that |so that/g, ' ');
  storyCheckBody = storyCheckBody.replace('?', '');
  storyCheckBody = storyCheckBody.replace('.', '');
  storyCheckBody = storyCheckBody.replace(/,/g, '');
  storyCheckBody = storyCheckBody.replace(/!/g, '');
  storyCheckBody = storyCheckBody.replace(/ the /g, ' ');
  storyCheckBody = storyCheckBody.replace(/ a /g, ' ');
  storyCheckBody = storyCheckBody.replace(/ an /g, ' ');
  storyCheckBody = storyCheckBody.replace(/ i /g, ' ');
  storyCheckBody = storyCheckBody.replace(/ me /g, ' ');
  storyCheckBody = storyCheckBody.replace(/ you /g, ' ');
  var tempArray = storyCheckBody.split(" "); //Creating an Array of words from storyCheck
  var storySet = new Set(); //adding all array values to set to remove duplicates
  for (var i = 0, l=tempArray.length; i < l; i++)
  {
	storySet.add(tempArray[i]);
  }
  //reverting to an array of  unique words for ease of comparison
  var storyArray = Array.from(storySet);
  var updatedLog = [];
 storiesCache.forEach(function(comparedStory)
	{
		if(storyCheck.id != comparedStory.id && storyCheck.data.status == comparedStory.data.status){
		var counter = 0; //increments for each duplicate 

		var comparedStoryBody = comparedStory.data.body;
		comparedStoryBody=comparedStoryBody.toLowerCase(); //trim
		comparedStoryBody = comparedStoryBody.replace(/as a /g, '');
		comparedStoryBody = comparedStoryBody.replace(/i want /g, '');
		comparedStoryBody = comparedStoryBody.replace(/ so that |so that/g, ' ');
		comparedStoryBody = comparedStoryBody.replace('?', '');
		comparedStoryBody = comparedStoryBody.replace('.', '');
		comparedStoryBody = comparedStoryBody.replace(/'/g, '');
		comparedStoryBody = comparedStoryBody.replace(/!/g, '');
		comparedStoryBody = comparedStoryBody.replace(/ the /g, ' ');
		comparedStoryBody = comparedStoryBody.replace(/ a /g, ' ');
		comparedStoryBody = comparedStoryBody.replace(/ an /g, ' ');
		comparedStoryBody = comparedStoryBody.replace(/ i /g, ' ');
		comparedStoryBody = comparedStoryBody.replace(/ me /g, ' ');
		comparedStoryBody = comparedStoryBody.replace(/ you /g, ' ');
		var cStoryArray = comparedStoryBody.split(" "); // create an array
	for (var i = 0, l=storyArray.length; i < l; i++) //loop to iterate through words of storyArray
		{
			for (var k = 0, s=cStoryArray.length; k < s; k++)//loop to iterate through words of cStoryArray
			{
				if (storyArray[i] === cStoryArray[k]) //increments counter and stops searching on match
				{	counter++;
					break;
				}
			}
		}
		if(counter != 1 && storyArray.length != 1){
			var potentialThreshold = 60; //change this to adjust detection sensativity (Higher = less sensative)
			var strongThreshold = 85;//change this to adjust the detection sensativity (Higher = less sensative)
			if (counter /(storyArray.length) *100 >= strongThreshold ) //Strong duplicate calculation
			{				
				//create new log object to show details in duplicate detection	
				var newLog = {
					story: comparedStory.id,
					details: 'strong duplicate detected',
				};
				updatedLog.push(newLog);
			}
			else if (counter /(storyArray.length) *100 >= potentialThreshold) //Potential duplicate calculation
			{
				var newLog = {
					story: comparedStory.id,
					details: 'possible duplicate detected',
				};
				updatedLog.push(newLog);
			}
		}
	
	}
		
 });
 logResults(storyCheck,updatedLog);
 updatedLog = [];
}
