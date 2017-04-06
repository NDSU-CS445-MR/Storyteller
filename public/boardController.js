angular.module('app').component('board',{
    templateUrl: '/public/board.html',
    controllerAs: 'vm',
    controller: boardController
});

function boardController ($timeout, $compile, $scope, firebaseConnection, $firebaseArray, $firebaseObject, $log, storyValidationClient) {
    // vm is View Model (MVVM)
    var vm = this;
    
    vm.boardKey = firebaseConnection.sessionStore.currentBoardKey;
    vm.board = firebaseConnection.getBoardByKey(vm.boardKey);
    
    /* fill in the name of board in the navbar */
    vm.temp = $firebaseObject(vm.board.child('name'));
    vm.temp.$loaded().then(function setBoardName(){
        vm.boardname = vm.temp.$value;
        $("#board_name").text(vm.boardname);
    });
    
    /* inject new story button to navbar */
    var injected_nav_item = $("<li><a>New Story</a></li>");
    injected_nav_item.attr('ng-click', 'vm.activateNewStoryCard();');
    $(".navbar-nav").append(injected_nav_item);
    $compile($(".navbar-nav"))($scope);
    
    vm.storyStates = ['mvp', 'accepted', 'stretch', 'under-consideration', 'discarded'];
    vm.storyStatesDisplay = ['mvp', 'accepted', 'stretch', 'under-consideration'];
    
    vm.stories = vm.board.child('stories');
    vm.stories.on('value', storiesReady);
    vm.stories = $firebaseArray(vm.stories);

    vm.defaultStory = {
        body: 'As a I want so that ',
        name: '',
        status: vm.storyStates[3]
    }
    
    vm.activeStory = {
        name: '',
        body: '',
        bindToStoryById: function(storyId) {
            
        },
        onNameChange: function() {
            fbObject.name = this.name;
        },
        onBodyChange: function() {
            
        },
        onStatusChange: function() {
            
        },
        startEditing: function() {
            $('#active_story_screen').show();
        },
        stopEditing: function() {
            $('#active_story_screen').hide();
        }
    }
    
    vm.newStoryTemplate = {
        body: vm.defaultStory.body,
        name: vm.defaultStory.name,
        status: vm.defaultStory.status,
        reset: function reset() {
            this.body = vm.defaultStory.body;
            this.name = vm.defaultStory.name;
            this.status = vm.defaultStory.status;
        },
        commit: function commitNewStory() {
            vm.board.child('stories').push({
                body: this.body,
                name: this.name,
                status: this.status
            });
        },
        bodySnapshot: vm.defaultStory.body,
        changed: function changed() {
            var analysis = storyValidationClient.validStoryFormat(this.body);
            if (!analysis.pass) {
                var newStoryTextArea = $('#newStoryBody');
                var selectStart = newStoryTextArea.prop('selectionStart');
                if (this.body.length > this.bodySnapshot.length) { // user inserted character to break formatting
                    selectStart -= 1;
                } else { // user removed character to break formatting
                    selectStart += 1;
                }
                this.body = this.bodySnapshot;
                // setTimeout is necessary because the above statement is not finished once it returns
                setTimeout(function() { newStoryTextArea[0].setSelectionRange(selectStart, selectStart); }, 50);
            } else {
                this.bodySnapshot = this.body;
            }
        }
    };
    
    vm.activateNewStoryCard = function activateNewStoryCard(){
        vm.newStoryTemplate.reset();
        $("#new_story_screen").show();
    }
    vm.cancelNewStoryModal = function cancelNewStoryModal() {
        vm.newStoryTemplate.reset();
        $("#new_story_screen").hide();
    }
    vm.commitNewStory = function commitNewStory() {
        vm.newStoryTemplate.commit();
        vm.newStoryTemplate.reset();
        flagBoardForAnalysis();
    };
    
    vm.storyTitleChanged = function storyTitleChanged(story) {
        vm.board.child('stories')
            .child(story.$id)
            .update({
                name: story.name || ''
            });
    }
    
    vm.storyBodyChanged = function storyBodyChanged(story) {
        flagBoardForAnalysis();
        var analysis = storyValidationClient.validStoryFormat(story.body);
        
        if (analysis.pass) {
            vm.board.child('stories')
                .child(story.$id)
                .update({
                    body: story.body || '',
                });
        } else {
            var vm_story = vm.board.child('stories')
                .child(story.$id);
                
            var vm_story = $firebaseObject(vm.board.child('stories').child(story.$id).child('body'));
            
            vm_story.$loaded().then(function snapshotLoaded() {
                var snapshot = vm_story.$value;
                var textArea = $("#" + story.$id).find("textarea.story_body_textarea");
                var selectStart = textArea.prop('selectionStart');
                if (story.body.length > snapshot.length) { // user inserted character to break formatting
                    selectStart -= 1;
                } else { // user removed character to break formatting
                    selectStart += 1;
                }
                story.body = snapshot;
                // setTimeout is necessary because the above statement is not finished once it returns
                setTimeout(function() { textArea[0].setSelectionRange(selectStart, selectStart); }, 50);
            });
        }
    }
       
    
    
    function flagBoardForAnalysis() {
        vm.board.child('edited').child('duplicate').set(true);
        vm.board.child('edited').child('jargon').set(true);
    }
    
    function notecardBriefDoubleClick() {
        
        var brief = $(this);
        var storyId = $(this).attr('id');
        
        vm.activeStory.bindToStoryById(storyId);
        vm.activeStory.startEditing();
        
    }
    
    /* dragging functionality */
    function storiesReady() {
        // applies droppable functionality to any UI element with the class "drop-zone"
        $( ".drop-zone" ).droppable({
            drop: draggableDropOnZone
        });
        // applies draggable functionality to any UI element with the class "drag"
        $timeout(()=>{
            $('.drag').draggable();
            $('.notecard_brief').dblclick(notecardBriefDoubleClick);
        });
    }    
    
    // when a story is dropped on a drop zone, change its acceptance state and fix positioning
    var draggableDropOnZone = function(event, ui){
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
    
    /* scary place where story rows and sorting happens */
}