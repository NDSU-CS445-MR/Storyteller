angular.module('app').component('board',{
	templateUrl: '/public/board.html',
    controllerAs: 'vm',
	controller: function($timeout,firebaseFactory,$firebaseArray,$firebaseObject,$log) {
        var vm = this;
        vm.storyStates = ['accepted','stretch','under consideration', 'discarded'];
        vm.newStory = {};
	vm.newStory.status = vm.storyStates[0];
	vm.board = firebaseFactory.getBoard(firebaseFactory.sessionStore.currentBoardKey);
        vm.stories = vm.board.child('stories');
        vm.stories.on('value',function(){
                //applies droppable functionality to any UI element with the class "drop-zone"
                $( ".drag-zone" ).droppable({
                        drop: updateStoryState
                });
                //applies draggable functionality to any UI element with the class "drag"
                $timeout(()=>{$(".drag" ).draggable({grid:[358,208]});});
        });
        vm.stories = $firebaseArray(vm.stories);
        //Function that is executed when a new draggable element is placed in a droppable element
        var updateStoryState = function(event,ui){
                //get the parent element name i.e. "under consideration"
                var zone = $(this).attr('name')
                //get the user story id from the story element that was placed in the drop-zone
                var storyId = ui.draggable.attr("id");
                //retreive corresponding firebase object
                var story = $firebaseObject(vm.board.child('stories').child(storyId));
                //update firebase object to reflect new status
                story.$loaded().then(function(){
                vm.board.child('stories').child(storyId).update({body: !(story.body) ?'':story.body, name: !(story.name) ? '':story.name,status: zone});
                });
        }
        vm.onClick_CreateStory = function(){
           vm.board.child('stories').push(vm.newStory);
           vm.newStory = {status:vm.storyStates[0]};
        };
        vm.onChange_updateStory = function(story){
           vm.board.child('stories').child(story.$id).update({body: !(story.body) ?'':story.body, name: !(story.name) ? '':story.name,status: story.status});
        };
        // todo how do I get the name of the board
	//You have to asynchronously retrieve it from the Firebase object reference
        vm.temp = $firebaseObject(vm.board.child('name'));
	vm.temp.$loaded().then(function(){
            vm.boardname = vm.temp.$value;
            $log.log(vm.boardname);
	});
    }
});
