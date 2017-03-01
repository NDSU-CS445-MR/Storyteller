angular.module('app').component('board',{
	templateUrl: '/public/board.html',
    controllerAs: 'vm',
	controller: function(firebaseFactory,$firebaseArray) {
        var vm = this;
        vm.storyStates = ['accepted','stretch','under consideration', 'discarded'];
        vm.board = firebaseFactory.getBoard(firebaseFactory.sessionStore.currentBoardKey);
        vm.stories = $firebaseArray(vm.board.child('stories'));
        vm.onClick_CreateStory = function(){
           vm.board.child('stories').push(vm.newStory);
        };
        vm.onChange_updateStory = function(story){
            vm.board.child('stories').child(story.$id).update({body: story.body, name: story.name,status: story.status});
        };
        // todo how do I get the name of the board?
        vm.boardname = "boardname";
        // vm.onClick_ = function(index){
            
        // };
    }
});