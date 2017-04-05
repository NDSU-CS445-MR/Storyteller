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
            this.body = '';
            this.name = '';
            this.status = vm.storyStates[3];
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
        resetBoardEditFlag()
    };
    
    vm.onChange_updateStory = function updateStory(story){
        vm.board.child('stories')
            .child(story.$id)
            .update({
                body: story.body || '',
                name: story.name || '',
                status: story.status
            });
            resetBoardEditFlag();
    };
    // todo how do I get the name of the board
    //You have to asynchronously retrieve it from the Firebase object reference
    vm.temp = $firebaseObject(vm.board.child('name'));
    vm.temp.$loaded().then(function setBoardName(){
        vm.boardname = vm.temp.$value;
        $("#board_name").text(vm.boardname);
    });
    
    function resetBoardEditFlag(){
        vm.board.child('edited').child('jargon').set(true);
        vm.board.child('edited').child('duplicate').set(true);
    }

    function storiesReady() {
        // applies droppable functionality to any UI element with the class "drop-zone"
        $( ".drop-zone" ).droppable({
            drop: updateStoryState
        });
        // applies draggable functionality to any UI element with the class "drag"
        $timeout(()=>{$(".drag" ).draggable()});
    }    
}

