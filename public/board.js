angular.module('app').component('board',{
    templateUrl: '/public/board.html',
    controllerAs: 'vm',
    controller: boardController
});

function boardController ($timeout, firebaseFactory, $firebaseArray, $firebaseObject, $log) {
    // vm is View Model (MVVM)
    var vm = this;
    vm.board = firebaseFactory.getBoard(firebaseFactory.sessionStore.currentBoardKey);
    
    vm.storyStates = ['mvp', 'accepted', 'stretch', 'under consideration', 'discarded'];
    vm.newStoryTemplate = {
        body: '',
        name: '',
        status: vm.storyStates[3],
        reset: function reset() {
            this.body = '';
            this.name = '';
            this.status = vm.storyStates[3];
        },
        getNewStory: function getNewStory() {
            return {
                body: this.body,
                name: this.name,
                status: this.status
            }
        }
    };
    
    vm.stories = vm.board.child('stories');
    vm.stories.on('value', applyDraggableToAllStories);
    vm.stories = $firebaseArray(vm.stories);
    //Function that is executed when a new draggable element is placed in a droppable element
    var updateStoryState = function(event, ui){
        console.log("dropping");
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
    
    vm.onClick_CreateStory = function createStory(){
        vm.board.child('stories').push(vm.newStoryTemplate.getNewStory());
        vm.newStoryTemplate.reset();
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
    
    function applyDraggableToAllStories() {
        //applies droppable functionality to any UI element with the class "drop-zone"
        $( ".drop-zone" ).droppable({
            drop: updateStoryState
        });
        //applies draggable functionality to any UI element with the class "drag"
        $timeout(()=>{$(".drag" ).draggable()});
    }    
}

