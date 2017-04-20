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
    
    vm.storiesRef = vm.board.child('stories');
    vm.storiesRef.on('value', storiesReady);
    vm.stories = $firebaseArray(vm.storiesRef);
        
    vm.status = {
        /* addStory takes a firebase object, story,
           and appends the story to the end of list
           of stories belonging to status */
        addStory: function(story, status, cb) {
            // set story.status to status
            vm.status.priv.setStatus(story, status, function() {
                vm.status.priv.getStatusCount(status, function(count) {
                    // if the status was empty
                    if (count == 1) {
                        // set story.order to 1
                        vm.status.priv.setOrder(story, 1, function(){
                            // give _last to story
                            vm.status.priv.setLast(story, cb);
                        });
                    }
                    else {
                        vm.status.priv.getLast(status, function(last) {
                            // set story.order to _last.order + 1
                            vm.status.priv.setOrder(story, last.order + 1, function(){
                                // take _last
                                vm.status.priv.unsetLast(last, function() {
                                    // give _last to story
                                    vm.status.priv.setLast(story, cb);
                                });
                            });
                        });
                    }
                });
            });
        },
        /* removeStory takes a firebase object, story,
           and removes it from the list of stories
           belonging to status */
        removeStory: function(story, cb) {
            var status = story.status;
            var order = story.order;
            // decrement status.count
            // unset story.status
            // unset story.order
            vm.status.priv.unsetStatus(story, function() {
                vm.status.priv.getStatusCount(status, function(count) {
                    // if count == 0 (it's empty now)
                    if (count == 0) {
                        // take _last
                        vm.status.priv.unsetLast(story, cb);
                    }
                    // else if story is _last
                    else if (vm.status.priv.isLast(story)) {
                        // take _last
                        vm.status.priv.unsetLast(story, function() {
                            console.log("unsetLast")
                            // give _last to story.order - 1
                            vm.status.priv.getStoryByStatusOrder(status, order - 1, function(before) {
                                console.log("getStoryByStatusOrder")
                                vm.status.priv.setLast(before, cb);
                            });
                        });
                    }
                    // else
                    else {
                        // shift stories with .order > story.order to the left
                        vm.status.priv.shift(status, order, -1);
                        cb();
                    }
                });
            });
        },
        addStoryBeforeStory: function(storyToAdd, storyAfter, cb) {
            var status = storyAfter.status;
            var order = storyAfter.order;
            // shift right
            vm.status.priv.shift(status, order, 1);
            // insert story
            vm.status.priv.setStatus(storyToAdd, status, function() {
                vm.status.priv.setOrder(storyToAdd, order, cb);
            });
        },
        addStoryAfterStory: function(storyToAdd, storyBefore) {
            var status = storyAfter.status;
            var order = storyAfter.order + 1;
            if (vm.status.priv.isLast(storyBefore)) {
                vm.status.addStory(storyToAdd, status);
            }
            else {
                // shift right
                vm.status.priv.shift(status, order, 1);
                // insert story
                vm.status.priv.setStatus(storyToAdd, status, function() {
                    vm.status.priv.setOrder(storyToAdd, order, cb);
                });
            }
        },
        getDefaultStatus: function(cb) {
            vm.board.child('acceptanceStatuses')
            .orderByChild('order')
            .limitToLast(1)
            .once('child_added', function(snapshot)
                { cb(snapshot)} );
        },
        /* internal functions for addStory and removeStory */
        priv: {
            storiesRef: vm.board.child('stories'),
            snapshotToFirebaseObject: function(snapshot, cb) {
                var obj = $firebaseObject(vm.status.priv.storiesRef.child(snapshot.key));
                obj.$loaded().then(function() { cb(obj); });
            },
            updateStory: function(story, params, cb) {
                vm.status.priv.storiesRef
                    .child(story.$id)
                    .update(params)
                    .then(cb);
            },
            acceptanceRef: vm.board.child('acceptanceStatuses'),
            updateAcceptance: function(status, params, cb) {
                vm.status.priv.acceptanceRef
                    .child(status)
                    .update(params)
                    .then(cb);
            },
            getFbStatus: function(status, cb) {
                var statusObj = $firebaseObject(vm.board.child('acceptanceStatuses').child(status));
                statusObj.$loaded().then(function() { cb(statusObj)} );
            },
            incrementStatus: function(status, cb) {
                vm.status.priv.getFbStatus(status, function(statusObj) {
                    vm.status.priv.updateAcceptance(
                        status,
                        { count: statusObj.count + 1 },
                        cb);
                });
            },
            decrementStatus: function(status, cb) {
                vm.status.priv.getFbStatus(status, function(statusObj) {
                    vm.status.priv.updateAcceptance(
                        status,
                        { count: statusObj.count - 1 },
                        cb);
                });
            },
            getStatusCount: function(status, cb) {
                vm.status.priv.getFbStatus(status, function(statusObj) {
                    cb(statusObj.count);
                });
            },
            setStatus: function(story, status, cb) {
                var intent = function() { vm.status.priv.setStatusUnsafe(story, status, cb); };
                //if (story.status != null) {
                //    vm.status.priv.unsetStatus(story, intent);
                //}
                //else {
                    intent();
                //}
            },
            setStatusUnsafe: function(story, status, cb) {
                vm.status.priv.updateStory(
                    story,
                    { status: status },
                    function() {
                        vm.status.priv.incrementStatus(status, cb);
                    });
            },
            unsetStatus: function(story, cb) {
                var status = story.status;
                vm.status.priv.updateStory(
                    story,
                    {
                        status: null,
                        order: null,
                        status_order_index: null
                    },
                    function() {
                        vm.status.priv.decrementStatus(status, cb);
                    });
            },
            getStoryByStatusOrder: function(status, order, cb) {
                vm.storiesRef.orderByChild('status_order_index')
                    .equalTo(status + "_" + order)
                    .once('child_added', function(last){ 
                        vm.status.priv.snapshotToFirebaseObject(last, cb);
                    });
            },
            setOrder: function(story, order, cb) {
                vm.status.priv.updateStory(
                    story,
                    {
                        order: order,
                        status_order_index: story.status + "_" + order
                    },
                    cb);
            },
            isLast: function(story) {
                return !!story.status_last_index;
            },
            getLast: function(status, cb) {
                vm.storiesRef.orderByChild('status_last_index')
                    .equalTo(status)
                    .once('child_added', function(last) {
                        vm.status.priv.snapshotToFirebaseObject(last, cb);
                    });
            },
            setLast: function(story, cb) {
                if (story.status == null) {
                    // todo make this exception definition conform to error standards
                    throw {
                        name: "Unset Status Exception",
                        message: "A story cannot be set as last if it does not belong to a status"
                    }
                }
                vm.status.priv.updateStory(
                    story,
                    { status_last_index: story.status },
                    cb);
            },
            unsetLast: function(story, cb) {
                vm.status.priv.updateStory(
                    story,
                    { status_last_index: null },
                    cb);
            },
            shift: function(status, lowestOrder, increment) {
                // todo fix 'on' 'child_added'
                //  as it currently continues to listen for additions to this
                //  group and modifying them
                vm.status.priv.storiesRef
                    .orderByChild('status_order_index')
                    .startAt(status + "_" + lowestOrder)
                    .endAt(status + "_99999")
                    .once('value', function(snapshot) {
                        snapshot.forEach(function(story) {
                            vm.status.priv.snapshotToFirebaseObject(story, function(obj) {
                                vm.status.priv.setOrder(obj, obj.order + increment);
                            });
                        });
                    });
            },
            insertStoryAtOrderUnsafe: function(storyToAdd, status, order, cb) {
                // shift right
                vm.status.priv.shift(status, order, 1);
                // insert story
                vm.status.priv.setStatus(storyToAdd, status, function() {
                    vm.status.priv.setOrder(storyToAdd, order, cb);
                });
            }
        }
    }
        
    vm.gridRendering = {
        getStoryById: function(storyId, cb) {
            var story = $firebaseObject(vm.board.child('stories').child(storyId));
            story.$loaded().then(function(){ cb(story); });
        },
        acceptanceReady: function() {
            var colors = ['#FAA', '#FFA', '#FAF', '#AFA', '#AFF', '#AAF']
            // applies droppable functionality to any UI element with the class "drop-zone"
            $timeout(()=>{
                $( ".drop-zone" ).droppable({
                    drop: vm.gridRendering.draggableDropOnZone
                });
                // apply color to each zone
                $( ".drop-zone" ).each(function(index) {
                    var color;
                    if (colors.length > 0)
                        color = colors.shift(0);
                    else
                        color = "#" + Math.floor(Math.random() * Math.pow(2, 23)).toString(16);
                    $(this)[0].style.setProperty('--theme-color', color);
                });
            });
        },
        draggableDropOnZone: function(event, ui){
            // get the acceptance status to move to
            var zone = $(this).attr('name')
            // get the user story id (unique identifier from firebase)
            var storyId = ui.draggable.attr("id");
            // get the corresponding firebase object for the dropped user story
            vm.gridRendering.getStoryById(storyId, function(story) {
                vm.status.removeStory(story, function() {
                    vm.status.addStory(story, zone);
                });
            });
        },
        dropOnStory: function(event, ui) {
            var droppedOn = $(this);
            var catchingStoryId = droppedOn.parent().attr('id');
            var sendingStoryId = ui.draggable.attr('id');
            
        }
    }
    
    vm.acceptanceStatusesRef = vm.board.child('acceptanceStatuses');
    vm.acceptanceStatusesRef.on('value', vm.gridRendering.acceptanceReady);
    vm.acceptanceStatuses = $firebaseArray(vm.acceptanceStatusesRef);
    
    // default default story
    vm.defaultStory = {
        body: 'As a I want so that ',
        name: '',
        status: null
    }
    
    // get last status from firebase and set default to it
    vm.status.getDefaultStatus(function(obj) {
        vm.defaultStory.status = obj.key;
    });
    
    
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
        body: null,
        name: null,
        status: null,
        bodySnapshot: null,
        reset: function reset() {
            this.body = vm.defaultStory.body;
            this.name = vm.defaultStory.name;
            this.status = vm.defaultStory.status;
            this.bodySnapshot = vm.defaultStory.body;
        },
        commit: function commitNewStory() {
            var newPostRef = vm.board.child('stories').push({
                body: this.body,
                name: this.name,
            });
            var storyObj = $firebaseObject(newPostRef);
            vm.status.addStory(storyObj, this.status);
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
    
    function storiesReady() {
        /*
        var storiesOrderRef = vm.storiesRef.orderByChild('order').equalTo(null);
        storiesOrderRef.on('value', function(stories) {
            stories.forEach(function(story) {
            });
        });
        */
        // applies draggable functionality to any UI element with the class "drag"
        $timeout(()=>{
            $('.drag').draggable({revert:true});
            $('.notecard_brief').dblclick(notecardBriefDoubleClick);
            $( ".drop-zone-notecard" ).droppable({
                drop: vm.gridRendering.dropOnStory
            });
        });
    }    
    
}