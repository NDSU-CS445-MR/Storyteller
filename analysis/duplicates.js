var firebase = require('firebase');
var firebaseStoriesRef;
var firebaseBoardRef;
var isEdited = true;
var isActive = false;
var storiesCache = [];


process.on('message', function(message) {
	switch(message.head){
		case 'initialize':{
			console.log('[duplicate] Recieved message: ',message.data);
			firebaseBoardRef = firebase.initializeApp(message.data).database().ref().child('boards').child('-KdwTvkimpR2Rq9YB38L');
			firebaseStoriesRef = firebaseBoardRef.child('stories');
		    beginAnalysis();
		}
		case 'disconnect':{
			process.disconnect();
		}
	}
});

var beginAnalysis = function(){
	firebaseBoardRef.child('edited').on('value',function(snap){
		if(!isActive && snap.val()){
			isActive = true;
			firebaseBoardRef.child('edited').child('duplicate').set(false);
			firebaseStoriesRef.once('value',function(stories){
			stories.forEach(function(story){
			var tempStory = {
				id: story.key,
				data: story.val()
			};
			storiesCache.push(tempStory);
			findDuplicates(tempStory);
			});
			storiesCache.forEach(function(story){
				findDuplicates(story)
			});
			isActive = false;
		});
		}
	});
	
}

var logResults = function(story,updatedLog){
	var currentLog =[];
	//populate currentLog
	firebaseStoriesRef.child('analysisLog').child('duplicates').once('value',function(snap){
		snap.forEach(function(log){
			currentLog.push(log);
		});
	});
	//add new remote flags for discovered duplicates
	updatedLog.forEach(function(element) {
		var tempLog = [];
		var pushTemp = true;
			firebaseStoriesRef.child(element.story).child('analysisLog').child('duplicates').once('value',function(snap){
				snap.forEach(function(log){
					tempLog.push(log)
				});
				tempLog.findIndex(function(log,i){
					if(log.story == story.id && log.isRemoteDuplicate){
						pushTemp = false;
					}
				});
				if(pushTemp){
					var remoteStory = {
						story: story.id,
						details: element.details,
						isRemoteDuplicate: true
					};
					firebaseStoriesRef.child(element.story).child('analysisLog').child('duplicates').push(remoteStory);
				}
			});
	});
	//remove obsolete remote flags
	updatedLog.forEach(function(element) {
		currentLog.findIndex(function(log,i){
			if(element.id == log.id && !log.isRemoteDuplicate){
				currentLog.slice(i,i+1);
			}
		});
	});
	currentLog.forEach(function(element){
		var tempLog = [];
		var pushTemp = true;
			firebaseStoriesRef.child(element.story).child('analysisLog').child('duplicates').once('value',function(snap){
				snap.forEach(function(log){
					var newLog = {
						id: log.key(),
						data: log.val()
					};
					tempLog.push(newLog);
				});
			});
			tempLog.findIndex(function(log,i){
				if(log.data.story == story.id && log.data.isRemoteDuplicate){
					firebaseStoriesRef.child(element.story).child('analysisLog').child('duplicates').child(log.id).remove()
				}
			});	
	});
	//Update the old duplicates log
	firebaseStoriesRef.child(story.id).child('analysisLog').child('duplicates').remove();
	updatedLog.forEach(function(element){
		firebaseStoriesRef.child(story.id).child('analysisLog').child('duplicates').push(element);
	});
}

var findDuplicates = function(storyCheck) {
	console.log(storyCheck);
  //created or edited story
  //Story body
  //storyCheck = "As a Customer I want The system to utilize a web server So that Users get a web-based experience"; 
  var storyCheckBody = storyCheck.data.body;
  storyCheckBody= storyCheckBody.toLowerCase(); //converting to lowercase for comparison
  //Trimming required words, punctuation, and articles
  storyCheckBody = storyCheckBody.replace(/as a /g, ''); 
  storyCheckBody = storyCheckBody.replace(/i want/g, '');
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
		if(storyCheck.id != comparedStory.id){
		//var done = false; //changes to true after analysis
		var counter = 0; //increments for each duplicate 

		//var comparedStoryBody = "As a Customer I want The system to utilize a web server So that Users get a web-based experience"; //User Story being compared to
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
		console.log('hit1');
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

		if (counter /(storyArray.length) *100 >= 85 ) //Strong duplicate calculation
		{	
      //Assign flag to data object
			// console.log('[duplicate] Strong duplicate detected between', storyCheck.id, " and ", comparedStory.id);
			// console.log('DETAILS: ',comparedStoryBody,storyCheckBody,counter,storyArray.length);
			var newLog = {
				story: comparedStory.id,
				details: 'strong duplicate detected',
				isRemoteDuplicate: false

			};
			updatedLog.push(newLog);
		}
		else if (counter /(storyArray.length) *100 >= 60) //Potential duplicate calculation
		{
      //Assign flag to data object
			// console.log('[duplicate] Potential duplicate detected between', storyCheck.id, ' and ',comparedStory.id);
			// console.log('DETAILS: ',comparedStoryBody,storyCheckBody);
			var newLog = {
				story: comparedStory.id,
				details: 'possible duplicate detected',
			};
			updatedLog.push(newLog);
		}
		}
		// else
		 console.log('[duplicate] no duplicate detected');
		// }
		}
		
	//done = true; //ends while loops
	
 });
 logResults(storyCheck,updatedLog);
}
