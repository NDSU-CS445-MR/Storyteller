angular.module('app').component('board',{
    templateUrl: '/public/board.html',
    controllerAs: 'vm',
    controller: boardController
});

function boardController ($timeout, firebaseConnection, $firebaseArray, $firebaseObject, $log) {
    firebaseConnection.log('test log')
    // vm is View Model (MVVM)
    var vm = this;
    
    vm.boardKey = firebaseConnection.sessionStore.currentBoardKey;
    vm.board = firebaseConnection.getBoardByKey(vm.boardKey);
    
    vm.storyStates = ['mvp', 'accepted', 'stretch', 'under-consideration', 'discarded'];
    vm.storyStatesDisplay = ['mvp', 'accepted', 'stretch', 'under-consideration'];
    
    vm.newStoryTemplate = {
        body: '',
        name: '',
        status: vm.storyStates[3],
        reset: function reset() {
            this.body = 'As a * I want * so that ';
            this.name = '';
            this.status = vm.storyStates[3];
        },
		jargonCheck: function jargonChecker(){
			var jarggg = this.body.split(" ");
			var jargonTerms = ['jargon','java','batch'];
			var counter = 0;
			var counter2 = 0;
			while(jarggg[counter] != null){
				while(jargonTerms[counter2] != null){
					if(jarggg[counter] == jargonTerms[counter2]){
						window.alert("Jargon detected!!");
				}
				counter2++;
			}
			counter++;
			counter2=0;
		}
	//window.alert(jargonTerms);
		},
		formatCheck: function formatChecker(){
			var cursorPosition = 0;
			var testStory = this.body;
			var myRe = /As a .*(\n)*.* I want .*(\n)*.* so that /g;
			if(testStory === ''){acceptedStory = 'As a * I want * so that ';}
			var formatted = myRe.test(testStory);
			if(formatted){acceptedStory = testStory;}
			else{
				cursorPosition = setCursor(this.body);
				this.body = acceptedStory;
				story.selectRange(cursorPosition);
			}
		},
        commit: function commitNewStory() {
            vm.board.child('stories').push({
                body: this.body,
                name: this.name,
                status: this.status
            });
        }
    };
    
    vm.stories = vm.board.child('stories');
    vm.stories.on('value', storiesReady);
    vm.stories = $firebaseArray(vm.stories);
    //Function that is executed when a new draggable element is placed in a droppable element
    var updateStoryState = function(event, ui){
        //get the parent zone element name i.e. "under consideration"
        var zone = $(this).attr('name')
        //get the user story id from the story element that was placed in the drop-zone
        var storyId = ui.draggable.attr("id");
        //retrieve corresponding firebase object
        var story = $firebaseObject(vm.board.child('stories').child(storyId));
        //update firebase object to reflect new status
        story.$loaded().then(function updateFirebaseStory(){
            vm.board.child('stories')
                .child(storyId)
                .update({
                    status: zone
                });
            
        });
        ui.draggable.css("left", 0);
        ui.draggable.css("top", 0);
    }

    
    // 
    vm.onClick_CreateStory = function createStory(){
        vm.newStoryTemplate.commit();
        vm.newStoryTemplate.reset();
    };
    
	function jargonChecker(story){
	var jarggg = story.value.split(" ");
	window.alert(jarggg);
	var jargonTerms = ['jargon','java','batch'];
	var counter = 0;
	var counter2 = 0;
	while(jarggg[counter] != null){
		while(jargonTerms[counter2] != null){
			if(jarggg[counter] == jargonTerms[counter2]){
				window.alert("Jargon detected!!");
			}
			counter2++;
		}
	counter++;
	counter2=0;
	}
	//window.alert(jargonTerms);
	}
	vm.onClick_Cancel = function Cancel()
	{
		vm.newStoryTemplate.jargonCheck();
		vm.newStoryTemplate.reset();
		disappear();
	}
	vm.onClick_NewStory = function NewStoryCreation(){
		vm.newStoryTemplate.reset();
		appear();
	}
	
	function appear(){
		//$("#modal-background").attr("style", "display:inline-block");
		$(".modal").attr("style", "display:inline-block");
	}
	
	function disappear(){
		$(".modal").attr("style", "display:none");
		//$("#modal-background").attr("style", "display:none");
	}
	
	vm.onkeyup_formatCheck = function FormatChecker(){
		vm.newStoryTemplate.formatCheck();
	}
		function setCursor(stText){
	var ctl = stText;
	if(ctl.selectionStart != null){var cursorPosition = ctl.selectionStart;}
	return cursorPosition;
	}
	$.fn.selectRange = function(start, end) {
    if(end === undefined) {
        end = start;
    }
    return this.each(function() {
        if('selectionStart' in this) {
            this.selectionStart = start;
            this.selectionEnd = end;
        } else if(this.setSelectionRange) {
            this.setSelectionRange(start, end);
        } else if(this.createTextRange) {
            var range = this.createTextRange();
            range.collapse(true);
            range.moveEnd('character', end);
            range.moveStart('character', start);
            range.select();
        }
    });
};
	
	
	
	
	
	
	
	
	
	
	
	
	
    vm.onChange_updateStory = function updateStory(story){
        vm.board.child('stories')
            .child(story.$id)
            .update({
                body: story.body || '',
                name: story.name || '',
                status: story.status
            });
    };
    // todo how do I get the name of the board
    //You have to asynchronously retrieve it from the Firebase object reference
    vm.temp = $firebaseObject(vm.board.child('name'));
    vm.temp.$loaded().then(function setBoardName(){
        vm.boardname = vm.temp.$value;
        $("#board_name").text(vm.boardname);
    });
    
    function storiesReady() {
        // applies droppable functionality to any UI element with the class "drop-zone"
        $( ".drop-zone" ).droppable({
            drop: updateStoryState
        });
        // applies draggable functionality to any UI element with the class "drag"
        $timeout(()=>{$(".drag" ).draggable()});
    }    
}

