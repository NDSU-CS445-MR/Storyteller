angular.module('app').component('board',{
    templateUrl: '/public/board.html',
    controllerAs: 'vm',
    controller: boardController
});

function boardController (
    firebaseConnection,
    $firebaseObject,
    $firebaseArray,
    $timeout,
    $scope,
    $log,
    $compile,
    storyValidationClient
  ) {
    // vm is View Model (MVVM)
    var vm = this;
    
    vm.boardKey = firebaseConnection.sessionStore.currentBoardKey;
    vm.board = firebaseConnection.getBoardByKey(vm.boardKey);
    
    /* fill in the name of board in the navbar */
    vm.boardName = $firebaseObject(vm.board.child('name'));
    vm.boardName.$loaded().then(function setBoardName(){
        vm.location = vm.boardName.$value;
        //$("#board_name").text(vm.boardname);
    });
    
    /* get the number of columns used to create this board */
    vm.numColumns = $firebaseObject(vm.board.child('columns'));
    vm.numColumns.$loaded().then(function setColumnCount() {
        $(document).ready(function() {
            document.body.style.setProperty('--num-columns', vm.numColumns.$value);
        });
    });
    
    vm.injectNav = function() {
        var target = $(".navbar-nav");
        
        /* inject new story button to navbar */
        var injected_nav_item_new_story = $("<li><a>New Story!</a></li>");
        injected_nav_item_new_story.attr('ng-click', 'vm.newStoryModal.open();');
        target.append(injected_nav_item_new_story);
        
        /* inject new category button to navbar */
        var injected_nav_item_category = $("<li><a>New Category</a></li>");
        injected_nav_item_category.attr('ng-click', 'vm.activateNewCategory();');
        target.append(injected_nav_item_category);
        
        /* inject undo button to navbar */
        var injected_nav_item_undo = $("<li><a>Undo</a></li>");
        injected_nav_item_undo.attr('ng-click', 'vm.history.undo();');
        target.append(injected_nav_item_undo);
		
		/* var injected_nav_item_filterDropdown =  */
		var injected_nav_item_filterButton = $("<li><a>Filter by Role:</a></li>");
		
		target.append(injected_nav_item_filterButton);
        
        $compile(target)($scope);
    };
    
    // todo move storiesRef and stories into storyEngine
    vm.storiesRef = vm.board.child('stories');
    vm.storiesRef.on('value', storiesReady);
    vm.stories = $firebaseArray(vm.storiesRef);
    
    vm.storyEngine = {
        storiesRef: vm.storiesRef,
        stories: vm.stories,
        getStoryById: function(storyId, cb) {
            var story = $firebaseObject(vm.board.child('stories').child(storyId));
            story.$loaded().then(function(){ cb(story); });
        }
    }
    
    vm.statusEngine = {
        statusesRef: null,
        statuses: null,
        initialize: function() {
            vm.statusEngine.statusesRef = vm.board.child('statuses');
            vm.statusEngine.statusesRef.on('value', vm.statusEngine.events.fbStatusesReady);
            vm.statusEngine.statuses = $firebaseArray(vm.statusEngine.statusesRef);
        },
        getStatus: function(name, cb) {
            vm.statusEngine.statusesRef
                .orderByChild('name')
                .once('child_added', function(snap) {
                    var obj = $firebaseObject(snap);
                    obj.$loaded().then(function(){ cb(obj); });
                });
        },
        removeStoryFromStatus: function(story, cb) {
            var gridIntent = function() {
                vm.gridEngine.onStoryRemove(story, cb);
            };
            
            // unset status
            story.status = null;
            // save and pass to gridding
            story.$save().then(gridIntent);
        },
        addStoryToStatus: function(story, statusName, offset, cb) {
            var gridIntent = function() {
                vm.gridEngine.onStoryAdd(story, offset, cb);
            };
            
            // set status
            story.status = statusName;
            // save and pass to gridding
            story.$save().then(gridIntent);
        },
        discardStory: function(story, cb) {
            var intent = function() {
                story.status = "discarded";
                story.$save().then(cb);
            };
            
            if (story.status)
                vm.statusEngine.removeStoryFromStatus(story, intent);
            else
                intent();
        },
        addStatus: function(name, order, color) {
            vm.statusEngine.statuses.$add({
                name,
                order,
            });
        },
        removeStatus: function(name) {
            // migrate user stories
            // forEach story
                // remove status
                // add status 'under consideration'
                // gridEngine.onStoryAdd
            // shift statuses with order > current downwards
            // nullify status
            console.error("not implemented");
        },
        events: {
            fbStatusesReady: function() {
                var colors = ['#FAA', '#FFA', '#FAF', '#AFA', '#AFF', '#AAF']
                // applies droppable functionality to any UI element with the class "drop-zone"
                $timeout(()=>{
                    $( ".drop-zone" ).droppable({
                        drop: vm.dragEngine.draggableDropOnZone
                    });
                    // apply color to each zone
                    $( ".drop-zone-bound" ).each(function(index) {
                        var styleTarget = $(this);
                        vm.statusEngine
                            .statusesRef
                            .child(styleTarget.attr('name'))
                            .once('value', function(snap) {
                                styleTarget[0].style.setProperty('--theme-color', snap.child('color').val());
                            });
                    });
                });
            }
        }
    }
        
    vm.gridEngine = {
        onStoryRemove: function(story, cb) {
            // unset row, col, status_row_col_index
            story.row = null;
            story.col = null;
            story.status_row_col_index = null;
            story.$save().then(cb);
        },
        onStoryAdd: function(story, offset, cb) {
            // if x, y data is missing, append story to status
            if (offset == null || offset.x == null || offset.y == null) {
                vm.storyEngine.storiesRef
                    .orderByChild('status_row_col_index')
                    .startAt(story.status)
                    .endAt(story.status + '_999_999')
                    .limitToLast(1)
                    .once('child_added', function(snap_last) {
                        if (snap_last.col < vm.numColumns.$value)
                            vm.gridEngine.setAttributes(story, snap_list.row, snap_list.col + 1, cb);
                        else
                            vm.gridEngine.setAttributes(story, snap_list.row + 1, 1, cb);
                    });
            // else, find the correct grid position to put the story
            } else {
                // todo
                var measure = $('div.drop-zone div.drop-grid').first();
                var rowHeight = measure.css('grid-auto-rows');
                rowHeight = parseInt(rowHeight.substring(0, rowHeight.indexOf('px')));
                var colWidth = measure.css('grid-template-columns');
                colWidth = parseInt(colWidth.substring(0, colWidth.indexOf('px')));
                var row = Math.floor(offset.y / rowHeight) + 1;
                var col = Math.floor(offset.x / colWidth) + 1;
                // console.log('dropped at ' + offset.x + ' / ' + offset.y);
                // console.log('grid settings: ' + rowHeight + ' / ' + colWidth);
                // console.log('detected row ' + row + ' col ' + col);
                
                // todo check for conflict
                
                vm.gridEngine.setAttributes(story, row, col, cb);
            }
            
        },
        setAttributes: function(story, row, col, cb) {
            var padding = "000";
            story.row = row;
            story.col = col;
            story.status_row_col_index =
                story.status + '_'
              + (padding + row).substring(row.toString().length) + "_"
              + (padding + col).substring( col.toString().length);
            story.$save().then(cb);
        },
    }
    
    
    
    vm.dragEngine = {
        draggableDropOnZone: function(event, ui){
            var position = ui.draggable.position();
            var position_drop = $(this).find('div.drop-grid').position();
            var width = ui.draggable.width();
            var height = ui.draggable.height();
            // get the acceptance status to move to
            var status = $(this).find('h1').text();
            // get the user story id (unique identifier from firebase)
            var storyId = ui.draggable.attr("id");
            // get the corresponding firebase object for the dropped user story
            vm.storyEngine.getStoryById(storyId, function(story) {
                vm.statusEngine.removeStoryFromStatus(story, function() {
                    if (status == 'discarded') {
                        vm.statusEngine.discardStory(story, function() {});
                    } else {
                        vm.statusEngine.addStoryToStatus(
                            story,
                            status,
                            {
                                x: position.left - position_drop.left + width / 2,
                                y: position.top - position_drop.top + height / 2
                            });
                    }
                });
            });
        },
    }
    
    vm.statusEngine.initialize();
    
    vm.rolePattern = /As a (\w+)\s+I want/;
    
    vm.history = {
        undo: function() {
            console.error("not implemented");
        }
    }
    
    // default default story
    vm.defaultStory = {
        body: 'As a I want so that ',
        name: '',
        status: 'under consideration'
    }
    
    
    vm.activeStory = {
        story: {},
        name: '',
        body: '',
        bindToStoryById: function(story){
            vm.activeStory.story = story;
        },
        onNameChange: function() {
            story.name = vm.activeStory.story.name;
        },
        takeOut: function takeOutEdit() {
            vm.board.child('stories').pull(story)
        },
        onBodyChange: function() {
            story.body = vm.activeStory.story.body;
        },
        onStatusChange: function() {
            story.status = vm.activeStory.story.status;
        },
        startEditing: function() {
            $('#active_story_screen').show();
        },
        stopEditing: function() {
            $('#active_story_screen').hide();
        }
    }
    
    vm.roleEngine = {
        roleRef: vm.board.child("roles"),
        
        onRemoveStory: function onRemoveStory(role) {
            vm.roleEngine.roleRef
                .child(role)
                .once("value", function(snapshot){
                    var count = snapshot.val();
                    
                    if (count == 1) {
                        vm.roleEngine.roleRef
                            .child(role)
                            .remove();
                    }
                    else 
                    { 
                        vm.roleEngine.roleRef
                            .set({
                                [role]: count-1
                            });
                    }
                });          
        },
        
        onAddStory: function onAddStory(role) {
            vm.roleEngine.roleRef
                .child(role)
                .once("value", function(snapshot){
                    console.log(snapshot.val());
                    if (snapshot.val() == null) { // if it doesn't have an entry yet
                        vm.roleEngine.roleRef.set({
                            [role]: 1
                        });
                    } else { // if it already has an entry
                        vm.roleEngine.roleRef.set({
                            [role]: snapshot.val() + 1
                        });
                    }
                });
        },
    };
    
    vm.newStoryTemplate = {
        body: null,
        name: null,
        status: null,
        bodySnapshot: null,
        reset: function reset() {
            vm.newStoryTemplate.body = vm.defaultStory.body;
            vm.newStoryTemplate.name = vm.defaultStory.name;
            vm.newStoryTemplate.status = vm.defaultStory.status;
            vm.newStoryTemplate.bodySnapshot = vm.defaultStory.body;
        },
        commit: function commitNewStory() {
            // todo delegate to storyEngine
            flagBoardForAnalysis();
            
            
            
            var newPostRef = vm.board.child('stories').push({
                body: vm.newStoryTemplate.body,
                name: vm.newStoryTemplate.name,
                role: vm.newStoryTemplate.role,
            });
            vm.roleEngine.onAddStory(vm.newStoryTemplate.role);
            var storyObj = $firebaseObject(newPostRef);
            storyObj.$loaded().then(function() {
                vm.statusEngine.addStoryToStatus(storyObj, vm.newStoryTemplate.status);
                vm.newStoryTemplate.reset();
            });
        },
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
                var myArray = this.body.match(vm.rolePattern);
                
                this.role = myArray[1];
                this.bodySnapshot = this.body;
            }
        }
    };
    
    vm.newStoryModal = {
        open: function() {
            vm.newStoryTemplate.reset();
            $("#new_story_screen").show();
        },
        save: function() {
            vm.newStoryTemplate.commit();
        },
        saveAndClose: function() {
            vm.newStoryModal.save();
            vm.newStoryModal.close();
        },
        close: function() {
            $("#new_story_screen").hide();
        }
    }
    
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
                
        var myArray = story.body.match(vm.rolePattern);
        var vm_story = $firebaseObject(vm.board.child('stories').child(story.$id));
        vm_story.$loaded().then(function snapshotLoaded() {
            if (analysis.pass) {
                
				var update = {
                    body: story.body || '',
                };
                var oldRole = vm_story.role;
                if (oldRole != myArray[1]) {                    
                    vm.roleEngine.onRemoveStory(oldRole);
                    vm.roleEngine.onAddStory(myArray[1]);
                    update["role"] = myArray[1];
                }
                vm.board.child('stories')
                    .child(story.$id)
                    .update(update);
            } else {
                
                
                var textArea = $("#" + story.$id).find("textarea.story_body_textarea");
                var selectStart = textArea.prop('selectionStart');
                if (story.body.length > vm_story.body.length) { // user inserted character to break formatting
                    selectStart -= 1;
                } else { // user removed character to break formatting
                    selectStart += 1;
                }
                story.body = vm_story.body;
                // setTimeout is necessary because the above statement is not finished once it returns
                setTimeout(function() { textArea[0].setSelectionRange(selectStart, selectStart); }, 50);
            }
        });
    }
       
    
    
    function flagBoardForAnalysis() {
        vm.board.child('edited').child('duplicate').set(true);
        vm.board.child('edited').child('jargon').set(true);
    }
    
    vm.onDoubleClick = function(story) {
        vm.activeStory.bindToStoryById(story);
        vm.activeStory.startEditing();
        
    }
    
    // todo move to storyEngine
    function storiesReady() {
        // applies draggable functionality to any UI element with the class "drag"
        $timeout(()=>{
            $('.drag').draggable({
                revert: true,
                cursorAt: { left: 50, top: 50 }
            });
        });
    }    
    
    vm.activateNewCategory = function activateNewCategory() {
        console.error("not implemented");
    }
    
}
